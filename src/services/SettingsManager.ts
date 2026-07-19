import type { Plugin } from "obsidian";
import {
	mergeSettings,
	type TasksNLSettings,
} from "../settings";

/**
 * Central settings service using Obsidian's standard plugin storage.
 *
 * Obsidian stores this as data.json in the plugin folder. Syncing that file is
 * handled by Obsidian Sync's vault configuration options; Tasks NL does not
 * create a second settings file in the visible vault.
 */
export class SettingsManager {
	private settings!: TasksNLSettings;

	constructor(private readonly plugin: Plugin) {}

	async load(): Promise<TasksNLSettings> {
		const raw: unknown = await this.plugin.loadData();
		const saved =
			typeof raw === "object" && raw !== null
				? (raw as Partial<TasksNLSettings>)
				: null;

		this.settings = mergeSettings(saved);
		return this.settings;
	}

	get current(): TasksNLSettings {
		return this.settings;
	}

	async save(settings: TasksNLSettings): Promise<void> {
		this.settings = mergeSettings(settings);
		await this.plugin.saveData(this.settings);
	}
}
