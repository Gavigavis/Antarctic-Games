const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(FRONTEND_DIR, "shell.js"), "utf8");

function extractFunctionSource(name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  if (start === -1) {
    throw new Error(`Could not find function ${name}`);
  }

  let braceIndex = source.indexOf("{", start);
  let depth = 0;
  let end = braceIndex;
  for (; end < source.length; end += 1) {
    const char = source[end];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }

  return source.slice(start, end);
}

function loadPrivateSearchHelpers() {
  const context = {
    URL,
    URLSearchParams,
    Event: function Event(type, init) {
      this.type = type;
      this.bubbles = Boolean(init && init.bubbles);
    },
    core: {
      inferWebTitle(value) {
        try {
          return new URL(value).hostname || value;
        } catch (error) {
          return String(value || "");
        }
      }
    },
    decodeScramjetUrl(value) {
      return String(value == null ? "" : value).trim();
    },
    renderShellCalls: 0,
    renderShell() {
      context.renderShellCalls += 1;
    },
    window: {
      location: {
        origin: "https://antarctic.games",
        pathname: "/"
      }
    }
  };
  const script = [
    "function cleanText(value) { return String(value == null ? '' : value).trim(); }",
    extractFunctionSource("pushUniqueValue"),
    extractFunctionSource("getProxyOrigin"),
    extractFunctionSource("getLocalShellDocumentPaths"),
    extractFunctionSource("isLocalShellUrl"),
    extractFunctionSource("isDuckDuckGoHost"),
    extractFunctionSource("extractPrivateSearchDetails"),
    extractFunctionSource("resolveVisibleWebUri"),
    extractFunctionSource("resolveShellAddressWebUri"),
    extractFunctionSource("getTabBrowserUri"),
    extractFunctionSource("getPublicBrowserUri"),
    extractFunctionSource("syncBrowserUrl"),
    extractFunctionSource("findPrivateSearchField"),
    extractFunctionSource("submitPrivateSearchFromFrame"),
    extractFunctionSource("syncWebTabFromUrl"),
    "this.isLocalShellUrl = isLocalShellUrl;",
    "this.extractPrivateSearchDetails = extractPrivateSearchDetails;",
    "this.resolveVisibleWebUri = resolveVisibleWebUri;",
    "this.resolveShellAddressWebUri = resolveShellAddressWebUri;",
    "this.getTabBrowserUri = getTabBrowserUri;",
    "this.getPublicBrowserUri = getPublicBrowserUri;",
    "this.syncBrowserUrl = syncBrowserUrl;",
    "this.submitPrivateSearchFromFrame = submitPrivateSearchFromFrame;",
    "this.syncWebTabFromUrl = syncWebTabFromUrl;"
  ].join("\n\n");

  vm.runInNewContext(script, context, { filename: "web-search-privacy-helpers.js" });
  return context;
}

test("resolveVisibleWebUri keeps DuckDuckGo queries out of the real browser URL bar", () => {
  const { resolveVisibleWebUri } = loadPrivateSearchHelpers();
  const tab = {
    searchProvider: "",
    searchQuery: ""
  };

  const visibleUrl = resolveVisibleWebUri(tab, "https://duckduckgo.com/?q=best+horror+games&t=ffab");

  assert.equal(visibleUrl, "https://duckduckgo.com/");
  assert.equal(tab.searchProvider, "duckduckgo");
  assert.equal(tab.searchQuery, "best horror games");
});

test("resolveShellAddressWebUri keeps the shell address bar on the search text", () => {
  const { resolveShellAddressWebUri } = loadPrivateSearchHelpers();
  const tab = {
    searchProvider: "",
    searchQuery: "",
    webState: {
      pendingSearchQuery: ""
    }
  };

  const shellUri = resolveShellAddressWebUri(tab, "https://duckduckgo.com/?q=best+horror+games&t=ffab");

  assert.equal(shellUri, "best horror games");
  assert.equal(tab.searchProvider, "duckduckgo");
  assert.equal(tab.searchQuery, "best horror games");
});

