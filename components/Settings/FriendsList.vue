<template>
  <div v-bind="$attrs">
    <!-- Feature Card -->
    <div
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 flex items-center gap-2 font-bold uppercase">
            Friends List
            <span class="ml-2 inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-500 ring-1 ring-inset ring-amber-500/20">Public Beta</span>
          </h3>
          <p class="text-white/70">
            Your personal friends list. Open a lobby and invite friends to join. <b>You can only add friends once you've seen them in a game.</b>
          </p>
          <p class="mt-2 text-xs italic text-amber-500/80">
            You can only see your friends online status and invite them to join if they have also added you as a friend.
            This feature may stop working and get removed once the Autodarts Team releases their official friends list.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggle', 'friends-list')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppToggle
            @update:model-value="toggleFeature"
            v-model="config.friendsList.enabled"
          />
        </div>
      </div>
    </div>

    <!-- Notification -->
    <AppNotification
      @close="showNotification = false"
      :show="showNotification"
      :message="notificationMessage"
      :type="notificationType"
    />
  </div>
</template>

<script setup lang="ts">
import AppToggle from "../AppToggle.vue";
import AppNotification from "../AppNotification.vue";
import { type IConfig, defaultConfig } from "@/utils/storage";
import { AutodartsToolsConfig } from "@/utils/storage";

const emit = defineEmits([ "toggle", "settingChange" ]);
const config = ref<IConfig>();

// Notification state
const showNotification = ref(false);
const notificationMessage = ref("");
const notificationType = ref<"success" | "error">("success");

function showMessage(message: string, type: "success" | "error" = "success") {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;

  // Auto-hide notification after 3 seconds
  setTimeout(() => {
    showNotification.value = false;
  }, 3000);
}

async function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.friendsList.enabled;
  config.value.friendsList.enabled = !wasEnabled;

  await nextTick();
  emit("toggle", "friends-list");

  // If we're enabling the feature
  if (!wasEnabled) {
    showMessage("Friends List enabled! Navigating to Autodarts lobby...");

    // Navigate to Autodarts lobby after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    // If disabling the feature
    showMessage("Friends List disabled. Reloading page...");

    // Reload the page after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
  if (config.value && !config.value.friendsList) {
    config.value.friendsList = defaultConfig.friendsList;
  }
});

// Watch for prop changes to update local config
watch(config, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
  emit("settingChange");
  console.log("Friends List setting changed");
}, { deep: true });
</script>
