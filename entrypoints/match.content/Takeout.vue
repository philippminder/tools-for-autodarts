<template>
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div @click="handleBackdropClick" v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center font-system">
      <div class="absolute inset-0 bg-black/50" />
      <div
        v-if="show"
        :class="twMerge(
          'z-10',
        )"
      >
        <div class="w-96 rounded-md bg-[var(--chakra-colors-yellow-500)] px-6 py-3 text-3xl font-extrabold text-white">
          <div class="adt-remove uppercase">
            Removing Darts
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import { isEqual } from "lodash";
import { waitForElementWithTextContent } from "@/utils";
import { AutodartsToolsGameData, type IGameData } from "@/utils/game-data-storage";

const show = ref<boolean>(false);
let gameDataWatcherUnwatch: any;

onMounted(() => {
  gameDataWatcherUnwatch = AutodartsToolsGameData.watch((gameData: IGameData, oldGameData: IGameData) => {
    checkStatus(gameData, oldGameData).catch(console.error);
  });
});

onUnmounted(() => {
  if (gameDataWatcherUnwatch) {
    gameDataWatcherUnwatch();
  }
});

async function checkStatus(gameData: IGameData, oldGameData: IGameData) {
  if (isEqual(gameData.board, oldGameData.board)) return;

  const boardstatus: string | undefined = gameData.board?.status;
  show.value = boardstatus === "Takeout in progress";

  if (gameData.match?.player !== oldGameData.match?.player) {
    show.value = false;
  }
}

async function handleBackdropClick() {
  show.value = false;
  await (await waitForElementWithTextContent("button", "Reset"))?.click();
}
</script>

<style>
.adt-remove:after {
    overflow: hidden;
    display: inline-block;
    vertical-align: bottom;
    -webkit-animation: ellipsis steps(4,end) 900ms infinite;
    animation: ellipsis steps(4,end) 900ms infinite;
    content: "\2026";
    width: 0px;
}

@keyframes ellipsis {
    to {
        width: 1.25em;
    }
}

@-webkit-keyframes ellipsis {
    to {
        width: 1.25em;
    }
}
</style>
