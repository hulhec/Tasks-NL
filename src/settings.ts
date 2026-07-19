import { App, moment, PluginSettingTab, Setting } from "obsidian";
import TasksNLPlugin from "./main";

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
	defaultTaskTitle: "Task",
	keepOriginalTaskText: false,
	keepCompletedRecurringTask: false,
	showRibbonIcon: false,
	showWorkspaceRibbonIcon: true,
	showStatusBarItem: false,
	showPreview: true,
	workspaceExcludedTags: ["#reminders"],
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
		{ input: "iedere week", tasksText: "every week" },
		{ input: "elke week", tasksText: "every week" },
		{ input: "iedere maand", tasksText: "every month" },
		{ input: "elke maand", tasksText: "every month" },
	],
	projectDefinitions: [
		{
			name: "CRM",
			alias: "crm",
			hashtag: "#crm",
		},
	],
	taskTemplates: [
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
			firstName: "Peter",
			lastName: "",
			alias: "peter",
			hashtag: "#peter",
		},
	],
};

export function normalizeHashtag(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
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
			const savedTemplates = source.taskTemplates ?? [];
			const reviewTemplates = DEFAULT_SETTINGS.taskTemplates.map((fallback) => savedTemplates.find((item) => item.id === fallback.id) ?? fallback);
			return reviewTemplates.map((item, index) => {
				let mainTask = item.mainTask || "Task";
				// Migrate the first template implementation without overwriting user edits.
				if (item.id === "week-review" && mainTask === "Week review {{date}} weekly") {
					mainTask = "Week review week {{week}}";
				}
				if (item.id === "month-review" && mainTask === "Month review {{month}} monthly") {
					mainTask = "Month review {{month}}";
				}
				return {
					id: item.id || `template-${index + 1}`,
					name: item.name || "Template",
					icon: item.icon || "list-checks",
					mainTask,
					subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
					fileNamePattern: item.fileNamePattern || (item.id === "week-review" ? "[Weekreview] WW YYYY" : item.id === "month-review" ? "[Maandreview] MMMM YYYY" : "YYYY-MM-DD [Review]"),
					folderPath: item.folderPath || "Reviews",
					noteTemplate: item.noteTemplate || `##### Tasks\n\n{{tasks}}\n##### New tasks after the review\n\n\n##### Summary\n\n`,
					builtIn: item.builtIn ?? false,
					autoCreate: item.autoCreate ?? false,
					autoCreateWeekday: item.autoCreateWeekday ?? 5,
				};
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

		this.renderLanguageSection(containerEl);
		this.renderGeneralSection(containerEl);
		this.renderCaptureSection(containerEl);
		this.renderGTDSection(containerEl);
		this.renderRepeatSection(containerEl);
		this.renderProjectSection(containerEl);
		this.renderPeopleSection(containerEl);
		this.renderTemplatesSection(containerEl);
		this.renderWorkspaceSection(containerEl);
		this.renderAboutSection(containerEl);
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
		new Setting(containerEl).setName(this.settingText("Herhalingsopdrachten", "Recurrence commands")).setHeading();
		containerEl.createEl("p", {
			text: this.settingText(
				"Voer links de tekst in die je wilt typen en rechts de Engelse Tasks-instructie. Enkelvoud en meervoud worden herkend, bijvoorbeeld ‘elke week’, ‘elke twee weken’ en ‘elke drie maanden’.",
				"Enter the phrase you want to type in the left field and the English Tasks recurrence instruction in the right field. Singular and plural intervals are supported, for example ‘every week’, ‘every two weeks’, and ‘every three months’."
			),
			cls: "setting-item-description",
		});
		for (const [index, definition] of this.plugin.settings.repeatDefinitions.entries()) {
			new Setting(containerEl)
				.setName(`${this.settingText("Herhaling", "Recurrence")} ${index + 1}`)
				.setDesc(this.settingText("Veld 1: invoertekst. Veld 2: Engelse Tasks-instructie.", "Field 1: input phrase. Field 2: English Tasks instruction."))
				.addText((text) => text.setPlaceholder("volgende week").setValue(definition.input).onChange(async (value) => {
					definition.input = value;
					await this.persist();
				}))
				.addText((text) => text.setPlaceholder("every week").setValue(definition.tasksText).onChange(async (value) => {
					definition.tasksText = value;
					await this.persist();
				}))
				.addButton((button) => button.setButtonText(this.settingText("Verwijder", "Remove")).onClick(async () => {
					this.plugin.settings.repeatDefinitions.splice(index, 1);
					await this.persist();
					this.display();
				}));
		}
		new Setting(containerEl).addButton((button) => button.setButtonText(this.settingText("Herhaling toevoegen", "Add recurrence")).setCta().onClick(async () => {
			this.plugin.settings.repeatDefinitions.push({ input: "", tasksText: "every week" });
			await this.persist();
			this.display();
		}));
	}

	private renderTemplatesSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(this.settingText("Evaluaties", "Reviews")).setHeading();
		containerEl.createEl("p", {
			text: this.settingText("Configureer de wekelijkse en maandelijkse evaluatienotities. Het voorbeeld wordt direct bijgewerkt.", "Configure the weekly and monthly review notes. The preview updates immediately."),
			cls: "setting-item-description",
		});

		for (const template of this.plugin.settings.taskTemplates.filter((item) => item.id === "week-review" || item.id === "month-review")) {
			const layout = containerEl.createDiv({ cls: "tasks-nl-review-settings-layout" });
			const controls = layout.createDiv({ cls: "tasks-nl-review-settings-controls" });
			const preview = layout.createDiv({ cls: "tasks-nl-review-settings-preview" });
			new Setting(controls).setName("").setHeading();
			new Setting(preview).setName(this.settingText("Voorbeeld", "Preview")).setHeading();

			const refreshPreview = (): void => {
				preview.querySelectorAll(":scope > pre, :scope > .tasks-nl-review-preview-file").forEach((el) => el.remove());
				const fileName = moment().format(template.fileNamePattern || "YYYY-MM-DD [Review]");
				preview.createDiv({ cls: "tasks-nl-review-preview-file", text: `${template.folderPath ? `${template.folderPath}/` : ""}${fileName}.md` });
				const tasks = [`- [ ] ${template.mainTask.replace(/\{\{filename\}\}/giu, fileName)} #tasks-nl-review`, ...template.subtasks.map((item) => `  - [ ] ${item}`)].join("\n");
				const rendered = (template.noteTemplate || "##### Tasks\n\n{{TASKS}}\n")
					.replace(/\{\{tasks\}\}/giu, tasks)
					.replace(/\{\{filename\}\}/giu, fileName)
					.replace(/\{\{date\}\}/giu, moment().format("YYYY-MM-DD"))
					.replace(/\{\{day\}\}/giu, moment().format("dddd"))
					.replace(/\{\{week\}\}/giu, moment().format("WW"))
					.replace(/\{\{month\}\}/giu, moment().format("MMMM"))
					.replace(/\{\{month_number\}\}/giu, moment().format("MM"))
					.replace(/\{\{year\}\}/giu, moment().format("YYYY"))
					.replace(/\{\{review_type\}\}/giu, template.name);
				preview.createEl("pre", { text: rendered });
			};
			new Setting(controls)
				.setName(this.settingText("Automatisch aanmaken", "Automatic creation"))
				.setDesc(this.settingText("Maak de evaluatie automatisch aan op de geselecteerde weekdag.", "Create the review automatically on the selected weekday."))
				.addToggle((toggle) =>
					toggle
						.setValue(template.autoCreate ?? false)
						.onChange((value) => {
							template.autoCreate = value;
							void this.persist();
						}),
				);

			new Setting(controls)
				.setName(this.settingText("Weekdag", "Weekday"))
				.setDesc(
					"Friday is the default. The monthly review uses the last selected weekday in the month.",
				)
				.addDropdown((dropdown) => {
					[
						[1, "Monday"],
						[2, "Tuesday"],
						[3, "Wednesday"],
						[4, "Thursday"],
						[5, "Friday"],
						[6, "Saturday"],
						[0, "Sunday"],
					].forEach(([value, label]) => {
						dropdown.addOption(String(value), String(label));
					});

					dropdown
						.setValue(String(template.autoCreateWeekday ?? 5))
						.onChange((value) => {
							template.autoCreateWeekday = Number(value);
							void this.persist();
						});
				});

			new Setting(controls)
				.setName(this.settingText("Map in kluis", "Folder in vault"))
				.setDesc(this.settingText("Beide evaluatietypen mogen dezelfde map gebruiken.", "Both review types may use the same folder."))
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
				.setDesc(
					"Moment syntax. Literal text goes in square brackets. Example shown on the right.",
				)
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

			new Setting(controls)
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

			controls.createEl("label", {
				text: "Subtasks, one per line",
				cls: "tasks-nl-review-editor-label",
			});

			const subtasks = controls.createEl("textarea", {
				cls: "tasks-nl-template-subtasks",
				attr: { rows: "6" },
			});

			subtasks.value = template.subtasks.join("\n");

			subtasks.addEventListener("input", () => {
				template.subtasks = subtasks.value
					.split(/\r?\n/u)
					.map((item) => item.trim())
					.filter(Boolean);

				refreshPreview();
			});

			subtasks.addEventListener("change", () => {
				void this.persist();
			});

			controls.createEl("label", {
				text: "Markdown template",
				cls: "tasks-nl-review-editor-label",
			});

			const editor = controls.createEl("textarea", {
				cls: "tasks-nl-review-markdown-editor",
				attr: {
					rows: "16",
					spellcheck: "false",
				},
			});

			editor.value = template.noteTemplate;

			editor.addEventListener("input", () => {
				template.noteTemplate = editor.value;
				refreshPreview();
			});

			editor.addEventListener("change", () => {
				void this.persist();
			});

			controls.createEl("p", {
				cls: "setting-item-description",
				text: "Variables: {{TASKS}}, {{DATE}}, {{DAY}}, {{WEEK}}, {{MONTH}}, {{MONTH_NUMBER}}, {{YEAR}}, {{FILENAME}}, {{REVIEW_TYPE}}. Put {{TASKS}} exactly where the task list should appear.",
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

		if (this.plugin.manifest.dir) {
			about.createEl("img", {
				cls: "tasks-nl-about-logo",
				attr: {
					src: this.app.vault.adapter.getResourcePath(
						`${this.plugin.manifest.dir}/assets/bib-logo.png`
					),
					alt: "Bedrijfsvoering in balans",
				},
			});
		}
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
			"GTD statuses",
			"Name, recognised terms and hashtag are shown side by side."
		);

		const table = this.createTable(section, "tasks-nl-table--gtd", [
			"Name",
			"Search terms",
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

		this.createAddButton(section, "Add GTD status", async () => {
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
			"Projects",
			this.settingText("Een project wordt herkend aan naam, afkorting of bestaande hashtag. Gebruik voor elk project een unieke hashtag.", "A project is recognised by its name, abbreviation, or existing hashtag. Use a unique hashtag for every project.")
		);

		const table = this.createTable(section, "tasks-nl-table--projects", [
			"Name",
			"Abbreviation",
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
			"People",
			this.settingText("Een persoon wordt herkend aan voornaam, volledige naam, afkorting of hashtag. Per taak worden maximaal twee personen verwerkt en in de Workspace getoond.", "A person is recognised by first name, full name, abbreviation, or hashtag. A maximum of two people is processed per task and shown in the Workspace.")
		);

		const table = this.createTable(section, "tasks-nl-table--people", [
			"First name",
			"Last name",
			"Abbreviation",
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

		this.createAddButton(section, "Add person", async () => {
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
		new Setting(section).setName("").setHeading();
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
			text: "Delete",
			cls: "mod-warning tasks-nl-delete-button",
			attr: {
				type: "button",
				"aria-label": "Delete",
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
