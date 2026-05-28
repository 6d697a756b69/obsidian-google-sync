import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, GoogleSyncSettings, GoogleSyncSettingTab } from "./settings";

/**
 * Google Calendar/Tasks Sync.
 *
 * Skeleton only — feature work (Google REST client, OAuth, frontmatter parser,
 * note<->Google mapper, file watcher, lifecycle/archival) is built on top of this
 * in the next phase. See ../obsidian-google-sync-spec.md.
 */
export default class GoogleSyncPlugin extends Plugin {
    settings: GoogleSyncSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GoogleSyncSettingTab(this.app, this));
        console.debug("google-sync: loaded");
    }

    onunload() {
        console.debug("google-sync: unloaded");
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            (await this.loadData()) as Partial<GoogleSyncSettings>,
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
