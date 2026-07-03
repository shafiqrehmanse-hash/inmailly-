function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Single file clients upload to their web host — no index.html edits required. */
export function buildWhitelabelDashboardHtml(opts: {
  embedUrl: string;
  pageTitle: string;
}) {
  const title = esc(opts.pageTitle);
  const url = esc(opts.embedUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title}</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #0a0a0f; color: #e4e4e7; font-family: system-ui, sans-serif; }
    #loader {
      position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; background: #0a0a0f; z-index: 10; transition: opacity 0.3s;
    }
    #loader.hidden { opacity: 0; pointer-events: none; }
    #loader p { margin: 0; font-size: 14px; color: #a1a1aa; }
    #loader strong { color: #22d3ee; font-weight: 600; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid rgba(34,211,238,0.2);
      border-top-color: #22d3ee; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #error {
      display: none; position: fixed; inset: 0; padding: 24px; text-align: center;
      flex-direction: column; align-items: center; justify-content: center; background: #0a0a0f;
    }
    #error.show { display: flex; }
    #error h2 { color: #f87171; font-size: 18px; margin: 0 0 8px; }
    #error p { color: #a1a1aa; font-size: 14px; max-width: 420px; line-height: 1.6; margin: 0; }
    #error a { color: #22d3ee; margin-top: 16px; font-size: 14px; }
    iframe { display: block; width: 100%; height: 100%; min-height: 100vh; border: 0; }
  </style>
</head>
<body>
  <div id="loader">
    <div class="spinner" aria-hidden="true"></div>
    <p>Loading <strong>${title}</strong>…</p>
  </div>
  <div id="error">
    <h2>Dashboard could not load</h2>
    <p id="error-msg">The embed link may be outdated. Download a fresh copy from your InMailly client dashboard.</p>
    <a href="${url}" target="_blank" rel="noopener">Open dashboard directly →</a>
  </div>
  <iframe id="dash" src="${url}" title="${title}" loading="eager" allow="fullscreen"></iframe>
  <script>
    (function () {
      var loader = document.getElementById("loader");
      var errBox = document.getElementById("error");
      var frame = document.getElementById("dash");
      var loaded = false;
      function showError(msg) {
        loader.classList.add("hidden");
        if (msg) document.getElementById("error-msg").textContent = msg;
        errBox.classList.add("show");
        frame.style.display = "none";
      }
      frame.addEventListener("load", function () {
        loaded = true;
        setTimeout(function () { loader.classList.add("hidden"); }, 400);
      });
      frame.addEventListener("error", function () {
        showError("Could not load the embedded dashboard. Try opening the direct link below.");
      });
      setTimeout(function () {
        if (!loaded) showError("Loading is taking too long. Check your connection or use the direct link below.");
      }, 20000);
    })();
  </script>
</body>
</html>
`;
}

export function whitelabelDownloadFilename(companyName: string) {
  const slug = (companyName || "campaign")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32)
    .toLowerCase();
  return `${slug || "campaign"}-dashboard.html`;
}
