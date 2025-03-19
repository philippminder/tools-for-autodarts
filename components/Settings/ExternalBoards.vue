<template>
  <div
    v-if="config"
    class="adt-container h-56 transition-transform hover:-translate-y-0.5"
  >
    <div class="relative z-10 flex h-full flex-col justify-between">
      <div>
        <h3 class="mb-1 font-bold uppercase">
          External Boards
        </h3>
        <p class="w-2/3 text-white/70">
          Allows you to save external Boards to easily follow them.
        </p>
      </div>
      <div class="flex">
        <div @click="$emit('toggleSettings', 'external-boards')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
        <AppButton
          @click="toggleFeature"
          :type="config.externalBoards.enabled ? 'success' : 'default'"
          class="aspect-square !size-10 rounded-full p-0"
        >
          <span v-if="config.externalBoards.enabled" class="icon-[pixelarticons--check]" />
          <span v-else class="icon-[pixelarticons--close]" />
        </AppButton>
      </div>
    </div>
    <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
      <img :src="imageUrl" alt="External Boards" class="size-full object-cover">
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useStorage } from "@vueuse/core";
import AppButton from "@/components/AppButton.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const emit = defineEmits([ "toggleSettings" ]);
const activeSettings = useStorage("adt:active-settings", "external-boards");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/external-boards.png");

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.externalBoards.enabled;
  config.value.externalBoards.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggleSettings", "external-boards");
  }
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await nextTick();
  await updateConfigIfChanged(currentConfig, config.value, "externalBoards");
}, { deep: true });
</script>
