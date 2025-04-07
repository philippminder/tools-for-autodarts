<template>
  <div
    v-if="config?.friendsList?.enabled"
    class="absolute z-20"
    :class="navigationHeight > 100 ? 'bottom-4' : 'bottom-4 left-4'"
    :style="navigationHeight > 100 ? { left: `calc(${navigationWidth}rem + 2rem)` } : {}"
  >
    <div>
      <AppButton
        @click="isOpen = true"
        class="friends-list-toggle rounded-full p-0"
        size="lg"
      >
        <span class="icon-[pixelarticons--users] text-sm" />
      </AppButton>
    </div>

    <AppSlide
      v-model="isOpen"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <span class="relative flex size-2">
            <span
              class="absolute inline-flex size-full rounded-full opacity-75"
              :class="{
                'bg-green-500': socketStatus === 'connected',
                'bg-red-500': socketStatus === 'error' || socketStatus === 'disconnected',
                'bg-yellow-500': socketStatus === 'connecting',
              }"
            />
            <span
              class="relative inline-flex size-full rounded-full"
              :class="{
                'bg-green-500': socketStatus === 'connected',
                'bg-red-500': socketStatus === 'error' || socketStatus === 'disconnected',
                'bg-yellow-500': socketStatus === 'connecting',
              }"
            />
          </span>
          <span>Friends List</span>
        </div>
      </template>
      <div class="grid h-full grid-rows-[1fr_1fr_7rem] gap-4">
        <!-- Friends List Section -->
        <div class="min-h-40 space-y-4 overflow-y-auto px-4">
          <FriendItem
            v-for="player in sortedFriends"
            :key="player.userId || player.name"
            :friend="player"
            :is-online="player.userId ? friendsOnlineStatus[player.userId] : false"
          >
            <template #actions>
              <AppButton
                @click="removeFriend(player)"
                size="xs"
                auto
                title="Remove from friends"
                type="danger"
              >
                <span class="icon-[pixelarticons--user-minus]" />
              </AppButton>
              <AppButton
                @click="inviteFriend(player as unknown as IFriend)"
                v-if="player.userId && lobbyId && friendsOnlineStatus[player.userId] && socketStatus === 'connected'"
                size="xs"
                auto
                title="Add to Lobby"
              >
                <span class="icon-[pixelarticons--add-box]" />
              </AppButton>
            </template>
          </FriendItem>
        </div>

        <!-- Current Players Section -->
        <div class="min-h-40 overflow-y-auto border-t border-white/20 pt-4">
          <h3 class="mb-3 text-center text-sm font-semibold">
            Recent Players
          </h3>
          <div
            v-if="config?.friendsList?.recentPlayers?.length"
            class="space-y-4 px-4"
          >
            <FriendItem
              v-for="player in config?.friendsList?.recentPlayers"
              :key="player.userId || player.name"
              :friend="player"
              no-status
              class="font-semibold"
            >
              <template #actions>
                <AppButton @click="addFriend(player as unknown as IPlayerInfo)" size="xs" auto title="Add to friends">
                  <span class="icon-[pixelarticons--user-plus]" />
                </AppButton>
              </template>
            </FriendItem>
          </div>
          <div v-else>
            <p class="text-center text-sm text-gray-500">
              No recent players
            </p>
          </div>
        </div>

        <div class="border-t border-white/20 px-4 pt-4">
          <div class="flex items-center justify-between">
            <span class="text-sm">Allow Invitations</span>
            <AppToggle
              v-model="invitationsEnabled"
              size="xs"
            />
          </div>
        </div>
      </div>
    </AppSlide>

    <!-- Confirmation Dialog for Friend Removal -->
    <ConfirmDialog
      @confirm="confirmRemoveFriend"
      @cancel="cancelRemoveFriend"
      :show="showRemoveConfirmation"
      title="Remove Friend"
      message="Are you sure you want to remove this friend from your list?"
    />

    <!-- Add the AppInvite component -->
    <AppInvite
      @accept="acceptInvitation"
      @decline="declineInvitation"
      @timeout="timeoutInvitation"
      :show="showInvitation"
      :message="invitationMessage"
      :duration="30"
      :lobby-url="pendingInvitation.lobbyUrl"
      :class="twMerge(
        isOpen ? 'right-[21rem]' : 'right-5',
      )"
    />

    <!-- Add Notification component -->
    <AppNotification
      @close="notificationState.show = false"
      :show="notificationState.show"
      :message="notificationState.message"
      :type="notificationState.type"
      :duration="notificationState.duration"
    />
  </div>
