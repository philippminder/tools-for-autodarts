<template>
  <button
    @click="toggle"
    :class="twMerge(
      'flex aspect-square !size-10 items-center justify-center rounded-full p-0 transition-colors',
      modelValue
        ? 'border border-solid border-[var(--chakra-colors-borderGreen)] bg-[var(--chakra-colors-glassGreen)] text-[var(--chakra-colors-white)] enabled:hover:bg-[rgba(58,255,0,0.3)] enabled:active:bg-[rgba(58,255,0,0.3)]'
        : 'bg-[var(--chakra-colors-whiteAlpha-200)] text-[var(--chakra-colors-whiteAlpha-900)] enabled:hover:bg-[var(--chakra-colors-whiteAlpha-300)] enabled:active:bg-[var(--chakra-colors-whiteAlpha-300)]',
    )"
  >
    <span v-if="modelValue" class="icon-[pixelarticons--check]" />
    <span v-else class="icon-[pixelarticons--close]" />
  </button>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits([ "update:modelValue" ]);

function toggle() {
  emit("update:modelValue", !props.modelValue);
}
</script>
