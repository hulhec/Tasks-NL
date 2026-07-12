/**
 * TaskLineFormatter
 *
 * Purpose:
 * Convert a normalized task into one Tasks-compatible Markdown line.
 */
import {
	InterpretationPriority,
	TaskInterpretation,
} from "../nlp/models/TaskInterpretation";

export class TaskLineFormatter {
	constructor(private readonly keepCompletedRecurringTask = false) {}

	format(task: TaskInterpretation): string {
		const parts = [
			"- [ ]",
			task.titel,
			this.priorityEmoji(task.prioriteit),
			task.repeat ? `🔁 ${task.repeat.tasksText}` : "",
			task.repeat && !this.keepCompletedRecurringTask ? "🏁 delete" : "",
			task.datum ? `📅 ${task.datum}` : "",
			...task.hashtags,
		];

		return parts.filter(Boolean).join(" ");
	}

	private priorityEmoji(priority: InterpretationPriority): string {
		const emojis: Record<InterpretationPriority, string> = {
			highest: "🔺",
			high: "⏫",
			medium: "🔼",
			normal: "",
			low: "🔽",
			lowest: "⏬",
		};
		return emojis[priority];
	}
}
