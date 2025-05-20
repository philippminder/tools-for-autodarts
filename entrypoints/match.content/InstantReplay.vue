<template>
  <div
    @click="hideReplay"
    v-if="isShowingReplay"
    class="fixed z-[190]"
    :class="replayContainerClasses"
    :style="replayContainerStyle"
  >
    <div class="absolute inset-0">
      <video
        @error="handleVideoError"
        @play="logVideoPlay"
        @canplay="logVideoCanPlay"
        id="replay-video"
        ref="videoElement"
        autoplay
        muted
        :class="twMerge(
          `size-full transition-opacity duration-300`,
          isFadingIn ? 'opacity-100' : 'opacity-0',
          isFadingOut ? 'opacity-0' : '',
          config?.instantReplay?.viewMode === 'full-page' ? 'object-contain' : 'object-cover',
        )"
        :style="{
          transform: `scale(${config?.instantReplay?.zoom || 1})`,
          transformOrigin: 'center',
          left: `${config?.instantReplay?.positionX || 0}px`,
          top: `${config?.instantReplay?.positionY || 0}px`,
        }"
      />
      <!-- Debug info, only shown when debugging enabled -->
      <div v-if="showDebugInfo" class="absolute bottom-2 left-2 rounded bg-black/80 p-2 text-xs text-white">
        <div>Stream active: {{ !!stream }}</div>
        <div>Video connected: {{ !!videoElement?.srcObject }}</div>
        <div>Playing: {{ isPlaying }}</div>
        <div>Recording state: {{ recordingState }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { twMerge } from "tailwind-merge";

import { AutodartsToolsConfig, type IConfig } from "@/utils/storage";
import { AutodartsToolsGameData, type IGameData } from "@/utils/game-data-storage";

// Reactive state
const config = ref<IConfig>();
const isShowingReplay = ref(false);
const isFadingIn = ref(false);
const isFadingOut = ref(false);
const videoElement = ref<HTMLVideoElement | null>(null);
const stream = ref<MediaStream | null>(null);
const isPlaying = ref(false);
const showDebugInfo = ref(true); // Set to true to show debug info

// Recording related variables
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const recordingBuffer = ref<Blob[]>([]);
const recordingState = ref<string>("idle");
const replayBuffer = ref<MediaStream | null>(null);
const recordingInterval = ref<number | null>(null);
const afterWinnerRecording = ref<boolean>(false);
const afterWinnerTimeout = ref<number | null>(null);

// Game data watcher
let gameDataWatcher: (() => void) | null = null;
let configWatcher: (() => void) | null = null;
let videoTimeoutId: number | null = null;
let fadeTimeoutId: number | null = null;

// Computed properties
const replayContainerClasses = computed(() => {
  if (config.value?.instantReplay?.viewMode === "full-page") {
    return "inset-0";
  } else {
    return "right-4 top-4 rounded-lg overflow-hidden shadow-lg border border-gray-700";
  }
});

const replayContainerStyle = computed(() => {
  if (config.value?.instantReplay?.viewMode === "full-page") {
    return {
      backgroundColor: "rgba(0, 0, 0, 0.85)",
    };
  } else {
    // For board-only mode, set a specific size
    return {
      width: "300px",
      height: "300px",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
    };
  }
});

// Methods
async function initCamera() {
  try {
    if (!config.value?.instantReplay?.enabled) return;

    // If there's already a stream, stop it before initializing a new one
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
    }

    // Get available devices for debugging
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === "videoinput");
    console.log("Autodarts Tools: Available video devices:", videoDevices);

    const constraints: MediaStreamConstraints = {
      video: config.value.instantReplay.deviceId
        ? { deviceId: { exact: config.value.instantReplay.deviceId } }
        : true,
    };

    console.log("Autodarts Tools: Requesting camera access with constraints:", constraints);
    stream.value = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Autodarts Tools: Camera stream obtained:", stream.value.id);
    console.log("Autodarts Tools: Active video tracks:", stream.value.getVideoTracks().map(t => ({
      label: t.label,
      id: t.id,
      settings: t.getSettings(),
    })));

    // Set up continuous recording for replay buffer
    setupContinuousRecording();
  } catch (error) {
    console.error("Autodarts Tools: Error initializing camera for instant replay", error);
  }
}

