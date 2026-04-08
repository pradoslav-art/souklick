export function buildWidgetScript(apiBase: string): string {
  return `
(function () {
  var API = "${apiBase}";

  function stars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function timeAgo(dateStr) {
    var d = new Date(dateStr);
    var diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 30) return diff + " days ago";
    if (diff < 365) return Math.floor(diff / 30) + " months ago";
    return Math.floor(diff / 365) + " years ago";
  }

  function render(el, data) {
    var styles = [
      ".sk-widget{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:100%;overflow:hidden;}",
      ".sk-widget-title{font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;}",
      ".sk-widget-cards{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}",
      ".sk-widget-cards::-webkit-scrollbar{display:none;}",
      ".sk-widget-card{flex:0 0 260px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}",
      ".sk-widget-stars{color:#f59e0b;font-size:15px;margin-bottom:8px;}",
      ".sk-widget-text{font-size:14px;color:#374151;line-height:1.5;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
      ".sk-widget-meta{font-size:12px;color:#9ca3af;}",
      ".sk-widget-meta strong{color:#6b7280;font-weight:600;}",
      ".sk-widget-footer{margin-top:12px;text-align:right;}",
      ".sk-widget-footer a{font-size:11px;color:#d1d5db;text-decoration:none;}",
    ].join("");

    var styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    var cards = data.reviews.map(function (r) {
      var text = r.reviewText ? r.reviewText.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
      return '<div class="sk-widget-card">'
        + '<div class="sk-widget-stars">' + stars(r.rating) + "</div>"
        + (text ? '<p class="sk-widget-text">' + text + "</p>" : "")
        + '<div class="sk-widget-meta"><strong>' + r.reviewerName + "</strong> &middot; " + timeAgo(r.reviewDate) + "</div>"
        + "</div>";
    }).join("");

    el.innerHTML = '<div class="sk-widget">'
      + '<p class="sk-widget-title">What our customers say</p>'
      + '<div class="sk-widget-cards">' + cards + "</div>"
      + '<div class="sk-widget-footer"><a href="https://souklick.com" target="_blank" rel="noopener">Powered by Souklick</a></div>'
      + "</div>";
  }

  function init() {
    var els = document.querySelectorAll("[data-souklick-widget]");
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var token = el.getAttribute("data-souklick-widget");
        fetch(API + "/api/widget/" + token)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.reviews && data.reviews.length > 0) render(el, data);
          })
          .catch(function () {});
      })(els[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`.trim();
}
