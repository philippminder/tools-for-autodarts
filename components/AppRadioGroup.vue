<template>
  <div
    :class="twMerge(
      'flex gap-2',
      vertical ? 'flex-col' : 'flex-wrap gap-5',
      className,
    )"
  >
    <div
      v-for="(option, index) in options"
      :key="index"
      :class="twMerge(
        'flex items-center',
        option.disabled ? 'cursor-not-allowed opacity-50' : '',
      )"
    >
      <AppButton
        @click="!option.disabled && selectOption(option.value)"
        :type="modelValue === option.value ? 'success' : 'default'"
        :class="twMerge(
          'aspect-square min-w-8 rounded-full p-0',
          buttonSize === 'sm' ? '!size-8' : buttonSize === 'lg' ? '!size-12' : '!size-10',
        )"
        :disabled="option.disabled"
      >
        <span v-if="modelValue === option.value" class="icon-[pixelarticons--check]" />
      </AppButton>
      <span
        v-if="option.label"
        :class="twMerge(
          'ml-2',
          option.disabled ? 'text-white/50' : '',
        )"
      >
        {{ option.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import AppButton from "@/components/AppButton.vue";

interface RadioOption {
  label?: string;
  value: string | number | boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  modelValue: string | number | boolean;
  options: RadioOption[];
  name?: string;
  vertical?: boolean;
  buttonSize?: "sm" | "md" | "lg";
  className?: string;
}>(), {
  vertical: false,
  buttonSize: "md",
  className: "",
});

const emit = defineEmits([ "update:modelValue" ]);

function selectOption(value: string | number | boolean) {
  emit("update:modelValue", value);
}
</script>
