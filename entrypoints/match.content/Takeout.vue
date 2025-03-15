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
import { AutodartsToolsBoardStatus, AutodartsToolsConfig, type TBoardStatus } from "@/utils/storage";
import { BoardStatus } from "@/utils/types";
import { waitForElementWithTextContent } from "@/utils";

const show = ref<boolean>(false);

AutodartsToolsBoardStatus.watch(() => {
  checkStatus().catch(console.error);
});

onMounted(async () => {
  console.warn("Autodarts Tools: Takeout - TEST THIS WITH LIVE BOARD");

  checkStatus().catch(console.error);
});

async function checkStatus() {
  const config = await AutodartsToolsConfig.getValue();

  if (config.takeout.enabled) {
    // TODO: Rework this to be used with the websocket data
    const boardstatus: TBoardStatus = await AutodartsToolsBoardStatus.getValue();
    show.value = boardstatus === BoardStatus.TAKEOUT;
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
