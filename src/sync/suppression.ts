/**
 * Echo-suppression for vault writes the plugin itself causes. Pure (no `obsidian` import), so
 * it's unit-testable; the caller injects `now` (Date.now in production).
 *
 * When the plugin imports an event/task it creates or rewrites a note. That fires Obsidian
 * `create`/`modify` events — and if another plugin (e.g. Templater's "trigger on file
 * creation") rewrites the freshly-imported note, that fires more. Without suppression those
 * events flow straight back into sync and push the just-imported (or clobbered) data back to
 * Google, which can overwrite the real calendar event. We mark every path the plugin writes and
 * ignore vault events for it for a short window, breaking the loop.
 */
export class SyncSuppressor {
    private readonly until = new Map<string, number>();

    constructor(private readonly windowMs: number) {}

    /** Suppress sync for `path` for the configured window starting at `now`. */
    suppress(path: string, now: number): void {
        this.until.set(path, now + this.windowMs);
    }

    /** True while `path` is within its suppression window. Expired entries are pruned. */
    isSuppressed(path: string, now: number): boolean {
        const expiry = this.until.get(path);
        if (expiry === undefined) return false;
        if (now > expiry) {
            this.until.delete(path);
            return false;
        }
        return true;
    }
}
