<template>
  <template v-if="!$attrs['data-feature-index']">
    <!-- Empty settings panel since this feature doesn't need settings -->
    <div class="adt-container min-h-56">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Shuffle Players
          </h3>
          <div class="space-y-3 text-white/70">
            <p>This feature doesn't have any additional settings.</p>
            <p>When enabled, a shuffle button will appear on the lobby page allowing you to randomly reorder players.</p>
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
            Shuffle Players
          </h3>
          <p class="w-2/3 text-white/70">
            Adds a button to the lobby page to randomly shuffle the order of players in <b>private lobbies</b>.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggle', 'shuffle-players')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppButton
            @click="toggleFeature"
            :type="config.shufflePlayers.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.shufflePlayers.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Shuffle Players" class="size-full object-cover opacity-70">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig } from "@/utils/storage";

const emit = defineEmits([ "toggle", "settingChange" ]);
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/shuffle-players.png");

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.shufflePlayers.enabled;
  config.value.shufflePlayers.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggle", "shuffle-players");
  }
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
  emit("settingChange");
  console.log("Shuffle Players setting changed");
}, { deep: true });
</script>
