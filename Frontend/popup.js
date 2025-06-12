document.addEventListener('DOMContentLoaded', () => {
  // 🔄 Restaurar el estado del plugin
  chrome.storage.local.get(['pluginEnabled'], function (result) {
    const isEnabled = result.pluginEnabled !== false;
    pluginToggle.checked = isEnabled;
    overlay.classList.toggle('hidden', isEnabled);
  });

  // 🔍 Obtener último resultado de análisis
  chrome.storage.local.get("ultimoResultado", (res) => {
    if (res.ultimoResultado) {
      actualizarUI(res.ultimoResultado);
    }
  });

  // 📬 Escuchar mensajes en tiempo real desde background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.tipo === "resultado") {
      chrome.storage.local.set({ "ultimoResultado": message.resultado });
      actualizarUI(message.resultado);
    }
  });
});

// ⚠️ Decide si mostrar pantalla roja o verde
function actualizarUI(data) {
  const prob = Math.round((data.score || data.probabilidad || 0.79) * 100);

  const esPeligrosa = ["Phishing", "Maliciosa", "Insegura"].includes(data.result) || data.isPhishing === true;

  if (esPeligrosa) {
    showRedScreen(prob);
  } else {
    showGreenScreen(prob);
  }
}

// ✅ Mostrar pantalla verde
function showGreenScreen(prob) {
  document.getElementById('greenScreen').style.display = 'block';
  document.getElementById('redScreen').style.display = 'none';
  document.getElementById('proba_ph').textContent = "Probabilidad: " + prob + "%";
}

// 🚨 Mostrar pantalla roja
function showRedScreen(prob) {
  document.getElementById('redScreen').style.display = 'block';
  document.getElementById('greenScreen').style.display = 'none';
  document.getElementById('proba_ph_roja').textContent = "Probabilidad: " + prob + "%";
}

// 🔘 Control del switch de activación/desactivación del plugin
const pluginToggle = document.getElementById('pluginToggle');
const overlay = document.getElementById('disabledOverlay');

pluginToggle.addEventListener('change', function () {
  const isEnabled = this.checked;
  chrome.storage.local.set({ pluginEnabled: isEnabled }, function () {
    overlay.classList.toggle('hidden', isEnabled);
  });
});
