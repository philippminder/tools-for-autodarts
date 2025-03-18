<template>
  <template v-if="!$attrs['data-feature-index']">
    <!-- Settings Panel -->
    <div
      v-if="config"
      class="adt-container min-h-56"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 flex flex-col items-start gap-2 font-bold uppercase sm:flex-row sm:items-center sm:justify-between">
            <span>Settings - Sound FX</span>
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure sound effects that play during the game for special events.</p>

            <div class="space-y-4">
              <div>
                <label for="sound-name" class="mb-1 block text-sm font-medium text-white">Sound Name (optional)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-3 flex items-center text-white/60">
                    <span class="icon-[pixelarticons--contact-multiple]" />
                  </span>
                  <AppInput
                    id="sound-name"
                    v-model="soundName"
                    type="text"
                    placeholder="Enter a name for this sound"
                    class="pl-9"
                  />
                </div>
              </div>

              <div>
                <label for="sound-file" class="mb-1 block text-sm font-medium text-white">Sound File</label>
                <input
                  @change="handleFileUpload"
                  id="sound-file"
                  type="file"
                  accept="audio/*"
                  class="w-full rounded border-white/30 bg-black/30 p-2"
                >
              </div>

              <div>
                <label for="sound-text" class="mb-1 flex items-center justify-between text-sm font-medium text-white">
                  <span>Triggers <span class="text-xs text-white/60">(one per line)</span></span>
                  <a
                    href="https://github.com/creazy231/tools-for-autodarts/tree/tools-2.0.0?tab=readme-ov-file#supported-triggers"
                    target="_blank"
                    class="text-blue-400 hover:text-blue-300"
                  >
                    View supported triggers
                  </a>
                </label>
                <AppTextarea
                  id="sound-text"
                  v-model="lowercaseText"
                  :placeholder="textareaPlaceholder"
                  monospace
                  :rows="6"
                  :max-rows="10"
                />
              </div>

              <div class="mt-2 flex items-center gap-2">
                <AppButton
                  @click="soundEnabled = !soundEnabled"
                  :type="soundEnabled ? 'success' : 'default'"
                  class="aspect-square !size-10 rounded-full p-0"
                >
                  <span v-if="soundEnabled" class="icon-[pixelarticons--check]" />
                  <span v-else class="icon-[pixelarticons--close]" />
                </AppButton>
                <div class="flex items-center gap-2">
                  <span>Enabled</span>
                </div>
              </div>

              <AppButton @click="addSound" class="w-full">
                Add Sound
              </AppButton>

              <div v-if="config.soundFx.sounds.length > 0" class="mt-4 space-y-2">
                <h4 class="text-sm font-medium">
                  Added Sounds
                </h4>
                <div
                  v-for="(sound, index) in config.soundFx.sounds"
                  :key="index"
                  class="group relative h-32 overflow-hidden rounded-md border border-white/30 bg-black/30"
                  :class="{
                    'opacity-50': !sound.enabled,
                  }"
                >
                  <!-- Disabled overlay -->
                  <div v-if="!sound.enabled" class="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span class="icon-[pixelarticons--close-circle] text-2xl text-white/70" />
                  </div>

                  <!-- Toggle button -->
                  <div class="absolute left-2 top-2 z-20">
                    <button
                      @click.stop="toggleSound(index)"
                      class="flex size-8 items-center justify-center rounded-full border border-solid p-0"
                      :class="sound.enabled
                        ? 'border-[var(--chakra-colors-borderGreen)] bg-[var(--chakra-colors-glassGreen)] text-[var(--chakra-colors-white)] hover:bg-[rgba(58,255,0,0.3)]'
                        : 'bg-[var(--chakra-colors-whiteAlpha-200)] text-[var(--chakra-colors-whiteAlpha-900)] hover:bg-[var(--chakra-colors-whiteAlpha-300)]'"
                    >
                      <span v-if="sound.enabled" class="icon-[pixelarticons--check]" />
                      <span v-else class="icon-[pixelarticons--close]" />
                    </button>
                  </div>

                  <!-- Sound name (centered) -->
                  <div v-if="sound.name" class="absolute left-1/2 top-3.5 z-20 max-w-full -translate-x-1/2 truncate px-10">
                    <div class="truncate rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                      {{ sound.name }}
                    </div>
                  </div>

                  <!-- Info section -->
                  <div
                    class="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-xs"
                  >
                    <div class="truncate font-mono uppercase">
                      {{ sound.triggers?.join(', ') || 'No triggers' }}
                    </div>
                    <div class="mt-1 flex justify-between">
                      <button
                        @click.stop="playSound(sound)"
                        class="text-[var(--chakra-colors-borderGreen)] hover:text-[var(--chakra-colors-glassGreen)]"
                        title="Play sound"
                      >
                        <span class="icon-[pixelarticons--play] text-sm" />
                      </button>
                      <button
                        @click.stop="removeSound(index)"
                        class="text-[var(--chakra-colors-borderRed)] hover:text-[var(--chakra-colors-glassRed)]"
                      >
                        <span class="icon-[pixelarticons--trash] text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppNotification
      @close="notification.show = false"
      v-if="notification.show"
      :message="notification.message"
      :type="notification.type"
    />
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
            Sound FX
          </h3>
          <p class="w-2/3 text-white/70">
            Play sound effects for special events like 180s, checkouts, and match wins.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggleSettings', 'sound-fx')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppButton
            @click="config.soundFx.enabled = !config.soundFx.enabled"
            :type="config.soundFx?.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.soundFx?.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Sound FX" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { AutodartsToolsConfig, updateConfigIfChanged } from "@/utils/storage";
