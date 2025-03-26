import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

console.log("Background script loading...");

export default defineBackground({
  main() {
    console.log("Background script initialized!", { id: browser.runtime.id });

    let socket: Socket | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    // Initialize socket connection immediately
    initializeSocket();

    // Initialize socket connection
    function initializeSocket() {
      console.log("Autodarts Tools: Initializing socket connection");

      if (socket) return; // Already initialized

      socket = io("http://localhost:3000");

      socket.on("connect", () => {
        console.log("Background: Connected to socket server");
      });

      socket.on("disconnect", () => {
        console.log("Background: Disconnected from socket server");
      });

      socket.on("connect_error", (error) => {
        console.error("Background: Socket connection error:", error);
      });

      socket.on("pong", (data) => {
        console.log("Background: Received pong:", data);
        // Broadcast pong to all content scripts
        browser.runtime.sendMessage({ type: "socket:pong", data }).catch(console.error);
      });

      // Start ping interval
      pingInterval = setInterval(() => {
        if (socket?.connected) {
          console.log("Background: Sending ping");
          socket.emit("ping");
        }
      }, 10000);
    }

    // Clean up function
    function cleanupSocket() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    }

    // Listen for messages from the content script
    browser.runtime.onMessage.addListener(async (message, sender) => {
      console.log("Background: Received message:", message);

      if (message.type === "socket:initialize") {
        console.log("Background: Initializing socket connection");
        initializeSocket();
        return true;
      }

      if (message.type === "socket:cleanup") {
        cleanupSocket();
        return true;
      }

      if (message.type === "fetch") {
        try {
          // Extract the URL and options from the message
          const { url, options = {} } = message;
          console.log("Background fetch:", url);

          // Perform the fetch request (background scripts aren't subject to CORS)
          const response = await fetch(url, options);

          // For binary data like audio files, we need to handle the response as a blob
          if (response.ok) {
            const blob = await response.blob();
            // Convert blob to base64 to pass back to the content script
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
              reader.onload = () => {
                const base64data = reader.result;
                resolve({
                  ok: true,
                  status: response.status,
                  data: base64data,
                });
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
          } else {
            return {
              ok: false,
              status: response.status,
              statusText: response.statusText,
            };
          }
        } catch (error) {
          console.error("Error in background fetch:", error);
          return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      return true; // Keep the message channel open for the async response
    });
  },
});
