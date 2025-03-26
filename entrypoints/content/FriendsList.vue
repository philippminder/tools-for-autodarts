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
            v-for="player in config?.friendsList?.friends"
            :key="player.boardId || player.name"
            class="grid grid-cols-[auto_1fr_auto] items-center gap-2"
          >
            <img :src="generateAvatar(player.boardId || player.name)" class="size-6 rounded-full" :alt="player.name">
            <span class="max-w-52 truncate text-sm">{{ player.name }}</span>
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
                v-if="player.id"
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
          <h3 class="mb-3 text-sm font-semibold">
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
              <img :src="generateAvatar(player.boardId || player.name)" class="size-6 rounded-full" :alt="player.name">
              <span class="max-w-52 truncate text-sm">{{ player.name }}</span>
              <AppButton @click="addFriend(player)" size="xs" auto title="Add to friends">
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
  </div>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue";
import AppSlide from "@/components/AppSlide.vue";
import AppModal from "@/components/AppModal.vue";
import AppInput from "@/components/AppInput.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import type { IConfig, IFriend, IPlayerInfo } from "@/utils/storage";
import type { IGameData } from "@/utils/game-data-storage";
import { AutodartsToolsConfig, defaultConfig } from "@/utils/storage";
import { AutodartsToolsGameData } from "@/utils/game-data-storage";
import { generateAvatar } from "@/utils/helpers";

let gameDataWatcherUnwatch: () => void;

const config = ref<IConfig>();
const gameData = ref<IGameData>();
const isOpen = ref(true);
const showAddFriendModal = ref(false);
const newFriend = ref({
  name: "",
  boardId: "",
});
const showRemoveConfirmation = ref(false);
const playerToRemove = ref<IFriend | null>(null);
const socketStatus = ref<"connected" | "disconnected" | "connecting" | "error">("disconnected");

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
}, { deep: true });

onBeforeMount(async () => {
  config.value = await AutodartsToolsConfig.getValue();
  gameData.value = await AutodartsToolsGameData.getValue();
  if (!config.value?.friendsList) config.value.friendsList = defaultConfig.friendsList;

  // for development only
  await nextTick();
  config.value.friendsList.enabled = true;
});

onMounted(async () => {
  gameDataWatcherUnwatch = AutodartsToolsGameData.watch((_gameData: IGameData) => {
    gameData.value = _gameData;
    if (!config.value) return;
    config.value.friendsList.recentPlayers = Array.from(
      new Map(
        [ ...(gameData.value?.match?.players || []), ...(config.value.friendsList.recentPlayers || []) ]
          .map(player => [ player.id || player.boardId || player.name, player ]),
      ).values(),
    ).slice(0, 10);
  });

  // Get initial socket status
  try {
    const response = await browser.runtime.sendMessage({ type: "get-socket-status" });
    if (response && response.status) {
      socketStatus.value = response.status;
    }
  } catch (error) {
    console.error("Error getting socket status:", error);
  }

  // Listen for socket status updates
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "socket-status-update") {
      socketStatus.value = message.status;
    }
  });
});

onBeforeUnmount(() => {
  gameDataWatcherUnwatch();
});

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
    id: player.id,
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
</script>
