export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  // Keep track of download chunks for large files
  const downloadChunks = new Map<string, {
    chunks: string[];
    mimeType: string;
    completed: boolean;
  }>();

  // Listen for messages from the content script
  browser.runtime.onMessage.addListener(async (message, sender) => {
    console.log("Autodarts Tools: Background fetch message", message);

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
});
