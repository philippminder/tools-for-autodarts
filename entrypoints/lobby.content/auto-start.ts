import { waitForElement } from "@/utils";

let autostartEnabled: boolean = false;
let checkAutoStartInterval: NodeJS.Timeout | null = null;

export async function autoStart() {
  try {
    const hasAutoStartButton = document.getElementById("adt-autostart-button");
    if (hasAutoStartButton) return;

    const buttonsContainer = await waitForElement("#root > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2) > div:last-of-type") as HTMLDivElement;
    const button = buttonsContainer.querySelector("button")?.cloneNode(true) as HTMLButtonElement;

    button.id = "adt-autostart-button";
    button.innerText = "Autostart OFF";
    updateButtonStyle(button, false);
    button.style.maxWidth = "10rem";

    button.addEventListener("click", () => {
      const isOn = button.textContent === "Autostart OFF";
      button.textContent = isOn ? "Autostart ON" : "Autostart OFF";
      updateButtonStyle(button, isOn);
      autostartEnabled = isOn;

      if (autostartEnabled) {
        checkAutoStartInterval = setInterval(checkAutoStart, 1000);
      } else {
        if (checkAutoStartInterval) clearInterval(checkAutoStartInterval);
      }
    });

    buttonsContainer.appendChild(button);
  } catch (e) {
    console.error("Autodarts Tools: Auto Start - Error adding auto start button: ", e);
  }
}

function updateButtonStyle(button: HTMLButtonElement, isSuccess: boolean) {
  if (isSuccess) {
    // Success style
    button.style.border = "1px solid var(--chakra-colors-borderGreen)";
    button.style.background = "var(--chakra-colors-glassGreen)";
    button.style.color = "var(--chakra-colors-white)";
  } else {
    // Danger style
    button.style.border = "1px solid var(--chakra-colors-borderRed)";
    button.style.background = "var(--chakra-colors-glassRed)";
    button.style.color = "var(--chakra-colors-white)";
  }
}

export async function onRemove() {
  if (checkAutoStartInterval) clearInterval(checkAutoStartInterval);
  autostartEnabled = false;
}

async function checkAutoStart() {
  const rows = document.querySelectorAll("#root > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2) table > tbody > tr");
  if (rows.length > 1) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const buttons = document.querySelectorAll("button") as NodeList;
    const startButton = Array.from(buttons).find(button => button.textContent === "Start game");
    startButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    if (checkAutoStartInterval) clearInterval(checkAutoStartInterval);
  }
}
