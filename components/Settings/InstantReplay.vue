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
            Settings - Instant Replay
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Adjust your instant replay settings here.</p>

            <div v-if="!hasCameraPermission && !cameraError">
              <p class="mb-2">
                Camera access is required for this feature.
              </p>
              <AppButton @click="requestCameraAccess" class="mb-4">
                <span class="icon-[pixelarticons--camera] mr-2" />
                <span>Allow Camera Access</span>
              </AppButton>
            </div>

            <div v-if="cameraError" class="mb-4 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
              <p>{{ cameraError }}</p>
            </div>

            <div v-if="hasCameraPermission" class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- Left side: Settings -->
              <div class="space-y-4">
                <div>
                  <label class="mb-1 block text-sm font-medium">Select Camera</label>
                  <AppSelect
                    v-model="selectedDeviceId"
                    class="w-full"
                    :options="cameraOptions"
                    :disabled="!cameraDevices.length"
                  />
                </div>

                <div class="relative w-36">
                  <AppInput
                    v-model="duration"
                    type="number"
                    label="Recording Duration (seconds)"
                    min="5"
                    max="30"
                    class="w-full"
                    size="sm"
                  />
                </div>
                <p class="text-sm text-white/60">
                  Set how many seconds of video should be saved for instant replay (5-30 seconds).
                </p>

                <div>
                  <label class="mb-1 block text-sm font-medium">View Mode</label>
                  <AppSelect
                    v-model="viewMode"
                    :options="[
                      { value: 'full-page', label: 'Full Page' },
                      { value: 'board-only', label: 'Board Only' },
                    ]"
                    class="w-full"
                  />
                </div>
                <p class="text-sm text-white/60">
                  Control how the replay is displayed. Full Page covers the entire screen, Board Only shows just over the dartboard.
                </p>

                <div>
                  <label class="mb-1 block text-sm font-medium">Camera Zoom</label>
                  <div class="flex items-center space-x-4">
                    <span class="text-sm">1x</span>
                    <AppSlider
                      v-model="zoomLevel"
                      :min="1"
                      :max="5"
                      :step="0.1"
                      class="w-full"
                    />
                    <span class="text-sm">5x</span>
                  </div>
                  <p class="mt-1 text-sm text-white/60">
                    Zoom level: {{ zoomLevel.toFixed(1) }}x
                  </p>
                </div>

                <div v-if="zoomLevel > 1" class="space-y-3">
                  <div>
                    <label class="mb-1 block text-sm font-medium">Position X</label>
                    <div class="flex items-center space-x-4">
                      <span class="text-sm">Left</span>
                      <AppSlider
                        v-model="positionX"
                        :min="-100"
                        :max="100"
                        :step="1"
                        class="w-full"
                      />
                      <span class="text-sm">Right</span>
                    </div>
                  </div>

                  <div>
                    <label class="mb-1 block text-sm font-medium">Position Y</label>
                    <div class="flex items-center space-x-4">
                      <span class="text-sm">Up</span>
                      <AppSlider
                        v-model="positionY"
                        :min="-100"
                        :max="100"
                        :step="1"
                        class="w-full"
                      />
                      <span class="text-sm">Down</span>
                    </div>
                  </div>
                  <p class="mt-1 text-sm text-white/60">
                    Position the camera view when zoomed in.
                  </p>
                </div>
              </div>

              <!-- Right side: Camera Preview -->
              <div>
                <label class="mb-1 block text-sm font-medium">Camera Preview</label>
                <div class="relative w-full overflow-hidden rounded bg-black/40 shadow-inner">
                  <video
                    ref="videoPreview"
                    class="aspect-video w-full rounded object-cover"
                    autoplay
                    muted
                    playsinline
                    :style="{ transform: `scale(${zoomLevel}) translate(${positionX}%, ${positionY}%)` }"
                  />
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
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 flex items-center font-bold uppercase">
            Instant Replay
            <span class="icon-[material-symbols--settings-alert-outline-rounded] ml-2 size-5" />
          </h3>
          <p class="w-2/3 text-white/70">
            Records the last several seconds of your webcam footage to review throws or save highlights.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggle', 'instant-replay')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppToggle
            @update:model-value="toggleFeature"
            v-model="config.instantReplay.enabled"
          />
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import AppInput from "../AppInput.vue";
import AppToggle from "../AppToggle.vue";
import AppButton from "../AppButton.vue";
import AppSelect from "../AppSelect.vue";
import AppSlider from "../AppSlider.vue";

import { AutodartsToolsConfig, type IConfig } from "@/utils/storage";

const emit = defineEmits([ "toggle", "settingChange" ]);
const config = ref<IConfig>();
const videoPreview = ref<HTMLVideoElement | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const hasCameraPermission = ref(false);
const cameraError = ref<string | null>(null);
const cameraDevices = ref<MediaDeviceInfo[]>([]);

// Computed properties
const cameraOptions = computed(() => {
  return cameraDevices.value.map(device => ({
    label: device.label || `Camera ${device.deviceId.substring(0, 5)}...`,
    value: device.deviceId,
  }));
});

