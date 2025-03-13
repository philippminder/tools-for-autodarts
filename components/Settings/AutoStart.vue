<template>
  <!-- Feature Card -->
  <div
    @click="activeSettings = 'auto-start'"
    v-if="config"
    class="adt-container h-56 transition-transform hover:-translate-y-0.5"
  >
    <div class="relative z-10 flex h-full flex-col justify-between">
      <div>
        <h3 class="mb-1 font-bold uppercase">
          Autostart
        </h3>
        <p class="w-2/3 text-white/70">
          Displays a button to enable autostart on the lobby page. If autostart is enabled, it will automatically start the game after <b>3 seconds</b> once a player joins the lobby.
        </p>
      </div>
      <div class="flex">
        <div class="absolute inset-0 cursor-pointer " />
        <AppButton
          @click="config.autoStart.enabled = !config.autoStart.enabled"
          :type="config.autoStart.enabled ? 'success' : 'default'"
          class="aspect-square !size-10 rounded-full p-0"
        >
          <span v-if="config.autoStart.enabled" class="icon-[pixelarticons--check]" />
          <span v-else class="icon-[pixelarticons--close]" />
        </AppButton>
      </div>
    </div>
    <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
      <img src="@/assets/images/auto-start.png" alt="Auto Start" class="size-full object-cover opacity-70">
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import { AutodartsToolsConfig, type IConfig, defaultConfig } from "@/utils/storage";

const activeSettings = useStorage("adt:active-settings", "discord-webhooks");
const config = ref<IConfig>();

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  await AutodartsToolsConfig.setValue({
    ...JSON.parse(JSON.stringify(defaultConfig)),
    ...JSON.parse(JSON.stringify(config.value)),
  });
}, { deep: true });
</script>