function setupContinuousRecording() {
  try {
    if (!stream.value) return;

    // Clear existing recording setup if any
    stopContinuousRecording();

    // Initialize the MediaRecorder with the stream
    mediaRecorder.value = new MediaRecorder(stream.value, { mimeType: "video/webm; codecs=vp9" });
    recordingState.value = "initializing";

    // Set up event handlers
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        if (afterWinnerRecording.value) {
          // Store chunks for after-winner recording
          recordedChunks.value.push(event.data);
        } else {
          // Maintain a buffer of recent chunks for pre-winner replay
          recordingBuffer.value.push(event.data);

          // Keep buffer at appropriate size based on config duration
          // Assuming each chunk is ~500ms, calculate how many chunks we need to keep
          const duration = config.value?.instantReplay?.duration || 5;
          const maxBufferChunks = Math.ceil((duration * 2)); // 2 chunks per second

          if (recordingBuffer.value.length > maxBufferChunks) {
            recordingBuffer.value.shift();
          }
        }
      }
    };

    // Start recording with 500ms chunks to have enough granularity for replay
    mediaRecorder.value.start(500);
    recordingState.value = "recording";

    console.log("Autodarts Tools: Continuous recording started for replay buffer");
  } catch (error) {
    console.error("Autodarts Tools: Error setting up continuous recording", error);
    recordingState.value = "error";
  }
}

function stopContinuousRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
  }

  if (recordingInterval.value) {
    window.clearInterval(recordingInterval.value);
    recordingInterval.value = null;
  }

  if (afterWinnerTimeout.value) {
    window.clearTimeout(afterWinnerTimeout.value);
    afterWinnerTimeout.value = null;
  }

  recordingState.value = "idle";
}

async function startAfterWinnerRecording() {
  if (!stream.value || !mediaRecorder.value) return;

  // Switch to recording the "after winner" part
  afterWinnerRecording.value = true;
  recordedChunks.value = [];

  // Only restart the recorder if it's not already recording
  if (mediaRecorder.value.state !== "recording") {
    mediaRecorder.value.start(500);
  }

  recordingState.value = "recording-after-winner";

  // Set timeout to stop recording after the configured duration
  const duration = config.value?.instantReplay?.duration || 5;
  afterWinnerTimeout.value = window.setTimeout(() => {
    finishRecordingAndShowReplay();
  }, duration * 1000);
}

async function finishRecordingAndShowReplay() {
  if (!mediaRecorder.value) return;

  // Stop recording if it's still active
  if (mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
  }

  // Clear the after-winner timeout if it exists
  if (afterWinnerTimeout.value) {
    window.clearTimeout(afterWinnerTimeout.value);
    afterWinnerTimeout.value = null;
  }

  recordingState.value = "processing";

  // Combine pre-winner buffer and after-winner recording
  const combinedChunks = [ ...recordingBuffer.value, ...recordedChunks.value ];

  if (combinedChunks.length === 0) {
    console.warn("Autodarts Tools: No recorded chunks available for replay");
    // Fall back to showing the live stream
    connectStreamToVideo();
    showReplay();
    return;
  }

  // Create a combined blob from all chunks
  const combinedBlob = new Blob(combinedChunks, { type: "video/webm" });

  // Create a URL for the blob
  const url = URL.createObjectURL(combinedBlob);

  // Set the video source to the recorded blob URL
  if (videoElement.value) {
    // Disconnect any existing stream
    videoElement.value.srcObject = null;

    // Set the source to the blob URL
    videoElement.value.src = url;

    // Show the replay
    showReplay();

    // Set up cleanup when replay ends
    videoElement.value.onended = () => {
      URL.revokeObjectURL(url);
      hideReplay();
      // Resume continuous recording
      afterWinnerRecording.value = false;
      setupContinuousRecording();
    };
  }

  recordingState.value = "playing-replay";

  // Resume continuous recording for next event
  afterWinnerRecording.value = false;
}

function connectStreamToVideo() {
  if (stream.value && videoElement.value) {
    console.log("Autodarts Tools: Connecting stream to video element");

    // Reset the src property in case it was previously set to a blob URL
    videoElement.value.src = "";
    videoElement.value.srcObject = stream.value;

    // Try to play immediately when connecting
    videoElement.value.play()
      .then(() => {
        console.log("Autodarts Tools: Video started playing during connection");
        isPlaying.value = true;
      })
      .catch((error) => {
        console.error("Autodarts Tools: Error playing video during connection", error);
        // We might be in a context where autoplay is not allowed yet
        isPlaying.value = false;
      });
  }
}

function showReplay() {
  if (!config.value?.instantReplay?.enabled) return;

  // Clear any existing timeouts
  if (videoTimeoutId) {
    window.clearTimeout(videoTimeoutId);
    videoTimeoutId = null;
  }

  if (fadeTimeoutId) {
    window.clearTimeout(fadeTimeoutId);
    fadeTimeoutId = null;
  }

  // Reset fade states
  isFadingOut.value = false;

  // Show the replay container
  isShowingReplay.value = true;

  // Start the fade-in transition
  setTimeout(() => {
    isFadingIn.value = true;
  }, 50);

  // Set up the timeout to hide the replay
  const duration = (config.value.instantReplay.duration * 2) * 1000; // Double the duration to account for before and after
  videoTimeoutId = window.setTimeout(() => {
    hideReplay();
  }, duration);

  console.log("Autodarts Tools: Showing instant replay");

  // Force video playback to start
  if (videoElement.value) {
    videoElement.value.play()
      .then(() => {
        console.log("Autodarts Tools: Video playback started");
        isPlaying.value = true;
      })
      .catch((error) => {
        console.error("Autodarts Tools: Error starting video playback", error);
        isPlaying.value = false;
      });
  }
}

