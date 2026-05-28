# Development

Technical notes for hacking on the plugin.

## Toolchain

| Concern    | Tool                                                    |
| ---------- | ------------------------------------------------------- |
| Bundler    | esbuild (`obsidian`/`electron`/CodeMirror externalized) |
| Types      | TypeScript (strict-ish, `tsc --noEmit` gate)            |
| Lint       | ESLint flat config + `eslint-plugin-obsidianmd`         |
| Format     | Prettier (`npm run format` / `format:check`)            |
| Unit tests | Mocha + chai (`test/unit/**/*.ts`, run via `tsx`)       |
| E2E tests  | WebdriverIO + `wdio-obsidian-service` (real Obsidian)   |

## Scripts

```shell
npm install          # install toolchain
npm run dev          # esbuild watch -> main.js (use with hot-reload in a dev vault)
npm run build        # type-check + production bundle
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
npm run test:unit    # mocha unit tests
npm run test:e2e     # wdio e2e against a real (downloaded) Obsidian
npm test             # unit + e2e
```

## E2E on a headless aarch64 box

`wdio-obsidian-service` / `obsidian-launcher` downloads a sandboxed Obsidian (arm64 build,
cached in `./.obsidian-cache`) and `@wdio/xvfb` provides a virtual display. Requires the
system packages installed by `scripts/setup-e2e-deps.sh` (xvfb + Electron runtime libs).
Pin versions with `OBSIDIAN_VERSIONS`, e.g.:

```shell
OBSIDIAN_VERSIONS='latest/latest' npm run test:e2e
```

## Dev loop with hot-reload

A dev vault lives at `../obsidian-google-sync-vault/` with the
[`hot-reload`](https://github.com/pjeby/hot-reload) plugin installed and this plugin's
build output symlinked into `.obsidian/plugins/google-sync/`. Run `npm run dev` and edits
rebuild + reload live.

## Architecture notes

- All network goes through Obsidian's `requestUrl` (no CORS, no Node deps) — keeps the
  plugin mobile-safe.
- All file I/O goes through the Vault API.
- OAuth is Authorization Code + PKCE via a self-hosted `obsidian://` bridge, so the same
  flow works on iOS.
- Google API calls use exponential backoff on 429/5xx.
- `googleId` is stored in note frontmatter and is the sync key between Obsidian and Google.

## Credits

Scaffolded from
[`wdio-obsidian-service-sample-plugin`](https://github.com/jesse-r-s-hines/wdio-obsidian-service-sample-plugin),
itself based on the [official Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin).
