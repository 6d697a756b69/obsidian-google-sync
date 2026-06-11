import { DateTime } from "luxon";
import { GoogleCalendarClient } from "../google/calendar";
import { GoogleTasksClient } from "../google/tasks";
import { GoogleApiError } from "../google/api";
import { GoogleSyncSettings } from "../settings-data";
import { VaultPort } from "../vault/port";
import { unusedPath } from "../vault/unused-path";
import { detectKind, isManagedSubpath } from "./frontmatter";

/**
 * Detects notes whose Google item no longer exists and files them into an `orphaned/`
 * subfolder — the vault never deletes anything, but notes without a live Google item
 * are made visible instead of silently going stale.
 *
 * Detection is deliberately conservative: a note only counts as orphaned when the import
 * listing didn't return its id AND a direct GET confirms the item is gone (404/410, a
 * cancelled event, or a task flagged deleted). Event notes outside the import window are
 * never considered — the listing couldn't have seen them.
 */

export interface SeenRemoteItems {
    /** Ids of live events the import listing returned. */
    eventIds: Set<string>;
    /** Ids the listing reported as cancelled — Google says these are deleted. */
    cancelledEventIds: Set<string>;
    /** Ids of tasks the import listing returned. */
    taskIds: Set<string>;
    /** RFC3339 window the event listing covered. */
    timeMin: string;
    timeMax: string;
    /** Whether each listing finished without error; no scan for a phase that didn't. */
    eventsComplete: boolean;
    tasksComplete: boolean;
}

export function emptySeen(timeMin = "", timeMax = ""): SeenRemoteItems {
    return {
        eventIds: new Set(),
        cancelledEventIds: new Set(),
        taskIds: new Set(),
        timeMin,
        timeMax,
        eventsComplete: false,
        tasksComplete: false,
    };
}

function isGone(e: unknown): boolean {
    return e instanceof GoogleApiError && (e.status === 404 || e.status === 410);
}

export class OrphanScanner {
    constructor(
        private readonly port: VaultPort,
        private readonly calendar: GoogleCalendarClient,
        private readonly tasks: GoogleTasksClient,
        private readonly settings: () => GoogleSyncSettings,
    ) {}

    /** Move confirmed-orphaned notes; returns how many were filed. */
    async scan(seen: SeenRemoteItems): Promise<number> {
        const s = this.settings();
        let moved = 0;
        for (const ref of await this.port.listMarkdown([s.eventsFolder, s.tasksFolder])) {
            try {
                if (isManagedSubpath(ref.path, s.eventsFolder, s.tasksFolder)) continue;
                const kind = detectKind(ref.path, s.eventsFolder, s.tasksFolder);
                if (!kind) continue;
                if (kind === "event" && !seen.eventsComplete) continue;
                if (kind === "task" && !seen.tasksComplete) continue;
                const fm = await this.port.readFrontmatter(ref.path);
                const gid = fm.googleId;
                if (typeof gid !== "string" || !gid) continue;
                const orphaned =
                    kind === "event"
                        ? await this.eventOrphaned(gid, fm, seen, s)
                        : await this.taskOrphaned(gid, fm, seen, s);
                if (!orphaned) continue;
                const folder = kind === "event" ? s.eventsFolder : s.tasksFolder;
                const dest = await unusedPath(this.port, `${folder}/orphaned/${ref.basename}.md`);
                await this.port.move(ref.path, dest);
                moved++;
            } catch (e) {
                console.error("[google-sync] orphan check failed for", ref.path, e);
            }
        }
        return moved;
    }

    private async eventOrphaned(
        googleId: string,
        fm: Record<string, unknown>,
        seen: SeenRemoteItems,
        s: GoogleSyncSettings,
    ): Promise<boolean> {
        if (seen.eventIds.has(googleId)) return false;
        if (seen.cancelledEventIds.has(googleId)) return true;
        if (!this.dateInWindow(fm, seen, s)) return false;
        try {
            const remote = await this.calendar.getEvent(
                (typeof fm.calendarId === "string" && fm.calendarId) || s.defaultCalendarId,
                googleId,
            );
            return remote.status === "cancelled";
        } catch (e) {
            return isGone(e);
        }
    }

    private async taskOrphaned(
        googleId: string,
        fm: Record<string, unknown>,
        seen: SeenRemoteItems,
        s: GoogleSyncSettings,
    ): Promise<boolean> {
        if (seen.taskIds.has(googleId)) return false;
        try {
            const remote = await this.tasks.getTask(
                (typeof fm.tasklist === "string" && fm.tasklist) || s.taskListId,
                googleId,
            );
            return remote.deleted === true;
        } catch (e) {
            return isGone(e);
        }
    }

    /** Only events the listing window covered can be judged by absence-from-listing. */
    private dateInWindow(
        fm: Record<string, unknown>,
        seen: SeenRemoteItems,
        s: GoogleSyncSettings,
    ): boolean {
        if (typeof fm.date !== "string") return false;
        const zone = (typeof fm.timezone === "string" && fm.timezone) || s.defaultTimezone;
        const dt = DateTime.fromISO(fm.date, { zone, setZone: true });
        const min = DateTime.fromISO(seen.timeMin);
        const max = DateTime.fromISO(seen.timeMax);
        return dt.isValid && min.isValid && max.isValid && dt >= min && dt <= max;
    }
}
