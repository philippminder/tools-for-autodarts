<template>
  <template v-if="!$attrs['data-feature-index']">
    <!-- Empty settings panel since this feature doesn't need settings -->
    <div class="adt-container min-h-56">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Team Lobby
          </h3>
          <div class="space-y-3 text-white/70">
            <p>This feature doesn't have any additional settings.</p>
            <p>When enabled, the first player is removed from the lobby and every following player is added to the board.</p>
            <p class="italic text-white/50">
              This feature only works in private lobbies.
            </p>
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
            Team Lobby
          </h3>
          <p class="w-2/3 text-white/70">
            Removes first player from the lobby and adds every following player to the board. Works only in <b>private lobbies</b>.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggleSettings', 'team-lobby')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppButton
            @click="toggleFeature"
            :type="config.teamLobby.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.teamLobby.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Team Lobby" class="size-full object-cover opacity-70">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const emit = defineEmits([ "toggleSettings" ]);
const activeSettings = useStorage("adt:active-settings", "team-lobby");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/team-lobby.png");

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.teamLobby.enabled;
  config.value.teamLobby.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggleSettings", "team-lobby");
  }
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "teamLobby");
}, { deep: true });
</script>