</template>

<script setup lang="ts">
import { isEqual, merge } from "lodash";
import { twMerge } from "tailwind-merge";
import { watchIgnorable } from "@vueuse/core";

import type { IConfig, IFriend, IPlayerInfo } from "@/utils/storage";
import type { IGameData } from "@/utils/game-data-storage";

import AppButton from "@/components/AppButton.vue";
import AppSlide from "@/components/AppSlide.vue";
import AppToggle from "@/components/AppToggle.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import AppInvite from "@/components/AppInvite.vue";
import FriendItem from "@/components/FriendItem.vue";
import AppNotification from "@/components/AppNotification.vue";
import { AutodartsToolsConfig, AutodartsToolsGlobalStatus, AutodartsToolsUrlStatus, defaultConfig } from "@/utils/storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";
import { generateAvatar, getUserIdFromToken } from "@/utils/helpers";

let gameDataWatcherUnwatch: () => void;
let urlWatcherUnwatch: () => void;
let configWatcherUnwatch: () => void;
let navigationObserver: ResizeObserver | null = null;

const config = ref<IConfig>();
const gameData = ref<IGameData>();
const url = ref<string | null>(null);
const lobbyId = ref<string | null>(null);
const isOpen = ref(false);
const showRemoveConfirmation = ref(false);
const playerToRemove = ref<IFriend | null>(null);
const socketStatus = ref<"connected" | "disconnected" | "connecting" | "error">("disconnected");
const userId = ref<string | null>(null);
const previousFriends = ref<IFriend[]>([]);
const heartbeatInterval = ref<number | null>(null);
const friendsStatusInterval = ref<number | null>(null);
const friendsOnlineStatus = ref<Record<string, boolean>>({});
// Add reactive variables for navigation dimensions
const navigationHeight = ref(0);
const navigationWidth = ref(0);
// Add new reactive variables for invitations
const showInvitation = ref(false);
const invitationMessage = ref("");
const invitationsEnabled = ref(true);
const pendingInvitation = ref<{
  fromUserId: string;
  fromName: string;
  lobbyUrl: string;
}>({
  fromUserId: "",
  fromName: "",
  lobbyUrl: "",
});
let port: Browser.runtime.Port | null = null;

// Add notification state
const notificationState = ref({
  show: false,
  message: "",
  type: "success" as "success" | "error",
  duration: 5000,
});

const sortedFriends = computed(() => {
  if (!config.value?.friendsList?.friends) return [];

  return [ ...config.value.friendsList.friends ].sort((a, b) => {
    const aOnline = a.userId ? friendsOnlineStatus.value[a.userId] || false : false;
    const bOnline = b.userId ? friendsOnlineStatus.value[b.userId] || false : false;

    if (aOnline === bOnline) {
      // If online status is the same, maintain original order
      return 0;
    }
    // Sort online players first
    return aOnline ? -1 : 1;
  });
});

function isDuplicateFriend(newFriend: { name: string; id?: string }) {
  if (!config.value) return false;
  return config.value.friendsList.friends.some(friend =>
    friend.name.toLowerCase() === newFriend.name.toLowerCase(),
  );
}

const { ignoreUpdates } = watchIgnorable(config, async (newConfig, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(newConfig!));
  console.log("Friends List setting changed");

  // Only send friends data when the friends array has changed
  if (socketStatus.value === "connected" && userId.value && newConfig) {
    const currentFriends = toRaw(newConfig.friendsList.friends);
    if (!isEqual(currentFriends, previousFriends.value)) {
      previousFriends.value = [ ...currentFriends ];
      sendFriendsToServer();
    }
  }

  // Fetch the latest config and merge it
  ignoreUpdates(async () => {
    const latestConfig = await AutodartsToolsConfig.getValue();
    if (config.value) {
      merge(config.value, latestConfig);
    }
  });
}, { deep: true });

// Function to send friends data to socket server
async function sendFriendsToServer() {
  if (!config.value?.friendsList?.friends || !userId.value) return;

  console.log("Sending friends to server:", config.value.friendsList.friends);

  console.log(toRaw(config.value.friendsList.friends));

  try {
    await browser.runtime.sendMessage({
      type: "update-friends",
      userId: userId.value,
      friends: JSON.parse(JSON.stringify(toRaw(config.value.friendsList.friends))),
    });
  } catch (error) {
    console.error("Error sending friends data:", error);
  }
}

