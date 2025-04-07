/**
 * Unlisted script to access the Authorization cookie
 */

export default defineUnlistedScript(() => {
  console.log("[Auth Cookie] Starting initialization");

  try {
    // Get the Authorization cookie
    const authCookie = document.cookie
      .split("; ")
      .find(row => row.startsWith("Authorization="));

    if (authCookie) {
      const authValue = authCookie.split("=")[1];
      console.log("[Auth Cookie] Authorization cookie found");

      // Dispatch a custom event with the auth value
      window.dispatchEvent(new CustomEvent("auth-cookie-available", {
        detail: { authValue },
      }));
    } else {
      console.log("[Auth Cookie] No Authorization cookie found");
    }
  } catch (error) {
    console.error("[Auth Cookie] Error accessing cookie:", error);
  }
});
