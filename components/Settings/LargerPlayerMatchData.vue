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
            Settings - Larger Player Match Data
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure the size of player match data display on the match page.</p>

            <div class="mt-4 space-y-4">
              <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                <p>Font Size:</p>
                <AppInput
                  v-model="sizeValue"
                  type="text"
                  placeholder="Enter a size value (e.g., 1.5)"
                  class="w-full"
                />
              </div>
              <p class="text-sm text-white/50">
                This value will be used as a multiplier for the default font size.
                For example, a value of 1.5 will make the player match data 50% larger than the default size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      @click="activeSettings = 'larger-player-match-data'"
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Larger Player Match Data
          </h3>
          <p class="w-2/3 text-white/70">
            Increases the font-size of the player match data on the match page for better visibility.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="config.playerMatchData.enabled = !config.playerMatchData.enabled"
            :type="config.playerMatchData.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.playerMatchData.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img src="/images/larger-player-match-data.png" alt="Larger Player Match Data" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import AppInput from "../AppInput.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "larger-player-match-data");
const config = ref<IConfig>();
const sizeValue = ref("");

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
  // Initialize the size value from config
  if (config.value?.playerMatchData?.value) {
    sizeValue.value = config.value.playerMatchData.value.toString();
  }
});

// Update config when size value changes
watch(sizeValue, (newValue) => {
  if (config.value) {
    // Convert string to number
    const numValue = Number.parseFloat(newValue) || 1; // Default to 1 if parsing fails
    config.value.playerMatchData.value = numValue;
  }
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "playerMatchData");
}, { deep: true });
</script>
