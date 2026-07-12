import { Task } from "../../models/Task";
import { WorkspaceWidgetContext } from "../WorkspaceWidget";

const PRIORITY_EMOJI: Record<Task["prioriteit"], string> = {
	highest: "🔺",
	high: "⏫",
	medium: "🔼",
	normal: "",
	low: "🔽",
	lowest: "⏬",
};

export function renderTaskList(
	container: HTMLElement,
	tasks: Task[],
	context: WorkspaceWidgetContext,
	emptyText = "No open tasks."
): void {
	if (tasks.length === 0) {
		container.createDiv({ cls: "tasks-nl-widget-empty", text: emptyText });
		return;
	}

	const list = container.createDiv({ cls: "tasks-nl-widget-list" });

	for (const task of tasks.slice(0, 12)) {
		const row = list.createEl("button", {
			cls: "tasks-nl-widget-task",
			attr: { type: "button" },
		});
		const title = row.createDiv({ cls: "tasks-nl-widget-task-title" });
		const priority = PRIORITY_EMOJI[task.prioriteit];
		if (priority) title.createSpan({ text: `${priority} ` });
		title.createSpan({ text: task.titel || "Task" });

		const meta = row.createDiv({ cls: "tasks-nl-widget-task-meta" });
		if (task.vervalDatum) meta.createSpan({ text: `📅 ${task.vervalDatum}` });
		if (task.herhaling) meta.createSpan({ text: "🔁" });
		for (const hashtag of task.hashtags.slice(0, 3)) {
			meta.createSpan({ cls: "tasks-nl-workspace-tag", text: hashtag });
		}

		row.addEventListener("click", () => {
			void context.openTask(task);
		});
	}

	if (tasks.length > 12) {
		container.createDiv({
			cls: "tasks-nl-widget-more",
			text: `+ ${tasks.length - 12} more`,
		});
	}
}

export function renderGroups(
	container: HTMLElement,
	groups: Array<{ label: string; hashtag: string; tasks: Task[] }>,
	context: WorkspaceWidgetContext
): void {
	const visible = groups.filter((group) => group.tasks.length > 0);
	if (visible.length === 0) {
		container.createDiv({ cls: "tasks-nl-widget-empty", text: "No open tasks." });
		return;
	}

	for (const group of visible) {
		const details = container.createEl("details", {
			cls: "tasks-nl-widget-group",
		});
		const summary = details.createEl("summary");
		summary.createSpan({ text: group.label });
		summary.createSpan({
			cls: "tasks-nl-widget-count",
			text: String(group.tasks.length),
		});
		const body = details.createDiv({ cls: "tasks-nl-widget-group-body" });
		renderTaskList(body, group.tasks, context);
	}
}
