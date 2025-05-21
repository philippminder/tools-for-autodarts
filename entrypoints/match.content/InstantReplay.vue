<template>
  <div
    v-show="config?.instantReplay?.enabled"
    class="fixed bottom-0 right-0 z-[190] size-72"
  >
    <div class="absolute inset-0">
      <video
        id="replay-video"
        ref="videoElement"
        autoplay
        muted
        playsinline
        :style="{ transform: `scale(${zoomLevel}) translate(${positionX}%, ${positionY}%)` }"
        class="size-full object-cover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { AutodartsToolsConfig, type IConfig } from "@/utils/storage";

const videoElement = ref<HTMLVideoElement | null>(null);
const config = ref<IConfig>();
const mediaStream = ref<MediaStream | null>(null);
const cameraError = ref<string | null>(null);
const DELAY_SECONDS = 3;

// For storing the delayed playback components
let sourceVideo: HTMLVideoElement | null = null;
let buffer: HTMLVideoElement[] = [];
let animationFrameId: number | null = null;
let sourceCanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let canvasStream: MediaStream | null = null;

// Computed properties for camera settings
const zoomLevel = computed(() => config.value?.instantReplay?.zoom || 1);
const positionX = computed(() => config.value?.instantReplay?.positionX ?? 0);
const positionY = computed(() => config.value?.instantReplay?.positionY ?? 0);

onMounted(async () => {
  // Load config and start camera
  await loadConfig();
  await startCamera();
});

onUnmounted(() => {
  cleanup();
});

// Watch for changes in config
watch(() => config.value?.instantReplay, async () => {
  if (config.value?.instantReplay?.enabled) {
    await startCamera();
  } else {
    cleanup();
  }
}, { deep: true });

function cleanup() {
  // Stop animation frame
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Clean up canvas stream
  if (canvasStream) {
    canvasStream.getTracks().forEach(track => track.stop());
    canvasStream = null;
  }

  // Clean up media stream
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }

  // Remove the source video element
  if (sourceVideo && sourceVideo.parentNode) {
    sourceVideo.parentNode.removeChild(sourceVideo);
    sourceVideo = null;
  }

  // Remove the canvas element
  if (sourceCanvas && sourceCanvas.parentNode) {
    sourceCanvas.parentNode.removeChild(sourceCanvas);
    sourceCanvas = null;
  }

  // Clear the buffer
  buffer = [];
  ctx = null;
}

async function loadConfig() {
  config.value = await AutodartsToolsConfig.getValue();
}

async function startCamera() {
  if (!config.value?.instantReplay?.enabled || !videoElement.value) return;

  try {
    // Clean up any existing resources
    cleanup();

    // Get the selected device ID from config
    const deviceId = config.value.instantReplay.deviceId;

    // Set up constraints based on whether we have a specific device ID
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false,
    };

    // Request camera access
    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints);

    // Create a new source video element for the live feed
    sourceVideo = document.createElement("video");
    sourceVideo.autoplay = true;
    sourceVideo.playsInline = true;
    sourceVideo.muted = true;
    sourceVideo.srcObject = mediaStream.value;

    // Wait for video to start playing
    await new Promise<void>((resolve) => {
      if (!sourceVideo) return resolve();

      const onPlaying = () => {
        sourceVideo?.removeEventListener("playing", onPlaying);
        resolve();
      };

      sourceVideo.addEventListener("playing", onPlaying);
      sourceVideo.play().catch((error) => {
        console.error("Error starting source video:", error);
        resolve();
      });
    });

    // Create the canvas for drawing the delayed video
    sourceCanvas = document.createElement("canvas");

    // Make sure source video has started and has dimensions
    if (sourceVideo.videoWidth && sourceVideo.videoHeight) {
      // Set canvas dimensions to match video
      sourceCanvas.width = sourceVideo.videoWidth;
      sourceCanvas.height = sourceVideo.videoHeight;

      // Get canvas context
      ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        console.log("Canvas and context created successfully");

        // Create a stream from the canvas
        canvasStream = sourceCanvas.captureStream(30);

        // Set the delayed stream as the source for our display video
        if (videoElement.value) {
          videoElement.value.srcObject = canvasStream;
        }

        // Start the delayed playback system
        startDelayedPlayback();
      }
    } else {
      console.error("Source video has no dimensions");
      cameraError.value = "Camera stream started but has no dimensions.";
    }
  } catch (error) {
    console.error("Error starting camera:", error);
    cameraError.value = "Failed to access the camera.";
  }
}

function startDelayedPlayback() {
  if (!sourceVideo || !ctx || !sourceCanvas) {
    console.error("Cannot start delayed playback: missing components");
    return;
  }

  // Calculate frame buffer size based on delay (assuming 30fps)
  const bufferSize = DELAY_SECONDS * 30;
  const frameBuffer: ImageData[] = [];
  let shouldOutput = false;

  console.log(`Starting delayed playback with buffer size: ${bufferSize}`);

  // Function to capture frames and create the delay
  const captureFrame = () => {
    if (!sourceVideo || !ctx || !sourceCanvas) {
      console.log("Stopping capture: components no longer available");
      return;
    }

    try {
      // Draw the current frame from the source video to the canvas
      ctx.drawImage(sourceVideo, 0, 0, sourceCanvas.width, sourceCanvas.height);

      // Get the frame data
      const frameData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

      // Add the frame to our buffer
      frameBuffer.push(frameData);

      // If buffer is full, start showing the delayed frames
      if (frameBuffer.length >= bufferSize) {
        shouldOutput = true;

        // Get the oldest frame
        const delayedFrame = frameBuffer.shift();

        // Put that frame back on the canvas
        if (delayedFrame) {
          ctx.putImageData(delayedFrame, 0, 0);
        }
      }

      // Schedule the next frame capture
      animationFrameId = requestAnimationFrame(captureFrame);
    } catch (e) {
      console.error("Error in capture frame:", e);
      // Try to continue anyway
      animationFrameId = requestAnimationFrame(captureFrame);
    }
  };

  // Start capturing frames
  animationFrameId = requestAnimationFrame(captureFrame);

  console.log("Delayed playback started");
}
</script>
