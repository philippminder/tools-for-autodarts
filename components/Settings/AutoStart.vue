<template>
  <!-- Feature Card -->
  <div
    v-if="config"
    class="adt-container h-56 transition-transform hover:-translate-y-0.5"
  >
    <div class="relative z-10 flex h-full flex-col justify-between">
      <div>
        <h3 class="mb-1 font-bold uppercase">
          Autostart
        </h3>
        <p class="w-2/3 text-white/70">
          Displays a button to enable autostart on the lobby page. If autostart is enabled, it will automatically start the game after <b>3 seconds</b> once a player joins the lobby.
        </p>
      </div>
      <div class="flex">
        <div @click="$emit('toggleSettings', 'auto-start')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
        <AppButton
          @click="toggleFeature"
          :type="config.autoStart.enabled ? 'success' : 'default'"
          class="aspect-square !size-10 rounded-full p-0"
        >
          <span v-if="config.autoStart.enabled" class="icon-[pixelarticons--check]" />
          <span v-else class="icon-[pixelarticons--close]" />
        </AppButton>
      </div>
    </div>
    <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
      <img :src="imageUrl" alt="Auto Start" class="size-full object-cover opacity-70">
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const emit = defineEmits([ "toggleSettings" ]);
const activeSettings = useStorage("adt:active-settings", "auto-start");
const config = ref<IConfig>();
const imageUrl = ref<string>();

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.autoStart.enabled;
  config.value.autoStart.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggleSettings", "auto-start");
  }
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
  imageUrl.value = browser.runtime.getURL("images/auto-start.png");
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "autoStart");
}, { deep: true });
</script>
