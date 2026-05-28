import { App, PluginSettingTab, Setting } from "obsidian";
import GoogleSyncPlugin from "./main";

export interface GoogleSyncSettings {
    /** Vault folder watched for calendar event notes. */
    eventsFolder: string;
    /** Vault folder watched for task notes. */
    tasksFolder: string;
}

export const DEFAULT_SETTINGS: GoogleSyncSettings = {
    eventsFolder: "events",
    tasksFolder: "tasks",
};

export class GoogleSyncSettingTab extends PluginSettingTab {
    plugin: GoogleSyncPlugin;

    constructor(app: App, plugin: GoogleSyncPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Events folder")
            .setDesc("Vault folder whose notes mirror to Google Calendar.")
            .addText((text) =>
                text.setValue(this.plugin.settings.eventsFolder).onChange(async (value) => {
                    this.plugin.settings.eventsFolder = value;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName("Tasks folder")
            .setDesc("Vault folder whose notes mirror to Google Tasks.")
            .addText((text) =>
                text.setValue(this.plugin.settings.tasksFolder).onChange(async (value) => {
                    this.plugin.settings.tasksFolder = value;
                    await this.plugin.saveSettings();
                }),
            );
    }
}
