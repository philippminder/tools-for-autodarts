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
            <span>Settings - Caller</span>
            <div class="flex w-full flex-wrap gap-2 sm:w-auto">
              <AppButton @click="sortSoundsByTriggers" size="sm" class="!py-1 text-xs sm:text-sm" auto title="Sort sounds by their triggers">
                <span class="icon-[pixelarticons--sort-alphabetic] mr-1" />
                <span class="whitespace-nowrap">Sort by Triggers</span>
              </AppButton>
              <AppButton @click="openDeleteAllModal" size="sm" class="!py-1 text-xs sm:text-sm" auto type="danger" title="Delete all sounds">
                <span class="icon-[pixelarticons--trash] mr-1" />
                <span class="whitespace-nowrap">Delete All</span>
              </AppButton>
              <AppButton @click="openUploadModal" size="sm" class="!py-1 text-xs sm:text-sm" auto type="success">
                <span class="icon-[pixelarticons--upload] mr-1" />
                <span class="whitespace-nowrap">Upload Files</span>
              </AppButton>
            </div>
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure the caller settings for the game. Click the plus button to add a new sound.</p>

            <div class="flex flex-col gap-5 sm:flex-row">
              <div class="mt-2 flex items-center gap-2">
                <AppButton
                  @click="config.caller.callEveryDart = !config.caller.callEveryDart"
                  :type="config.caller.callEveryDart ? 'success' : 'default'"
                  class="aspect-square !size-10 rounded-full p-0"
                >
                  <span v-if="config.caller.callEveryDart" class="icon-[pixelarticons--check]" />
                  <span v-else class="icon-[pixelarticons--close]" />
                </AppButton>
                <div class="flex items-center gap-2">
                  <span>Call every dart</span>
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2">
                <AppButton
                  @click="config.caller.callCheckout = !config.caller.callCheckout"
                  :type="config.caller.callCheckout ? 'success' : 'default'"
                  class="aspect-square !size-10 rounded-full p-0"
                >
                  <span v-if="config.caller.callCheckout" class="icon-[pixelarticons--check]" />
                  <span v-else class="icon-[pixelarticons--close]" />
                </AppButton>
                <div class="flex items-center gap-2">
                  <span>Call checkout</span>
                </div>
              </div>
            </div>

            <div class="mt-2 flex items-center gap-2 text-sm">
              <span class="icon-[pixelarticons--drag-and-drop] text-white/60" />
              <p>Drag and drop sounds to change their order</p>
            </div>

            <div
              ref="soundsContainer"
              :key="containerKey"
              class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              <div
                @click="openAddSoundModal"
                class="flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-white/30 bg-transparent p-4 transition-colors hover:bg-white/10"
              >
                <div class="flex flex-col items-center">
                  <span class="icon-[pixelarticons--plus] mb-1 text-xl" />
                  <span>Add Sound</span>
                </div>
              </div>

              <!-- Display existing sounds -->
              <div
                v-for="(sound, index) in config.caller.sounds"
                :key="index"
                :data-id="index"
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

                <!-- Edit button -->
                <div class="absolute right-2 top-2 z-20">
                  <button
                    @click.stop="editSound(index)"
                    class="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
                  >
                    <span class="icon-[pixelarticons--edit] text-sm" />
                  </button>
                </div>

                <!-- Info section - used as drag handle -->
                <div
                  class="absolute inset-x-0 bottom-0 cursor-move bg-black/70 p-2 text-xs"
                >
                  <div class="truncate border-b border-white/30 pb-1 font-mono text-xxs" :title="sound.url">
                    {{ sound.url || "Uploaded" }}
                  </div>
                  <div class="mt-1 truncate font-mono uppercase">
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

    <!-- Sound Modal (Add/Edit) -->
    <AppModal
      @close="closeSoundModal"
      :show="showSoundModal"
      :title="isEditMode ? 'Edit Sound' : 'Add Sound'"
    >
      <div class="space-y-4">
        <div>
          <label for="sound-name" class="mb-1 block text-sm font-medium text-white">Sound Name (optional)</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-3 flex items-center text-white/60">
              <span class="icon-[pixelarticons--contact-multiple]" />
            </span>
            <AppInput
              id="sound-name"
              v-model="newSound.name"
              type="text"
              placeholder="Enter a name for this sound"
              class="pl-9"
            />
          </div>
        </div>

        <div v-if="!newSound.base64">
          <label for="sound-url" class="mb-1 block text-sm font-medium text-white">Sound URL (MP3, WAV, etc.)</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-3 flex items-center text-white/60">
              <span class="icon-[pixelarticons--link]" />
            </span>
            <AppInput
              id="sound-url"
              v-model="newSound.url"
              type="url"
              placeholder="https://example.com/sound.mp3"
              class="pl-9"
            />
          </div>
          <div v-if="urlError" class="mt-1 text-sm text-red-500">
            {{ urlError }}
          </div>
        </div>

        <hr class="border-white/20">

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
      </div>

      <template #footer>
        <AppButton @click="closeSoundModal">
          Cancel
        </AppButton>
        <AppButton @click="saveSound" type="success">
          Save
        </AppButton>
      </template>
    </AppModal>

    <!-- File Upload Modal -->
    <AppModal
      @close="closeUploadModal"
      :show="showUploadModal"
      title="Upload Sound Files"
    >
      <div class="space-y-4">
        <div
          @dragover.prevent="onFileDragOver"
          @dragleave.prevent="onFileDragLeave"
          @drop.prevent="onFileDrop"
          @click="triggerFileInput"
          :class="{ 'border-white/50 bg-white/10': isDragging }"
          class="flex h-40 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-white/30 transition-colors hover:bg-white/5"
        >
          <span class="icon-[pixelarticons--upload] mb-2 text-3xl text-white/70" />
          <p class="text-white/70">
            Drag and drop sound files here or click to browse
          </p>
          <p class="mt-1 text-xs text-white/50">
            Supported formats: MP3, WAV, OGG
          </p>
          <input
            @change="onFileSelect"
            ref="fileInput"
            type="file"
            accept="audio/*"
            multiple
            class="hidden"
          >
        </div>

        <!-- Selected files list -->
        <div v-if="selectedFiles.length > 0" class="mt-4">
          <h4 class="mb-2 text-sm font-medium">
            Selected Files ({{ selectedFiles.length }})
          </h4>
          <div class="max-h-60 overflow-y-auto rounded-md border border-white/20">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="flex items-center justify-between border-b border-white/10 p-2 last:border-b-0"
            >
              <div class="flex items-center">
                <span class="icon-[pixelarticons--volume-2] mr-2 text-white/70" />
                <span class="max-w-[calc(100%-2rem)] truncate">{{ file.name }}</span>
              </div>
              <button
                @click.stop="removeFile(index)"
                class="flex items-center justify-center text-red-500 hover:text-red-400"
              >
                <span class="icon-[pixelarticons--close]" />
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center">
          <label class="flex cursor-pointer items-center">
            <input
              v-model="generateTriggersFromFilenames"
              type="checkbox"
              class="form-checkbox size-4 rounded text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm">Generate triggers from filenames</span>
          </label>
          <span
            class="icon-[pixelarticons--info-box] ml-2 cursor-help text-white/50"
            title="If enabled, triggers will be automatically generated from filenames. For example, a file named '180.mp3' will trigger on '180' scores."
          />
        </div>
      </div>

      <template #footer>
        <AppButton @click="closeUploadModal">
          Cancel
        </AppButton>
        <AppButton
          @click="processFiles"
          type="success"
          :disabled="selectedFiles.length === 0 || isProcessing"
          :loading="isProcessing"
        >
          Save {{ selectedFiles.length }} Files
        </AppButton>
      </template>
    </AppModal>

    <!-- Notification -->
    <AppNotification
      @close="hideNotification"
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
    />

    <!-- Delete All Confirmation Modal -->
    <AppModal
      @close="closeDeleteAllModal"
      :show="showDeleteAllModal"
      title="Delete All Sounds"
    >
      <div class="space-y-4">
        <p>Are you sure you want to delete all sounds? This action cannot be undone.</p>
        <p class="text-sm text-white/60">
          This will remove all {{ config?.caller.sounds.length || 0 }} sounds from the caller.
        </p>
      </div>

      <template #footer>
        <AppButton @click="closeDeleteAllModal">
          Cancel
        </AppButton>
        <AppButton
          @click="deleteAllSounds"
          type="danger"
        >
          Delete All
        </AppButton>
      </template>
    </AppModal>
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
            Caller
          </h3>
          <p class="w-2/3 text-white/70">
            Call out scores, checkouts and special events during your matches with customizable sound effects.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggleSettings', 'caller')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppButton
            @click="toggleFeature"
            :type="config?.caller?.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config?.caller?.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Caller" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import Sortable from "sortablejs";
