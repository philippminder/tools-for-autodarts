<template>
  <div
    class="flex gap-2"
    :class="[
      vertical ? 'flex-col' : 'flex-wrap',
      className,
    ]"
  >
    <div
      v-for="(option, index) in options"
      :key="index"
      class="flex items-center"
      :class="{ 'cursor-not-allowed opacity-50': option.disabled }"
    >
      <AppButton
        @click="!option.disabled && selectOption(option.value)"
        :type="modelValue === option.value ? 'success' : 'default'"
        class="aspect-square rounded-full p-0"
        :class="[
          buttonSize === 'sm' ? '!size-8' : buttonSize === 'lg' ? '!size-12' : '!size-10',
        ]"
        :disabled="option.disabled"
      >
        <span v-if="modelValue === option.value" class="icon-[pixelarticons--check]" />
      </AppButton>
      <span
        v-if="option.label"
        class="ml-2"
        :class="{ 'text-white/50': option.disabled }"
      >
        {{ option.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue";

interface RadioOption {
  label?: string;
  value: string | number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  modelValue: string | number;
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

function selectOption(value: string | number) {
  emit("update:modelValue", value);
}
</script>
