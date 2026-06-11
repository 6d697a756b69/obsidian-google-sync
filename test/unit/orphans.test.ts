import { describe, it } from "mocha";
import { expect } from "chai";
import { OrphanScanner, emptySeen } from "../../src/sync/orphans";
import { GoogleCalendarClient } from "../../src/google/calendar";
import { GoogleTasksClient } from "../../src/google/tasks";
import { DEFAULT_SETTINGS, GoogleSyncSettings } from "../../src/settings-data";
import { MemoryVault } from "./helpers/memoryVault";
import { HttpFn, HttpRequest } from "../../src/google/http";
import { noWaitRetry, token } from "./helpers/fakeHttp";

/** GETs against ids in `gone` 404; everything else returns the given body. */
function confirmStub(gone: string[], body: unknown = {}): { calls: HttpRequest[]; fn: HttpFn } {
    const calls: HttpRequest[] = [];
    const fn: HttpFn = async (req) => {
        calls.push(req);
        if (gone.some((id) => req.url.endsWith(`/${id}`))) {
            return { status: 404, headers: {}, text: "{}", json: {} };
        }
        return { status: 200, headers: {}, text: JSON.stringify(body), json: body };
    };
    return { calls, fn };
}

function makeScanner(vault: MemoryVault, gone: string[], remoteBody: unknown = {}) {
    const settings: GoogleSyncSettings = { ...DEFAULT_SETTINGS, taskListId: "L1" };
    const { calls, fn } = confirmStub(gone, remoteBody);
    return {
        scanner: new OrphanScanner(
            vault,
            new GoogleCalendarClient(fn, token, noWaitRetry),
            new GoogleTasksClient(fn, token, noWaitRetry),
            () => settings,
        ),
        calls,
    };
}

function seenWindow() {
    // Window around the test event dates.
    return emptySeen("2026-06-01T00:00:00.000Z", "2026-06-30T00:00:00.000Z");
}

describe("OrphanScanner", () => {
    it("files a task whose GET 404s and keeps one the listing saw", async () => {
        const vault = new MemoryVault();
        vault.seed("tasks/gone.md", { title: "Gone", googleId: "t-gone" });
        vault.seed("tasks/alive.md", { title: "Alive", googleId: "t-alive" });
        const { scanner } = makeScanner(vault, ["t-gone"]);
        const seen = seenWindow();
        seen.taskIds.add("t-alive");
        seen.tasksComplete = true;

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(1);
        expect(vault.paths()).to.include("tasks/orphaned/gone.md");
        expect(vault.paths()).to.include("tasks/alive.md");
    });

    it("files an event the listing reported cancelled, without a confirming GET", async () => {
        const vault = new MemoryVault();
        vault.seed("events/cancelled.md", {
            title: "Cancelled",
            date: "2026-06-10T09:00:00",
            googleId: "ev-c",
        });
        const { scanner, calls } = makeScanner(vault, []);
        const seen = seenWindow();
        seen.cancelledEventIds.add("ev-c");
        seen.eventsComplete = true;
        seen.tasksComplete = true;

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(1);
        expect(vault.paths()).to.include("events/orphaned/cancelled.md");
        expect(calls).to.have.length(0);
    });

    it("never judges an event outside the import window by absence", async () => {
        const vault = new MemoryVault();
        vault.seed("events/future.md", {
            title: "Far future",
            date: "2027-01-01T09:00:00",
            googleId: "ev-far",
        });
        const { scanner, calls } = makeScanner(vault, ["ev-far"]);
        const seen = seenWindow();
        seen.eventsComplete = true;
        seen.tasksComplete = true;

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(0);
        expect(calls).to.have.length(0);
        expect(vault.paths()).to.include("events/future.md");
    });

    it("keeps an in-window event when the confirming GET says it still exists", async () => {
        const vault = new MemoryVault();
        vault.seed("events/missing-from-list.md", {
            title: "Missing",
            date: "2026-06-10T09:00:00",
            googleId: "ev-m",
        });
        const { scanner, calls } = makeScanner(vault, [], { id: "ev-m", status: "confirmed" });
        const seen = seenWindow();
        seen.eventsComplete = true;
        seen.tasksComplete = true;

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(0);
        expect(calls).to.have.length(1);
    });

    it("files an in-window event whose confirming GET reports it cancelled", async () => {
        const vault = new MemoryVault();
        vault.seed("events/deleted.md", {
            title: "Deleted",
            date: "2026-06-10T09:00:00",
            googleId: "ev-d",
        });
        const { scanner } = makeScanner(vault, [], { id: "ev-d", status: "cancelled" });
        const seen = seenWindow();
        seen.eventsComplete = true;
        seen.tasksComplete = true;

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(1);
        expect(vault.paths()).to.include("events/orphaned/deleted.md");
    });

    it("skips a phase whose listing did not complete", async () => {
        const vault = new MemoryVault();
        vault.seed("tasks/gone.md", { title: "Gone", googleId: "t-gone" });
        const { scanner } = makeScanner(vault, ["t-gone"]);
        const seen = seenWindow(); // tasksComplete stays false

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(0);
        expect(vault.paths()).to.include("tasks/gone.md");
    });

    it("ignores notes without a googleId and already-orphaned notes", async () => {
        const vault = new MemoryVault();
        vault.seed("tasks/local-only.md", { title: "Local" });
        vault.seed("tasks/orphaned/old.md", { title: "Old", googleId: "t-old" });
        const { scanner, calls } = makeScanner(vault, ["t-old"]);
        const seen = seenWindow();
        seen.eventsComplete = true;
        seen.tasksComplete = true;

        const moved = await scanner.scan(seen);

        expect(moved).to.equal(0);
        expect(calls).to.have.length(0);
    });
});
