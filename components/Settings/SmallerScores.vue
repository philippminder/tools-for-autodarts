<template>
  <template v-if="!$attrs['data-feature-index']">
    <!-- Settings Panel -->
    <div
      v-if="config"
      class="adt-container min-h-56"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Settings - Smaller Scores
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure how the inactive player scores are displayed.</p>

            <div class="mt-4 space-y-4">
              <!-- No additional settings needed for this feature -->
              <p>This feature reduces the font-size of the score of inactive players.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      @click="activeSettings = 'smaller-scores'"
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Smaller Scores
          </h3>
          <p class="w-2/3 text-white/70">
            Reduces the font-size of the score of inactive players to improve focus on the current player.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="config.smallerScores.enabled = !config.smallerScores.enabled"
            :type="config.smallerScores.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.smallerScores.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Smaller Scores" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "smaller-scores");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/smaller-scores.png");

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "smallerScores");
}, { deep: true });
</script>
