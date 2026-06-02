(function () {
  function getBaseUrl() {
    var host = window.location.hostname;

    // Local development
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0"
    ) {
      return window.location.origin;
    }

    // Production
    return "https://app.web3mb.com";
  }

  function buildWidget(el) {
    var slug = el.getAttribute("data-web3mb");

    if (!slug) {
      return;
    }

    var theme = el.getAttribute("data-theme") || "dark";
    var width = el.getAttribute("data-width") || "420";
    var height = el.getAttribute("data-height") || "280";

    var iframe = document.createElement("iframe");

    iframe.src =
      getBaseUrl() +
      "/embed/" +
      encodeURIComponent(slug) +
      "?theme=" +
      encodeURIComponent(theme);

    iframe.width = width;
    iframe.height = height;

    iframe.loading = "lazy";
    iframe.title = "WEB3MB Trust Seal";
    iframe.referrerPolicy = "no-referrer-when-downgrade";

    iframe.style.border = "0";
    iframe.style.width = "100%";
    iframe.style.maxWidth = width + "px";
    iframe.style.height = height + "px";
    iframe.style.overflow = "hidden";
    iframe.style.borderRadius = "24px";
    iframe.style.background = "transparent";
    iframe.style.display = "block";

    el.innerHTML = "";
    el.appendChild(iframe);
  }

  function init() {
    var widgets = document.querySelectorAll("[data-web3mb]");

    for (var i = 0; i < widgets.length; i++) {
      buildWidget(widgets[i]);
    }
  }

  // Public API
  window.WEB3MB = {
    refresh: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
