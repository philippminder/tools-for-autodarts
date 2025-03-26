<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="fixed bottom-5 right-5 z-50 w-80 rounded-lg shadow-lg">
      <div class="dialog-bg relative rounded-lg p-4">
        <div class="mb-2 flex items-center gap-2">
          <span class="icon-[pixelarticons--mail-arrow-right] text-lg" />
          <h3 class="text-lg font-semibold">
            Lobby Invitation
          </h3>
        </div>

        <p class="mb-3 text-sm text-white/80">
          {{ message }}
        </p>

        <div class="mb-3 flex justify-end space-x-2">
          <AppButton
            @click="$emit('decline')"
            size="xs"
            type="danger"
          >
            Decline
          </AppButton>
          <AppButton
            @click="$emit('accept')"
            size="xs"
            type="success"
          >
            Accept
          </AppButton>
        </div>

        <!-- Progress bar -->
        <div class="h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            class="h-full bg-green-500 transition-all duration-100"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import AppButton from "@/components/AppButton.vue";

const props = defineProps<{
  show: boolean;
  message: string;
  duration?: number; // Duration in seconds
  lobbyUrl?: string;
}>();

const emit = defineEmits([ "accept", "decline", "timeout" ]);

const timeRemaining = ref(props.duration || 15);
const timer = ref<number | null>(null);

const progressPercentage = computed(() => {
  return (timeRemaining.value / (props.duration || 15)) * 100;
});

onMounted(() => {
  if (props.show) {
    startTimer();
  }
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    timeRemaining.value = props.duration || 15;
    startTimer();
  } else {
    stopTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});

function startTimer() {
  if (timer.value) return;

  timer.value = window.setInterval(() => {
    timeRemaining.value -= 0.1;

    if (timeRemaining.value <= 0) {
      stopTimer();
      emit("timeout");
    }
  }, 100);
}

function stopTimer() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}
</script>
