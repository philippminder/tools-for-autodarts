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
            Settings - Hide Menu in Match
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure how the menu is displayed during matches.</p>

            <div class="mt-4 space-y-4">
              <!-- No additional settings needed for this feature -->
              <p>This feature hides the menu during matches to provide a cleaner interface and prevent accidental clicks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      @click="activeSettings = 'hide-menu-in-match'"
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Hide Menu in Match
          </h3>
          <p class="w-2/3 text-white/70">
            Hides the menu during matches to provide a cleaner interface and prevent accidental clicks.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="config.menuDisabled = !config.menuDisabled"
            :type="config.menuDisabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.menuDisabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Hide Menu in Match" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { onMounted, ref, watch } from "vue";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, defaultConfig } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "hide-menu-in-match");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/hide-menu-in-match.png");

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
