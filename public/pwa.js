(() => {
  let installPrompt = null;
  const button = () => document.getElementById("installAppButton");
  const status = () => document.getElementById("installStatus");
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const refreshInstallUI = () => {
    const installButton = button();
    const message = status();
    if (!installButton || !message) return;
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    installButton.hidden = !installPrompt || standalone;
    if (standalone) message.textContent = "NegosyoDepot is already installed on this device.";
    else if (installPrompt) message.textContent = "Your browser can add NegosyoDepot as an app on this device.";
    else if (isIOS()) message.textContent = "On iPhone or iPad, open this page in Safari and use Share → Add to Home Screen.";
    else message.textContent = "Use your browser’s menu for the install option. It appears when your browser supports installation.";
  };
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    refreshInstallUI();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    refreshInstallUI();
    const message = status();
    if (message) message.textContent = "NegosyoDepot was added to this device.";
  });
  document.addEventListener("click", async event => {
    if (!event.target.closest("#installAppButton")) return;
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    refreshInstallUI();
  });
  window.addEventListener("hashchange", () => setTimeout(refreshInstallUI, 0));
  window.addEventListener("DOMContentLoaded", refreshInstallUI);
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(() => {}));
  }
})();
