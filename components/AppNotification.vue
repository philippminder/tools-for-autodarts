<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-8 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-8 opacity-0"
  >
    <div v-if="show" class="fixed bottom-4 right-8 z-50 max-w-md rounded-md p-4 shadow-lg backdrop-blur-sm" :class="type === 'success' ? 'success-overlay' : 'error-overlay'">
      <div class="flex items-center">
        <AppIcon v-if="type === 'success'" icon="mdi-light:check-circle" class="mr-2 text-xl" />
        <AppIcon v-else icon="mdi-light:alert-circle" class="mr-2 text-xl" />
        <div>{{ message }}</div>
        <button @click="$emit('close')" class="ml-4 text-xl opacity-70 hover:opacity-100">
          <AppIcon icon="mdi-light:close" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String as () => "success" | "error",
    default: "success",
    validator: (value: string) => [ "success", "error" ].includes(value),
  },
  duration: {
    type: Number,
    default: 5000, // 5 seconds by default
  },
});

defineEmits([ "close" ]);
</script>

<style scoped>
.success-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(22, 163, 74, 0.3);
  border-radius: 0.375rem;
  pointer-events: none;
}

.error-overlay {
  position: relative;
}

.error-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(220, 38, 38, 0.3);
  border-radius: 0.375rem;
  pointer-events: none;
}
</style>
