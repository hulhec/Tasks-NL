import { App } from "obsidian";
import { Task } from "../models/Task";
import { parseTaskLine } from "../parser/TaskLineParser";

/**
 * TaskRepository
 *
 * Purpose:
 * Read every Markdown task in the vault into structured Task objects.
 *
 * Responsibility:
 * Scan files and attach source file and line information.
 *
 * Does NOT:
 * Render dashboard UI or interpret natural-language input.
 */
export class TaskRepository {
	constructor(private app: App) {}

	async leesAlleTaken(): Promise<Task[]> {
		const tasks: Task[] = [];

		for (const file of this.app.vault.getMarkdownFiles()) {
			const content = await this.app.vault.cachedRead(file);
			const lines = content.split("\n");
			const stack: Task[] = [];
			const childSeen = new Map<string, boolean>();

			lines.forEach((line, index) => {
				const task = parseTaskLine(line);
				if (!task) return;

				const whitespace = line.match(/^(\s*)/u)?.[1] ?? "";
				const indent = whitespace.replace(/\t/gu, "    ").length;
				const level = Math.floor(indent / 2);

				task.bronBestand = file.path;
				task.regelNummer = index;
				task.inspringNiveau = level;

				while (stack.length > level) stack.pop();
				const parent = level > 0 ? stack[level - 1] : undefined;
				if (parent) {
					task.parentId = parent.id;
					// Subtasks follow the planning attributes of their parent.
					// Recurrence is deliberately not inherited, preventing a new
					// subtask from being generated when the final step is completed.
					task.vervalDatum = parent.vervalDatum;
					task.prioriteit = parent.prioriteit;
					task.hashtags = [...parent.hashtags];
					task.herhaling = undefined;
					const previousOpenChild = childSeen.get(parent.id) ?? false;
					task.verborgenDoorVolgorde = previousOpenChild;
					if (!task.voltooid) childSeen.set(parent.id, true);
				}

				stack[level] = task;
				stack.length = level + 1;
				tasks.push(task);
			});
		}

		return tasks;
	}
}
