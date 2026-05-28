# Privacy Policy

Google Calendar and Tasks Sync does not run a hosted backend service.

## What data the plugin accesses

When you use the plugin, it can access:

- note content and frontmatter in your configured Obsidian folders (for example `events/` and `tasks/`)
- Google Calendar and Google Tasks data that your own OAuth client is authorized for

## How data is used

- Data is used only to perform sync operations you trigger or enable in plugin settings.
- The plugin communicates directly with Google APIs from your Obsidian client.

## What is not collected

- No analytics
- No telemetry
- No advertising identifiers
- No third-party tracking SDKs

## Local storage

Obsidian stores plugin settings and OAuth tokens in your vault-local plugin data file:

- `.obsidian/plugins/google-sync/data.json`

Treat your vault as sensitive local data and protect it appropriately.

## Data sharing

The plugin does not intentionally send your data anywhere except Google APIs required for calendar/task sync.

## Your control

You can:

- disconnect Google at any time using the plugin command
- remove local plugin data by deleting the plugin folder from your vault
- limit sync scope by choosing specific folders/calendars/task lists in settings
