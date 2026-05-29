import { describe, it } from "mocha";
import { expect } from "chai";
import { GoogleEvent } from "../../src/types";
import { isEventAllowed, isRecurringEvent } from "../../src/sync/recurrence";

const oneOff: GoogleEvent = { id: "a", summary: "Dentist" };
const instance: GoogleEvent = { id: "b_1", summary: "Daily Standup", recurringEventId: "b" };
const series: GoogleEvent = { id: "c", summary: "Weekly 1:1", recurrence: ["RRULE:FREQ=WEEKLY"] };

describe("recurring event allowlist", () => {
    it("detects recurring instances and unexpanded series", () => {
        expect(isRecurringEvent(oneOff)).to.equal(false);
        expect(isRecurringEvent(instance)).to.equal(true);
        expect(isRecurringEvent(series)).to.equal(true);
    });

    it("always allows one-off events regardless of mode or filters", () => {
        expect(isEventAllowed(oneOff, "allow", [])).to.equal(true);
        expect(isEventAllowed(oneOff, "allow", ["Something else"])).to.equal(true);
        expect(isEventAllowed(oneOff, "block", ["Dentist"])).to.equal(true);
    });

    describe("allow mode", () => {
        it("excludes all recurring events when the list is empty", () => {
            expect(isEventAllowed(instance, "allow", [])).to.equal(false);
            expect(isEventAllowed(series, "allow", [])).to.equal(false);
        });

        it("treats a whitespace-only list as empty (excludes recurring)", () => {
            expect(isEventAllowed(instance, "allow", ["  ", ""])).to.equal(false);
        });

        it("matches recurring titles case-insensitively and exactly", () => {
            expect(isEventAllowed(instance, "allow", ["daily standup"])).to.equal(true);
            expect(isEventAllowed(instance, "allow", ["Daily"])).to.equal(false);
            expect(isEventAllowed(series, "allow", ["Weekly 1:1"])).to.equal(true);
        });

        it("supports * wildcards", () => {
            expect(isEventAllowed(instance, "allow", ["Daily*"])).to.equal(true);
            expect(isEventAllowed(instance, "allow", ["*Standup"])).to.equal(true);
            expect(isEventAllowed(instance, "allow", ["*stand*"])).to.equal(true);
            expect(isEventAllowed(series, "allow", ["Daily*"])).to.equal(false);
        });

        it("excludes recurring events that match no pattern", () => {
            expect(isEventAllowed(instance, "allow", ["Weekly 1:1"])).to.equal(false);
        });

        it("does not treat regex metacharacters as special", () => {
            const dotted: GoogleEvent = { id: "d", summary: "A.B", recurringEventId: "d" };
            const other: GoogleEvent = { id: "e", summary: "AxB", recurringEventId: "e" };
            expect(isEventAllowed(dotted, "allow", ["A.B"])).to.equal(true);
            expect(isEventAllowed(other, "allow", ["A.B"])).to.equal(false);
        });
    });

    describe("block mode", () => {
        it("imports all recurring events when the list is empty", () => {
            expect(isEventAllowed(instance, "block", [])).to.equal(true);
            expect(isEventAllowed(series, "block", [])).to.equal(true);
        });

        it("excludes recurring events whose title matches a pattern", () => {
            expect(isEventAllowed(instance, "block", ["Daily Standup"])).to.equal(false);
            expect(isEventAllowed(instance, "block", ["*standup"])).to.equal(false);
        });

        it("imports recurring events that match no pattern", () => {
            expect(isEventAllowed(instance, "block", ["Weekly 1:1"])).to.equal(true);
        });
    });
});
