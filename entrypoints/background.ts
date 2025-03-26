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
    const SOCKET_SERVER_URL = "http://localhost:4455";
    let connectionStatus = "disconnected";

    // Initialize socket connection
    initializeSocket();

    // Broadcast connection status to any listeners
    function broadcastConnectionStatus() {
      browser.runtime.sendMessage({
        type: "socket-status-update",
        status: connectionStatus,
      }).catch(err => console.log("Error broadcasting status:", err));
    }

    function initializeSocket() {
      console.log("Autodarts Tools: Initializing socket connection to", SOCKET_SERVER_URL);

      // Clean up existing connection if any
      if (socket) {
        socket.disconnect();
      }

      // Create new socket connection with more robust options
      socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: Number.POSITIVE_INFINITY,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: [ "websocket", "polling" ],
        forceNew: true,
        extraHeaders: {
          Origin: `chrome-extension://${browser.runtime.id}`,
        },
      });

      let connectionAttempts = 0;
      const cooldownThreshold = 5;

      socket.io.on("reconnect_attempt", (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
        connectionStatus = "connecting";
        broadcastConnectionStatus();
      });

      socket.io.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
        connectionStatus = "error";
        broadcastConnectionStatus();
      });

      socket.io.on("reconnect_failed", () => {
        console.error("Socket reconnection failed after all attempts");
        connectionStatus = "error";
        broadcastConnectionStatus();
      });

      socket.on("connect", () => {
        console.log("Background: Connected to socket server with ID:", socket?.id);
        console.log("Connection transport:", socket?.io?.engine?.transport?.name);
        connectionAttempts = 0;
        connectionStatus = "connected";
        broadcastConnectionStatus();
      });

      socket.on("disconnect", (reason) => {
        console.log("Background: Disconnected from socket server. Reason:", reason);
        connectionStatus = "disconnected";
        broadcastConnectionStatus();

        if (reason === "io server disconnect" || reason === "transport close") {
          socket?.connect();
        }
      });

      socket.on("connect_error", (error) => {
        connectionAttempts++;
        console.error(`Background: Socket connection error (${connectionAttempts}):`, error.message);
        connectionStatus = "error";
        broadcastConnectionStatus();

        console.error("Error details:", {
          server: SOCKET_SERVER_URL,
          errorName: error.name,
          errorStack: error.stack,
          transport: socket?.io?.engine?.transport?.name,
          readyState: socket?.io?.engine?.readyState,
          attempt: connectionAttempts,
        });

        if (connectionAttempts >= cooldownThreshold) {
          console.log("Multiple connection failures, implementing cooling period");

          socket?.disconnect();
          socket = null;

          setTimeout(() => {
            console.log("Attempting fresh connection after cooling period");
            initializeSocket();
          }, 10000);
        }
      });

      socket.on("pong", (data) => {
        console.log("Background: Received pong:", data);
      });
    }

    function pingServer() {
      if (socket && socket.connected) {
        console.log("Sending ping to server");
        socket.emit("ping", { timestamp: Date.now() });
      } else {
        console.log("Cannot ping: socket not connected");
      }
    }

    // Basic message handler
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Background: Received message:", message);

      // Socket.IO related messages
      if (message.type === "socket:initialize") {
        console.log("Background: Initializing socket connection");
        initializeSocket();
        return true;
      }

      if (message.type === "socket:cleanup") {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        return true;
      }

      // Handle ping request
      if (message.type === "test-socket") {
        pingServer();
        return true;
      }

      // Handle connection status request
      if (message.type === "get-socket-status") {
        sendResponse({ status: connectionStatus });
        return true;
      }

      // Handle fetch requests with chunked download support
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
              return fetch(url, options).then(async (response) => {
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

          // For regular (non-chunked) fetches
          return fetch(url, options)
            .then(async (response) => {
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
            })
            .catch((error) => {
              console.error("Error in background fetch:", error);
              return {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
              };
            });
        } catch (error) {
          console.error("Error in background fetch:", error);
          return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      return true; // Keep the message channel open for async responses
    });

    // Cleanup when extension is being unloaded
    browser.runtime.onSuspend?.addListener(() => {
      console.log("Extension being suspended, cleaning up socket");
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    });
  },
});
