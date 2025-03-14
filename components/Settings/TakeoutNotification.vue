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
            Settings - Takeout Notification
          </h3>
          <div class="space-y-3 text-white/70">
            <p>This feature doesn't have any additional settings.</p>
            <p>When enabled, a notification will be displayed whenever takeout of darts is in progress.</p>
            <p class="italic text-white/50">
              This feature is only available when takeout recognition is not disabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      @click="activeSettings = 'takeout-notification'"
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
      :class="{ 'opacity-50': config.disableTakeout.enabled }"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Takeout Notification
          </h3>
          <p class="w-2/3 text-white/70">
            Displays a notification whenever takeout of darts is in progress.
          </p>
          <p v-if="config.disableTakeout.enabled" class="mt-2 text-sm italic text-amber-400">
            Requires takeout recognition to be enabled
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="config.takeout.enabled = !config.takeout.enabled"
            :type="config.takeout.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
            :disabled="config.disableTakeout.enabled"
          >
            <span v-if="config.takeout.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Takeout Notification" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, defaultConfig } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "takeout-notification");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/takeout-notification.png");

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
