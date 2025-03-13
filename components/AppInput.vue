<template>
  <div :class="twMerge('w-full', wrapperClass)">
    <label v-if="label" :for="id" class="mb-1 block text-sm font-semibold text-white/70">
      {{ label }}
    </label>
    <div class="relative">
      <div v-if="leftIcon" class="absolute inset-y-0 left-0 flex items-center pl-3">
        <span :class="leftIcon" />
      </div>
      <input
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="twMerge(
          'w-full rounded-md border border-white/10 bg-transparent px-3 py-2 outline-none transition-colors',
          'placeholder:text-white/40',
          'focus:border-white/30',
          disabled && 'cursor-not-allowed opacity-50',
          size === 'sm' && 'px-2 py-1 text-sm',
          size === 'lg' && 'px-4 py-3 text-lg',
          error && 'border-red-500',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          inputClass,
        )"
      >
      <div v-if="rightIcon" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <span :class="rightIcon" />
      </div>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-500">
      {{ error }}
    </p>
    <p v-else-if="helperText" class="mt-1 text-xs text-white/50">
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  id?: string;
  size?: "sm" | "md" | "lg";
  inputClass?: string;
  wrapperClass?: string;
}>(), {
  type: "text",
  size: "md",
  id: `input-${Math.random().toString(36).substring(2, 9)}`,
  inputClass: "",
  wrapperClass: "",
});

defineEmits([ "update:modelValue" ]);
</script>
