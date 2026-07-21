/**
 * Natural-language task entry and Markdown task editing.
 */
import { App, Modal, Setting, setIcon, TextAreaComponent } from "obsidian";
import { DutchTaskParser } from "../nlp/DutchTaskParser";
import { TaskNormalizer } from "../normalizer/TaskNormalizer";
import { parseTaskLine } from "../parser/TaskLineParser";
import { RepeatRule } from "../planning/RepeatRule";
import { TasksNLSettings } from "../settings";

const WEEKDAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export interface EditableSubtask {
	lineNumber: number;
	text: string;
}

export class NewTaskModal extends Modal {
	private taskText: string;
	private previewEl!: HTMLElement;
	private subtasksText = "";
	private taskInputEl?: HTMLTextAreaElement;

	constructor(
		app: App,
		private readonly settings: TasksNLSettings,
		private readonly onSubmit: (text: string, subtasks: string[], editedSubtasks: EditableSubtask[]) => void,
		initialText = "",
		private readonly editMode = false,
		private readonly openSubtasks: EditableSubtask[] = [],
		initialSubtasks: string[] = []
	) {
		super(app);
		this.taskText = initialText;
		this.subtasksText = initialSubtasks.join("\n");
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;

		modalEl.addClass("tasks-nl-task-modal");
		contentEl.empty();

		const header = contentEl.createDiv({
			cls: "tasks-nl-brand-header",
		});

		header.createEl("h2", {
			text: "Tasks NL",
		});

		header.createDiv({
			cls: "tasks-nl-brand-subtitle",
			text: "Next Level Productivity for Obsidian",
		});

		contentEl.createEl("h3", {
			text: this.editMode ? "Edit task" : "New task",
		});

		const topActions = contentEl.createDiv({ cls: "tasks-nl-task-top-actions" });
		const dismissKeyboard = topActions.createEl("button", {
			cls: "tasks-nl-task-action-button tasks-nl-task-action-keyboard",
			attr: { type: "button", "aria-label": "Sluit het toetsenbord", title: "Toetsenbord sluiten" },
		});
		setIcon(dismissKeyboard, "keyboard-off");
		dismissKeyboard.createSpan({ text: "Sluit" });
		dismissKeyboard.addEventListener("click", () => {
			this.taskInputEl?.blur();
			const active = document.activeElement;
			if (active instanceof HTMLElement) active.blur();
		});

		const saveButton = topActions.createEl("button", {
			cls: "mod-cta tasks-nl-task-action-button tasks-nl-task-action-save",
			attr: {
				type: "button",
				"aria-label": this.editMode ? "Taak opslaan" : "Taak toevoegen",
				title: this.editMode ? "Taak opslaan" : "Taak toevoegen",
			},
		});
		setIcon(saveButton, "save");
		saveButton.createSpan({ text: this.editMode ? "Opslaan" : "Toevoegen" });
		saveButton.addEventListener("click", () => this.submit());

		const taskSetting = new Setting(contentEl)
			.setName(
				this.editMode
					? "Task line"
					: "What do you want to do?"
			)
			.setDesc(
				this.editMode
					? "Edit the task. The checkbox itself is preserved."
					: "Type natural Dutch. Recognised metadata is added."
			);

		taskSetting.addTextArea((text: TextAreaComponent) => {
			text
				.setPlaceholder(
					this.editMode
						? "Task text or natural Dutch"
						: "Example: Peter morgen wachten op CRM hoog"
				)
				.setValue(this.taskText)
				.onChange((value) => {
					this.taskText = value;
					this.updatePreview();
				});

			text.inputEl.rows = 2;
			text.inputEl.addClass("tasks-nl-task-textarea");
			this.taskInputEl = text.inputEl;
			window.setTimeout(() => text.inputEl.focus(), 0);
		});

		this.previewEl = contentEl.createDiv({
			cls: "tasks-nl-preview tasks-nl-preview-top",
		});
		this.updatePreview();

		const dateSetting = new Setting(contentEl)
			.setName("Due date")
			.setDesc("Choose a date or move the current date forward.");
		dateSetting.settingEl.addClass("tasks-nl-date-setting");
		const dateActions = dateSetting.controlEl;
		dateActions.addClass("tasks-nl-date-actions");
		const dateInput = dateActions.createEl("input", {
			attr: { type: "date", "aria-label": "Choose due date" },
		});
		dateInput.value = this.getCurrentDate() ?? "";
		dateInput.addEventListener("change", () => {
			if (dateInput.value) this.setDueDate(dateInput.value);
		});

		const calendarButton = dateActions.createEl("button", {
			cls: "clickable-icon",
			attr: { type: "button", "aria-label": "Choose due date" },
		});
		setIcon(calendarButton, "calendar-days");
		calendarButton.addEventListener("click", () => {
			dateInput.showPicker?.();
			dateInput.focus();
		});

		if (this.editMode) {
			this.addShiftDateButton(dateActions, dateInput, 1, "+1 day");
			this.addShiftDateButton(dateActions, dateInput, 7, "+7 days");
		}

		if (this.editMode && this.openSubtasks.length > 0) {
			const existingSetting = new Setting(contentEl)
				.setName("Existing subtasks")
				.setDesc("Edit the open subtasks in this sequence.");
			existingSetting.settingEl.addClass("tasks-nl-existing-subtasks-setting");
			const list = existingSetting.controlEl.createDiv({
				cls: "tasks-nl-editable-subtasks",
			});
			for (const subtask of this.openSubtasks) {
				const input = list.createEl("textarea", {
					cls: "tasks-nl-existing-subtask-input",
					attr: { rows: "1", "aria-label": "Edit subtask" },
				});
				input.value = subtask.text;
				input.addEventListener("input", () => { subtask.text = input.value; });
			}
		}

		new Setting(contentEl)
			.setName(this.editMode ? "Add subtasks" : "Subtasks")
			.setDesc("One subtask per line. They become visible one after another.")
			.addTextArea((text) => {
				text.setPlaceholder("First step\nSecond step\nThird step").setValue(this.subtasksText);
				text.inputEl.rows = 4;
				text.inputEl.addClass("tasks-nl-subtasks-textarea");
				text.onChange((value) => { this.subtasksText = value; });
			});

		const bottomActions = contentEl.createDiv({ cls: "tasks-nl-task-bottom-actions" });
		const cancelButton = bottomActions.createEl("button", {
			text: "Cancel",
			attr: { type: "button" },
		});
		cancelButton.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private addShiftDateButton(
		parent: HTMLElement,
		dateInput: HTMLInputElement,
		days: number,
		label: string
	): void {
		const button = parent.createEl("button", {
			cls: "tasks-nl-plus-day-button",
			attr: { type: "button", "aria-label": `Move due date ${days} days` },
		});
		setIcon(button, "calendar-plus");
		button.createSpan({ text: label });
		button.addEventListener("click", () => {
			dateInput.value = this.shiftDueDate(days);
		});
	}

	private submit(): void {
		const value = this.taskText.trim();

		if (!value) {
			return;
		}

		this.close();
		this.onSubmit(
			value,
			this.subtasksText.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean),
			this.openSubtasks.map((item) => ({ ...item, text: item.text.trim() })).filter((item) => item.text)
		);
	}

