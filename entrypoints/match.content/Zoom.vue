<template>
  <div
    v-if="boardImages.length > 0 && throws > 0 && position !== 'center'"
    :class="twMerge(
      'fixed bottom-4 mx-auto flex max-w-[1366px] justify-end',
      position === 'bottom-right' ? 'right-4' : 'left-4',
    )"
    :style="{
      left: `${leftPosition}px`,
    }"
  >
    <div class="flex flex-col space-y-2 px-4">
      <div
        v-for="(image, index) in boardImages.filter(image => image !== '')"
        :key="`zoom-${index}`"
        :style="{ height: `${zoomContainerHeight}px` }"
        class="flex items-center justify-center overflow-hidden rounded-lg border border-[var(--chakra-colors-whiteAlpha-900)] transition-opacity duration-500"
        :class="[
          index === throws - 1 ? 'animate-fade-in' : '',
        ]"
      >
        <div
          class="relative size-[25rem] overflow-hidden bg-[#080808]"
        >
          <img
            :src="image"
            class="size-full object-cover"
            :style="{
              transform: `scale(${zoomLevel}) translate(calc(-${(throwCoordinates[index]?.x * (1000 / 3) + 500) / 10}% + 50%), calc(-${(-throwCoordinates[index]?.y * (1000 / 3) + 500) / 10}% + 50%))`,
              transformOrigin: 'center',
            }"
          >
          <div class="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-blue-400 opacity-80" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import type { IBoardImages } from "@/utils/board-image-storage";
import { AutodartsToolsBoardImages } from "@/utils/board-image-storage";
import type { IGameData } from "@/utils/game-data-storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";
import type { IThrow } from "@/utils/websocket-helpers";
import { AutodartsToolsConfig } from "@/utils/storage";
import { waitForElement } from "@/utils";

const boardImages = ref<string[]>([
  "",
  "",
  "",
]);
const throws = ref<number>(0);
const throwCoordinates = ref<{ x: number; y: number }[]>([]);
const leftPosition = ref<number>(0);
const zoomLevel = ref<number>(1.5);
const zoomContainerHeight = ref<number>(128); // Default fallback height
const position = ref<"bottom-right" | "bottom-left" | "center">("bottom-right");

// Store divs for access from other functions
const zoomDiv1 = ref<HTMLElement | null>(null);
const zoomDiv2 = ref<HTMLElement | null>(null);
const zoomDiv3 = ref<HTMLElement | null>(null);

function checkNavigationWidth() {
  const navigationElement = document.querySelector("#root .navigation");
  if (navigationElement) {
    const width = navigationElement.getBoundingClientRect().width;
    if (width < 700) {
      leftPosition.value = width;
    } else {
      leftPosition.value = 0;
    }
  }
}

function getShowAnimationsContainer(): HTMLElement | null {
  const gameMode = document.querySelector("#ad-ext-game-variant")?.textContent;

  // Use the same approach as in ring.ts to find the container
  const container = gameMode === "Cricket"
    ? document.getElementById("ad-ext-turn")?.nextElementSibling?.children[1]?.querySelector(".showAnimations")?.parentElement?.parentElement
    : document.getElementById("ad-ext-turn")?.nextElementSibling?.querySelector(".showAnimations")?.parentElement?.parentElement;

  return container as HTMLElement || null;
}

function updateZoomHeight() {
  const container = getShowAnimationsContainer();
  if (container) {
    const containerHeight = container.offsetHeight;
    // Divide by 3 and reduce by 2rem (32px)
    zoomContainerHeight.value = Math.floor(containerHeight / 3) - 32;
  }
}

function setupResizeObserver() {
  const container = getShowAnimationsContainer();
  if (container && window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      updateZoomHeight();
    });
    resizeObserver.observe(container);
    return resizeObserver;
  }
  return null;
}

let resizeObserver: ResizeObserver | null = null;

