<template>
  <div
    v-if="config?.friendsList?.enabled"
    class="absolute bottom-5 left-48 z-20"
  >
    <div>
      <AppButton
        @click="isOpen = true"
        class="rounded-full p-0"
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
      <div class="grid h-full grid-rows-[1fr_auto_3rem] gap-4">
        <!-- Friends List Section -->
        <div class="space-y-4 overflow-y-auto">
          <div
            v-for="player in sortedFriends"
            :key="player.boardId || player.name"
            class="grid grid-cols-[auto_1fr_auto] items-center gap-2"
            :class="{
              'opacity-80': !friendsOnlineStatus[player.userId || player.boardId],
            }"
          >
            <div class="relative">
              <img :src="generateAvatar(player.userId || player.boardId || player.name)" class="size-6 rounded-full" :alt="player.name">
              <span
                v-if="player.userId || player.boardId"
                class="absolute -bottom-0.5 -right-0.5 inline-flex size-2 rounded-full"
                :class="{
                  'bg-green-500': friendsOnlineStatus[player.userId || player.boardId],
                  'bg-gray-400': !friendsOnlineStatus[player.userId || player.boardId],
                }"
              />
            </div>
            <span
              class="max-w-52 truncate text-sm"
              :class="{
                'font-semibold': friendsOnlineStatus[player.userId || player.boardId],
              }"
            >{{ player.name }}</span>
            <div class="flex items-center gap-1">
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
            </div>
          </div>
        </div>

        <!-- Current Players Section -->
        <div class="border-t border-white/20 pt-4">
          <h3 class="mb-3 text-center text-sm font-semibold">
            Recent Players
          </h3>
          <div
            v-if="config?.friendsList?.recentPlayers?.length"
            class="space-y-4 overflow-y-auto"
          >
            <div
              v-for="player in config?.friendsList?.recentPlayers"
              :key="player.id"
              class="grid grid-cols-[auto_1fr_auto] items-center gap-2"
            >
              <img :src="generateAvatar(player.userId || player.boardId || player.name)" class="size-6 rounded-full" :alt="player.name">
              <span class="max-w-52 truncate text-sm">{{ player.name }}</span>
              <AppButton @click="addFriend(player as unknown as IPlayerInfo)" size="xs" auto title="Add to friends">
                <span class="icon-[pixelarticons--user-plus]" />
              </AppButton>
            </div>
          </div>
          <div v-else>
            <p class="text-center text-sm text-gray-500">
              No recent players
            </p>
          </div>
        </div>

        <!-- Button Section -->
        <div class="flex items-center justify-center">
          <AppButton @click="showAddFriendModal = true">
            Add Friend
          </AppButton>
        </div>
      </div>
    </AppSlide>

    <!-- Add Friend Modal -->
    <AppModal
      size="lg"
      :show="showAddFriendModal"
      title="Add New Friend"
    >
      <div class="space-y-4">
        <div class="space-y-2">
          <AppInput
            v-model="newFriend.name"
            label="Friend Name"
            placeholder="Enter friend's name"
          />
        </div>

        <div class="space-y-2">
          <AppInput
            v-model="newFriend.boardId"
            label="Board ID"
            placeholder="Enter board ID"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex w-full items-center space-x-3">
          <AppButton @click="showAddFriendModal = false">
            Cancel
          </AppButton>
          <AppButton
            @click="saveFriend"
            type="success"
          >
            Save
          </AppButton>
        </div>
      </template>
    </AppModal>

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
      :duration="60"
      :lobby-url="pendingInvitation.lobbyUrl"
      :class="twMerge(
        isOpen ? 'right-[21rem]' : 'right-5',
      )"
    />
  </div>
</template>

<script setup lang="ts">
import { isEqual } from "lodash";
import type { Runtime } from "wxt/browser";
import { twMerge } from "tailwind-merge";
import AppButton from "@/components/AppButton.vue";
import AppSlide from "@/components/AppSlide.vue";
import AppModal from "@/components/AppModal.vue";
import AppInput from "@/components/AppInput.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import AppInvite from "@/components/AppInvite.vue";
import type { IConfig, IFriend, IPlayerInfo } from "@/utils/storage";
import type { IGameData } from "@/utils/game-data-storage";
import { AutodartsToolsConfig, AutodartsToolsGlobalStatus, AutodartsToolsUrlStatus, defaultConfig } from "@/utils/storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";
import { generateAvatar, getUserIdFromToken } from "@/utils/helpers";

let gameDataWatcherUnwatch: () => void;
let urlWatcherUnwatch: () => void;

const config = ref<IConfig>();
const gameData = ref<IGameData>();
const url = ref<string | null>(null);
const lobbyId = ref<string | null>(null);
const isOpen = ref(true);
const showAddFriendModal = ref(false);
const newFriend = ref({
  name: "",
  boardId: "",
});
const showRemoveConfirmation = ref(false);
const playerToRemove = ref<IFriend | null>(null);
const socketStatus = ref<"connected" | "disconnected" | "connecting" | "error">("disconnected");
const userId = ref<string | null>(null);
const previousFriends = ref<IFriend[]>([]);
const heartbeatInterval = ref<number | null>(null);
const friendsStatusInterval = ref<number | null>(null);
const friendsOnlineStatus = ref<Record<string, boolean>>({});
// Add new reactive variables for invitations
const showInvitation = ref(false);
const invitationMessage = ref("");
const pendingInvitation = ref<{
  fromUserId: string;
  fromName: string;
  lobbyUrl: string;
}>({
  fromUserId: "",
  fromName: "",
  lobbyUrl: "",
});
let port: Runtime.Port | null = null;

