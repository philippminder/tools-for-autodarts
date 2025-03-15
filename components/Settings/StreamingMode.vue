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
            Settings - Streaming Mode
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure the streaming mode settings for your broadcasts.</p>

            <div class="mt-4 space-y-4">
              <!-- Background Mode Selection -->
              <h4 class="font-semibold">
                Background Type
              </h4>
              <AppRadioGroup
                v-model="backgroundMode"
                :options="[
                  { label: 'Image Background', value: true },
                  { label: 'Chroma Key Color', value: false },
                ]"
              />

              <!-- Chroma Key Color Selection (when in chroma key mode) -->
              <div v-if="!backgroundMode" class="mt-4">
                <h4 class="mb-2 font-semibold">
                  Chroma Key Color
                </h4>
                <div class="grid grid-cols-2 gap-4">
                  <div class="relative min-h-14 w-full">
                    <input
                      v-model="config.streamingMode.chromaKeyColor"
                      type="color"
                      class="size-full overflow-hidden rounded-md border-none border-transparent p-0 outline-none"
                    >
                    <span
                      class="pointer-events-none absolute inset-0 flex items-center justify-center p-2 text-center text-xs drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                    >Chroma Key Color</span>
                  </div>
                  <div
                    class="flex h-14 w-full items-center justify-center rounded-md"
                    :style="{ backgroundColor: config.streamingMode.chromaKeyColor }"
                  >
                    <span class="text-xs text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Preview</span>
                  </div>
                </div>
              </div>

              <!-- Background Image Upload (when in image mode) -->
              <div v-if="backgroundMode" class="grid grid-cols-[auto_1fr] items-center gap-4">
                <AppButton
                  @click="handleStreamingModeBackgroundFileSelect"
                  class="whitespace-nowrap"
                >
                  <span class="icon-[pixelarticons--image] mr-2" />
                  <span>Upload Background</span>
                </AppButton>
                <p>Upload a custom background image for streaming mode</p>
                <input @change="handleStreamingModeBackgroundFileSelected" ref="streamingModeBackgroundFileSelect" type="file" accept="image/*" class="hidden">
              </div>

              <!-- Reset Background Button -->
              <div v-if="backgroundMode && config.streamingMode.image" class="grid grid-cols-[auto_1fr] items-center gap-4">
                <AppButton
                  @click="handleStreamingModeBackgroundReset"
                  type="danger"
                  class="whitespace-nowrap"
                >
                  <span class="icon-[pixelarticons--close] mr-2" />
                  <span>Reset Background</span>
                </AppButton>
                <p>Remove the current background image</p>
              </div>

              <!-- Background Preview -->
              <div v-if="backgroundMode && config.streamingMode.image" class="mt-4">
                <p class="mb-2">
                  Current Background:
                </p>
                <img :src="config.streamingMode.image" alt="Streaming Mode Background" class="max-h-40 rounded border border-white/10">
              </div>

              <!-- Display Options -->
              <div class="mt-6 space-y-3">
                <h4 class="font-semibold">
                  Display Options
                </h4>

                <!-- Display Throws Toggle -->
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                  <AppToggle v-model="config.streamingMode.throws" />
                  <p>Display Throws</p>
                </div>

                <!-- Display Board Toggle -->
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                  <AppToggle v-model="config.streamingMode.board" />
                  <p>Display Board</p>
                </div>

                <!-- Board Mode Selection (only if board display is enabled) -->
                <div v-if="config.streamingMode.board" class="grid grid-cols-[auto_1fr] items-center gap-4 pl-8">
                  <AppRadioGroup
                    v-model="config.streamingMode.boardImage"
                    :options="[
                      { label: 'Live Board', value: true },
                      { label: 'Image Board', value: false },
                    ]"
                  />
                </div>

                <!-- Display AVG Score Toggle -->
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                  <AppToggle v-model="config.streamingMode.avg" />
                  <p>Display AVG Score</p>
                </div>
              </div>

              <!-- Footer Text Input -->
              <div class="mt-6">
                <p class="mb-2 font-semibold">
                  Overlay Footer Text
                </p>
                <input
                  v-model="config.streamingMode.footerText"
                  placeholder="Enter text to display at the bottom of the streaming overlay"
                  class="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 outline-none placeholder:opacity-50"
                >
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
      @click="activeSettings = 'streaming-mode'"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Streaming Mode
          </h3>
          <p class="w-2/3 text-white/70">
            Optimizes the interface for streaming with custom backgrounds and layouts.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="toggleStreamingMode"
            :type="streamingModeEnabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="streamingModeEnabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Streaming Mode" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import AppToggle from "../AppToggle.vue";
import AppRadioGroup from "../AppRadioGroup.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "streaming-mode");
const streamingModeEnabled = useStorage("adt:streaming-mode-enabled", false);
const config = ref<IConfig>();
const streamingModeBackgroundFileSelect = ref() as Ref<HTMLInputElement>;
const backgroundMode = ref(true);
const imageUrl = browser.runtime.getURL("/images/streaming-mode.png");

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
  // Initialize backgroundMode based on config
  if (config.value) {
    backgroundMode.value = config.value.streamingMode.backgroundImage;
  }
});

// Watch for changes to backgroundMode and update config
watch(backgroundMode, (newValue) => {
  if (config.value) {
    config.value.streamingMode.backgroundImage = newValue;
  }
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "streamingMode");
}, { deep: true });

function toggleStreamingMode() {
  streamingModeEnabled.value = !streamingModeEnabled.value;
  if (config.value) {
    config.value.streamingMode.enabled = streamingModeEnabled.value;
  }
}

function handleStreamingModeBackgroundFileSelect() {
  streamingModeBackgroundFileSelect.value.click();
}

function handleStreamingModeBackgroundFileSelected() {
  const file = streamingModeBackgroundFileSelect.value.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (config.value) {
      config.value.streamingMode.image = reader.result as string;
    }
  };
  reader.readAsDataURL(file);

  streamingModeBackgroundFileSelect.value.value = "";
}

function handleStreamingModeBackgroundReset() {
  if (config.value) {
    config.value.streamingMode.image = "";
  }
}
</script>
