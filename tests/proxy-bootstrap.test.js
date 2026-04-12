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

function loadBootstrapHelpers() {
  const context = {};
  const script = [
    "function cleanText(value) { return String(value == null ? '' : value).trim(); }",
    extractFunctionSource("determineProxyBootstrapPlan"),
    "this.determineProxyBootstrapPlan = determineProxyBootstrapPlan;"
  ].join("\n\n");
  vm.runInNewContext(script, context, { filename: "proxy-bootstrap-helpers.js" });
  return context;
}

test("bootstrap prefers the explicit http fallback transport when the contract advertises it", () => {
  const { determineProxyBootstrapPlan } = loadBootstrapHelpers();

  const plan = determineProxyBootstrapPlan({
    declaredTransport: "http-fallback",
    proxyFetchUrl: "https://antarctic.games/api/proxy/fetch",
    proxyRequestUrl: "https://antarctic.games/api/proxy/request",
    wispUrl: "wss://api.antarctic.games/wisp/"
  });

  assert.equal(plan.contractMismatch, false);
  assert.equal(plan.preferredTransport, "http-fallback");
  assert.equal(plan.hasHttpTransport, true);
  assert.equal(plan.hasWispTransport, true);
});

test("bootstrap repairs a stale disabled contract when fallback endpoints still exist", () => {
  const { determineProxyBootstrapPlan } = loadBootstrapHelpers();

  const plan = determineProxyBootstrapPlan({
    declaredTransport: "disabled",
    proxyFetchUrl: "https://api.antarctic.games/api/proxy/fetch",
    proxyRequestUrl: "",
    wispUrl: ""
  });

  assert.equal(plan.contractMismatch, true);
  assert.equal(plan.preferredTransport, "http-fallback");
  assert.equal(plan.hasHttpTransport, true);
  assert.equal(plan.hasWispTransport, false);
});

test("bootstrap falls back to wisp only when no HTTP transport is available", () => {
  const { determineProxyBootstrapPlan } = loadBootstrapHelpers();

  const plan = determineProxyBootstrapPlan({
    declaredTransport: "wisp",
    proxyFetchUrl: "",
    proxyRequestUrl: "",
    wispUrl: "wss://api.antarctic.games/wisp/"
  });

  assert.equal(plan.contractMismatch, false);
  assert.equal(plan.preferredTransport, "wisp");
  assert.equal(plan.hasHttpTransport, false);
  assert.equal(plan.hasWispTransport, true);
});