// Send heartbeat to keep user's timestamp updated
async function sendHeartbeat() {
  if (!userId.value) return;

  try {
    await browser.runtime.sendMessage({
      type: "heartbeat",
      userId: userId.value,
    });
  } catch (error) {
    console.error("Error sending heartbeat:", error);
  }
}

// Check online status for all friends
async function checkFriendsStatus() {
  if (!config.value?.friendsList?.friends || !userId.value || socketStatus.value !== "connected") return;

  try {
    // Extract friend ids to check
    const friendIds = config.value.friendsList.friends
      .map(friend => friend.userId)
      .filter(Boolean) as string[];

    if (friendIds.length === 0) return;

    // Send request to check friends status
    await browser.runtime.sendMessage({
      type: "check-friends-status",
      userId: userId.value,
      friendIds,
    });
  } catch (error) {
    console.error("Error checking friends status:", error);
  }
}

function setupPortConnection() {
  // Connect to background script
  port = browser.runtime.connect({ name: "friends-list" });

  // Handle messages from background script
  port?.onMessage.addListener((message: any) => {
    if (message.type === "socket-status-update") {
      const previousStatus = socketStatus.value;
      socketStatus.value = message.status;

      // If socket just connected, send friends data
      if (previousStatus !== "connected" && message.status === "connected" && userId.value) {
        sendFriendsToServer();
        // Send heartbeat when connection is established
        sendHeartbeat();
        // Do initial check of friends status
        checkFriendsStatus();
      }
    } else if (message.type === "friends-status-result" && message.friendsStatus) {
      // Update the friends online status
      friendsOnlineStatus.value = message.friendsStatus;
    } else if (message.type === "lobby-invitation") {
      // Handle incoming lobby invitation
      handleIncomingInvitation(message);
    } else if (message.type === "lobby-invitation-sent") {
      console.log("Lobby invitation sent successfully to", message.toUserId);
      // Show success notification when invitation is sent
      const friendName = config.value?.friendsList?.friends.find(f => f.userId === message.toUserId)?.name || "Friend";
      showNotification(`Invitation sent successfully to ${friendName}!`, "success");
    } else if (message.type === "lobby-invitation-error") {
      console.error("Error sending lobby invitation:", message.error);
      // Show error notification
      showNotification(`Failed to send invitation: ${message.error}`, "error");
    } else if (message.type === "lobby-invitation-response") {
      console.log("Invitation response received:", message);
      if (message.accepted) {
        console.log("Friend accepted your invitation!");
        // Show success notification when invitation is accepted
        const friendName = message.responderName || config.value?.friendsList?.friends.find(f => f.userId === message.toUserId)?.name || "Friend";
        showNotification(`${friendName} accepted your invitation!`, "success");
      } else {
        console.log("Friend declined your invitation.");
        // Show notification when invitation is declined with a better visual style
        const friendName = message.responderName || config.value?.friendsList?.friends.find(f => f.userId === message.toUserId)?.name || "Friend";
        showNotification(`${friendName} declined your invitation`, "error", 7000);
      }
    }
  });

  // Handle disconnection
  port?.onDisconnect.addListener(() => {
    console.log("Disconnected from background script");
    port = null;
    // Try to reconnect after a short delay
    setTimeout(setupPortConnection, 1000);
  });
}

// Initialize port connection
setupPortConnection();

// Handle incoming lobby invitation
function handleIncomingInvitation(data: { fromUserId: string; fromName: string; lobbyUrl: string }) {
  // Don't show invitations if they're disabled
  if (!invitationsEnabled.value) return;

  const fromName = config.value?.friendsList?.friends.find(friend => friend.userId === data.fromUserId)?.name || data.fromName;
  // Store invitation data
  pendingInvitation.value = data;

  // Set message and show notification
  invitationMessage.value = `${fromName} invites you to join their lobby`;
  showInvitation.value = true;
}

// Accept lobby invitation
function acceptInvitation() {
  if (!pendingInvitation.value.lobbyUrl) return;

  // Send acceptance response
  if (userId.value && pendingInvitation.value.fromUserId) {
    sendInvitationResponse(true);
  }

  // Navigate to the lobby URL
  window.location.href = pendingInvitation.value.lobbyUrl;

  // Hide notification
  showInvitation.value = false;
}

