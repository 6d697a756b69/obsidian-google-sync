import { expect } from "chai";
import {
    checkCredentialFields,
    formatCheck,
    isLikelyClientId,
    normalizeRedirectUri,
    redirectUriWarning,
} from "../../src/setup-checks";

describe("setup checks", () => {
    it("recognizes Google OAuth client ID shape", () => {
        expect(isLikelyClientId("abc.apps.googleusercontent.com")).to.equal(true);
        expect(isLikelyClientId("abc")).to.equal(false);
    });

    it("trims redirect URIs and warns on non-HTTPS", () => {
        expect(normalizeRedirectUri("  https://example.com/bridge/  ")).to.equal(
            "https://example.com/bridge/",
        );
        expect(redirectUriWarning("http://example.com")).to.contain("https://");
        expect(redirectUriWarning("https://example.com")).to.equal(null);
    });

    it("formats actionable credential checks", () => {
        const checks = checkCredentialFields({
            clientId: "not-google",
            clientSecret: "",
            redirectUri: "https://example.com/bridge/",
        });
        expect(checks.map((c) => c.level)).to.deep.equal(["warn", "fail", "ok"]);
        expect(checks.map(formatCheck).join("\n")).to.contain(
            "[!] OAuth client ID looks unusual",
        );
    });
});
