<template>
  <div
    v-if="boardImages.length > 0 && throws > 0"
    :class="twMerge(
      'fixed bottom-4 right-4 mx-auto flex max-w-[1366px] justify-end',
    )"
    :style="{
      left: `${leftPosition}px`,
    }"
  >
    <div class="flex flex-col space-y-2">
      <div
        v-for="(item, index) in filteredBoardImages"
        :key="`zoom-${index}-${item.image}-${item.coords?.x}-${item.coords?.y}`"
        :style="{ height: `${zoomContainerHeight}px` }"
        class="flex items-center justify-center overflow-hidden rounded-lg border-2 border-[var(--chakra-colors-whiteAlpha-900)]"
      >
        <div
          class="relative size-[25rem] overflow-hidden bg-[#080808]"
        >
          <img
            :src="item.image"
            class="size-full object-cover"
            :style="{
              transform: `scale(${zoomLevel}) translate(calc(-${(item.coords?.x * (1000 / 3) + 500) / 10}% + 50%), calc(-${(-item.coords?.y * (1000 / 3) + 500) / 10}% + 50%))`,
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

const boardImages = ref<string[]>([]);
const throws = ref<number>(0);
const throwCoordinates = ref<{ x: number; y: number }[]>([]);
const leftPosition = ref<number>(0);
const zoomLevel = ref<number>(2);
const zoomContainerHeight = ref<number>(128); // Default fallback height

const filteredBoardImages = computed(() => {
  const slicedImages = boardImages.value.slice(0, throws.value).reverse();
  return slicedImages
    .map((image, index) => ({
      image,
      coords: throwCoordinates.value[index],
    }))
    .filter(item =>
      item.image
      && item.coords
      && item.image !== "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    );
});

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

onMounted(async () => {
  console.log("Autodarts Tools: Animations mounted");

  await AutodartsToolsBoardImages.setValue({
    images: [],
  });

  AutodartsToolsBoardImages.watch((_boardImages: IBoardImages) => {
    boardImages.value = _boardImages.images.reverse();
  });

  AutodartsToolsGameData.watch(async (_gameData: IGameData, _previousGameData: IGameData) => {
    throws.value = _gameData.match?.turns[0]?.throws.length ?? 0;
    throwCoordinates.value = _gameData.match?.turns[0]?.throws.map((_throw: IThrow) => ({ x: _throw.coords?.x ?? 0, y: _throw.coords?.y ?? 0 })) ?? [];

    if (_gameData.match?.player !== _previousGameData.match?.player) {
      throws.value = 0;
      throwCoordinates.value = [];
      boardImages.value = [];

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
</script>
