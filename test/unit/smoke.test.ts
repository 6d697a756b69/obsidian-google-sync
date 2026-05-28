import { describe, it } from "mocha";
import { expect } from "chai";

/**
 * Smoke test — proves the mocha + chai + tsx unit harness runs.
 *
 * Pattern for real tests: keep plugin logic (frontmatter parser, note<->Google
 * mapper, date/timezone conversion, retry/backoff) in pure functions under `src/`
 * that take plain inputs and return plain outputs, then import and assert on them
 * here. Code that needs the live Obsidian runtime belongs in the e2e tests
 * under `test/specs/` (the `.e2e.ts` files) instead.
 */
describe("unit harness smoke test", () => {
    it("runs TypeScript tests via tsx", () => {
        expect(1 + 2).to.equal(3);
    });
});
