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
    html, body { margin: 0; padding: 0; height: 100%; background: #0a0a0f; }
    iframe { display: block; width: 100%; height: 100%; min-height: 100vh; border: 0; }
  </style>
</head>
<body>
  <iframe src="${url}" title="${title}" loading="eager" allow="fullscreen"></iframe>
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