// Decline lobby invitation
function declineInvitation() {
  // Send decline response
  if (userId.value && pendingInvitation.value.fromUserId) {
    sendInvitationResponse(false);
  }

  // Hide notification
  showInvitation.value = false;
}

// Handle invitation timeout
function timeoutInvitation() {
  // Send decline response on timeout
  if (userId.value && pendingInvitation.value.fromUserId) {
    sendInvitationResponse(false);
  }

  // Hide notification
  showInvitation.value = false;
}

// Handle keyboard shortcuts for invitations
function handleKeyboardShortcuts(event: KeyboardEvent) {
  // Only handle shortcuts when an invitation is showing
  if (!showInvitation.value) return;

  if (event.key === "y" || event.key === "Y") {
    acceptInvitation();
  } else if (event.key === "n" || event.key === "N") {
    declineInvitation();
  }
}

// Setup keyboard shortcut listeners
function setupKeyboardShortcuts() {
  window.addEventListener("keydown", handleKeyboardShortcuts);
}

// Remove keyboard shortcut listeners
function cleanupKeyboardShortcuts() {
  window.removeEventListener("keydown", handleKeyboardShortcuts);
}

// Send invitation response to server
function sendInvitationResponse(accepted: boolean) {
  try {
    browser.runtime.sendMessage({
      type: "lobby-invitation-response",
      fromUserId: pendingInvitation.value.fromUserId,
      toUserId: userId.value,
      accepted,
    });
  } catch (error) {
    console.error("Error sending invitation response:", error);
  }
}

// Function to show notification
function showNotification(message: string, type: "success" | "error" = "success", duration: number = 5000) {
  notificationState.value = {
    show: true,
    message,
    type,
    duration,
  };

  // Auto-hide notification after duration
  setTimeout(() => {
    notificationState.value.show = false;
  }, duration);
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
  gameData.value = await AutodartsToolsGameData.getValue();
  if (!config.value?.friendsList) config.value.friendsList = defaultConfig.friendsList;

  // Initialize previous friends
  if (config.value?.friendsList?.friends) {
    previousFriends.value = [ ...toRaw(config.value.friendsList.friends) ];
  }

  // Get user ID from JWT
  userId.value = await getUserIdFromToken();

  // for development only
  await nextTick();
  config.value.friendsList.enabled = true;

  url.value = window.location.href;
  lobbyId.value = getLobbyId();
  console.log("LOBBY ID:", url.value);

  urlWatcherUnwatch = AutodartsToolsUrlStatus.watch((_url: string) => {
    url.value = _url;
    lobbyId.value = getLobbyId();
  });

  // Set up navigation observer
  const observeNavigation = () => {
    const navigationElement = document.querySelector("#root .navigation");
    if (navigationElement) {
      navigationObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          navigationHeight.value = entry.contentRect.height;
          navigationWidth.value = entry.contentRect.width / 16; // Convert pixels to rem
        }
      });
      navigationObserver.observe(navigationElement);
    } else {
      // If element not found, retry after a short delay
      setTimeout(observeNavigation, 500);
    }
  };
  observeNavigation();

  gameDataWatcherUnwatch = AutodartsToolsGameData.watch((_gameData: IGameData) => {
    gameData.value = _gameData;
    if (!config.value) return;
    // Deep clone to remove reactivity from player objects
    const currentPlayers = gameData.value?.match?.players
      ? JSON.parse(JSON.stringify(gameData.value.match.players))
      : [];
    const existingRecentPlayers = config.value.friendsList.recentPlayers
      ? JSON.parse(JSON.stringify(config.value.friendsList.recentPlayers))
      : [];

    config.value.friendsList.recentPlayers = Array.from(
      new Map(
        [ ...currentPlayers, ...existingRecentPlayers ]
          .filter(player => !player.name.includes("Bot Level "))
          .map(player => [ player.userId || player.name, player ]),
      ).values(),
    ).slice(0, 10);
  });

  // Watch for external config changes
  configWatcherUnwatch = AutodartsToolsConfig.watch((_config: IConfig) => {
    ignoreUpdates(() => {
      if (config.value) {
        merge(config.value, _config);
      } else {
        config.value = _config;
      }
    });
  });

  // Get initial socket status
  try {
    const response = await browser.runtime.sendMessage({ type: "get-socket-status" });
    if (response && response.status) {
      socketStatus.value = response.status;

      // If socket is already connected, send friends data
      if (response.status === "connected" && userId.value) {
        sendFriendsToServer();
        // Send initial heartbeat
        sendHeartbeat();
        // Do initial check of friends status
        checkFriendsStatus();
      }
    }
  } catch (error) {
    console.error("Error getting socket status:", error);
  }

  // Start heartbeat interval
  if (userId.value) {
    // Send heartbeat every 30 seconds
    heartbeatInterval.value = window.setInterval(sendHeartbeat, 30000);

    // Check friends status every 30 seconds
    friendsStatusInterval.value = window.setInterval(checkFriendsStatus, 30000);
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
});

