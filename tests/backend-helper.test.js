const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const BACKEND_HELPER_PATH = path.join(__dirname, "..", "backend.js");
const BACKEND_HELPER_SOURCE = fs.readFileSync(BACKEND_HELPER_PATH, "utf8");

function createLocation(origin, search) {
  const parsed = new URL(origin);
  return {
    origin: parsed.origin,
    hostname: parsed.hostname,
    port: parsed.port,
    search: search || ""
  };
}

function createStorage(seed) {
  const values = new Map(Object.entries(seed || {}));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    removeItem(key) {
      values.delete(String(key));
    }
  };
}

function loadBackendApi(options = {}) {
  const localStorage = createStorage(options.localStorage);
  const context = {
    URL,
    URLSearchParams,
    fetch: async function unusedFetch() {
      throw new Error("fetch should not be called in backend helper unit tests");
    },
    document: {
      querySelector() {
        return null;
      }
    },
    window: {
      location: createLocation(options.origin || "https://antarctic.games", options.search || ""),
      localStorage: localStorage,
      AntarcticGamesStorage: null,
      PalladiumSiteStorage: null,
      ANTARCTIC_GAMES_BACKEND_BASE: options.globalBase || "",
      PALLADIUM_BACKEND_BASE: ""
    }
  };
  context.window.window = context.window;

  vm.runInNewContext(BACKEND_HELPER_SOURCE, context, {
    filename: BACKEND_HELPER_PATH
  });

  return {
    api: context.window.AntarcticGamesBackend,
    localStorage: localStorage
  };
}

test("backend helper defaults hosted frontends to api.antarctic.games", () => {
  const { api } = loadBackendApi({
    origin: "https://sethpang.com"
  });

  assert.equal(api.getBaseUrl(), "https://api.antarctic.games");
});

test("backend helper keeps api.antarctic.games on-origin", () => {
  const { api } = loadBackendApi({
    origin: "https://api.antarctic.games"
  });

  assert.equal(api.getBaseUrl(), "https://api.antarctic.games");
});

test("backend helper prefers same-origin API routes on Netlify frontends", () => {
  const { api } = loadBackendApi({
    origin: "https://antarctic-games.netlify.app"
  });

  assert.equal(api.getBaseUrl(), "https://antarctic-games.netlify.app");
});

test("backend helper keeps production antarctic.games on the live same-origin backend", () => {
  const { api } = loadBackendApi({
    origin: "https://www.antarctic.games"
  });

  assert.equal(api.getBaseUrl(), "https://www.antarctic.games");
});

test("backend helper migrates old saved backend hosts to api.antarctic.games", () => {
  const { api, localStorage } = loadBackendApi({
    origin: "https://sethpang.com",
    localStorage: {
      "antarctic-backend-base": "https://api.sethpang.com"
    }
  });

  assert.equal(api.getBaseUrl(), "https://api.antarctic.games");
  assert.equal(localStorage.getItem("antarctic-backend-base"), "https://api.antarctic.games");
});

test("backend helper migrates old saved backend hosts back onto antarctic.games", () => {
  const { api, localStorage } = loadBackendApi({
    origin: "https://www.antarctic.games",
    localStorage: {
      "antarctic-backend-base": "https://api.antarctic.games"
    }
  });

  assert.equal(api.getBaseUrl(), "https://www.antarctic.games");
  assert.equal(localStorage.getItem("antarctic-backend-base"), "https://www.antarctic.games");
});

test("backend helper migrates the old Netlify bridge back onto antarctic.games", () => {
  const { api, localStorage } = loadBackendApi({
    origin: "https://antarctic.games",
    localStorage: {
      "antarctic-backend-base": "https://antarctic-games.netlify.app"
    }
  });

  assert.equal(api.getBaseUrl(), "https://antarctic.games");
  assert.equal(localStorage.getItem("antarctic-backend-base"), "https://antarctic.games");
});

test("backend helper migrates old query overrides to api.antarctic.games", () => {
  const { api, localStorage } = loadBackendApi({
    origin: "https://sethpang.com",
    search: "?backend=https%3A%2F%2Fsethpang.com"
  });

  assert.equal(api.getBaseUrl(), "https://api.antarctic.games");
  assert.equal(localStorage.getItem("antarctic-backend-base"), "https://api.antarctic.games");
});
