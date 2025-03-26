import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

console.log("Background script loading...");

export default defineBackground({
  main() {
    console.log("Background script initialized!", { id: browser.runtime.id });

    // Keep track of download chunks for large files
    const downloadChunks = new Map<string, {
      chunks: string[];
      mimeType: string;
      completed: boolean;
    }>();

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

      // Socket.IO related messages
      if (message.type === "socket:initialize") {
        console.log("Background: Initializing socket connection");
        initializeSocket();
        return true;
      }

      if (message.type === "socket:cleanup") {
        cleanupSocket();
        return true;
      }

      // File download related messages
      if (message.type === "fetch") {
        try {
          // Extract the URL and options from the message
          const { url, options = {} } = message;
          console.log("Background fetch:", url);

          // For chunked downloads of large files (like ZIP)
          if (message.chunked) {
            // Handle chunk requests
            if (message.action === "start") {
              // Start a new chunked download
              const response = await fetch(url, options);

              if (!response.ok) {
                return {
                  ok: false,
                  status: response.status,
                  statusText: response.statusText,
                };
              }

              // Generate download ID
              const downloadId = Math.random().toString(36).substring(2);

              // Get content type
              const contentType = response.headers.get("Content-Type") || "application/octet-stream";

              // Get blob data
              const blob = await response.blob();

              // Convert to base64
              const reader = new FileReader();
              reader.readAsDataURL(blob);

              // Store the chunks when the file is loaded
              return new Promise((resolve) => {
                reader.onload = () => {
                  const base64data = reader.result as string;

                  // Get base64 data only (remove the data:mimetype;base64, prefix)
                  const base64Content = base64data.split(",")[1];

                  // Split into chunks (2MB chunks to be safe)
                  const chunkSize = 2 * 1024 * 1024; // 2MB
                  const chunks: string[] = [];

                  for (let i = 0; i < base64Content.length; i += chunkSize) {
                    chunks.push(base64Content.slice(i, i + chunkSize));
                  }

                  // Store chunks in map
                  downloadChunks.set(downloadId, {
                    chunks,
                    mimeType: contentType,
                    completed: false,
                  });

                  resolve({
                    ok: true,
                    downloadId,
                    totalChunks: chunks.length,
                    mimeType: contentType,
                  });
                };
              });
            } else if (message.action === "getChunk") {
              // Return a specific chunk from a download
              const { downloadId, chunkIndex } = message;
              const download = downloadChunks.get(downloadId);

              if (!download) {
                return {
                  ok: false,
                  error: "Download not found",
                };
              }

              // Return the requested chunk
              return {
                ok: true,
                chunk: download.chunks[chunkIndex],
                isLast: chunkIndex === download.chunks.length - 1,
              };
            } else if (message.action === "complete") {
              // Clean up completed download
              const { downloadId } = message;

              if (downloadChunks.has(downloadId)) {
                downloadChunks.delete(downloadId);
              }

              return { ok: true };
            }
          }

          // For small files - regular fetch as before
          const response = await fetch(url, options);

          // Handle HEAD request
          if (options.method === "HEAD") {
            return {
              ok: response.ok,
              status: response.status,
              headers: {
                "Content-Type": response.headers.get("Content-Type"),
              },
            };
          }

          // For binary data like audio files, we need to handle the response as a blob
          if (response.ok) {
            // If the response size is too large (>10MB), suggest chunked download
            const contentLength = response.headers.get("Content-Length");
            if (contentLength && Number.parseInt(contentLength, 10) > 10 * 1024 * 1024) {
              return {
                ok: true,
                tooLarge: true,
                suggestChunked: true,
              };
            }

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
