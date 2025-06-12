chrome.storage.local.get(['pluginEnabled'], function (result) {
    if (result.pluginEnabled === false) return;
  
    // Evitar múltiples inyecciones
    if (document.getElementById("phishing-warning-overlay")) return;
  
    const overlay = document.createElement("div");
    overlay.id = "phishing-warning-overlay";
    overlay.style = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, 0.92);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      flex-direction: column;
      color: white;
      padding: 20px;
      text-align: center;
    `;
  
    overlay.innerHTML = `
      <div style="max-width: 480px;">
        <img src="https://cdn-icons-png.flaticon.com/512/463/463612.png" style="width: 100px; margin-bottom: 20px;">
        <h2 style="color: #ff4d4d;">⚠️ ¡Advertencia de Seguridad!</h2>
        <p style="font-size: 16px; margin: 20px 0;">
          Este sitio ha sido detectado como <strong>malicioso</strong>.<br>
          Tu información personal podría estar en riesgo.
        </p>
        <div style="margin-top: 25px;">
          <button id="phish-btn-exit" style="
            background-color: #ffffff;
            color: #d32f2f;
            font-weight: bold;
            border: none;
            padding: 10px 20px;
            font-size: 15px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
          ">Salir y volver a Google</button>
          <button id="phish-btn-continue" style="
            background-color: transparent;
            border: 2px solid #ffffff;
            color: #ffffff;
            font-weight: bold;
            padding: 10px 20px;
            font-size: 15px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
          ">Ignorar y continuar</button>
        </div>
      </div>
    `;
  
    document.body.appendChild(overlay);
  
    // Botón salir: redirige a Google
    document.getElementById("phish-btn-exit").addEventListener("click", () => {
      window.location.href = "https://www.google.com/";
    });
  
    // Botón continuar: remueve la advertencia
    document.getElementById("phish-btn-continue").addEventListener("click", () => {
      overlay.remove();
    });
  });
  