import AppButton from "../AppButton.vue";
import AppModal from "../AppModal.vue";
import AppTextarea from "../AppTextarea.vue";
import AppInput from "../AppInput.vue";
import AppNotification from "../AppNotification.vue";
import { AutodartsToolsConfig, type IConfig, type ISound, updateConfigIfChanged } from "@/utils/storage";
import { useNotification } from "@/composables/useNotification";

const emit = defineEmits([ "toggleSettings" ]);

const textareaPlaceholder = `180
s60
s50
s25
...`;

const activeSettings = useStorage("adt:active-settings", "caller");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/caller.png");
const showSoundModal = ref(false);
const isEditMode = ref(false);
const newSound = ref({
  url: "",
  text: "",
  name: "",
  base64: "",
});
const editingIndex = ref<number | null>(null);
const urlError = ref("");

// Sortable related refs
const soundsContainer = ref<HTMLElement | null>(null);
const containerKey = ref(0);
let sortableInstance: Sortable | null = null;

// File upload related refs
const showUploadModal = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const isDragging = ref(false);
const generateTriggersFromFilenames = ref(true);
const isProcessing = ref(false);

// Delete all modal
const showDeleteAllModal = ref(false);

// Computed property for lowercase text handling
const lowercaseText = computed({
  get: () => newSound.value.text,
  set: (val: string) => {
    newSound.value.text = val.toLowerCase();
  },
});

