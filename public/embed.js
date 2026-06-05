(function () {
  function getBaseUrl() {
    var host = window.location.hostname;

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0"
    ) {
      return window.location.origin;
    }

    return "https://app.web3mb.com";
  }

  function getAttr(el, name, fallback) {
    var value = el.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  function buildWidget(el) {
    var slug = el.getAttribute("data-web3mb");

    if (!slug) {
      return;
    }

    var theme = getAttr(el, "data-theme", "dark");
    var type = getAttr(el, "data-type", "widget");
    var width = getAttr(el, "data-width", "420");
    var height = getAttr(el, "data-height", type === "seal" ? "140" : "720");
    var baseUrl = getBaseUrl();

    el.innerHTML = "";

    if (type === "seal" || type === "image") {
      var link = document.createElement("a");
      link.href = baseUrl + "/token/" + encodeURIComponent(slug);
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      var img = document.createElement("img");
      img.src = baseUrl + "/api/trust-seal/" + encodeURIComponent(slug);
      img.alt = "WEB3MB Trust Seal";
      img.loading = "lazy";

      img.style.width = "100%";
      img.style.maxWidth = width + "px";
      img.style.height = "auto";
      img.style.border = "0";
      img.style.borderRadius = "24px";
      img.style.display = "block";

      link.appendChild(img);
      el.appendChild(link);
      return;
    }

    var iframe = document.createElement("iframe");

    iframe.src =
      baseUrl +
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

    el.appendChild(iframe);
  }

  function init() {
    var widgets = document.querySelectorAll("[data-web3mb]");

    for (var i = 0; i < widgets.length; i++) {
      buildWidget(widgets[i]);
    }
  }

  window.WEB3MB = {
    refresh: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
