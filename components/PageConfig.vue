<template>
  <div>
    <!-- Confirmation Dialog -->
    <ConfirmDialog
      @confirm="confirmDialogConfirm"
      @cancel="confirmDialogCancel"
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
    />

    <!-- Notification -->
    <AppNotification
      @close="hideNotification"
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
    />

    <div class="mx-auto mb-16 max-w-[1366px] space-y-8">
      <div class="space-y-4">
        <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div class="flex items-center">
            <AppButton
              @click="goBack()"
              class="mr-4 aspect-square size-10 p-0"
            >
              <span class="icon-[pixelarticons--arrow-left]" />
            </AppButton>
            <h1 class="text-xl font-bold sm:text-2xl md:text-3xl">
              Autodarts Tools
            </h1>
          </div>
          <div class="mt-2 grid grid-cols-2 items-center gap-2 sm:mt-0 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <AppButton
              @click="exportSettings"
              title="Download settings as file"
            >
              <span class="icon-[pixelarticons--calendar-export] mr-2" />
              <span>Export</span>
            </AppButton>
            <AppButton
              @click="importSettings"
              title="Import settings from file"
            >
              <span class="icon-[pixelarticons--calendar-import] mr-2" />
              <span>Import</span>
            </AppButton>
            <AppButton
              @click="copyToClipboard"
              title="Copy settings to clipboard"
            >
              <span class="icon-[pixelarticons--copy] mr-2" />
              <span>Copy</span>
            </AppButton>
            <AppButton
              @click="pasteFromClipboard"
              title="Paste settings from clipboard"
            >
              <span class="icon-[pixelarticons--calendar-import] mr-2" />
              <span>Paste</span>
            </AppButton>
            <AppButton
              @click="toggleDangerZone"
              title="Advanced settings"
              class="aspect-square size-10 p-0"
            >
              <span class="icon-[material-symbols--settings-suggest-outline]" />
            </AppButton>
          </div>
        </div>

        <!-- Tabs Component -->
        <AppTabs
          v-if="!showDangerZone"
          v-model="activeTab"
          :tabs="tabs"
        />

        <!-- Danger Zone -->
        <div v-if="showDangerZone" class="adt-container space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-red-400">
              Danger Zone
            </h2>
            <AppButton @click="toggleDangerZone" auto class="text-white/70 hover:text-white">
              <span class="icon-[pixelarticons--close]" />
            </AppButton>
          </div>
          <div class="space-y-4">
            <p class="text-white/70">
              These actions are destructive and cannot be undone. Please proceed with caution and may export your settings before proceeding.
            </p>
            <div class="rounded border border-red-500/30 bg-red-500/5 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-red-300">
                    Reset All Settings
                  </h3>
                  <p class="text-sm text-white/60">
                    This will reset all settings to their default values. All your customizations will be lost.
                  </p>
                </div>
                <AppButton
                  @click="resetAllSettings"
                  auto
                  class="border-red-500/30 bg-red-500/20 hover:bg-red-500/40"
                >
                  Reset All Settings
                </AppButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature cards and settings grid for Lobbies tab -->
        <div
          v-if="activeTab === 0 && !showDangerZone"
          class="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <!-- First row of feature cards -->
          <DiscordWebhooks @toggle-settings="toggleSettings" class="feature-card" data-feature-index="1" />
          <!-- Settings panel for DiscordWebhooks (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[0]) && getComponentForSetting(activeSettings) && activeSettings === 'discord-webhooks'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
          <AutoStart class="feature-card" data-feature-index="2" />

          <!-- Settings panel for first row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[0]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Second row of feature cards -->
          <RecentLocalPlayers @toggle-settings="toggleSettings" class="feature-card" data-feature-index="3" />
          <!-- Settings panel for RecentLocalPlayers (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[1]) && getComponentForSetting(activeSettings) && activeSettings === 'recent-local-players'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <ShufflePlayers class="feature-card" data-feature-index="4" />

          <!-- Settings panel for second row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[1]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Third row of feature cards -->
          <TeamLobby class="feature-card" data-feature-index="5" />
          <div class="feature-card" data-feature-index="6">
            <!-- Placeholder for future feature -->
          </div>

          <!-- Settings panel for third row (only if active setting has settings) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[2]) && getComponentForSetting(activeSettings)" class="col-span-1 lg:col-span-2" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
        </div>

        <!-- Feature cards and settings grid for Matches tab -->
        <div
          v-if="activeTab === 1 && !showDangerZone"
          class="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <!-- First row of feature cards -->
          <DisableTakeoutRecognition class="feature-card" data-feature-index="7" />
          <Colors @toggle-settings="toggleSettings" class="feature-card" data-feature-index="8" />
          <!-- Settings panel for Colors (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[3]) && getComponentForSetting(activeSettings) && activeSettings === 'colors'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Settings panel for first row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[3]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Second row of feature cards -->
          <TakeoutNotification class="feature-card" data-feature-index="9" />
          <NextPlayerOnTakeoutStuck @toggle-settings="toggleSettings" class="feature-card" data-feature-index="10" />
          <!-- Settings panel for NextPlayerOnTakeoutStuck (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[4]) && getComponentForSetting(activeSettings) && activeSettings === 'next-player-on-takeout-stuck'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Settings panel for second row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[4]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Third row of feature cards -->
          <AutomaticNextLeg @toggle-settings="toggleSettings" class="feature-card" data-feature-index="11" />
          <!-- Settings panel for AutomaticNextLeg (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[5]) && getComponentForSetting(activeSettings) && activeSettings === 'automatic-next-leg'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
          <SmallerScores class="feature-card" data-feature-index="12" />

          <!-- Settings panel for third row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[5]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Fourth row of feature cards -->
          <HideMenuInMatch class="feature-card" data-feature-index="13" />
          <StreamingMode @toggle-settings="toggleSettings" class="feature-card" data-feature-index="14" />
          <!-- Settings panel for StreamingMode (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[6]) && getComponentForSetting(activeSettings) && activeSettings === 'streaming-mode'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Settings panel for fourth row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[6]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Fifth row of feature cards -->
          <LargerLegsSets @toggle-settings="toggleSettings" class="feature-card" data-feature-index="15" />
          <!-- Settings panel for LargerLegsSets (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[7]) && getComponentForSetting(activeSettings) && activeSettings === 'larger-legs-sets'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
          <LargerPlayerNames @toggle-settings="toggleSettings" class="feature-card" data-feature-index="16" />
          <!-- Settings panel for LargerPlayerNames (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[7]) && getComponentForSetting(activeSettings) && activeSettings === 'larger-player-names'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Settings panel for fifth row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[7]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Sixth row of feature cards -->
          <LargerPlayerMatchData @toggle-settings="toggleSettings" class="feature-card" data-feature-index="17" />
          <!-- Settings panel for LargerPlayerMatchData (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[8]) && getComponentForSetting(activeSettings) && activeSettings === 'larger-player-match-data'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
          <WinnerAnimation class="feature-card" data-feature-index="18" />

          <!-- Settings panel for sixth row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[8]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Seventh row of feature cards -->
          <Ring @toggle-settings="toggleSettings" class="feature-card" data-feature-index="19" />

          <!-- Settings panel for seventh row (only if active setting has settings) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[9]) && getComponentForSetting(activeSettings)" class="col-span-1 lg:col-span-2" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
        </div>

        <!-- Feature cards and settings grid for Boards tab -->
        <div
          v-if="activeTab === 2 && !showDangerZone"
          class="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <!-- First row of feature cards -->
          <ExternalBoards class="feature-card" data-feature-index="21" />
          <div class="feature-card" data-feature-index="22">
            <!-- Placeholder for future feature -->
          </div>

          <!-- Settings panel for first row (only if active setting has settings) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[10]) && getComponentForSetting(activeSettings)" class="col-span-1 lg:col-span-2" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
        </div>

        <!-- Feature cards and settings grid for Sounds & Animations tab -->
        <div
          v-if="activeTab === 3 && !showDangerZone"
          class="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <!-- First row of feature cards -->
          <Animations @toggle-settings="toggleSettings" class="feature-card" data-feature-index="23" />
          <!-- Settings panel for Animations (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[11]) && getComponentForSetting(activeSettings) && activeSettings === 'animations'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
          <Caller @toggle-settings="toggleSettings" class="feature-card" data-feature-index="24" />
          <!-- Settings panel for Caller (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[11]) && getComponentForSetting(activeSettings) && activeSettings === 'caller'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Settings panel for first row (only if active setting has settings) - only on large screens -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[11]) && getComponentForSetting(activeSettings)" class="hidden lg:col-span-2 lg:block" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>

          <!-- Second row of feature cards -->
          <SoundFx @toggle-settings="toggleSettings" class="feature-card" data-feature-index="25" />
          <!-- Settings panel for SoundFx (only on small screens) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[12]) && getComponentForSetting(activeSettings) && activeSettings === 'sound-fx'" class="lg:hidden" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
          <div class="feature-card" data-feature-index="26">
            <!-- Placeholder for future feature -->
          </div>

          <!-- Settings panel for second row (only if active setting has settings) -->
          <div v-if="isSettingInGroup(activeSettings, featureGroups[12]) && getComponentForSetting(activeSettings)" class="col-span-1 lg:col-span-2" :data-settings-id="activeSettings">
            <component :is="getComponentForSetting(activeSettings)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import DiscordWebhooks from "./Settings/DiscordWebhooks.vue";
