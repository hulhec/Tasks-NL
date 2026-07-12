/* eslint-disable obsidianmd/ui/sentence-case */
import { App, Modal, Setting, setIcon } from "obsidian";
import type { TaskTemplate } from "../settings";

export class TemplatePickerModal extends Modal {
	constructor(
		app: App,
		private readonly templates: TaskTemplate[],
		private readonly onSelect: (template: TaskTemplate) => void,
		private readonly onManage: () => void
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("tasks-nl-template-picker-modal");
		this.contentEl.empty();
		this.contentEl.createEl("h2", { text: "Create review" });
		this.contentEl.createEl("p", {
			text: "Choose a weekly or monthly review. You can still change the task, date and subtasks before saving.",
			cls: "tasks-nl-template-picker-description",
		});

		const list = this.contentEl.createDiv({ cls: "tasks-nl-template-picker-list" });
		if (this.templates.length === 0) {
			list.createEl("p", { text: "No reviews available." });
		}
		for (const template of this.templates) {
			const button = list.createEl("button", {
				cls: "tasks-nl-template-card",
				attr: { type: "button", "aria-label": `Use ${template.name}` },
			});
			const icon = button.createSpan({ cls: "tasks-nl-template-card-icon" });
			setIcon(icon, template.icon || "list-checks");
			const text = button.createDiv({ cls: "tasks-nl-template-card-text" });
			text.createEl("strong", { text: template.name });
			text.createEl("span", { text: `${template.folderPath || "/"} / ${template.fileNamePattern}` });
			text.createEl("small", { text: `${template.subtasks.length} subtasks` });
			button.addEventListener("click", () => {
				this.close();
				this.onSelect(template);
			});
		}

		new Setting(this.contentEl)
			.addButton((button) => button.setButtonText("Review settings").onClick(() => {
				this.close();
				this.onManage();
			}))
			.addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
