/**
 * TaskNormalizer
 *
 * Purpose:
 * Convert an interpreted task into a clean task title plus metadata.
 *
 * Responsibility:
 * Remove recognized metadata phrases when configured, normalize whitespace
 * and guarantee a non-empty task title.
 *
 * Does NOT:
 * Parse language, calculate dates or generate Markdown.
 */

import { TaskInterpretation } from "../nlp/models/TaskInterpretation";

export class TaskNormalizer {
	constructor(
		private readonly defaultTaskTitle = "Task",
		private readonly keepOriginalTaskText = false
	) {}

	normalize(input: TaskInterpretation): TaskInterpretation {
		let title = input.origineleTekst;

		if (!this.keepOriginalTaskText) {
			const phrases = [...input.metadataPhrases]
				.filter(Boolean)
				.sort((a, b) => b.length - a.length);

			for (const phrase of phrases) {
				title = this.removePhrase(title, phrase);
			}

			if (input.repeat) {
				title = this.removeRepeatConnectors(title);
			}
		}

		title = title
			.replace(/\s+([,.;:!?])/gu, "$1")
			.replace(/\s{2,}/gu, " ")
			.trim();

		if (!title) {
			title = this.defaultTaskTitle.trim() || "Task";
		}

		return {
			...input,
			titel: title,
		};
	}

	private removePhrase(input: string, phrase: string): string {
		const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(
			`(^|[\\s,.;:!?()])${escaped}(?=$|[\\s,.;:!?()])`,
			"iu"
		);
		return input.replace(regex, "$1");
	}

	private removeRepeatConnectors(input: string): string {
		return input
			.replace(
				/\b(?:en\s+dan|daarna)?\s*(?:herhalen|herhaal)\b/giu,
				" "
			)
			.replace(/\b(?:en\s+dan|daarna)\s*$/giu, " ");
	}
}