const { notification, showNotification, hideNotification } = useNotification();

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();

  // Initialize caller object if it doesn't exist
  if (!config.value?.caller || !config.value.caller.sounds) {
    config.value!.caller = {
      enabled: false,
      callEveryDart: false,
      callCheckout: false,
      sounds: [],
    };
  }

  // Initialize sortable after the DOM is updated
  nextTick(() => {
    initSortable();
  });
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "caller");
}, { deep: true });

// Initialize Sortable.js
function initSortable() {
  if (!soundsContainer.value) return;

  // Clean up any existing instance
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  // Create a new Sortable instance
  sortableInstance = Sortable.create(soundsContainer.value, {
    animation: 150,
    draggable: "[data-id]",
    filter: ".flex.h-32", // Don't make the "Add Sound" button draggable
    ghostClass: "bg-gray-700",
    handle: ".cursor-move", // Use the info section as the drag handle
    onEnd(evt) {
      // Only update if the position actually changed
      if (evt.oldIndex !== evt.newIndex && config.value?.caller.sounds) {
        // Get the moved item
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;

        // Update the data array to match the DOM
        if (oldIndex !== undefined && newIndex !== undefined) {
          const movedItem = config.value.caller.sounds.splice(oldIndex - 1, 1)[0];

          config.value.caller.sounds.splice(newIndex - 1, 0, movedItem);

          // Update the container key to force re-render
          containerKey.value++;

          // Show notification
          showNotification("Sound order updated");

          // Re-initialize sortable after a short delay to ensure DOM is updated
          setTimeout(() => {
            initSortable();
          }, 50);
        }
      }
    },
  });
}

function openAddSoundModal() {
  newSound.value = { url: "", text: "", name: "", base64: "" };
  isEditMode.value = false;
  editingIndex.value = null;
  showSoundModal.value = true;
}

function editSound(index: number) {
  const sound = config.value!.caller.sounds[index];
  newSound.value = {
    url: sound.url || "",
    text: sound.triggers?.join("\n") || "",
    name: sound.name || "",
    base64: sound.base64 || "",
  };
  isEditMode.value = true;
  editingIndex.value = index;
  showSoundModal.value = true;
}

function saveSound() {
  if (!config.value || (!newSound.value.url && !newSound.value.base64) || !newSound.value.text) {
    return;
  }

  // Check if URL starts with https://
  if (newSound.value.url && !newSound.value.url.startsWith("https://")) {
    urlError.value = "URL must start with https:// for security reasons";
    return;
  }

  // Reset error message
  urlError.value = "";

  // Convert text to array of triggers (split by newline and filter empty lines)
  const triggers = newSound.value.text
    .split("\n")
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0);

  // Create sound object
  const sound: ISound = {
    url: newSound.value.url.trim(),
    name: newSound.value.name.trim() || "", // Use the name if provided
    base64: newSound.value.base64 || "", // Preserve base64 data
    enabled: true, // New sounds are enabled by default
    triggers,
  };

  if (isEditMode.value && editingIndex.value !== null) {
    // Update existing sound
    const existingSound = config.value.caller.sounds[editingIndex.value];
    sound.enabled = existingSound.enabled; // Preserve enabled state when editing
    config.value.caller.sounds[editingIndex.value] = sound;
  } else {
    config.value.caller.sounds.unshift(sound);
  }

  // Reset form and close modal
  newSound.value = { url: "", text: "", name: "", base64: "" };
  showSoundModal.value = false;
  editingIndex.value = null;
}

function closeSoundModal() {
  newSound.value = { url: "", text: "", name: "", base64: "" };
  showSoundModal.value = false;
  editingIndex.value = null;
  urlError.value = "";
}

