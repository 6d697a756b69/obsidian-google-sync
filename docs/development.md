# Development

Technical notes for hacking on **Google Calendar/Tasks Sync**.

## Toolchain

| Concern    | Tool                                                    |
| ---------- | ------------------------------------------------------- |
| Bundler    | esbuild (`obsidian`/`electron`/CodeMirror externalized) |
| Types      | TypeScript (`tsc --noEmit` gate)                        |
| Lint       | ESLint flat config + `eslint-plugin-obsidianmd`         |
| Format     | Prettier (`npm run format` / `format:check`)            |
| Unit tests | Mocha + chai (`test/unit/**/*.ts`, run via `tsx`)       |
| E2E tests  | WebdriverIO + `wdio-obsidian-service` (real Obsidian)   |

## Scripts

```shell
npm install          # install toolchain
npm run dev          # esbuild watch -> main.js
npm run build        # type-check + production bundle
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
npm run test:unit    # mocha unit tests
npm run test:e2e     # wdio e2e against a real downloaded Obsidian
npm test             # unit + e2e
```

## Release checklist

Before a public release:

1. Pull latest main.
2. Update `package.json`, `package-lock.json`, `manifest.json`, and `versions.json` to the same SemVer version.
3. Run:

    ```shell
    npm run build
    npm run test:unit
    npm run test:e2e
    npm run lint
    ./scripts/smoke-local.sh
    npm audit --omit=dev --audit-level=moderate
    ```

4. Confirm release artifacts exist at repo root:

    ```text
    main.js
    manifest.json
    styles.css
    ```

5. Tag the release with the exact version string, for example `0.1.5` with no leading `v`.
6. GitHub Actions creates the GitHub release and attaches `main.js`, `manifest.json`, and `styles.css`.
7. Check the release assets manually before submitting to the Obsidian community directory.

## E2E on a headless aarch64 box

`wdio-obsidian-service` / `obsidian-launcher` downloads a sandboxed Obsidian build, cached in `./.obsidian-cache`, and `@wdio/xvfb` provides a virtual display. Requires the system packages installed by `scripts/setup-e2e-deps.sh`.

Pin versions with `OBSIDIAN_VERSIONS`, for example:

```shell
OBSIDIAN_VERSIONS='latest/latest' npm run test:e2e
```

## Mobile compatibility rules

The plugin is intended to run on Obsidian mobile, so keep these rules:

- `manifest.json` must keep `isDesktopOnly: false`.
- Use Obsidian’s `requestUrl` for network calls.
- Use Obsidian’s Vault/FileManager APIs for file I/O.
- Do not use Node-only APIs such as `fs`, `child_process`, or Electron-only APIs in runtime code.
- Keep startup work light. Startup Google import is optional and additions-only.
- Test the emulated-mobile E2E path and use [ios-checklist.md](ios-checklist.md) for real-device testing.

## Architecture notes

- `src/main.ts` wires plugin lifecycle, commands, settings, OAuth, router, importer, and lifecycle services.
- `src/google/*` contains OAuth and Google Calendar/Tasks clients.
- `src/sync/router.ts` pushes Obsidian notes to Google.
- `src/sync/importer.ts` imports Google Calendar/Tasks items into notes.
- `src/sync/lifecycle.ts` moves archived/overdue/completed items.
- `googleId` in frontmatter is the sync key between an Obsidian note and a Google item.
- Import defaults are conservative: only the configured calendar/list are imported unless the user opts into all visible calendars/lists.

## Dev loop with hot reload

A dev vault can symlink build output into:

```text
<Vault>/.obsidian/plugins/google-sync/
```

Run `npm run dev` and use an Obsidian hot-reload plugin or manually reload the plugin after changes.

## Credits

Scaffolded from [`wdio-obsidian-service-sample-plugin`](https://github.com/jesse-r-s-hines/wdio-obsidian-service-sample-plugin), itself based on the [official Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin).
