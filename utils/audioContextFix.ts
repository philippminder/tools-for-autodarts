/**
 * This utility patches the AudioContext constructor to ensure it's only created after user interaction.
 * It helps prevent the "The AudioContext was not allowed to start" warning.
 */

// Track if we've had user interaction
let hasUserInteraction = false;

// Store the original AudioContext constructor
const OriginalAudioContext = window.AudioContext || (window as any).webkitAudioContext;

if (OriginalAudioContext) {
  // Function to handle user interaction
  const handleUserInteraction = () => {
    hasUserInteraction = true;
    // Remove listeners once we've had interaction
    document.removeEventListener("click", handleUserInteraction);
    document.removeEventListener("touchstart", handleUserInteraction);
    document.removeEventListener("keydown", handleUserInteraction);
  };

  // Add listeners for user interaction
  document.addEventListener("click", handleUserInteraction);
  document.addEventListener("touchstart", handleUserInteraction);
  document.addEventListener("keydown", handleUserInteraction);

  // Create a patched AudioContext constructor
  const PatchedAudioContext = function (this: AudioContext, ...args: any[]) {
    const audioContext = new OriginalAudioContext(...args);

    // If we haven't had user interaction, suspend the context
    if (!hasUserInteraction) {
      audioContext.suspend();

      // Resume the context after user interaction
      const resumeAfterInteraction = () => {
        if (hasUserInteraction && audioContext.state === "suspended") {
          audioContext.resume().catch(err => console.warn("Failed to resume AudioContext:", err));
        } else if (!hasUserInteraction) {
          // Try again later if we still don't have user interaction
          setTimeout(resumeAfterInteraction, 100);
        }
      };

      setTimeout(resumeAfterInteraction, 100);
    }

    return audioContext;
  } as any;

  // Copy prototype and properties
  PatchedAudioContext.prototype = OriginalAudioContext.prototype;
  Object.setPrototypeOf(PatchedAudioContext, OriginalAudioContext);

  // Replace the global AudioContext constructor
  (window as any).AudioContext = PatchedAudioContext;
  if ((window as any).webkitAudioContext) {
    (window as any).webkitAudioContext = PatchedAudioContext;
  }
}

export function resumeAudioContext() {
  hasUserInteraction = true;

  // Find and resume any suspended AudioContext instances
  document.querySelectorAll("audio, video").forEach((element) => {
    // Type check to ensure we're working with HTMLMediaElement
    if (element instanceof HTMLMediaElement && element.paused) {
      // Create a temporary silent audio context to resume
      const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      tempContext.resume().then(() => tempContext.close()).catch(() => {});
    }
  });
}