test("syncBrowserUrl strips the uri parameter entirely for web tabs", () => {
  const context = loadPrivateSearchHelpers();
  const { syncBrowserUrl } = context;
  const calls = [];

  const tab = {
    view: "web",
    uri: "best horror games",
    browserUri: "https://duckduckgo.com/"
  };

  const windowStub = {
    history: {
      replaceState(_state, _title, url) {
        calls.push(url);
      }
    },
    location: {
      pathname: "/",
      search: ""
    }
  };

  context.window = windowStub;
  context.getActiveTab = function getActiveTab() {
    return tab;
  };

  syncBrowserUrl();

  assert.deepEqual(calls, ["/"]);
});

test("getPublicBrowserUri still preserves shareable internal routes", () => {
  const { getPublicBrowserUri } = loadPrivateSearchHelpers();

  assert.equal(getPublicBrowserUri({ view: "home", uri: "antarctic://home" }), "antarctic://home");
  assert.equal(getPublicBrowserUri({ view: "web", browserUri: "https://duckduckgo.com/" }), "");
});

test("resolveVisibleWebUri leaves normal destinations unchanged", () => {
  const { resolveVisibleWebUri } = loadPrivateSearchHelpers();
  const tab = {
    searchProvider: "",
    searchQuery: ""
  };

  const visibleUrl = resolveVisibleWebUri(tab, "https://example.com/docs");

  assert.equal(visibleUrl, "https://example.com/docs");
  assert.equal(tab.searchProvider, "");
  assert.equal(tab.searchQuery, "");
});

test("isLocalShellUrl recognizes the current shell document without matching other same-origin pages", () => {
  const { isLocalShellUrl } = loadPrivateSearchHelpers();

  assert.equal(isLocalShellUrl("https://antarctic.games/"), true);
  assert.equal(isLocalShellUrl("https://antarctic.games/index.html?uri=antarctic://home"), true);
  assert.equal(isLocalShellUrl("https://antarctic.games/docs"), false);
});

test("syncWebTabFromUrl ignores shell bootstrap URLs when a remote site is already active", () => {
  const context = loadPrivateSearchHelpers();
  const tab = {
    targetUrl: "https://duckduckgo.com/",
    browserUri: "https://duckduckgo.com/",
    uri: "best horror games",
    title: "duckduckgo.com",
    webState: {
      currentTarget: "https://duckduckgo.com/",
      pendingSearchQuery: "best horror games"
    }
  };

  context.syncWebTabFromUrl(tab, "https://antarctic.games/?uri=best%20horror%20games");

  assert.equal(tab.targetUrl, "https://duckduckgo.com/");
  assert.equal(tab.browserUri, "https://duckduckgo.com/");
  assert.equal(tab.uri, "best horror games");
  assert.equal(context.renderShellCalls, 0);
});

test("submitPrivateSearchFromFrame populates the proxied search form before submitting", () => {
  const { submitPrivateSearchFromFrame } = loadPrivateSearchHelpers();
  const dispatchedEvents = [];
  let requestSubmitCalls = 0;
  const attributes = {};
  let focused = false;

  const field = {
    form: {
      requestSubmit() {
        requestSubmitCalls += 1;
      }
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event.type);
      return true;
    },
    focus() {
      focused = true;
    },
    value: ""
  };

  const frame = {
    contentDocument: {
      querySelector(selector) {
        if (selector.indexOf('input[name="q"]') !== -1) {
          return field;
        }
        return null;
      }
    }
  };

  assert.equal(submitPrivateSearchFromFrame(frame, "proxy privacy"), true);
  assert.equal(field.value, "proxy privacy");
  assert.equal(attributes.value, "proxy privacy");
  assert.equal(focused, true);
  assert.deepEqual(dispatchedEvents, ["input", "change"]);
  assert.equal(requestSubmitCalls, 1);
});