	private updatePreview(): void {
		if (!this.previewEl) {
			return;
		}

		this.previewEl.empty();

		if (!this.settings.showPreview) {
			this.previewEl.setText("Live preview is disabled.");
			return;
		}

		if (!this.taskText.trim()) {
			this.previewEl.setText("No task entered yet.");
			return;
		}

		this.previewEl.createEl("strong", {
			text: "Preview",
		});

		if (this.editMode) {
			this.renderCombinedEditPreview();
			return;
		}

		this.renderNaturalLanguagePreview();
	}

	private renderCombinedEditPreview(): void {
		/*
		 * Lees eerst alle al bestaande Tasks-metadata.
		 */
		const existing = parseTaskLine(
			`- [ ] ${this.taskText.trim()}`
		);

		/*
		 * Verwijder technische Markdown-metadata uit de invoer,
		 * maar laat natuurlijke woorden zoals morgen, PH, hoog
		 * en projectnamen staan.
		 */
		const naturalInput = this.removeExistingMarkdownMetadata(
			this.taskText
		);

		const parser = new DutchTaskParser(this.settings);

		const normalizer = new TaskNormalizer(
			this.settings.defaultTaskTitle,
			this.settings.keepOriginalTaskText
		);

		const natural = normalizer.normalize(
			parser.parse(naturalInput)
		);

		/*
		 * Nieuwe herkende metadata heeft voorrang.
		 * Wanneer niets nieuws is herkend, behouden we de
		 * metadata uit de bestaande Markdown-taak.
		 */
		const date =
			natural.datum ??
			existing?.vervalDatum ??
			undefined;

		const recurrence = natural.repeat
			? this.formatRepeat(natural.repeat)
			: existing?.herhaling
				? this.formatExistingRepeat(existing.herhaling)
				: "-";

		const priority =
			natural.prioriteit !== "normal"
				? natural.prioriteit
				: existing?.prioriteit ?? "normal";

		const hashtags = Array.from(
			new Set([
				...(existing?.hashtags ?? []),
				...natural.hashtags,
			])
		);

		this.previewEl.createDiv({
			cls: "tasks-nl-preview-title",
			text:
				natural.titel ||
				existing?.titel ||
				"Task",
		});

		const metadata = this.previewEl.createDiv({
			cls: "tasks-nl-preview-metadata",
		});

		this.addMetadata(
			metadata,
			"📅 Date",
			natural.datumTekst && natural.datum
				? `${natural.datumTekst} (${natural.datum})`
				: date ?? "-"
		);

		this.addMetadata(
			metadata,
			"🔁 Recurrence",
			recurrence
		);

		this.addMetadata(
			metadata,
			"Priority",
			this.formatPriority(priority)
		);

		this.addMetadata(
			metadata,
			"🏷 Hashtags",
			hashtags.join(" ") || "-"
		);
	}

