import { expect } from "chai";
import {
    describeOAuthError,
    extractOAuthError,
    friendlyAuthError,
} from "../../src/google/auth-errors";
import { GoogleApiError } from "../../src/google/api";

describe("OAuth auth error helpers", () => {
    it("explains redirect_uri_mismatch from callback error codes", () => {
        expect(friendlyAuthError("redirect_uri_mismatch")).to.contain("bridge URL");
        expect(friendlyAuthError("redirect_uri_mismatch")).to.contain("Web application");
    });

    it("extracts token endpoint JSON errors from GoogleApiError bodies", () => {
        const err = new GoogleApiError(400, "token endpoint -> 400", {
            error: "invalid_client",
            error_description: "Unauthorized",
        });
        expect(extractOAuthError(err)).to.deep.equal({
            code: "invalid_client",
            description: "Unauthorized",
        });
        expect(friendlyAuthError(err)).to.contain("OAuth client ID or secret");
    });

    it("falls back to plain error messages for unknown errors", () => {
        expect(describeOAuthError("not_a_real_code")).to.equal(null);
        expect(friendlyAuthError(new Error("network down"))).to.equal("network down");
    });
});
