/**
 * RepeatRecognizer
 *
 * Purpose:
 * Recognize recurring planning expressions in natural Dutch.
 *
 * Responsibility:
 * Convert Dutch repeat phrases into Tasks-compatible recurrence rules.
 *
 * Does NOT:
 * Calculate the first due date or format the complete task line.
 */

import { RepeatPosition, RepeatRule, RepeatUnit } from "./RepeatRule";
import { RepeatDefinition } from "../settings";

const WEEKDAYS: Record<string, { index: number; english: string }> = {
	zondag: { index: 0, english: "Sunday" },
	maandag: { index: 1, english: "Monday" },
	dinsdag: { index: 2, english: "Tuesday" },
	woensdag: { index: 3, english: "Wednesday" },
	donderdag: { index: 4, english: "Thursday" },
	vrijdag: { index: 5, english: "Friday" },
	zaterdag: { index: 6, english: "Saturday" },
};

export class RepeatRecognizer {
	constructor(private readonly definitions: RepeatDefinition[] = []) {}

	recognize(input: string): RepeatRule | undefined {
		const normalized = input
			.toLocaleLowerCase("nl-NL")
			.replace(/\s+/gu, " ")
			.trim();


		const configured = this.recognizeConfigured(normalized);
		if (configured) return configured;

		const monthlyWeekday = normalized.match(
			/\b(?:iedere|elke|elk)\s+(eerste|laatste)\s+(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)(?:\s+van\s+de\s+maand)?\b/u
		);
		if (monthlyWeekday?.[0] && monthlyWeekday[1] && monthlyWeekday[2]) {
			const weekday = WEEKDAYS[monthlyWeekday[2]];
			if (!weekday) return undefined;
			const position: RepeatPosition =
				monthlyWeekday[1] === "eerste" ? "first" : "last";

			return {
				originalText: monthlyWeekday[0],
				tasksText: `every month on the ${position} ${weekday.english}`,
				every: 1,
				unit: "month",
				weekday: weekday.index,
				position,
			};
		}

		const weekdayMatch = normalized.match(
			/\b(?:iedere|elke|elk)\s+(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/u
		);
		if (weekdayMatch?.[0] && weekdayMatch[1]) {
			const weekday = WEEKDAYS[weekdayMatch[1]];
			if (!weekday) return undefined;

			return {
				originalText: weekdayMatch[0],
				tasksText: `every week on ${weekday.english}`,
				every: 1,
				unit: "week",
				weekday: weekday.index,
			};
		}

		const intervalMatch = normalized.match(
			/\b(?:iedere|elke|elk)\s+(?:(\d+|een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|veertien)\s+)?(dag|dagen|week|weken|maand|maanden|jaar|jaren)\b/u
		);
		if (!intervalMatch?.[0] || !intervalMatch[2]) return undefined;

		const every = this.toNumber(intervalMatch[1] ?? "1");
		const unit = this.toUnit(intervalMatch[2]);
		if (!every || !unit) return undefined;

		const plural = every === 1 ? unit : `${unit}s`;

		return {
			originalText: intervalMatch[0],
			tasksText: `every ${every === 1 ? "" : `${every} `}${plural}`.trim(),
			every,
			unit,
		};
	}

	private recognizeConfigured(normalizedInput: string): RepeatRule | undefined {
		for (const definition of this.definitions) {
			const input = definition.input.trim().toLocaleLowerCase("nl-NL");
			if (!input || !this.containsPhrase(normalizedInput, input)) continue;
			const parsed = this.parseTasksText(definition.tasksText.trim());
			if (!parsed) continue;
			return { ...parsed, originalText: definition.input.trim(), tasksText: definition.tasksText.trim() };
		}
		return undefined;
	}

	private containsPhrase(input: string, phrase: string): boolean {
		const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return new RegExp(`(^|[\\s,.;:!?()])${escaped}(?=$|[\\s,.;:!?()])`, "u").test(input);
	}

	private parseTasksText(value: string): Omit<RepeatRule, "originalText" | "tasksText"> | undefined {
		const normalized = value.toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
		const match = normalized.match(/^every\s+(?:(\d+)\s+)?(day|days|week|weeks|month|months|year|years)$/u);
		if (!match?.[2]) return undefined;
		const every = Number(match[1] ?? "1");
		const unit = match[2].replace(/s$/u, "") as RepeatUnit;
		return Number.isFinite(every) && every > 0 ? { every, unit } : undefined;
	}

	private toUnit(value: string): RepeatUnit | undefined {
		if (value.startsWith("dag")) return "day";
		if (value.startsWith("week")) return "week";
		if (value.startsWith("maand")) return "month";
		if (value.startsWith("jaar")) return "year";
		return undefined;
	}

	private toNumber(value: string): number | undefined {
		const numbers: Record<string, number> = {
			een: 1,
			één: 1,
			twee: 2,
			drie: 3,
			vier: 4,
			vijf: 5,
			zes: 6,
			zeven: 7,
			acht: 8,
			negen: 9,
			tien: 10,
			elf: 11,
			twaalf: 12,
			veertien: 14,
		};

		if (/^\d+$/u.test(value)) return Number(value);
		return numbers[value];
	}
}
