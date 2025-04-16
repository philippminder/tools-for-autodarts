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
            Settings - Quick Correction
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure how the quick correction is displayed during matches.</p>

            <div class="mt-4 space-y-4">
              <!-- No additional settings needed for this feature -->
              <p>This feature allows you to quickly correct darts during matches.</p>
              <p class="text-yellow-400">
                <strong>Note:</strong> This feature will not work in Safari due to security restrictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Quick Correction
          </h3>
          <p class="w-2/3 text-white/70">
            Adds a quick correction to dart throws, allowing you to fix incorrectly recognized darts.
          </p>
          <p class="mt-1 w-2/3 text-sm text-yellow-400">
            Not compatible with Safari browsers for now.
          </p>
        </div>
        <div class="flex">
          <AppToggle
            @update:model-value="toggleFeature"
            v-model="config.quickCorrection.enabled"
          />
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Quick Correction" class="size-full object-cover opacity-70">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import AppToggle from "../AppToggle.vue";

import { AutodartsToolsConfig, type IConfig } from "@/utils/storage";

const emit = defineEmits([ "toggle", "settingChange" ]);
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/quick-correction.png");

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();

  // Initialize quickCorrection if it doesn't exist
  if (config.value && !config.value.quickCorrection) {
    config.value.quickCorrection = {
      enabled: false,
    };
  }
});

watch(config, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
  emit("settingChange");
  console.log("Quick Correction setting changed");
}, { deep: true });

async function toggleFeature() {
  if (!config.value) return;
  config.value.quickCorrection.enabled = !config.value.quickCorrection.enabled;
}
</script>