import type { IConfig, ISound } from "@/utils/storage";
import AppButton from "@/components/AppButton.vue";
import AppInput from "@/components/AppInput.vue";
import AppTextarea from "@/components/AppTextarea.vue";
import AppNotification from "@/components/AppNotification.vue";

const emit = defineEmits([ "toggleSettings" ]);
const config = ref<IConfig>();

const imageUrl = browser.runtime.getURL("/images/sound-fx.png");

const soundName = ref("");
const soundUrl = ref("");
const soundBase64 = ref("");
const soundText = ref("");
const soundEnabled = ref(true);
const textareaPlaceholder = `180
s60
s50
s25
...`;

const notification = ref<{
  show: boolean;
  message: string;
  type: "success" | "error";
}>({
  show: false,
  message: "",
  type: "success",
});

// Computed property for lowercase text handling
const lowercaseText = computed({
  get: () => soundText.value,
  set: (val: string) => {
    soundText.value = val.toLowerCase();
  },
});

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  if (!file.type.startsWith("audio/")) {
    notification.value = {
      show: true,
      message: "Please upload an audio file",
      type: "error",
    };
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      soundBase64.value = e.target?.result as string;
      soundUrl.value = URL.createObjectURL(file);
    };
    reader.readAsDataURL(file);
  } catch (error) {
    notification.value = {
      show: true,
      message: "Error reading file",
      type: "error",
    };
  }
}

function addSound() {
  if (!config.value) return;

  if (!soundName.value || !soundBase64.value || !soundText.value) {
    notification.value = {
      show: true,
      message: "Please fill in all fields",
      type: "error",
    };
    return;
  }

  // Convert text to array of triggers (split by newline and filter empty lines)
  const triggers = soundText.value
    .split("\n")
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0);

  const newSound: ISound = {
    name: soundName.value,
    url: soundUrl.value,
    base64: soundBase64.value,
    enabled: soundEnabled.value,
    triggers,
  };

  config.value.soundFx.sounds.push(newSound);
  updateConfigIfChanged(config.value, config.value, "soundFx");

  // Reset form
  soundName.value = "";
  soundUrl.value = "";
  soundBase64.value = "";
  soundText.value = "";
  soundEnabled.value = true;

  notification.value = {
    show: true,
    message: "Sound added successfully",
    type: "success",
  };
}

function removeSound(index: number) {
  if (!config.value) return;
  config.value.soundFx.sounds.splice(index, 1);
  updateConfigIfChanged(config.value, config.value, "soundFx");
}

function toggleSound(index: number) {
  if (!config.value) return;
  config.value.soundFx.sounds[index].enabled = !config.value.soundFx.sounds[index].enabled;
  updateConfigIfChanged(config.value, config.value, "soundFx");
}

function playSound(sound: ISound) {
  // Create an audio element
  const audio = new Audio();

  // Set the source based on what's available
  if (sound.base64) {
    audio.src = sound.base64;
  } else if (sound.url) {
    audio.src = sound.url;
  } else {
    // No audio source available
    notification.value = {
      show: true,
      message: "No audio source available for this sound",
      type: "error",
    };
    return;
  }

  // Play the sound
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
    notification.value = {
      show: true,
      message: "Failed to play sound",
      type: "error",
    };
  });
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();

  // Initialize soundFx object if it doesn't exist
  if (!config.value?.soundFx) {
    config.value!.soundFx = {
      enabled: false,
      sounds: [],
    };
  }
});

watch(
  () => config.value?.soundFx?.enabled,
  async (newValue) => {
    if (config.value) {
      await updateConfigIfChanged(config.value, config.value, "soundFx");
    }
  },
);
</script>