const selectedDeviceId = computed({
  get: () => config.value?.instantReplay?.deviceId || "",
  set: (value: string) => {
    if (config.value?.instantReplay) {
      config.value.instantReplay.deviceId = value;
      updateCameraPreview(value);
    }
  },
});

const duration = computed({
  get: () => config.value?.instantReplay?.duration?.toString() || "10",
  set: (value: string) => {
    if (config.value?.instantReplay) {
      const numValue = Number.parseInt(value, 10);
      // Clamp value between 5 and 30 seconds
      config.value.instantReplay.duration = Math.min(Math.max(numValue, 5), 30);
    }
  },
});

const viewMode = computed({
  get: () => config.value?.instantReplay?.viewMode || "board-only",
  set: (value: "full-page" | "board-only") => {
    if (config.value?.instantReplay) {
      config.value.instantReplay.viewMode = value;
    }
  },
});

const zoomLevel = computed({
  get: () => config.value?.instantReplay?.zoom || 1,
  set: (value: number) => {
    if (config.value?.instantReplay) {
      config.value.instantReplay.zoom = value;
    }
  },
});

const positionX = computed({
  get: () => config.value?.instantReplay?.positionX ?? 0,
  set: (value: number) => {
    if (config.value?.instantReplay) {
      config.value.instantReplay.positionX = value;
    }
  },
});

const positionY = computed({
  get: () => config.value?.instantReplay?.positionY ?? 0,
  set: (value: number) => {
    if (config.value?.instantReplay) {
      config.value.instantReplay.positionY = value;
    }
  },
});

// Check if the browser supports getUserMedia
const isCameraSupported = computed(() => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
});

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();

  // Only load config on mount, don't check camera permissions yet
});

// Watch for changes in the data-feature-index attribute to detect when settings are opened
watch(() => !getCurrentInstance()?.attrs["data-feature-index"], async (isSettingsPanel, wasPanelBefore) => {
  // Check if we're transitioning from feature card to settings panel
  if (isSettingsPanel && !wasPanelBefore) {
    await checkCameraPermission();
  }
}, { immediate: true });

onUnmounted(() => {
  // Clean up media stream if it exists
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
  }
});

watch(config, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
  emit("settingChange");
  console.log("Instant Replay setting changed");
}, { deep: true });

async function checkCameraPermission() {
  if (!isCameraSupported.value) {
    cameraError.value = "Your browser does not support camera access.";
    return;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        hasCameraPermission.value = true;
        stream.getTracks().forEach(track => track.stop());
        loadCameraDevices();
      })
      .catch(() => {
        hasCameraPermission.value = false;
      });
  } catch (error) {
    console.error("Error checking camera permission:", error);
  }
}

async function requestCameraAccess() {
  if (!isCameraSupported.value) {
    cameraError.value = "Your browser does not support camera access.";
    return;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        hasCameraPermission.value = true;
        // Stop the stream as we just needed it for permission
        stream.getTracks().forEach(track => track.stop());
        // Now load available devices
        loadCameraDevices();
        cameraError.value = null;
      })
      .catch((error) => {
        console.error("Camera access denied:", error);
        cameraError.value = "Camera access was denied. Please allow camera access in your browser settings.";
        hasCameraPermission.value = false;
      });
  } catch (error) {
    console.error("Error requesting camera access:", error);
    cameraError.value = "An error occurred while trying to access the camera.";
  }
}

async function loadCameraDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameraDevices.value = devices.filter(device => device.kind === "videoinput");

    // If we have devices and a selected device in config
    if (cameraDevices.value.length > 0) {
      // If we have a saved device ID and it's in the list
      const savedDeviceId = config.value?.instantReplay?.deviceId;
      if (savedDeviceId && cameraDevices.value.some(d => d.deviceId === savedDeviceId)) {
        updateCameraPreview(savedDeviceId);
      } else {
        // Use the first available device
        const firstDeviceId = cameraDevices.value[0].deviceId;
        if (config.value?.instantReplay) {
          config.value.instantReplay.deviceId = firstDeviceId;
        }
        updateCameraPreview(firstDeviceId);
      }
    }
  } catch (error) {
    console.error("Error loading camera devices:", error);
    cameraError.value = "Failed to load camera devices.";
  }
}

async function updateCameraPreview(deviceId: string) {
  if (!hasCameraPermission.value || !videoPreview.value) return;

  try {
    // Stop any existing stream
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop());
    }

    // Start a new stream with the selected device
    const constraints = {
      video: { deviceId: { exact: deviceId } },
    };

    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    videoPreview.value.srcObject = mediaStream.value;
  } catch (error) {
    console.error("Error updating camera preview:", error);
    cameraError.value = "Failed to access the selected camera.";
  }
}

async function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.instantReplay.enabled;
  config.value.instantReplay.enabled = !wasEnabled;

  // If we're enabling the feature and don't have camera permission yet, request it
  if (!wasEnabled && !hasCameraPermission.value) {
    await checkCameraPermission();
    await nextTick();
    emit("toggle", "instant-replay");
  } else if (!wasEnabled) {
    // Just open settings if we already have permission
    await nextTick();
    emit("toggle", "instant-replay");
  }
}
</script>