import AutoStart from "./Settings/AutoStart.vue";
import RecentLocalPlayers from "./Settings/RecentLocalPlayers.vue";
import ShufflePlayers from "./Settings/ShufflePlayers.vue";
import TeamLobby from "./Settings/TeamLobby.vue";
import DisableTakeoutRecognition from "./Settings/DisableTakeoutRecognition.vue";
import Colors from "./Settings/Colors.vue";
import TakeoutNotification from "./Settings/TakeoutNotification.vue";
import NextPlayerOnTakeoutStuck from "./Settings/NextPlayerOnTakeoutStuck.vue";
import AutomaticNextLeg from "./Settings/AutomaticNextLeg.vue";
import SmallerScores from "./Settings/SmallerScores.vue";
import StreamingMode from "./Settings/StreamingMode.vue";
import HideMenuInMatch from "./Settings/HideMenuInMatch.vue";
import LargerLegsSets from "./Settings/LargerLegsSets.vue";
import LargerPlayerMatchData from "./Settings/LargerPlayerMatchData.vue";
import LargerPlayerNames from "./Settings/LargerPlayerNames.vue";
import WinnerAnimation from "./Settings/WinnerAnimation.vue";
import Ring from "./Settings/Ring.vue";
import Animations from "./Settings/Animations.vue";
import Caller from "./Settings/Caller.vue";
import ExternalBoards from "./Settings/ExternalBoards.vue";
import SoundFx from "./Settings/SoundFx.vue";
import type { IConfig } from "@/utils/storage";
import { AutodartsToolsConfig, defaultConfig } from "@/utils/storage";
import AppButton from "@/components/AppButton.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import AppNotification from "@/components/AppNotification.vue";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { useNotification } from "@/composables/useNotification";
import AppTabs from "@/components/AppTabs.vue";

