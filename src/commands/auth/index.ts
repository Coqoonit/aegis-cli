import { defineCommand } from "citty";
import consumeLoginLink from "./consume-login-link.js";
import invite from "./invite.js";
import logout from "./logout.js";
import refresh from "./refresh.js";
import regeneratePat from "./regenerate-pat.js";
import requestLoginLink from "./request-login-link.js";
import revokePat from "./revoke-pat.js";
import showPat from "./show-pat.js";
import usePat from "./use-pat.js";
import verifyLoginLink from "./verify-login-link.js";

/**
 * Passwordless CLI auth. Two flows:
 *   1. Magic link (interactive):
 *        request-login-link → user clicks email link → consume-login-link
 *      The token lives in the URL fragment (`/auth/link#token=...`), not
 *      the query string. Open the email link, copy the part after `#token=`,
 *      pass it to `consume-login-link --token <X>`.
 *   2. Personal Access Token (programmatic / unattended):
 *        regenerate-pat (one-time, in browser preferred) → use-pat
 *      A PAT is long-lived; one active per user; revoke-pat to disable.
 */
export default defineCommand({
  meta: {
    name: "auth",
    description: "Authentication commands (passwordless).",
  },
  subCommands: {
    "request-login-link": requestLoginLink,
    "verify-login-link": verifyLoginLink,
    "consume-login-link": consumeLoginLink,
    "use-pat": usePat,
    "show-pat": showPat,
    "regenerate-pat": regeneratePat,
    "revoke-pat": revokePat,
    refresh,
    logout,
    invite,
  },
});
