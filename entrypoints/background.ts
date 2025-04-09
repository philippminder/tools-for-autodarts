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

    // Processing logic for browser.runtime.onMessage
    browser.runtime.onMessage.addListener((message, sender) => {
      // Handle file download-related messages
      if (message.type === "download-file") {
        // Download file handler logic
        const { fileData, mimeType, fileName } = message;

        // Create a Blob from the file data and download it
        const blob = new Blob([ fileData ], { type: mimeType });
        const url = URL.createObjectURL(blob);

        browser.downloads.download({
          url,
          filename: fileName,
          saveAs: true,
        }).then(() => {
          URL.revokeObjectURL(url);
        }).catch((error) => {
          console.error("Error downloading file:", error);
        });

        return Promise.resolve({ success: true });
      }

      // Handle chunked file downloads
      if (message.type === "download-chunked-start") {
        const { downloadId, mimeType } = message;
        downloadChunks.set(downloadId, {
          chunks: [],
          mimeType,
          completed: false,
        });
        return Promise.resolve({ success: true });
      }

      if (message.type === "download-chunked-part") {
        const { downloadId, chunk, index } = message;
        const download = downloadChunks.get(downloadId);

        if (download) {
          download.chunks[index] = chunk;
          return Promise.resolve({ success: true });
        }

        return Promise.resolve({ success: false, error: "Download not found" });
      }

      if (message.type === "download-chunked-complete") {
        const { downloadId, fileName } = message;
        const download = downloadChunks.get(downloadId);

        if (download) {
          download.completed = true;

          // Combine all chunks and download the file
          const fileData = download.chunks.join("");
          const blob = new Blob([ fileData ], { type: download.mimeType });
          const url = URL.createObjectURL(blob);

          browser.downloads.download({
            url,
            filename: fileName,
            saveAs: true,
          }).then(() => {
            URL.revokeObjectURL(url);
            downloadChunks.delete(downloadId);
          }).catch((error) => {
            console.error("Error downloading file:", error);
          });

          return Promise.resolve({ success: true });
        }

        return Promise.resolve({ success: false, error: "Download not found" });
      }

      return undefined;
    });
  },
});
