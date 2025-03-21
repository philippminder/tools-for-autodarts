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
        <div @click="$emit('toggle', 'auto-start')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
        <AppButton
          @click="toggleFeature"
          :type="localConfig.autoStart.enabled ? 'success' : 'default'"
          class="aspect-square !size-10 rounded-full p-0"
        >
          <span v-if="localConfig.autoStart.enabled" class="icon-[pixelarticons--check]" />
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
import AppButton from "../AppButton.vue";
import { type IConfig } from "@/utils/storage";
import { safeClone } from "@/utils/helpers";

const props = defineProps<{
  config: IConfig;
}>();

const emit = defineEmits([ "toggle", "settingChange" ]);
const localConfig = ref<IConfig>(safeClone(props.config));
const imageUrl = ref<string>();
const isUpdatingFromProps = ref(false);
const isEmittingChanges = ref(false);

function toggleFeature() {
  if (!localConfig.value) return;

  // Toggle the feature
  const wasEnabled = localConfig.value.autoStart.enabled;
  localConfig.value.autoStart.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggle", "auto-start");
  }
}

onMounted(() => {
  imageUrl.value = browser.runtime.getURL("images/auto-start.png");
});

// Watch for prop changes to update local config
watch(() => props.config, (newConfig) => {
  if (newConfig && !isEmittingChanges.value) {
    isUpdatingFromProps.value = true;
    localConfig.value = safeClone(newConfig);
    nextTick(() => {
      isUpdatingFromProps.value = false;
    });
  }
});

// Watch for local changes to emit to parent
watch(localConfig, () => {
  if (!isUpdatingFromProps.value) {
    isEmittingChanges.value = true;
    emit("settingChange", { autoStart: localConfig.value.autoStart });
    nextTick(() => {
      isEmittingChanges.value = false;
    });
  }
}, { deep: true });
</script>
