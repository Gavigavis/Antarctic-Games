(function () {
  var LAUNCH_SCHEME = "antarctic://";
  var PRIMARY_CATALOG_GLOBAL = "ANTARCTIC_GAMES_CATALOG";
  var LEGACY_CATALOG_GLOBAL = "PALLADIUM_GAMES_CATALOG";
  var LOCAL_MANIFEST_PATH = "/data/games-catalog.js";
  var LOCAL_MANIFEST_ASSET_PARAM = "antarctic_asset";
  var LOCAL_MANIFEST_VERSION = "2026-03-22-asset-1";
  var PRIMARY_SCRIPT_SELECTOR = 'script[data-antarctic-games-catalog="true"]';
  var LEGACY_SCRIPT_SELECTOR = 'script[data-palladium-games-catalog="true"]';
  var catalogCache = null;
  var catalogLoadPromise = null;
  var localAppBaseUrlCache = "";

  function sanitizeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function resolveDocumentUrl(raw) {
    var text = sanitizeText(raw);
    if (!text) return "";

    var baseHref = "";
    try {
      baseHref = sanitizeText((document && document.baseURI) || "");
    } catch (error) {
      baseHref = "";
    }

    try {
      return baseHref ? new URL(text, baseHref).toString() : new URL(text).toString();
    } catch (error) {
      return "";
    }
  }

  function inferLocalAppBaseUrl() {
    if (document && typeof document.querySelectorAll === "function") {
      var scripts = document.querySelectorAll("script[src]");
      for (var index = 0; index < scripts.length; index += 1) {
        var src = sanitizeText(scripts[index].getAttribute("src"));
        if (!/(?:^|\/)(?:games-static|shell|site-settings|site-storage|social-client|backend)\.js(?:[?#].*)?$/i.test(src)) {
          continue;
        }

        var resolvedScriptUrl = resolveDocumentUrl(src);
        if (!resolvedScriptUrl) continue;

        try {
          var scriptUrl = new URL(resolvedScriptUrl);
          scriptUrl.search = "";
          scriptUrl.hash = "";
          scriptUrl.pathname = scriptUrl.pathname.replace(/[^/]*$/, "");
          return scriptUrl.toString();
        } catch (error) {
          // Keep trying other candidates.
        }
      }
    }

    var fallbackUrl = resolveDocumentUrl((window.location && window.location.href) || "");
    if (!fallbackUrl) {
      return "/";
    }

    try {
      var pageUrl = new URL(fallbackUrl);
      pageUrl.search = "";
      pageUrl.hash = "";
      pageUrl.pathname = pageUrl.pathname.replace(/[^/]*$/, "");
      return pageUrl.toString();
    } catch (error) {
      return "/";
    }
  }

  function getLocalAppBaseUrl() {
    if (!localAppBaseUrlCache) {
      localAppBaseUrlCache = inferLocalAppBaseUrl();
    }
    return localAppBaseUrlCache;
  }

  function isRemoteAsset(value) {
    return /^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value);
  }

  function normalizeAssetPath(value) {
    var text = sanitizeText(value);
    if (!text || isRemoteAsset(text)) return text;
    return text.replace(/^\/+/, "");
  }

  function normalizeGamePath(value) {
    return normalizeAssetPath(value).replace(/\\/g, "/");
  }

  function resolveCatalogScriptUrl() {
    var manifestPath = normalizeAssetPath(LOCAL_MANIFEST_PATH);
    if (!manifestPath) {
      return LOCAL_MANIFEST_PATH;
    }

    try {
      var manifestUrl = new URL(manifestPath, getLocalAppBaseUrl());
      manifestUrl.searchParams.set(LOCAL_MANIFEST_ASSET_PARAM, LOCAL_MANIFEST_VERSION);
      return manifestUrl.toString();
    } catch (error) {
      return LOCAL_MANIFEST_PATH;
    }
  }

  function buildLaunchUri(gamePath, title, author) {
    var normalizedPath = normalizeGamePath(gamePath);
    if (!normalizedPath) {
      return LAUNCH_SCHEME + "gamelauncher";
    }

    var parts = ["path=" + encodeURIComponent(normalizedPath)];
    var normalizedTitle = sanitizeText(title);
    var normalizedAuthor = sanitizeText(author);

    if (normalizedTitle) {
      parts.push("title=" + encodeURIComponent(normalizedTitle));
    }

    if (normalizedAuthor) {
      parts.push("author=" + encodeURIComponent(normalizedAuthor));
    }

    return LAUNCH_SCHEME + "gamelauncher?" + parts.join("&");
  }

  function isJunkCatalogGame(game) {
    var title = sanitizeText(game && game.title);
    if (!title) return false;
    if (/^Index of\b/i.test(title)) return true;
    if (/Directory listing for\b/i.test(title)) return true;
    return false;
  }

  function sanitizeCatalogGames(games) {
    if (!Array.isArray(games)) return [];
    return games.filter(function (game) {
      return !isJunkCatalogGame(game);
    });
  }

  function compareCatalogGames(left, right) {
    var leftTitle = sanitizeText(left && left.title).toLowerCase();
    var rightTitle = sanitizeText(right && right.title).toLowerCase();
    var titleOrder = leftTitle.localeCompare(rightTitle, undefined, { numeric: true });
    if (titleOrder !== 0) {
      return titleOrder;
    }

    var leftAuthor = sanitizeText(left && left.author).toLowerCase();
    var rightAuthor = sanitizeText(right && right.author).toLowerCase();
    var authorOrder = leftAuthor.localeCompare(rightAuthor, undefined, { numeric: true });
    if (authorOrder !== 0) {
      return authorOrder;
    }

    return normalizeGamePath(left && left.path).localeCompare(normalizeGamePath(right && right.path), undefined, {
      numeric: true
    });
  }

  function sortCatalogGames(games) {
    if (!Array.isArray(games)) return [];
    return games.slice().sort(compareCatalogGames);
  }

  function matchesCatalogQuery(game, rawQuery) {
    var query = sanitizeText(rawQuery).toLowerCase();
    if (!query) return true;

    var haystack = [
      sanitizeText(game && game.title),
      sanitizeText(game && game.author),
      sanitizeText(game && game.category),
      normalizeGamePath(game && game.path)
    ].join(" ").toLowerCase();

    return haystack.indexOf(query) !== -1;
  }

  function filterCatalog(games, rawQuery) {
    if (!Array.isArray(games)) return [];
    return games.filter(function (game) {
      return matchesCatalogQuery(game, rawQuery);
    });
  }

  function buildFeaturedGamePool(games) {
    if (!Array.isArray(games) || !games.length) {
      return [];
    }

    var withArtwork = games.filter(function (game) {
      return Boolean(sanitizeText(game && game.image));
    });

    return sortCatalogGames(withArtwork.length ? withArtwork : games);
  }

  function resolveFeaturedRotationIndex(size, rawDate) {
    if (!size) return 0;

    var today = rawDate instanceof Date ? new Date(rawDate.getTime()) : rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(today.getTime())) {
      today = new Date(0);
    }

    var dayNumber = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) / 86400000);
    return Math.abs(dayNumber) % size;
  }

  function pickFeaturedGame(games, rawDate) {
    var pool = buildFeaturedGamePool(games);
    if (!pool.length) {
      return null;
    }

    return pool[resolveFeaturedRotationIndex(pool.length, rawDate)];
  }

  function readEmbeddedCatalog() {
    var payload = window[PRIMARY_CATALOG_GLOBAL] || window[LEGACY_CATALOG_GLOBAL];
    return Array.isArray(payload && payload.games) ? payload.games : null;
  }

  function resolveCatalogFromWindow() {
    var games = readEmbeddedCatalog();
    if (!games) {
      throw new Error("Embedded games catalog is unavailable.");
    }
    catalogCache = sortCatalogGames(sanitizeCatalogGames(games));
    return catalogCache.slice();
  }

  function ensureCatalogScript() {
    if (readEmbeddedCatalog()) {
      return Promise.resolve(resolveCatalogFromWindow());
    }

    if (catalogLoadPromise) {
      return catalogLoadPromise;
    }

    catalogLoadPromise = new Promise(function (resolve, reject) {
      if (!document || typeof document.createElement !== "function") {
        reject(new Error("Embedded games catalog is unavailable."));
        return;
      }

      var script = document.querySelector(PRIMARY_SCRIPT_SELECTOR) || document.querySelector(LEGACY_SCRIPT_SELECTOR);
      var settled = false;

      function finishWithCatalog() {
        if (settled) return;
        settled = true;
        try {
          resolve(resolveCatalogFromWindow());
        } catch (error) {
          reject(error);
        }
      }

      function failLoad() {
        if (settled) return;
        settled = true;
        reject(new Error("Embedded games catalog script could not be loaded."));
      }

      if (!script) {
        script = document.createElement("script");
        script.src = resolveCatalogScriptUrl();
        script.async = true;
        script.setAttribute("data-antarctic-games-catalog", "true");
        script.setAttribute("data-palladium-games-catalog", "true");
        script.addEventListener("load", finishWithCatalog, { once: true });
        script.addEventListener("error", failLoad, { once: true });
        (document.head || document.body || document.documentElement).appendChild(script);
        return;
      }

      if (readEmbeddedCatalog()) {
        finishWithCatalog();
        return;
      }

      script.addEventListener("load", finishWithCatalog, { once: true });
      script.addEventListener("error", failLoad, { once: true });
    }).finally(function () {
      catalogLoadPromise = null;
    });

    return catalogLoadPromise;
  }

  async function loadLocalCatalog(forceRefresh) {
    if (!forceRefresh && catalogCache) {
      return catalogCache.slice();
    }

    if (forceRefresh) {
      catalogCache = null;
    }

    if (readEmbeddedCatalog()) {
      return resolveCatalogFromWindow();
    }

    return ensureCatalogScript();
  }

  async function loadCatalog(options) {
    var settings = options || {};
    return loadLocalCatalog(Boolean(settings.forceRefresh));
  }

  var api = {
    buildLaunchUri: buildLaunchUri,
    filterCatalog: filterCatalog,
    getCachedCatalog: function () {
      return catalogCache ? catalogCache.slice() : [];
    },
    loadCatalog: loadCatalog,
    manifestPath: LOCAL_MANIFEST_PATH,
    normalizeAssetPath: normalizeAssetPath,
    normalizeGamePath: normalizeGamePath,
    pickFeaturedGame: pickFeaturedGame
  };

  window.AntarcticGames = api;
  window.PalladiumGames = api;
})();
