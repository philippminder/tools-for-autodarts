<template>
  <div
    @click="hideAnimation"
    v-if="isShowingAnimation"
    class="fixed left-0 top-0 z-[9998] size-full"
  >
    <div class="absolute inset-0">
      <img
        id="gif-animation"
        :src="currentAnimationUrl"
        :class="twMerge(
          'w-full h-full object-cover transition-opacity duration-300',
          isFadingIn ? 'opacity-100' : 'opacity-0',
          isFadingOut ? 'opacity-0' : '',
        )"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import type { IMatchStatus } from "@/utils/storage";
import { AutodartsToolsConfig, AutodartsToolsMatchStatus } from "@/utils/storage";

// Constants
const FADE_DURATION = 300; // ms
const FADE_IN_DELAY = 50; // ms

// State
const isShowingAnimation = ref(false);
const isFadingOut = ref(false);
const isFadingIn = ref(false);
const currentAnimationUrl = ref("");
const config = ref<any>(null);

onMounted(async () => {
  try {
    config.value = await AutodartsToolsConfig.getValue();

    // Set up watcher for match status changes
    AutodartsToolsMatchStatus.watch(detectAndPlayAnimation);
  } catch (error) {
    console.error("Autodarts Tools: Animation initialization error", error);
  }
});

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function hideAnimation(): void {
  isFadingOut.value = true;
  setTimeout(() => {
    isShowingAnimation.value = false;
    isFadingOut.value = false;
    isFadingIn.value = false;
  }, FADE_DURATION);
}

function detectAndPlayAnimation(matchStatus: IMatchStatus): void {
  if (!config.value?.animations?.enabled) return;

  const { turnPoints, throws } = matchStatus;
  const curThrowPointsName = throws.slice(-1)[0];

  const buttons = Array.from(document.querySelectorAll(".chakra-button"));
  const isLegWinner = buttons.some(button => (button as HTMLElement).innerText === "Next Leg");

  // Determine animation type based on game state
  if (isLegWinner) {
    playAnimation("winner");
  } else if (turnPoints === "BUST") {
    playAnimation("bust");
  } else if (turnPoints === "180") {
    playAnimation("oneEighty");
  } else if (curThrowPointsName === "BULL") {
    playAnimation("bull");
  } else if (curThrowPointsName?.startsWith("M")) {
    playAnimation("miss");
  }
}

async function playAnimation(configKey: string): Promise<void> {
  try {
    const animations = config.value.animations[configKey];
    if (!animations || !animations.length) return;

    const startDelay = Number(config.value.animations.startDelay) * 1000;
    const endDelay = Number(config.value.animations.endDelay) * 1000;
    const url = animations[getRandomInt(animations.length)].info;

    currentAnimationUrl.value = url;

    // Show animation with fade in
    setTimeout(() => {
      isShowingAnimation.value = true;
      setTimeout(() => {
        isFadingIn.value = true;
      }, FADE_IN_DELAY);
    }, startDelay);

    // Hide animation with fade out
    setTimeout(() => {
      isFadingOut.value = true;
      setTimeout(() => {
        isShowingAnimation.value = false;
        isFadingOut.value = false;
        isFadingIn.value = false;
      }, FADE_DURATION);
    }, startDelay + endDelay);
  } catch (error) {
    console.error("Autodarts Tools: Play animation error", error);
  }
}
</script>
