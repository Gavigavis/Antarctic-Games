# Antarctic Games

## Our Purpose
Our purpose is to provide gaming fun to everybody who is probably sitting bored in a classroom while their teacher drones on about the Civil War.
The frontend is now a single-shell browser experience where the main page is the proxy and internal routes like `antarctic://home`, `antarctic://games`, and `antarctic://ai` live inside the built-in address bar.
We have games, an AI agent, and a built-in proxy shell.
## Our Tech Infrastructure
We use games from [GN-MATH](https://gn-math.dev), and the [Internet Archive](https://archive.org)

## Deployment
There are many ways to deploy an Antarctic Games website. Here's how:

### Free Services (Netlify, Vercel, etc.)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Palladium-Games/Palladium-Games)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPalladium-Games%2FPalladium-Games)  
You can also remix this on [Replit](https://replit.com/@sethpanng/Palladium-Games)



  1. Create a new project
  2. Point it to https://github.com/Palladium-Games/Palladium-Games
  3. Create it
  4. You're ready to go! Netlify/Vercel/whatever will keep the links updated to this branch.


### Actual Hosting (yay)
  1. Run ```git clone https://github.com/Palladium-Games/Palladium-Games.git```
  2. Configure your web server to serve the files in the Antarctic Games folder
  3. You're good to go! Remember to run ```git pull origin main``` sometimes to keep your link updated.

### Backend-Served Main Site
  1. Keep this frontend checkout beside the backend checkout, for example at `/opt/Antarctic-Games` next to `/opt/Antarctic-Backend`
  2. Set `FRONTEND_STATIC_DIR=/opt/Antarctic-Games` in the backend env file
  3. Put nginx in reverse-proxy mode so `/`, `/api/*`, `/wisp/`, and `/service/scramjet/...` all flow through the backend-owned origin instead of a static nginx root
  4. Use the backend repo's checked-in cutover artifacts for the exact systemd/nginx setup

## Local Game Hosting
The frontend now commits the playable game files, SWFs, thumbnails, and a generated catalog manifest directly into this repo so a blocked `api.antarctic.games` domain does not take the whole games page down.
The only top-level app page is `index.html`; games launch from the shell into their own tabs through `antarctic://gamelauncher?...` launch URIs.

Refresh those bundled assets from a sibling backend checkout with:

```bash
npm run sync:games
```

Verify the static catalog wiring with:

```bash
npm test
```

The sync script looks for `../antarctic-backend` first, then `../palladium-backend`, and finally `../backend`.

## Static Proxy Shell
The frontend stays fully static. Scramjet, BareMux, libcurl, and the service worker are committed into this repo so the shell can deploy to any static host without a long-running frontend server.
Plain text lookups from the Antarctic address bar now open DuckDuckGo through the proxied page flow without exposing the remote web URL in the real browser URL bar.
The Netlify deploy now serves `/api/config/public`, `/api/proxy/health`, `/api/proxy/fetch`, and `/api/proxy/request` directly from a same-origin Netlify function so built-in web browsing can still boot even when `api.antarctic.games` is blocked or unavailable.
Static-host custom domains still treat `https://antarctic-games.netlify.app` as the backend bridge when their `/api/*` paths are only static-shell routes.
The production `https://antarctic.games` deployment is meant to run through the backend passthrough path instead, so same-origin `/api/*`, `/wisp/`, and `/service/scramjet/...` are real backend routes there.
The shell now treats the HTTP fallback proxy as the low-latency startup path whenever the public contract advertises it, and only waits on Wisp when a deployment explicitly prefers websocket transport.

The live backend contract is:

- `https://api.antarctic.games/api/ai/chat` for AI
- `https://api.antarctic.games/api/config/public` for public runtime config
- `wss://api.antarctic.games/wisp/` for Scramjet transport

Old saved backend hosts like `sethpang.com` and `api.sethpang.com` are automatically migrated forward to `https://api.antarctic.games` by the frontend helper.

Refresh the committed proxy runtime from the backend repo with:

```bash
cd ../antarctic-backend
npm run sync:frontend-proxy
```

## Links
  1. https://sethpang.com (main link)
  2. https://palladium-games.netlify.app
  3. http://bakzz05.surge.sh
  4. https://i-am-diddy.netlify.app (don't ask)
  5. https://sethisdiddy.netlify.app (shut up @Gavigavis)
  6. https://palladium-games-1yia8ysxb-vegeta-bles-projects.vercel.app/
  7. https://palladium-games.onrender.com
  8. https://palladium-games.pages.dev
  9. https://palladium-games-blush.vercel.app/index.html (i didn't even know about this link)  

## Discord
[Join our Discord Server for more updates!](https://discord.gg/FNACSCcE26)

## Star History

<a href="https://www.star-history.com/?repos=Palladium-Games%2FPalladium-Games&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=Palladium-Games/Palladium-Games&type=date&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=Palladium-Games/Palladium-Games&type=date&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=Palladium-Games/Palladium-Games&type=date&legend=bottom-right" />
 </picture>
</a>
