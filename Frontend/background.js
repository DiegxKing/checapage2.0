console.log("⚙️ Service worker iniciado correctamente");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith("http")) {
    chrome.storage.local.get(["pluginEnabled"], (result) => {
      const isEnabled = result.pluginEnabled !== false;
      if (!isEnabled) {
        console.log("🛑 Plugin desactivado, no se analiza esta URL.");
        chrome.action.setBadgeText({ text: "⛔", tabId });
        chrome.action.setBadgeBackgroundColor({ color: "gray", tabId });
        return;
      }

      console.log("🌐 URL detectada:", tab.url);

      fetch("https://checapage2-0.onrender.com/predict_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url })
      })
        .then(response => {
          if (!response.ok) throw new Error(`Status ${response.status}`);
          return response.json();
        })
        .then(data => {
          console.log("📊 Resultado del análisis:", data);

          const badge = data.result === "Phishing" ? "⚠️" : "✔";
          const color = data.result === "Phishing" ? "red" : "green";
          chrome.action.setBadgeText({ text: badge, tabId });
          chrome.action.setBadgeBackgroundColor({ color, tabId });

          const resultado = {
            url: tab.url,
            result: data.result,
            score: data.score || data.probabilidad || 0.79
          };

          chrome.storage.local.set({ ultimoResultado: resultado });

          chrome.runtime.sendMessage({ tipo: "resultado", resultado }, () => {
            if (chrome.runtime.lastError) {
              console.warn("📭 Popup no abierto, mensaje no entregado.");
            }
          });

          if (data.result === "Phishing") {
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["overlay.js"]
            });
          }
        })
        .catch(err => {
          console.error("❌ Error al conectar con el backend:", err);
        });
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extensión instalada o recargada");
});