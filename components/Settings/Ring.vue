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
            Settings - Ring
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure the ring display settings.</p>

            <div class="mt-4 space-y-4">
              <!-- Ring Color Settings -->
              <div class="grid grid-cols-[5rem_5rem_5rem_auto] items-center gap-4">
                <p>Ring color</p>
                <AppToggle v-model="config.ring.colorEnabled" />
                <input
                  v-if="config.ring.colorEnabled"
                  v-model="config.ring.color"
                  type="color"
                  class="size-full overflow-hidden rounded border-none border-transparent p-0 outline-none"
                >
              </div>

              <!-- Ring Size Settings -->
              <div class="grid grid-cols-[5rem_5rem_auto] items-center gap-4">
                <p>Ring size</p>
                <input
                  v-model="config.ring.size"
                  type="number"
                  min="1"
                  max="9"
                  class="w-full rounded-md border border-white/10 bg-transparent px-2 py-1 outline-none"
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
      @click="activeSettings = 'ring'"
      v-if="config"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Ring
          </h3>
          <p class="w-2/3 text-white/70">
            Displays a ring with dart board numbers around the board view, enhancing visibility of the board segments during gameplay.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="config.ring.enabled = !config.ring.enabled"
            :type="config.ring.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.ring.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Ring" class="size-full object-cover opacity-70">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import AppToggle from "../AppToggle.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const imageUrl = browser.runtime.getURL("/images/ring.png");

const activeSettings = useStorage("adt:active-settings", "ring");
const config = ref<IConfig>();

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "ring");
}, { deep: true });
</script>
