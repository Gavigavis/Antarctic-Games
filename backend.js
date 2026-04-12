(function () {
  var STORAGE_KEY = "antarctic-backend-base";
  var LEGACY_STORAGE_KEY = "palladium-backend-base";
  var CONFIG_CACHE = null;
  var storage = window.AntarcticGamesStorage || window.PalladiumSiteStorage || null;
  var DEFAULT_BACKEND_BASE = "https://api.antarctic.games";
  var NETLIFY_BACKEND_BRIDGE = "https://antarctic-games.netlify.app";

  function currentHost() {
    return String(window.location.hostname || "").toLowerCase();
  }

  function shouldUseHostedOrigin() {
    var host = currentHost();
    return (
      host === "antarctic.games" ||
      host === "www.antarctic.games" ||
      host === "api.antarctic.games" ||
      host === "www.api.antarctic.games"
    );
  }

  function normalizeBase(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    if (!/^https?:\/\//i.test(raw)) {
      raw = "http://" + raw;
    }

    try {
      var parsed = new URL(raw);
      parsed.pathname = "";
      parsed.search = "";
      parsed.hash = "";
      return parsed.origin;
    } catch (e) {
      return "";
    }
  }

  function normalizeConfiguredBase(value) {
    var normalized = normalizeBase(value);
    if (!normalized) return "";
    if (/^https?:\/\/(?:www\.)?sethpang\.com$/i.test(normalized)) {
      return DEFAULT_BACKEND_BASE;
    }
    if (/^https?:\/\/(?:www\.)?api\.sethpang\.com$/i.test(normalized)) {
      return DEFAULT_BACKEND_BASE;
    }
    if (shouldUseHostedOrigin()) {
      if (
        /^https?:\/\/(?:www\.)?api\.antarctic\.games$/i.test(normalized) ||
        /^https?:\/\/(?:www\.)?antarctic\.games$/i.test(normalized) ||
        /^https?:\/\/antarctic-games\.netlify\.app$/i.test(normalized)
      ) {
        return window.location.origin;
      }
    }
    return normalized;
  }

  function fromQuery() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get("backend") || params.get("api") || "";
    } catch (e) {
      return "";
    }
  }

  function fromMeta() {
    var meta =
      document.querySelector('meta[name="antarctic-backend"]') ||
      document.querySelector('meta[name="palladium-backend"]');
    return meta && meta.content ? meta.content : "";
  }

  function readStoredBase() {
    if (storage && typeof storage.getItem === "function") {
      return storage.getItem(STORAGE_KEY, { legacyKeys: [LEGACY_STORAGE_KEY] }) || "";
    }
    try {
      return window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function writeStoredBase(base) {
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(STORAGE_KEY, base || "", { legacyKeys: [LEGACY_STORAGE_KEY] });
      return;
    }
    try {
      if (!base) {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, base);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (e) {
      // Ignore storage errors.
    }
  }

  function inferDefaultBase() {
    var host = currentHost();
    if (!host) return "";
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || window.location.port === "3000") {
      return window.location.origin;
    }
    if (/\.netlify\.app$/i.test(host)) {
      return window.location.origin;
    }
    if (shouldUseHostedOrigin()) {
      return window.location.origin;
    }
    if (host === "api.antarctic.games" || host === "www.api.antarctic.games") {
      return window.location.origin;
    }
    return DEFAULT_BACKEND_BASE;
  }

  function assetUrl(pathValue) {
    var base = resolveBase();
    var value = String(pathValue || "").trim();
    if (!value) return base;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.charAt(0) !== "/") value = "/" + value;
    return (base || "") + value;
  }

  function resolveBase() {
    var query = normalizeConfiguredBase(fromQuery());
    if (query) {
      writeStoredBase(query);
      return query;
    }

    var globalBase = normalizeConfiguredBase(window.ANTARCTIC_GAMES_BACKEND_BASE || window.PALLADIUM_BACKEND_BASE || "");
    if (globalBase) return globalBase;

    var metaBase = normalizeConfiguredBase(fromMeta());
    if (metaBase) return metaBase;

    var storedRaw = readStoredBase();
    var stored = normalizeConfiguredBase(storedRaw);
    if (stored) {
      if (stored !== normalizeBase(storedRaw)) {
        writeStoredBase(stored);
      }
      return stored;
    }

    return normalizeConfiguredBase(inferDefaultBase());
  }

  function apiUrl(pathValue) {
    var base = resolveBase();
    var path = String(pathValue || "").trim();
    if (!path) return base;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) !== "/") path = "/" + path;
    return (base || "") + path;
  }

  async function fetchJson(pathValue, init) {
    var response = await fetch(apiUrl(pathValue), init || {});
    if (!response.ok) {
      var errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "";
      }
      throw new Error(errorText || "Request failed with status " + response.status);
    }
    return response.json();
  }

  async function getPublicConfig(forceRefresh) {
    if (!forceRefresh && CONFIG_CACHE) return CONFIG_CACHE;
    CONFIG_CACHE = await fetchJson("/api/config/public");
    return CONFIG_CACHE;
  }

  function withPort(originValue, portValue) {
    try {
      var parsed = new URL(originValue);
      parsed.port = String(portValue);
      return parsed.origin;
    } catch (e) {
      return originValue;
    }
  }

  var api = {
    getBaseUrl: resolveBase,
    setBaseUrl: function (value) {
      var normalized = normalizeConfiguredBase(value);
      writeStoredBase(normalized);
      return normalized;
    },
    clearBaseUrl: function () {
      writeStoredBase("");
      CONFIG_CACHE = null;
    },
    apiUrl: apiUrl,
    assetUrl: assetUrl,
    fetchJson: fetchJson,
    getPublicConfig: getPublicConfig,
    withPort: withPort
  };

  window.AntarcticGamesBackend = api;
  window.PalladiumBackend = api;
})();
