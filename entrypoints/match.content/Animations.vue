<template>
  <div
    @click="hideAnimation"
    v-if="isShowingAnimation"
    class="fixed z-[180]"
    :class="animationContainerClasses"
    :style="animationContainerStyle"
  >
    <div class="absolute inset-0">
      <img
        id="gif-animation"
        :src="currentAnimationUrl"
        :class="twMerge(
          `size-full transition-opacity duration-300`,
          isFadingIn ? 'opacity-100' : 'opacity-0',
          isFadingOut ? 'opacity-0' : '',
          config?.animations?.objectFit === 'contain' ? 'object-contain' : 'object-cover',
        )"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";

import type { IGameData } from "@/utils/game-data-storage";

import { AutodartsToolsConfig } from "@/utils/storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";

// Constants
const FADE_DURATION = 300; // ms
const FADE_IN_DELAY = 50; // ms

let updateInterval: NodeJS.Timeout | null = null;

// State
const isShowingAnimation = ref(false);
const isFadingOut = ref(false);
const isFadingIn = ref(false);
const currentAnimationUrl = ref("");
const config = ref<any>(null);
const animationTimeout = ref<number | null>(null);
const boardPosition = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
});

// Computed properties
const animationContainerClasses = computed(() => {
  const isFullPage = config.value?.animations?.viewMode === "full-page";
  return {
    "left-0 top-0 size-full": isFullPage,
  };
});

const animationContainerStyle = computed(() => {
  const isFullPage = config.value?.animations?.viewMode === "full-page";
  if (isFullPage) {
    return {};
  }

  return {
    top: `${boardPosition.value.top}px`,
    left: `${boardPosition.value.left}px`,
    width: `${boardPosition.value.width}px`,
    height: `${boardPosition.value.height}px`,
  };
});

onMounted(async () => {
  console.log("Autodarts Tools: Animations mounted");

  try {
    config.value = await AutodartsToolsConfig.getValue();
    AutodartsToolsGameData.watch((gameData: IGameData) => {
      processGameData(gameData);
    });

    // Update board position
    updateBoardPosition();

    // Add resize event listener
    window.addEventListener("resize", updateBoardPosition);

    // Set up an interval to check for board position changes
    updateInterval = setInterval(updateBoardPosition, 1000);
  } catch (error) {
    console.error("Autodarts Tools: Animation initialization error", error);
  }
}); ;

// Clean up interval on unmount
onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
  window.removeEventListener("resize", updateBoardPosition);
});

function updateBoardPosition(): void {
  const boardElement = document.querySelector("#ad-ext-turn")?.nextElementSibling?.querySelector(".showAnimations");
  if (boardElement) {
    const rect = boardElement.getBoundingClientRect();
    boardPosition.value = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }
}

function hideAnimation(): void {
  isFadingOut.value = true;

  // Clear any existing timeout
  if (animationTimeout.value) {
    clearTimeout(animationTimeout.value);
    animationTimeout.value = null;
  }

  setTimeout(() => {
    isShowingAnimation.value = false;
    isFadingOut.value = false;
    isFadingIn.value = false;
  }, FADE_DURATION);
}

/**
 *
 * INFO:
 * 50 will get processed as "bull"
 */
async function processGameData(gameData: IGameData): Promise<void> {
  if (!gameData.match || gameData.match.activated !== undefined || !gameData.match.turns?.length) return;

  if (gameData.match.variant === "Bull-off") return;

  const currentThrow = gameData.match.turns[0].throws[gameData.match.turns[0].throws.length - 1];
  if (!currentThrow) return;

  const editMode: boolean = gameData.match.activated !== undefined && gameData.match.activated >= 0;
  if (editMode) abortAnimation();

  const isLastThrow: boolean = gameData.match.turns[0].throws.length >= 3;
  const throwName: string = currentThrow.segment.name; // S1
  const winner: boolean = gameData.match.gameWinner >= 0;
  const busted: boolean = gameData.match.turns[0].busted;
  const points: number = gameData.match.turns[0].points;
  const miss: boolean = throwName.toLocaleLowerCase().startsWith("m");
  const combinedThrows: string = gameData.match.turns[0].throws.map(t => t.segment.name.toLowerCase()).join("_");

  playAnimation(throwName.toLowerCase());
  if (winner) playAnimation("gameshot");
  if (busted) playAnimation("busted");
  if (isLastThrow) {
    playAnimation(points.toString());
    await new Promise(resolve => setTimeout(resolve, 500));
    playAnimation(combinedThrows);
  }
  if (miss) playAnimation("outside");
}

async function playAnimation(trigger: string): Promise<void> {
  console.log("Autodarts Tools: Playing animation", trigger);

  try {
    const animationUrl = getAnimationUrl(trigger);
    if (!animationUrl) return;

    // Update the board position before showing animation
    updateBoardPosition();

    // Clear any existing animation
    if (isShowingAnimation.value) {
      hideAnimation();
      // Wait for the fade out to complete
      await new Promise(resolve => setTimeout(resolve, FADE_DURATION));
    }

    // Get delay from config (default to 1 second if not set)
    const delayStart = (config.value?.animations?.delayStart || 1) * 1000;

    // Get duration from config (default to 5 second if not set)
    const duration = (config.value?.animations?.duration || 5) * 1000;

    // Set the animation URL
    currentAnimationUrl.value = animationUrl;

    // Delay the start of the animation
    setTimeout(() => {
      isShowingAnimation.value = true;

      // Small delay before fading in for smoother transition
      setTimeout(() => {
        isFadingIn.value = true;
      }, FADE_IN_DELAY);

      // Set timeout to hide the animation after the duration
      animationTimeout.value = window.setTimeout(() => {
        hideAnimation();
      }, duration);
    }, delayStart);
  } catch (error) {
    console.error("Autodarts Tools: Play animation error", error);
  }
}

function abortAnimation(): void {
  // Clear any existing timeout
  if (animationTimeout.value) {
    clearTimeout(animationTimeout.value);
    animationTimeout.value = null;
  }

  isShowingAnimation.value = false;
  isFadingOut.value = false;
  isFadingIn.value = false;
}

function getAnimationUrl(trigger: string): string | undefined {
  // Ensure animations.data is an array before filtering
  const animationsData = config.value?.animations?.data || [];

  // Find all animations that match the trigger
  const matchingAnimations = animationsData.filter(a => a.triggers.includes(trigger) && a.enabled);

  // If no matching animations, return undefined
  if (!matchingAnimations.length) return undefined;

  // If only one animation matches, return its URL
  if (matchingAnimations.length === 1) return matchingAnimations[0].url;

  // Otherwise, randomly select one from the matching animations
  const randomIndex = Math.floor(Math.random() * matchingAnimations.length);
  return matchingAnimations[randomIndex].url;
}
</script>
