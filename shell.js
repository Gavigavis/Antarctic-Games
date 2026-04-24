(function () {
  var core = window.AntarcticGamesShellCore || window.PalladiumShellCore;
  if (!core) return;

  var STORAGE_KEY = "antarctic.shell.state.v1";
  var LEGACY_STORAGE_KEY = "palladium.shell.state.v1";
  var PROXY_STORAGE_VERSION_KEY = "antarctic.proxy.storage.version.v1";
  var PROXY_STORAGE_VERSION = "scramjet-storage-2026-03-23-proxy-5";
  var PROXY_REPAIR_RELOAD_KEY = "antarctic.proxy.repair.reload.v1";
  var PROXY_CONTROLLER_RELOAD_KEY = "antarctic.proxy.controller.reload.v1";
  var PROXY_CONTROLLER_RELOAD_MAX_ATTEMPTS = 3;
  var PROXY_REQUEST_HEADER_METHOD = "x-antarctic-proxy-method";
  var PROXY_REQUEST_HEADER_HEADERS = "x-antarctic-proxy-headers";
  var LOCAL_APP_ASSET_PARAM = "antarctic_asset";
  var LOCAL_APP_ASSET_VERSION = "2026-03-22-asset-1";
  var PROXY_RUNTIME_ASSET_VERSION = "2026-03-23-proxy-5";
  var PROXY_DISABLED_MESSAGE = "Web browsing could not start right now.";
  var PROXY_IDLE_MESSAGE = "Antarctic will connect the ready fallback proxy when you open a page.";
  var PROXY_BOOT_MESSAGE = "Connecting the ready fallback proxy...";
  var PROXY_WISP_PROBE_TIMEOUT_MS = 900;
  var SHELL_SCALE_MIN = 0.78;
  var PRIVATE_SEARCH_AUTOFILL_RETRY_MS = 180;
  var PRIVATE_SEARCH_AUTOFILL_MAX_ATTEMPTS = 12;
  var SCRAMJET_PREFIX = "/service/scramjet/";
  var SCRAMJET_SW_PATH = "/sw.js";
  var BAREMUX_WORKER_PATH = "/baremux/worker.js";
  var LIBCURL_TRANSPORT_PATH = "/libcurl/index.mjs";
  var SCRAMJET_FILES = {
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
    wasm: "/scram/scramjet.wasm.wasm"
  };
  /* Same artwork as sidebar Games link; viewBox crops top to hide cord */
  var GAMES_CONTROLLER_PATH_MAIN =
    "M373.1,256.2H267.4v-21.4c0-17,13.9-30.9,30.9-30.9h102.3c30.6,0,55.4-24.9,55.4-55.4s-24.9-55.4-55.4-55.4H111.4c-17,0-30.9-13.9-30.9-30.9V23.8c0-6.8-5.5-12.3-12.3-12.3S56,17.1,56,23.8v38.3c0,30.6,24.9,55.4,55.4,55.4h289.2c17,0,30.9,13.9,30.9,30.9s-13.9,30.9-30.9,30.9H298.3c-30.6,0-55.4,24.9-55.4,55.4v21.4h-104c-67.3,0-122.1,54.8-122.1,122.1c0,67.3,54.8,122.1,122.1,122.1c36.4,0,66.3-16.3,86.8-47.1h60.7c20.6,30.9,50.4,47.1,86.8,47.1c67.3,0,122.1-54.8,122.1-122.1C495.3,311,440.5,256.2,373.1,256.2z M373.1,475.9c-30.4,0-53.1-13.5-69.5-41.1c-2.2-3.7-6.2-6-10.5-6h-74.2c-4.3,0-8.3,2.3-10.5,6c-16.4,27.7-39.1,41.1-69.5,41.1c-53.8,0-97.6-43.8-97.6-97.6c0-53.8,43.8-97.6,97.6-97.6h234.3c53.8,0,97.6,43.8,97.6,97.6C470.8,432.1,427,475.9,373.1,475.9z";
  var GAMES_CONTROLLER_PATH_DPAD =
    "M171.7,361.6h-25v-25c0-6.8-5.5-12.3-12.3-12.3c-6.8,0-12.3,5.5-12.3,12.3v25h-25c-6.8,0-12.3,5.5-12.3,12.3c0,6.8,5.5,12.3,12.3,12.3h25v25c0,6.8,5.5,12.3,12.3,12.3c6.8,0,12.3-5.5,12.3-12.3v-25h25c6.8,0,12.3-5.5,12.3-12.3C184,367,178.5,361.6,171.7,361.6z";
  /* Same artwork as sidebar Settings link; 15×15 gear (filled) */
  var SETTINGS_GEAR_PATH =
    "M7.07.65a.85.85 0 0 0-.828.662l-.238 1.05c-.38.11-.74.262-1.08.448l-.91-.574a.85.85 0 0 0-1.055.118l-.606.606a.85.85 0 0 0-.118 1.054l.574.912c-.186.338-.337.7-.447 1.079l-1.05.238a.85.85 0 0 0-.662.829v.857a.85.85 0 0 0 .662.829l1.05.238c.11.379.261.74.448 1.08l-.575.91a.85.85 0 0 0 .118 1.055l.607.606a.85.85 0 0 0 1.054.118l.911-.574c.339.186.7.337 1.079.447l.238 1.05a.85.85 0 0 0 .829.662h.857a.85.85 0 0 0 .829-.662l.238-1.05c.38-.11.74-.26 1.08-.447l.911.574a.85.85 0 0 0 1.054-.118l.606-.606a.85.85 0 0 0 .118-1.054l-.574-.911c.187-.34.338-.7.448-1.08l1.05-.238a.85.85 0 0 0 .662-.829v-.857a.85.85 0 0 0-.662-.83l-1.05-.237c-.11-.38-.26-.74-.447-1.08l.574-.91a.85.85 0 0 0-.118-1.055l-.606-.606a.85.85 0 0 0-1.055-.118l-.91.574a5.323 5.323 0 0 0-1.08-.448l-.239-1.05A.85.85 0 0 0 7.928.65zM4.92 3.813a4.476 4.476 0 0 1 1.795-.745L7.071 1.5h.857l.356 1.568a4.48 4.48 0 0 1 1.795.744l1.36-.857l.607.606l-.858 1.36c.37.527.628 1.136.744 1.795l1.568.356v.857l-1.568.355a4.475 4.475 0 0 1-.744 1.796l.857 1.36l-.606.606l-1.36-.857a4.476 4.476 0 0 1-1.795.743L7.928 13.5h-.857l-.356-1.568a4.475 4.475 0 0 1-1.794-.744l-1.36.858l-.607-.606l.858-1.36a4.476 4.476 0 0 1-.744-1.796L1.5 7.93v-.857l1.568-.356a4.476 4.476 0 0 1 .744-1.794L2.954 3.56l.606-.606zM9.026 7.5a1.525 1.525 0 1 1-3.05 0a1.525 1.525 0 0 1 3.05 0m.9 0a2.425 2.425 0 1 1-4.85 0a2.425 2.425 0 0 1 4.85 0";
  /* Same artwork as sidebar AI link; Bootstrap Icons robot (16×16) */
  var AI_ROBOT_PATH_FACE =
    "M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135";
  var AI_ROBOT_PATH_BODY =
    "M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5";
  /* Match index.html + styles.css (--sans / --mono); each iframe document needs its own copy. */
  var ANTARCTIC_GFONTS_URL =
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@400;500;600;700&display=swap";
  var ANTARCTIC_IN_FRAME_FONT_CSS =
    'html,body{font-family:"Sora","Avenir Next","Segoe UI",sans-serif} ' +
    'code,kbd,pre,samp{font-family:"JetBrains Mono","JetBrains Mono NL",ui-monospace,monospace}';
  var SETTINGS_THEME_ORDER = [
    "default",
    "color-wash",
    "miami",
    "rainbow",
    "aurora",
    "sunset",
    "forest",
    "oceanic",
    "graphite",
    "arctic",
    "ember",
    "neon"
  ];
  var AI_COUNT_WORDS = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12
  };
  var CHAT_MESSAGE_MAX_LENGTH = 2000;
  var AI_CATALOG_STOPWORDS = {
    a: true,
    all: true,
    an: true,
    and: true,
    any: true,
    best: true,
    do: true,
    five: true,
    for: true,
    four: true,
    from: true,
    game: true,
    games: true,
    give: true,
    have: true,
    i: true,
    in: true,
    list: true,
    me: true,
    of: true,
    recommendations: true,
    recommend: true,
    show: true,
    six: true,
    some: true,
    suggest: true,
    ten: true,
    the: true,
    three: true,
    two: true,
    what: true,
    which: true,
    with: true,
    you: true
  };
  var THEME_DETAILS = {
    "default": {
      label: "Default",
      description: "Polar glass with crisp Antarctic blues.",
      preview: "linear-gradient(135deg, #031120 0%, #0b2f52 55%, #6bb6ff 100%)",
      swatches: ["#3b8cff", "#6bb6ff", "#a8d4ff"]
    },
    "color-wash": {
      label: "Color Wash",
      description: "Lavender dusk with soft cyan highlights.",
      preview: "linear-gradient(135deg, #201438 0%, #5b49c7 48%, #d7f4ff 100%)",
      swatches: ["#7c6cff", "#a898ff", "#d0c8ff"]
    },
    "miami": {
      label: "Miami",
      description: "Hot pink, sunset orange, and poolside aqua.",
      preview: "linear-gradient(135deg, #200822 0%, #ff5c9d 42%, #ffaa3d 72%, #5cfffb 100%)",
      swatches: ["#ff5c9d", "#ffaa3d", "#5cfffb"]
    },
    "rainbow": {
      label: "Rainbow",
      description: "Festival neon with full-spectrum contrast.",
      preview: "linear-gradient(135deg, #23120b 0%, #ff5340 24%, #ffe14a 49%, #3dffc8 75%, #4f8dff 100%)",
      swatches: ["#ff5340", "#ffe14a", "#3dffc8"]
    },
    "aurora": {
      label: "Aurora",
      description: "Northern-light greens over a cold dark sky.",
      preview: "linear-gradient(135deg, #041912 0%, #0d4b38 52%, #2ef5a8 82%, #cafff4 100%)",
      swatches: ["#2ef5a8", "#9dffe8", "#b8fff0"]
    },
    "sunset": {
      label: "Sunset",
      description: "Burnt orange sky fading into warm gold.",
      preview: "linear-gradient(135deg, #2a0907 0%, #7d1e18 44%, #ff6a38 72%, #ffc24a 100%)",
      swatches: ["#ff6a38", "#ffc24a", "#ffe0b8"]
    },
    "forest": {
      label: "Forest",
      description: "Deep spruce panels with bright moss energy.",
      preview: "linear-gradient(135deg, #071108 0%, #163922 55%, #3dff7a 82%, #d4ffe0 100%)",
      swatches: ["#3dff7a", "#9affb0", "#c8ffd8"]
    },
    "oceanic": {
      label: "Oceanic",
      description: "Abyss blues with electric surf accents.",
      preview: "linear-gradient(135deg, #03111e 0%, #0a3150 55%, #2eb0ff 82%, #d2f8ff 100%)",
      swatches: ["#2eb0ff", "#7ad8ff", "#b8f0ff"]
    },
    "graphite": {
      label: "Graphite",
      description: "Minimal monochrome steel and white glow.",
      preview: "linear-gradient(135deg, #090a0c 0%, #20242d 58%, #d4dcf0 100%)",
      swatches: ["#7f8898", "#d4dcf0", "#ffffff"]
    },
    "arctic": {
      label: "Arctic",
      description: "Glacial blues with a bright frozen edge.",
      preview: "linear-gradient(135deg, #071521 0%, #123f62 55%, #5ab8ff 80%, #e8fcff 100%)",
      swatches: ["#5ab8ff", "#c4f2ff", "#e8fcff"]
    },
    "ember": {
      label: "Ember",
      description: "Coal-black reds with furnace-orange heat.",
      preview: "linear-gradient(135deg, #220806 0%, #5e180f 50%, #ff5724 76%, #ffb04a 100%)",
      swatches: ["#ff5724", "#ffb04a", "#ffe0b0"]
    },
    "neon": {
      label: "Neon",
      description: "Cyber violet with bright mint circuitry.",
      preview: "linear-gradient(135deg, #10081d 0%, #341464 52%, #9b6cff 70%, #48fff8 100%)",
      swatches: ["#9b6cff", "#48fff8", "#b8fffc"]
    }
  };
  var CLOAK_PRESETS = [
    {
      id: "classroom",
      title: "Classes",
      favicon: "https://ssl.gstatic.com/classroom/favicon.png",
      description: "Google Classroom"
    },
    {
      id: "docs",
      title: "Quarterly Notes - Google Docs",
      favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
      description: "Google Docs"
    },
    {
      id: "drive",
      title: "My Drive - Google Drive",
      favicon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
      description: "Google Drive"
    },
    {
      id: "calendar",
      title: "Calendar",
      favicon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png",
      description: "Google Calendar"
    },
    {
      id: "Schoology",
      title: "Home | Schoology",
      favicon: "https://powerschool.com/favicon.ico",
      description: "Schoology"
    },
    {
      id: "khan-academy",
      title: "Khan Academy | Free Online Courses, Lessons & Practice",
      favicon: "https://www.khanacademy.org/favicon.ico",
      description: "Khan Academy"
    },
    {
      id: "google",
      title: "Google",
      favicon: "https://www.google.com/favicon.ico",
      description: "Google Search"
    }
  ];

  var elements = {
    addressForm: document.getElementById("address-form"),
    addressInput: document.getElementById("address-input"),
    aiStatusChip: document.getElementById("ai-status-chip"),
    homeButton: document.getElementById("toolbar-home"),
    newTabButton: document.getElementById("shell-new-tab"),
    paneStack: document.getElementById("pane-stack"),
    proxyStatusChip: document.getElementById("proxy-status-chip"),
    refreshButton: document.getElementById("toolbar-refresh"),
    routeList: document.querySelector(".route-list"),
    shellRoot: document.getElementById("shell-root"),
    stage: document.getElementById("shell-stage"),
    stageOverlay: document.getElementById("stage-overlay"),
    stageOverlayText: document.getElementById("stage-overlay-text"),
    tabList: document.getElementById("tab-list"),
    toolbarSidebarToggle: document.getElementById("sidebar-toggle"),
    addressUndoButton: document.getElementById("toolbar-address-undo"),
    addressRedoButton: document.getElementById("toolbar-address-redo")
  };

  var ADDRESS_HISTORY_LIMIT = 50;
  var addressBarHistoryState = {
    past: [],
    future: [],
    applying: false,
    commitSnapshot: "",
    ready: false
  };

  function getViewportMetrics() {
    var viewport = window.visualViewport;
    var width = Number(viewport && viewport.width) || window.innerWidth || document.documentElement.clientWidth || 0;
    var height = Number(viewport && viewport.height) || window.innerHeight || document.documentElement.clientHeight || 0;
    return {
      width: Math.max(320, width),
      height: Math.max(480, height)
    };
  }

  function computeResponsiveShellScale() {
    var viewport = getViewportMetrics();
    var widthTarget = state.sidebarCollapsed ? 1300 : 1480;
    var heightTarget = 860;

    if (viewport.width <= 1100) {
      widthTarget = state.sidebarCollapsed ? 900 : 980;
      heightTarget = 920;
    }

    if (viewport.width <= 760) {
      widthTarget = 430;
      heightTarget = 820;
    }

    var scale = Math.min(1, viewport.width / widthTarget, viewport.height / heightTarget);
    if (!Number.isFinite(scale)) {
      return 1;
    }
    return Math.max(SHELL_SCALE_MIN, scale);
  }

  function applyResponsiveShellScale() {
    document.documentElement.style.setProperty("--shell-scale", String(computeResponsiveShellScale()));
  }

  function bindResponsiveShellScale() {
    applyResponsiveShellScale();
    window.addEventListener("resize", applyResponsiveShellScale);
    window.addEventListener("orientationchange", applyResponsiveShellScale);
    if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
      window.visualViewport.addEventListener("resize", applyResponsiveShellScale);
      window.visualViewport.addEventListener("scroll", applyResponsiveShellScale);
    }
  }

  var state = {
    activeTabId: "",
    config: null,
    gamesCatalog: null,
    proxyHealth: {
      ok: false,
      message: "Booting Scramjet..."
    },
    proxyRuntime: {
      controller: null,
      initPromise: null,
      repairPromise: null,
      reloadScheduled: false,
      ready: false,
      transportMode: "",
      transportUrl: ""
    },
    sidebarCollapsed: false,
    tabs: []
  };

  function cleanText(value) {
    return core.cleanText(value);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getGamesApi() {
    return window.AntarcticGames || window.PalladiumGames || null;
  }

  function getBackendApi() {
    return window.AntarcticGamesBackend || window.PalladiumBackend || null;
  }

  function getSocialApi() {
    return window.AntarcticSocialClient || window.PalladiumSocialClient || null;
  }

  function getSiteStorageApi() {
    return window.AntarcticGamesStorage || window.PalladiumSiteStorage || null;
  }

  var localAppBaseUrlCache = "";

  function resolveDocumentUrl(raw) {
    var text = cleanText(raw);
    if (!text) return "";

    var baseHref = "";
    try {
      baseHref = cleanText((document && document.baseURI) || "");
    } catch (error) {
      baseHref = "";
    }

    if (!baseHref) {
      try {
        baseHref = cleanText((window.location && window.location.href) || "");
      } catch (error) {
        baseHref = "";
      }
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
        var src = cleanText(scripts[index].getAttribute("src"));
        if (!/(?:^|\/)(?:shell|games-static|site-settings|site-storage|social-client|backend)\.js(?:[?#].*)?$/i.test(src)) {
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
          // Keep trying the next candidate.
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

  function appendLocalAssetVersion(resolvedUrl) {
    var text = cleanText(resolvedUrl);
    if (!text || /^(?:data|blob):/i.test(text)) {
      return text;
    }

    try {
      var assetUrl = new URL(text, getLocalAppBaseUrl());
      var baseUrl = new URL(getLocalAppBaseUrl());
      if (assetUrl.origin !== baseUrl.origin) {
        return assetUrl.toString();
      }
      assetUrl.searchParams.set(LOCAL_APP_ASSET_PARAM, LOCAL_APP_ASSET_VERSION);
      return assetUrl.toString();
    } catch (error) {
      return text;
    }
  }

  function appendProxyRuntimeAssetVersion(value) {
    var text = cleanText(value);
    if (!text) {
      return text;
    }

    try {
      var assetUrl = new URL(text, getLocalAppBaseUrl());
      assetUrl.searchParams.set(LOCAL_APP_ASSET_PARAM, PROXY_RUNTIME_ASSET_VERSION);
      return assetUrl.pathname + assetUrl.search;
    } catch (error) {
      return text;
    }
  }

  function readProxyServiceWorkerAssetVersion(scriptUrl) {
    var text = cleanText(scriptUrl);
    if (!text) {
      return "";
    }

    try {
      var parsed = new URL(text, getLocalAppBaseUrl());
      return cleanText(parsed.searchParams.get(LOCAL_APP_ASSET_PARAM));
    } catch (error) {
      return "";
    }
  }

  function isKnownProxyServiceWorkerScript(scriptUrl) {
    var text = cleanText(scriptUrl);
    if (!text) {
      return false;
    }

    try {
      var parsed = new URL(text, getLocalAppBaseUrl());
      var baseUrl = new URL(getLocalAppBaseUrl());
      return parsed.origin === baseUrl.origin && parsed.pathname === SCRAMJET_SW_PATH;
    } catch (error) {
      return false;
    }
  }

  function isRemoteAssetUrl(value) {
    var text = cleanText(value);
    if (!text) return false;
    if (/^(?:data|blob):/i.test(text)) return true;

    try {
      var assetUrl = new URL(text, getLocalAppBaseUrl());
      var baseUrl = new URL(getLocalAppBaseUrl());
      return assetUrl.origin !== baseUrl.origin;
    } catch (error) {
      return /^(?:[a-z]+:)?\/\//i.test(text);
    }
  }

  function resolveLocalAppUrl(value) {
    var text = cleanText(value);
    if (!text) {
      return text;
    }
    if (/^(?:data|blob):/i.test(text)) {
      return text;
    }
    if (isRemoteAssetUrl(text)) {
      try {
        return new URL(text).toString();
      } catch (error) {
        return text;
      }
    }

    var normalized = text.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!normalized) {
      return getLocalAppBaseUrl() || "/";
    }

    try {
      return appendLocalAssetVersion(new URL(normalized, getLocalAppBaseUrl()).toString());
    } catch (error) {
      return appendLocalAssetVersion("/" + normalized);
    }
  }

  function readPersistentValue(key) {
    var storage = getSiteStorageApi();
    if (storage && typeof storage.getItem === "function") {
      return cleanText(storage.getItem(key));
    }

    try {
      return cleanText(window.localStorage.getItem(key));
    } catch (error) {
      return "";
    }
  }

  function writePersistentValue(key, value) {
    var normalized = cleanText(value);
    var storage = getSiteStorageApi();
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(key, normalized);
      return;
    }

    try {
      if (normalized) {
        window.localStorage.setItem(key, normalized);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function injectAntarcticFontsIntoDocument(doc) {
    if (!doc || !doc.head) return;
    if (doc.getElementById("antarctic-font-bridge")) return;
    try {
      var link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = ANTARCTIC_GFONTS_URL;
      link.id = "antarctic-font-link";
      var style = doc.createElement("style");
      style.id = "antarctic-font-bridge";
      style.textContent = ANTARCTIC_IN_FRAME_FONT_CSS;
      doc.head.appendChild(link);
      doc.head.appendChild(style);
    } catch (err) {
      /* Cross-origin or inert document */
    }
  }

  function attachAntarcticFontBridge(frame) {
    if (!frame || frame.getAttribute("data-antarctic-font-bridge") === "1") return;
    frame.setAttribute("data-antarctic-font-bridge", "1");
    function onLoad() {
      try {
        injectAntarcticFontsIntoDocument(frame.contentDocument);
      } catch (err) {
        /* SecurityError */
      }
    }
    frame.addEventListener("load", onLoad);
    try {
      if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
        onLoad();
      }
    } catch (err) {
      /* ignore */
    }
  }

  function readStorage() {
    var storage = getSiteStorageApi();
    if (storage && typeof storage.getJson === "function") {
      return storage.getJson(STORAGE_KEY, {
        legacyKeys: [LEGACY_STORAGE_KEY],
        sessionKeys: [STORAGE_KEY, LEGACY_STORAGE_KEY]
      });
    }

    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(payload) {
    var storage = getSiteStorageApi();
    if (storage && typeof storage.setJson === "function") {
      storage.setJson(STORAGE_KEY, payload, {
        legacyKeys: [LEGACY_STORAGE_KEY],
        sessionKeys: [STORAGE_KEY, LEGACY_STORAGE_KEY]
      });
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function cloneTemplate(id) {
    var template = document.getElementById(id);
    if (!template) return null;
    return template.content.firstElementChild.cloneNode(true);
  }

  function makeTabId() {
    return "tab-" + Math.random().toString(36).slice(2, 10);
  }

  function describeUri(value) {
    return core.describeInput(value || core.buildInternalUri("home"));
  }

  function createEmptyWebState(pendingSearchQuery) {
    return {
      currentTarget: "",
      frameController: null,
      pendingSearchQuery: cleanText(pendingSearchQuery),
      searchRetryTimer: 0
    };
  }

  function clearPendingWebSearch(tab) {
    if (!tab || !tab.webState) {
      return;
    }

    if (tab.webState.searchRetryTimer) {
      window.clearTimeout(tab.webState.searchRetryTimer);
      tab.webState.searchRetryTimer = 0;
    }
  }

  function isChatViewName(value) {
    return value === "chat" || value === "chats" || value === "dms" || value === "groupchats";
  }

  function getChatMode(tab) {
    if (tab && tab.view === "dms") {
      return "dms";
    }
    if (tab && tab.view === "groupchats") {
      return "groupchats";
    }
    return "chats";
  }

  function createTab(uri, existingId) {
    var descriptor = describeUri(uri);
    return {
      accountState: {
        allowAutoOpen: true
      },
      aiState: {
        busy: false,
        memory: []
      },
      chatState: {
        activeThreadId: "",
        pollHandle: 0,
        wizardStep: 2
      },
      gamesQuery: "",
      id: existingId || makeTabId(),
      paneEl: null,
      browserUri: descriptor.browserUri || descriptor.uri,
      searchProvider: descriptor.searchProvider || "",
      searchQuery: descriptor.searchQuery || "",
      title: descriptor.title,
      route: descriptor.route,
      targetUrl: descriptor.targetUrl || "",
      webState: createEmptyWebState(descriptor.searchQuery),
      path: descriptor.path || "",
      author: descriptor.author || "",
      uri: descriptor.uri,
      view: descriptor.view
    };
  }

  function assignDescriptor(tab, descriptor) {
    tab.browserUri = descriptor.browserUri || descriptor.uri;
    tab.title = descriptor.title;
    tab.route = descriptor.route;
    tab.searchProvider = descriptor.searchProvider || "";
    tab.searchQuery = descriptor.searchQuery || "";
    tab.targetUrl = descriptor.targetUrl || "";
    tab.webState = createEmptyWebState(descriptor.searchQuery);
    tab.path = descriptor.path || "";
    tab.author = descriptor.author || "";
    tab.uri = descriptor.uri;
    tab.view = descriptor.view;
    tab.gamesQuery = tab.view === "games" ? tab.gamesQuery : "";
    if (tab.view === "account") {
      tab.accountState = {
        allowAutoOpen: true
      };
    }
    if (tab.view !== "ai") {
      tab.aiState = {
        busy: false,
        memory: []
      };
    }
    if (isChatViewName(tab.view)) {
      if (!tab.chatState || typeof tab.chatState !== "object") {
        tab.chatState = {
          activeThreadId: "",
          pollHandle: 0,
          wizardStep: 2
        };
      }
      tab.chatState.activeThreadId = "";
      if (Number(tab.chatState.wizardStep || 2) < 2) {
        tab.chatState.wizardStep = 2;
      } else if (Number(tab.chatState.wizardStep || 2) > 2) {
        tab.chatState.wizardStep = 2;
      }
    } else {
      tab.chatState = {
        activeThreadId: "",
        pollHandle: 0,
        wizardStep: 1
      };
    }
  }

  function getActiveTab() {
    for (var index = 0; index < state.tabs.length; index += 1) {
      if (state.tabs[index].id === state.activeTabId) {
        return state.tabs[index];
      }
    }
    return state.tabs[0] || null;
  }

  function removePane(tab) {
    if (tab && tab.chatState && tab.chatState.pollHandle) {
      window.clearInterval(tab.chatState.pollHandle);
      tab.chatState.pollHandle = 0;
    }
    clearPendingWebSearch(tab);
    if (tab && tab.paneEl && tab.paneEl.__paneSyncTimer) {
      window.clearTimeout(tab.paneEl.__paneSyncTimer);
      tab.paneEl.__paneSyncTimer = 0;
    }
    if (tab && tab.paneEl && typeof tab.paneEl.__socialUnsubscribe === "function") {
      tab.paneEl.__socialUnsubscribe();
      tab.paneEl.__socialUnsubscribe = null;
    }
    if (tab && tab.paneEl && tab.paneEl.parentNode) {
      tab.paneEl.parentNode.removeChild(tab.paneEl);
    }
    if (tab) {
      tab.paneEl = null;
      tab.webState = createEmptyWebState("");
    }
  }

  function restoreTab(entry) {
    var tab = createTab(entry && entry.uri, entry && entry.id);
    var savedBrowserUri = cleanText(entry && entry.browserUri);
    var savedUri = cleanText(entry && entry.uri);
    var savedTargetUrl = cleanText(entry && entry.targetUrl);
    var savedTitle = cleanText(entry && entry.title);
    var savedSearchProvider = cleanText(entry && entry.searchProvider);
    var savedSearchQuery = cleanText(entry && entry.searchQuery);

    if (savedUri) {
      tab.uri = savedUri;
    }
    if (savedBrowserUri) {
      tab.browserUri = savedBrowserUri;
    }
    if (savedTargetUrl) {
      tab.targetUrl = savedTargetUrl;
    }
    if (savedTitle) {
      tab.title = savedTitle;
    }
    if (savedSearchProvider) {
      tab.searchProvider = savedSearchProvider;
    }
    if (savedSearchQuery) {
      tab.searchQuery = savedSearchQuery;
    }
    tab.webState = createEmptyWebState(
      savedTargetUrl && savedTargetUrl !== (savedBrowserUri || savedUri) ? "" : savedSearchQuery
    );
    return tab;
  }

  function persistState() {
    writeStorage({
      activeTabId: state.activeTabId,
      sidebarCollapsed: state.sidebarCollapsed,
      tabs: state.tabs.map(function (tab) {
        return {
          browserUri: tab.browserUri || "",
          id: tab.id,
          searchProvider: tab.searchProvider || "",
          searchQuery: tab.searchQuery || "",
          targetUrl: tab.view === "web" ? tab.targetUrl : "",
          title: tab.title,
          uri: tab.uri
        };
      })
    });
  }

  function getTabBrowserUri(tab) {
    return cleanText((tab && tab.browserUri) || (tab && tab.uri));
  }

  function getPublicBrowserUri(tab) {
    if (!tab) {
      return "";
    }
    if (tab.view === "web") {
      return "";
    }
    return getTabBrowserUri(tab);
  }

  function syncBrowserUrl() {
    var active = getActiveTab();
    try {
      var params = new URLSearchParams(window.location.search || "");
      var nextUri = getPublicBrowserUri(active);
      if (nextUri) {
        params.set("uri", nextUri);
      } else {
        params.delete("uri");
      }
      var query = params.toString();
      var nextUrl = window.location.pathname + (query ? "?" + query : "");
      window.history.replaceState(null, "", nextUrl);
    } catch (error) {
      // Ignore history issues.
    }
  }

  function setDocumentTitle(tab) {
    var baseTitle = (tab && tab.title ? tab.title + " | " : "") + "Antarctic Games";
    var siteSettings = getSiteSettingsApi();
    if (siteSettings && typeof siteSettings.decorateTitle === "function") {
      document.title = siteSettings.decorateTitle(baseTitle);
      return;
    }
    document.title = baseTitle;
  }

  function setActiveTab(tabId) {
    state.activeTabId = tabId;
    renderShell();
  }

  function openNewTab(uri) {
    var tab = createTab(uri || core.buildInternalUri("home"));
    state.tabs.push(tab);
    state.activeTabId = tab.id;
    renderShell();
    if (elements.addressInput) {
      elements.addressInput.focus();
      elements.addressInput.select();
    }
  }

  function closeTab(tabId) {
    var nextTabs = [];
    var removedIndex = -1;

    for (var index = 0; index < state.tabs.length; index += 1) {
      var tab = state.tabs[index];
      if (tab.id === tabId) {
        removedIndex = index;
        removePane(tab);
        continue;
      }
      nextTabs.push(tab);
    }

    state.tabs = nextTabs;

    if (!state.tabs.length) {
      openNewTab(core.buildInternalUri("home"));
      return;
    }

    if (state.activeTabId === tabId) {
      var fallbackIndex = Math.max(0, Math.min(removedIndex - 1, state.tabs.length - 1));
      state.activeTabId = state.tabs[fallbackIndex].id;
    }

    renderShell();
  }

  function navigateCurrent(value) {
    var active = getActiveTab();
    var descriptor = describeUri(value);

    if (!active) {
      state.tabs.push(createTab(descriptor.uri));
      state.activeTabId = state.tabs[0].id;
      renderShell();
      return;
    }

    removePane(active);
    assignDescriptor(active, descriptor);
    renderShell();
  }

  function restoreTabs() {
    var restored = readStorage();
    var requestedUri = readRequestedUri();

    if (restored && Array.isArray(restored.tabs) && restored.tabs.length) {
      state.tabs = restored.tabs.map(function (entry) {
        return restoreTab(entry);
      });
      state.activeTabId = restored.activeTabId || state.tabs[0].id;
    }

    state.sidebarCollapsed = Boolean(restored && restored.sidebarCollapsed);

    if (!state.tabs.length) {
      state.tabs = [createTab(requestedUri || core.buildInternalUri("home"))];
      state.activeTabId = state.tabs[0].id;
      return;
    }

    if (requestedUri) {
      var active = getActiveTab();
      if (
        active &&
        (cleanText(active.uri) === requestedUri || getTabBrowserUri(active) === requestedUri)
      ) {
        return;
      }
      navigateCurrent(requestedUri);
    }
  }

  function readRequestedUri() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return cleanText(params.get("uri"));
    } catch (error) {
      return "";
    }
  }

  function renderTabList() {
    if (!elements.tabList) return;
    elements.tabList.innerHTML = "";

    state.tabs.forEach(function (tab) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "tab-card" + (tab.id === state.activeTabId ? " tab-card--active" : "");
      card.dataset.tabId = tab.id;

      var icon = buildTabIcon(tab);

      var body = document.createElement("span");
      body.className = "tab-card__body";

      var title = document.createElement("strong");
      title.className = "tab-card__title";
      title.textContent = tab.title;

      body.appendChild(title);

      var close = document.createElement("button");
      close.type = "button";
      close.className = "tab-card__close";
      close.dataset.closeTab = tab.id;
      close.setAttribute("aria-label", "Close " + tab.title);
      close.appendChild(buildInlineSvgIcon("close", "tab-card__close-icon"));

      card.appendChild(icon);
      card.appendChild(body);
      card.appendChild(close);
      elements.tabList.appendChild(card);
    });
  }

  function buildTabIcon(tab) {
    var icon = document.createElement("span");
    icon.className = "tab-card__icon";

    var faviconUrl = resolveTabFavicon(tab);
    if (!faviconUrl) {
      icon.appendChild(buildInlineSvgIcon(tabIcon(tab), "tab-card__fallback-icon"));
      return icon;
    }

    var img = document.createElement("img");
    img.className = "tab-card__favicon";
    img.src = faviconUrl;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.loading = "lazy";

    img.addEventListener("error", function () {
      icon.innerHTML = "";
      icon.appendChild(buildInlineSvgIcon(tabIcon(tab), "tab-card__fallback-icon"));
    }, { once: true });

    icon.appendChild(img);
    return icon;
  }

  function resolveTabFavicon(tab) {
    if (!tab) return "";
    if (tab.view === "gamelauncher") return "";
    if (tab.view !== "web" || !tab.targetUrl) return "";
    try {
      var origin = new URL(tab.targetUrl).origin;
      return origin.replace(/\/+$/, "") + "/favicon.ico";
    } catch (error) {
      return "";
    }
  }

  function tabIcon(tab) {
    if (tab.view === "home") return "home";
    if (tab.view === "games") return "games";
    if (tab.view === "ai") return "ai";
    if (tab.view === "account") return "account";
    if (isChatViewName(tab.view)) return "chat";
    if (tab.view === "settings") return "settings";
    if (tab.view === "gamelauncher") return "games";
    return "web";
  }

  function buildInlineSvgIcon(name, className) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.setAttribute("class", className);

    function addPath(d) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }

    if (name === "home") {
      addPath("M3 11.5 12 4l9 7.5M6.5 10.5V20h11V10.5");
      return svg;
    }
    if (name === "games") {
      svg.setAttribute("viewBox", "0 58 512 454");
      svg.setAttribute("class", (className ? className + " " : "") + "ui-icon--filled");
      addPath(GAMES_CONTROLLER_PATH_MAIN);
      var circles = [
        [334.8, 373.8, 16.3],
        [413.7, 373.8, 16.3],
        [374.2, 413.3, 16.3],
        [374.2, 334.3, 16.3]
      ];
      for (var gi = 0; gi < circles.length; gi += 1) {
        var cc = circles[gi];
        var circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circ.setAttribute("cx", String(cc[0]));
        circ.setAttribute("cy", String(cc[1]));
        circ.setAttribute("r", String(cc[2]));
        svg.appendChild(circ);
      }
      addPath(GAMES_CONTROLLER_PATH_DPAD);
      return svg;
    }
    if (name === "ai") {
      svg.setAttribute("viewBox", "0 0 16 16");
      svg.setAttribute("class", (className ? className + " " : "") + "ui-icon--filled");
      addPath(AI_ROBOT_PATH_FACE);
      addPath(AI_ROBOT_PATH_BODY);
      return svg;
    }
    if (name === "account") {
      addPath("M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z");
      addPath("M4.5 20a7.5 7.5 0 0 1 15 0");
      return svg;
    }
    if (name === "chat") {
      addPath("M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5Z");
      return svg;
    }
    if (name === "play") {
      addPath("M8 6v12l10-6-10-6Z");
      return svg;
    }
    if (name === "settings") {
      svg.setAttribute("viewBox", "0 0 15 15");
      svg.setAttribute("class", (className ? className + " " : "") + "ui-icon--filled");
      var gearPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      gearPath.setAttribute("fill-rule", "evenodd");
      gearPath.setAttribute("clip-rule", "evenodd");
      gearPath.setAttribute("d", SETTINGS_GEAR_PATH);
      svg.appendChild(gearPath);
      return svg;
    }
    if (name === "close") {
      addPath("M7 7l10 10M17 7 7 17");
      return svg;
    }
    addPath("M12 3a9 9 0 1 0 9 9");
    addPath("M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18");
    return svg;
  }

  function trimAddressHistoryPast(value) {
    addressBarHistoryState.past.push(value);
    while (addressBarHistoryState.past.length > ADDRESS_HISTORY_LIMIT) {
      addressBarHistoryState.past.shift();
    }
  }

  function updateAddressBarHistoryButtons() {
    var active = getActiveTab();
    var hasChatBack = Boolean(
      active &&
      isChatViewName(active.view) &&
      active.chatState &&
      Number(active.chatState.wizardStep || 2) > 2 &&
      cleanText(active.chatState.activeThreadId)
    );
    if (elements.addressUndoButton) {
      elements.addressUndoButton.disabled = !hasChatBack && addressBarHistoryState.past.length === 0;
    }
    if (elements.addressRedoButton) {
      elements.addressRedoButton.disabled = addressBarHistoryState.future.length === 0;
    }
  }

  function syncAddressBarValueFromNavigation(nextUri) {
    if (!elements.addressInput) return;
    var next = cleanText(nextUri) || "";
    if (addressBarHistoryState.applying) {
      elements.addressInput.value = next;
      addressBarHistoryState.commitSnapshot = next;
      updateAddressBarHistoryButtons();
      return;
    }
    var cur = elements.addressInput.value;
    if (addressBarHistoryState.ready && cur !== next) {
      trimAddressHistoryPast(cur);
      addressBarHistoryState.future = [];
    }
    elements.addressInput.value = next;
    addressBarHistoryState.commitSnapshot = next;
    addressBarHistoryState.ready = true;
    updateAddressBarHistoryButtons();
  }

  function addressBarRecordSubmitOverride(active, typedValue) {
    if (!active || addressBarHistoryState.applying || !addressBarHistoryState.ready) return;
    var v = cleanText(typedValue) || "";
    var tabUri = cleanText(active.uri) || "";
    if (v !== tabUri) {
      trimAddressHistoryPast(tabUri);
      addressBarHistoryState.future = [];
    }
  }

  function addressBarUndo() {
    if (!elements.addressInput || addressBarHistoryState.past.length === 0) return;
    addressBarHistoryState.applying = true;
    var cur = elements.addressInput.value;
    var prev = addressBarHistoryState.past.pop();
    addressBarHistoryState.future.push(cur);
    elements.addressInput.value = prev;
    addressBarHistoryState.commitSnapshot = prev;
    addressBarHistoryState.applying = false;
    updateAddressBarHistoryButtons();
  }

  function addressBarRedo() {
    if (!elements.addressInput || addressBarHistoryState.future.length === 0) return;
    addressBarHistoryState.applying = true;
    var cur = elements.addressInput.value;
    var next = addressBarHistoryState.future.pop();
    trimAddressHistoryPast(cur);
    elements.addressInput.value = next;
    addressBarHistoryState.commitSnapshot = next;
    addressBarHistoryState.applying = false;
    updateAddressBarHistoryButtons();
  }

  function renderShell() {
    var active = getActiveTab();

    renderTabList();
    renderPanes();
    renderStageOverlay(active);

    if (elements.addressInput && active) {
      syncAddressBarValueFromNavigation(active.uri);
    }

    renderSidebarState();

    if (elements.stage) {
      elements.stage.classList.toggle("shell-stage--full-bleed", Boolean(active && active.view === "web"));
    }

    setDocumentTitle(active);
    syncBrowserUrl();
    persistState();
    applyResponsiveShellScale();
  }

  function renderSidebarState() {
    if (elements.shellRoot) {
      elements.shellRoot.classList.toggle("shell--sidebar-collapsed", state.sidebarCollapsed);
    }
    if (elements.toolbarSidebarToggle) {
      var label = state.sidebarCollapsed ? "Expand sidebar" : "Retract sidebar";
      elements.toolbarSidebarToggle.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
      elements.toolbarSidebarToggle.setAttribute("aria-label", label);
      elements.toolbarSidebarToggle.setAttribute("title", label);
    }
  }

  function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    renderShell();
  }

  function renderPanes() {
    state.tabs.forEach(function (tab) {
      ensurePane(tab);
      if (tab.paneEl) {
        tab.paneEl.classList.toggle("shell-pane--active", tab.id === state.activeTabId);
      }
    });
  }

  function ensurePane(tab) {
    if (tab.paneEl) return;

    if (tab.view === "home") {
      tab.paneEl = createHomePane(tab);
    } else if (tab.view === "games") {
      tab.paneEl = createGamesPane(tab);
    } else if (tab.view === "ai") {
      tab.paneEl = createAiPane(tab);
    } else if (tab.view === "account") {
      tab.paneEl = createAccountPane(tab);
    } else if (isChatViewName(tab.view)) {
      tab.paneEl = createChatPane(tab);
    } else if (tab.view === "settings") {
      tab.paneEl = createSettingsPane(tab);
    } else if (tab.view === "gamelauncher") {
      tab.paneEl = createGameLauncherPane(tab);
    } else {
      tab.paneEl = createWebPane(tab);
    }

    if (tab.paneEl) {
      tab.paneEl.dataset.tabId = tab.id;
      elements.paneStack.appendChild(tab.paneEl);
      if (tab.view === "web") {
        hydrateWebPane(tab);
      }
    }
  }

  function createHomePane() {
    var pane = cloneTemplate("home-pane-template");
    if (!pane) return null;

    pane.addEventListener("click", handlePaneAction);
    var homeForm = pane.querySelector('[data-role="home-search-form"]');
    if (homeForm) {
      homeForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = homeForm.querySelector(".home-search-bar__input");
        var q = cleanText(input && input.value);
        if (q) navigateCurrent(q);
      });
    }
    return pane;
  }

  function createGamesPane(tab) {
    var pane = cloneTemplate("games-pane-template");
    if (!pane) return null;

    pane.addEventListener("click", handlePaneAction);

    var input = pane.querySelector(".games-search-input");
    if (input) {
      input.value = tab.gamesQuery || "";
      input.addEventListener("input", function () {
        tab.gamesQuery = cleanText(input.value);
        renderGamesCatalog(pane, tab);
      });
    }

    loadGamesCatalog().then(function () {
      renderGamesCatalog(pane, tab);
    }).catch(function () {
      renderGamesFailure(pane);
    });

    return pane;
  }

  function createAiPane(tab) {
    var pane = cloneTemplate("ai-pane-template");
    if (!pane) return null;

    pane.addEventListener("click", handlePaneAction);

    var textarea = pane.querySelector(".ai-chat__input");
    var label = pane.querySelector('label[for="ai-input"]');
    if (textarea) {
      var uniqueId = "ai-input-" + tab.id;
      textarea.id = uniqueId;
      if (label) {
        label.setAttribute("for", uniqueId);
      }
      textarea.addEventListener("input", function () {
        syncAiInputHeight(textarea);
      });
      textarea.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitAiMessage(tab, pane);
        }
      });
      syncAiInputHeight(textarea);
    }

    var form = pane.querySelector('[data-role="ai-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitAiMessage(tab, pane);
      });
    }

    if (!tab.aiState.memory.length) {
      tab.aiState.memory.push({
        role: "assistant",
        content: "How can I help?"
      });
    }

    renderAiConversation(pane, tab);
    refreshAiStatus(pane);
    return pane;
  }

  function formatTimestamp(value) {
    var raw = cleanText(value);
    if (!raw) return "";
    try {
      return new Date(raw).toLocaleString();
    } catch (error) {
      return raw;
    }
  }

  function setAccountStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="account-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Account ready.";
    }
  }

  var ACCOUNT_WIZARD_STEPS = 2;
  var CHAT_WIZARD_STEPS = 3;

  function setAccountWizardStep(tab, pane, step) {
    if (!tab || !pane) return;
    var next = Math.max(1, Math.min(ACCOUNT_WIZARD_STEPS, step));
    tab.accountWizardStep = next;
    var steps = pane.querySelectorAll("[data-account-step]");
    for (var i = 0; i < steps.length; i += 1) {
      var el = steps[i];
      var s = parseInt(el.getAttribute("data-account-step") || "0", 10);
      el.classList.toggle("is-active", s === next);
    }
    var dots = pane.querySelectorAll(".pane-wizard--account .pane-wizard__dot");
    for (var d = 0; d < dots.length; d += 1) {
      dots[d].classList.toggle("is-active", d === next - 1);
    }
    var backBtn = pane.querySelector("[data-account-wizard-back]");
    var nextBtn = pane.querySelector("[data-account-wizard-next]");
    if (backBtn) backBtn.hidden = next <= 1;
    if (nextBtn) nextBtn.hidden = next >= ACCOUNT_WIZARD_STEPS;
  }

  function wireAccountWizard(tab, pane) {
    if (!pane || pane.dataset.accountWizardBound === "true") return;
    pane.dataset.accountWizardBound = "true";
    var backBtn = pane.querySelector("[data-account-wizard-back]");
    var nextBtn = pane.querySelector("[data-account-wizard-next]");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        var current = tab.accountWizardStep || 1;
        setAccountWizardStep(tab, pane, current - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var current = tab.accountWizardStep || 1;
        setAccountWizardStep(tab, pane, current + 1);
      });
    }
  }

  function setChatWizardStep(tab, pane, step) {
    if (!tab || !pane || !tab.chatState) return;
    var next = Math.max(2, Math.min(CHAT_WIZARD_STEPS, step));
    tab.chatState.wizardStep = next;
    var steps = pane.querySelectorAll("[data-chat-step]");
    for (var i = 0; i < steps.length; i += 1) {
      var el = steps[i];
      var s = parseInt(el.getAttribute("data-chat-step") || "0", 10);
      el.classList.toggle("is-active", s === next);
    }
    var dots = pane.querySelectorAll(".pane-wizard--chat .pane-wizard__dot");
    for (var d = 0; d < dots.length; d += 1) {
      dots[d].classList.toggle("is-active", d === next - 1);
    }
    var nextBtn = pane.querySelector("[data-chat-wizard-next]");
    if (nextBtn) nextBtn.hidden = true;
    updateAddressBarHistoryButtons();
  }

  function wireChatWizard(tab, pane) {
    if (!pane || pane.dataset.chatWizardBound === "true") return;
    pane.dataset.chatWizardBound = "true";
    var nextBtn = pane.querySelector("[data-chat-wizard-next]");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var current = (tab.chatState && tab.chatState.wizardStep) || 2;
        setChatWizardStep(tab, pane, current + 1);
      });
    }
  }

  function emptyCommunityBootstrap() {
    return {
      threads: [],
      rooms: [],
      saves: [],
      incomingDirectRequests: [],
      stats: {
        threadCount: 0,
        roomCount: 0,
        joinedRoomCount: 0,
        directCount: 0,
        incomingDirectRequestCount: 0,
        saveCount: 0
      }
    };
  }

  function getChatModeConfig(tab) {
    var mode = getChatMode(tab);
    if (mode === "chats") {
      return {
        mode: "chats",
        routeUri: "antarctic://chats",
        introTitle: "Chats",
        introLede: "Jump between DMs and group chats, create rooms, invite people, and keep every conversation in one place.",
        listEyebrow: "Chats",
        listTitle: "All Conversations",
        nextLabel: "Open chats",
        emptyThreadsTitle: "No conversations yet.",
        emptyThreadsBody: "Send a DM request or create a room to get things moving.",
        emptySelectionBody: "Pick a DM or room from the left.",
        browseStatus: "Continue to browse your conversations.",
        emptyStatus: "Send a DM request or create a room to get things moving.",
        unauthenticatedStatus: "Log in from Account to use chats.",
        chattingStatus: "Chatting as @",
        showRoomForm: true,
        showDirectForm: true,
        showIncomingRequests: true,
        showRoomCatalog: true
      };
    }

    if (mode === "dms") {
      return {
        mode: "dms",
        routeUri: "antarctic://chats",
        introTitle: "Chats",
        introLede: "Review incoming requests, start one-on-one conversations, and jump back into your private threads.",
        listEyebrow: "Chats",
        listTitle: "Direct Threads",
        nextLabel: "Open chats",
        emptyThreadsTitle: "No direct messages yet.",
        emptyThreadsBody: "Send a DM request to start talking.",
        emptySelectionBody: "Pick a DM from the left.",
        browseStatus: "Continue to browse your direct messages.",
        emptyStatus: "Start a DM request to begin talking.",
        unauthenticatedStatus: "Log in from Account to use direct messages.",
        chattingStatus: "DMing as @",
        showRoomForm: false,
        showDirectForm: true,
        showIncomingRequests: true,
        showRoomCatalog: false
      };
    }

    return {
      mode: "groupchats",
      routeUri: "antarctic://chats",
      introTitle: "Chats",
      introLede: "Create public or private rooms, invite people, and hang out with other Antarctic users.",
      listEyebrow: "Rooms",
      listTitle: "Group Chats",
      nextLabel: "Open rooms",
      emptyThreadsTitle: "No joined rooms yet.",
      emptyThreadsBody: "Create a room or join one from the catalog.",
      emptySelectionBody: "Pick a joined room from the left.",
      browseStatus: "Continue to browse your joined rooms.",
      emptyStatus: "Create a room or join one from the catalog.",
      unauthenticatedStatus: "Log in from Account to use group chats.",
      chattingStatus: "Chatting as @",
      showRoomForm: true,
      showDirectForm: false,
      showIncomingRequests: false,
      showRoomCatalog: true
    };
  }

  function applyChatPaneMode(tab, pane) {
    if (!tab || !pane) return;
    var config = getChatModeConfig(tab);
    pane.dataset.chatMode = config.mode;

    var introEyebrow = pane.querySelector('[data-role="chat-intro-eyebrow"]');
    var introTitle = pane.querySelector('[data-role="chat-intro-title"]');
    var introLede = pane.querySelector('[data-role="chat-intro-lede"]');
    var listEyebrow = pane.querySelector('[data-role="chat-list-eyebrow"]');
    var listTitle = pane.querySelector('[data-role="chat-list-title"]');
    var nextButton = pane.querySelector("[data-chat-wizard-next]");
    var roomForm = pane.querySelector('[data-role="chat-room-form"]');
    var directForm = pane.querySelector('[data-role="chat-direct-form"]');
    var incomingRequests = pane.querySelector('[data-role="chat-incoming-requests"]');
    var roomCatalog = pane.querySelector('[data-role="chat-room-catalog"]');

    if (introEyebrow) introEyebrow.textContent = config.routeUri;
    if (introTitle) introTitle.textContent = config.introTitle;
    if (introLede) introLede.textContent = config.introLede;
    if (listEyebrow) listEyebrow.textContent = config.listEyebrow;
    if (listTitle) listTitle.textContent = config.listTitle;
    if (nextButton) nextButton.textContent = config.nextLabel;
    if (roomForm) roomForm.hidden = !config.showRoomForm;
    if (directForm) directForm.hidden = !config.showDirectForm;
    if (incomingRequests) incomingRequests.hidden = !config.showIncomingRequests;
    if (roomCatalog) roomCatalog.hidden = !config.showRoomCatalog;
  }

  function isDirectThread(thread) {
    return Boolean(thread && thread.type === "direct");
  }

  function isRoomThread(thread) {
    return Boolean(thread && thread.type === "room");
  }

  function filterThreadsForChatMode(threads, tab) {
    var list = Array.isArray(threads) ? threads : [];
    var mode = getChatMode(tab);
    if (mode === "dms") {
      return list.filter(isDirectThread);
    }
    if (mode === "groupchats") {
      return list.filter(isRoomThread);
    }
    return list;
  }

  function bindSocialPaneListener(pane, callback) {
    var socialApi = getSocialApi();
    if (!pane || !socialApi || typeof socialApi.onSessionChange !== "function" || pane.__socialUnsubscribe) {
      return;
    }

    pane.__socialUnsubscribe = socialApi.onSessionChange(function () {
      if (!pane.isConnected) return;
      callback();
    });
  }

  function bindGhostClickGuard(pane) {
    if (!pane || pane.__ghostClickBound) return;
    pane.__ghostClickBound = true;
    pane.__ghostClickState = {
      interactionUntil: 0,
      moved: false,
      pointerActive: false,
      touchActive: false,
      startX: 0,
      startY: 0,
      suppressUntil: 0
    };

    function markPaneInteraction(durationMs) {
      var state = pane.__ghostClickState;
      if (!state) return;
      state.interactionUntil = Math.max(
        Number(state.interactionUntil || 0),
        Date.now() + Math.max(0, Number(durationMs || 0) || 0)
      );
    }

    function suppressGhostClick(durationMs) {
      var state = pane.__ghostClickState;
      if (!state) return;
      markPaneInteraction(durationMs);
      state.suppressUntil = Date.now() + Math.max(0, Number(durationMs || 0) || 0);
    }

    function readTouchPoint(event) {
      if (!event) return null;
      if (event.touches && event.touches[0]) return event.touches[0];
      if (event.changedTouches && event.changedTouches[0]) return event.changedTouches[0];
      return null;
    }

    function updateMoveState(clientX, clientY) {
      var state = pane.__ghostClickState;
      if (!state) return;
      var deltaX = Math.abs(Number(clientX || 0) - state.startX);
      var deltaY = Math.abs(Number(clientY || 0) - state.startY);
      if (deltaX > 10 || deltaY > 10) {
        state.moved = true;
      }
    }

    pane.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      markPaneInteraction(420);
      pane.__ghostClickState.pointerActive = true;
      pane.__ghostClickState.moved = false;
      pane.__ghostClickState.startX = Number(event.clientX || 0);
      pane.__ghostClickState.startY = Number(event.clientY || 0);
    }, true);

    pane.addEventListener("pointermove", function (event) {
      var state = pane.__ghostClickState;
      if (!state || !state.pointerActive) return;
      markPaneInteraction(480);
      updateMoveState(event.clientX, event.clientY);
    }, true);

    function settlePointer() {
      var state = pane.__ghostClickState;
      if (!state) return;
      if (state.pointerActive && state.moved) {
        suppressGhostClick(320);
      }
      state.pointerActive = false;
      state.moved = false;
    }

    pane.addEventListener("pointerup", settlePointer, true);
    pane.addEventListener("pointercancel", settlePointer, true);

    pane.addEventListener("touchstart", function (event) {
      var point = readTouchPoint(event);
      if (!point) return;
      markPaneInteraction(480);
      pane.__ghostClickState.touchActive = true;
      pane.__ghostClickState.moved = false;
      pane.__ghostClickState.startX = Number(point.clientX || 0);
      pane.__ghostClickState.startY = Number(point.clientY || 0);
    }, { capture: true, passive: true });

    pane.addEventListener("touchmove", function (event) {
      var state = pane.__ghostClickState;
      if (!state || !state.touchActive) return;
      var point = readTouchPoint(event);
      if (!point) return;
      markPaneInteraction(520);
      updateMoveState(point.clientX, point.clientY);
      if (state.moved) {
        suppressGhostClick(320);
      }
    }, { capture: true, passive: true });

    function settleTouch(event) {
      var state = pane.__ghostClickState;
      if (!state) return;
      if (state.touchActive && state.moved) {
        suppressGhostClick(360);
      }
      state.touchActive = false;
      state.moved = false;
      var point = readTouchPoint(event);
      if (point) {
        state.startX = Number(point.clientX || 0);
        state.startY = Number(point.clientY || 0);
      }
    }

    pane.addEventListener("touchend", settleTouch, { capture: true, passive: true });
    pane.addEventListener("touchcancel", settleTouch, { capture: true, passive: true });
    pane.addEventListener("wheel", function () {
      suppressGhostClick(420);
    }, { capture: true, passive: true });
    pane.addEventListener("scroll", function () {
      suppressGhostClick(420);
    }, { capture: true, passive: true });
    pane.addEventListener("click", function (event) {
      if (!shouldSuppressGhostClick(pane)) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function shouldSuppressGhostClick(pane) {
    return Boolean(
      pane &&
      pane.__ghostClickState &&
      Number(pane.__ghostClickState.suppressUntil || 0) > Date.now()
    );
  }

  function isPaneInteractionActive(pane) {
    return Boolean(
      pane &&
      pane.__ghostClickState &&
      Number(pane.__ghostClickState.interactionUntil || 0) > Date.now()
    );
  }

  function schedulePaneSyncAfterInteraction(pane, callback) {
    if (!pane || typeof callback !== "function" || !isPaneInteractionActive(pane)) {
      return false;
    }
    if (pane.__paneSyncTimer) {
      window.clearTimeout(pane.__paneSyncTimer);
    }
    var delay = Math.max(80, Number((pane.__ghostClickState && pane.__ghostClickState.interactionUntil) || 0) - Date.now() + 24);
    pane.__paneSyncTimer = window.setTimeout(function () {
      pane.__paneSyncTimer = 0;
      if (!pane.isConnected) return;
      callback();
    }, delay);
    return true;
  }

  function setPaneAuthenticatedState(pane, authenticated) {
    if (!pane) return;
    pane.classList.toggle("shell-pane--authenticated", Boolean(authenticated));
    var wizard = pane.querySelector(".pane-wizard");
    if (wizard) {
      wizard.classList.toggle("is-authenticated", Boolean(authenticated));
    }
  }

  function getPrimaryCommunityRoute(bootstrap) {
    return "antarctic://chats";
  }

  function createAccountPane(tab) {
    var pane = cloneTemplate("account-pane-template");
    if (!pane) return null;

    if (typeof tab.accountWizardStep !== "number" || tab.accountWizardStep < 1) {
      tab.accountWizardStep = 1;
    }

    var form = pane.querySelector('[data-role="account-auth-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitAccountForm(pane, "login", tab);
      });
    }

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var actionButton = target.closest("[data-account-action]");
      if (actionButton) {
        var action = actionButton.getAttribute("data-account-action");
        if (action === "login") return;
        event.preventDefault();
        submitAccountForm(pane, action, tab);
        return;
      }

      var routeButton = target.closest("[data-account-route]");
      if (routeButton) {
        event.preventDefault();
        openNewTab(routeButton.getAttribute("data-account-route"));
        return;
      }

      var saveLaunchButton = target.closest("[data-save-launch]");
      if (saveLaunchButton) {
        openNewTab(saveLaunchButton.getAttribute("data-save-launch"));
      }
    });

    bindGhostClickGuard(pane);
    wireAccountWizard(tab, pane);
    bindSocialPaneListener(pane, function () {
      syncAccountPane(pane, tab, "Account updated.");
    });
    setAccountWizardStep(tab, pane, tab.accountWizardStep);
    syncAccountPane(pane, tab);
    return pane;
  }

  function submitAccountForm(pane, action, tab) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setAccountStatus(pane, "Account service unavailable.");
      return;
    }

    if (action === "logout") {
      socialApi.logout().then(function () {
        if (tab && pane) setAccountWizardStep(tab, pane, 1);
        syncAccountPane(pane, tab, "Logged out.");
      }).catch(function (error) {
        setAccountStatus(pane, cleanText(error && error.message ? error.message : error));
      });
      return;
    }

    var form = pane.querySelector('[data-role="account-auth-form"]');
    if (!form) return;
    var usernameInput = form.querySelector('[name="account-username"]');
    var passwordInput = form.querySelector('[name="account-password"]');
    var username = cleanText(usernameInput && usernameInput.value);
    var password = cleanText(passwordInput && passwordInput.value);

    setAccountStatus(pane, action === "signup" ? "Creating account..." : "Logging in...");

    var request = action === "signup"
      ? socialApi.signUp(username, password)
      : socialApi.login(username, password);

    request.then(function () {
      if (passwordInput) passwordInput.value = "";
      if (tab && pane) setAccountWizardStep(tab, pane, 2);
      syncAccountPane(pane, tab, action === "signup" ? "Account created." : "Logged in.");
    }).catch(function (error) {
      setAccountStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function renderAccountSummary(pane, session, bootstrap) {
    var summaryEl = pane.querySelector('[data-role="account-summary"]');
    if (!summaryEl) return;

    if (!session || !session.authenticated || !session.user) {
      summaryEl.innerHTML =
        '<div class="empty-state">' +
          "<strong>You are not logged in.</strong>" +
          "<span>Create an account to unlock chat rooms, DMs, and cloud saves.</span>" +
        "</div>";
      return;
    }

    var stats = bootstrap && bootstrap.stats ? bootstrap.stats : emptyCommunityBootstrap().stats;
    var primaryCommunityRoute = getPrimaryCommunityRoute(bootstrap);
    summaryEl.innerHTML =
      '<div class="account-summary__hero">' +
        '<div class="account-summary__content">' +
          '<div class="account-summary__identity">' +
            '<span class="account-summary__eyebrow">Signed in</span>' +
            '<strong>@' + escapeHtml(session.user.username) + "</strong>" +
            '<span>Joined ' + escapeHtml(formatTimestamp(session.user.createdAt)) + "</span>" +
            '<span>' + escapeHtml(String(stats.threadCount || 0)) + " conversations synced in this browser.</span>" +
          "</div>" +
          '<div class="account-summary__badges">' +
            '<span class="account-summary__badge">' + escapeHtml(String(stats.threadCount || 0)) + ' chats</span>' +
            '<span class="account-summary__badge">' + escapeHtml(String(stats.roomCount || 0)) + ' rooms</span>' +
            '<span class="account-summary__badge">' + escapeHtml(String(stats.saveCount || 0)) + ' saves</span>' +
          "</div>" +
        "</div>" +
        '<div class="account-summary__actions">' +
          '<button type="button" class="toolbar-button toolbar-button--accent" data-account-route="' + escapeHtml(primaryCommunityRoute) + '">Open community</button>' +
          '<button type="button" class="toolbar-button" data-account-route="antarctic://chats">Chats</button>' +
          '<button type="button" class="toolbar-button" data-account-action="logout">Log out</button>' +
        "</div>" +
      "</div>";
  }

  function renderAccountMetrics(pane, bootstrap) {
    var metricsEl = pane.querySelector('[data-role="account-metrics"]');
    if (!metricsEl) return;

    var stats = bootstrap && bootstrap.stats ? bootstrap.stats : null;
    if (!stats) {
      metricsEl.innerHTML = "";
      return;
    }

    metricsEl.innerHTML = [
      { label: "Joined chats", value: stats.threadCount || 0 },
      { label: "Direct messages", value: stats.directCount || 0 },
      { label: "Incoming DMs", value: stats.incomingDirectRequestCount || 0 },
      { label: "Public rooms", value: stats.roomCount || 0 },
      { label: "Cloud saves", value: stats.saveCount || 0 }
    ].map(function (metric) {
      return (
        '<article class="account-metric-card">' +
          '<span class="account-metric-card__label">' + escapeHtml(metric.label) + "</span>" +
          '<strong class="account-metric-card__value">' + escapeHtml(String(metric.value)) + "</strong>" +
        "</article>"
      );
    }).join("");
  }

  function renderAccountQuickActions(pane, session, bootstrap) {
    var quickActionsEl = pane.querySelector('[data-role="account-quick-actions"]');
    if (!quickActionsEl) return;

    if (!session || !session.authenticated) {
      quickActionsEl.innerHTML = "";
      return;
    }

    var stats = bootstrap && bootstrap.stats ? bootstrap.stats : emptyCommunityBootstrap().stats;
    var incomingCount = Number(stats.incomingDirectRequestCount || 0);
    var primaryCommunityRoute = getPrimaryCommunityRoute(bootstrap);
    quickActionsEl.innerHTML =
      '<button type="button" class="toolbar-button toolbar-button--accent" data-account-route="' + escapeHtml(primaryCommunityRoute) + '">' +
        (incomingCount > 0
          ? "Review " + escapeHtml(String(incomingCount)) + " incoming DMs"
          : "Jump into " + escapeHtml(String(stats.threadCount || 0)) + " chats") +
      "</button>" +
      '<button type="button" class="toolbar-button" data-account-route="antarctic://chats">Open chats</button>' +
      '<button type="button" class="toolbar-button" data-account-route="antarctic://games">Explore games</button>' +
      '<button type="button" class="toolbar-button" data-account-route="antarctic://home">Back home</button>';
  }

  function renderAccountSaves(pane, saves) {
    var savesEl = pane.querySelector('[data-role="account-saves"]');
    if (!savesEl) return;

    if (!Array.isArray(saves) || !saves.length) {
      savesEl.innerHTML =
        '<div class="empty-state">' +
          "<strong>No cloud saves yet.</strong>" +
          "<span>Launch a game, then use the Cloud Save button in the launcher bar.</span>" +
        "</div>";
      return;
    }

    savesEl.innerHTML = saves.map(function (save) {
      return (
        '<article class="account-save-card">' +
          '<div class="account-save-card__content">' +
            '<strong>' + escapeHtml(core.humanizeSlug(save.gameKey || "")) + "</strong>" +
            '<span>' + escapeHtml(save.summary || save.gameKey || "") + "</span>" +
            '<span>Updated ' + escapeHtml(formatTimestamp(save.updatedAt)) + "</span>" +
          "</div>" +
          '<button type="button" class="toolbar-button" data-save-launch="' + escapeHtml(core.buildGameUri(save.gameKey, core.humanizeSlug(save.gameKey || ""), "")) + '">' +
            "Open" +
          "</button>" +
        "</article>"
      );
    }).join("");
  }

  function syncAccountPane(pane, tab, message, forceRefresh) {
    if (!forceRefresh && schedulePaneSyncAfterInteraction(pane, function () {
      syncAccountPane(pane, tab, message, forceRefresh);
    })) {
      return;
    }

    var socialApi = getSocialApi();
    if (!socialApi) {
      setPaneAuthenticatedState(pane, false);
      setAccountStatus(pane, "Account service unavailable.");
      renderAccountSummary(pane, null, emptyCommunityBootstrap());
      renderAccountMetrics(pane, null);
      renderAccountQuickActions(pane, null, null);
      renderAccountSaves(pane, []);
      return;
    }

    socialApi.getBootstrap(Boolean(forceRefresh)).then(function (community) {
      var authenticated = Boolean(community && community.authenticated && community.user);
      var bootstrap = community && community.bootstrap ? community.bootstrap : emptyCommunityBootstrap();
      setPaneAuthenticatedState(pane, authenticated);
      renderAccountSummary(pane, authenticated ? community : null, bootstrap);
      renderAccountMetrics(pane, authenticated ? bootstrap : null);
      renderAccountQuickActions(pane, authenticated ? community : null, bootstrap);
      renderAccountSaves(pane, authenticated ? bootstrap.saves : []);

      if (!authenticated) {
        if (tab && tab.accountState) {
          tab.accountState.allowAutoOpen = true;
        }
        if (tab && pane) setAccountWizardStep(tab, pane, 1);
        setAccountStatus(pane, message || "Log in to sync your saves and community profile.");
        return;
      }

      if (tab && pane && tab.accountState && tab.accountState.allowAutoOpen) {
        setAccountWizardStep(tab, pane, 2);
        tab.accountState.allowAutoOpen = false;
      }
      setAccountStatus(pane, message || ("Logged in as @" + community.user.username + "."));
    }).catch(function (error) {
      setPaneAuthenticatedState(pane, false);
      renderAccountSummary(pane, null, emptyCommunityBootstrap());
      renderAccountMetrics(pane, null);
      renderAccountQuickActions(pane, null, null);
      renderAccountSaves(pane, []);
      setAccountStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function createChatPane(tab) {
    var pane = cloneTemplate("chat-pane-template");
    if (!pane) return null;
    applyChatPaneMode(tab, pane);

    var form = pane.querySelector('[data-role="chat-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitChatMessage(tab, pane);
      });
    }

    var roomForm = pane.querySelector('[data-role="chat-room-form"]');
    if (roomForm) {
      roomForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitRoomCreate(tab, pane);
      });
      roomForm.addEventListener("change", function (event) {
        var target = event.target;
        if (target && target.name === "room-visibility") {
          syncRoomInviteField(pane);
        }
      });
      syncRoomInviteField(pane);
    }

    var directForm = pane.querySelector('[data-role="chat-direct-form"]');
    if (directForm) {
      directForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitDirectCreate(tab, pane);
      });
    }

    var composer = pane.querySelector(".chat-room__input");
    if (composer) {
      composer.addEventListener("input", function () {
        syncAiInputHeight(composer);
        syncChatMessageCounter(pane);
      });
      composer.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitChatMessage(tab, pane);
        }
      });
      syncAiInputHeight(composer);
      syncChatMessageCounter(pane);
    }

    if (typeof tab.chatState.wizardStep !== "number" || tab.chatState.wizardStep < 2) {
      tab.chatState.wizardStep = 2;
    }
    bindGhostClickGuard(pane);
    wireChatWizard(tab, pane);
    bindSocialPaneListener(pane, function () {
      syncChatPane(pane, tab, "Conversations updated.");
    });
    setChatWizardStep(tab, pane, tab.chatState.wizardStep);

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;
      if (shouldSuppressGhostClick(pane)) {
        event.preventDefault();
        return;
      }

      var threadButton = target.closest("[data-chat-thread]");
      if (threadButton) {
        event.preventDefault();
        tab.chatState.activeThreadId = cleanText(threadButton.getAttribute("data-chat-thread"));
        setChatWizardStep(tab, pane, 3);
        syncChatPane(pane, tab, "Conversation loaded.");
        return;
      }

      var acceptButton = target.closest("[data-chat-request-accept]");
      if (acceptButton) {
        event.preventDefault();
        acceptIncomingDirectRequest(tab, pane, acceptButton.getAttribute("data-chat-request-accept"));
        return;
      }

      var denyButton = target.closest("[data-chat-request-deny]");
      if (denyButton) {
        event.preventDefault();
        denyIncomingDirectRequest(tab, pane, denyButton.getAttribute("data-chat-request-deny"));
        return;
      }

      var joinButton = target.closest("[data-chat-join]");
      if (joinButton) {
        joinChatRoom(tab, pane, joinButton.getAttribute("data-chat-join"));
        return;
      }

      var leaveButton = target.closest("[data-chat-leave]");
      if (leaveButton) {
        event.preventDefault();
        leaveChatRoom(tab, pane, leaveButton.getAttribute("data-chat-leave"));
      }
    });

    syncChatPane(pane, tab);
    tab.chatState.pollHandle = window.setInterval(function () {
      if (!pane.isConnected) return;
      if (tab.id !== state.activeTabId) return;
      syncChatPane(pane, tab);
    }, 5000);
    return pane;
  }

  function setChatStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="chat-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Chat ready.";
    }
  }

  function renderChatSessionCard(pane, community) {
    var sessionEl = pane.querySelector('[data-role="chat-session"]');
    if (!sessionEl) return;

    if (!community || !community.authenticated || !community.user) {
      sessionEl.innerHTML =
        '<div class="empty-state empty-state--compact">' +
          "<strong>Community locked.</strong>" +
          "<span>Log in from Account to unlock rooms and DMs.</span>" +
        "</div>";
      return;
    }

    var stats = community.bootstrap && community.bootstrap.stats ? community.bootstrap.stats : emptyCommunityBootstrap().stats;
    var incomingCount = Number(stats.incomingDirectRequestCount || 0);
    sessionEl.innerHTML =
      '<div class="chat-session-card">' +
        '<div class="chat-session-card__identity">' +
          '<strong>@' + escapeHtml(community.user.username) + "</strong>" +
          '<span>' +
            escapeHtml(String(stats.threadCount || 0)) + " joined chats • " +
            escapeHtml(String(stats.directCount || 0)) + " DMs • " +
            escapeHtml(String(incomingCount)) + " incoming" +
          "</span>" +
        "</div>" +
        '<button type="button" class="toolbar-button" data-route="antarctic://account">Account</button>' +
      "</div>";
  }

  function renderChatThreads(pane, tab, payload) {
    var listEl = pane.querySelector('[data-role="chat-thread-list"]');
    var roomCatalogEl = pane.querySelector('[data-role="chat-room-catalog"]');
    var incomingRequestsEl = pane.querySelector('[data-role="chat-incoming-requests"]');
    if (!listEl || !roomCatalogEl || !incomingRequestsEl) return;

    var modeConfig = getChatModeConfig(tab);
    var threads = filterThreadsForChatMode(payload && payload.threads, tab);
    var rooms = Array.isArray(payload && payload.rooms) ? payload.rooms : [];
    var incomingDirectRequests = Array.isArray(payload && payload.incomingDirectRequests)
      ? payload.incomingDirectRequests
      : [];
    var visibleRooms = modeConfig.showRoomCatalog
      ? rooms.filter(function (room) {
          return shouldRenderChatRoomCard(room);
        })
      : [];

    incomingRequestsEl.innerHTML = modeConfig.showIncomingRequests
      ? (
          '<div class="chat-room-catalog__title">Incoming DMs</div>' +
          (incomingDirectRequests.length
            ? incomingDirectRequests.map(function (request) {
                var requester = request && request.requester ? request.requester : null;
                var username = requester && requester.username ? "@" + requester.username : "Unknown user";
                return (
                  '<article class="chat-request-card">' +
                    '<div class="chat-request-card__content">' +
                      '<strong>' + escapeHtml(username) + "</strong>" +
                      '<span>Wants to start a direct message with you.</span>' +
                    "</div>" +
                    '<div class="chat-request-card__actions">' +
                      '<button type="button" class="toolbar-button toolbar-button--accent" data-chat-request-accept="' + escapeHtml(request.id) + '">Accept</button>' +
                      '<button type="button" class="toolbar-button" data-chat-request-deny="' + escapeHtml(request.id) + '">Deny</button>' +
                    "</div>" +
                  "</article>"
                );
              }).join("")
            : '<div class="empty-state empty-state--stacked"><strong>No incoming DMs.</strong><span>New requests will show up here.</span></div>')
        )
      : "";

    listEl.innerHTML = threads.length
      ? threads.map(function (thread) {
          var label = thread.type === "direct" && thread.peer ? "@" + thread.peer.username : thread.name;
          var preview = thread.lastMessage ? thread.lastMessage.username + ": " + thread.lastMessage.content : "No messages yet.";
          var meta = thread.type === "direct" ? "DM" : "Room";
          return (
            '<button type="button" class="chat-thread-card' + (String(thread.id) === String(tab.chatState.activeThreadId) ? ' chat-thread-card--active' : '') + '" data-chat-thread="' + escapeHtml(thread.id) + '">' +
              '<span class="chat-thread-card__content">' +
                '<strong>' + escapeHtml(label) + "</strong>" +
                '<span>' + escapeHtml(preview) + "</span>" +
              "</span>" +
              '<span class="chat-thread-card__badge">' + escapeHtml(meta) + "</span>" +
            "</button>"
          );
        }).join("")
      : '<div class="empty-state empty-state--stacked"><strong>' + escapeHtml(modeConfig.emptyThreadsTitle) + '</strong><span>' + escapeHtml(modeConfig.emptyThreadsBody) + "</span></div>";

    roomCatalogEl.innerHTML = modeConfig.showRoomCatalog
      ? (
          '<div class="chat-room-catalog__title">Rooms</div>' +
          (visibleRooms.length
            ? visibleRooms.map(function (room) {
                var visibility = cleanText(room.visibility || "public").toLowerCase() === "private" ? "Private" : "Public";
                var detail = visibility + " • " + escapeHtml(String(room.memberCount || 0)) + " members";
                return (
                  '<div class="chat-room-card">' +
                    '<div class="chat-room-card__content">' +
                      '<strong>' + escapeHtml(room.name) + "</strong>" +
                      '<span>' + detail + "</span>" +
                    "</div>" +
                    renderChatRoomAction(room) +
                  "</div>"
                );
              }).join("")
            : '<div class="empty-state empty-state--stacked"><strong>No rooms yet.</strong><span>Create the first one above or wait for an invite.</span></div>')
        )
      : "";
  }

  function isChatRoomJoinable(room) {
    if (!room || typeof room !== "object") return false;
    if (room.joined) return true;
    if (Object.prototype.hasOwnProperty.call(room, "joinable")) {
      return Boolean(room.joinable);
    }
    return cleanText(room.visibility || "public").toLowerCase() !== "private" || Boolean(room.invited);
  }

  function shouldRenderChatRoomCard(room) {
    if (!room || typeof room !== "object") return false;
    if (room.joined) return true;
    return isChatRoomJoinable(room);
  }

  function renderChatRoomAction(room) {
    if (room && room.joined) {
      return '<span class="chat-room-card__joined">Joined</span>';
    }
    if (!isChatRoomJoinable(room)) {
      return '<span class="chat-room-card__joined">Invite only</span>';
    }
    return (
      '<button type="button" class="toolbar-button" data-chat-join="' + escapeHtml(room && room.id) + '">' +
        (room && room.invited ? "Accept invite" : "Join") +
      "</button>"
    );
  }

  function renderChatMessages(pane, thread, messages, currentUserId) {
    var headerEl = pane.querySelector('[data-role="chat-thread-header"]');
    var messagesEl = pane.querySelector('[data-role="chat-messages"]');
    if (!headerEl || !messagesEl) return;
    var modeConfig = getChatModeConfig({ view: pane.dataset.chatMode });

    if (!thread) {
      headerEl.innerHTML =
        '<div class="empty-state empty-state--compact">' +
          "<strong>Select a conversation.</strong>" +
          "<span>" + escapeHtml(modeConfig.emptySelectionBody) + "</span>" +
        "</div>";
      messagesEl.innerHTML = "";
      return;
    }

    headerEl.innerHTML =
      '<div class="chat-room__title-wrap">' +
        '<strong class="chat-room__title">' + escapeHtml(thread.type === "direct" && thread.peer ? "@" + thread.peer.username : thread.name) + "</strong>" +
        '<span class="chat-room__meta">' +
          escapeHtml(
            thread.type === "direct"
              ? "Direct message • 2000 character max"
              : ((cleanText(thread.visibility || "public").toLowerCase() === "private" ? "Private room" : "Public room") + " • 2000 character max")
          ) +
        "</span>" +
      "</div>" +
      (thread.type === "room"
        ? '<div class="chat-room__header-actions">' +
            '<button type="button" class="toolbar-button" data-chat-leave="' + escapeHtml(thread.id) + '">Leave room</button>' +
          "</div>"
        : "");

    if (!Array.isArray(messages) || !messages.length) {
      messagesEl.innerHTML =
        '<div class="empty-state">' +
          "<strong>No messages yet.</strong>" +
          "<span>Say hi to get things started.</span>" +
        "</div>";
      return;
    }

    messagesEl.innerHTML = messages.map(function (message) {
      var isOwn = String(message.userId) === String(currentUserId);
      return (
        '<article class="chat-message' + (isOwn ? " chat-message--own" : "") + '">' +
          '<div class="chat-message__meta">' + escapeHtml(isOwn ? "You" : ("@" + message.username)) + " • " + escapeHtml(formatTimestamp(message.createdAt)) + "</div>" +
          '<div class="chat-message__body">' + escapeHtml(message.content) + "</div>" +
        "</article>"
      );
    }).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function syncChatPane(pane, tab, message, forceRefresh) {
    if (!forceRefresh && schedulePaneSyncAfterInteraction(pane, function () {
      syncChatPane(pane, tab, message, forceRefresh);
    })) {
      return;
    }

    var socialApi = getSocialApi();
    var modeConfig = getChatModeConfig(tab);
    applyChatPaneMode(tab, pane);
    if (!socialApi) {
      setPaneAuthenticatedState(pane, false);
      renderChatSessionCard(pane, null);
      setChatStatus(pane, "Chat service unavailable.");
      renderChatThreads(pane, tab, emptyCommunityBootstrap());
      renderChatMessages(pane, null, [], "");
      return;
    }

    socialApi.getBootstrap(Boolean(forceRefresh)).then(function (community) {
      var authenticated = Boolean(community && community.authenticated && community.user);
      var bootstrap = community && community.bootstrap ? community.bootstrap : emptyCommunityBootstrap();
      var threads = filterThreadsForChatMode(bootstrap.threads, tab);
      setPaneAuthenticatedState(pane, authenticated);
      renderChatSessionCard(pane, authenticated ? community : null);

      if (!authenticated) {
        tab.chatState.activeThreadId = "";
        setChatWizardStep(tab, pane, 2);
        renderChatThreads(pane, tab, emptyCommunityBootstrap());
        renderChatMessages(pane, null, [], "");
        setChatStatus(pane, modeConfig.unauthenticatedStatus);
        return null;
      }

      if ((tab.chatState.wizardStep || 2) < 2) {
        setChatWizardStep(tab, pane, 2);
      }

      if (tab.chatState.activeThreadId) {
        var stillExists = threads.some(function (thread) {
          return String(thread.id) === String(tab.chatState.activeThreadId);
        });
        if (!stillExists) {
          tab.chatState.activeThreadId = "";
        }
      }

      renderChatThreads(pane, tab, bootstrap);
      if (!tab.chatState.activeThreadId) {
        if ((tab.chatState.wizardStep || 2) > 2) {
          setChatWizardStep(tab, pane, 2);
        }
        renderChatMessages(pane, null, [], community.user && community.user.id);
        setChatStatus(
          pane,
          message || modeConfig.emptyStatus
        );
        return null;
      }

      setChatWizardStep(tab, pane, 3);
      return socialApi.listMessages(tab.chatState.activeThreadId).then(function (messagesPayload) {
        renderChatMessages(
          pane,
          messagesPayload && messagesPayload.thread,
          messagesPayload && messagesPayload.messages,
          community.user && community.user.id
        );
        setChatStatus(pane, message || (modeConfig.chattingStatus + community.user.username + "."));
      });
    }).catch(function (error) {
      setPaneAuthenticatedState(pane, false);
      renderChatSessionCard(pane, null);
      renderChatThreads(pane, tab, emptyCommunityBootstrap());
      renderChatMessages(pane, null, [], "");
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function submitRoomCreate(tab, pane) {
    var socialApi = getSocialApi();
    var form = pane.querySelector('[data-role="chat-room-form"]');
    if (!socialApi || !form) return;
    var input = form.querySelector('[name="room-name"]');
    var visibilityField = form.querySelector('[name="room-visibility"]:checked') || form.querySelector('[name="room-visibility"]');
    var invitesField = form.querySelector('[name="room-invites"]');
    var value = cleanText(input && input.value);
    var visibility = cleanText(visibilityField && visibilityField.value).toLowerCase() === "private" ? "private" : "public";
    var invitedUsers = visibility === "private"
      ? cleanText(invitesField && invitesField.value).split(/[,\n]/g).map(function (entry) {
          return cleanText(entry);
        }).filter(Boolean)
      : [];
    setChatStatus(pane, "Creating room...");
    socialApi.createRoom(value, {
      visibility: visibility,
      invitedUsers: invitedUsers
    }).then(function (payload) {
      if (input) input.value = "";
      if (invitesField) invitesField.value = "";
      var publicField = form.querySelector('[name="room-visibility"][value="public"]');
      if (publicField) publicField.checked = true;
      syncRoomInviteField(pane);
      if (payload && payload.thread && payload.thread.id) {
        tab.chatState.activeThreadId = String(payload.thread.id);
        setChatWizardStep(tab, pane, 3);
      }
      syncChatPane(pane, tab, visibility === "private" ? "Private room created." : "Room created.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function submitDirectCreate(tab, pane) {
    var socialApi = getSocialApi();
    var form = pane.querySelector('[data-role="chat-direct-form"]');
    if (!socialApi || !form) return;
    var input = form.querySelector('[name="direct-username"]');
    var value = cleanText(input && input.value);
    setChatStatus(pane, "Opening DM...");
    socialApi.createDirect(value).then(function (payload) {
      if (input) input.value = "";
      if (payload && payload.thread) {
        tab.chatState.activeThreadId = String(payload.thread.id);
        setChatWizardStep(tab, pane, 3);
        syncChatPane(pane, tab, payload.request ? "DM request accepted." : "Direct message ready.");
        return;
      }
      setChatWizardStep(tab, pane, 2);
      syncChatPane(pane, tab, "DM request sent.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function acceptIncomingDirectRequest(tab, pane, requestId) {
    var socialApi = getSocialApi();
    if (!socialApi) return;
    setChatStatus(pane, "Accepting DM...");
    socialApi.acceptDirectRequest(requestId).then(function (payload) {
      if (payload && payload.thread && payload.thread.id) {
        tab.chatState.activeThreadId = String(payload.thread.id);
        setChatWizardStep(tab, pane, 3);
      }
      syncChatPane(pane, tab, "DM accepted.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function denyIncomingDirectRequest(tab, pane, requestId) {
    var socialApi = getSocialApi();
    if (!socialApi) return;
    setChatStatus(pane, "Denying DM...");
    socialApi.denyDirectRequest(requestId).then(function () {
      setChatWizardStep(tab, pane, 2);
      syncChatPane(pane, tab, "DM denied.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function joinChatRoom(tab, pane, threadId) {
    var socialApi = getSocialApi();
    if (!socialApi) return;
    setChatStatus(pane, "Joining room...");
    socialApi.joinRoom(threadId).then(function () {
      tab.chatState.activeThreadId = cleanText(threadId);
      setChatWizardStep(tab, pane, 3);
      syncChatPane(pane, tab, "Joined room.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function leaveChatRoom(tab, pane, threadId) {
    var socialApi = getSocialApi();
    if (!socialApi) return;
    setChatStatus(pane, "Leaving room...");
    socialApi.leaveRoom(threadId).then(function () {
      tab.chatState.activeThreadId = "";
      setChatWizardStep(tab, pane, 2);
      syncChatPane(pane, tab, "Left room.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function submitChatMessage(tab, pane) {
    var socialApi = getSocialApi();
    if (!socialApi || !tab.chatState.activeThreadId) return;
    var input = pane.querySelector(".chat-room__input");
    if (!input) return;

    var value = cleanText(input.value);
    if (!value) return;

    socialApi.sendMessage(tab.chatState.activeThreadId, value).then(function (payload) {
      input.value = "";
      syncAiInputHeight(input);
      syncChatMessageCounter(pane);
      renderChatMessages(
        pane,
        payload && payload.thread,
        payload && payload.messages,
        payload && payload.message ? payload.message.userId : ""
      );
      syncChatPane(pane, tab, "Message sent.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function getSiteSettingsApi() {
    return window.AntarcticGamesSiteSettings || window.PalladiumSiteSettings || null;
  }

  function readSiteSettings() {
    var api = getSiteSettingsApi();
    if (!api || typeof api.getSettings !== "function") {
      return {
        title: "",
        favicon: "",
        theme: "default"
      };
    }

    return api.getSettings();
  }

  function getSettingsThemes() {
    var api = getSiteSettingsApi();
    if (api && Array.isArray(api.themes) && api.themes.length) {
      return api.themes.slice();
    }
    return SETTINGS_THEME_ORDER.slice();
  }

  function fallbackHumanizeThemeName(themeName) {
    return cleanText(themeName)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (character) {
        return character.toUpperCase();
      });
  }

  function getThemeDetails(themeName) {
    var key = cleanText(themeName).toLowerCase();
    var details = THEME_DETAILS[key] || {};
    return {
      label: cleanText(details.label) || fallbackHumanizeThemeName(key),
      preview: cleanText(details.preview) || "linear-gradient(135deg, #08101b 0%, #123a58 55%, #6bb6ff 100%)",
      swatches: Array.isArray(details.swatches) && details.swatches.length ? details.swatches.slice(0, 3) : ["#3b8cff", "#6bb6ff", "#a8d4ff"]
    };
  }

  function humanizeThemeName(themeName) {
    return getThemeDetails(themeName).label;
  }

  function buildShellLaunchUrl(uri) {
    try {
      var nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("uri", cleanText(uri) || core.buildInternalUri("home"));
      return nextUrl.toString();
    } catch (error) {
      return window.location.href;
    }
  }

  function resolveSettingsFaviconPreviewUrl(raw) {
    var fav = cleanText(raw);
    if (!fav) fav = "images/favicon.png?v=4";
    return resolveLocalAppUrl(fav);
  }

  function setSettingsStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="settings-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Saved with first-party cookies in this browser.";
    }
  }

  function renderThemeGrid(pane, settings) {
    var container = pane.querySelector('[data-role="theme-grid"]');
    if (!container) return;

    var activeTheme = cleanText(settings && settings.theme) || "default";
    var themes = getSettingsThemes();

    container.innerHTML = themes.map(function (themeName) {
      var details = getThemeDetails(themeName);
      var swatches = details.swatches.map(function (color) {
        return '<span class="theme-chip__swatch" style="--theme-swatch:' + escapeHtml(color) + '"></span>';
      }).join("");
      return (
        '<button type="button" class="theme-chip' + (themeName === activeTheme ? ' theme-chip--active' : '') + '" data-theme-option="' + escapeHtml(themeName) + '">' +
          '<span class="theme-chip__preview" style="--theme-preview:' + escapeHtml(details.preview) + '">' +
            '<span class="theme-chip__swatches">' + swatches + "</span>" +
          "</span>" +
          '<span class="theme-chip__content">' +
            '<span class="theme-chip__name">' + escapeHtml(details.label) + "</span>" +
          "</span>" +
        "</button>"
      );
    }).join("");
  }

  function syncAiInputHeight(textarea) {
    if (!textarea) return;

    textarea.style.height = "0px";

    var computed = window.getComputedStyle(textarea);
    var minHeight = parseFloat(computed.minHeight) || 0;
    var maxHeight = parseFloat(computed.getPropertyValue("--ai-input-max-height")) || 176;
    var nextHeight = Math.max(textarea.scrollHeight, minHeight);

    if (maxHeight) {
      nextHeight = Math.min(nextHeight, maxHeight);
    }

    textarea.style.height = nextHeight + "px";
    textarea.style.overflowY = textarea.scrollHeight > nextHeight + 2 ? "auto" : "hidden";
  }

  function syncRoomInviteField(pane) {
    if (!pane) return;
    var roomForm = pane.querySelector('[data-role="chat-room-form"]');
    if (!roomForm) return;
    var visibilityField = roomForm.querySelector('[name="room-visibility"]:checked') || roomForm.querySelector('[name="room-visibility"]');
    var inviteField = roomForm.querySelector('[data-role="room-invites-field"]');
    var inviteInput = roomForm.querySelector('[name="room-invites"]');
    if (!visibilityField || !inviteField) return;

    var isPrivate = cleanText(visibilityField.value).toLowerCase() === "private";
    inviteField.hidden = !isPrivate;
    if (!isPrivate && inviteInput) {
      inviteInput.value = "";
    }
  }

  function syncChatMessageCounter(pane) {
    if (!pane) return;
    var input = pane.querySelector(".chat-room__input");
    var counter = pane.querySelector('[data-role="chat-message-counter"]');
    if (!input || !counter) return;
    counter.textContent = String(input.value.length) + " / " + String(CHAT_MESSAGE_MAX_LENGTH);
  }

  function renderCloakPresets(pane) {
    var container = pane.querySelector('[data-role="cloak-presets"]');
    if (!container) return;

    container.innerHTML = CLOAK_PRESETS.map(function (preset) {
      return (
        '<button type="button" class="preset-chip" data-cloak-preset="' + escapeHtml(preset.id) + '">' +
          '<span class="preset-chip__title">' + escapeHtml(preset.title) + "</span>" +
          '<span class="preset-chip__meta">' + escapeHtml(preset.description) + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function syncSettingsPane(pane, message) {
    if (!pane) return;

    var settings = readSiteSettings();
    var titleInput = pane.querySelector('[name="cloak-title"]');
    var faviconInput = pane.querySelector('[name="cloak-favicon"]');
    var previewTitle = pane.querySelector('[data-role="settings-preview-title"]');
    var previewFaviconUrl = pane.querySelector('[data-role="settings-preview-favicon-url"]');
    var previewFaviconImg = pane.querySelector('[data-role="settings-preview-favicon-img"]');
    var previewTheme = pane.querySelector('[data-role="settings-preview-theme"]');

    if (titleInput) titleInput.value = cleanText(settings.title);
    if (faviconInput) faviconInput.value = cleanText(settings.favicon);
    if (previewTitle) previewTitle.textContent = cleanText(settings.title) || "Antarctic Games";

    var faviconStored = cleanText(settings.favicon) || "images/favicon.png?v=4";
    if (previewFaviconUrl) previewFaviconUrl.textContent = faviconStored;

    if (previewFaviconImg) {
      previewFaviconImg.alt = "Favicon preview";
      var resolvedFavicon = resolveSettingsFaviconPreviewUrl(settings.favicon);
      previewFaviconImg.onerror = function () {
        previewFaviconImg.style.visibility = "hidden";
      };
      previewFaviconImg.onload = function () {
        previewFaviconImg.style.visibility = "visible";
      };
      previewFaviconImg.src = resolvedFavicon;
    }

    if (previewTheme) previewTheme.textContent = humanizeThemeName(settings.theme || "default");

    renderThemeGrid(pane, settings);
    renderCloakPresets(pane);
    setSettingsStatus(pane, message);
  }

  function applyCloakForm(pane) {
    var api = getSiteSettingsApi();
    if (!api) {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    var titleInput = pane.querySelector('[name="cloak-title"]');
    var faviconInput = pane.querySelector('[name="cloak-favicon"]');

    api.setTitle(titleInput ? titleInput.value : "");
    api.setFavicon(faviconInput ? faviconInput.value : "");
    renderShell();
    syncSettingsPane(pane, "Cloak updated.");
  }

  function applyCloakPreset(pane, presetId) {
    var api = getSiteSettingsApi();
    if (!api) {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    for (var index = 0; index < CLOAK_PRESETS.length; index += 1) {
      var preset = CLOAK_PRESETS[index];
      if (preset.id !== presetId) continue;

      api.setTitle(preset.title);
      api.setFavicon(preset.favicon);
      renderShell();
      syncSettingsPane(pane, "Applied " + preset.description + " cloak.");
      return;
    }
  }

  function applyThemeSetting(pane, themeName) {
    var api = getSiteSettingsApi();
    if (!api || typeof api.setTheme !== "function") {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    api.setTheme(themeName);
    renderShell();
    syncSettingsPane(pane, "Theme updated to " + humanizeThemeName(themeName) + ".");
  }

  function resetCloakSettings(pane) {
    var api = getSiteSettingsApi();
    if (!api) {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    api.setTitle("");
    api.setFavicon("");
    renderShell();
    syncSettingsPane(pane, "Tab cloak reset.");
  }

  function resetAllSettings(pane) {
    var api = getSiteSettingsApi();
    if (!api || typeof api.reset !== "function") {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    api.reset();
    renderShell();
    syncSettingsPane(pane, "Theme and cloaking reset.");
  }

  function openSettingsAboutBlank(pane, tab) {
    var api = getSiteSettingsApi();
    if (!api || typeof api.openInAboutBlank !== "function") {
      syncSettingsPane(pane, "About:blank launcher is unavailable.");
      return;
    }

    var result = api.openInAboutBlank(buildShellLaunchUrl(tab && tab.uri));
    if (result && result.ok) {
      syncSettingsPane(pane, "Opened Antarctic Games in about:blank.");
      return;
    }

    syncSettingsPane(pane, result && result.error ? result.error : "Popup blocked by browser.");
  }

  function createSettingsPane(tab) {
    var pane = cloneTemplate("settings-pane-template");
    if (!pane) return null;

    var form = pane.querySelector('[data-role="cloak-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyCloakForm(pane);
      });
    }

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var themeButton = target.closest("[data-theme-option]");
      if (themeButton) {
        applyThemeSetting(pane, themeButton.getAttribute("data-theme-option"));
        return;
      }

      var presetButton = target.closest("[data-cloak-preset]");
      if (presetButton) {
        applyCloakPreset(pane, presetButton.getAttribute("data-cloak-preset"));
        return;
      }

      var actionButton = target.closest("[data-settings-action]");
      if (!actionButton) return;

      var action = actionButton.getAttribute("data-settings-action");
      if (action === "reset-cloak") {
        resetCloakSettings(pane);
        return;
      }
      if (action === "reset-all") {
        resetAllSettings(pane);
        return;
      }
      if (action === "aboutblank-shell") {
        openSettingsAboutBlank(pane, tab);
      }
    });

    syncSettingsPane(pane);
    return pane;
  }

  function createGameLauncherPane(tab) {
    var pane = document.createElement("section");
    pane.className = "shell-pane shell-pane--gamelauncher";
    pane.addEventListener("click", handlePaneAction);

    var title = cleanText(tab.title) || "Game Launcher";
    var author = cleanText(tab.author);
    var gamePath = cleanText(tab.path);

    var fullscreenDisabled = gamePath ? "" : " disabled";
    var cloudDisabled = gamePath ? "" : " disabled";

var barHintHtml =
      !gamePath && !author
        ? '<span class="game-launcher__panel-hint">Pick a game from the library.</span>'
        : "";

    pane.innerHTML =
      '<div class="game-launcher">' +
        '<div class="game-launcher__viewport" data-role="game-launcher-viewport"></div>' +
        '<div class="game-launcher__bar" data-role="game-bar">' +
          '<div class="game-launcher__bar-content">' +
            '<button type="button" class="game-launcher__action toolbar-button" data-game-load="1"' + cloudDisabled + " title=\"Load cloud\">" +
            '<svg class="game-launcher__bar-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path d="M5 20h2v-7H5v7zm4 0h2v-11H9v11zm4 0h2V5h-2v15zm4 0h2V8h-2v12zm4 0h2V4h-2v16z"/>' +
            "</svg>" +
            "</button>" +
            '<button type="button" class="game-launcher__action toolbar-button" data-game-save="1"' + cloudDisabled + " title=\"Save cloud\">" +
            '<svg class="game-launcher__bar-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/>' +
            "</svg>" +
            "</button>" +
            '<button type="button" class="game-launcher__action game-launcher__back toolbar-button" data-route="antarctic://games" title="Back to games">' +
            '<svg class="game-launcher__bar-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>' +
            "</svg>" +
            "</button>" +
            '<button type="button" class="game-launcher__action game-launcher__fullscreen-btn toolbar-button"' +
            ' data-game-fullscreen="1" aria-label="Enter fullscreen"' +
            fullscreenDisabled + " title=\"Fullscreen\">" +
            '<svg class="ui-icon ui-icon--filled game-launcher__fullscreen-icon game-launcher__bar-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>' +
            "</svg>" +
            "</button>" +
          "</div>" +
        "</div>" +
      "</div>";

    var viewport = pane.querySelector('[data-role="game-launcher-viewport"]');

    if (!viewport) return pane;

    if (!gamePath) {
      viewport.innerHTML =
        '<div class="empty-state empty-state--launcher">' +
          "<strong>No game selected yet.</strong>" +
          "<span>Open a title from the game library to launch it here.</span>" +
        "</div>";
      return pane;
    }

    var frame = document.createElement("iframe");
    frame.className = "shell-pane__frame game-launcher__frame";
    frame.src = resolveLocalAppUrl(gamePath);
    frame.setAttribute("allow", "clipboard-read; clipboard-write; fullscreen");
    frame.setAttribute("referrerpolicy", "no-referrer");
    viewport.appendChild(frame);
    attachAntarcticFontBridge(frame);

    return pane;
  }

  function navigateToolbarBack(active) {
    if (
      active &&
      isChatViewName(active.view) &&
      active.chatState &&
      Number(active.chatState.wizardStep || 2) > 2 &&
      cleanText(active.chatState.activeThreadId)
    ) {
      active.chatState.activeThreadId = "";
      if (active.paneEl) {
        setChatWizardStep(active, active.paneEl, 2);
        syncChatPane(active.paneEl, active, "Back to chats.");
      }
      return true;
    }
    return false;
  }

  function setGameCloudStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="game-cloud-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Cloud save ready.";
    }
  }

  function shouldSkipCloudKey(key) {
    var normalized = cleanText(key).toLowerCase();
    return (
      normalized.indexOf("antarctic") === 0 ||
      normalized.indexOf("palladium") === 0 ||
      normalized.indexOf("bare-mux") === 0 ||
      normalized.indexOf("baremux") === 0 ||
      normalized.indexOf("scramjet") === 0
    );
  }

  function captureStorageArea(storageArea) {
    var snapshot = {};
    if (!storageArea) return snapshot;

    for (var index = 0; index < storageArea.length; index += 1) {
      var key = storageArea.key(index);
      if (shouldSkipCloudKey(key)) continue;
      snapshot[key] = storageArea.getItem(key);
    }

    return snapshot;
  }

  function clearStorageArea(storageArea) {
    if (!storageArea) return;
    var keys = [];
    for (var index = 0; index < storageArea.length; index += 1) {
      var key = storageArea.key(index);
      if (shouldSkipCloudKey(key)) continue;
      keys.push(key);
    }
    keys.forEach(function (key) {
      storageArea.removeItem(key);
    });
  }

  function restoreStorageArea(storageArea, entries) {
    clearStorageArea(storageArea);
    if (!storageArea || !entries || typeof entries !== "object") return;
    Object.keys(entries).forEach(function (key) {
      if (shouldSkipCloudKey(key)) return;
      storageArea.setItem(key, String(entries[key]));
    });
  }

  function captureFrameStorageSnapshot(frame) {
    if (!frame || !frame.contentWindow) {
      throw new Error("Game frame is not ready yet.");
    }

    return {
      localStorage: captureStorageArea(frame.contentWindow.localStorage),
      sessionStorage: captureStorageArea(frame.contentWindow.sessionStorage)
    };
  }

  function applyFrameStorageSnapshot(frame, snapshot) {
    if (!frame || !frame.contentWindow) {
      throw new Error("Game frame is not ready yet.");
    }

    restoreStorageArea(frame.contentWindow.localStorage, snapshot && snapshot.localStorage);
    restoreStorageArea(frame.contentWindow.sessionStorage, snapshot && snapshot.sessionStorage);
  }

  function countSnapshotKeys(snapshot) {
    var localKeys = snapshot && snapshot.localStorage ? Object.keys(snapshot.localStorage).length : 0;
    var sessionKeys = snapshot && snapshot.sessionStorage ? Object.keys(snapshot.sessionStorage).length : 0;
    return localKeys + sessionKeys;
  }

  function saveGameCloudState(tab, pane) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setGameCloudStatus(pane, "Cloud save service unavailable.");
      return;
    }

    var frame = pane.querySelector("iframe.game-launcher__frame");
    if (!frame) {
      setGameCloudStatus(pane, "Game frame is not ready yet.");
      return;
    }

    setGameCloudStatus(pane, "Saving to cloud...");

    socialApi.getSession(true).then(function (session) {
      if (!session || !session.authenticated) {
        throw new Error("Log in from Account to use cloud saves.");
      }
      var snapshot = captureFrameStorageSnapshot(frame);
      return socialApi.putSave(tab.path, snapshot, tab.title + " (" + countSnapshotKeys(snapshot) + " keys)");
    }).then(function (payload) {
      setGameCloudStatus(pane, "Saved " + tab.title + " to cloud.");
      return payload;
    }).catch(function (error) {
      setGameCloudStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function loadGameCloudState(tab, pane) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setGameCloudStatus(pane, "Cloud save service unavailable.");
      return;
    }

    var frame = pane.querySelector("iframe.game-launcher__frame");
    if (!frame) {
      setGameCloudStatus(pane, "Game frame is not ready yet.");
      return;
    }

    setGameCloudStatus(pane, "Loading cloud save...");

    socialApi.getSession(true).then(function (session) {
      if (!session || !session.authenticated) {
        throw new Error("Log in from Account to use cloud saves.");
      }
      return socialApi.getSave(tab.path);
    }).then(function (payload) {
      if (!payload || !payload.save) {
        throw new Error("No cloud save found for this game.");
      }
      applyFrameStorageSnapshot(frame, payload.save.data);
      frame.src = resolveLocalAppUrl(tab.path);
      setGameCloudStatus(pane, "Cloud save loaded.");
    }).catch(function (error) {
      setGameCloudStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function createWebPane(tab) {
    var pane = document.createElement("section");
    pane.className = "shell-pane shell-pane--frame";
    pane.innerHTML =
      '<div class="shell-pane__frame-wrap">' +
        '<iframe class="shell-pane__frame" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen" sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>' +
        '<div class="empty-state empty-state--stacked shell-pane__web-status" data-role="web-status" hidden>' +
          '<strong data-role="web-status-title">Preparing the fallback web proxy.</strong>' +
          '<span data-role="web-disabled-copy"></span>' +
        "</div>" +
      "</div>";
    renderDisabledWebPane(tab, pane, PROXY_IDLE_MESSAGE, "Preparing the fallback web proxy.");
    return pane;
  }

  function renderDisabledWebPane(tab, pane, message, title) {
    var copyEl = pane && pane.querySelector('[data-role="web-disabled-copy"]');
    var statusEl = pane && pane.querySelector('[data-role="web-status"]');
    var titleEl = pane && pane.querySelector('[data-role="web-status-title"]');
    var frame = pane && pane.querySelector("iframe.shell-pane__frame");
    if (statusEl) {
      statusEl.hidden = false;
    }
    if (frame) {
      frame.hidden = true;
    }
    if (titleEl) {
      titleEl.textContent = cleanText(title) || (cleanText(message) ? "Web browsing is unavailable right now." : "Preparing the fallback web proxy.");
    }
    if (!copyEl) return;
    var targetUrl = cleanText(tab && tab.targetUrl);
    var detail = cleanText(message);
    copyEl.textContent = detail
      ? detail
      : targetUrl
      ? 'Antarctic is preparing "' + targetUrl + '" inside the built-in proxy.'
      : PROXY_IDLE_MESSAGE;
  }

  function renderEnabledWebPane(pane) {
    var statusEl = pane && pane.querySelector('[data-role="web-status"]');
    var frame = pane && pane.querySelector("iframe.shell-pane__frame");
    if (statusEl) {
      statusEl.hidden = true;
    }
    if (frame) {
      frame.hidden = false;
    }
  }

  function loadProxyConfig() {
    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.getPublicConfig !== "function") {
      return Promise.reject(new Error("Backend helper unavailable."));
    }

    return backendApi.getPublicConfig().then(function (config) {
      state.config = config || state.config;
      return config || {};
    });
  }

  function logProxyBootstrapEvent(type, detail) {
    if (!window.console || typeof window.console.info !== "function") {
      return;
    }

    var payload = {
      event: cleanText(type) || "proxy_bootstrap",
      timestamp: new Date().toISOString()
    };
    if (detail && typeof detail === "object") {
      Object.keys(detail).forEach(function (key) {
        payload[key] = detail[key];
      });
    }
    window.console.info("[antarctic-proxy]", payload);
  }

  function normalizeBase(value) {
    var raw = cleanText(value);
    if (!raw) return "";
    if (!/^https?:\/\//i.test(raw)) {
      raw = "http://" + raw;
    }
    raw = raw.replace(/\/+$/, "");
    try {
      return new URL(raw).origin;
    } catch (error) {
      return "";
    }
  }

  function normalizeWispPath(value) {
    var raw = cleanText(value || "/wisp/");
    raw = "/" + raw.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    return raw === "//" ? "/" : raw;
  }

  function toWebSocketUrl(originValue, pathValue) {
    var origin = normalizeBase(originValue);
    if (!origin) return "";

    try {
      var parsed = new URL(origin);
      parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      parsed.pathname = normalizeWispPath(pathValue);
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch (error) {
      return "";
    }
  }

  function resolveWispUrl(config) {
    var explicit = cleanText(config && config.services && config.services.wispUrl);
    if (explicit) return explicit;

    var backendBase = normalizeBase(config && config.backendBase);
    var backendApi = getBackendApi();
    if (!backendBase && backendApi && typeof backendApi.getBaseUrl === "function") {
      backendBase = normalizeBase(backendApi.getBaseUrl());
    }

    if (!backendBase) return "";
    return toWebSocketUrl(backendBase, config && config.services && config.services.wispPath);
  }

  function resolveProxyRequestUrl(config) {
    var explicitPath = cleanText(config && config.services && config.services.proxyRequest) || "/api/proxy/request";
    var backendApi = getBackendApi();
    if (backendApi && typeof backendApi.apiUrl === "function" && !/^https?:\/\//i.test(explicitPath)) {
      return backendApi.apiUrl(explicitPath);
    }
    var backendBase = normalizeBase(config && config.backendBase);
    if (!backendBase && backendApi && typeof backendApi.getBaseUrl === "function") {
      backendBase = normalizeBase(backendApi.getBaseUrl());
    }

    try {
      return new URL(explicitPath, backendBase || window.location.origin).toString();
    } catch (error) {
      return "";
    }
  }

  function resolveProxyFetchUrl(config) {
    var explicitPath =
      cleanText(config && config.services && (config.services.proxyFetch || config.services.proxy)) || "/api/proxy/fetch";
    var backendApi = getBackendApi();
    if (backendApi && typeof backendApi.apiUrl === "function" && !/^https?:\/\//i.test(explicitPath)) {
      return backendApi.apiUrl(explicitPath);
    }
    var backendBase = normalizeBase(config && config.backendBase);
    if (!backendBase && backendApi && typeof backendApi.getBaseUrl === "function") {
      backendBase = normalizeBase(backendApi.getBaseUrl());
    }

    try {
      return new URL(explicitPath, backendBase || window.location.origin).toString();
    } catch (error) {
      return "";
    }
  }

  function cloneProxyRequestBody(body) {
    if (!body) {
      return Promise.resolve(undefined);
    }
    if (body instanceof ArrayBuffer) {
      return Promise.resolve(body.slice(0));
    }
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(body)) {
      return Promise.resolve(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
    }
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      return body.arrayBuffer();
    }
    if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
      return new Response(body).arrayBuffer();
    }
    return Promise.resolve(body);
  }

  function shouldSkipFrontendProxyHeader(name) {
    return (
      !name ||
      name === "accept-encoding" ||
      name === "connection" ||
      name === "content-length" ||
      name === "cookie" ||
      name === "host" ||
      name === "origin" ||
      name === "referer" ||
      name === "transfer-encoding" ||
      name === "upgrade" ||
      name.indexOf("proxy-") === 0 ||
      name.indexOf("sec-") === 0 ||
      name.indexOf("x-antarctic-") === 0 ||
      name.indexOf("x-palladium-") === 0
    );
  }

  function normalizeProxyHeaders(headers) {
    if (!headers) return {};

    var flattened = {};
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      headers.forEach(function (value, key) {
        var normalizedKey = String(key || "").trim().toLowerCase();
        if (!normalizedKey || shouldSkipFrontendProxyHeader(normalizedKey)) {
          return;
        }
        flattened[normalizedKey] = String(value == null ? "" : value);
      });
      return flattened;
    }

    Object.keys(headers).forEach(function (key) {
      var normalizedKey = String(key || "").trim().toLowerCase();
      if (!normalizedKey || shouldSkipFrontendProxyHeader(normalizedKey)) return;
      var value = headers[key];
      if (Array.isArray(value)) {
        flattened[normalizedKey] = value.map(function (entry) {
          return String(entry == null ? "" : entry);
        }).join(", ");
        return;
      }
      flattened[normalizedKey] = String(value == null ? "" : value);
    });
    return flattened;
  }

  function collectProxyResponseHeaders(headers) {
    var collected = {};
    if (!headers || typeof headers.forEach !== "function") {
      return collected;
    }

    headers.forEach(function (value, key) {
      collected[String(key || "").toLowerCase()] = String(value == null ? "" : value);
    });
    return collected;
  }

  function determineProxyBootstrapPlan(options) {
    var declaredTransport = cleanText(options && options.declaredTransport).toLowerCase();
    var proxyFetchUrl = cleanText(options && options.proxyFetchUrl);
    var proxyRequestUrl = cleanText(options && options.proxyRequestUrl);
    var wispUrl = cleanText(options && options.wispUrl);
    var hasHttpTransport = Boolean(proxyRequestUrl || proxyFetchUrl);
    var hasWispTransport = Boolean(wispUrl);

    if ((declaredTransport === "disabled" || declaredTransport === "off") && (hasHttpTransport || hasWispTransport)) {
      return {
        contractMismatch: true,
        declaredTransport: declaredTransport || "disabled",
        hasHttpTransport: hasHttpTransport,
        hasWispTransport: hasWispTransport,
        preferredTransport: hasHttpTransport ? "http-fallback" : "wisp"
      };
    }

    if (declaredTransport === "http-fallback" && hasHttpTransport) {
      return {
        contractMismatch: false,
        declaredTransport: declaredTransport,
        hasHttpTransport: true,
        hasWispTransport: hasWispTransport,
        preferredTransport: "http-fallback"
      };
    }

    if (declaredTransport === "wisp" && hasWispTransport) {
      return {
        contractMismatch: false,
        declaredTransport: declaredTransport,
        hasHttpTransport: hasHttpTransport,
        hasWispTransport: true,
        preferredTransport: "wisp"
      };
    }

    if (hasHttpTransport) {
      return {
        contractMismatch: false,
        declaredTransport: declaredTransport,
        hasHttpTransport: true,
        hasWispTransport: hasWispTransport,
        preferredTransport: "http-fallback"
      };
    }

    if (hasWispTransport) {
      return {
        contractMismatch: false,
        declaredTransport: declaredTransport,
        hasHttpTransport: false,
        hasWispTransport: true,
        preferredTransport: "wisp"
      };
    }

    return {
      contractMismatch: false,
      declaredTransport: declaredTransport,
      hasHttpTransport: false,
      hasWispTransport: false,
      preferredTransport: ""
    };
  }

  function getProxyStatusText(response) {
    if (!response || !response.headers || typeof response.headers.get !== "function") {
      return "";
    }

    return (
      cleanText(response.headers.get("x-antarctic-proxy-status-text")) ||
      cleanText(response.headers.get("x-palladium-proxy-status-text")) ||
      cleanText(response.statusText)
    );
  }

  function probeWispTransport(wispUrl) {
    if (!wispUrl || typeof window.WebSocket !== "function") {
      return Promise.resolve(false);
    }

    return new Promise(function (resolve) {
      var settled = false;
      var socket = null;
      var timer = window.setTimeout(finishFalse, PROXY_WISP_PROBE_TIMEOUT_MS);

      function cleanup() {
        if (timer) {
          window.clearTimeout(timer);
          timer = 0;
        }
        if (socket) {
          socket.onopen = null;
          socket.onerror = null;
          socket.onclose = null;
        }
      }

      function finish(value) {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(Boolean(value));
      }

      function finishFalse() {
        try {
          if (socket && socket.readyState === window.WebSocket.CONNECTING) {
            socket.close();
          }
        } catch (error) {
          // Ignore best-effort close failures.
        }
        finish(false);
      }

      try {
        socket = new window.WebSocket(wispUrl);
      } catch (error) {
        finish(false);
        return;
      }

      socket.onopen = function () {
        try {
          socket.close();
        } catch (error) {
          // Ignore best-effort close failures.
        }
        finish(true);
      };
      socket.onerror = function () {
        finish(false);
      };
      socket.onclose = function () {
        finish(false);
      };
    });
  }

  function createHttpProxyTransport(config) {
    var proxyFetchUrl = resolveProxyFetchUrl(config);
    var proxyRequestUrl = resolveProxyRequestUrl(config);

    return {
      ready: false,
      init: function () {
        if (!proxyFetchUrl && !proxyRequestUrl) {
          return Promise.reject(new Error("No backend HTTP proxy endpoints are configured."));
        }
        this.ready = true;
        return Promise.resolve();
      },
      request: function (remote, method, body, headers, signal) {
        var normalizedMethod = String(method || "GET").toUpperCase();
        if ((normalizedMethod === "GET" || normalizedMethod === "HEAD") && proxyFetchUrl) {
          var fetchUrl = new URL(proxyFetchUrl);
          fetchUrl.searchParams.set("url", remote.toString());
          return window.fetch(fetchUrl.toString(), {
            method: normalizedMethod,
            signal: signal || undefined,
            credentials: "same-origin"
          }).then(function (response) {
            var responseHeaders = collectProxyResponseHeaders(response.headers);
            var status = Number(response.status || 502);
            if (status >= 500) {
              logProxyBootstrapEvent("upstream_proxy_failure", {
                method: normalizedMethod,
                status: status,
                target: remote.toString(),
                transport: "http-fallback"
              });
            }
            if ([101, 204, 205, 304].indexOf(status) !== -1 || normalizedMethod === "HEAD") {
              return {
                body: undefined,
                headers: responseHeaders,
                status: status,
                statusText: getProxyStatusText(response)
              };
            }

            return response.arrayBuffer().then(function (buffer) {
              return {
                body: buffer,
                headers: responseHeaders,
                status: status,
                statusText: getProxyStatusText(response)
              };
            });
          }).catch(function (error) {
            logProxyBootstrapEvent("upstream_proxy_failure", {
              error: cleanText(error && error.message ? error.message : error),
              method: normalizedMethod,
              target: remote.toString(),
              transport: "http-fallback"
            });
            throw error;
          });
        }

        return cloneProxyRequestBody(body).then(function (upstreamBody) {
          var requestUrl = new URL(proxyRequestUrl);
          requestUrl.searchParams.set("url", remote.toString());
          return window.fetch(requestUrl.toString(), {
            method: "POST",
            headers: {
              "content-type": "application/octet-stream",
              "x-antarctic-proxy-method": normalizedMethod,
              "x-antarctic-proxy-headers": JSON.stringify(normalizeProxyHeaders(headers))
            },
            body: ["GET", "HEAD"].indexOf(normalizedMethod) === -1 ? upstreamBody : undefined,
            signal: signal || undefined,
            credentials: "same-origin"
          });
        }).then(function (response) {
          var responseHeaders = collectProxyResponseHeaders(response.headers);
          var status = Number(response.status || 502);
          if (status >= 500) {
            logProxyBootstrapEvent("upstream_proxy_failure", {
              method: normalizedMethod,
              status: status,
              target: remote.toString(),
              transport: "http-fallback"
            });
          }
          if ([101, 204, 205, 304].indexOf(status) !== -1) {
            return {
              body: undefined,
              headers: responseHeaders,
              status: status,
              statusText: getProxyStatusText(response)
            };
          }

          return response.arrayBuffer().then(function (buffer) {
            return {
              body: buffer,
              headers: responseHeaders,
              status: status,
              statusText: getProxyStatusText(response)
            };
          });
        }).catch(function (error) {
          logProxyBootstrapEvent("upstream_proxy_failure", {
            error: cleanText(error && error.message ? error.message : error),
            method: normalizedMethod,
            target: remote.toString(),
            transport: "http-fallback"
          });
          throw error;
        });
      },
      connect: function (remote, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
        var message =
          "WebSocket proxy transport is unavailable because the backend Wisp websocket could not be reached.";
        window.setTimeout(function () {
          if (typeof onerror === "function") {
            onerror(new Error(message));
          }
          if (typeof onclose === "function") {
            onclose(1011, message);
          }
        }, 0);
        return [
          function () {},
          function () {
            if (typeof onclose === "function") {
              onclose(1000, "");
            }
          }
        ];
      }
    };
  }

  function setProxyHealth(ok, message, chipLabel) {
    state.proxyHealth = {
      ok: Boolean(ok),
      message: cleanText(message) || (ok ? "Scramjet is ready." : "Scramjet is unavailable.")
    };

    if (elements.proxyStatusChip) {
      elements.proxyStatusChip.textContent = chipLabel || (ok ? "Online" : "Offline");
    }

    renderStageOverlay(getActiveTab());
  }

  function decodeScramjetUrl(value) {
    var text = cleanText(value);
    if (!text) return "";
    if (text.indexOf(SCRAMJET_PREFIX) === -1 && text.indexOf(window.location.origin + SCRAMJET_PREFIX) !== 0) {
      return text;
    }
    if (!state.proxyRuntime.controller || typeof state.proxyRuntime.controller.decodeUrl !== "function") {
      return text;
    }

    try {
      return state.proxyRuntime.controller.decodeUrl(text);
    } catch (error) {
      return text;
    }
  }

  function loadScramjetControllerClass() {
    if (typeof window.$scramjetLoadController !== "function") {
      throw new Error("Scramjet bundle is not loaded on the static frontend.");
    }

    var loaded = window.$scramjetLoadController();
    if (!loaded || typeof loaded.ScramjetController !== "function") {
      throw new Error("Scramjet controller factory is unavailable.");
    }

    return loaded.ScramjetController;
  }

  function registerProxyServiceWorker() {
    if (!window.navigator || !window.navigator.serviceWorker) {
      return Promise.reject(new Error("This browser does not support service workers."));
    }

    return window.navigator.serviceWorker.register(appendProxyRuntimeAssetVersion(SCRAMJET_SW_PATH)).then(function () {
      return window.navigator.serviceWorker.getRegistration().then(function (registration) {
        if (!registration || typeof registration.update !== "function") {
          return registration;
        }
        return registration.update().catch(function () {
          return registration;
        }).then(function () {
          return registration;
        });
      });
    }).then(function () {
      return window.navigator.serviceWorker.ready;
    }).then(function (registration) {
      return waitForProxyServiceWorkerController().then(function () {
        return registration;
      });
    });
  }

  function hasCurrentProxyServiceWorkerController() {
    if (
      !window.navigator ||
      !window.navigator.serviceWorker ||
      !window.navigator.serviceWorker.controller
    ) {
      return false;
    }

    var scriptUrl = window.navigator.serviceWorker.controller.scriptURL;
    if (!isKnownProxyServiceWorkerScript(scriptUrl)) {
      return false;
    }

    var activeVersion = readProxyServiceWorkerAssetVersion(scriptUrl);
    return !activeVersion || activeVersion === PROXY_RUNTIME_ASSET_VERSION;
  }

  function waitForProxyServiceWorkerController() {
    if (hasCurrentProxyServiceWorkerController()) {
      writeProxyControllerReloadMarker("");
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      if (!window.navigator || !window.navigator.serviceWorker) {
        resolve();
        return;
      }

      var settled = false;
      var timeoutId = 0;

      function cleanup() {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        window.navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      }

      function finishReady() {
        if (settled) return;
        settled = true;
        cleanup();
        writeProxyControllerReloadMarker("");
        resolve();
      }

      function finishReload() {
        if (settled) return;
        settled = true;
        cleanup();
        if (scheduleProxyControllerReload()) {
          reject(new Error("Restarting proxy runtime..."));
          return;
        }
        reject(new Error("Proxy service worker controller is still unavailable."));
      }

      function handleControllerChange() {
        if (hasCurrentProxyServiceWorkerController()) {
          finishReady();
        }
      }

      timeoutId = window.setTimeout(function () {
        if (hasCurrentProxyServiceWorkerController()) {
          finishReady();
          return;
        }
        finishReload();
      }, 3200);
      window.navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
      window.navigator.serviceWorker.ready.then(function () {
        if (hasCurrentProxyServiceWorkerController()) {
          finishReady();
        }
      }).catch(function () {
        // Ignore ready failures and let the timeout path handle recovery.
      });
    });
  }

  function getProxyStorageErrorMessage(error) {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (error && typeof error.message === "string") return error.message;
    return String(error);
  }

  function isRecoverableProxyStorageError(error) {
    var message = getProxyStorageErrorMessage(error);
    return /IDBDatabase/i.test(message) || /object stores? was not found/i.test(message) || /NotFoundError/i.test(message);
  }

  function isRecoverableProxyControllerError(error) {
    var message = getProxyStorageErrorMessage(error);
    return /Proxy service worker controller is still unavailable/i.test(message);
  }

  function getProxyOrigin() {
    try {
      return cleanText(window.location.origin);
    } catch (error) {
      return "";
    }
  }

  function getLocalShellDocumentPaths() {
    var paths = [];
    var pathname = "/";

    try {
      pathname = cleanText(window.location.pathname) || "/";
    } catch (error) {
      pathname = "/";
    }

    if (pathname.charAt(0) !== "/") {
      pathname = "/" + pathname;
    }

    pushUniqueValue(paths, pathname);
    pushUniqueValue(paths, "/");
    pushUniqueValue(paths, "/index.html");

    if (pathname !== "/" && /\/index\.html$/i.test(pathname)) {
      pushUniqueValue(paths, pathname.replace(/index\.html$/i, "") || "/");
    } else if (pathname !== "/" && pathname.charAt(pathname.length - 1) === "/") {
      pushUniqueValue(paths, pathname + "index.html");
    }

    return paths;
  }

  function isLocalShellUrl(value) {
    var raw = cleanText(value);
    var origin = getProxyOrigin();
    if (!raw || !origin) {
      return false;
    }

    try {
      var parsed = new URL(raw);
      if (cleanText(parsed.origin) !== origin) {
        return false;
      }

      var pathname = cleanText(parsed.pathname) || "/";
      if (pathname.charAt(0) !== "/") {
        pathname = "/" + pathname;
      }

      return getLocalShellDocumentPaths().indexOf(pathname) !== -1;
    } catch (error) {
      return false;
    }
  }

  function pushUniqueValue(list, value) {
    var normalized = cleanText(value);
    if (!normalized) return;
    if (list.indexOf(normalized) === -1) {
      list.push(normalized);
    }
  }

  function isProxyDatabaseName(name) {
    var normalized = cleanText(name);
    var origin = getProxyOrigin();
    if (!normalized) {
      return false;
    }

    return normalized === "$scramjet" || normalized === origin + "@$scramjet" || /^EM_FS_/i.test(normalized) || /@EM_FS_/i.test(normalized);
  }

  function getProxyDatabaseNames() {
    var names = [];
    var pathname = "/";
    try {
      pathname = String(window.location.pathname || "/") || "/";
    } catch (error) {
      pathname = "/";
    }

    function pushCandidate(pathValue) {
      var cleanPath = String(pathValue || "/");
      if (!cleanPath) cleanPath = "/";
      var dbName = "EM_FS_" + cleanPath;
      if (names.indexOf(dbName) === -1) {
        names.push(dbName);
      }
    }

    pushCandidate(pathname);
    pushCandidate("/");
    pushCandidate("/index.html");

    if (pathname !== "/" && /\/index\.html$/i.test(pathname)) {
      pushCandidate(pathname.replace(/index\.html$/i, ""));
    } else if (pathname !== "/" && pathname.charAt(pathname.length - 1) === "/") {
      pushCandidate(pathname + "index.html");
    }

    return names;
  }

  function getKnownProxyDatabaseNames() {
    var names = [];
    var origin = getProxyOrigin();
    getProxyDatabaseNames().forEach(function (name) {
      pushUniqueValue(names, name);
      if (origin) {
        pushUniqueValue(names, origin + "@" + name);
      }
    });
    pushUniqueValue(names, "$scramjet");
    if (origin) {
      pushUniqueValue(names, origin + "@$scramjet");
    }
    return names;
  }

  function listProxyDatabaseNames() {
    var knownNames = getKnownProxyDatabaseNames();
    if (!window.indexedDB || typeof window.indexedDB.databases !== "function") {
      return Promise.resolve(knownNames);
    }

    return window.indexedDB.databases().then(function (entries) {
      var names = knownNames.slice();
      (entries || []).forEach(function (entry) {
        var name = cleanText(entry && entry.name);
        if (isProxyDatabaseName(name)) {
          pushUniqueValue(names, name);
        }
      });
      return names;
    }).catch(function () {
      return knownNames;
    });
  }

  function unregisterProxyServiceWorkers() {
    if (
      !window.navigator ||
      !window.navigator.serviceWorker ||
      typeof window.navigator.serviceWorker.getRegistrations !== "function"
    ) {
      return Promise.resolve();
    }

    return window.navigator.serviceWorker.getRegistrations().then(function (registrations) {
      return Promise.all(
        (registrations || []).map(function (registration) {
          var scriptUrl = cleanText(
            (registration && registration.active && registration.active.scriptURL) ||
              (registration && registration.installing && registration.installing.scriptURL) ||
              (registration && registration.waiting && registration.waiting.scriptURL)
          );
          if (!scriptUrl || scriptUrl.indexOf("/sw.js") === -1 || typeof registration.unregister !== "function") {
            return null;
          }
          return registration.unregister().catch(function () {
            return null;
          });
        })
      );
    }).then(function () {
      return null;
    }).catch(function () {
      return null;
    });
  }

  function closeProxyRuntimeHandles() {
    var controller = state.proxyRuntime.controller;
    if (!controller) {
      return Promise.resolve();
    }

    try {
      if (controller.db && typeof controller.db.close === "function") {
        controller.db.close();
      }
    } catch (error) {
      // Ignore close failures; the deletion pass below is still best-effort.
    }

    return Promise.resolve();
  }

  function waitForProxyRepairWindow() {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, 80);
    });
  }

  function readProxyRepairReloadMarker() {
    try {
      return cleanText(window.sessionStorage.getItem(PROXY_REPAIR_RELOAD_KEY));
    } catch (error) {
      return "";
    }
  }

  function writeProxyRepairReloadMarker(value) {
    try {
      if (value) {
        window.sessionStorage.setItem(PROXY_REPAIR_RELOAD_KEY, cleanText(value));
      } else {
        window.sessionStorage.removeItem(PROXY_REPAIR_RELOAD_KEY);
      }
    } catch (error) {
      // Ignore session storage failures during recovery bookkeeping.
    }
  }

  function readProxyControllerReloadMarker() {
    try {
      return cleanText(window.sessionStorage.getItem(PROXY_CONTROLLER_RELOAD_KEY));
    } catch (error) {
      return "";
    }
  }

  function getProxyControllerReloadState() {
    var marker = readProxyControllerReloadMarker();
    if (!marker) {
      return {
        version: "",
        attempts: 0
      };
    }

    var separatorIndex = marker.lastIndexOf("|");
    if (separatorIndex === -1) {
      return {
        version: marker,
        attempts: 1
      };
    }

    var version = cleanText(marker.slice(0, separatorIndex));
    var attempts = Number(marker.slice(separatorIndex + 1));
    if (!Number.isFinite(attempts) || attempts < 1) {
      attempts = 1;
    }

    return {
      version: version,
      attempts: Math.floor(attempts)
    };
  }

  function writeProxyControllerReloadMarker(value, attempts) {
    try {
      if (value) {
        window.sessionStorage.setItem(
          PROXY_CONTROLLER_RELOAD_KEY,
          cleanText(value) + "|" + Math.max(1, Math.floor(Number(attempts) || 1))
        );
      } else {
        window.sessionStorage.removeItem(PROXY_CONTROLLER_RELOAD_KEY);
      }
    } catch (error) {
      // Ignore session storage failures during service worker recovery bookkeeping.
    }
  }

  function scheduleProxyControllerReload() {
    if (!window.location || typeof window.location.reload !== "function") {
      return false;
    }

    var reloadState = getProxyControllerReloadState();
    if (
      reloadState.version === PROXY_RUNTIME_ASSET_VERSION &&
      reloadState.attempts >= PROXY_CONTROLLER_RELOAD_MAX_ATTEMPTS
    ) {
      return false;
    }

    writeProxyControllerReloadMarker(
      PROXY_RUNTIME_ASSET_VERSION,
      reloadState.version === PROXY_RUNTIME_ASSET_VERSION ? reloadState.attempts + 1 : 1
    );
    window.setTimeout(function () {
      try {
        window.location.reload();
      } catch (error) {
        // Ignore reload failures; the offline state will remain visible instead.
      }
    }, 30);
    return true;
  }

  function scheduleProxyRepairReload() {
    if (!window.location || typeof window.location.reload !== "function") {
      return false;
    }

    if (readProxyRepairReloadMarker() === PROXY_STORAGE_VERSION) {
      return false;
    }

    writeProxyRepairReloadMarker(PROXY_STORAGE_VERSION);
    window.setTimeout(function () {
      try {
        window.location.reload();
      } catch (error) {
        // Ignore reload failures; the current page will keep the offline state visible.
      }
    }, 30);
    return true;
  }

  function deleteIndexedDatabase(name) {
    return new Promise(function (resolve) {
      if (!window.indexedDB || !name) {
        resolve();
        return;
      }

      try {
        var request = window.indexedDB.deleteDatabase(name);
        request.onsuccess = function () {
          resolve();
        };
        request.onerror = function () {
          resolve();
        };
        request.onblocked = function () {
          resolve();
        };
      } catch (error) {
        resolve();
      }
    });
  }

  function repairProxyRuntimeStorage(options) {
    var silent = Boolean(options && options.silent);
    var resetControllerBudget = Boolean(options && options.resetControllerBudget);
    if (state.proxyRuntime.repairPromise) {
      return state.proxyRuntime.repairPromise;
    }

    if (!silent) {
      setProxyHealth(false, "Resetting proxy storage and retrying...", "Repairing");
    }
    logProxyBootstrapEvent("controller_bootstrap_repair", {
      reason: resetControllerBudget ? "controller-unavailable" : "storage-reset",
      silent: silent
    });

    state.proxyRuntime.repairPromise = closeProxyRuntimeHandles().then(function () {
      return unregisterProxyServiceWorkers();
    }).then(function () {
      return waitForProxyRepairWindow();
    }).then(function () {
      return listProxyDatabaseNames();
    }).then(function (names) {
      return Promise.all(
        names.map(function (name) {
          return deleteIndexedDatabase(name);
        })
      );
    }).then(function () {
      try {
        window.localStorage.removeItem("bare-mux-path");
      } catch (error) {
        // Ignore storage access failures during recovery.
      }

      if (resetControllerBudget) {
        writeProxyControllerReloadMarker("");
        writeProxyRepairReloadMarker("");
      }

      state.proxyRuntime.controller = null;
      state.proxyRuntime.ready = false;
      state.proxyRuntime.transportMode = "";
      state.proxyRuntime.transportUrl = "";
      writePersistentValue(PROXY_STORAGE_VERSION_KEY, PROXY_STORAGE_VERSION);
      state.proxyRuntime.reloadScheduled = scheduleProxyRepairReload();
    }).then(function () {
      state.proxyRuntime.repairPromise = null;
    }, function (error) {
      state.proxyRuntime.repairPromise = null;
      throw error;
    });

    return state.proxyRuntime.repairPromise;
  }

  function initializeProxyRuntime(config, allowRepair) {
    var wispUrl = resolveWispUrl(config);
    var proxyFetchUrl = resolveProxyFetchUrl(config);
    var proxyRequestUrl = resolveProxyRequestUrl(config);
    var bootstrapPlan = determineProxyBootstrapPlan({
      declaredTransport: config && config.services && (config.services.proxyTransport || config.services.proxyMode),
      proxyFetchUrl: proxyFetchUrl,
      proxyRequestUrl: proxyRequestUrl,
      wispUrl: wispUrl
    });
    var httpTransportUrl = proxyRequestUrl || proxyFetchUrl;
    if (!bootstrapPlan.hasWispTransport && !bootstrapPlan.hasHttpTransport) {
      return Promise.reject(new Error("No backend proxy transport is configured."));
    }
    if (bootstrapPlan.contractMismatch) {
      logProxyBootstrapEvent("config_mismatch", {
        declaredTransport: bootstrapPlan.declaredTransport,
        recoveredTransport: bootstrapPlan.preferredTransport
      });
    }

    if (!window.BareMux || typeof window.BareMux.BareMuxConnection !== "function") {
      return Promise.reject(new Error("BareMux is not available on the static frontend."));
    }

    return registerProxyServiceWorker().then(function () {
      var ScramjetController = loadScramjetControllerClass();
      var controller = state.proxyRuntime.controller;

      if (!controller) {
        controller = new ScramjetController({
          prefix: SCRAMJET_PREFIX,
          files: SCRAMJET_FILES
        });
      }

      return controller.init().then(function () {
        var mux = new window.BareMux.BareMuxConnection(appendProxyRuntimeAssetVersion(BAREMUX_WORKER_PATH));
        function activateHttpFallback(reason) {
          if (!httpTransportUrl) {
            return Promise.reject(new Error("No backend HTTP proxy endpoints are configured."));
          }
          logProxyBootstrapEvent("fallback_activation", {
            reason: cleanText(reason) || "http-fallback",
            target: httpTransportUrl || "antarctic-http-fallback",
            transport: "http-fallback"
          });
          return mux
            .setRemoteTransport(createHttpProxyTransport(config), httpTransportUrl || "antarctic-http-fallback")
            .then(function () {
              state.proxyRuntime.controller = controller;
              state.proxyRuntime.ready = true;
              state.proxyRuntime.transportMode = "http-fallback";
              state.proxyRuntime.transportUrl = httpTransportUrl || "backend HTTP fallback";
              return state.proxyRuntime;
            });
        }
        if (bootstrapPlan.preferredTransport === "http-fallback" || !bootstrapPlan.hasWispTransport) {
          return activateHttpFallback(
            bootstrapPlan.preferredTransport === "http-fallback" ? "preferred-http-fallback" : "no-wisp-transport"
          );
        }
        logProxyBootstrapEvent("transport_probe_start", {
          transport: "wisp",
          wispUrl: wispUrl
        });
        var probeStartedAt = Date.now();
        return probeWispTransport(wispUrl).then(function (wispReachable) {
          var probeDurationMs = Date.now() - probeStartedAt;
          if (probeDurationMs >= 750) {
            logProxyBootstrapEvent("transport_probe_delay", {
              durationMs: probeDurationMs,
              reachable: wispReachable,
              transport: "wisp"
            });
          }
          if (!wispReachable) {
            return activateHttpFallback("wisp-unreachable");
          }
          return mux
            .setTransport(appendProxyRuntimeAssetVersion(LIBCURL_TRANSPORT_PATH), [{ wisp: wispUrl }])
            .then(function () {
              state.proxyRuntime.controller = controller;
              state.proxyRuntime.ready = true;
              state.proxyRuntime.transportMode = "wisp";
              state.proxyRuntime.transportUrl = wispUrl;
              return state.proxyRuntime;
            }, function () {
              return activateHttpFallback("wisp-init-failed");
            });
        }, function () {
          return activateHttpFallback("wisp-probe-failed");
        });
      });
    }).catch(function (error) {
      var recoverableStorageError = isRecoverableProxyStorageError(error);
      var recoverableControllerError = isRecoverableProxyControllerError(error);
      if (!allowRepair || (!recoverableStorageError && !recoverableControllerError)) {
        throw error;
      }

      return repairProxyRuntimeStorage({
        resetControllerBudget: recoverableControllerError
      }).then(function () {
        if (state.proxyRuntime.reloadScheduled) {
          throw new Error("Restarting proxy runtime...");
        }
        return initializeProxyRuntime(config, false);
      });
    });
  }

  function ensureProxyRuntime() {
    if (state.proxyRuntime.ready && state.proxyRuntime.controller) {
      return Promise.resolve(state.proxyRuntime);
    }

    if (state.proxyRuntime.initPromise) {
      return state.proxyRuntime.initPromise;
    }

    state.proxyRuntime.initPromise = loadProxyConfig().then(function (config) {
      return initializeProxyRuntime(config, true);
    }).then(function (runtime) {
      state.proxyRuntime.initPromise = null;
      state.proxyRuntime.reloadScheduled = false;
      writeProxyRepairReloadMarker("");
      return runtime;
    }).catch(function (error) {
      state.proxyRuntime.initPromise = null;
      state.proxyRuntime.ready = false;
      throw error;
    });

    return state.proxyRuntime.initPromise;
  }

  function ensureProxyStorageCompatibility() {
    if (readPersistentValue(PROXY_STORAGE_VERSION_KEY) === PROXY_STORAGE_VERSION) {
      return Promise.resolve();
    }

    return repairProxyRuntimeStorage({ silent: true }).catch(function () {
      return null;
    }).then(function () {
      writePersistentValue(PROXY_STORAGE_VERSION_KEY, PROXY_STORAGE_VERSION);
    });
  }

  function disableProxyRuntime() {
    state.proxyRuntime.controller = null;
    state.proxyRuntime.ready = false;
    state.proxyRuntime.transportMode = "";
    state.proxyRuntime.transportUrl = "";
    state.proxyRuntime.reloadScheduled = false;

    return closeProxyRuntimeHandles().catch(function () {
      return null;
    }).then(function () {
      return unregisterProxyServiceWorkers().catch(function () {
        return null;
      });
    }).then(function () {
      return listProxyDatabaseNames().catch(function () {
        return [];
      });
    }).then(function (names) {
      return Promise.all(
        (Array.isArray(names) ? names : []).map(function (name) {
          return deleteIndexedDatabase(name).catch(function () {
            return null;
          });
        })
      );
    }).then(function () {
      try {
        window.localStorage.removeItem("bare-mux-path");
      } catch (error) {
        // Ignore storage cleanup failures while proxy mode is disabled.
      }
      writeProxyRepairReloadMarker("");
      writeProxyControllerReloadMarker("");
    });
  }

  function isDuckDuckGoHost(hostname) {
    var normalized = cleanText(hostname).toLowerCase();
    return (
      normalized === "duckduckgo.com" ||
      normalized === "www.duckduckgo.com" ||
      normalized === "html.duckduckgo.com" ||
      normalized === "lite.duckduckgo.com" ||
      normalized === "start.duckduckgo.com"
    );
  }

  function extractPrivateSearchDetails(value) {
    var targetUrl = cleanText(value);
    if (!targetUrl) {
      return {
        displayUrl: "",
        provider: "",
        query: ""
      };
    }

    try {
      var parsed = new URL(targetUrl);
      if (!isDuckDuckGoHost(parsed.hostname)) {
        return {
          displayUrl: "",
          provider: "",
          query: ""
        };
      }

      var query = cleanText(parsed.searchParams.get("q"));
      if (!query) {
        return {
          displayUrl: "",
          provider: "",
          query: ""
        };
      }

      return {
        displayUrl: parsed.origin.replace(/\/+$/, "") + "/",
        provider: "duckduckgo",
        query: query
      };
    } catch (error) {
      return {
        displayUrl: "",
        provider: "",
        query: ""
      };
    }
  }

  function resolveVisibleWebUri(tab, targetUrl) {
    var nextUrl = cleanText(targetUrl);
    if (!nextUrl) return "";

    var privateSearch = extractPrivateSearchDetails(nextUrl);
    if (!privateSearch.displayUrl) {
      return nextUrl;
    }

    if (tab) {
      tab.searchProvider = privateSearch.provider;
      tab.searchQuery = privateSearch.query;
    }

    return privateSearch.displayUrl;
  }

  function resolveShellAddressWebUri(tab, targetUrl) {
    var nextUrl = cleanText(targetUrl);
    if (!nextUrl) {
      return "";
    }

    var privateSearch = extractPrivateSearchDetails(nextUrl);
    if (privateSearch.displayUrl) {
      if (tab) {
        tab.searchProvider = privateSearch.provider;
        tab.searchQuery = privateSearch.query;
      }
      return privateSearch.query;
    }

    try {
      var parsed = new URL(nextUrl);
      if (isDuckDuckGoHost(parsed.hostname)) {
        var pendingSearchQuery = cleanText(tab && tab.webState && tab.webState.pendingSearchQuery);
        if (pendingSearchQuery) {
          return pendingSearchQuery;
        }
      }
    } catch (error) {
      // Fall through to the raw target URL.
    }

    if (tab) {
      tab.searchProvider = "";
      tab.searchQuery = "";
    }

    return nextUrl;
  }

  function findPrivateSearchField(doc) {
    if (!doc || typeof doc.querySelector !== "function") {
      return null;
    }

    return doc.querySelector(
      'input[name="q"]:not([type="hidden"]), textarea[name="q"], input[type="search"]:not([type="hidden"]), input[role="searchbox"]:not([type="hidden"]), textarea[role="searchbox"]'
    );
  }

  function submitPrivateSearchFromFrame(frame, query) {
    var normalizedQuery = cleanText(query);
    if (!frame || !normalizedQuery) {
      return false;
    }

    var doc = null;
    try {
      doc = frame.contentDocument;
    } catch (error) {
      return false;
    }

    var field = findPrivateSearchField(doc);
    if (!field) {
      return false;
    }

    try {
      if (typeof field.focus === "function") {
        field.focus();
      }
    } catch (error) {
      // Ignore focus failures while populating the proxied search field.
    }

    field.value = normalizedQuery;
    if (typeof field.setAttribute === "function") {
      field.setAttribute("value", normalizedQuery);
    }
    if (typeof field.dispatchEvent === "function" && typeof Event === "function") {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }

    var form = field.form;
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
        return true;
      }
      if (typeof form.submit === "function") {
        form.submit();
        return true;
      }
    }

    if (doc && typeof doc.querySelector === "function") {
      var submitButton = doc.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton && typeof submitButton.click === "function") {
        submitButton.click();
        return true;
      }
    }

    return false;
  }

  function schedulePrivateSearchSubmission(tab, frame, attempt) {
    clearPendingWebSearch(tab);
    if (!tab || !tab.webState) {
      return;
    }

    var nextAttempt = Math.max(1, Math.floor(Number(attempt) || 1));
    var query = cleanText(tab.webState.pendingSearchQuery || tab.searchQuery);
    if (!query || !frame) {
      return;
    }

    if (submitPrivateSearchFromFrame(frame, query)) {
      tab.webState.pendingSearchQuery = "";
      return;
    }

    if (nextAttempt >= PRIVATE_SEARCH_AUTOFILL_MAX_ATTEMPTS) {
      return;
    }

    tab.webState.searchRetryTimer = window.setTimeout(function () {
      schedulePrivateSearchSubmission(tab, frame, nextAttempt + 1);
    }, PRIVATE_SEARCH_AUTOFILL_RETRY_MS);
  }

  function syncWebTabFromUrl(tab, value) {
    var nextUrl = decodeScramjetUrl(value);
    if (!nextUrl) return;
    if (isLocalShellUrl(nextUrl) && !isLocalShellUrl(tab && tab.targetUrl)) {
      return;
    }

    tab.targetUrl = nextUrl;
    tab.browserUri = resolveVisibleWebUri(tab, nextUrl);
    tab.uri = resolveShellAddressWebUri(tab, nextUrl);
    tab.title = core.inferWebTitle(nextUrl);
    tab.webState.currentTarget = nextUrl;
    renderShell();
  }

  function getLoadedWebPaneUrl(tab, frame) {
    try {
      if (tab && tab.webState && tab.webState.frameController && tab.webState.frameController.url && tab.webState.frameController.url.href) {
        return decodeScramjetUrl(tab.webState.frameController.url.href);
      }
    } catch (error) {
      // Fall back to the iframe src.
    }

    try {
      return decodeScramjetUrl(frame && frame.src);
    } catch (error) {
      return "";
    }
  }

  function shouldRevealWebPane(tab, loadedUrl) {
    var nextUrl = cleanText(loadedUrl);
    if (!nextUrl) {
      return false;
    }
    if (!isLocalShellUrl(nextUrl)) {
      return true;
    }
    return isLocalShellUrl(tab && tab.targetUrl);
  }

  function shouldAutofillPrivateSearch(tab, loadedUrl) {
    var query = cleanText(tab && tab.webState && tab.webState.pendingSearchQuery);
    if (!query) {
      return false;
    }

    var nextUrl = cleanText(loadedUrl);
    if (!nextUrl || isLocalShellUrl(nextUrl)) {
      return true;
    }

    try {
      return isDuckDuckGoHost(new URL(nextUrl).hostname);
    } catch (error) {
      return false;
    }
  }

  function navigateWebPane(tab, force) {
    if (!tab || tab.view !== "web" || !tab.webState || !tab.webState.frameController) return;
    var targetUrl = cleanText(tab.targetUrl);
    if (!targetUrl) return;
    if (!force && tab.webState.currentTarget === targetUrl) return;

    tab.webState.currentTarget = targetUrl;

    try {
      tab.webState.frameController.go(targetUrl);
    } catch (error) {
      setProxyHealth(false, error && error.message ? error.message : error, "Offline");
    }
  }

  function hydrateWebPane(tab) {
    if (!tab || tab.view !== "web" || !tab.paneEl) return;
    var frame = tab.paneEl.querySelector("iframe.shell-pane__frame");
    if (!frame) return;

    renderDisabledWebPane(tab, tab.paneEl, PROXY_BOOT_MESSAGE, "Preparing the fallback web proxy.");
    setProxyHealth(false, PROXY_BOOT_MESSAGE, "Starting");

    if (!frame.__antarcticWebLoadBound) {
      frame.__antarcticWebLoadBound = true;
      frame.addEventListener("load", function () {
        if (!tab.webState || !tab.webState.frameController) return;
        var loadedUrl = getLoadedWebPaneUrl(tab, frame);
        var revealFrame = shouldRevealWebPane(tab, loadedUrl);
        clearPendingWebSearch(tab);
        if (shouldAutofillPrivateSearch(tab, loadedUrl)) {
          schedulePrivateSearchSubmission(tab, frame, 1);
        }
        if (loadedUrl) {
          syncWebTabFromUrl(tab, loadedUrl);
        }
        if (revealFrame) {
          try {
            var nextTitle = cleanText(frame.contentDocument && frame.contentDocument.title);
            if (nextTitle) {
              tab.title = nextTitle;
            }
          } catch (error) {
            // Ignore proxied title access issues and keep the inferred title.
          }
          renderEnabledWebPane(tab.paneEl);
        } else {
          renderDisabledWebPane(tab, tab.paneEl, PROXY_IDLE_MESSAGE, "Preparing the fallback web proxy.");
        }
        renderShell();
      });
    }

    ensureProxyRuntime().then(function (runtime) {
      if (!tab || !tab.paneEl || tab.view !== "web") return runtime;

      if (!tab.webState.frameController) {
        tab.webState.frameController = runtime.controller.createFrame(frame);
      }

      setProxyHealth(
        true,
        runtime.transportMode === "wisp"
          ? "Web browsing is ready over the websocket transport."
          : "Web browsing is ready over the HTTP fallback transport.",
        runtime.transportMode === "wisp" ? "Online" : "Fallback"
      );
      navigateWebPane(tab, true);
      return runtime;
    }).catch(function (error) {
      tab.webState.frameController = null;
      renderDisabledWebPane(tab, tab.paneEl, error && error.message ? error.message : error);
      setProxyHealth(false, error && error.message ? error.message : error, "Offline");
    });
  }

  function buildThumbMarkup(game) {
    var image = cleanText(game && game.image);
    if (image) {
      return '<div class="game-card__thumb"><img src="' + escapeHtml(resolveLocalAppUrl(image)) + '" alt="' + escapeHtml(game.title) + '" loading="lazy" /></div>';
    }
    return '<div class="game-card__thumb"></div>';
  }

  function makeLaunchUri(game) {
    var gamesApi = getGamesApi();
    if (gamesApi && typeof gamesApi.buildLaunchUri === "function") {
      return gamesApi.buildLaunchUri(game.path, game.title, game.author);
    }
    return core.buildGameUri(game.path, game.title, game.author);
  }

  function filterCatalogGames(games, rawQuery) {
    var gamesApi = getGamesApi();
    if (gamesApi && typeof gamesApi.filterCatalog === "function") {
      return gamesApi.filterCatalog(games, rawQuery);
    }
    var query = cleanText(rawQuery).toLowerCase();
    if (!Array.isArray(games)) return [];
    return games.filter(function (game) {
      if (!query) return true;
      var haystack = [
        cleanText(game && game.title),
        cleanText(game && game.author),
        cleanText(game && game.category),
        cleanText(game && game.path)
      ].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function resolveFeaturedGame(games) {
    var gamesApi = getGamesApi();
    if (gamesApi && typeof gamesApi.pickFeaturedGame === "function") {
      return gamesApi.pickFeaturedGame(games);
    }
    if (!Array.isArray(games) || !games.length) return null;
    return games[0];
  }

  function renderGamesCatalog(pane, tab) {
    var statusEl = pane.querySelector('[data-role="games-status"]');
    var featuredEl = pane.querySelector('[data-role="games-featured"]');
    var gridEl = pane.querySelector('[data-role="games-grid"]');
    var query = cleanText(tab.gamesQuery);

    if (!state.gamesCatalog) {
      if (statusEl) statusEl.textContent = "Loading local catalog...";
      return;
    }

    var games = filterCatalogGames(state.gamesCatalog, query);
    var featuredGame = resolveFeaturedGame(state.gamesCatalog);

    if (statusEl) {
      statusEl.textContent = query
        ? games.length + (games.length === 1 ? " result" : " results")
        : state.gamesCatalog.length + " games";
    }

    if (featuredEl) {
      if (!featuredGame) {
        featuredEl.innerHTML = '<div class="empty-state">No local games are available yet.</div>';
      } else {
        featuredEl.innerHTML =
          '<div class="featured-launch__thumb">' +
            (cleanText(featuredGame.image)
              ? '<img src="' + escapeHtml(resolveLocalAppUrl(featuredGame.image)) + '" alt="' + escapeHtml(featuredGame.title) + '" loading="lazy" />'
              : "") +
          "</div>" +
          '<div class="featured-launch__body">' +
            '<h3 class="featured-launch__title">' + escapeHtml(featuredGame.title) + "</h3>" +
            '<p class="featured-launch__meta">' +
              '<span class="featured-launch__meta-author">' +
              escapeHtml(featuredGame.author || "Unknown") +
              "</span>" +
              '<span class="featured-launch__meta-sep" aria-hidden="true">\u00a0--\u00a0</span>' +
              '<span class="featured-launch__meta-category">' +
              escapeHtml(featuredGame.category || "game") +
              "</span>" +
              "</p>" +
            '<p class="featured-launch__meta">Launch it in its own Antarctic tab.</p>' +
            '<button type="button" class="toolbar-button toolbar-button--accent featured-launch__cta" data-launch-uri="' + escapeHtml(makeLaunchUri(featuredGame)) + '">Play now</button>' +
          "</div>";
      }
    }

    if (!gridEl) return;

    if (!games.length) {
      gridEl.innerHTML = '<div class="empty-state">Try another search or open a fresh tab.</div>';
      return;
    }

    gridEl.innerHTML = games.map(function (game) {
      return (
        '<button type="button" class="game-card" data-launch-uri="' + escapeHtml(makeLaunchUri(game)) + '">' +
          buildThumbMarkup(game) +
          '<div class="game-card__body">' +
            '<h4 class="game-card__title">' + escapeHtml(game.title) + "</h4>" +
            '<div class="game-card__meta">' +
              escapeHtml(game.author || "Unknown") +
              '<span class="game-card__meta-sep" aria-hidden="true">\u00a0--\u00a0</span>' +
              escapeHtml(game.category || "game") +
              "</div>" +
          "</div>" +
        "</button>"
      );
    }).join("");
  }

  function renderGamesFailure(pane) {
    var statusEl = pane.querySelector('[data-role="games-status"]');
    var featuredEl = pane.querySelector('[data-role="games-featured"]');
    var gridEl = pane.querySelector('[data-role="games-grid"]');

    if (statusEl) statusEl.textContent = "Catalog unavailable";
    if (featuredEl) {
      featuredEl.innerHTML = '<div class="empty-state">The games catalog could not be loaded right now.</div>';
    }
    if (gridEl) {
      gridEl.innerHTML = "";
    }
  }

  function handlePaneAction(event) {
    var target = event.target;
    if (!target || typeof target.closest !== "function") return;

    var routeButton = target.closest("[data-route]");
    if (routeButton) {
      navigateCurrent(routeButton.getAttribute("data-route"));
      return;
    }

    var fullscreenBtn = target.closest("[data-game-fullscreen]");
    if (fullscreenBtn) {
      if (fullscreenBtn.disabled) return;
      var gamePane = target.closest(".shell-pane--gamelauncher");
      if (!gamePane) return;
      var gameFrame = gamePane.querySelector("iframe.game-launcher__frame");
      if (!gameFrame) return;
      if (document.fullscreenElement === gameFrame) {
        document.exitFullscreen().catch(function () {});
      } else {
        gameFrame.requestFullscreen().catch(function () {});
      }
      return;
    }

    var launchButton = target.closest("[data-launch-uri]");
    if (launchButton) {
      openNewTab(launchButton.getAttribute("data-launch-uri"));
      return;
    }

    var searchButton = target.closest("[data-query]");
    if (searchButton) {
      navigateCurrent(searchButton.getAttribute("data-query"));
      return;
    }

    var promptButton = target.closest("[data-prompt]");
    if (promptButton) {
      var pane = target.closest(".shell-pane");
      if (!pane) return;
      var active = getActiveTab();
      if (!active || active.id !== pane.dataset.tabId) return;
      var input = pane.querySelector(".ai-chat__input");
      if (!input) return;
      input.value = promptButton.getAttribute("data-prompt");
      syncAiInputHeight(input);
      input.focus();
      if (typeof input.setSelectionRange === "function") {
        var end = input.value.length;
        input.setSelectionRange(end, end);
      }
    }
  }

  function loadGamesCatalog() {
    if (state.gamesCatalog) {
      return Promise.resolve(state.gamesCatalog.slice());
    }

    var gamesApi = getGamesApi();
    if (!gamesApi || typeof gamesApi.loadCatalog !== "function") {
      return Promise.reject(new Error("Games helper not available."));
    }

    return gamesApi.loadCatalog().then(function (games) {
      state.gamesCatalog = Array.isArray(games) ? games : [];
      return state.gamesCatalog.slice();
    });
  }

  function renderAiConversation(pane, tab) {
    var messagesEl = pane.querySelector('[data-role="ai-messages"]');
    if (!messagesEl) return;

    messagesEl.innerHTML = "";
    tab.aiState.memory.forEach(function (message) {
      messagesEl.appendChild(buildAiMessage(message.role, message.content));
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function buildAiMessage(role, text) {
    var bubble = document.createElement("article");
    bubble.className = "ai-message ai-message--" + role;
    bubble.innerHTML =
      '<div class="ai-message__label">' + (role === "user" ? "You" : "Assistant") + "</div>" +
      '<div class="ai-message__body">' + renderMarkdown(text || "") + "</div>";
    return bubble;
  }

  function updateAiMessage(bubble, text) {
    if (!bubble) return;
    var body = bubble.querySelector(".ai-message__body");
    if (!body) return;
    body.innerHTML = renderMarkdown(text || "");
  }

  function renderMarkdown(text) {
    var source = String(text || "").replace(/\r/g, "");
    if (!source) return "<p></p>";

    var lines = source.split("\n");
    var html = [];
    var listOpen = false;
    var listType = "";
    var codeOpen = false;
    var codeLines = [];
    var blockquoteOpen = false;
    var blockquoteLines = [];
    var hrCount = 0;

    function closeList() {
      if (listOpen) {
        html.push("</" + listType + ">");
        listOpen = false;
        listType = "";
      }
    }

    function closeCode() {
      if (codeOpen) {
        html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        codeOpen = false;
        codeLines = [];
      }
    }

    function closeBlockquote() {
      if (blockquoteOpen) {
        var inner = blockquoteLines.map(function (l) {
          return inlineMarkdown(l.trim().replace(/^>\s?/, ""));
        }).join(" ");
        html.push("<blockquote>" + inner + "</blockquote>");
        blockquoteOpen = false;
        blockquoteLines = [];
      }
    }

    function checkHr(trimmed) {
      return /^[-*_]{3,}\s*$/.test(trimmed);
    }

    for (var index = 0; index < lines.length; index += 1) {
      var line = lines[index];
      var trimmed = line.trim();

      if (/^```/.test(trimmed)) {
        closeList();
        closeBlockquote();
        if (codeOpen) {
          closeCode();
        } else {
          codeOpen = true;
        }
        continue;
      }

      if (codeOpen) {
        codeLines.push(line);
        continue;
      }

      if (!trimmed) {
        closeList();
        closeBlockquote();
        if (hrCount > 0) {
          html.push("<hr>");
          hrCount = 0;
        }
        continue;
      }

      if (checkHr(trimmed)) {
        hrCount++;
        if (hrCount >= 1 && index === lines.length - 1) {
          closeList();
          closeBlockquote();
          html.push("<hr>");
          hrCount = 0;
        }
        continue;
      }

      if (hrCount > 0) {
        closeList();
        closeBlockquote();
        html.push("<hr>");
        hrCount = 0;
      }

      var headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        closeList();
        closeBlockquote();
        var level = headingMatch[1].length;
        html.push("<h" + level + ">" + inlineMarkdown(escapeHtml(headingMatch[2])) + "</h" + level + ">");
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        closeList();
        if (!blockquoteOpen) {
          blockquoteOpen = true;
          blockquoteLines = [];
        }
        blockquoteLines.push(trimmed.replace(/^>\s?/, ""));
        continue;
      }

      if (blockquoteOpen) {
        closeBlockquote();
      }

      var orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (orderedMatch) {
        if (listOpen && listType !== "ol") {
          closeList();
        }
        if (!listOpen) {
          html.push("<ol>");
          listOpen = true;
          listType = "ol";
        }
        html.push("<li>" + inlineMarkdown(escapeHtml(orderedMatch[2])) + "</li>");
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (listOpen && listType !== "ul") {
          closeList();
        }
        if (!listOpen) {
          html.push("<ul>");
          listOpen = true;
          listType = "ul";
        }
        html.push("<li>" + inlineMarkdown(escapeHtml(trimmed.replace(/^[-*]\s+/, ""))) + "</li>");
        continue;
      }

      closeList();
      html.push("<p>" + inlineMarkdown(escapeHtml(trimmed)) + "</p>");
    }

    closeCode();
    closeList();
    closeBlockquote();
    if (hrCount > 0) {
      html.push("<hr>");
    }
    return html.join("");
  }

  function inlineMarkdown(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function refreshAiStatus(pane) {
    var statusEl = pane.querySelector('[data-role="ai-status"]');

    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.getPublicConfig !== "function") {
      if (statusEl) statusEl.textContent = "Backend helper unavailable";
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = "Backend missing";
      return;
    }

    backendApi.getPublicConfig().then(function (config) {
      state.config = config || state.config;
      var model = cleanText(config && config.services && config.services.defaultAiModel) || "AI";
      if (statusEl) statusEl.textContent = "Online · " + model;
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = model;
    }).catch(function () {
      if (statusEl) statusEl.textContent = "AI backend unavailable";
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = "Offline";
    });
  }

  function submitAiMessage(tab, pane) {
    if (tab.aiState.busy) return;
    var input = pane.querySelector(".ai-chat__input");
    var messagesEl = pane.querySelector('[data-role="ai-messages"]');
    if (!input || !messagesEl) return;

    var text = cleanText(input.value);
    if (!text) return;

    input.value = "";
    syncAiInputHeight(input);
    tab.aiState.busy = true;

    var userMessage = { role: "user", content: text };
    tab.aiState.memory.push(userMessage);
    var userBubble = buildAiMessage(userMessage.role, userMessage.content);
    messagesEl.appendChild(userBubble);

    var assistantBubble = buildAiMessage("assistant", "Thinking...");
    messagesEl.appendChild(assistantBubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    requestAiResponse(tab, text, function (combined) {
      updateAiMessage(assistantBubble, combined || "Thinking...");
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }).then(function (answer) {
      tab.aiState.memory.push({ role: "assistant", content: answer });
      updateAiMessage(assistantBubble, answer);
    }).catch(function (error) {
      updateAiMessage(assistantBubble, "AI error: " + cleanText(error && error.message ? error.message : error));
    }).finally(function () {
      tab.aiState.busy = false;
    });
  }

  function flattenAssistantContent(value) {
    if (typeof value === "string") {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value.map(function (item) {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item.text === "string") {
          return item.text;
        }
        if (item && typeof item.content === "string") {
          return item.content;
        }
        return "";
      }).join("").trim();
    }

    return "";
  }

  function extractAssistantText(rawText) {
    function contentFromParsed(parsed) {
      if (!parsed || typeof parsed !== "object") return "";

      if (parsed.message && typeof parsed.message === "object") {
        var messageText = flattenAssistantContent(parsed.message.content);
        if (messageText) {
          return messageText;
        }
      }

      if (typeof parsed.response === "string" && parsed.response.trim()) {
        return parsed.response.trim();
      }

      if (typeof parsed.content === "string" && parsed.content.trim()) {
        return parsed.content.trim();
      }

      if (Array.isArray(parsed.choices) && parsed.choices.length) {
        var first = parsed.choices[0] || {};
        if (first.message && typeof first.message === "object") {
          var choiceText = flattenAssistantContent(first.message.content);
          if (choiceText) {
            return choiceText;
          }
        }
        if (typeof first.text === "string" && first.text.trim()) {
          return first.text.trim();
        }
      }

      return "";
    }

    if (rawText && typeof rawText === "object") {
      return contentFromParsed(rawText);
    }

    var trimmed = String(rawText || "").trim();
    if (!trimmed) return "";

    try {
      return contentFromParsed(JSON.parse(trimmed)) || trimmed;
    } catch (error) {
      return trimmed;
    }
  }

  function normalizeCatalogAiText(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokenizeCatalogAiText(value) {
    var normalized = normalizeCatalogAiText(value);
    return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  }

  function extractRequestedGameCount(userText) {
    var normalized = normalizeCatalogAiText(userText);
    if (!normalized) return 0;

    var numberMatch = normalized.match(/\b(\d{1,2})\b/);
    if (numberMatch) {
      return Math.max(0, Math.min(12, Number(numberMatch[1]) || 0));
    }

    var tokens = normalized.split(/\s+/);
    for (var index = 0; index < tokens.length; index += 1) {
      if (AI_COUNT_WORDS[tokens[index]]) {
        return AI_COUNT_WORDS[tokens[index]];
      }
    }

    return 0;
  }

  function findCatalogCategoryInQuery(userText, games) {
    var normalizedQuery = normalizeCatalogAiText(userText);
    if (!normalizedQuery || !Array.isArray(games)) return "";

    var seen = {};
    for (var index = 0; index < games.length; index += 1) {
      var category = String(games[index] && games[index].category ? games[index].category : "").trim();
      if (!category) continue;

      var normalizedCategory = normalizeCatalogAiText(category);
      if (!normalizedCategory || seen[normalizedCategory]) continue;
      seen[normalizedCategory] = category;

      if (
        normalizedQuery.indexOf(normalizedCategory) !== -1 ||
        (normalizedCategory.slice(-1) === "s" && normalizedQuery.indexOf(normalizedCategory.slice(0, -1)) !== -1) ||
        normalizedQuery.indexOf(normalizedCategory + "s") !== -1
      ) {
        return category;
      }
    }

    return "";
  }

  function scoreCatalogGameForAi(game, queryTokens, matchedCategory) {
    if (!game) return 0;

    var score = 0;
    if (matchedCategory && String(game.category || "").toLowerCase() === String(matchedCategory).toLowerCase()) {
      score += 50;
    }

    if (!queryTokens.length) {
      return score;
    }

    var title = normalizeCatalogAiText(game.title);
    var author = normalizeCatalogAiText(game.author);
    var category = normalizeCatalogAiText(game.category);
    var pathValue = normalizeCatalogAiText(game.path);

    queryTokens.forEach(function (token) {
      if (!token || AI_CATALOG_STOPWORDS[token]) return;
      if (title.indexOf(token) !== -1) score += 10;
      if (author.indexOf(token) !== -1) score += 6;
      if (category.indexOf(token) !== -1) score += 8;
      if (pathValue.indexOf(token) !== -1) score += 4;
    });

    return score;
  }

  function buildShellHelpAiResponse(userText) {
    var normalizedQuery = normalizeCatalogAiText(userText);
    if (!normalizedQuery) {
      return "";
    }

    var mentionsAddressBar =
      normalizedQuery.indexOf("address bar") !== -1 ||
      normalizedQuery.indexOf("url bar") !== -1 ||
      normalizedQuery.indexOf("search bar") !== -1 ||
      normalizedQuery.indexOf("uri") !== -1 ||
      normalizedQuery.indexOf("address") !== -1;
    var mentionsShellAction =
      /\b(type|enter|open|navigate|go|search|use|what can)\b/.test(normalizedQuery) ||
      normalizedQuery.indexOf("antarctic ") !== -1 ||
      normalizedQuery.indexOf("antarctic://") !== -1;

    if (!mentionsAddressBar || !mentionsShellAction) {
      return "";
    }

    return [
      "In the Antarctic address bar, you can type:",
      "- `antarctic://home` or `antarctic://newtab`",
      "- `antarctic://games`",
      "- `antarctic://ai`",
      "- `antarctic://settings`",
      "- `antarctic://account`",
      "- `antarctic://chats`",
      "- `antarctic://dms` as a legacy shortcut to chats",
      "- `antarctic://groupchats` as a legacy shortcut to chats",
      "- `antarctic://chat` as a legacy shortcut to chats",
      "- a normal URL like `https://duckduckgo.com`",
      "- or plain search terms like `horror games`, which Antarctic submits through the proxied search page without exposing the remote web URL in the real browser URL bar"
    ].join("\n");
  }

  function buildCatalogAiResponseFromCatalog(userText, games) {
    var normalizedQuery = normalizeCatalogAiText(userText);
    if (!normalizedQuery || !Array.isArray(games) || !games.length) {
      return "";
    }

    var matchedCategory = findCatalogCategoryInQuery(normalizedQuery, games);
    var hasGameIntent =
      /\b(game|games|catalog|library|play|recommend|suggest|show|find|list|genre|category)\b/.test(normalizedQuery) ||
      Boolean(matchedCategory);
    if (!hasGameIntent) {
      return "";
    }

    var queryTokens = tokenizeCatalogAiText(normalizedQuery);
    var scored = games.map(function (game) {
      return {
        game: game,
        score: scoreCatalogGameForAi(game, queryTokens, matchedCategory)
      };
    }).filter(function (entry) {
      return matchedCategory ? entry.score >= 50 : entry.score > 0;
    });

    if (!scored.length && matchedCategory) {
      scored = games.filter(function (game) {
        return String(game && game.category ? game.category : "").toLowerCase() === String(matchedCategory).toLowerCase();
      }).map(function (game) {
        return { game: game, score: 50 };
      });
    }

    if (!scored.length) {
      return "";
    }

    scored.sort(function (left, right) {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return String(left.game && left.game.title ? left.game.title : "").localeCompare(
        String(right.game && right.game.title ? right.game.title : "")
      );
    });

    var matches = scored.map(function (entry) {
      return entry.game;
    });
    var wantsCountOnly = /\bhow many\b/.test(normalizedQuery);
    var wantsAll = /\b(all|every|full)\b/.test(normalizedQuery);
    var requestedCount = extractRequestedGameCount(normalizedQuery);
    var limit = wantsAll ? matches.length : Math.max(1, Math.min(matches.length, requestedCount || (matchedCategory ? 5 : 6)));
    var selected = matches.slice(0, limit);

    if (wantsCountOnly && matchedCategory) {
      return "There are **" + matches.length + "** " + matchedCategory.toLowerCase() + " games in the Antarctic catalog.";
    }

    var intro;
    if (matchedCategory) {
      intro = "Here " + (selected.length === 1 ? "is" : "are") + " **" + selected.length + "** " + matchedCategory.toLowerCase() + " " + (selected.length === 1 ? "game" : "games") + " from the Antarctic catalog:";
    } else {
      intro = "Here " + (selected.length === 1 ? "is" : "are") + " **" + selected.length + "** game" + (selected.length === 1 ? "" : "s") + " from the Antarctic catalog that match your request:";
    }

    var lines = [intro];
    selected.forEach(function (game) {
      lines.push("- **" + game.title + "**" + (game.category ? " (" + game.category + ")" : ""));
    });

    if (matchedCategory && selected.length < matches.length) {
      lines.push("");
      lines.push("There are **" + matches.length + "** total " + matchedCategory.toLowerCase() + " games in the catalog.");
    }

    lines.push("");
    lines.push("I only used the local Antarctic catalog for this answer.");
    return lines.join("\n");
  }

  function extractErrorText(rawText) {
    var trimmed = String(rawText || "").trim();
    if (!trimmed) return "";

    try {
      var parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.error === "string") {
        return parsed.error;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function isRecoverableStreamError(error) {
    var message = cleanText(error && error.message ? error.message : error).toLowerCase();
    return (
      message.indexOf("failed to fetch") !== -1 ||
      message.indexOf("timed out") !== -1 ||
      message.indexOf("client disconnected") !== -1
    );
  }

  function readAiResponseText(response) {
    if (!response) {
      return Promise.resolve("");
    }

    if (typeof response.text === "function") {
      return response.text().catch(function () {
        return "";
      });
    }

    if (typeof response.json === "function") {
      return response.json().then(function (payload) {
        return JSON.stringify(payload || {});
      }).catch(function () {
        return "";
      });
    }

    return Promise.resolve(typeof response === "string" ? response : "");
  }

  async function requestAi(payload, onDelta) {
    var response;

    try {
      response = await fetch(getBackendApi().apiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (payload.stream && isRecoverableStreamError(error)) {
        return requestAi(Object.assign({}, payload, { stream: false }), null);
      }
      throw error;
    }

    if (!response || typeof response !== "object") {
      return extractAssistantText(response) || cleanText(response);
    }

    if (!response.ok) {
      var failedRaw = await readAiResponseText(response);
      throw new Error(extractErrorText(failedRaw) || failedRaw || ("AI request failed: " + response.status));
    }

    if (payload.stream && response.body && typeof response.body.getReader === "function") {
      return streamAiResponse(response, payload, onDelta);
    }

    var raw = await readAiResponseText(response);
    var err = extractErrorText(raw);
    if (err) throw new Error(err);
    return extractAssistantText(raw);
  }

  function streamAiResponse(response, payload, onDelta) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var combined = "";

    function applySegment(segment) {
      if (!segment) return;
      combined += segment;
      if (typeof onDelta === "function") {
        onDelta(combined, segment);
      }
    }

    function pump() {
      return reader.read().then(function (chunk) {
        if (chunk.done) {
          if (String(buffer || "").trim()) {
            try {
              var tail = JSON.parse(buffer.trim());
              if (typeof tail.delta === "string") {
                applySegment(tail.delta);
              } else {
                applySegment(extractAssistantText(tail));
              }
            } catch (error) {
              // Ignore malformed trailing bytes.
            }
          }
          return combined;
        }

        buffer += decoder.decode(chunk.value, { stream: true });
        var newlineIndex = buffer.indexOf("\n");

        while (newlineIndex !== -1) {
          var line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            try {
              var part = JSON.parse(line);
              if (part && part.error) {
                throw new Error(String(part.error));
              }
              if (typeof part.delta === "string") {
                applySegment(part.delta);
              } else {
                applySegment(extractAssistantText(part));
              }
            } catch (error) {
              if (!/Unexpected token|JSON/.test(String(error.message || ""))) {
                throw error;
              }
            }
          }
          newlineIndex = buffer.indexOf("\n");
        }

        return pump();
      });
    }

    return pump().catch(function (error) {
      if (isRecoverableStreamError(error)) {
        return requestAi(Object.assign({}, payload, { stream: false }), null);
      }
      throw error;
    });
  }

  function buildAiSystemPrompt(userText) {
    var lines = [
      "You are a helpful assistant for the Antarctic browser shell.",
      "Never make up games, links, or site features.",
      "Always format replies in Markdown.",
      "Prefer short, direct answers."
    ];

    if (!/\b(game|games|catalog|library|title|author|play)\b/i.test(userText || "")) {
      lines.push("If asked for game suggestions, use only the provided local catalog.");
      return Promise.resolve(lines.join("\n"));
    }

    return loadGamesCatalog().then(function (games) {
      lines.push("When answering about games, use ONLY this catalog.");
      lines.push("Catalog:");
      lines.push(
        games.map(function (game) {
          return "- " + game.title + " | " + game.category + " | " + game.author + " | " + game.path;
        }).join("\n")
      );
      return lines.join("\n");
    }).catch(function () {
      return lines.join("\n");
    });
  }

  function requestAiResponse(tab, userText, onDelta) {
    if (!getBackendApi()) {
      return Promise.reject(new Error("Backend helper not loaded."));
    }

    var shellHelpAnswer = buildShellHelpAiResponse(userText);
    if (shellHelpAnswer) {
      if (typeof onDelta === "function") {
        onDelta(shellHelpAnswer, shellHelpAnswer);
      }
      return Promise.resolve(shellHelpAnswer);
    }

    return loadGamesCatalog().then(function (games) {
      return buildCatalogAiResponseFromCatalog(userText, games);
    }).catch(function () {
      return "";
    }).then(function (catalogAnswer) {
      if (catalogAnswer) {
        if (typeof onDelta === "function") {
          onDelta(catalogAnswer, catalogAnswer);
        }
        return catalogAnswer;
      }

      return buildAiSystemPrompt(userText).then(function (systemPrompt) {
        var messages = [{ role: "system", content: systemPrompt }];
        tab.aiState.memory.slice(-6).forEach(function (message) {
          messages.push(message);
        });

        return requestAi({
          messages: messages,
          stream: true,
          keep_alive: "48h",
          options: {
            num_predict: 48,
            num_ctx: 512,
            temperature: 0
          }
        }, onDelta);
      });
    });
  }

  function refreshProxyStatus() {
    if (state.proxyRuntime.ready) {
      setProxyHealth(
        true,
        state.proxyRuntime.transportMode === "wisp"
          ? "Web browsing is ready over the websocket transport."
          : "Web browsing is ready over the HTTP fallback transport.",
        state.proxyRuntime.transportMode === "wisp" ? "Online" : "Fallback"
      );
    } else {
      setProxyHealth(false, PROXY_IDLE_MESSAGE, "Standby");
    }
    refreshAllWebFrames();
  }

  function refreshAllWebFrames() {
    state.tabs.forEach(function (tab) {
      if (tab.view !== "web" || !tab.paneEl) return;
      hydrateWebPane(tab);
    });
  }

  function renderStageOverlay(active) {
    if (!elements.stageOverlay || !elements.stageOverlayText) return;

    var show = Boolean(active && active.view === "web" && !state.proxyHealth.ok);
    elements.stageOverlay.hidden = !show;
    elements.stageOverlayText.textContent = state.proxyHealth.message;
  }

  function refreshActivePane() {
    var active = getActiveTab();
    if (!active) return;

    if (active.view === "home") {
      removePane(active);
      ensurePane(active);
    } else if (active.view === "games") {
      state.gamesCatalog = null;
      removePane(active);
      ensurePane(active);
    } else if (active.view === "account") {
      syncAccountPane(active.paneEl, "Account refreshed.");
    } else if (isChatViewName(active.view)) {
      syncChatPane(active.paneEl, active, "Chat refreshed.");
    } else if (active.view === "settings") {
      syncSettingsPane(active.paneEl, "Settings refreshed.");
    } else if (active.view === "web") {
      if (active.webState && active.webState.frameController) {
        active.webState.frameController.reload();
      } else {
        hydrateWebPane(active);
      }
    } else if (active.view === "gamelauncher") {
      var gameFrame = active.paneEl && active.paneEl.querySelector("iframe");
      if (gameFrame) gameFrame.src = resolveLocalAppUrl(active.path);
    }

    renderShell();
  }

  function bindEvents() {
    if (elements.addressForm && elements.addressInput) {
      elements.addressForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var active = getActiveTab();
        var typed = elements.addressInput.value;
        addressBarRecordSubmitOverride(active, typed);
        navigateCurrent(typed);
      });
    }

    if (elements.addressUndoButton) {
      elements.addressUndoButton.addEventListener("click", function () {
        if (navigateToolbarBack(getActiveTab())) {
          return;
        }
        addressBarUndo();
      });
    }
    if (elements.addressRedoButton) {
      elements.addressRedoButton.addEventListener("click", function () {
        addressBarRedo();
      });
    }

    if (elements.homeButton) {
      elements.homeButton.addEventListener("click", function () {
        navigateCurrent(core.buildInternalUri("home"));
      });
    }

    if (elements.toolbarSidebarToggle) {
      elements.toolbarSidebarToggle.addEventListener("click", toggleSidebar);
    }

    if (elements.refreshButton) {
      elements.refreshButton.addEventListener("click", refreshActivePane);
    }

    if (elements.newTabButton) {
      elements.newTabButton.addEventListener("click", function () {
        openNewTab(core.buildInternalUri("home"));
      });
    }

    if (elements.tabList) {
      elements.tabList.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== "function") return;

        var closeButton = target.closest("[data-close-tab]");
        if (closeButton) {
          event.stopPropagation();
          closeTab(closeButton.getAttribute("data-close-tab"));
          return;
        }

        var tabCard = target.closest("[data-tab-id]");
        if (tabCard) {
          setActiveTab(tabCard.getAttribute("data-tab-id"));
        }
      });
    }

    if (elements.routeList) {
      elements.routeList.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== "function") return;
        var routeButton = target.closest("[data-route]");
        if (!routeButton) return;
        navigateCurrent(routeButton.getAttribute("data-route"));
      });
    }

    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        if (elements.addressInput) {
          elements.addressInput.focus();
          elements.addressInput.select();
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
        event.preventDefault();
        openNewTab(core.buildInternalUri("home"));
      }
    });
  }

  function padTimeUnit(value) {
    var n = Number(value);
    return (n < 10 ? "0" : "") + n;
  }

  function startShellClock() {
    var el = document.getElementById("shell-clock");
    if (!el) return;

    function tick() {
      var now = new Date();
      var text =
        padTimeUnit(now.getHours()) +
        ":" +
        padTimeUnit(now.getMinutes()) +
        ":" +
        padTimeUnit(now.getSeconds());
      el.textContent = text;
      try {
        el.setAttribute("datetime", now.toISOString());
      } catch (err) {
        el.removeAttribute("datetime");
      }
    }

    tick();
    window.setInterval(tick, 1000);
  }

  ensureProxyStorageCompatibility().catch(function () {
    return null;
  }).finally(function () {
    restoreTabs();
    bindResponsiveShellScale();
    bindEvents();
    startShellClock();
    renderShell();
    refreshProxyStatus();
  });
})();
