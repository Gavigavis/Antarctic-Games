/**
 * Antarctic Proxy Service Worker
 * 
 * Intercepts fetch requests inside the proxy iframe, decodes proxy URLs,
 * forwards them through the backend relay, and rewrites responses.
 */
var PROXY_PREFIX = "/service/antarctic/";
var PROXY_VERSION = "antarctic-proxy-2026-05-03-v1";
var PROXY_RELAY_PATH = "/api/proxy/relay";

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

function rewriteHeadersInHtml(html) {
  if (!html || typeof html !== "string") return html;
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

function shouldProxyUrl(requestUrl) {
  if (!requestUrl) return false;
  try {
    var parsed = new URL(requestUrl);
    var pathname = parsed.pathname || "";
    if (pathname.startsWith(PROXY_PREFIX)) return true;
    if (pathname === PROXY_PREFIX) return true;
    return false;
  } catch {
    return false;
  }
}

function getProxyRelayUrl() {
  return PROXY_RELAY_PATH;
}

async function proxyFetchRequest(targetUrl, method, headers, body) {
  var relayUrl = getProxyRelayUrl();
  var fetchPayload = {
    url: targetUrl,
    method: method || "GET",
    headers: headers || {}
  };
  if (body) {
    if (body instanceof ArrayBuffer) {
      var array = new Uint8Array(body);
      var bytes = [];
      for (var i = 0; i < array.length; i++) {
        bytes.push(array[i]);
      }
      fetchPayload.body = new Uint8Array(bytes).buffer;
    } else {
      fetchPayload.body = body;
    }
  }

  var response = await fetch(relayUrl, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(fetchPayload)
  });

  var responseBuffer = await response.arrayBuffer();
  var responseHeaders = {};
  response.headers.forEach(function (value, key) {
    responseHeaders[key] = value;
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    url: response.url || targetUrl,
    body: responseBuffer
  };
}

function createProxyResponse(proxyResult, originalUrl) {
  var headers = {};
  if (proxyResult.headers) {
    for (var key in proxyResult.headers) {
      if (proxyResult.headers.hasOwnProperty(key)) {
        var lowerKey = key.toLowerCase();
        if (lowerKey !== "content-encoding" && lowerKey !== "transfer-encoding" && lowerKey !== "content-length" && lowerKey !== "set-cookie") {
          if (lowerKey === "x-frame-options") {
            continue;
          }
          if (lowerKey === "content-security-policy") {
            try {
              var csp = proxyResult.headers[key].replace(/frame-ancestors\s+[^;]*;?/gi, "");
              if (csp.trim()) {
                headers[lowerKey] = csp.trim();
              }
            } catch {
              // Skip CSP header if rewriting fails
            }
            continue;
          }
          headers[lowerKey] = proxyResult.headers[key];
        }
      }
    }
  }
  headers["x-proxy-original-url"] = originalUrl;
  headers["x-proxy-relay"] = "antarctic";
  headers["cross-origin-opener-policy"] = "same-origin";
  headers["cross-origin-embedder-policy"] = "require-corp";

  var body = proxyResult.body;
  var contentType = headers["content-type"] || "";

  if (body && contentType) {
    if (contentType.includes("text/html")) {
      try {
        var text = new TextDecoder().decode(body);
        text = rewriteUrlsInHtml(text, PROXY_PREFIX);
        text = rewriteHeadersInHtml(text);
        body = new TextEncoder().encode(text).buffer;
      } catch {
        // Keep original body if decoding fails
      }
    } else if (contentType.includes("text/") || contentType.includes("javascript") || contentType.includes("json") || contentType.includes("xml")) {
      try {
        var text = new TextDecoder().decode(body);
        text = rewriteUrlsInHtml(text, PROXY_PREFIX);
        body = new TextEncoder().encode(text).buffer;
      } catch {
        // Keep original body
      }
    }
  }

  return new Response(body, {
    status: proxyResult.status || 200,
    statusText: proxyResult.statusText || "OK",
    headers: headers
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Delete old caches
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            return caches.delete(key);
          })
        );
      })
    ])
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var requestUrl = request.url || "";

  if (!shouldProxyUrl(requestUrl)) {
    return;
  }

  event.respondWith(
    (async function () {
      try {
        var parsed = decodePathname(new URL(requestUrl).pathname);
        if (!parsed.decoded || !parsed.url) {
          return new Response("Invalid proxy URL", { status: 400 });
        }

        var targetUrl = parsed.url;
        var method = request.method || "GET";
        var headers = {};

        // Get headers from the request
        if (request.headers) {
          request.headers.forEach(function (value, key) {
            var lowerKey = key.toLowerCase();
            if (lowerKey !== "host" && lowerKey !== "cookie" && lowerKey !== "origin" && lowerKey !== "referer") {
              headers[lowerKey] = value;
            }
          });
        }

        var body = null;
        if (method !== "GET" && method !== "HEAD" && request.body) {
          try {
            body = await request.arrayBuffer();
          } catch {
            body = null;
          }
        }

        var proxyResult = await proxyFetchRequest(targetUrl, method, headers, body);

        if (!proxyResult.ok) {
          return new Response(
            JSON.stringify({ error: "Proxy request failed", status: proxyResult.status, url: targetUrl }),
            {
              status: proxyResult.status || 502,
              headers: { "content-type": "application/json; charset=utf-8" }
            }
          );
        }

        return createProxyResponse(proxyResult, requestUrl);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Proxy error", message: error.message || String(error) }),
          {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" }
          }
        );
      }
    })()
  );
});

self.addEventListener("message", function (event) {
  var data = event.data || {};
  var type = data.type || "";

  if (type === "proxy-fetch") {
    var payload = data.payload || {};
    var targetUrl = payload.url || "";
    var method = payload.method || "GET";
    var headers = payload.headers || {};
    var body = payload.body;

    proxyFetchRequest(targetUrl, method, headers, body).then(function (result) {
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: "proxy-fetch-response",
          id: data.id,
          result: result
        });
      }
    });
  }
});
