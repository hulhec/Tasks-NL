import type { Plugin } from "obsidian";
import {
	mergeSettings,
	type TasksNLSettings,
} from "../settings";

/**
 * Central settings service.
 *
 * Obsidian stores plugin settings in .obsidian/plugins/<plugin-id>/data.json.
 * All plugin features receive the same in-memory settings object from here.
 * Existing user values are preserved; mergeSettings only supplies missing fields.
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

		// Persist the safely migrated shape. This only adds missing defaults and
		// never replaces existing projects, people, repeats or templates.
		await this.plugin.saveData(this.settings);
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