const sortedFriends = computed(() => {
  if (!config.value?.friendsList?.friends) return [];

  return [ ...config.value.friendsList.friends ].sort((a, b) => {
    const aOnline = friendsOnlineStatus.value[a.userId || a.boardId] || false;
    const bOnline = friendsOnlineStatus.value[b.userId || b.boardId] || false;

    if (aOnline === bOnline) {
      // If online status is the same, maintain original order
      return 0;
    }
    // Sort online players first
    return aOnline ? -1 : 1;
  });
});

function isDuplicateFriend(newFriend: { name: string; boardId?: string; id?: string }) {
  if (!config.value) return false;
  return config.value.friendsList.friends.some(friend =>
    (friend.boardId && friend.boardId === newFriend.boardId)
    || (friend.name.toLowerCase() === newFriend.name.toLowerCase()),
  );
}

watch(config, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
  console.log("Friends List setting changed");

  // Only send friends data when the friends array has changed
  if (socketStatus.value === "connected" && userId.value && config.value) {
    const currentFriends = toRaw(config.value.friendsList.friends);
    if (!isEqual(currentFriends, previousFriends.value)) {
      previousFriends.value = [ ...currentFriends ];
      sendFriendsToServer();
    }
  }
}, { deep: true });

// Function to send friends data to socket server
async function sendFriendsToServer() {
  if (!config.value?.friendsList?.friends || !userId.value) return;

  console.log("Sending friends to server:", config.value.friendsList.friends);

  try {
    await browser.runtime.sendMessage({
      type: "update-friends",
      userId: userId.value,
      friends: config.value.friendsList.friends,
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
      .map(friend => friend.userId || friend.boardId)
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
    } else if (message.type === "lobby-invitation-error") {
      console.error("Error sending lobby invitation:", message.error);
      // Show an error notification or alert
      alert(`Failed to send invitation: ${message.error}`);
    } else if (message.type === "lobby-invitation-response") {
      console.log("Invitation response received:", message);
      if (message.accepted) {
        console.log("Friend accepted your invitation!");
      } else {
        console.log("Friend declined your invitation.");
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

  gameDataWatcherUnwatch = AutodartsToolsGameData.watch((_gameData: IGameData) => {
    gameData.value = _gameData;
    if (!config.value) return;
    config.value.friendsList.recentPlayers = Array.from(
      new Map(
        [ ...(gameData.value?.match?.players || []), ...(config.value.friendsList.recentPlayers || []) ]
          .map(player => [ player.userId || player.boardId || player.name, player ]),
      ).values(),
    ).slice(0, 10);
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
});

onBeforeUnmount(() => {
  gameDataWatcherUnwatch?.();
  urlWatcherUnwatch?.();

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
});

function getLobbyId() {
  if (!url.value) return null;
  const lobbyIdMatch = url.value.match(/\/lobbies\/([0-9a-f-]+)/);
  return lobbyIdMatch ? lobbyIdMatch[1] : null;
}

async function saveFriend() {
  if (!config.value) return;

  if (isDuplicateFriend(newFriend.value)) return;

  config.value.friendsList.friends.push({
    name: newFriend.value.name,
    boardId: newFriend.value.boardId,
    avatarUrl: generateAvatar(newFriend.value.boardId || newFriend.value.name),
  });

  await AutodartsToolsConfig.setValue(toRaw(config.value));

  showAddFriendModal.value = false;
  newFriend.value = { name: "", boardId: "" };
}

async function addFriend(player: IPlayerInfo) {
  if (!config.value) return;

  if (isDuplicateFriend(player)) return;

  config.value.friendsList.friends.push({
    userId: player.userId,
    name: player.name,
    boardId: player.boardId || "",
    avatarUrl: player.avatarUrl || generateAvatar(player.boardId || player.name),
  });

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
}

async function removeFriend(player: IFriend) {
  playerToRemove.value = player;
  showRemoveConfirmation.value = true;
}

async function confirmRemoveFriend() {
  if (!config.value || !playerToRemove.value) return;

  config.value.friendsList.friends = config.value.friendsList.friends.filter(
    (friend: IFriend) => friend.boardId !== playerToRemove.value?.boardId,
  );

  await AutodartsToolsConfig.setValue(toRaw(config.value));
  showRemoveConfirmation.value = false;
  playerToRemove.value = null;
}

function cancelRemoveFriend() {
  showRemoveConfirmation.value = false;
  playerToRemove.value = null;
}

async function inviteFriend(player: IFriend) {
  console.log("Inviting friend:", player);

  if (!userId.value || !player.userId) {
    console.error("Cannot invite: missing user ID for sender or recipient");
    return;
  }

  try {
    // Get the lobby URL from the input
    const lobbyUrl = url.value || window.location.href;

    if (!lobbyUrl) {
      console.error("Lobby URL is empty");
      alert("Lobby invite URL is empty. Please create or join a lobby first.");
      return;
    }

    // Get the name of the current user to pass with the invitation
    const globalStatus = await AutodartsToolsGlobalStatus.getValue();
    const fromName = globalStatus?.user?.name || "A friend";

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
    alert("Failed to send invitation. Please try again.");
  }
}
</script>