function removeSound(index: number) {
  if (config.value && config.value.caller.sounds) {
    config.value.caller.sounds.splice(index, 1);
  }
}

function toggleSound(index: number) {
  if (config.value && config.value.caller.sounds) {
    config.value.caller.sounds[index].enabled = !config.value.caller.sounds[index].enabled;
  }
}

// File upload related functions
function openUploadModal() {
  showUploadModal.value = true;
  selectedFiles.value = [];
}

function closeUploadModal() {
  showUploadModal.value = false;
  selectedFiles.value = [];
  isDragging.value = false;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileDragOver(event: DragEvent) {
  isDragging.value = true;
}

function onFileDragLeave(event: DragEvent) {
  isDragging.value = false;
}

function onFileDrop(event: DragEvent) {
  isDragging.value = false;
  if (!event.dataTransfer) return;

  const files = Array.from(event.dataTransfer.files).filter(file =>
    file.type.startsWith("audio/"),
  );

  if (files.length > 0) {
    selectedFiles.value = [ ...selectedFiles.value, ...files ];
  }
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  const files = Array.from(input.files).filter(file =>
    file.type.startsWith("audio/"),
  );

  if (files.length > 0) {
    selectedFiles.value = [ ...selectedFiles.value, ...files ];
  }

  // Reset the input so the same file can be selected again
  input.value = "";
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function extractTriggerFromFilename(filename: string): string[] {
  // Remove file extension
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf(".")).toLowerCase();

  // Replace hyphens with spaces but keep underscores
  const cleanName = nameWithoutExt.replace(/-/g, " ").trim();

  // Split by spaces and filter out empty strings
  const parts = cleanName.split(/\s+/).filter(Boolean);

  // Remove '+' and everything after it from each trigger
  return parts.map((part) => {
    const plusIndex = part.indexOf("+");
    return plusIndex !== -1 ? part.substring(0, plusIndex) : part;
  }).filter(Boolean);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

async function processFiles() {
  if (!config.value || selectedFiles.value.length === 0) return;

  isProcessing.value = true;

  try {
    for (const file of selectedFiles.value) {
      try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);

        // Get filename without extension
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf("."));

        // Generate triggers if option is enabled
        const triggers = generateTriggersFromFilenames.value
          ? extractTriggerFromFilename(file.name)
          : [];

        // Create sound object
        const sound: ISound = {
          name: nameWithoutExt,
          url: "", // Leave URL blank as requested
          base64: base64Data,
          enabled: true,
          triggers,
        };

        // Add to the beginning of sounds array
        config.value.caller.sounds.unshift(sound);

        // Update config and wait for 100ms
        const currentConfig = await AutodartsToolsConfig.getValue();
        await updateConfigIfChanged(currentConfig, config.value, "caller");
        await nextTick();
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Show notification
    showNotification(`Successfully added ${selectedFiles.value.length} sounds`);
  } catch (error) {
    console.error("Error processing files:", error);
    showNotification("Error processing files", "error");
  } finally {
    isProcessing.value = false;
    // Close modal and reset
    closeUploadModal();
  }
}

function sortSoundsByTriggers() {
  if (!config.value || !config.value.caller.sounds || config.value.caller.sounds.length <= 1) {
    return;
  }

  // Sort sounds by their first trigger alphabetically
  config.value.caller.sounds.sort((a, b) => {
    // Get first trigger from each sound, or empty string if no triggers
    const triggerA = a.triggers && a.triggers.length > 0 ? a.triggers[0] : "";
    const triggerB = b.triggers && b.triggers.length > 0 ? b.triggers[0] : "";

    // Sort numerically if both are numbers
    if (!Number.isNaN(Number(triggerA)) && !Number.isNaN(Number(triggerB))) {
      return Number(triggerA) - Number(triggerB);
    }

    // Otherwise sort alphabetically
    return triggerA.localeCompare(triggerB);
  });

  // Show notification
  showNotification("Caller sounds have been sorted by their triggers");
}

function openDeleteAllModal() {
  showDeleteAllModal.value = true;
}

function closeDeleteAllModal() {
  showDeleteAllModal.value = false;
}

async function deleteAllSounds() {
  if (!config.value) return;

  // Clear all sounds
  config.value.caller.sounds = [];

  // Update config
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "caller");

  // Close modal and show notification
  closeDeleteAllModal();
  showNotification("All caller sounds have been deleted", "error");
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
    showNotification("No audio source available for this sound", "error");
    return;
  }

  // Play the sound
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
    showNotification("Failed to play sound", "error");
  });
}

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.caller.enabled;
  config.value.caller.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggleSettings", "caller");
  }
}
</script>
