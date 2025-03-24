export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  // Listen for messages from the content script
  browser.runtime.onMessage.addListener(async (message, sender) => {
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
});
