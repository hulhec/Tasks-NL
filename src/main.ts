import { Editor, moment, Plugin, TFile } from "obsidian";
import { TaskRepository } from "./repository/TaskRepository";
import type { Task } from "./models/Task";
import { TaskCreationService } from "./services/TaskCreationService";
import { RecurringTaskService } from "./services/RecurringTaskService";
import {
	TasksNLSettings,
	TasksNLSettingTab,
} from "./settings";
import { SettingsManager } from "./services/SettingsManager";
import { NewTaskModal } from "./ui/NewTaskModal";
import { TemplatePickerModal } from "./ui/TemplatePickerModal";
import type { TaskTemplate } from "./settings";
import type { EditableSubtask } from "./ui/NewTaskModal";
import {
	TASKS_NL_WORKSPACE_VIEW,
	TasksNLWorkspaceView,
} from "./workspace/WorkspaceView";

export default class TasksNLPlugin extends Plugin {
	settings!: TasksNLSettings;
	repository!: TaskRepository;
	private recurringTaskService!: RecurringTaskService;

	private ribbonIcon?: HTMLElement;
	private workspaceRibbonIcon?: HTMLElement;
	private statusBarItem?: HTMLElement;

	private settingsManager!: SettingsManager;

	async onload(): Promise<void> {
		this.settingsManager = new SettingsManager(this);
		this.settings = await this.settingsManager.load();
		this.repository = new TaskRepository(this.app);
		this.recurringTaskService = new RecurringTaskService(this.app);

		this.registerEvent(this.app.vault.on("modify", (file) => {
			if (!(file instanceof TFile)) return;
			void this.recurringTaskService.handleModify(file);
		}));
		this.registerEvent(this.app.vault.on("create", (file) => {
			if (!(file instanceof TFile)) return;
			if (file.extension === "md") {
				void this.app.vault.cachedRead(file).then((content) =>
					this.recurringTaskService.remember(file, content)
				);
			}
		}));
		this.registerEvent(this.app.vault.on("delete", (file) => {
			this.recurringTaskService.forget(file.path);
		}));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			this.recurringTaskService.forget(oldPath);
			if (file instanceof TFile && file.extension === "md") {
				void this.app.vault.cachedRead(file).then((content) =>
					this.recurringTaskService.remember(file, content)
				);
			}
		}));

		this.registerView(
			TASKS_NL_WORKSPACE_VIEW,
			(leaf) => new TasksNLWorkspaceView(leaf, this)
		);

		this.refreshOptionalUi();
		this.addSettingTab(new TasksNLSettingTab(this.app, this));

		this.addCommand({
			id: "open-workspace",
			name: "Open workspace",
			icon: "layout-dashboard",
			callback: () => void this.activateWorkspace(),
		});

		this.addCommand({
			id: "create-from-template",
			name: "Create task from template",
			icon: "copy-plus",
			callback: () => this.openTemplatePicker(),
		});

		this.addCommand({
			id: "new-task",
			name: "Create or edit task",
			icon: "square-pen",
			callback: () => this.openTaskModal(),
		});

		this.app.workspace.onLayoutReady(() => {
			void this.recurringTaskService.initialize();
			void this.checkAutomaticReviews();
		});
		this.registerInterval(window.setInterval(() => void this.checkAutomaticReviews(), 60 * 60 * 1000));
	}

	async saveSettings(): Promise<void> {
		await this.settingsManager.save(this.settings);
		this.settings = this.settingsManager.current;
		this.refreshOptionalUi();

		const workspaceViews = this.app.workspace
			.getLeavesOfType(TASKS_NL_WORKSPACE_VIEW)
			.map((leaf) => leaf.view)
			.filter((view): view is TasksNLWorkspaceView => view instanceof TasksNLWorkspaceView);
		await Promise.all(workspaceViews.map((view) => view.refresh()));

		this.app.workspace.trigger("layout-change");
	}

	refreshOptionalUi(): void {
		this.ribbonIcon?.remove();
		this.ribbonIcon = undefined;
		this.workspaceRibbonIcon?.remove();
		this.workspaceRibbonIcon = undefined;
		this.statusBarItem?.remove();
		this.statusBarItem = undefined;

		if (this.settings.showRibbonIcon) {
			this.ribbonIcon = this.addRibbonIcon(
				"check-square",
				"New Tasks NL task",
				() => this.openTaskModal()
			);
		}

		if (this.settings.showWorkspaceRibbonIcon) {
			this.workspaceRibbonIcon = this.addRibbonIcon(
				"layout-dashboard",
				"Open Tasks NL Workspace",
				() => void this.activateWorkspace()
			);
		}

		if (this.settings.showStatusBarItem) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.setText("Tasks NL");
			this.statusBarItem.addEventListener("click", () =>
				this.openTaskModal()
			);
		}
	}

	async activateWorkspace(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(TASKS_NL_WORKSPACE_VIEW)[0];
		const leaf = existing ?? this.app.workspace.getLeaf("tab");

		await leaf.setViewState({
			type: TASKS_NL_WORKSPACE_VIEW,
			active: true,
		});
		void this.app.workspace.revealLeaf(leaf);
	}

	openTemplatePicker(): void {
		new TemplatePickerModal(
			this.app,
			this.settings.taskTemplates,
			(template) => this.openTemplateTaskModal(template),
			() => this.openSettings()
		).open();
	}

	private openTemplateTaskModal(template: TaskTemplate): void {
		const service = new TaskCreationService(this.app, this.settings);
		const fileName = this.resolveTemplateFileName(template);
		new NewTaskModal(
			this.app,
			this.settings,
			(text, subtasks) => void service.createTaskNote(template, fileName, text, subtasks),
			this.prepareTemplateTaskText(template, fileName),
			false,
			[],
			template.subtasks.map((item) => this.resolveTemplateVariables(item, fileName))
		).open();
	}

	openSettings(): void {
		const appWithSettings = this.app as typeof this.app & { setting: { open(): void; openTabById(id: string): void } };
		appWithSettings.setting.open();
		appWithSettings.setting.openTabById(this.manifest.id);
	}

	private prepareTemplateTaskText(template: TaskTemplate, fileName: string): string {
		const date = this.toIsoDate(new Date());
		let value = this.resolveTemplateVariables(template.mainTask, fileName).trim();
		if (!/📅\s*\d{4}-\d{2}-\d{2}/u.test(value)) value = `${value} 📅 ${date}`;
		const typeTag = template.id === "month-review" ? "#month-review" : "#week-review";
		if (!/#tasks-nl-review(?:\s|$)/u.test(value)) value = `${value} #tasks-nl-review ${typeTag}`;
		return value;
	}

	private async checkAutomaticReviews(): Promise<void> {
		const today = new Date();
		for (const template of this.settings.taskTemplates) {
			if (!template.autoCreate || today.getDay() !== (template.autoCreateWeekday ?? 5)) continue;
			if (template.id === "month-review") {
				const nextWeek = new Date(today);
				nextWeek.setDate(today.getDate() + 7);
				if (nextWeek.getMonth() === today.getMonth()) continue;
			}
			const fileName = this.resolveTemplateFileName(template);
			const service = new TaskCreationService(this.app, this.settings);
			await service.createTaskNote(
				template,
				fileName,
				this.prepareTemplateTaskText(template, fileName),
				template.subtasks.map((item) => this.resolveTemplateVariables(item, fileName)),
				{ openFile: false, duplicateMode: "skip" }
			);
		}
	}

	private resolveTemplateVariables(value: string, fileName = ""): string {
		const now = new Date();
		const date = this.toIsoDate(now);
		const month = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
		const week = this.getIsoWeekNumber(now);
		return value
			.replace(/\{\{date\}\}/gu, date)
			.replace(/\{\{month\}\}/gu, month)
			.replace(/\{\{week\}\}/gu, String(week).padStart(2, "0"))
			.replace(/\{\{filename\}\}/gu, fileName);
	}

	private resolveTemplateFileName(template: TaskTemplate): string {
		const formatted = moment().format(template.fileNamePattern || "YYYY-MM-DD [Template]");
		return formatted.replace(/[/:*?"<>|\\]/gu, "-").trim() || "Template";
	}

	private getIsoWeekNumber(value: Date): number {
		const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
		const day = date.getUTCDay() || 7;
		date.setUTCDate(date.getUTCDate() + 4 - day);
		const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	}

	private toIsoDate(value: Date): string {
		return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
	}

	private openTaskModal(): void {
		const editor = this.app.workspace.activeEditor?.editor;
		const cursor = editor?.getCursor();
		const currentLine =
			editor && cursor ? editor.getLine(cursor.line) : "";
		const taskMatch = currentLine.match(/^\s*[-*+]\s+\[[ xX]\]\s*(.*)$/u);
		const editLine = taskMatch && cursor ? cursor.line : undefined;
		const initialText = taskMatch?.[1] ?? "";
		const openSubtasks =
			editor && editLine !== undefined
				? this.getOpenSubtasksForSequence(editor, editLine)
				: [];

		const taskCreationService = new TaskCreationService(
			this.app,
			this.settings
		);

		new NewTaskModal(
			this.app,
			this.settings,
			(text, subtasks, editedSubtasks) => {
				if (editLine !== undefined) {
					taskCreationService.updateTask(editLine, text, subtasks, editedSubtasks);
				} else {
					taskCreationService.createTask(text, subtasks);
				}
			},
			initialText,
			editLine !== undefined,
			openSubtasks
		).open();
	}

	async openTaskModalForTask(task: Task): Promise<void> {
		if (!task.bronBestand || task.regelNummer === undefined) return;
		const file = this.app.vault.getAbstractFileByPath(task.bronBestand);
		if (!(file instanceof TFile)) return;

		const content = await this.app.vault.cachedRead(file);
		const lines = content.split("\n");
		const currentLine = lines[task.regelNummer] ?? "";
		const taskMatch = currentLine.match(/^\s*[-*+]\s+\[[ xX]\]\s*(.*)$/u);
		if (!taskMatch) return;

		const openSubtasks = this.getOpenSubtasksForLines(lines, task.regelNummer);
		const service = new TaskCreationService(this.app, this.settings);
		new NewTaskModal(
			this.app,
			this.settings,
			(text, subtasks, editedSubtasks) => {
				void service.updateTaskInFile(file, task.regelNummer!, text, subtasks, editedSubtasks);
			},
			taskMatch[1] ?? "",
			true,
			openSubtasks
		).open();
	}

	private getOpenSubtasksForLines(lines: string[], lineNumber: number): EditableSubtask[] {
		const getIndent = (line: string): number =>
			(line.match(/^(\s*)/u)?.[1] ?? "").replace(/\t/gu, "    ").length;
		const isTask = (line: string): boolean => /^\s*[-*+]\s+\[[ xX]\]\s+/u.test(line);
		const selectedIndent = getIndent(lines[lineNumber] ?? "");
		let rootLine = lineNumber;
		for (let index = lineNumber - 1; index >= 0; index -= 1) {
			const line = lines[index] ?? "";
			if (isTask(line) && getIndent(line) < selectedIndent) { rootLine = index; break; }
		}
		const rootIndent = getIndent(lines[rootLine] ?? "");
		const subtasks: EditableSubtask[] = [];
		for (let index = rootLine + 1; index < lines.length; index += 1) {
			const line = lines[index] ?? "";
			const indent = getIndent(line);
			if (isTask(line) && indent <= rootIndent) break;
			const match = line.match(/^\s*[-*+]\s+\[([ xX])\]\s*(.*)$/u);
			if (match?.[1]?.toLowerCase() !== "x" && match?.[2]) subtasks.push({ lineNumber: index, text: match[2] });
		}
		return subtasks;
	}

	private getOpenSubtasksForSequence(
		editor: Editor,
		lineNumber: number
	): EditableSubtask[] {
		const getIndent = (line: string): number =>
			(line.match(/^(\s*)/u)?.[1] ?? "")
				.replace(/\t/gu, "    ").length;
		const isTask = (line: string): boolean =>
			/^\s*[-*+]\s+\[[ xX]\]\s+/u.test(line);

		const selectedIndent = getIndent(editor.getLine(lineNumber));
		let rootLine = lineNumber;

		for (let index = lineNumber - 1; index >= 0; index -= 1) {
			const line = editor.getLine(index);
			if (isTask(line) && getIndent(line) < selectedIndent) {
				rootLine = index;
				break;
			}
		}

		const rootIndent = getIndent(editor.getLine(rootLine));
		const subtasks: EditableSubtask[] = [];
		for (let index = rootLine + 1; index < editor.lineCount(); index += 1) {
			const line = editor.getLine(index);
			const indent = getIndent(line);
			if (isTask(line) && indent <= rootIndent) break;
			const match = line.match(/^\s*[-*+]\s+\[([ xX])\]\s*(.*)$/u);
			if (match?.[1]?.toLowerCase() !== "x" && match?.[2]) {
				subtasks.push({ lineNumber: index, text: match[2] });
			}
		}

		return subtasks;
	}
}