// Define feature groups
const featureGroups = [
  {
    // First row - Lobbies tab
    id: "row1",
    tab: 0,
    features: [
      { id: "discord-webhooks", component: DiscordWebhooks, hasSettings: true },
      { id: "auto-start", component: AutoStart, hasSettings: false },
    ],
    settingIds: [ "discord-webhooks" ],
  },
  {
    // Second row - Lobbies tab
    id: "row2",
    tab: 0,
    features: [
      { id: "recent-local-players", component: RecentLocalPlayers, hasSettings: true },
      { id: "shuffle-players", component: ShufflePlayers, hasSettings: false },
    ],
    settingIds: [ "recent-local-players" ],
  },
  {
    // Third row - Lobbies tab
    id: "row3",
    tab: 0,
    features: [
      { id: "team-lobby", component: TeamLobby, hasSettings: false },
      { id: "placeholder", component: null, hasSettings: false }, // Placeholder for future feature
    ],
    settingIds: [],
  },
  {
    // First row - Matches tab
    id: "matches-row1",
    tab: 1,
    features: [
      { id: "disable-takeout-recognition", component: DisableTakeoutRecognition, hasSettings: false },
      { id: "colors", component: Colors, hasSettings: true },
    ],
    settingIds: [ "colors" ],
  },
  {
    // Second row - Matches tab
    id: "matches-row2",
    tab: 1,
    features: [
      { id: "takeout-notification", component: TakeoutNotification, hasSettings: false },
      { id: "next-player-on-takeout-stuck", component: NextPlayerOnTakeoutStuck, hasSettings: true },
    ],
    settingIds: [ "next-player-on-takeout-stuck" ],
  },
  {
    // Third row - Matches tab
    id: "matches-row3",
    tab: 1,
    features: [
      { id: "automatic-next-leg", component: AutomaticNextLeg, hasSettings: true },
      { id: "smaller-scores", component: SmallerScores, hasSettings: false },
    ],
    settingIds: [ "automatic-next-leg" ],
  },
  {
    // Fourth row - Matches tab
    id: "matches-row4",
    tab: 1,
    features: [
      { id: "hide-menu-in-match", component: HideMenuInMatch, hasSettings: false },
      { id: "streaming-mode", component: StreamingMode, hasSettings: true },
    ],
    settingIds: [ "streaming-mode" ],
  },
  {
    // Fifth row - Matches tab
    id: "matches-row5",
    tab: 1,
    features: [
      { id: "larger-legs-sets", component: LargerLegsSets, hasSettings: true },
      { id: "larger-player-names", component: LargerPlayerNames, hasSettings: true },
    ],
    settingIds: [ "larger-legs-sets", "larger-player-names" ],
  },
  {
    // Sixth row - Matches tab
    id: "matches-row6",
    tab: 1,
    features: [
      { id: "larger-player-match-data", component: LargerPlayerMatchData, hasSettings: true },
      { id: "winner-animation", component: WinnerAnimation, hasSettings: false },
    ],
    settingIds: [ "larger-player-match-data" ],
  },
  {
    // Seventh row - Matches tab
    id: "matches-row7",
    tab: 1,
    features: [
      { id: "ring", component: Ring, hasSettings: true },
      { id: "placeholder", component: null, hasSettings: false }, // Placeholder for future feature
    ],
    settingIds: [ "ring" ],
  },
  {
    // First row - Boards tab
    id: "boards-row1",
    tab: 2,
    features: [
      { id: "external-boards", component: ExternalBoards, hasSettings: false },
      { id: "placeholder", component: null, hasSettings: false }, // Placeholder for future feature
    ],
    settingIds: [],
  },
  {
    // First row - Sounds & Animations tab
    id: "sounds-animations-row1",
    tab: 3,
    features: [
      { id: "animations", component: Animations, hasSettings: true },
      { id: "caller", component: Caller, hasSettings: true },
    ],
    settingIds: [ "animations", "caller" ],
  },
  {
    // Second row - Sounds & Animations tab
    id: "sounds-animations-row2",
    tab: 3,
    features: [
      { id: "sound-fx", component: SoundFx, hasSettings: true },
      { id: "placeholder-2", component: null, hasSettings: false }, // Placeholder for future feature
    ],
    settingIds: [ "sound-fx" ],
  },
];

