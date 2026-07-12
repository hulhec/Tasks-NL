/**
 * PriorityRecognizer
 *
 * Purpose:
 * Recognize five Tasks-compatible priority levels in Dutch and English.
 *
 * Responsibility:
 * Return the priority and exact phrase that should be removed from the title.
 *
 * Does NOT:
 * Format the priority emoji.
 */

import { InterpretationPriority } from "./models/TaskInterpretation";

export interface PriorityRecognitionResult {
	priority: InterpretationPriority;
	matchedText?: string;
}

interface PriorityPhrase {
	phrase: string;
	priority: InterpretationPriority;
}

export class PriorityRecognizer {
	private readonly phrases: PriorityPhrase[] = [
		{ phrase: "allerhoogste", priority: "highest" },
		{ phrase: "hoogste", priority: "highest" },
		{ phrase: "highest", priority: "highest" },
		{ phrase: "zeer hoog", priority: "highest" },
		{ phrase: "hoge prioriteit", priority: "high" },
		{ phrase: "hoog", priority: "high" },
		{ phrase: "high", priority: "high" },
		{ phrase: "gemiddeld", priority: "medium" },
		{ phrase: "middel", priority: "medium" },
		{ phrase: "medium", priority: "medium" },
		{ phrase: "lage prioriteit", priority: "low" },
		{ phrase: "laag", priority: "low" },
		{ phrase: "low", priority: "low" },
		{ phrase: "allerlaagste", priority: "lowest" },
		{ phrase: "laagste", priority: "lowest" },
		{ phrase: "lowest", priority: "lowest" },
		{ phrase: "zeer laag", priority: "lowest" },
	];

	recognize(input: string): PriorityRecognitionResult {
		const normalized = input.toLocaleLowerCase("nl-NL");

		for (const item of this.phrases.sort((a, b) => b.phrase.length - a.phrase.length)) {
			const escaped = item.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const regex = new RegExp(`(^|[\\s,.;:!?()])${escaped}(?=$|[\\s,.;:!?()])`, "u");

			if (regex.test(normalized)) {
				return {
					priority: item.priority,
					matchedText: item.phrase,
				};
			}
		}

		return { priority: "normal" };
	}
}
