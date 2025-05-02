// This file would contain the service worker registration
// Here's a simplified version of what it might look like

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered: ", registration)
        })
        .catch((error) => {
          console.log("Service Worker registration failed: ", error)
        })
    })
  }
}
