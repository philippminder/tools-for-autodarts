<template>
  <button
    @click="handleClick"
    v-bind="_.omit($attrs, 'class')"
    :class="twMerge(
      'user-select-none position-relative white-space-nowrap vertical-align-middle line-height-1.2 transition-property-common transition-duration-normal group relative inline-flex appearance-none items-center justify-center border-none outline-offset-2 outline-transparent',
      'rounded-[var(--chakra-radii-md)] font-[var(--chakra-fontWeights-semibold)]',

      // Default style
      type === 'default' && 'bg-[var(--chakra-colors-whiteAlpha-200)] text-[var(--chakra-colors-whiteAlpha-900)] enabled:hover:bg-[var(--chakra-colors-whiteAlpha-300)] enabled:active:bg-[var(--chakra-colors-whiteAlpha-300)]',

      // Success style
      type === 'success' && 'border border-solid border-[var(--chakra-colors-borderGreen)] bg-[var(--chakra-colors-glassGreen)] text-[var(--chakra-colors-white)] enabled:hover:bg-[rgba(58,255,0,0.3)] enabled:active:bg-[rgba(58,255,0,0.3)]',

      // Danger style
      type === 'danger' && 'border border-solid border-[var(--chakra-colors-borderRed)] bg-[var(--chakra-colors-glassRed)] text-[var(--chakra-colors-white)] enabled:hover:bg-[rgba(255,0,0,0.3)] enabled:active:bg-[rgba(255,0,0,0.3)]',

      // Default size (md)
      size === 'md' && 'h-[var(--chakra-sizes-10)] min-w-[var(--chakra-sizes-10)] pe-[var(--chakra-space-4)] ps-[var(--chakra-space-4)] text-[var(--chakra-fontSizes-md)]',

      // Small size
      size === 'sm' && 'h-8 max-h-8 min-w-8 pe-[var(--chakra-space-3)] ps-[var(--chakra-space-3)] text-[14px]',

      // Extra small size
      size === 'xs' && 'h-6 max-h-6 min-w-6 pe-[var(--chakra-space-2)] ps-[var(--chakra-space-2)] text-[14px]',

      // Large sizes
      size === 'lg' && 'h-[var(--chakra-sizes-12)] min-w-[var(--chakra-sizes-12)] pe-[var(--chakra-space-6)] ps-[var(--chakra-space-6)] text-[var(--chakra-fontSizes-lg)]',
      size === 'xl' && 'h-[var(--chakra-sizes-16)] min-w-[var(--chakra-sizes-16)] pe-[var(--chakra-space-8)] ps-[var(--chakra-space-8)] text-[var(--chakra-fontSizes-xl)]',

      'transition-colors',
      !auto && 'w-full',
      (disabled && !loading) && 'cursor-not-allowed opacity-50',
      $attrs.class?.toString(),
    )"
    :disabled="disabled || loading"
  >
    <div class="relative w-full">
      <div
        :class="twMerge(
          'flex w-full items-center space-x-2',
          centered && 'justify-center',
          loading && 'opacity-0',
        )"
      >
        <div
          :class="twMerge(
            'relative flex w-full items-center justify-center truncate',
          )"
        >
          <slot />
        </div>
      </div>
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" /><path fill="currentColor" d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import _ from "lodash";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  disabled?: boolean;
  auto?: boolean;
  centered?: boolean;
  type?: "default" | "danger" | "success";
}>(), {
  size: "md",
  centered: true,
  type: "default",
});

const emit = defineEmits([ "click" ]);

function handleClick() {
  if (!props.disabled && !props.loading) {
    emit("click");
  }
}
</script>
