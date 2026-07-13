function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escJs(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/** Obfuscate URL so casual View Source does not show a clear third-party domain. */
function packUrl(url: string): string {
  const bytes = new TextEncoder().encode(url);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(url, "utf8").toString("base64");
  return b64.split("").reverse().join("");
}

/** Browser SHA-256 hex — used when downloading the white-label HTML. */
export async function hashWhitelabelPasswordBrowser(password: string): Promise<string> {
  const data = new TextEncoder().encode(password.trim());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Single HTML file clients upload to their own domain.
 * - Password gate before the dashboard appears
 * - No third-party brand text / no "open on another site" link
 * - Soft loading (never times out into an external redirect)
 */
export function buildWhitelabelDashboardHtml(opts: {
  embedUrl: string;
  pageTitle: string;
  /** SHA-256 hex of the access password */
  passwordHash: string;
  companyName?: string;
}) {
  const title = esc(opts.pageTitle);
  const brand = esc((opts.companyName || opts.pageTitle).trim() || "Dashboard");
  const packed = escJs(packUrl(opts.embedUrl));
  const passwordHash = escJs(opts.passwordHash);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; background: #07070b; color: #e4e4e7; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #gate {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      padding: 24px; background: #07070b; z-index: 40;
    }
    #gate.hidden { display: none; }
    .gate-card {
      width: 100%; max-width: 400px; padding: 36px 32px; border-radius: 16px;
      background: #12121a; border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 24px 80px rgba(0,0,0,0.55); text-align: center;
    }
    .gate-icon {
      width: 48px; height: 48px; margin: 0 auto 18px; border-radius: 12px;
      background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.35);
      display: flex; align-items: center; justify-content: center; color: #22d3ee; font-size: 20px;
    }
    .gate-card h1 { margin: 0 0 8px; font-size: 1.35rem; font-weight: 800; color: #fafafa; letter-spacing: -0.02em; }
    .gate-card .sub { margin: 0 0 22px; font-size: 0.9rem; color: #a1a1aa; }
    .field-wrap { position: relative; margin-bottom: 14px; }
    .field-wrap input {
      width: 100%; padding: 13px 44px 13px 14px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12); background: #0a0a0f; color: #fafafa;
      font-size: 15px; outline: none;
    }
    .field-wrap input:focus { border-color: rgba(34,211,238,0.5); }
    .field-wrap button.toggle {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: 0; color: #71717a; cursor: pointer; font-size: 14px; padding: 4px;
    }
    #unlock-btn {
      width: 100%; padding: 13px 16px; border: 0; border-radius: 10px; cursor: pointer;
      background: #22d3ee; color: #07070b; font-weight: 800; font-size: 15px;
    }
    #unlock-btn:hover { opacity: 0.92; }
    #unlock-btn:disabled { opacity: 0.5; cursor: wait; }
    #gate-error { display: none; margin-top: 12px; color: #f87171; font-size: 13px; font-weight: 600; }
    #gate-error.show { display: block; }
    .gate-foot { margin-top: 18px; font-size: 11px; color: #52525b; }
    #shell { display: none; height: 100%; }
    #shell.ready { display: block; }
    #loader {
      position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; background: #07070b; z-index: 20; transition: opacity 0.35s;
    }
    #loader.hidden { opacity: 0; pointer-events: none; }
    #loader p { margin: 0; font-size: 14px; color: #a1a1aa; }
    #loader strong { color: #22d3ee; font-weight: 600; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid rgba(34,211,238,0.2);
      border-top-color: #22d3ee; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #retry {
      display: none; position: fixed; inset: 0; padding: 24px; text-align: center;
      flex-direction: column; align-items: center; justify-content: center; background: #07070b; z-index: 25;
    }
    #retry.show { display: flex; }
    #retry h2 { color: #fafafa; font-size: 18px; margin: 0 0 8px; }
    #retry p { color: #a1a1aa; font-size: 14px; max-width: 420px; line-height: 1.6; margin: 0 0 18px; }
    #retry button {
      padding: 12px 22px; border: 0; border-radius: 10px; cursor: pointer;
      background: #22d3ee; color: #07070b; font-weight: 800; font-size: 14px;
    }
    iframe { display: block; width: 100%; height: 100%; min-height: 100vh; border: 0; background: #07070b; }
  </style>
</head>
<body>
  <div id="gate">
    <div class="gate-card">
      <div class="gate-icon" aria-hidden="true">🔒</div>
      <h1>${brand}</h1>
      <p class="sub">Enter your access password to continue</p>
      <form id="gate-form" autocomplete="off">
        <div class="field-wrap">
          <input id="pwd" type="password" placeholder="Password" required autocomplete="current-password" />
          <button type="button" class="toggle" id="toggle-pwd" aria-label="Show password">👁</button>
        </div>
        <button type="submit" id="unlock-btn">Unlock Dashboard</button>
        <p id="gate-error">Incorrect password. Try again.</p>
      </form>
      <p class="gate-foot">${brand}</p>
    </div>
  </div>

  <div id="shell">
    <div id="loader">
      <div class="spinner" aria-hidden="true"></div>
      <p>Opening <strong>${title}</strong>…</p>
    </div>
    <div id="retry">
      <h2>Couldn’t open the dashboard</h2>
      <p>Please check your connection and try again. If this keeps happening, contact your campaign manager for a fresh dashboard file.</p>
      <button type="button" id="retry-btn">Try again</button>
    </div>
    <iframe id="dash" title="${title}" loading="eager" allow="fullscreen" referrerpolicy="no-referrer"></iframe>
  </div>

  <script>
    (function () {
      var PACKED = "${packed}";
      var HASH = "${passwordHash}";
      var SESSION_KEY = "wl_unlocked_" + HASH.slice(0, 16);

      function unpack(s) {
        try {
          var rev = s.split("").reverse().join("");
          return decodeURIComponent(escape(atob(rev)));
        } catch (e) {
          return "";
        }
      }

      function sha256Hex(text) {
        var data = new TextEncoder().encode(text);
        return crypto.subtle.digest("SHA-256", data).then(function (buf) {
          return Array.from(new Uint8Array(buf))
            .map(function (b) { return b.toString(16).padStart(2, "0"); })
            .join("");
        });
      }

      var gate = document.getElementById("gate");
      var shell = document.getElementById("shell");
      var loader = document.getElementById("loader");
      var retry = document.getElementById("retry");
      var frame = document.getElementById("dash");
      var form = document.getElementById("gate-form");
      var pwdInput = document.getElementById("pwd");
      var gateError = document.getElementById("gate-error");
      var unlockBtn = document.getElementById("unlock-btn");
      var loaded = false;
      var softTimer = null;

      document.getElementById("toggle-pwd").addEventListener("click", function () {
        var show = pwdInput.type === "password";
        pwdInput.type = show ? "text" : "password";
      });

      function hideLoader() {
        loader.classList.add("hidden");
      }

      function showRetry() {
        hideLoader();
        retry.classList.add("show");
      }

      function mountDashboard() {
        gate.classList.add("hidden");
        shell.classList.add("ready");
        loaded = false;
        retry.classList.remove("show");
        loader.classList.remove("hidden");
        var src = unpack(PACKED);
        if (!src) {
          showRetry();
          return;
        }
        frame.removeAttribute("src");
        frame.src = src;
        if (softTimer) clearTimeout(softTimer);
        softTimer = setTimeout(function () {
          if (!loaded) {
            var p = loader.querySelector("p");
            if (p) p.textContent = "Still opening… one moment";
          }
        }, 15000);
      }

      frame.addEventListener("load", function () {
        loaded = true;
        if (softTimer) clearTimeout(softTimer);
        setTimeout(hideLoader, 350);
      });

      document.getElementById("retry-btn").addEventListener("click", function () {
        mountDashboard();
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        gateError.classList.remove("show");
        unlockBtn.disabled = true;
        var entered = (pwdInput.value || "").trim();
        sha256Hex(entered).then(function (hex) {
          unlockBtn.disabled = false;
          if (hex !== HASH) {
            gateError.classList.add("show");
            pwdInput.focus();
            return;
          }
          try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (err) {}
          mountDashboard();
        }).catch(function () {
          unlockBtn.disabled = false;
          gateError.classList.add("show");
        });
      });

      try {
        if (sessionStorage.getItem(SESSION_KEY) === "1") {
          mountDashboard();
        }
      } catch (err) {}
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