// Tabs component data
const tabs = ref([ "Lobbies", "Matches", "Boards", "Sounds & Animations" ]);
const activeSettings = useStorage("adt:active-settings", "discord-webhooks");
const activeTab = useStorage("adt:active-tab", 0);

const config = ref<IConfig>();
const importFileInput = ref<HTMLInputElement>();

// Use the composables
const { confirmDialog, showConfirmDialog, confirmDialogConfirm, confirmDialogCancel } = useConfirmDialog();
const { notification, showNotification, hideNotification } = useNotification();

function goBack() {
  window.history.back();
  window.history.back();
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async () => {
  // Get the latest config to ensure we have the most up-to-date values
  const latestConfig = await AutodartsToolsConfig.getValue();
  await nextTick();

  // Create a merged config that preserves all settings
  await AutodartsToolsConfig.setValue({
    ...latestConfig,
    ...JSON.parse(JSON.stringify(config.value)),
  });
}, { deep: true });

async function exportSettings() {
  config.value = await AutodartsToolsConfig.getValue();
  if (!config.value) return;

  const exportData = {
    config: config.value,
    exportDate: new Date().toISOString(),
    version: "1.0",
  };

  // Convert to JSON and then to base64
  const jsonString = JSON.stringify(exportData);
  const base64String = btoa(encodeURIComponent(jsonString));

  // Create a blob and download it
  const blob = new Blob([ base64String ], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `autodarts-tools-settings-${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importSettings() {
  if (!importFileInput.value) {
    importFileInput.value = document.createElement("input");
    importFileInput.value.type = "file";
    importFileInput.value.accept = ".txt";
    importFileInput.value.onchange = async (e) => {
      const file = importFileInput.value?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string;
          const jsonString = decodeURIComponent(atob(base64String));
          const importedData = JSON.parse(jsonString);

          if (!importedData.config) {
            showNotification("Invalid settings file", "error");
            return;
          }

          // Update the config
          const newConfig = {
            ...JSON.parse(JSON.stringify(defaultConfig)),
            ...JSON.parse(JSON.stringify(importedData.config)),
          };

          // Set the local ref
          config.value = newConfig;

          // Explicitly save to storage
          await AutodartsToolsConfig.setValue(newConfig);

          showNotification("Settings imported successfully. Page will reload to apply changes...");

          // Reload the page after a short delay to allow the notification to be seen
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error("Failed to import settings:", error);
          showNotification("Failed to import settings", "error");
        }
      };
      reader.readAsText(file);
    };
  }
  importFileInput.value.click();
}

// State for danger zone
const showDangerZone = ref(false);

function toggleDangerZone() {
  showDangerZone.value = !showDangerZone.value;
}

function resetAllSettings() {
  showConfirmDialog(
    "Reset All Settings",
    "This will reset all settings to their default values. All your customizations will be lost. Are you sure you want to continue?",
    async () => {
      const newConfig = JSON.parse(JSON.stringify(defaultConfig));
      config.value = newConfig;

      // Explicitly save to storage
      await AutodartsToolsConfig.setValue(newConfig);

      showNotification("All settings have been reset to default. Page will reload to apply changes...");

      // Close danger zone
      showDangerZone.value = false;

      // Reload the page after a short delay to allow the notification to be seen
      setTimeout(() => {
        window.location.reload();
        // After reload, navigate to first tab with first settings panel open
        activeTab.value = 0;
        activeSettings.value = "discord-webhooks";
      }, 1500);
    },
  );
}

async function copyToClipboard() {
  config.value = await AutodartsToolsConfig.getValue();
  if (!config.value) return;

  const exportData = {
    config: config.value,
    exportDate: new Date().toISOString(),
    version: "1.0",
  };

  // Convert to JSON and then to base64
  const jsonString = JSON.stringify(exportData);
  const base64String = btoa(encodeURIComponent(jsonString));

  // Copy to clipboard
  navigator.clipboard.writeText(base64String)
    .then(() => {
      showNotification("Settings copied to clipboard");
    })
    .catch((err) => {
      console.error("Failed to copy settings to clipboard:", err);
      showNotification("Failed to copy settings to clipboard", "error");
    });
}

function pasteFromClipboard() {
  navigator.clipboard.readText()
    .then(async (text) => {
      try {
        const jsonString = decodeURIComponent(atob(text));
        const importedData = JSON.parse(jsonString);

        if (!importedData.config) {
          showNotification("Invalid settings data", "error");
          return;
        }

        // Update the config
        const newConfig = {
          ...JSON.parse(JSON.stringify(defaultConfig)),
          ...JSON.parse(JSON.stringify(importedData.config)),
        };

        // Set the local ref
        config.value = newConfig;

        // Explicitly save to storage
        await AutodartsToolsConfig.setValue(newConfig);

        showNotification("Settings imported successfully. Page will reload to apply changes...");

        // Reload the page after a short delay to allow the notification to be seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error("Failed to import settings from clipboard:", error);
        showNotification("Failed to import settings from clipboard", "error");
      }
    })
    .catch((err) => {
      console.error("Failed to read from clipboard:", err);
      showNotification("Failed to read from clipboard", "error");
    });
}

// Function to check if a setting belongs to a group
function isSettingInGroup(settingId, group) {
  return group.settingIds.includes(settingId) && group.tab === activeTab.value;
}

// Function to get the component for a setting
function getComponentForSetting(settingId) {
  for (const group of featureGroups) {
    if (group.tab === activeTab.value) {
      const feature = group.features.find(f => f.id === settingId && f.hasSettings);
      if (feature) {
        return feature.component;
      }
    }
  }
  return null;
}

// Function to toggle settings panel
function toggleSettings(settingId) {
  if (activeSettings.value === settingId) {
    // If the clicked setting is already active, close it
    activeSettings.value = null;
  } else {
    // Otherwise, open the clicked setting
    activeSettings.value = settingId;
  }
}
</script>

<style>
input[type="color"] {
  -webkit-appearance: none;
  border: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
}

.gradient-mask-left {
  mask-image: linear-gradient(to right, transparent 10%, black 60%);
  -webkit-mask-image: linear-gradient(to right, transparent 10%, black 60%);
}
</style>
