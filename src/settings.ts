import { App, moment, PluginSettingTab, Setting, setIcon } from "obsidian";
import TasksNLPlugin from "./main";
import { synchronizeDailyJournalBlocks } from "./journal/DailyJournalTemplate";

export interface GTDDefinition {
	label: string;
	hashtag: string;
	synonyms: string[];
}

export interface ProjectDefinition {
	name: string;
	alias: string;
	hashtag: string;
}

export interface PersonDefinition {
	firstName: string;
	lastName: string;
	alias: string;
	hashtag: string;
}

export interface RepeatDefinition {
	input: string;
	tasksText: string;
}

export interface TaskTemplate {
	id: string;
	name: string;
	icon: string;
	mainTask: string;
	subtasks: string[];
	fileNamePattern: string;
	folderPath: string;
	noteTemplate: string;
	builtIn?: boolean;
	autoCreate?: boolean;
	autoCreateWeekday?: number;
	properties?: string;
	includeTopThree?: boolean;
	includeNextProjectSteps?: boolean;
}

export type SettingsLanguage = "nl" | "en";

export interface TasksNLSettings {
	settingsLanguage: SettingsLanguage;
	defaultTaskTitle: string;
	keepOriginalTaskText: boolean;
	keepCompletedRecurringTask: boolean;
	showRibbonIcon: boolean;
	showWorkspaceRibbonIcon: boolean;
	showStatusBarItem: boolean;
	showPreview: boolean;
	startDateWords: string[];
	repeatKeywords: string[];
	workspaceExcludedTags: string[];
	workspaceWidgets: {
		today: boolean;
		thisWeek: boolean;
		inbox: boolean;
		waitingFor: boolean;
		projects: boolean;
		people: boolean;
		priority: boolean;
		recurring: boolean;
		calendar: boolean;
		statistics: boolean;
		review: boolean;
	};
	gtdDefinitions: GTDDefinition[];
	projectDefinitions: ProjectDefinition[];
	personDefinitions: PersonDefinition[];
	repeatDefinitions: RepeatDefinition[];
	taskTemplates: TaskTemplate[];
}

export const DEFAULT_SETTINGS: TasksNLSettings = {
	settingsLanguage: "nl",
	defaultTaskTitle: "Taak",
	keepOriginalTaskText: false,
	keepCompletedRecurringTask: false,
	showRibbonIcon: false,
	showWorkspaceRibbonIcon: true,
	showStatusBarItem: false,
	showPreview: true,
	startDateWords: ["start op", "vanaf"],
	repeatKeywords: ["elke", "om de"],
	workspaceExcludedTags: ["#reminder"],
	workspaceWidgets: {
		today: true,
		thisWeek: true,
		inbox: true,
		waitingFor: true,
		projects: true,
		people: true,
		priority: true,
		recurring: true,
		calendar: false,
		statistics: false,
		review: false,
	},
	gtdDefinitions: [
		{
			label: "Waiting For",
			hashtag: "#waiting-for",
			synonyms: ["wachten", "wachten op", "pauze", "waiting for"],
		},
		{
			label: "Next Action",
			hashtag: "#next-action",
			synonyms: ["volgende actie", "next action"],
		},
		{
			label: "Scheduled",
			hashtag: "#scheduled",
			synonyms: ["gepland", "scheduled"],
		},
		{
			label: "Someday Maybe",
			hashtag: "#someday-maybe",
			synonyms: ["ooit", "misschien", "someday", "maybe"],
		},
	],
	repeatDefinitions: [
		{ input: "elke week", tasksText: "every week" },
		{ input: "elke twee weken", tasksText: "every 2 weeks" },
		{ input: "elke maand", tasksText: "every month" },
		{ input: "elk jaar", tasksText: "every year" },
	],
	projectDefinitions: [
		{
			name: "Voorbeeldproject",
			alias: "voorbeeld",
			hashtag: "#voorbeeld-project",
		},
	],
	taskTemplates: [
		{
			id: "day-journal",
			name: "Dagjournaal",
			icon: "calendar-days",
			mainTask: "Dagjournaal {{filename}}",
			fileNamePattern: "dddd DD-MMM-YY",
			folderPath: "Kalender/Dagjournaal",
			properties: "type: dagjournaal\ndatum: {{date}}",
			noteTemplate: `##### Journaal\n\n`,
			subtasks: [],
			builtIn: true,
			autoCreate: true,
			includeTopThree: true,
			includeNextProjectSteps: true,
		},
		{
			id: "week-review",
			name: "Week review",
			icon: "calendar-check",
			mainTask: "Weekly review for {{filename}}",
			fileNamePattern: "[Weekreview] WW YYYY",
			folderPath: "Reviews",
			noteTemplate: `---
banner: "[[260530 Banner Weekreview.png]]"
---
##### Tasks

{{tasks}}
##### New tasks after the review


##### Week Summary

Tekst
`,
			subtasks: [
				"Empty inbox",
				"Review calendar from last week",
				"Review Waiting For tasks",
				"Update projects",
				"Review next week",
				"Choose three most important actions",
			],
			builtIn: true,
			autoCreate: false,
			autoCreateWeekday: 5,
		},
		{
			id: "month-review",
			name: "Month review",
			icon: "calendar-range",
			mainTask: "Monthly review for {{filename}}",
			fileNamePattern: "[Maandreview] MMMM YYYY",
			folderPath: "Reviews",
			noteTemplate: `##### Tasks

{{tasks}}
##### New tasks after the review


##### Month Summary

Tekst
`,
			subtasks: [
				"Review completed work",
				"Review open projects",
				"Review goals",
				"Plan next month",
			],
			builtIn: true,
			autoCreate: false,
			autoCreateWeekday: 5,
		},
	],
	personDefinitions: [
		{
			firstName: "Voorbeeldpersoon",
			lastName: "",
			alias: "voorbeeld",
			hashtag: "#voorbeeld-persoon",
		},
	],
};

