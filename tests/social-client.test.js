const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(FRONTEND_DIR, "social-client.js"), "utf8");

function createStorageApi(initialValues = {}) {
  const map = new Map(Object.entries(initialValues).map(([key, value]) => [String(key), String(value)]));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : "";
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    snapshot() {
      return new Map(map);
    }
  };
}

function createWindow(storage) {
  const listeners = new Map();
  return {
    AntarcticGamesStorage: storage,
    AntarcticGamesBackend: {
      apiUrl(pathValue) {
        return `https://api.example.test${pathValue}`;
      }
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {}
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      if (!listeners.has(type)) {
        return;
      }
      listeners.get(type).delete(listener);
    },
    dispatchStorageEvent(event) {
      const callbacks = listeners.get("storage");
      if (!callbacks) {
        return;
      }
      Array.from(callbacks).forEach((listener) => listener(event));
    }
  };
}

function createClient(fetchImpl, options = {}) {
  const storage = options.storage || createStorageApi();
  const window = options.window || createWindow(storage);
  const context = { console, fetch: fetchImpl, window };

  vm.runInNewContext(source, context, { filename: "social-client.js" });

  return {
    api: window.AntarcticSocialClient,
    storage,
    window
  };
}

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    }
  };
}

async function flushAsyncWork() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test("social client reuses the bootstrap payload returned by login", async () => {
  const calls = [];
  const { api } = createClient(async (url, init = {}) => {
    calls.push({ url, init });
    return createJsonResponse(200, {
      ok: true,
      authenticated: true,
      token: "snow-token",
      user: {
        id: 7,
        username: "snowfox",
        createdAt: "2026-03-21T16:30:00.000Z"
      },
      bootstrap: {
        threads: [
          { id: 1, type: "room", name: "Lobby" }
        ],
        rooms: [
          { id: 1, name: "Lobby", joined: true, memberCount: 1 }
        ],
        saves: [],
        incomingDirectRequests: [
          {
            id: 4,
            status: "pending",
            requester: { id: 9, username: "blizzard", createdAt: "2026-03-21T16:31:00.000Z" },
            target: { id: 7, username: "snowfox", createdAt: "2026-03-21T16:30:00.000Z" }
          }
        ],
        stats: {
          threadCount: 1,
          roomCount: 1,
          joinedRoomCount: 1,
          directCount: 0,
          incomingDirectRequestCount: 1,
          saveCount: 0
        }
      }
    });
  });

  const loggedIn = await api.login("snowfox", "icepass123");
  assert.equal(loggedIn.authenticated, true);
  assert.equal(loggedIn.user.username, "snowfox");
  assert.equal(loggedIn.bootstrap.stats.threadCount, 1);
  assert.equal(loggedIn.bootstrap.incomingDirectRequests.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.example.test/api/account/login");

  const cachedBootstrap = await api.getBootstrap();
  assert.equal(cachedBootstrap.authenticated, true);
  assert.equal(cachedBootstrap.bootstrap.rooms.length, 1);
  assert.equal(cachedBootstrap.bootstrap.stats.incomingDirectRequestCount, 1);
  assert.equal(calls.length, 1);
});

test("social client clears cached session and bootstrap state on logout", async () => {
  const responses = [
    createJsonResponse(200, {
      ok: true,
      authenticated: true,
      token: "ice-token",
      user: {
        id: 4,
        username: "blizzard",
        createdAt: "2026-03-21T16:35:00.000Z"
      },
      bootstrap: {
        threads: [{ id: 3, type: "direct", peer: { username: "snowfox" } }],
        rooms: [],
        saves: [{ gameKey: "games/platformer/ovo.html", summary: "OvO cloud", updatedAt: "2026-03-21T16:36:00.000Z" }],
        incomingDirectRequests: [],
        stats: {
          threadCount: 1,
          roomCount: 0,
          joinedRoomCount: 0,
          directCount: 1,
          incomingDirectRequestCount: 0,
          saveCount: 1
        }
      }
    }),
    createJsonResponse(200, { ok: true })
  ];

  const calls = [];
  const { api } = createClient(async (url, init = {}) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) {
      throw new Error(`Unexpected fetch for ${url}`);
    }
    return next;
  });

  await api.login("blizzard", "windpass123");
  const loggedOut = await api.logout();
  assert.equal(loggedOut.authenticated, false);
  assert.equal(loggedOut.token, "");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "https://api.example.test/api/account/logout");

  const bootstrap = await api.getBootstrap();
  assert.equal(bootstrap.authenticated, false);
  assert.equal(bootstrap.bootstrap.threads.length, 0);
  assert.equal(bootstrap.bootstrap.saves.length, 0);
  assert.equal(bootstrap.bootstrap.incomingDirectRequests.length, 0);
  assert.equal(calls.length, 2);
});

