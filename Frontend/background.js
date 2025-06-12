const tabStates = new Map();
const MAX_HISTORY_ITEMS = 10;

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

function storeScanHistory(result) {
  chrome.storage.local.get(["scanHistory"], (res) => {
    const history = res.scanHistory || [];
    history.unshift({
      url: result.url,
      isPhishing: result.isPhishing,
      timestamp: new Date().toLocaleString(),
      reported: false
    });
    if (history.length > MAX_HISTORY_ITEMS) history.pop();
    chrome.storage.local.set({ scanHistory: history });
  });
}

function injectPopup(tabId, url, isPhishing, isSamePage = false) {
  const hostname = new URL(url).hostname;

  const popupHTML = isPhishing
    ? `
      <div id="phishing-warning-popup" style="...">PHISHING WARNING HTML</div>
    `
    : isSamePage
    ? `<div id="same-page-indicator" style="...">Same Website HTML</div>`
    : `<div id="safe-url-indicator" style="...">Safe Website HTML</div>`;

  chrome.scripting.executeScript({
    target: { tabId },
    func: (html) => {
      const existing = document.getElementById('phishing-warning-popup') ||
                       document.getElementById('same-page-indicator') ||
                       document.getElementById('safe-url-indicator');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
    },
    args: [popupHTML]
  });
}

async function checkForPhishing(url, tabId, isReload = false) {
  try {
    const domain = getDomain(url);
    const tabState = tabStates.get(tabId);

    const history = await new Promise((resolve) => {
      chrome.storage.local.get(["scanHistory"], (res) => {
        resolve(res.scanHistory || []);
      });
    });

    if (history.length > 0 && getDomain(history[0].url) === domain) {
      if (isReload) injectPopup(tabId, url, history[0].isPhishing, false);
      tabStates.set(tabId, { domain, previousUrl: url });
      return history[0];
    }

    const trustedDomains = [
      'google.com', 'openai.com', 'chatgpt.com', 'microsoft.com',
      'github.com', 'facebook.com', 'linkedin.com', 'youtube.com'
      // añade más si deseas...
    ];

    const isTrusted = trustedDomains.some(t => domain.includes(t));
    if (isTrusted) {
      const result = { url, isPhishing: false, timestamp: new Date().toLocaleString() };
      storeScanHistory(result);
      injectPopup(tabId, url, false, false);
      return result;
    }

    // 🔥 Aquí está la URL actual de tu backend
    const response = await fetch("https://checapage2-0.onrender.com/predict_url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    const isPhishing = data.result === "Phishing";

    const result = {
      url,
      isPhishing,
      timestamp: new Date().toLocaleString()
    };

    tabStates.set(tabId, { domain, previousUrl: url });
    storeScanHistory(result);
    injectPopup(tabId, url, isPhishing, false);

    return result;
  } catch (error) {
    console.error("Scan error:", error);
    return { error: error.message };
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const debouncedCheck = debounce(checkForPhishing, 500);

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {
    const isReload = details.transitionType === 'reload';
    debouncedCheck(details.url, details.tabId, isReload);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) debouncedCheck(tab.url, activeInfo.tabId, false);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentStatus") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const url = tabs[0].url;
      const result = await checkForPhishing(url, tabs[0].id, false);
      sendResponse(result);
    });
    return true;
  } else if (request.action === "getHistory") {
    chrome.storage.local.get(["scanHistory"], (res) => {
      sendResponse(res.scanHistory || []);
    });
    return true;
  }
});

setInterval(() => {
  tabStates.clear();
}, 30 * 60 * 1000);

console.log("✔️ ChecaPage background script listo");
