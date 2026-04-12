const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const helperSource = fs.readFileSync(path.join(FRONTEND_DIR, "games-static.js"), "utf8");

function createHelperContext(overrides) {
  const calls = [];
  const window = (overrides && overrides.window) || {};
  const context = {
    URLSearchParams,
    console,
    document: (overrides && overrides.document) || null,
    fetch: async (url, init) => {
      calls.push({ url, init });
      if (overrides && overrides.fetch) {
        return overrides.fetch(url, init);
      }
      return {
        ok: true,
        async json() {
          return { games: [] };
        }
      };
    },
    window
  };

  vm.runInNewContext(helperSource, context, { filename: "games-static.js" });
  return { api: context.window.AntarcticGames, calls };
}

test("normalizeAssetPath keeps local game assets on the frontend origin", () => {
  const { api } = createHelperContext();

  assert.equal(api.normalizeAssetPath("/games/fnaf/fnaf-1.html"), "games/fnaf/fnaf-1.html");
  assert.equal(api.normalizeAssetPath("images/game-img/fnaf-icon.png"), "images/game-img/fnaf-icon.png");
  assert.equal(api.normalizeAssetPath("https://cdn.example.com/game.html"), "https://cdn.example.com/game.html");
});

test("buildLaunchUri points game launches into the Antarctic tab protocol", () => {
  const { api } = createHelperContext();

  assert.equal(
    api.buildLaunchUri("games/platformer/ovo.html", "OvO", "Dedra Games"),
    "antarctic://gamelauncher?path=games%2Fplatformer%2Fovo.html&title=OvO&author=Dedra%20Games"
  );
});

test("filterCatalog narrows the library without mutating the source list", () => {
  const { api } = createHelperContext();
  const sampleGames = [
    { title: "OvO", author: "Dedra Games", category: "Platformer", path: "games/platformer/ovo.html" },
    { title: "Brotato", author: "Blobfish", category: "Shooter", path: "games/bullet-hell/brotato.html" }
  ];

  const results = api.filterCatalog(sampleGames, "blobfish");

  assert.deepEqual(results, [sampleGames[1]]);
  assert.deepEqual(sampleGames.map((game) => game.title), ["OvO", "Brotato"]);
});

test("pickFeaturedGame rotates daily and prefers entries with artwork", () => {
  const { api } = createHelperContext();
  const sampleGames = [
    { title: "No Image Yet", path: "games/misc/no-image.html" },
    { title: "Beta Feature", image: "images/game-img/beta.png", path: "games/misc/beta.html" },
    { title: "Arcade Hero", image: "images/game-img/arcade-hero.png", path: "games/misc/arcade-hero.html" }
  ];

  assert.equal(api.pickFeaturedGame(sampleGames, "2026-04-12T10:00:00Z"), sampleGames[1]);
  assert.equal(api.pickFeaturedGame(sampleGames, "2026-04-13T10:00:00Z"), sampleGames[2]);
  assert.equal(api.pickFeaturedGame([]), null);
});

test("loadCatalog prefers the committed local manifest", async () => {
  const sampleGames = [
    { title: "OvO", path: "games/platformer/ovo.html" },
    { title: "Brotato", path: "games/bullet-hell/brotato.html" },
    { title: "AdVenture Capitalist!", path: "games/clickers/adventure-capitalist.html" }
  ];
  const { api, calls } = createHelperContext({
    window: {
      ANTARCTIC_GAMES_CATALOG: { games: sampleGames }
    }
  });

  const games = await api.loadCatalog();
  assert.deepEqual(
    games.map((game) => game.title),
    ["AdVenture Capitalist!", "Brotato", "OvO"]
  );
  assert.deepEqual(
    sampleGames.map((game) => game.title),
    ["OvO", "Brotato", "AdVenture Capitalist!"]
  );
  assert.equal(calls.length, 0);
});

test("loadCatalog drops directory-listing junk titles", async () => {
  const { api } = createHelperContext({
    window: {
      ANTARCTIC_GAMES_CATALOG: {
        games: [
          { title: "Index of /cookieclicker/snd", path: "games/clickers/cookie-clicker.zip/snd/index.html" },
          { title: "Real Game", path: "games/misc/real.html" }
        ]
      }
    }
  });

  const games = await api.loadCatalog();
  assert.deepEqual(games, [{ title: "Real Game", path: "games/misc/real.html" }]);
});

test("loadCatalog stays local-only when the embedded manifest is unavailable", async () => {
  const { api } = createHelperContext({
    window: {}
  });

  await assert.rejects(
    () => api.loadCatalog(),
    /Embedded games catalog is unavailable/
  );
});

test("games helper targets the committed absolute manifest path", () => {
  assert.match(helperSource, /var LOCAL_MANIFEST_PATH = "\/data\/games-catalog\.js";/);
  assert.match(helperSource, /var LOCAL_MANIFEST_VERSION = "2026-03-22-asset-1";/);
  assert.match(helperSource, /function getLocalAppBaseUrl\(\)/);
  assert.match(helperSource, /function resolveCatalogScriptUrl\(\)/);
  assert.match(helperSource, /manifestUrl\.searchParams\.set\(LOCAL_MANIFEST_ASSET_PARAM, LOCAL_MANIFEST_VERSION\);/);
  assert.match(helperSource, /data-antarctic-games-catalog/);
});
