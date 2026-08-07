/**
 * Coordinates task creation and editing in the active Markdown editor.
 */
import { App, Editor, Modal, Notice, normalizePath, Setting, TFile, TFolder, moment } from "obsidian";
import { DutchTaskParser } from "../nlp/DutchTaskParser";
import { TaskNormalizer } from "../normalizer/TaskNormalizer";
import { TaskLineFormatter } from "../parser/TaskLineFormatter";
import { parseTaskLine } from "../parser/TaskLineParser";
import { TaskTemplate, TasksNLSettings } from "../settings";
import type { EditableSubtask } from "../ui/NewTaskModal";
import { refreshOpenMarkdownViews } from "./OpenFileSyncService";
import { synchronizeDailyJournalBlocks } from "../journal/DailyJournalTemplate";

export class TaskCreationService {
	constructor(
		private app: App,
		private settings: TasksNLSettings
	) { }

	async createTaskNote(
		template: TaskTemplate,
		fileName: string,
		text: string,
		subtasks: string[] = [],
		options: { openFile?: boolean; duplicateMode?: "ask" | "skip" } = {}
	): Promise<TFile | null> {
		try {
			if (!text.trim() && template.id !== "day-journal") {
				new Notice("Enter a task first.");
				return null;
			}
			const folder = normalizePath(template.folderPath || "");
			await this.ensureFolder(folder);
			const safeFileName = this.sanitizeFileName(fileName);
			const basePath = normalizePath(`${folder ? `${folder}/` : ""}${safeFileName}.md`);
			let path = basePath;
			const existing = this.findExistingFile(path);
			if (existing) {
				if (options.duplicateMode === "skip") return existing;
				const choice = await this.askDuplicate(existing.path, folder, safeFileName);
				if (choice.action === "cancel") return null;
				path = choice.action === "copy"
					? this.nextCopyPath(folder, safeFileName)
					: choice.path;
			}
			const mainTask = text.trim() ? this.formatNaturalLanguage(text) : "";
			const childTasks = subtasks.map((item) => `  ${this.formatNaturalLanguage(item)}`);
			const tasks = [mainTask, ...childTasks].filter(Boolean).join("\n");
			const actualFileName = path.split("/").pop()?.replace(/\.md$/u, "") ?? safeFileName;
			const note = this.renderReviewTemplate(template, actualFileName, tasks);
			const file = await this.app.vault.create(path, note.endsWith("\n") ? note : `${note}\n`);
			if (options.openFile !== false) await this.app.workspace.getLeaf("tab").openFile(file);
			new Notice(`Review note created: ${path}`);
			return file;
		} catch (error) {
			console.error("Tasks NL could not create review note", error);
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Review note could not be created: ${message}`, 10000);
			return null;
		}
	}

	private sanitizeFileName(value: string): string {
		const sanitized = value.replace(/[\\/:*?"<>|]/gu, "-").trim();
		return sanitized || `Review ${moment().format("YYYY-MM-DD")}`;
	}

	private renderReviewTemplate(template: TaskTemplate, fileName: string, tasks: string): string {
		let source = template.noteTemplate || "##### Tasks\n\n{{TASKS}}\n";
		if (template.id === "day-journal") {
			source = synchronizeDailyJournalBlocks(
				source,
				template.includeTopThree ?? false,
				template.includeNextProjectSteps ?? false,
			);
		}
		if (template.id !== "day-journal" && !/\{(?:\{tasks\}|tasks)\}/iu.test(source)) {
			const lines = source.split("\n");
			const firstHeading = lines.findIndex((line) => /^#{1,6}\s+/u.test(line));
			lines.splice(firstHeading >= 0 ? firstHeading + 1 : 0, 0, "", "{{TASKS}}", "");
			source = lines.join("\n");
		}
		const properties = this.cleanProperties(template.properties ?? "");
		const rendered = this.replaceTemplateVariables(source, fileName, {
			tasks,
			review_type: template.name,
		});
		if (!properties) return rendered;

		const resolvedProperties = this.replaceTemplateVariables(properties, fileName);
		const existingFrontmatter = rendered.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/u);
		if (!existingFrontmatter) return `---\n${resolvedProperties}\n---\n${rendered}`;

		const body = rendered.slice(existingFrontmatter[0].length);
		const currentProperties = existingFrontmatter[1]?.trim() ?? "";
		const mergedProperties = [currentProperties, resolvedProperties].filter(Boolean).join("\n");
		return `---\n${mergedProperties}\n---\n${body}`;
	}

	private cleanProperties(value: string): string {
		const trimmed = value.trim();
		const fenced = trimmed.match(/^---\s*\r?\n([\s\S]*?)\r?\n---$/u);
		return (fenced?.[1] ?? trimmed).trim();
	}

	private replaceTemplateVariables(
		value: string,
		fileName: string,
		extra: Record<string, string> = {}
	): string {
		const now = moment();
		const variables: Record<string, string> = {
			filename: fileName,
			date: now.format("YYYY-MM-DD"),
			day: now.format("dddd"),
			week: now.format("WW"),
			month: now.format("MMMM"),
			month_number: now.format("MM"),
			year: now.format("YYYY"),
			...extra,
		};

		return value.replace(/\{\{?(tasks|filename|date|day|week|month|month_number|year|review_type)\}?\}/giu, (match, key: string) =>
			variables[key.toLocaleLowerCase()] ?? match
		);
	}

	private nextCopyPath(folder: string, fileName: string): string {
		let counter = 1;
		while (true) {
			const suffix = counter === 1 ? " copy" : ` copy ${counter}`;
			const path = normalizePath(`${folder ? `${folder}/` : ""}${fileName}${suffix}.md`);
			if (!this.findExistingFile(path)) return path;
			counter += 1;
		}
	}

	/**
	 * Obsidian normally resolves an exact path. On case-insensitive file systems,
	 * Unicode normalisation and letter case can still make an existing note look
	 * absent. Compare all Markdown paths canonically before creating a file.
	 */
	private findExistingFile(path: string): TFile | null {
		const normalizedPath = normalizePath(path);
		const direct = this.app.vault.getAbstractFileByPath(normalizedPath);
		if (direct instanceof TFile) return direct;

		const canonical = (value: string): string =>
			normalizePath(value).normalize("NFC").toLocaleLowerCase();
		const wanted = canonical(normalizedPath);
		return this.app.vault.getFiles().find((file) => canonical(file.path) === wanted) ?? null;
	}

	private askDuplicate(
		existingPath: string,
		folder: string,
		fileName: string
	): Promise<{ action: "copy" | "custom" | "cancel"; path: string }> {
		return new Promise((resolve) => {
			const modal = new Modal(this.app);
			let resolved = false;
			let customName = fileName;

			const finish = (result: { action: "copy" | "custom" | "cancel"; path: string }): void => {
				if (resolved) return;
				resolved = true;
				resolve(result);
				modal.close();
			};

			modal.titleEl.setText("Review already exists");
			modal.contentEl.createEl("p", {
				text: `${existingPath} already exists. Stop, create an automatic copy, or choose another name.`
			});

			new Setting(modal.contentEl)
				.setName("New filename")
				.setDesc("Enter a filename without .md.")
				.addText((text) => {
					text.setValue(fileName).onChange((value) => { customName = value; });
					text.inputEl.select();
				});

			new Setting(modal.contentEl)
				.addButton((button) => button
					.setButtonText("Stop")
					.onClick(() => finish({ action: "cancel", path: "" })))
				.addButton((button) => button
					.setButtonText("Create copy")
					.setCta()
					.onClick(() => finish({ action: "copy", path: "" })))
				.addButton((button) => button
					.setButtonText("Use own name")
					.onClick(() => {
						const safeCustomName = this.sanitizeFileName(customName.replace(/\.md$/iu, ""));
						const customPath = normalizePath(`${folder ? `${folder}/` : ""}${safeCustomName}.md`);
						if (this.findExistingFile(customPath)) {
							new Notice(`A file named '${safeCustomName}.md' already exists.`);
							return;
						}
						finish({ action: "custom", path: customPath });
					}));

			modal.onClose = () => {
				if (!resolved) {
					resolved = true;
					resolve({ action: "cancel", path: "" });
				}
			};
			modal.open();
		});
	}

	private async ensureFolder(path: string): Promise<void> {
		const normalized = normalizePath(path).replace(/^\/+|\/+$/gu, "");
		if (!normalized || normalized === ".") return;

		const parts = normalized.split("/").filter(Boolean);
		let current = "";
		for (const part of parts) {
			current = normalizePath(current ? `${current}/${part}` : part);
			const existing = this.app.vault.getAbstractFileByPath(current);
			if (existing instanceof TFolder) continue;
			if (existing instanceof TFile) {
				throw new Error(`Cannot create folder '${current}': a file already uses that path.`);
			}

			try {
				await this.app.vault.createFolder(current);
			} catch (error) {
				// Obsidian can report an existing folder before its vault index is refreshed.
				const afterCreate = this.app.vault.getAbstractFileByPath(current);
				const message = error instanceof Error ? error.message : String(error);
				if (afterCreate instanceof TFolder || /already exists/iu.test(message)) continue;
				throw error;
			}
		}
	}

	createTask(text: string, subtasks: string[] = []): void {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice("Open a Markdown note first.");
			return;
		}
		if (!text.trim()) {
			new Notice("Enter a task first.");
			return;
		}

		const markdown = this.formatNaturalLanguage(text);
		this.insertTask(editor, markdown, subtasks);
		new Notice("Task added.");
	}

	updateTask(lineNumber: number, text: string, subtasks: string[] = [], editedSubtasks: EditableSubtask[] = []): void {
		const editor = this.app.workspace.activeEditor?.editor;

		if (!editor) {
			new Notice("Open a Markdown note first.");
			return;
		}

		if (!text.trim()) {
			new Notice("A task cannot be empty.");
			return;
		}

		const currentLine = editor.getLine(lineNumber);
		const internalMarkers = currentLine.match(/\s*<!--\s*tasks-nl-(?:focus:[123]|project-next)\s*-->/gu)?.join("") ?? "";

		const prefix =
			currentLine.match(
				/^(\s*[-*+]\s+\[[ xX]\]\s*)/u
			)?.[1] ?? "- [ ] ";

		/*
		 * Gebruik dezelfde parser als createTask()
		 */

		const markdown = this
			.formatEditedTask(text)
			.replace(
				/^\s*[-*+]\s+\[[ xX]\]\s*/u,
				""
			);

		editor.replaceRange(
			`${prefix}${markdown}${internalMarkers}`,
			{
				line: lineNumber,
				ch: 0,
			},
			{
				line: lineNumber,
				ch: currentLine.length,
			}
		);

		this.updateExistingSubtasks(editor, editedSubtasks);

		if (subtasks.length > 0) {
			this.appendSubtasksToSequence(editor, lineNumber, subtasks);
		}

		new Notice("Task updated.");
	}
	async updateTaskInFile(file: TFile, lineNumber: number, text: string, subtasks: string[] = [], editedSubtasks: EditableSubtask[] = []): Promise<void> {
		if (!text.trim()) { new Notice("A task cannot be empty."); return; }
		await this.app.vault.process(file, (content) => {
			const lines = content.split("\n");
			const currentLine = lines[lineNumber];
			if (currentLine === undefined) return content;
			const prefix = currentLine.match(/^(\s*[-*+]\s+\[[ xX]\]\s*)/u)?.[1] ?? "- [ ] ";
			const markdown = this.formatEditedTask(text).replace(/^\s*[-*+]\s+\[[ xX]\]\s*/u, "");
			const internalMarkers = currentLine.match(/\s*<!--\s*tasks-nl-(?:focus:[123]|project-next)\s*-->/gu)?.join("") ?? "";
			lines[lineNumber] = `${prefix}${markdown}${internalMarkers}`;
			for (const subtask of editedSubtasks) {
				const line = lines[subtask.lineNumber];
				const subPrefix = line?.match(/^(\s*[-*+]\s+\[[ xX]\]\s*)/u)?.[1];
				if (!line || !subPrefix) continue;
				const subMarkdown = this.formatEditedTask(subtask.text).replace(/^\s*[-*+]\s+\[[ xX]\]\s*/u, "");
				lines[subtask.lineNumber] = `${subPrefix}${subMarkdown}`;
			}
			if (subtasks.length > 0) this.appendSubtasksToLines(lines, lineNumber, subtasks);
			return lines.join("\n");
		});
		await refreshOpenMarkdownViews(this.app, file);
		new Notice("Task updated.");
	}

	private appendSubtasksToLines(lines: string[], lineNumber: number, subtasks: string[]): void {
		const getIndent = (line: string): number => (line.match(/^(\s*)/u)?.[1] ?? "").replace(/\t/gu, "    ").length;
		const isTask = (line: string): boolean => /^\s*[-*+]\s+\[[ xX]\]\s+/u.test(line);
		const selectedIndent = getIndent(lines[lineNumber] ?? "");
		let rootLine = lineNumber;
		for (let index = lineNumber - 1; index >= 0; index -= 1) {
			if (isTask(lines[index] ?? "") && getIndent(lines[index] ?? "") < selectedIndent) { rootLine = index; break; }
		}
		const rootText = lines[rootLine] ?? "";
		const rootIndentText = rootText.match(/^(\s*)/u)?.[1] ?? "";
		const rootIndent = getIndent(rootText);
		let insertLine = rootLine + 1;
		while (insertLine < lines.length) {
			const line = lines[insertLine] ?? "";
			if (!line.trim()) break;
			if (!isTask(line) || getIndent(line) <= rootIndent) break;
			insertLine += 1;
		}
		const childIndent = `${rootIndentText}  `;
		const additions = subtasks.map((item) => `${childIndent}${this.formatNaturalLanguage(item).replace(/^\s*/u, "")}`);
		lines.splice(insertLine, 0, ...additions);
	}

	private updateExistingSubtasks(editor: Editor, subtasks: EditableSubtask[]): void {
		for (const subtask of subtasks) {
			const currentLine = editor.getLine(subtask.lineNumber);
			const prefix = currentLine.match(/^(\s*[-*+]\s+\[[ xX]\]\s*)/u)?.[1];
			if (!prefix) continue;
			const markdown = this.formatEditedTask(subtask.text)
				.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/u, "");
			editor.replaceRange(
				`${prefix}${markdown}`,
				{ line: subtask.lineNumber, ch: 0 },
				{ line: subtask.lineNumber, ch: currentLine.length }
			);
		}
	}

	private appendSubtasksToSequence(
		editor: Editor,
		lineNumber: number,
		subtasks: string[]
	): void {
		const getIndent = (line: string): number =>
			(line.match(/^(\s*)/u)?.[1] ?? "").replace(/\t/gu, "    ").length;
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

		const rootLineText = editor.getLine(rootLine);
		const rootIndentText = rootLineText.match(/^(\s*)/u)?.[1] ?? "";
		const rootIndent = getIndent(rootLineText);
		let insertLine = rootLine + 1;
		while (insertLine < editor.lineCount()) {
			const line = editor.getLine(insertLine);
			if (!line.trim()) break;
			if (!isTask(line) || getIndent(line) <= rootIndent) break;
			insertLine += 1;
		}

		const childIndent = `${rootIndentText}  `;
		const childLines = subtasks.map((item) =>
			`${childIndent}${this.formatNaturalLanguage(item).replace(/^\s*/u, "")}`
		);
		if (insertLine < editor.lineCount()) {
			editor.replaceRange(
				`${childLines.join("\n")}\n`,
				{ line: insertLine, ch: 0 }
			);
		} else {
			const lastLine = Math.max(0, editor.lineCount() - 1);
			editor.replaceRange(
				`\n${childLines.join("\n")}`,
				{ line: lastLine, ch: editor.getLine(lastLine).length }
			);
		}
	}

	private formatEditedTask(text: string): string {
		const explicit = parseTaskLine(`- [ ] ${text.trim()}`);
		if (!explicit) return this.formatNaturalLanguage(text);

		const parser = new DutchTaskParser(this.settings);
		const normalizer = new TaskNormalizer(
			this.settings.defaultTaskTitle,
			this.settings.keepOriginalTaskText
		);
		const natural = normalizer.normalize(parser.parse(explicit.titel));
		const priority = natural.prioriteit !== "normal" ? natural.prioriteit : explicit.prioriteit;
		const priorityEmoji = {
			highest: "🔺", high: "⏫", medium: "🔼", normal: "", low: "🔽", lowest: "⏬",
		}[priority];
		const repeat = natural.repeat?.tasksText ?? explicit.herhaling;
		const date = natural.datum ?? explicit.vervalDatum;
		const startDate = natural.startDatum ?? explicit.startDatum;
		const hashtags = Array.from(new Set([...explicit.hashtags, ...natural.hashtags]));

		return [
			"- [ ]",
			natural.titel,
			priorityEmoji,
			repeat ? `🔁 ${repeat}` : "",
			repeat && !this.settings.keepCompletedRecurringTask ? "🏁 delete" : "",
			startDate ? `⏳ ${startDate}` : "",
			date ? `📅 ${date}` : "",
			...hashtags,
		].filter(Boolean).join(" ");
	}

	private formatNaturalLanguage(text: string): string {
		if (/[📅🔁🏁🔺⏫🔼🔽⏬]/u.test(text) || /(?:^|\s)#[\p{L}\p{N}_/-]+/u.test(text)) {
			const parsed = parseTaskLine(`- [ ] ${text.trim()}`);
			if (parsed) {
				const priority = {
					highest: "🔺", high: "⏫", medium: "🔼", normal: "", low: "🔽", lowest: "⏬",
				}[parsed.prioriteit];
				return [
					"- [ ]", parsed.titel, priority,
					parsed.herhaling ? `🔁 ${parsed.herhaling}` : "",
					parsed.herhaling && !this.settings.keepCompletedRecurringTask ? "🏁 delete" : "",
					parsed.startDatum ? `⏳ ${parsed.startDatum}` : "",
					parsed.vervalDatum ? `📅 ${parsed.vervalDatum}` : "",
					...parsed.hashtags,
				].filter(Boolean).join(" ");
			}
		}

		const parser = new DutchTaskParser(this.settings);
		const normalizer = new TaskNormalizer(
			this.settings.defaultTaskTitle,
			this.settings.keepOriginalTaskText
		);
		const formatter = new TaskLineFormatter(
			this.settings.keepCompletedRecurringTask
		);
		return formatter.format(normalizer.normalize(parser.parse(text)));
	}

	private insertTask(editor: Editor, markdown: string, subtasks: string[]): void {
		const cursor = editor.getCursor();
		const currentLine = editor.getLine(cursor.line);
		const emptyTaskMatch = currentLine.match(/^(\s*)-\s+\[[ xX]\]\s*$/u);

		const childMarkdown = subtasks
			.map((item) => `  ${this.formatNaturalLanguage(item)}`)
			.join("\n");
		const completeMarkdown = childMarkdown
			? `${markdown}\n${childMarkdown}`
			: markdown;

		if (emptyTaskMatch) {
			const indentation = emptyTaskMatch[1] ?? "";
			const taskWithoutIndent = completeMarkdown.replace(/^\s*/u, "");
			editor.replaceRange(
				`${indentation}${taskWithoutIndent}`,
				{ line: cursor.line, ch: 0 },
				{ line: cursor.line, ch: currentLine.length }
			);
			return;
		}
		editor.replaceSelection(`${completeMarkdown}\n`);
	}
}
