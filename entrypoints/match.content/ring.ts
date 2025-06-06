import { addStyles, waitForElement, waitForElementWithTextContent } from "@/utils";
import { AutodartsToolsConfig } from "@/utils/storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";

/**
 * Checks if the browser supports CSS trigonometric functions
 */
const supportsTrigFunctions = CSS.supports("(top: calc(sin(1) * 1px))");

/**
 * Returns size parameters based on the configured ring size
 */
function getRingSizes(size: number): {
  imageCircleSize: number;
  svgCircleSize: number;
  adjustmentValue: number;
} {
  switch (size) {
    case 1:
      return { imageCircleSize: 0.337, svgCircleSize: 0.488, adjustmentValue: -0.04 };
    case 2:
      return { imageCircleSize: 0.349, svgCircleSize: 0.499, adjustmentValue: 0 };
    case 3:
      return { imageCircleSize: 0.351, svgCircleSize: 0.511, adjustmentValue: 0.05 };
    case 4:
      return { imageCircleSize: 0.356, svgCircleSize: 0.519, adjustmentValue: 0.065 };
    case 5:
      return { imageCircleSize: 0.361, svgCircleSize: 0.528, adjustmentValue: 0.085 };
    case 6:
      return { imageCircleSize: 0.366, svgCircleSize: 0.536, adjustmentValue: 0.11 };
    case 7:
      return { imageCircleSize: 0.371, svgCircleSize: 0.545, adjustmentValue: 0.1375 };
    case 8:
      return { imageCircleSize: 0.376, svgCircleSize: 0.556, adjustmentValue: 0.165 };
    case 9:
      return { imageCircleSize: 0.381, svgCircleSize: 0.568, adjustmentValue: 0.195 };
    default:
      return { imageCircleSize: 0.341, svgCircleSize: 0.499, adjustmentValue: 0 };
  }
}

/**
 * Applies the ring styles to the dartboard
 */
async function applyRingStyles() {
  const button1 = await waitForElementWithTextContent("button", "1");
  await waitForElementWithTextContent("button", "2");
  await waitForElementWithTextContent("button", "3");

  // Get configuration
  const config = await AutodartsToolsConfig.getValue();
  const ringSize = config.ring.size;
  const ringColorEnabled = config.ring.colorEnabled;
  const ringColor = config.ring.color;

  // Get board view container
  const boardViewContainer = button1?.parentElement?.parentElement?.parentElement;
  if (!boardViewContainer) return;

  // Set up container and numbers element
  boardViewContainer.classList.add("adt-boardview-container");

  // Check if numbers element already exists
  let boardViewNumbersElement = boardViewContainer.querySelector(".adt-boardview-numbers");
  if (!boardViewNumbersElement) {
    boardViewNumbersElement = document.createElement("div");
    boardViewNumbersElement.classList.add("adt-boardview-numbers");
    boardViewContainer?.appendChild(boardViewNumbersElement);
  } else {
    // Clear existing ring if it exists
    boardViewNumbersElement.innerHTML = "";
  }

  await waitForElement("svg[viewBox=\"0 0 1000 1000\"]");

  // Get image holder and elements
  const imageHolder = boardViewContainer.querySelector("svg[viewBox=\"0 0 1000 1000\"]")?.parentElement;
  if (!imageHolder) return;
  imageHolder.classList.add("adt-boardview-image");

  const ringImage = imageHolder.querySelector("image");
  const ringSVG = await waitForElement("svg[viewBox=\"0 0 1000 1000\"]");

  // Apply size settings
  const { imageCircleSize, svgCircleSize, adjustmentValue } = getRingSizes(ringSize);

  // Apply styles to SVG
  if (ringSVG) {
    ringSVG.style.background = ringColor;
    ringSVG.style.background = `radial-gradient(circle, #ffffff77 31%, ${ringColor} 58%)`;
    ringSVG.style.clipPath = `circle(${svgCircleSize * 100}%)`;
  }

  // Apply styles to image if color is enabled
  if (ringImage && ringColorEnabled) {
    ringImage.style.clipPath = `circle(${imageCircleSize * 100}%)`;
  }

  // Create ring heading element
  const ringHeadingElement = document.createElement("h1");
  ringHeadingElement.classList.add("ring");

  // Configure ring text
  const ringText = "20  1  18  4  13  6  10  15  2  17  3  19  7  16  8  11  14  9  12  5  ";
  const characters = ringText.split("");
  const characterSpacing = 1.4;

  // Set up ring properties
  ringHeadingElement.innerHTML = "";
  ringHeadingElement.style.setProperty("--char-count", characters.length.toString());

  // Create character spans
  for (let i = 0; i < characters.length; i++) {
    ringHeadingElement.innerHTML += `<span aria-hidden="true" class="char" style="--char-index: ${i};">${characters[i]}</span>`;
  }

  // Set character width and radius
  ringHeadingElement.style.setProperty("--character-width", characterSpacing.toString());
  ringHeadingElement.style.setProperty("--radius", supportsTrigFunctions
    ? "calc((var(--character-width) / sin(var(--inner-angle))) * -1ch"
    : `calc(
          (${characterSpacing} / ${Math.sin(360 / ringHeadingElement.children.length / (180 / Math.PI))})
          * -1ch
        )`);

  // Calculate and set font size based on container dimensions
  const minSize = Math.min(
    (boardViewNumbersElement as HTMLElement).offsetWidth,
    (boardViewNumbersElement as HTMLElement).offsetHeight,
  );
  const newFontSize = (minSize * 3 / 1000 - (minSize / 3500) + adjustmentValue).toString();
  ringHeadingElement.style.setProperty("--font-size", newFontSize);

  // Set buffer variable for positioning
  document.documentElement.style.setProperty("--buffer",
    supportsTrigFunctions
      ? `calc((${characterSpacing} / sin(${360 / ringHeadingElement.children.length}deg)) * ${newFontSize}rem)`
      : `calc((${characterSpacing} / ${Math.sin(
            360 / ringHeadingElement.children.length / (180 / Math.PI))}) * ${newFontSize}rem)`);

  // Add ring to the board view
  boardViewNumbersElement.appendChild(ringHeadingElement);
}

/**
 * Initializes and renders the dartboard ring
 */
export async function ring() {
  console.log("Autodarts Tools: Ring");

  // Add required CSS styles
  addStyles(`
    .ring {
      --inner-angle: calc((360 / var(--char-count)) * 1deg);
      --character-width: 1;
      font-size: calc(var(--font-size, 1) * 1rem);
      position: absolute;
      top: 50%;
      left: 50%;
      font-weight: 900;
      pointer-events: none;
    }
    .char {
      pointer-events: none;
      display: inline-block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform:
        translate(-50%, -50%)
        rotate(calc(var(--inner-angle) * var(--char-index) - 2deg))
        translateY(var(--radius));
    }
    .adt-boardview-container {
      pointer-events: none;
    }
    .adt-boardview-container .adt-boardview-numbers {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
  `, "live-view-ring");

  // Apply ring styles initially
  await applyRingStyles();

  // Set up watcher for player changes
  AutodartsToolsGameData.watch(async (value, oldValue) => {
    // Check if player has changed
    if (value?.match?.player !== oldValue?.match?.player) {
      console.log("Autodarts Tools: Player changed, reapplying ring styles");
      await applyRingStyles();
    }
  });
}
