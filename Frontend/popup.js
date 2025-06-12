document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['pluginEnabled'], function (result) {
    const isEnabled = result.pluginEnabled !== false;
    pluginToggle.checked = isEnabled;
    overlay.classList.toggle('hidden', isEnabled);
  });

  chrome.storage.local.get("ultimoResultado", (res) => {
    if (res.ultimoResultado) {
      actualizarUI(res.ultimoResultado);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.tipo === "resultado") {
      chrome.storage.local.set({ "ultimoResultado": message.resultado });
      actualizarUI(message.resultado);
    }
  });
});

function actualizarUI(data) {
  const prob = Math.round((data.score || data.probabilidad || 0.79) * 100);
  if (data.result === "Phishing" || data.isPhishing === true) {
    showRedScreen(prob);
  } else {
    showGreenScreen(prob);
  }
}

function showGreenScreen(prob) {
  document.getElementById('greenScreen').style.display = 'block';
  document.getElementById('redScreen').style.display = 'none';
  document.getElementById('proba_ph').textContent = "Probabilidad: " + prob + "%";
}

function showRedScreen(prob) {
  document.getElementById('redScreen').style.display = 'block';
  document.getElementById('greenScreen').style.display = 'none';
  document.getElementById('proba_ph_roja').textContent = "Probabilidad: " + prob + "%";
}

const pluginToggle = document.getElementById('pluginToggle');
const overlay = document.getElementById('disabledOverlay');

pluginToggle.addEventListener('change', function () {
  const isEnabled = this.checked;
  chrome.storage.local.set({ pluginEnabled: isEnabled }, function () {
    overlay.classList.toggle('hidden', isEnabled);
  });
});
