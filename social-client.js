(function () {
  var STORAGE_KEY = "antarctic.account.session.v1";
  var LEGACY_STORAGE_KEY = "palladium.account.session.v1";
  var SESSION_HEADER = "x-antarctic-session";
  var cachedSession = undefined;
  var sessionRequest = null;
  var cachedBootstrap = undefined;
  var bootstrapRequest = null;
  var listeners = [];

  function cleanText(value) {
    return String(value == null ? "" : value).trim();
  }

  function clonePlain(value) {
    try {
      return JSON.parse(JSON.stringify(value == null ? null : value));
    } catch (error) {
      return value == null ? null : value;
    }
  }

  function getStorageApi() {
    return window.AntarcticGamesStorage || window.PalladiumSiteStorage || null;
  }

  function getBackendApi() {
    return window.AntarcticGamesBackend || window.PalladiumBackend || null;
  }

  function readStoredToken() {
    var storage = getStorageApi();
    if (storage && typeof storage.getItem === "function") {
      return cleanText(storage.getItem(STORAGE_KEY, { legacyKeys: [LEGACY_STORAGE_KEY] }));
    }

    try {
      return cleanText(window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY));
    } catch (error) {
      return "";
    }
  }

  function writeStoredToken(token) {
    var normalized = cleanText(token);
    var storage = getStorageApi();
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(STORAGE_KEY, normalized, { legacyKeys: [LEGACY_STORAGE_KEY] });
      return normalized;
    }

    try {
      if (normalized) {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }

    return normalized;
  }

  function hasStoredToken() {
    return Boolean(readStoredToken());
  }

  function clearCachedCommunityState() {
    cachedSession = undefined;
    cachedBootstrap = undefined;
    sessionRequest = null;
    bootstrapRequest = null;
  }

  function syncCachedSessionWithStorage() {
    var storedToken = readStoredToken();
    var cachedToken = cleanText(cachedSession && cachedSession.token);

    if (!storedToken) {
      if (cachedSession !== undefined || cachedBootstrap !== undefined) {
        setSessionFromPayload({ authenticated: false, user: null, token: "" });
      }
      return "";
    }

    if (cachedSession !== undefined && storedToken !== cachedToken) {
      clearCachedCommunityState();
    }

    return storedToken;
  }

  function emitSessionChange(session) {
    listeners.slice().forEach(function (listener) {
      try {
        listener(session || null);
      } catch (error) {
        // Ignore listener failures.
      }
    });
  }

  function createEmptyBootstrap() {
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

  function deriveBootstrapStats(bootstrap) {
    var threads = Array.isArray(bootstrap && bootstrap.threads) ? bootstrap.threads : [];
    var rooms = Array.isArray(bootstrap && bootstrap.rooms) ? bootstrap.rooms : [];
    var saves = Array.isArray(bootstrap && bootstrap.saves) ? bootstrap.saves : [];
    var incomingDirectRequests = Array.isArray(bootstrap && bootstrap.incomingDirectRequests)
      ? bootstrap.incomingDirectRequests
      : [];

    return {
      threadCount: threads.length,
      roomCount: rooms.length,
      joinedRoomCount: rooms.filter(function (room) {
        return room && room.joined;
      }).length,
      directCount: threads.filter(function (thread) {
        return thread && thread.type === "direct";
      }).length,
      incomingDirectRequestCount: incomingDirectRequests.length,
      saveCount: saves.length
    };
  }

  function normalizeBootstrap(raw) {
    var bootstrap = createEmptyBootstrap();
    if (raw && typeof raw === "object") {
      if (Array.isArray(raw.threads)) bootstrap.threads = clonePlain(raw.threads) || [];
      if (Array.isArray(raw.rooms)) bootstrap.rooms = clonePlain(raw.rooms) || [];
      if (Array.isArray(raw.saves)) bootstrap.saves = clonePlain(raw.saves) || [];
      if (Array.isArray(raw.incomingDirectRequests)) {
        bootstrap.incomingDirectRequests = clonePlain(raw.incomingDirectRequests) || [];
      }
      bootstrap.stats = Object.assign(
        deriveBootstrapStats(bootstrap),
        raw.stats && typeof raw.stats === "object" ? clonePlain(raw.stats) : {}
      );
      return bootstrap;
    }

    bootstrap.stats = deriveBootstrapStats(bootstrap);
    return bootstrap;
  }

  function getBootstrapSnapshot() {
    return normalizeBootstrap(cachedBootstrap);
  }

  function setBootstrapCache(next) {
    cachedBootstrap = normalizeBootstrap(next);
    return getBootstrapSnapshot();
  }

  function mergeBootstrapPatch(patch) {
    var base = getBootstrapSnapshot();
    var next = {
      threads: Object.prototype.hasOwnProperty.call(patch, "threads") ? patch.threads : base.threads,
      rooms: Object.prototype.hasOwnProperty.call(patch, "rooms") ? patch.rooms : base.rooms,
      saves: Object.prototype.hasOwnProperty.call(patch, "saves") ? patch.saves : base.saves,
      incomingDirectRequests: Object.prototype.hasOwnProperty.call(patch, "incomingDirectRequests")
        ? patch.incomingDirectRequests
        : base.incomingDirectRequests,
      stats: Object.prototype.hasOwnProperty.call(patch, "stats") ? patch.stats : deriveBootstrapStats({
        threads: Object.prototype.hasOwnProperty.call(patch, "threads") ? patch.threads : base.threads,
        rooms: Object.prototype.hasOwnProperty.call(patch, "rooms") ? patch.rooms : base.rooms,
        saves: Object.prototype.hasOwnProperty.call(patch, "saves") ? patch.saves : base.saves,
        incomingDirectRequests: Object.prototype.hasOwnProperty.call(patch, "incomingDirectRequests")
          ? patch.incomingDirectRequests
          : base.incomingDirectRequests
      })
    };

    return setBootstrapCache(next);
  }

  function setBootstrapFromPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return getBootstrapSnapshot();
    }

    if (payload.bootstrap && typeof payload.bootstrap === "object") {
      return setBootstrapCache(payload.bootstrap);
    }

    var patch = {};
    var hasPatch = false;
    ["threads", "rooms", "saves", "incomingDirectRequests", "stats"].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        patch[key] = payload[key];
        hasPatch = true;
      }
    });

    return hasPatch ? mergeBootstrapPatch(patch) : getBootstrapSnapshot();
  }

  function currentSession() {
    if (!cachedSession) {
      return {
        authenticated: false,
        token: "",
        user: null
      };
    }

    return {
      authenticated: Boolean(cachedSession.authenticated),
      token: cleanText(cachedSession.token),
      user: cachedSession.user ? clonePlain(cachedSession.user) : null
    };
  }

  function currentCommunityState() {
    var session = currentSession();
    return {
      authenticated: session.authenticated,
      token: session.token,
      user: session.user,
      bootstrap: getBootstrapSnapshot()
    };
  }

  function setSessionFromPayload(payload) {
    var authenticated = Boolean(payload && payload.authenticated);
    var token = cleanText(payload && payload.token);

    if (authenticated) {
      if (token) {
        writeStoredToken(token);
      }
      cachedSession = {
        authenticated: true,
        token: token || readStoredToken(),
        user: payload && payload.user ? clonePlain(payload.user) : null
      };
      setBootstrapFromPayload(payload);
    } else {
      writeStoredToken("");
      cachedSession = {
        authenticated: false,
        token: "",
        user: null
      };
      setBootstrapCache(createEmptyBootstrap());
    }

    emitSessionChange(currentSession());
    return currentSession();
  }

  function refreshSessionFromStorage() {
    var storedToken = syncCachedSessionWithStorage();
    if (!storedToken) {
      return Promise.resolve(currentCommunityState());
    }

    if (
      cachedSession &&
      cachedSession.authenticated &&
      cleanText(cachedSession.token) === storedToken &&
      cachedSession.user
    ) {
      return Promise.resolve(currentCommunityState());
    }

    return getBootstrap(true).catch(function () {
      return currentCommunityState();
    });
  }

  async function requestJson(pathValue, init) {
    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.apiUrl !== "function") {
      throw new Error("Backend helper unavailable.");
    }

    var options = init || {};
    var headers = {};
    var inputHeaders = options.headers || {};
    Object.keys(inputHeaders).forEach(function (key) {
      headers[key] = inputHeaders[key];
    });

    var token = readStoredToken();
    if (token && !headers[SESSION_HEADER] && !headers.authorization) {
      headers[SESSION_HEADER] = token;
    }

    var response = await fetch(backendApi.apiUrl(pathValue), Object.assign({}, options, {
      headers: headers,
      credentials: "same-origin"
    }));
    var text = "";
    if (response && typeof response.text === "function") {
      text = await response.text();
    } else if (response && typeof response.json === "function") {
      try {
        text = JSON.stringify(await response.json());
      } catch (error) {
        text = "";
      }
    } else if (typeof response === "string") {
      text = response;
    }
    var payload = {};

    try {
      payload = text ? JSON.parse(text) : {};
    } catch (error) {
      payload = {};
    }

    if (response.status === 401) {
      setSessionFromPayload({ authenticated: false, user: null, token: "" });
    }

    if (!response.ok) {
      throw new Error(cleanText(payload && payload.error) || ("Request failed with status " + response.status));
    }

    if (payload && typeof payload.authenticated === "boolean") {
      setSessionFromPayload(payload);
    } else {
      setBootstrapFromPayload(payload);
    }

    return payload;
  }

  async function getSession(forceRefresh) {
    syncCachedSessionWithStorage();
    if (!forceRefresh && cachedSession !== undefined) {
      return currentSession();
    }

    if (!hasStoredToken()) {
      setSessionFromPayload({ authenticated: false, user: null, token: "" });
      return currentSession();
    }

    if (sessionRequest) {
      return sessionRequest;
    }

    sessionRequest = requestJson("/api/account/session", { method: "GET" }).then(function () {
      return currentSession();
    }).catch(function (error) {
      if (!readStoredToken()) {
        setSessionFromPayload({ authenticated: false, user: null, token: "" });
        return currentSession();
      }
      throw error;
    }).finally(function () {
      sessionRequest = null;
    });

    return sessionRequest;
  }

  async function getBootstrap(forceRefresh) {
    syncCachedSessionWithStorage();
    if (!forceRefresh && cachedSession !== undefined && cachedBootstrap !== undefined) {
      return currentCommunityState();
    }

    if (!hasStoredToken()) {
      setSessionFromPayload({ authenticated: false, user: null, token: "" });
      return currentCommunityState();
    }

    if (bootstrapRequest) {
      return bootstrapRequest;
    }

    bootstrapRequest = requestJson("/api/community/bootstrap", { method: "GET" }).then(function () {
      return currentCommunityState();
    }).catch(function (error) {
      if (!readStoredToken()) {
        setSessionFromPayload({ authenticated: false, user: null, token: "" });
        return currentCommunityState();
      }
      throw error;
    }).finally(function () {
      bootstrapRequest = null;
    });

    return bootstrapRequest;
  }

  async function signUp(username, password) {
    await requestJson("/api/account/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: cleanText(username), password: cleanText(password) })
    });
    return currentCommunityState();
  }

  async function login(username, password) {
    await requestJson("/api/account/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: cleanText(username), password: cleanText(password) })
    });
    return currentCommunityState();
  }

  async function logout() {
    try {
      await requestJson("/api/account/logout", { method: "POST" });
    } finally {
      writeStoredToken("");
      cachedSession = {
        authenticated: false,
        token: "",
        user: null
      };
      cachedBootstrap = createEmptyBootstrap();
      emitSessionChange(currentSession());
    }
    return currentSession();
  }

  if (window && typeof window.addEventListener === "function") {
    window.addEventListener("storage", function (event) {
      var key = cleanText(event && event.key);
      if (key && key !== STORAGE_KEY && key !== LEGACY_STORAGE_KEY) {
        return;
      }
      refreshSessionFromStorage();
    });
  }

  function requirePathSegment(value) {
    var normalized = cleanText(value);
    if (!normalized) {
      throw new Error("Missing path value.");
    }
    return normalized;
  }

  var api = {
    onSessionChange: function (listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.push(listener);
      return function () {
        listeners = listeners.filter(function (candidate) {
          return candidate !== listener;
        });
      };
    },
    getSession: getSession,
    getBootstrap: getBootstrap,
    signUp: signUp,
    login: login,
    logout: logout,
    searchUsers: function (query) {
      return requestJson("/api/account/search-users?q=" + encodeURIComponent(cleanText(query)), { method: "GET" });
    },
    listThreads: function () {
      return requestJson("/api/chat/threads", { method: "GET" });
    },
    createRoom: function (name, options) {
      var roomOptions = options && typeof options === "object" ? options : {};
      var invitedUsers = Array.isArray(roomOptions.invitedUsers)
        ? roomOptions.invitedUsers.map(function (entry) {
            return cleanText(entry);
          }).filter(Boolean)
        : [];
      return requestJson("/api/chat/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: cleanText(name),
          visibility: cleanText(roomOptions.visibility || "public") || "public",
          invitedUsers: invitedUsers
        })
      });
    },
    createDirect: function (username) {
      return requestJson("/api/chat/dms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: cleanText(username) })
      });
    },
    acceptDirectRequest: function (requestId) {
      return requestJson("/api/chat/dms/" + encodeURIComponent(String(requestId)) + "/accept", {
        method: "POST"
      });
    },
    denyDirectRequest: function (requestId) {
      return requestJson("/api/chat/dms/" + encodeURIComponent(String(requestId)) + "/deny", {
        method: "POST"
      });
    },
    joinRoom: function (threadId) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/join", { method: "POST" });
    },
    leaveRoom: function (threadId) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/leave", { method: "POST" });
    },
    listMessages: function (threadId) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/messages", { method: "GET" });
    },
    sendMessage: function (threadId, content) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: cleanText(content) })
      }).then(function (payload) {
        if (payload && payload.thread && payload.message) {
          var snapshot = getBootstrapSnapshot();
          var nextThreads = snapshot.threads.map(function (thread) {
            if (String(thread.id) !== String(payload.thread.id)) {
              return thread;
            }
            var patched = clonePlain(payload.thread) || {};
            patched.lastMessage = clonePlain(payload.message);
            return patched;
          });
          mergeBootstrapPatch({ threads: nextThreads });
        }
        return payload;
      });
    },
    listSaves: function () {
      return requestJson("/api/saves", { method: "GET" });
    },
    getSave: function (gameKey) {
      return requestJson("/api/saves/" + encodeURIComponent(requirePathSegment(gameKey)), { method: "GET" });
    },
    putSave: function (gameKey, data, summary) {
      var normalizedKey = requirePathSegment(gameKey);
      return requestJson("/api/saves/" + encodeURIComponent(normalizedKey), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: data, summary: cleanText(summary) })
      }).then(function (payload) {
        if (payload && payload.save) {
          var snapshot = getBootstrapSnapshot();
          var nextSave = {
            gameKey: cleanText(payload.save.gameKey || normalizedKey),
            summary: cleanText(payload.save.summary),
            updatedAt: cleanText(payload.save.updatedAt),
            sizeBytes: JSON.stringify(payload.save.data == null ? null : payload.save.data).length
          };
          var nextSaves = snapshot.saves.filter(function (save) {
            return String(save.gameKey) !== String(nextSave.gameKey);
          });
          nextSaves.unshift(nextSave);
          mergeBootstrapPatch({ saves: nextSaves });
        }
        return payload;
      });
    },
    deleteSave: function (gameKey) {
      var normalizedKey = requirePathSegment(gameKey);
      return requestJson("/api/saves/" + encodeURIComponent(normalizedKey), { method: "DELETE" }).then(function (payload) {
        var snapshot = getBootstrapSnapshot();
        mergeBootstrapPatch({
          saves: snapshot.saves.filter(function (save) {
            return String(save.gameKey) !== String(normalizedKey);
          })
        });
        return payload;
      });
    }
  };

  window.AntarcticSocialClient = api;
  window.PalladiumSocialClient = api;
})();
