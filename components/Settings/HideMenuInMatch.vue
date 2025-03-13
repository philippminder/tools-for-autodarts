<template>
  <template v-if="!$attrs['data-feature-index']">
    <!-- Settings Panel -->
    <div
      class="adt-container min-h-56"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Settings - Hide Menu in Match
          </h3>
          <div class="space-y-3 text-white/70">
            <p>Configure how the menu is displayed during matches.</p>

            <div class="mt-4 space-y-4">
              <!-- No additional settings needed for this feature -->
              <p>This feature hides the menu during matches to provide a cleaner interface and prevent accidental clicks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- Feature Card -->
    <div
      @click="activeSettings = 'hide-menu-in-match'"
      class="adt-container h-56 transition-transform hover:-translate-y-0.5"
    >
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Hide Menu in Match
          </h3>
          <p class="w-2/3 text-white/70">
            Hides the menu during matches to provide a cleaner interface and prevent accidental clicks.
          </p>
        </div>
        <div class="flex">
          <div class="absolute inset-0 cursor-pointer " />
          <AppButton
            @click="toggleHideMenuInMatch"
            :type="hideMenuEnabled ? 'success' : 'default'"
            class="aspect-square !size-10 rounded-full p-0"
          >
            <span v-if="hideMenuEnabled" class="icon-[pixelarticons--check]" />
            <span v-else class="icon-[pixelarticons--close]" />
          </AppButton>
        </div>
      </div>
      <div class="gradient-mask-left absolute inset-y-0 right-0 w-2/3">
        <img src="@/assets/images/discord-webhooks.png" alt="Hide Menu in Match" class="size-full object-cover">
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import AppButton from "../AppButton.vue";

const activeSettings = useStorage("adt:active-settings", "hide-menu-in-match");
const hideMenuEnabled = useStorage("adt:hide-menu-in-match", false);

function toggleHideMenuInMatch() {
  hideMenuEnabled.value = !hideMenuEnabled.value;
}
</script>