onBeforeUnmount(() => {
  gameDataWatcherUnwatch?.();
  urlWatcherUnwatch?.();
  configWatcherUnwatch?.();

  // Disconnect and cleanup navigation observer
  if (navigationObserver) {
    navigationObserver.disconnect();
    navigationObserver = null;
  }

  // Disconnect port
  if (port) {
    port.disconnect();
    port = null;
  }

  // Clear intervals on component unmount
  if (heartbeatInterval.value) {
    clearInterval(heartbeatInterval.value);
    heartbeatInterval.value = null;
  }

  if (friendsStatusInterval.value) {
    clearInterval(friendsStatusInterval.value);
    friendsStatusInterval.value = null;
  }

  // Cleanup keyboard shortcuts
  cleanupKeyboardShortcuts();
});

function getLobbyId() {
  if (!url.value) return null;
  const lobbyIdMatch = url.value.match(/\/lobbies\/([0-9a-f-]+)/);
  return lobbyIdMatch ? lobbyIdMatch[1] : null;
}

async function addFriend(player: IPlayerInfo) {
  if (!config.value) return;

  if (isDuplicateFriend(player)) return;

  config.value.friendsList.friends.push({
    userId: player.userId,
    name: player.name,
    avatarUrl: player.avatarUrl || generateAvatar(player.name),
  });
}

async function removeFriend(player: IFriend) {
  playerToRemove.value = player;
  showRemoveConfirmation.value = true;
}

async function confirmRemoveFriend() {
  if (!config.value || !playerToRemove.value) return;

  config.value.friendsList.friends = config.value.friendsList.friends.filter(
    (friend: IFriend) => friend.userId !== playerToRemove.value?.userId && friend.name !== playerToRemove.value?.name,
  );

  showRemoveConfirmation.value = false;
  playerToRemove.value = null;
}

function cancelRemoveFriend() {
  showRemoveConfirmation.value = false;
  playerToRemove.value = null;
}

async function inviteFriend(player: IFriend) {
  // Don't send invitations if they're disabled
  if (!invitationsEnabled.value) {
    alert("Invitations are currently disabled. Enable them in the Friends List settings.");
    return;
  }

  console.log("Inviting friend:", player);

  if (!userId.value || !player.userId) {
    console.error("Cannot invite: missing user ID for sender or recipient");
    showNotification("Cannot invite: missing user ID for sender or recipient", "error");
    return;
  }

  try {
    // Get the lobby URL from the input
    const lobbyUrl = url.value || window.location.href;

    if (!lobbyUrl) {
      console.error("Lobby URL is empty");
      showNotification("Lobby invite URL is empty. Please create or join a lobby first.", "error");
      return;
    }

    // Get the name of the current user to pass with the invitation
    const globalStatus = await AutodartsToolsGlobalStatus.getValue();
    const fromName = globalStatus?.user?.name || "A friend";

    // Show sending notification
    showNotification(`Sending invitation to ${player.name}...`, "success", 2000);

    // Send the invitation to the socket server
    browser.runtime.sendMessage({
      type: "send-lobby-invitation",
      fromUserId: userId.value,
      fromName,
      toUserId: player.userId,
      lobbyUrl,
    });

    console.log("Sending lobby invitation:", {
      fromUserId: userId.value,
      toUserId: player.userId,
      lobbyUrl,
    });
  } catch (error) {
    console.error("Error inviting friend:", error);
    showNotification("Failed to send invitation. Please try again.", "error");
  }
}
</script>
