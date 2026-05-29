import { describe, it } from "mocha";
import { expect } from "chai";
import { SyncSuppressor } from "../../src/sync/suppression";

describe("SyncSuppressor", () => {
    it("suppresses a path within the window and not after it", () => {
        const s = new SyncSuppressor(15_000);
        s.suppress("events/a.md", 1_000);
        expect(s.isSuppressed("events/a.md", 1_000)).to.equal(true);
        expect(s.isSuppressed("events/a.md", 15_999)).to.equal(true); // 1000 + 15000 = 16000
        expect(s.isSuppressed("events/a.md", 16_001)).to.equal(false);
    });

    it("does not suppress paths that were never marked", () => {
        const s = new SyncSuppressor(15_000);
        expect(s.isSuppressed("events/never.md", 0)).to.equal(false);
    });

    it("prunes an expired entry so a later re-mark starts a fresh window", () => {
        const s = new SyncSuppressor(10_000);
        s.suppress("tasks/t.md", 0);
        expect(s.isSuppressed("tasks/t.md", 10_001)).to.equal(false); // expired + pruned
        s.suppress("tasks/t.md", 20_000);
        expect(s.isSuppressed("tasks/t.md", 25_000)).to.equal(true);
        expect(s.isSuppressed("tasks/t.md", 30_001)).to.equal(false);
    });

    it("tracks paths independently", () => {
        const s = new SyncSuppressor(5_000);
        s.suppress("a.md", 0);
        s.suppress("b.md", 2_000);
        expect(s.isSuppressed("a.md", 4_000)).to.equal(true);
        expect(s.isSuppressed("a.md", 5_001)).to.equal(false);
        expect(s.isSuppressed("b.md", 6_000)).to.equal(true);
    });
});