function hideReplay() {
  // Start the fade-out transition
  isFadingIn.value = false;
  isFadingOut.value = true;

  // Wait for the transition to complete
  fadeTimeoutId = window.setTimeout(() => {
    isShowingReplay.value = false;
    isFadingOut.value = false;
    fadeTimeoutId = null;

    // Clean up video src if it's a blob URL
    if (videoElement.value && videoElement.value.src && videoElement.value.src.startsWith("blob:")) {
      URL.revokeObjectURL(videoElement.value.src);
      videoElement.value.src = "";
    }

    // Resume continuous recording if it was stopped
    if (recordingState.value !== "recording") {
      afterWinnerRecording.value = false;
      setupContinuousRecording();
    }
  }, 300); // Match the transition-duration-300

  console.log("Autodarts Tools: Hiding instant replay");
}

function handleVideoError(event: Event) {
  console.error("Autodarts Tools: Video error in instant replay", event);
  isPlaying.value = false;
}

function logVideoPlay() {
  console.log("Autodarts Tools: Video started playing");
  isPlaying.value = true;
}

function logVideoCanPlay() {
  console.log("Autodarts Tools: Video can play");
}

async function processGameData(gameData: IGameData) {
  if (!gameData.match) return;

  // Check for edit mode
  const editMode = gameData.match.activated !== undefined && gameData.match.activated >= 0;
  if (editMode) {
    hideReplay();
    return;
  }

  // Check for a winner (similar to winner-animation.ts)
  const winner = gameData.match.gameWinner >= 0;
  const winnerMatch = gameData.match.winner >= 0;

  if (winner || winnerMatch) {
    if (config.value?.instantReplay?.enabled) {
      // Start recording the "after winner" portion
      await startAfterWinnerRecording();
    }
  }
}

async function handleConfigChange(newConfig: IConfig) {
  // Update the local config reference
  config.value = newConfig;

  // Handle enabled/disabled state
  if (!newConfig.instantReplay.enabled) {
    // If disabled, hide the replay and clean up
    hideReplay();
    stopContinuousRecording();

    // Stop the stream if it exists
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
    }

    return;
  }

  // If enabled but no stream or device ID changed, initialize the camera
  const currentDeviceId = stream.value?.getVideoTracks()[0]?.getSettings()?.deviceId;
  if (!stream.value || currentDeviceId !== newConfig.instantReplay.deviceId) {
    await initCamera();
  }
}

// Lifecycle hooks
onMounted(async () => {
  console.log("Autodarts Tools: InstantReplay component mounted");

  // Load config
  config.value = await AutodartsToolsConfig.getValue();

  // Watch for config changes
  configWatcher = AutodartsToolsConfig.watch(handleConfigChange);

  // Watch for when the video element becomes available
  watch(videoElement, (newEl) => {
    if (newEl && stream.value) {
      console.log("Autodarts Tools: Video element ref changed, connecting stream");
      connectStreamToVideo();
    }
  });

  // Initialize camera if enabled
  if (config.value?.instantReplay?.enabled) {
    await initCamera();
  }

  // Set up game data watcher
  const initialGameData = await AutodartsToolsGameData.getValue();
  await processGameData(initialGameData);

  gameDataWatcher = AutodartsToolsGameData.watch(async (gameData) => {
    await processGameData(gameData);
  });

  // For testing, show replay after 3 seconds - REMOVE THIS IN PRODUCTION
  // setTimeout(showReplay, 3000)
});

onBeforeUnmount(() => {
  // Clean up resources
  if (gameDataWatcher) {
    gameDataWatcher();
    gameDataWatcher = null;
  }

  if (configWatcher) {
    configWatcher();
    configWatcher = null;
  }

  // Stop all timeouts
  if (videoTimeoutId) {
    window.clearTimeout(videoTimeoutId);
    videoTimeoutId = null;
  }

  if (fadeTimeoutId) {
    window.clearTimeout(fadeTimeoutId);
    fadeTimeoutId = null;
  }

  // Stop and clean up recording
  stopContinuousRecording();

  // Clean up any blob URLs
  if (videoElement.value && videoElement.value.src && videoElement.value.src.startsWith("blob:")) {
    URL.revokeObjectURL(videoElement.value.src);
  }

  // Stop video stream
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    stream.value = null;
  }

  console.log("Autodarts Tools: InstantReplay component unmounted");
});
</script>