	private removeExistingMarkdownMetadata(
		value: string
	): string {
		return value
			/*
			 * Bestaande datumcode verwijderen.
			 * Een natuurlijk woord zoals "morgen" blijft staan.
			 */
			.replace(
				/📅\s*\d{4}-\d{2}-\d{2}/gu,
				" "
			)

			/*
			 * Bestaande Tasks-herhaling verwijderen.
			 */
			.replace(
				/🔁\s*[^🏁📅🔺⏫🔼🔽⏬#]+/gu,
				" "
			)

			/*
			 * On-completion-instructie verwijderen.
			 */
			.replace(
				/🏁\s*\S+/gu,
				" "
			)

			/*
			 * Bestaande prioriteitsemoji verwijderen.
			 */
			.replace(
				/[🔺⏫🔼🔽⏬]/gu,
				" "
			)

			/*
			 * Bestaande hashtags worden apart door
			 * parseTaskLine gelezen en later samengevoegd.
			 */
			.replace(
				/(^|\s)#[\p{L}\p{N}_/-]+/gu,
				" "
			)

			.replace(/\s+/gu, " ")
			.trim();
	}
	private containsExplicitMarkdownMetadata(
		value: string
	): boolean {
		return (
			/[📅🔁🏁⏫🔺🔼🔽⏬]/u.test(value) ||
			/(?:^|\s)#[\p{L}\p{N}_/-]+/u.test(value)
		);
	}

	private renderNaturalLanguagePreview(): void {
		const parser = new DutchTaskParser(
			this.settings
		);

		const normalizer = new TaskNormalizer(
			this.settings.defaultTaskTitle,
			this.settings.keepOriginalTaskText
		);

		const normalized = normalizer.normalize(
			parser.parse(this.taskText)
		);

		this.previewEl.createDiv({
			cls: "tasks-nl-preview-title",
			text: normalized.titel,
		});

		const metadata = this.previewEl.createDiv({
			cls: "tasks-nl-preview-metadata",
		});

		this.addMetadata(
			metadata,
			"📅 Date",
			normalized.datumTekst && normalized.datum
				? `${normalized.datumTekst} (${normalized.datum})`
				: normalized.datum ?? "-"
		);

		this.addMetadata(
			metadata,
			"🔁 Recurrence",
			normalized.repeat
				? this.formatRepeat(normalized.repeat)
				: "-"
		);

		this.addMetadata(
			metadata,
			"Priority",
			this.formatPriority(
				normalized.prioriteit
			)
		);

		this.addMetadata(
			metadata,
			"🏷 Hashtags",
			normalized.hashtags.join(" ") || "-"
		);
	}

	private addMetadata(
		parent: HTMLElement,
		label: string,
		value: string
	): void {
		const row = parent.createDiv({
			cls: "tasks-nl-preview-meta-row",
		});

		row.createSpan({
			cls: "tasks-nl-preview-meta-label",
			text: `${label}:`,
		});

		row.createSpan({
			text: value,
		});
	}

	private formatPriority(
		priority:
			| "highest"
			| "high"
			| "medium"
			| "normal"
			| "low"
			| "lowest"
	): string {
		return {
			highest: "Highest",
			high: "High",
			medium: "Medium",
			normal: "Normal",
			low: "Low",
			lowest: "Lowest",
		}[priority];
	}

	private formatExistingRepeat(
		value: string
	): string {
		return value
			.replace(/^every\s+/u, "Every ")
			.replace(/\bon\b/gu, "on");
	}

	private formatRepeat(rule: RepeatRule): string {
		if (
			rule.position &&
			rule.weekday !== undefined
		) {
			const position =
				rule.position === "first"
					? "first"
					: "last";

			return `every ${position} ${WEEKDAYS[rule.weekday]
				}`;
		}

		if (rule.weekday !== undefined) {
			return `every ${WEEKDAYS[rule.weekday]}`;
		}

		const singular = {
			day: "day",
			week: "week",
			month: "month",
			year: "year",
		}[rule.unit];

		const unit =
			rule.every === 1
				? singular
				: `${singular}s`;

		return rule.every === 1
			? `every ${unit}`
			: `every ${rule.every} ${unit}`;
	}
	private getCurrentDate(): string | undefined {
		return this.taskText.match(/📅\s*(\d{4}-\d{2}-\d{2})/u)?.[1];
	}

	private setDueDate(value: string): void {
		const withoutDate = this.taskText.replace(/\s*📅\s*\d{4}-\d{2}-\d{2}/gu, "").trim();
		this.taskText = `${withoutDate} 📅 ${value}`.trim();
		this.updatePreview();
		const textarea = this.contentEl.querySelector<HTMLTextAreaElement>(".tasks-nl-task-textarea");
		if (textarea) textarea.value = this.taskText;
	}

	private shiftDueDate(days: number): string {
		const current = this.getCurrentDate();
		const date = current ? new Date(`${current}T12:00:00`) : new Date();
		date.setDate(date.getDate() + days);
		const value = [
			date.getFullYear(),
			String(date.getMonth() + 1).padStart(2, "0"),
			String(date.getDate()).padStart(2, "0"),
		].join("-");
		this.setDueDate(value);
		return value;
	}

}