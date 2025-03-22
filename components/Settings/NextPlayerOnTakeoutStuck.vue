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
            Settings - Automatic Next Player on Takeout
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure how long to wait before automatically switching to the next player when takeout is stuck.</p>

            <div class="mt-4 space-y-4">
              <!-- Seconds Input -->
              <div class="grid grid-cols-[5rem_auto] items-center gap-4">
                <AppInput
                  @update:model-value="config.nextPlayerOnTakeOutStuck.sec = Number($event)"
                  :model-value="String(config.nextPlayerOnTakeOutStuck.sec)"
                  placeholder="5"
                  type="number"
                  size="sm"
                  input-class="w-full"
                />
                <p>Seconds to wait before automatically switching to the next player</p>
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
          <h3 class="mb-1 font-bold uppercase">
            Auto Next Player on Takeout
          </h3>
          <p class="w-2/3 text-white/70">
            Automatically reset board and switch to next player if takeout stucks for {{ config?.nextPlayerOnTakeOutStuck?.sec || '5' }} seconds.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggle', 'next-player-on-takeout-stuck')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppButton
            @click="toggleFeature"
            :type="config.nextPlayerOnTakeOutStuck.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.nextPlayerOnTakeOutStuck.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import AppButton from "../AppButton.vue";
import AppInput from "../AppInput.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const emit = defineEmits([ "toggle", "settingChange" ]);
const config = ref<IConfig>();

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await nextTick();
  await updateConfigIfChanged(currentConfig, config.value, "nextPlayerOnTakeOutStuck");
}, { deep: true });

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.nextPlayerOnTakeOutStuck.enabled;
  config.value.nextPlayerOnTakeOutStuck.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggle", "next-player-on-takeout-stuck");
  }
}
</script>
