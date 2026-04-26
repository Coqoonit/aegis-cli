import { defineCommand } from "citty";
import invite from "./invite.js";
import login from "./login.js";
import logout from "./logout.js";
import refresh from "./refresh.js";
import requestPasswordReset from "./request-password-reset.js";
import resetPassword from "./reset-password.js";
import verifyResetToken from "./verify-reset-token.js";

export default defineCommand({
  meta: {
    name: "auth",
    description: "Authentication commands.",
  },
  subCommands: {
    login,
    logout,
    refresh,
    "request-password-reset": requestPasswordReset,
    "reset-password": resetPassword,
    "verify-reset-token": verifyResetToken,
    invite,
  },
});
