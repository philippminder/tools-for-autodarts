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
            Settings - Discord Webhooks
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Toggles between sending the invitation link automatically or manually.</p>
            <AppRadioGroup
              v-model="config.discord.manually"
              class="grid max-w-sm grid-cols-2"
              :options="[
                { label: 'Automatic', value: false },
                { label: 'Manual', value: true },
              ]"
              button-size="sm"
            />
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-white/60">
                <span class="icon-[pixelarticons--link]" />
              </span>
              <AppInput
                v-model="config.discord.url"
                placeholder="Enter Discord webhook URL"
                label="Webhook URL"
                class="pl-9"
                helper-text="The Discord webhook URL to send lobby invitations to"
                size="sm"
              />
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
            Discord Webhooks
          </h3>
          <p class="w-2/3 text-white/70">
            Whenever a <b>private</b> lobby opens, it sends the invitation link to your discord server using a
            webhook.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggleSettings', 'discord-webhooks')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppButton
            @click="toggleFeature"
            :type="config.discord.enabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="config.discord.enabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img :src="imageUrl" alt="Discord Webhooks" class="size-full object-cover opacity-70">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";
import AppRadioGroup from "../AppRadioGroup.vue";
import AppInput from "../AppInput.vue";
import { AutodartsToolsConfig, type IConfig, updateConfigIfChanged } from "@/utils/storage";

const emit = defineEmits([ "toggleSettings" ]);
const activeSettings = useStorage("adt:active-settings", "discord-webhooks");
const config = ref<IConfig>();
const imageUrl = browser.runtime.getURL("/images/discord-webhooks.png");

// TODO: Fix: Components on PageConfig are getting mounted multiple times (3)

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  const currentConfig = await AutodartsToolsConfig.getValue();
  await updateConfigIfChanged(currentConfig, config.value, "discord");
}, { deep: true });

function toggleFeature() {
  if (!config.value) return;

  // Toggle the feature
  const wasEnabled = config.value.discord.enabled;
  config.value.discord.enabled = !wasEnabled;

  // If we're enabling the feature, open settings
  if (!wasEnabled) {
    emit("toggleSettings", "discord-webhooks");
  }
}
</script>