function updateZoomDivs() {
  if (position.value !== "center") return;
  if (throws.value === 0) return resetZoomDivs();

  // Update each zoom div with the corresponding image
  const updateDiv = (div: HTMLElement | null, index: number) => {
    // DONT USE TAILWIND CSS HERE - USE DEFAULT CSS STYLES
    if (!div) return;
    if (throws.value - 1 < index) return;

    // Clear the div first
    div.innerHTML = "";
    div.style.overflow = "hidden";
    div.style.height = "7rem";

    // TOOD HERE
    const image = boardImages.value[index];
    if (!image) return;

    // Get the width of the div element to use as a base for sizing
    const divWidth = div.offsetWidth || 350;

    // Create container with relative positioning
    const containerDiv = document.createElement("div");
    containerDiv.style.position = "relative";
    containerDiv.style.display = "flex";
    containerDiv.style.justifyContent = "center";
    containerDiv.style.alignItems = "center";
    containerDiv.style.width = `${divWidth}px`;
    containerDiv.style.height = `${divWidth}px`;
    containerDiv.style.overflow = "hidden";
    containerDiv.style.backgroundColor = "#080808";

    // Create and configure the image
    const imgElement = document.createElement("img");
    imgElement.src = image;
    imgElement.style.width = `${divWidth}px`;
    imgElement.style.height = `${divWidth}px`;
    imgElement.style.objectFit = "cover";
    imgElement.style.left = "0";
    imgElement.style.top = "0";
    imgElement.style.opacity = "1";

    // Apply the same transformation as in the template
    if (throwCoordinates.value[index]) {
      const x = throwCoordinates.value[index].x;
      const y = throwCoordinates.value[index].y;
      imgElement.style.transform = `scale(${zoomLevel.value}) translate(calc(-${(x * (1000 / 3) + 500) / 10}% + 50%), calc(-${(-y * (1000 / 3) + 500) / 10}% + 50%))`;
      imgElement.style.transformOrigin = "center";
    }

    // Create center dot marker
    const dotMarker = document.createElement("div");
    dotMarker.style.position = "absolute";
    dotMarker.style.left = "50%";
    dotMarker.style.top = "50%";
    dotMarker.style.width = "8px"; // size-2 = 8px
    dotMarker.style.height = "8px";
    dotMarker.style.transform = "translate(-50%, -50%)";
    dotMarker.style.borderRadius = "50%";
    dotMarker.style.border = "1px solid white";
    dotMarker.style.backgroundColor = "rgba(96, 165, 250, 0.8)"; // blue-400 with opacity 0.8

    // Append elements
    containerDiv.appendChild(imgElement);
    containerDiv.appendChild(dotMarker);
    div.appendChild(containerDiv);
  };

  // Update all three divs
  updateDiv(zoomDiv1.value, 0);
  updateDiv(zoomDiv2.value, 1);
  updateDiv(zoomDiv3.value, 2);
}

function resetZoomDivs() {
  // Clear content and reset each zoom div
  const resetDiv = (div: HTMLElement | null) => {
    if (!div) return;
    div.innerHTML = "";
    div.style.background = "rgba(255, 255, 255, 0.05)";
    div.style.border = "2px solid transparent";
  };

  resetDiv(zoomDiv1.value);
  resetDiv(zoomDiv2.value);
  resetDiv(zoomDiv3.value);
}

