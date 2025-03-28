<template>
  <div
    class="grid grid-cols-[auto_1fr_auto] items-center gap-2"
    :class="{
      'opacity-80': !friend.userId || !isOnline,
    }"
  >
    <div class="relative">
      <img :src="avatarSrc" class="size-6 rounded-full" :alt="friend.name">
      <span
        v-if="friend.userId"
        class="absolute -bottom-0.5 -right-0.5 inline-flex size-2 rounded-full"
        :class="{
          'bg-green-500': friend.userId && isOnline,
          'bg-gray-400': !friend.userId || !isOnline,
        }"
      />
    </div>
    <span
      class="max-w-52 truncate text-sm"
      :class="{
        'font-semibold': friend.userId && isOnline,
      }"
    >{{ friend.name }}</span>
    <div class="flex items-center gap-1">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { generateAvatar } from "@/utils/helpers";
import type { IFriend } from "@/utils/storage";

const props = defineProps<{
  friend: IFriend;
  isOnline?: boolean;
}>();

const avatarSrc = ref<string>("");

// Check if the gravatar URL is a default or custom one using fetch with d=404
async function isDefaultGravatar(url: string): Promise<boolean> {
  try {
    // Convert URL to use d=404 parameter to check if custom avatar exists
    const test404Url = url.includes("?")
      ? `${url.replace(/[?&]d=[^&]+/, "")}&d=404`
      : `${url}?d=404`;

    // Make HEAD request to avoid downloading the whole image
    const response = await fetch(test404Url, { method: "HEAD" });

    // If response is 404, it means no custom avatar exists
    return response.status === 404;
  } catch (error) {
    // In case of network error, consider it a default avatar
    console.error("Error checking Gravatar:", error);
    return true;
  }
}

onMounted(async () => {
  if (props.friend.avatarUrl) {
    // Check if the URL is a Gravatar URL
    if (props.friend.avatarUrl.includes("gravatar.com")) {
      // If it's a Gravatar URL, check if it's a default one
      const isDefault = await isDefaultGravatar(props.friend.avatarUrl);
      if (!isDefault) {
        // Use the custom avatar if it exists
        avatarSrc.value = props.friend.avatarUrl;
        return;
      }
    } else {
      // If it's not a Gravatar URL, use it directly
      avatarSrc.value = props.friend.avatarUrl;
      return;
    }
  }

  // Generate an avatar based on the user ID or name
  avatarSrc.value = generateAvatar(props.friend.userId || props.friend.name);
});
</script>
