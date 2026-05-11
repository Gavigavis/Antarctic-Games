/**
 * Antarctic Proxy Engine
 * 
 * Client-side proxy engine that replaces Scramjet.
 * Provides URL encoding/decoding, service worker registration,
 * and a controller API compatible with the shell's proxy initialization.
 */
(function () {
  "use strict";

  var PROXY_PREFIX = "/service/antarctic/";
  var PROXY_SW_PATH = "/sw-proxy.js";
  var PROXY_VERSION = "antarctic-proxy-2026-05-03-v1";

  var ENCODING_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  function encodeBase64url(buffer) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      return Buffer.from(buffer).toString("base64url");
    }
    var bytes = typeof buffer === "string" ? new TextEncoder().encode(buffer) : buffer;
    var result = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var a = bytes[i] || 0;
      var b = bytes[i + 1] || 0;
      var c = bytes[i + 2] || 0;
      var d = (a << 16) | (b << 8) | c;
      result += ENCODING_ALPHABET[(d >> 18) & 63] +
        ENCODING_ALPHABET[(d >> 12) & 63] +
        ENCODING_ALPHABET[(d >> 6) & 63] +
        ENCODING_ALPHABET[d & 63];
    }
    return result.replace(/=+$/, "");
  }

  function decodeBase64url(encoded) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      try {
        return Buffer.from(encoded, "base64url").toString("utf8");
      } catch {
        return encoded;
      }
    }
    var padding = (4 - (encoded.length % 4)) % 4;
    encoded += "=".repeat(padding);
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    var result = "";
    try {
      result = decodeURIComponent(
        Array.prototype.map.call(atob(encoded), function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join("")
      );
    } catch {
      return encoded.replace(/=+$/, "");
    }
    return result;
  }

  function encodeUrl(url) {
    try {
      var parsed = new URL(url);
      var payload = JSON.stringify({
        u: parsed.href,
        v: PROXY_VERSION
      });
      var encoded = encodeBase64url(payload);
      return PROXY_PREFIX + encoded;
    } catch {
      return PROXY_PREFIX + encodeBase64url(JSON.stringify({ u: url, v: PROXY_VERSION }));
    }
  }

  function decodeUrl(encoded) {
    if (typeof encoded !== "string") return encoded || "";
    if (!encoded.startsWith(PROXY_PREFIX)) return encoded;
    var payload = encoded.slice(PROXY_PREFIX.length);
    try {
      var decoded = JSON.parse(decodeBase64url(payload));
      return decoded.u || encoded;
    } catch {
      return encoded;
    }
  }

  function decodePathname(pathname) {
    if (typeof pathname !== "string") return { url: "", decoded: false };
    if (!pathname.startsWith(PROXY_PREFIX)) return { url: pathname, decoded: false };
    var payload = pathname.slice(PROXY_PREFIX.length);
    try {
      var decoded = JSON.parse(decodeBase64url(payload));
      return { url: decoded.u || "", decoded: true, version: decoded.v };
    } catch {
      return { url: pathname, decoded: false };
    }
  }

  function rewriteUrlsInHtml(html, proxyPrefix) {
    if (!html || typeof html !== "string") return html;
    proxyPrefix = proxyPrefix || PROXY_PREFIX;
    return html
      .replace(/href=["']([^"']*?)["']/gi, function (match, url) {
        if (/^about:/i.test(url) || /^data:/i.test(url) || /^javascript:/i.test(url) || /^#/i.test(url)) {
          return match;
        }
        return 'href="' + proxyPrefix + encodeBase64url(JSON.stringify({ u: url, v: PROXY_VERSION })) + '"';
      })
      .replace(/src=["']([^"']*?)["']/gi, function (match, url) {
        if (/^about:/i.test(url) || /^data:/i.test(url) || /^javascript:/i.test(url)) {
          return match;
        }
        return 'src="' + proxyPrefix + encodeBase64url(JSON.stringify({ u: url, v: PROXY_VERSION })) + '"';
      })
      .replace(/action=["']([^"']*?)["']/gi, function (match, url) {
        if (/^about:/i.test(url) || /^data:/i.test(url) || /^javascript:/i.test(url)) {
          return match;
        }
        return 'action="' + proxyPrefix + encodeBase64url(JSON.stringify({ u: url, v: PROXY_VERSION })) + '"';
      });
  }

  function rewriteHeadersInHtml(html, locationOrigin) {
    if (!html || typeof html !== "string") return html;
    if (!locationOrigin) return html;
    var cspRewrite = 'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; object-src \'self\'; frame-src \'self\' https://*;';
    var replacement = '<meta http-equiv="Content-Security-Policy" content="' + cspRewrite + '">';
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, "$1" + replacement);
    } else {
      html = "<head>" + replacement + "</head>" + html;
    }

    if (/GODOT_CONFIG|new Engine\(|Godot\.js/i.test(html)) {
      var godotPatch = '<script>(function(){if(typeof window.__antarcticGodotPatched==="undefined"){window.__antarcticGodotPatched=true;var origInstall=null;if(typeof engine!=="undefined"&&typeof engine.installServiceWorker==="function"){origInstall=engine.installServiceWorker;engine.installServiceWorker=function(){return Promise.resolve();}}if(typeof GODOT_CONFIG!=="undefined"&&GODOT_CONFIG.ensureCrossOriginIsolationHeaders===true){GODOT_CONFIG.ensureCrossOriginIsolationHeaders=false;}}})();</script>';
      if (/<\/body>/i.test(html)) {
        html = html.replace(/(<\/body>)/i, godotPatch + "$1");
      } else {
        html = html + godotPatch;
      }
    }

    return html;
  }

  function createHttpProxyTransport(config) {
    return {
      name: "antarctic-http",
      postMessage: function (msg) {
        var payload = typeof msg === "string" ? JSON.parse(msg) : msg;
        var transportType = payload && payload.type || "fetch";
        if (transportType === "fetch") {
          return proxyFetch(payload).then(function (result) {
            return JSON.stringify(result);
          });
        }
        return Promise.resolve(JSON.stringify({ ok: false, error: "Unknown transport type: " + transportType }));
      }
    };
  }

  function proxyFetch(payload) {
    var url = payload && payload.url || "";
    var method = payload && payload.method || "GET";
    var headers = payload && payload.headers || {};
    var body = payload && payload.body;

    var backendApi = window.AntarcticBackendApi;
    var proxyRelayUrl = "/api/proxy/relay";
    if (backendApi && typeof backendApi.apiUrl === "function") {
      proxyRelayUrl = backendApi.apiUrl(proxyRelayUrl);
    }

    var fetchPayload = { url: url, method: method, headers: headers };
    if (body) {
      fetchPayload.body = body;
    }

    return fetch(proxyRelayUrl, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(fetchPayload)
    }).then(function (response) {
      return response.arrayBuffer().then(function (buffer) {
        var responseHeaders = {};
        if (response.headers) {
          response.headers.forEach(function (value, key) {
            responseHeaders[key] = value;
          });
        }
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url || url,
          body: buffer
        };
      });
    });
  }

  function AntarcticController(options) {
    options = options || {};
    this.prefix = options.prefix || PROXY_PREFIX;
    this.files = options.files || {};
    this._swRegistered = false;
    this._swRegistration = null;
  }

  AntarcticController.prototype.init = function () {
    var self = this;
    if (!window.navigator || !window.navigator.serviceWorker) {
      return Promise.reject(new Error("Service workers are not supported."));
    }
    return window.navigator.serviceWorker.register(PROXY_SW_PATH).then(function (registration) {
      self._swRegistered = true;
      self._swRegistration = registration;
      return registration.active || registration.installing || registration.waiting;
    }).catch(function (error) {
      return Promise.reject(new Error("Failed to register proxy service worker: " + (error.message || error)));
    });
  };

  AntarcticController.prototype.decodeUrl = function (text) {
    return decodeUrl(text);
  };

  AntarcticController.prototype.encodeUrl = function (url) {
    return encodeUrl(url);
  };

  AntarcticController.prototype.rewriteHtml = function (html, locationOrigin) {
    html = rewriteUrlsInHtml(html, this.prefix);
    html = rewriteHeadersInHtml(html, locationOrigin);
    return html;
  };

  AntarcticController.prototype.getProxyPrefix = function () {
    return this.prefix;
  };

  AntarcticController.prototype.getTransport = function () {
    return createHttpProxyTransport({});
  };

  AntarcticController.prototype.close = function () {
    if (this._swRegistration && typeof this._swRegistration.unregister === "function") {
      return this._swRegistration.unregister().catch(function () { });
    }
    return Promise.resolve();
  };

  function loadController() {
    return {
      ScramjetController: AntarcticController,
      AntarcticController: AntarcticController,
      encodeUrl: encodeUrl,
      decodeUrl: decodeUrl,
      rewriteHtml: rewriteHtml,
      proxyFetch: proxyFetch,
      createHttpProxyTransport: createHttpProxyTransport
    };
  }

  if (typeof window !== "undefined") {
    window.$antarcticLoadController = loadController;
    window.AntarcticProxyEngine = {
      AntarcticController: AntarcticController,
      encodeUrl: encodeUrl,
      decodeUrl: decodeUrl,
      rewriteHtml: rewriteHtml,
      decodePathname: decodePathname,
      proxyFetch: proxyFetch,
      createHttpProxyTransport: createHttpProxyTransport,
      loadController: loadController
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      AntarcticController: AntarcticController,
      encodeUrl: encodeUrl,
      decodeUrl: decodeUrl,
      rewriteHtml: rewriteHtml,
      decodePathname: decodePathname,
      proxyFetch: proxyFetch,
      createHttpProxyTransport: createHttpProxyTransport,
      loadController: loadController
    };
  }
})();
