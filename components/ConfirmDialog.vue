<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div @click="$emit('cancel')" class="absolute inset-0 bg-black/30" />
      <div class="gradient-bg animate-dialog-enter relative w-full max-w-md scale-100 rounded-md border border-white/10 p-6 shadow-lg">
        <h3 class="mb-4 text-xl font-semibold">
          {{ title }}
        </h3>
        <p class="mb-6">
          {{ message }}
        </p>
        <div class="flex justify-end gap-3">
          <AppButton
            @click="$emit('cancel')"
            class="rounded-md border border-white/10 bg-transparent px-4 py-2 hover:bg-white/10"
          >
            {{ cancelText }}
          </AppButton>
          <AppButton
            @click="$emit('confirm')"
            class="rounded-md bg-cyan-600 px-4 py-2 hover:bg-cyan-700"
          >
            {{ confirmText }}
          </AppButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue";

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: "Confirm",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
});

defineEmits([ "confirm", "cancel" ]);
</script>

<style scoped>
.gradient-bg {
  background-image: radial-gradient(50% 30% at 86% 0%, rgba(49, 51, 112, 0.89) 0%, rgba(64, 52, 134, 0) 100%),
                    radial-gradient(50% 70% at 70% 22%, rgba(38, 89, 154, 0.9) 0%, rgba(64, 52, 134, 0) 100%),
                    radial-gradient(50% 70% at 112% 44%, rgba(44, 67, 108, 0.85) 0%, rgba(64, 52, 134, 0) 100%),
                    radial-gradient(90% 90% at -12% 89%, rgba(15, 47, 80, 0.88) 0%, rgba(64, 52, 134, 0) 100%),
                    radial-gradient(50% 70% at -2% 53%, rgba(52, 32, 95, 0.89) 0%, rgba(64, 52, 134, 0) 100%),
                    radial-gradient(50% 70% at 36% 22%, rgba(64, 52, 134, 0.83) 0%, rgba(64, 52, 134, 0) 100%),
                    radial-gradient(50% 40% at 66% 59%, rgba(32, 111, 185, 0.87) 7%, rgba(32, 111, 185, 0) 100%),
                    radial-gradient(75% 75% at 50% 50%, rgb(54, 98, 185) 1%, rgb(45, 40, 91) 100%);
}

@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-dialog-enter {
  animation: dialog-enter 0.3s ease-out forwards;
}
</style>
