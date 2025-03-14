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
            Settings - Colors
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Customize the colors of dart throws and scores.</p>

            <div class="mt-4 space-y-4">
              <div class="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="relative min-h-14 w-full">
                  <input
                    v-model="config.colors.background"
                    type="color"
                    class="size-full overflow-hidden rounded-md border-none border-transparent p-0 outline-none"
                  >
                  <span
                    class="pointer-events-none absolute inset-0 flex items-center justify-center p-2 text-center text-xs drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                  >Background color</span>
                </div>
                <div class="relative min-h-14 w-full">
                  <input
                    v-model="config.colors.text"
                    type="color"
                    class="size-full overflow-hidden rounded-md border-none border-transparent p-0 outline-none"
                  >
                  <span
                    class="pointer-events-none absolute inset-0 flex items-center justify-center p-2 text-center text-xs drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                  >Text color</span>
                </div>
                <div
                  class="col-span-2 flex h-14 w-full items-center justify-center rounded-md text-5xl font-bold"
                  :style="{
                    backgroundColor: config.colors.background,
                    color: config.colors.text,
                  }"
                >
                  501
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      @click="activeSettings = 'colors'"
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Colors
          </h3>
          <p class="w-2/3 text-white/70">
            Customize the colors of dart throws and scores to match your preferences.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="config.colors.enabled = !config.colors.enabled"
            :type="config.colors.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.colors.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Colors" class="size-full object-cover opacity-70">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, defaultConfig } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "colors");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/colors.png");

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  await AutodartsToolsConfig.setValue({
    ...JSON.parse(JSON.stringify(defaultConfig)),
    ...JSON.parse(JSON.stringify(config.value)),
  });
}, { deep: true });
</script>