export function normalizeHashtag(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function renderDailyJournalSections(
	source: string,
	includeTopThree: boolean,
	includeNextProjectSteps: boolean,
	topThree: string,
	nextProjectSteps: string,
): string {
	void topThree;
	void nextProjectSteps;
	return synchronizeDailyJournalBlocks(source, includeTopThree, includeNextProjectSteps);
}


export function normalizeWorkspaceExcludedTags(values: string[]): string[] {
	const unique = new Set<string>();

	for (const value of values) {
		const normalized = normalizeHashtag(value).toLocaleLowerCase("nl-NL");
		if (normalized) unique.add(normalized);
	}

	return [...unique];
}

function parseSynonyms(value: string): string[] {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

export function mergeSettings(saved: Partial<TasksNLSettings> | null): TasksNLSettings {
	const source = saved ?? {};

	return {
		settingsLanguage: source.settingsLanguage === "en" ? "en" : "nl",
		defaultTaskTitle:
			source.defaultTaskTitle?.trim() || DEFAULT_SETTINGS.defaultTaskTitle,
		keepOriginalTaskText:
			source.keepOriginalTaskText ?? DEFAULT_SETTINGS.keepOriginalTaskText,
		keepCompletedRecurringTask:
			source.keepCompletedRecurringTask ??
			DEFAULT_SETTINGS.keepCompletedRecurringTask,
		showRibbonIcon: source.showRibbonIcon ?? DEFAULT_SETTINGS.showRibbonIcon,
		showWorkspaceRibbonIcon:
			source.showWorkspaceRibbonIcon ?? DEFAULT_SETTINGS.showWorkspaceRibbonIcon,
		showStatusBarItem:
			source.showStatusBarItem ?? DEFAULT_SETTINGS.showStatusBarItem,
		showPreview: source.showPreview ?? DEFAULT_SETTINGS.showPreview,
		startDateWords: (source.startDateWords ?? DEFAULT_SETTINGS.startDateWords)
			.map((word) => word.trim().toLocaleLowerCase("nl-NL")).filter(Boolean),
		repeatKeywords: Array.isArray(source.repeatKeywords)
			? source.repeatKeywords.map((word) => word.trim()).filter(Boolean)
			: [((source as Partial<TasksNLSettings> & { repeatKeyword?: string }).repeatKeyword ?? "elke")],
		workspaceExcludedTags: normalizeWorkspaceExcludedTags(
			source.workspaceExcludedTags ?? DEFAULT_SETTINGS.workspaceExcludedTags
		),
		workspaceWidgets: {
			...DEFAULT_SETTINGS.workspaceWidgets,
			...(source.workspaceWidgets ?? {}),
		},
		gtdDefinitions: (
			source.gtdDefinitions ?? DEFAULT_SETTINGS.gtdDefinitions
		).map((item) => ({
			label: item.label ?? "GTD-status",
			hashtag: normalizeHashtag(item.hashtag ?? "#gtd"),
			synonyms: item.synonyms ?? [],
		})),
		projectDefinitions: (
			source.projectDefinitions ?? DEFAULT_SETTINGS.projectDefinitions
		).map((item) => ({
			name: item.name ?? "Project",
			alias: item.alias ?? "",
			hashtag: normalizeHashtag(item.hashtag ?? "#project"),
		})),
		repeatDefinitions: (
			source.repeatDefinitions ?? DEFAULT_SETTINGS.repeatDefinitions
		).map((item) => ({
			input: item.input ?? "",
			tasksText: item.tasksText ?? "every week",
		})).filter((item) => item.input.trim() && item.tasksText.trim()),
		personDefinitions: (
			source.personDefinitions ?? DEFAULT_SETTINGS.personDefinitions
		).map((item) => ({
			firstName: item.firstName ?? "Person",
			lastName: item.lastName ?? "",
			alias: item.alias ?? "",
			hashtag: normalizeHashtag(item.hashtag ?? "#persoon"),
		})),
		taskTemplates: (() => {
			const savedTemplates = Array.isArray(source.taskTemplates)
				? source.taskTemplates
				: [];
			const combined = [...savedTemplates];

			for (const fallback of DEFAULT_SETTINGS.taskTemplates) {
				if (!combined.some((item) => item.id === fallback.id)) {
					combined.push(fallback);
				}
			}

			const normalized = combined.map((item, index) => ({
				id: item.id || `template-${index + 1}`,
				name: item.name || "Template",
				icon: item.icon || "list-checks",
				mainTask: item.mainTask || "Task",
				subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
				fileNamePattern: item.fileNamePattern || "YYYY-MM-DD [Review]",
				folderPath: item.folderPath || "Reviews",
				noteTemplate:
					item.noteTemplate ||
					"##### Tasks\n\n{{tasks}}\n##### Notes\n\n",
				builtIn: item.builtIn ?? false,
				autoCreate: item.autoCreate ?? false,
				autoCreateWeekday: item.autoCreateWeekday ?? 5,
				properties: item.properties ?? "",
				includeTopThree: item.includeTopThree ?? false,
				includeNextProjectSteps: item.includeNextProjectSteps ?? false,
			}));
			const journalOrder = ["day-journal", "week-review", "month-review"];
			return normalized.sort((a, b) => {
				const aIndex = journalOrder.indexOf(a.id);
				const bIndex = journalOrder.indexOf(b.id);
				if (aIndex < 0 && bIndex < 0) return 0;
				if (aIndex < 0) return 1;
				if (bIndex < 0) return -1;
				return aIndex - bIndex;
			});
		})(),
	};
}

/**
 * TasksNLSettingTab
 *
 * Purpose:
 * Present Tasks NL configuration as compact, editable lists.
 *
 * Responsibility:
 * Let users manage GTD terms, projects and people.
 *
 * Does NOT:
 * Interpret task text or generate Markdown.
 */
export class TasksNLSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: TasksNLPlugin
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("tasks-nl-settings");
		const header = containerEl.createDiv({ cls: "tasks-nl-brand-header" });
		;
		header.createDiv({
			cls: "tasks-nl-brand-subtitle",
			text: "Next Level Productivity for Obsidian",
		});

		const navigation = containerEl.createDiv({ cls: "tasks-nl-settings-navigation" });
		const generalButton = navigation.createEl("button", { text: this.settingText("Algemeen", "General"), cls: "tasks-nl-settings-navigation-tab is-active" });
		const formatsButton = navigation.createEl("button", { text: this.settingText("Dag-, week- en maandformats", "Day, week and month formats"), cls: "tasks-nl-settings-navigation-tab" });
		const generalPane = containerEl.createDiv({ cls: "tasks-nl-settings-pane is-active" });
		const formatsPane = containerEl.createDiv({ cls: "tasks-nl-settings-pane" });
		const activate = (formats: boolean): void => {
			generalPane.toggleClass("is-active", !formats);
			formatsPane.toggleClass("is-active", formats);
			generalButton.toggleClass("is-active", !formats);
			formatsButton.toggleClass("is-active", formats);
		};
		generalButton.addEventListener("click", () => activate(false));
		formatsButton.addEventListener("click", () => activate(true));

		this.renderLanguageSection(generalPane);
		this.renderSyncSection(generalPane);
		this.renderGeneralSection(generalPane);
		this.renderCaptureSection(generalPane);
		this.renderGTDSection(generalPane);
		this.renderRepeatSection(generalPane);
		this.renderProjectSection(generalPane);
		this.renderPeopleSection(generalPane);
		this.renderWorkspaceSection(generalPane);
		this.renderAboutSection(generalPane);
		this.renderTemplatesSection(formatsPane);
	}

	private renderLanguageSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Instellingentaal / Settings language")
			.setDesc(this.settingText("Kies NL voor Nederlandse uitleg of ENG voor Engelse uitleg. Deze keuze wijzigt de uitlegteksten in de instellingen; de taakinvoer blijft instelbaar.", "Choose NL for Dutch explanations or ENG for English explanations. This choice changes the explanatory settings text; task input remains configurable."))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("nl", "NL — Nederlands")
					.addOption("en", "ENG — English")
					.setValue(this.plugin.settings.settingsLanguage)
					.onChange(async (value) => {
						this.plugin.settings.settingsLanguage = value === "en" ? "en" : "nl";
						await this.persist();
						this.display();
					})
			);
	}

	private settingText(nl: string, en: string): string {
		return this.plugin.settings.settingsLanguage === "en" ? en : nl;
	}

	private renderSyncSection(containerEl: HTMLElement): void {
		const description = new DocumentFragment();
		description.append(
			this.settingText(
				"Tasks NL bewaart instellingen in Obsidian’s standaard pluginbestand data.json. Zet op ieder apparaat bij Instellingen → Sync → Vaultconfiguratie synchroniseren de opties voor communityplugins en plugininstellingen aan. Sluit Obsidian daarna volledig af en start opnieuw. ",
				"Tasks NL stores settings in Obsidian’s standard plugin data.json file. On every device, enable community plugins and plugin settings under Settings → Sync → Vault configuration sync. Then fully quit and restart Obsidian. "
			)
		);
		const link = description.createEl("a", {
			text: this.settingText("Open Obsidian Sync-handleiding", "Open the Obsidian Sync guide"),
			href: "https://obsidian.md/help/sync/settings",
		});
		link.setAttr("target", "_blank");
		link.setAttr("rel", "noopener noreferrer");

		new Setting(containerEl)
			.setName(this.settingText("Instellingen synchroniseren", "Sync settings"))
			.setDesc(description);
	}

	private renderGeneralSection(containerEl: HTMLElement): void {
		;

		new Setting(containerEl)
			.setName(this.settingText("Standaard taaktitel", "Default task title"))
			.setDesc(
				this.settingText("Wordt gebruikt wanneer de herkende invoer alleen metadata bevat.", "Used when recognised input contains metadata only.")
			)
			.addText((text) =>
				text
					.setPlaceholder("Task")
					.setValue(this.plugin.settings.defaultTaskTitle)
					.onChange(async (value) => {
						this.plugin.settings.defaultTaskTitle =
							value.trim() || "Task";
						await this.persist();
					})
			);

		new Setting(containerEl)
			.setName(this.settingText("Oorspronkelijke taaktekst behouden", "Keep original task text"))
			.setDesc(
				this.settingText("Behoud herkende datum-, prioriteits- en woordenboektermen in de titel.", "Keep recognised date, priority and dictionary terms in the title.")
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.keepOriginalTaskText)
					.onChange(async (value) => {
						this.plugin.settings.keepOriginalTaskText = value;
						await this.persist();
					})
			);
	}


	private renderCaptureSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(this.settingText("Taakinvoer", "Capture")).setHeading();

		new Setting(containerEl)
			.setName(this.settingText("Voltooide herhaaltaak behouden", "Keep completed recurring task"))
			.setDesc(
				this.settingText("Uit: de Tasks-plugin verwijdert de voltooide herhaling en bewaart alleen de volgende. Aan: voltooide herhalingen blijven als historie staan.", "Off: the Tasks plugin removes the completed occurrence and keeps only the next one. On: completed occurrences remain as history.")
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.keepCompletedRecurringTask)
					.onChange(async (value) => {
						this.plugin.settings.keepCompletedRecurringTask = value;
						await this.persist();
					})
			);

		new Setting(containerEl)
			.setName(this.settingText("Lintpictogram tonen", "Show ribbon icon"))
			.setDesc(this.settingText("Toon een Tasks NL-knop in het linker lint.", "Show a Tasks NL button in the left ribbon."))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showRibbonIcon)
					.onChange(async (value) => {
						this.plugin.settings.showRibbonIcon = value;
						await this.persist();
						this.plugin.refreshOptionalUi();
					})
			);

		new Setting(containerEl)
			.setName(this.settingText("Workspace-pictogram tonen", "Show Workspace icon"))
			.setDesc(this.settingText("Toon een Tasks NL Workspace-knop in het linker lint.", "Show a Tasks NL Workspace button in the left ribbon."))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showWorkspaceRibbonIcon)
					.onChange(async (value) => {
						this.plugin.settings.showWorkspaceRibbonIcon = value;
						await this.persist();
						this.plugin.refreshOptionalUi();
					})
			);

		new Setting(containerEl)
			.setName(this.settingText("Statusbalkitem tonen", "Show status bar item"))
			.setDesc(this.settingText("Toon Tasks NL in de statusbalk.", "Show Tasks NL in the status bar."))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBarItem)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBarItem = value;
						await this.persist();
						this.plugin.refreshOptionalUi();
					})
			);

		new Setting(containerEl)
			.setName(this.settingText("Livevoorbeeld tonen", "Show live preview"))
			.setDesc(this.settingText("Toon tijdens het typen hoe de taak wordt geïnterpreteerd.", "Show the interpreted task while typing."))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showPreview)
					.onChange(async (value) => {
						this.plugin.settings.showPreview = value;
						await this.persist();
					})
			);
	}

	private renderRepeatSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(this.settingText("Datums en herhaling", "Dates and recurrence")).setHeading();
		new Setting(containerEl)
			.setName(this.settingText("Startwoorden", "Start-date words"))
			.setDesc(this.settingText("Komma-gescheiden woorden die expliciet een optionele startdatum invoeren. Zonder zo'n woord wordt alleen de einddatum gebruikt.", "Comma-separated words that explicitly introduce an optional start date. Without one, only the due date is used."))
			.addText((text) => text
				.setPlaceholder("start op, vanaf")
				.setValue(this.plugin.settings.startDateWords.join(", "))
				.onChange(async (value) => {
					this.plugin.settings.startDateWords = parseSynonyms(value);
					await this.persist();
				}));

		new Setting(containerEl)
			.setName(this.settingText("Herhalingswoorden", "Recurrence phrases"))
			.setDesc(this.settingText("Vrije, komma-gescheiden invoerwoorden, bijvoorbeeld ‘elke, om de’.", "Free comma-separated input phrases, for example ‘every, each’."))
			.addText((text) => text
				.setPlaceholder("elke, om de")
				.setValue(this.plugin.settings.repeatKeywords.join(", "))
				.onChange(async (value) => {
					this.plugin.settings.repeatKeywords = parseSynonyms(value);
					await this.persist();
				}));
	}

	private renderTemplatesSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(this.settingText("Journaalformats", "Journal formats")).setHeading();
		containerEl.createEl("p", {
			text: this.settingText("Stel hier afzonderlijk het dagjournaal en de week- en maandreviews in. Wijzigingen worden automatisch opgeslagen en het voorbeeld wordt direct bijgewerkt.", "Configure the daily journal and weekly and monthly reviews separately. Changes are saved automatically and the preview updates immediately."),
			cls: "setting-item-description",
		});

		const tabs = containerEl.createDiv({ cls: "tasks-nl-template-tabs" });
		const panels = containerEl.createDiv();
		const order = ["day-journal", "week-review", "month-review"];
		const templates = this.plugin.settings.taskTemplates
			.filter((item) => order.includes(item.id))
			.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
		let activeId = templates[0]?.id;
		for (const template of templates) {
			const layout = containerEl.createDiv({ cls: "tasks-nl-review-settings-layout" });
			panels.appendChild(layout);
			layout.toggleClass("is-active", template.id === activeId);
			const tab = tabs.createEl("button", { text: template.id === "day-journal" ? this.settingText("Dag", "Day") : template.id === "week-review" ? this.settingText("Week", "Week") : this.settingText("Maand", "Month"), cls: "tasks-nl-template-tab" });
			tab.addEventListener("click", () => {
				activeId = template.id;
				panels.querySelectorAll(":scope > .tasks-nl-review-settings-layout").forEach((panel) => panel.toggleClass("is-active", panel === layout));
				tabs.querySelectorAll("button").forEach((button) => button.toggleClass("is-active", button === tab));
			});
			tab.toggleClass("is-active", template.id === activeId);
			const controls = layout.createDiv({ cls: "tasks-nl-review-settings-controls" });
			const preview = layout.createDiv({ cls: "tasks-nl-review-settings-preview" });
			new Setting(controls).setName(this.settingText("Aanmaken en planning", "Creation and schedule")).setHeading();
			new Setting(preview).setName(this.settingText("Voorbeeld", "Preview")).setHeading();

			const refreshPreview = (): void => {
				preview.querySelectorAll(":scope > pre, :scope > .tasks-nl-review-preview-file").forEach((el) => el.remove());
				const fileName = moment().format(template.fileNamePattern || "YYYY-MM-DD [Review]");
				preview.createDiv({ cls: "tasks-nl-review-preview-file", text: `${template.folderPath ? `${template.folderPath}/` : ""}${fileName}.md` });
				const tasks = [`- [ ] ${template.mainTask.replace(/\{\{filename\}\}/giu, fileName)} #tasks-nl-review`, ...template.subtasks.map((item) => `  - [ ] ${item}`)].join("\n");
				const values: Record<string, string> = { tasks, filename: fileName, date: moment().format("YYYY-MM-DD"), day: moment().format("dddd"), week: moment().format("WW"), month: moment().format("MMMM"), month_number: moment().format("MM"), year: moment().format("YYYY"), review_type: template.name };
				const replaceCodes = (value: string): string => value.replace(/\{\{?(tasks|filename|date|day|week|month|month_number|year|review_type)\}?\}/giu, (match, key: string) => values[key.toLocaleLowerCase()] ?? match);
				let previewTemplate = template.noteTemplate || "##### Journaal\n\n";
				if (template.id === "day-journal") {
					previewTemplate = renderDailyJournalSections(
						previewTemplate,
						template.includeTopThree ?? false,
						template.includeNextProjectSteps ?? false,
						"- [ ] Voorbeeld focustaak 1\n- [ ] Voorbeeld focustaak 2\n- [ ] Voorbeeld focustaak 3",
						"- [ ] Voorbeeld van een eerstvolgende projectstap",
					);
				}
				const rendered = replaceCodes(previewTemplate);
				const rawProperties = (template.properties ?? "").trim();
				const properties = (rawProperties.match(/^---\s*\r?\n([\s\S]*?)\r?\n---$/u)?.[1] ?? rawProperties).trim();
				const existingFrontmatter = rendered.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/u);
				if (properties && existingFrontmatter) {
					const body = rendered.slice(existingFrontmatter[0].length);
					preview.createEl("pre", { text: `---\n${existingFrontmatter[1]?.trim() ?? ""}\n${replaceCodes(properties)}\n---\n${body}` });
				} else {
					preview.createEl("pre", { text: properties ? `---\n${replaceCodes(properties)}\n---\n${rendered}` : rendered });
				}
			};
			new Setting(controls)
				.setName(this.settingText("Automatisch aanmaken", "Automatic creation"))
				.setDesc(template.id === "day-journal" ? this.settingText("Controleer bij opstarten of herladen of vandaag al bestaat.", "Check at startup or reload whether today's journal exists.") : this.settingText("Maak de evaluatie automatisch aan op de geselecteerde weekdag.", "Create the review automatically on the selected weekday."))
				.addToggle((toggle) =>
					toggle
						.setValue(template.autoCreate ?? false)
						.onChange((value) => {
							template.autoCreate = value;
							void this.persist();
						}),
				);

			if (template.id !== "day-journal") new Setting(controls)
				.setName(this.settingText("Weekdag", "Weekday"))
				.setDesc(this.settingText("Vrijdag is de standaard. De maandreview gebruikt de laatste gekozen weekdag van de maand.", "Friday is the default. The monthly review uses the last selected weekday of the month."))
				.addDropdown((dropdown) => {
					const weekdays: Array<[number, string, string]> = [
						[1, "Maandag", "Monday"],
						[2, "Dinsdag", "Tuesday"],
						[3, "Woensdag", "Wednesday"],
						[4, "Donderdag", "Thursday"],
						[5, "Vrijdag", "Friday"],
						[6, "Zaterdag", "Saturday"],
						[0, "Zondag", "Sunday"],
					];
					weekdays.forEach(([value, nlLabel, enLabel]) => {
						dropdown.addOption(String(value), this.settingText(nlLabel, enLabel));
					});

					dropdown
						.setValue(String(template.autoCreateWeekday ?? 5))
						.onChange((value) => {
							template.autoCreateWeekday = Number(value);
							void this.persist();
						});
				});

			let journalEditor: HTMLTextAreaElement | null = null;
			const applyJournalSwitches = (): void => {
				if (template.id !== "day-journal") return;
				template.noteTemplate = synchronizeDailyJournalBlocks(
					template.noteTemplate,
					template.includeTopThree ?? false,
					template.includeNextProjectSteps ?? false,
				);
				if (journalEditor) journalEditor.value = template.noteTemplate;
				refreshPreview();
				void this.persist();
			};

			if (template.id === "day-journal") {
				new Setting(controls).setName(this.settingText("Top 1, 2 en 3 opnemen", "Include top 1, 2 and 3")).addToggle((toggle) => toggle.setValue(template.includeTopThree ?? false).onChange((value) => { template.includeTopThree = value; applyJournalSwitches(); }));
				new Setting(controls).setName(this.settingText("Eerstvolgende projectstappen opnemen", "Include next project steps")).addToggle((toggle) => toggle.setValue(template.includeNextProjectSteps ?? false).onChange((value) => { template.includeNextProjectSteps = value; applyJournalSwitches(); }));
			}

			new Setting(controls).setName(this.settingText("Bestand", "File")).setHeading();

			new Setting(controls)
				.setName(this.settingText("Map in kluis", "Folder in vault"))
				.setDesc(template.id === "day-journal"
					? this.settingText("In deze map worden de automatisch aangemaakte dagjournalen opgeslagen.", "Automatically created daily journals are stored in this folder.")
					: this.settingText("Week- en maandreviews mogen dezelfde map gebruiken.", "Weekly and monthly reviews may use the same folder."))
				.addText((text) =>
					text
						.setPlaceholder("Reviews")
						.setValue(template.folderPath)
						.onChange((value) => {
							template.folderPath = value.trim();

							void this.persist().then(() => {
								refreshPreview();
							});
						}),
				);

			new Setting(controls)
				.setName(this.settingText("Bestandsnaamformaat", "Filename format"))
				.setDesc(this.settingText("Gebruik Moment-syntax. Zet vaste tekst tussen vierkante haken; rechts staat een voorbeeld.", "Use Moment syntax. Put literal text in square brackets; an example appears on the right."))
				.addText((text) =>
					text
						.setValue(template.fileNamePattern)
						.onChange((value) => {
							template.fileNamePattern =
								value.trim() || "YYYY-MM-DD [Review]";

							void this.persist().then(() => {
								refreshPreview();
							});
						}),
				);

			if (template.id !== "day-journal") new Setting(controls)
				.setName(this.settingText("Hoofdtaak", "Main task"))
				.setDesc(this.settingText("Gebruik {{FILENAME}} om de gegenereerde notitienaam in te voegen.", "Use {{FILENAME}} to insert the generated note name."))
				.addText((text) =>
					text
						.setValue(template.mainTask)
						.onChange((value) => {
							template.mainTask = value;

							void this.persist().then(() => {
								refreshPreview();
							});
						}),
				);

			new Setting(controls).setName(this.settingText("Inhoud", "Content")).setHeading();
			controls.createEl("label", { text: this.settingText("Properties (YAML, zonder ---)", "Properties (YAML, without ---)"), cls: "tasks-nl-review-editor-label" });
			controls.createEl("p", { text: this.settingText("Eén property per regel, bijvoorbeeld type: dagjournaal. Als het Markdownformat al properties bevat, worden deze samengevoegd.", "Enter one property per line, for example type: daily-journal. If the Markdown template already contains properties, they are merged."), cls: "setting-item-description" });
			const properties = controls.createEl("textarea", { cls: "tasks-nl-template-properties", attr: { rows: "5" } });
			properties.value = template.properties ?? "";
			let saveTimer: number | undefined;
			const schedulePersist = (): void => {
				if (saveTimer !== undefined) window.clearTimeout(saveTimer);
				saveTimer = window.setTimeout(() => void this.persist(), 300);
			};
			properties.addEventListener("input", () => { template.properties = properties.value; refreshPreview(); schedulePersist(); });

			if (template.id !== "day-journal") controls.createEl("label", {
				text: this.settingText("Deeltaken, één per regel", "Subtasks, one per line"),
				cls: "tasks-nl-review-editor-label",
			});

			const subtasks = template.id !== "day-journal" ? controls.createEl("textarea", {
				cls: "tasks-nl-template-subtasks",
				attr: { rows: "6" },
			}) : null;

			if (subtasks) subtasks.value = template.subtasks.join("\n");

			subtasks?.addEventListener("input", () => {
				template.subtasks = subtasks.value
					.split(/\r?\n/u)
					.map((item) => item.trim())
					.filter(Boolean);

				refreshPreview();
			});

			subtasks?.addEventListener("change", () => {
				void this.persist();
			});

			controls.createEl("label", {
				text: this.settingText("Markdownformat", "Markdown template"),
				cls: "tasks-nl-review-editor-label",
			});

			const editor = controls.createEl("textarea", {
				cls: "tasks-nl-review-markdown-editor",
				attr: {
					rows: "16",
					spellcheck: "false",
				},
			});
			journalEditor = editor;

			if (template.id === "day-journal") {
				const synchronized = synchronizeDailyJournalBlocks(
					template.noteTemplate,
					template.includeTopThree ?? false,
					template.includeNextProjectSteps ?? false,
				);
				if (synchronized !== template.noteTemplate) {
					template.noteTemplate = synchronized;
					void this.persist();
				}
			}
			editor.value = template.noteTemplate;

			editor.addEventListener("input", () => {
				template.noteTemplate = editor.value;
				refreshPreview();
				schedulePersist();
			});

			controls.createEl("p", {
				cls: "setting-item-description",
				text: this.settingText("Codes: {TASKS} of {{TASKS}}, {DATE} of {{DATE}}, DAY, WEEK, MONTH, MONTH_NUMBER, YEAR, FILENAME en REVIEW_TYPE. Alleen deze bekende codes worden vervangen; overige accolades en code blijven ongewijzigd.", "Codes: {TASKS} or {{TASKS}}, {DATE} or {{DATE}}, DAY, WEEK, MONTH, MONTH_NUMBER, YEAR, FILENAME and REVIEW_TYPE. Only these known codes are replaced; other braces and code remain unchanged."),
			});

			refreshPreview();
		}
	}

	private renderWorkspaceSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Workspace").setHeading();

		new Setting(containerEl)
			.setName(this.settingText("Uitgesloten tags", "Excluded tags"))
			.setDesc(this.settingText("Taken met deze tags worden buiten Inbox en Actueel verborgen. Scheid meerdere tags met komma’s.", "Tasks with these tags are hidden outside Inbox and Actual. Separate multiple tags with commas."))
			.addText((text) => text
				.setPlaceholder("#reminders, #archive")
				.setValue(this.plugin.settings.workspaceExcludedTags.join(", "))
				.onChange(async (value) => {
					this.plugin.settings.workspaceExcludedTags = parseSynonyms(value).map(normalizeHashtag).filter(Boolean);
					await this.persist();
				}));
	}

	private renderAboutSection(containerEl: HTMLElement): void {
		const about = containerEl.createDiv({ cls: "tasks-nl-about" });

		const logo = about.createDiv({
			cls: "tasks-nl-about-logo tasks-nl-about-logo-icon",
			attr: { "aria-label": "Tasks NL" },
		});
		setIcon(logo, "list-checks");
		about.createEl("strong", { text: "Tasks NL" });
		about.createEl("small", {
			text: "Next level productivity for Obsidian",
		});
		about.createEl("small", {
			text: `Version ${this.plugin.manifest.version} · Designed by Joost van der Hulst`,
		});
		about.createEl("small", {
			text: "Project: Bedrijfsvoering in balans",
		});
		const links = about.createEl("small");
		links.createEl("a", {
			text: "GitHub",
			href: "https://github.com/hulhec/Task-NL",
		});
		links.appendText(" · ");
		links.createEl("a", {
			text: "Website",
			href: "https://www.ikstaevenstilbij.nl",
		});
	}

	private renderGTDSection(containerEl: HTMLElement): void {
		const section = this.createSection(
			containerEl,
			this.settingText("GTD-statussen", "GTD statuses"),
			this.settingText("Naam, herkenningswoorden en hashtag staan naast elkaar.", "Name, recognised terms and hashtag are shown side by side.")
		);

		const table = this.createTable(section, "tasks-nl-table--gtd", [
			this.settingText("Naam", "Name"),
			this.settingText("Herkenningswoorden", "Search terms"),
			"Hashtag",
			"",
		]);

		for (const definition of this.plugin.settings.gtdDefinitions) {
			const row = table.createDiv({ cls: "tasks-nl-table-row" });

			this.createTextInput(row, definition.label, "Waiting For", async (value) => {
				definition.label = value.trim();
				await this.persist();
			});

			this.createTextInput(
				row,
				definition.synonyms.join(", "),
				"wachten, wachten op, pauze",
				async (value) => {
					definition.synonyms = parseSynonyms(value);
					await this.persist();
				}
			);

			this.createTextInput(
				row,
				definition.hashtag,
				"#waiting-for",
				async (value) => {
					definition.hashtag = normalizeHashtag(value);
					await this.persist();
				}
			);


			this.createDeleteButton(row, async () => {
				this.plugin.settings.gtdDefinitions =
					this.plugin.settings.gtdDefinitions.filter(
						(item) => item !== definition
					);
				await this.persist(true);
			});
		}

		this.createAddButton(section, this.settingText("GTD-status toevoegen", "Add GTD status"), async () => {
			this.plugin.settings.gtdDefinitions.push({
				label: "New status",
				hashtag: "#nieuwe-status",
				synonyms: [],
			});
			await this.persist(true);
		});
	}

	private renderProjectSection(containerEl: HTMLElement): void {
		const section = this.createSection(
			containerEl,
			this.settingText("Projecten", "Projects"),
			this.settingText("Een project wordt herkend aan naam, afkorting of bestaande hashtag. Gebruik voor elk project een unieke hashtag.", "A project is recognised by its name, abbreviation, or existing hashtag. Use a unique hashtag for every project.")
		);

		const table = this.createTable(section, "tasks-nl-table--projects", [
			this.settingText("Naam", "Name"),
			this.settingText("Afkorting", "Abbreviation"),
			"Hashtag",
			"",
		]);

		for (const definition of this.plugin.settings.projectDefinitions) {
			const row = table.createDiv({ cls: "tasks-nl-table-row" });

			this.createTextInput(row, definition.name, "Project name", async (value) => {
				definition.name = value.trim();
				await this.persist();
			});

			this.createTextInput(row, definition.alias, "Abbreviation", async (value) => {
				definition.alias = value.trim();
				await this.persist();
			});

			this.createTextInput(row, definition.hashtag, "#project", async (value) => {
				definition.hashtag = normalizeHashtag(value);
				await this.persist();
			});


			this.createDeleteButton(row, async () => {
				this.plugin.settings.projectDefinitions =
					this.plugin.settings.projectDefinitions.filter(
						(item) => item !== definition
					);
				await this.persist(true);
			});
		}

		this.createAddButton(section, this.settingText("Project toevoegen", "Add project"), async () => {
			const used = new Set(this.plugin.settings.projectDefinitions.map((item) => normalizeHashtag(item.hashtag)));
			let number = this.plugin.settings.projectDefinitions.length + 1;
			let hashtag = `#new-project-${number}`;
			while (used.has(hashtag)) {
				number += 1;
				hashtag = `#new-project-${number}`;
			}
			this.plugin.settings.projectDefinitions.push({
				name: `New project ${number}`,
				alias: "",
				hashtag,
			});
			await this.persist(true);
		});
	}

	private renderPeopleSection(containerEl: HTMLElement): void {
		const section = this.createSection(
			containerEl,
			this.settingText("Personen", "People"),
			this.settingText("Een persoon wordt herkend aan voornaam, volledige naam, afkorting of hashtag. Per taak worden maximaal twee personen verwerkt en in de Workspace getoond.", "A person is recognised by first name, full name, abbreviation, or hashtag. A maximum of two people is processed per task and shown in the Workspace.")
		);

		const table = this.createTable(section, "tasks-nl-table--people", [
			this.settingText("Voornaam", "First name"),
			this.settingText("Achternaam", "Last name"),
			this.settingText("Afkorting", "Abbreviation"),
			"Hashtag",
			"",
		]);

		for (const definition of this.plugin.settings.personDefinitions) {
			const row = table.createDiv({ cls: "tasks-nl-table-row" });

			this.createTextInput(
				row,
				definition.firstName,
				"First name",
				async (value) => {
					definition.firstName = value.trim();
					await this.persist();
				}
			);

			this.createTextInput(
				row,
				definition.lastName,
				"Last name",
				async (value) => {
					definition.lastName = value.trim();
					await this.persist();
				}
			);

			this.createTextInput(row, definition.alias, "Abbreviation", async (value) => {
				definition.alias = value.trim();
				await this.persist();
			});

			this.createTextInput(row, definition.hashtag, "#persoon", async (value) => {
				definition.hashtag = normalizeHashtag(value);
				await this.persist();
			});


			this.createDeleteButton(row, async () => {
				this.plugin.settings.personDefinitions =
					this.plugin.settings.personDefinitions.filter(
						(item) => item !== definition
					);
				await this.persist(true);
			});
		}

		this.createAddButton(section, this.settingText("Persoon toevoegen", "Add person"), async () => {
			this.plugin.settings.personDefinitions.push({
				firstName: "New",
				lastName: "Person",
				alias: "",
				hashtag: "#nieuwe-persoon",
			});
			await this.persist(true);
		});
	}

	private createSection(
		containerEl: HTMLElement,
		title: string,
		description: string
	): HTMLElement {
		const section = containerEl.createDiv({ cls: "tasks-nl-settings-section" });
		new Setting(section).setName(title).setHeading();
		section.createEl("p", {
			text: description,
			cls: "setting-item-description",
		});
		return section;
	}

	private createTable(
		parent: HTMLElement,
		modifierClass: string,
		headers: string[]
	): HTMLElement {
		const table = parent.createDiv({
			cls: `tasks-nl-table ${modifierClass}`,
		});
		const header = table.createDiv({
			cls: "tasks-nl-table-row tasks-nl-table-header",
		});

		for (const label of headers) {
			header.createDiv({ text: label });
		}

		return table;
	}

	private createTextInput(
		parent: HTMLElement,
		value: string,
		placeholder: string,
		onChange: (value: string) => Promise<void>
	): HTMLInputElement {
		const input = parent.createEl("input", {
			type: "text",
			value,
			placeholder,
			cls: "tasks-nl-table-input",
		});

		input.addEventListener("change", () => {
			void onChange(input.value);
		});

		return input;
	}

	private createDeleteButton(
		parent: HTMLElement,
		onClick: () => Promise<void>
	): HTMLButtonElement {
		const button = parent.createEl("button", {
			text: this.settingText("Verwijderen", "Delete"),
			cls: "mod-warning tasks-nl-delete-button",
			attr: {
				type: "button",
				"aria-label": this.settingText("Verwijderen", "Delete"),
			},
		});

		button.addEventListener("click", () => {
			void onClick();
		});

		return button;
	}

	private createAddButton(
		parent: HTMLElement,
		label: string,
		onClick: () => Promise<void>
	): HTMLButtonElement {
		const button = parent.createEl("button", {
			text: label,
			cls: "mod-cta tasks-nl-add-button",
			attr: { type: "button" },
		});

		button.addEventListener("click", () => {
			void onClick();
		});

		return button;
	}

	private async persist(redisplay = false): Promise<void> {
		await this.plugin.saveSettings();

		if (redisplay) {
			this.display();
		}
	}
}
