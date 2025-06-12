console.log("⚙️ Service worker iniciado correctamente");

// === WHITELIST ===
const whitelist = [
  "google.com",
  "openai.com",
  "chat.openai.com",
  "microsoft.com",
  "facebook.com",
  "github.com",
  "youtube.com",
  "phishtank.com",
  "senati.edu.pe",
  "sunat.gob.pe",
  "gob.pe",
  "minedu.gob.pe",
  "chatgpt.com"
];

function isWhitelisted(url) {
  try {
    const hostname = new URL(url).hostname;
    return whitelist.some(allowed => hostname.includes(allowed));
  } catch (e) {
    return false;
  }
}

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

      // ✅ Si está en la whitelist, asumimos segura
      if (isWhitelisted(tab.url)) {
        const resultado = {
          url: tab.url,
          result: "Benigna",
          score: 0.99
        };

        chrome.action.setBadgeText({ text: "✔", tabId });
        chrome.action.setBadgeBackgroundColor({ color: "green", tabId });
        chrome.storage.local.set({ ultimoResultado: resultado });

        chrome.runtime.sendMessage({ tipo: "resultado", resultado }, () => {
          if (chrome.runtime.lastError) {
            console.warn("📭 Popup no abierto, mensaje no entregado.");
          }
        });

        return; // 🔚 Salimos sin analizar
      }

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

          const esPeligrosa = ["Phishing", "Maliciosa", "Insegura"].includes(data.result) || data.isPhishing === true;
          const badge = esPeligrosa ? "⚠️" : "✔";
          const color = esPeligrosa ? "red" : "green";

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

          if (esPeligrosa) {
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
