import "~/assets/tailwind.css";
import { createApp } from "vue";
import App from "./App.vue";
import { waitForElement } from "@/utils";
import { AutodartsToolsGlobalStatus, AutodartsToolsUrlStatus } from "@/utils/storage";
import { isiOS } from "@/utils/helpers";
import Migration from "@/components/Migration.vue";

let migrationModalUI: any;

export default defineContentScript({
  matches: [ "*://play.autodarts.io/*" ],
  cssInjectionMode: "ui",
  async main(ctx) {
    await waitForElement("#root > div:nth-of-type(1)", 15000);
    AutodartsToolsUrlStatus.setValue(window.location.href.split("#")[0] || "undefined");

    // Create a custom event listener for the auth cookie
    ctx.addEventListener(window, "auth-cookie-available", (event: CustomEvent) => {
      const { authValue } = event.detail;
      console.log("Authorization cookie retrieved");

      // Store the auth value in the extension's storage for later use
      AutodartsToolsGlobalStatus.getValue().then((globalStatus) => {
        AutodartsToolsGlobalStatus.setValue({
          ...globalStatus,
          auth: { token: authValue },
        });
      });
    });

    // Inject the auth-cookie script
    try {
      // Create a script element to load the auth-cookie.js file
      const script = document.createElement("script");
      script.src = browser.runtime.getURL("/auth-cookie.js");
      (document.head || document.documentElement).appendChild(script);
      script.onload = () => script.remove();
    } catch (error) {
      console.error("Failed to inject auth cookie script:", error);
    }

    try {
      const storage = await browser.storage.local.get("config");
      if (storage.config) {
        await initMigrationModal(ctx);
      }
    } catch (error) {
      console.error("Failed to check for migration data:", error);
    }

    if (window.location.href.includes("/tools")) {
      document.querySelector("#root")?.remove();
      window.location.href = "/settings";
    } else {
      if (isiOS()) {
        document.querySelector("body")!.style!.minHeight = "calc(100vh + 1px)";
      }
      await waitForElement("#root > div:nth-of-type(1)", 15000);

      await waitForElement("#root > div > div:nth-of-type(2)", 15000);
      const ui = await createShadowRootUi(ctx, {
        name: "autodarts-tools-wxt",
        position: "inline",
        anchor: "#root > div > div:nth-of-type(2)",
        onMount: (container) => {
          const app = createApp(App);
          app.mount(container);
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            container.classList.add("dark");
          }
          return app;
        },
        onRemove: (app) => {
          app?.unmount();
        },
      });
      ui.mount();
    }
  },
});

async function initMigrationModal(ctx) {
  migrationModalUI = await createShadowRootUi(ctx, {
    name: "autodarts-tools-migration-modal",
    position: "inline",
    anchor: "#root > div > div:nth-of-type(2)",
    onMount: (container) => {
      console.log("Autodarts Tools: Takeout initialized");
      const takeout = createApp(Migration);
      takeout.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return takeout;
    },
    onRemove: (takeout) => {
      takeout?.unmount();
    },
  });
  migrationModalUI.mount();
}
