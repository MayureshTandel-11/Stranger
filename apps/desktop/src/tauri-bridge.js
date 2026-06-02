export async function initTauriBridge(onNativeEvent) {
  const isTauri = Boolean(window.__TAURI_INTERNALS__);
  if (!isTauri) {
    return () => {};
  }

  const { listen } = await import("@tauri-apps/api/event");

  const unlistenCallbacks = await Promise.all([
    listen("overlay:show", (event) => onNativeEvent("overlay:show", event.payload)),
    listen("overlay:hide", (event) => onNativeEvent("overlay:hide", event.payload)),
    listen("wake.detected", (event) => onNativeEvent("wake.detected", event.payload)),
    listen("state:update", (event) => onNativeEvent("state:update", event.payload))
  ]);

  return () => {
    for (const unlisten of unlistenCallbacks) {
      unlisten();
    }
  };
}