test("social client short-circuits anonymous session and bootstrap checks without a token", async () => {
  const calls = [];
  const { api } = createClient(async (url) => {
    calls.push(url);
    throw new Error(`Unexpected fetch for ${url}`);
  });

  const session = await api.getSession();
  const bootstrap = await api.getBootstrap();

  assert.equal(session.authenticated, false);
  assert.equal(session.token, "");
  assert.equal(bootstrap.authenticated, false);
  assert.equal(bootstrap.bootstrap.threads.length, 0);
  assert.equal(bootstrap.bootstrap.incomingDirectRequests.length, 0);
  assert.equal(calls.length, 0);
});

test("social client refreshes stale anonymous cache after another tab stores a token", async () => {
  const storage = createStorageApi();
  const calls = [];
  const { api } = createClient(async (url, init = {}) => {
    calls.push({ url, init });
    return createJsonResponse(200, {
      ok: true,
      authenticated: true,
      token: "shared-snow-token",
      user: {
        id: 12,
        username: "aurora",
        createdAt: "2026-03-21T17:00:00.000Z"
      },
      bootstrap: {
        threads: [{ id: 11, type: "room", name: "Aurora Lounge" }],
        rooms: [{ id: 11, name: "Aurora Lounge", joined: true, memberCount: 3 }],
        saves: [],
        incomingDirectRequests: [],
        stats: {
          threadCount: 1,
          roomCount: 1,
          joinedRoomCount: 1,
          directCount: 0,
          incomingDirectRequestCount: 0,
          saveCount: 0
        }
      }
    });
  }, { storage });

  const anonymous = await api.getBootstrap();
  assert.equal(anonymous.authenticated, false);
  assert.equal(calls.length, 0);

  storage.setItem("antarctic.account.session.v1", "shared-snow-token");

  const refreshed = await api.getBootstrap();
  assert.equal(refreshed.authenticated, true);
  assert.equal(refreshed.user.username, "aurora");
  assert.equal(refreshed.bootstrap.rooms.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.example.test/api/community/bootstrap");
  assert.equal(calls[0].init.headers["x-antarctic-session"], "shared-snow-token");
});

test("social client syncs active listeners when another tab changes auth storage", async () => {
  const storage = createStorageApi();
  const calls = [];
  const { api, window } = createClient(async (url, init = {}) => {
    calls.push({ url, init });
    return createJsonResponse(200, {
      ok: true,
      authenticated: true,
      token: "shared-ice-token",
      user: {
        id: 13,
        username: "glacier",
        createdAt: "2026-03-21T17:05:00.000Z"
      },
      bootstrap: {
        threads: [{ id: 19, type: "direct", peer: { username: "snowfox" } }],
        rooms: [],
        saves: [],
        incomingDirectRequests: [],
        stats: {
          threadCount: 1,
          roomCount: 0,
          joinedRoomCount: 0,
          directCount: 1,
          incomingDirectRequestCount: 0,
          saveCount: 0
        }
      }
    });
  }, { storage });

  const updates = [];
  api.onSessionChange((session) => {
    updates.push(session);
  });

  await api.getBootstrap();
  storage.setItem("antarctic.account.session.v1", "shared-ice-token");
  window.dispatchStorageEvent({
    key: "antarctic.account.session.v1",
    oldValue: "",
    newValue: "shared-ice-token"
  });

  await flushAsyncWork();

  assert.equal(calls.length, 1);
  assert.equal(updates.at(-1).authenticated, true);
  assert.equal(updates.at(-1).user.username, "glacier");

  storage.removeItem("antarctic.account.session.v1");
  window.dispatchStorageEvent({
    key: "antarctic.account.session.v1",
    oldValue: "shared-ice-token",
    newValue: ""
  });

  await flushAsyncWork();

  assert.equal(updates.at(-1).authenticated, false);
  assert.equal(updates.at(-1).token, "");
});

test("social client sends room visibility and invite usernames when creating a room", async () => {
  const calls = [];
  const { api } = createClient(async (url, init = {}) => {
    calls.push({ url, init });
    return createJsonResponse(201, {
      ok: true,
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
    });
  });

  await api.createRoom("Secret Ops", {
    visibility: "private",
    invitedUsers: ["guest", "aurora"]
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.example.test/api/chat/rooms");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    name: "Secret Ops",
    visibility: "private",
    invitedUsers: ["guest", "aurora"]
  });
});