onMounted(async () => {
  console.log("Autodarts Tools: Animations mounted");

  const config = await AutodartsToolsConfig.getValue();
  if (config.zoom.position === "center") initCenterZoom();
  zoomLevel.value = config.zoom.level;
  position.value = config.zoom.position;

  await AutodartsToolsBoardImages.setValue({
    images: [],
  });

  AutodartsToolsBoardImages.watch((_boardImages: IBoardImages) => {
    const lastImage = _boardImages.images[_boardImages.images.length - 1];
    if (lastImage && throws.value > 0) boardImages.value[throws.value - 1] = lastImage;

    // Update zoom divs when boardImages change and position is center
    if (position.value === "center") {
      updateZoomDivs();
    }
  });

  // Also update the AutodartsToolsGameData.watch to call updateZoomDivs
  AutodartsToolsGameData.watch(async (_gameData: IGameData, _previousGameData: IGameData) => {
    const currentThrows = _gameData.match?.turns[0]?.throws.length ?? 0;
    throws.value = currentThrows;
    throwCoordinates.value = _gameData.match?.turns[0]?.throws.map((_throw: IThrow) => ({ x: _throw.coords?.x ?? 0, y: _throw.coords?.y ?? 0 })) ?? [];

    if (_gameData.match?.player !== _previousGameData.match?.player) {
      throws.value = 0;
      throwCoordinates.value = [];
      boardImages.value = [
        "",
        "",
        "",
      ];

      if (config.zoom.position === "center") {
        resetZoomDivs();
      }

      await AutodartsToolsBoardImages.setValue({
        images: [],
      });

      // Update heights when player changes as the container might have changed
      setTimeout(() => {
        updateZoomHeight();
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        resizeObserver = setupResizeObserver();
      }, 300);
    }

    // if there are more throws than images, insert transparent image for missing throws
    const throwsLength = _gameData.match?.turns?.[0]?.throws?.length || 0;
    if (throwsLength > boardImages.value.length) {
      const missingImagesCount = throwsLength - boardImages.value.length;
      const transparentImagePlaceholders = Array(missingImagesCount).fill("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
      boardImages.value = [ ...transparentImagePlaceholders, ...boardImages.value ];
    }

    // Update zoom divs when throw coordinates change and position is center
    if (position.value === "center") {
      updateZoomDivs();
    }
  });

  // Check navigation width on mount
  checkNavigationWidth();

  // Add event listener for navigation width changes
  window.addEventListener("resize", checkNavigationWidth);

  // Set initial height and observe container for size changes
  setTimeout(() => {
    updateZoomHeight();
    resizeObserver = setupResizeObserver();
  }, 500);
});

onUnmounted(() => {
  // Clean up event listeners and observers
  window.removeEventListener("resize", checkNavigationWidth);

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

async function initCenterZoom() {
  const turnElement = await waitForElement("#ad-ext-turn");
  if (turnElement) {
    // Create a duplicate of the turn element
    const duplicateElement = turnElement.cloneNode(true) as HTMLElement;
    duplicateElement.id = "autodarts-tools-zoom-center";

    // Set opacity of the first div to 0
    const firstDiv = duplicateElement.querySelector("div");
    if (firstDiv) {
      firstDiv.style.opacity = "0";
      firstDiv.innerHTML = ""; // Clear the content
    }

    // Assign IDs to the 2nd, 3rd, and 4th divs and clear their content
    const divs = duplicateElement.querySelectorAll("div");
    if (divs.length >= 2) {
      divs[1].id = "adt-zoom-1";
      divs[1].innerHTML = "";
      divs[1].style.background = "rgba(255, 255, 255, 0.05)";
      divs[1].style.border = "2px solid transparent";
      divs[1].style.height = "7rem";
      zoomDiv1.value = divs[1] as HTMLElement;
    }
    if (divs.length >= 3) {
      divs[2].id = "adt-zoom-2";
      divs[2].innerHTML = "";
      divs[2].style.background = "rgba(255, 255, 255, 0.05)";
      divs[2].style.border = "2px solid transparent";
      divs[2].style.height = "7rem";
      zoomDiv2.value = divs[2] as HTMLElement;
    }
    if (divs.length >= 4) {
      divs[3].id = "adt-zoom-3";
      divs[3].innerHTML = "";
      divs[3].style.background = "rgba(255, 255, 255, 0.05)";
      divs[3].style.border = "2px solid transparent";
      divs[3].style.height = "7rem";
      zoomDiv3.value = divs[3] as HTMLElement;
    }

    // Insert the duplicate right after the original element (below it)
    if (turnElement.parentNode) {
      turnElement.parentNode.insertBefore(duplicateElement, turnElement.nextSibling);
    }

    // Update leftPosition based on the original element's position
    const rect = turnElement.getBoundingClientRect();
    leftPosition.value = rect.left;

    // Listen for window resize to update the position
    window.addEventListener("resize", () => {
      const updatedTurnElement = document.querySelector("#ad-ext-turn");
      if (updatedTurnElement) {
        const updatedRect = updatedTurnElement.getBoundingClientRect();
        leftPosition.value = updatedRect.left;
      }
    });
  }
}

// Also watch for changes to position
watch(() => position.value, (newPosition) => {
  if (newPosition === "center") {
    updateZoomDivs();
  }
});
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
</style>
