/**
 * DateRecognizer
 *
 * Purpose:
 * Detect Dutch relative dates, weekdays and explicit day/month expressions.
 *
 * Responsibility:
 * Return the complete date phrase found in the user's input.
 *
 * Does NOT:
 * Calculate the ISO date.
 */

export interface DateRecognitionResult {
	datumTekst?: string;
}

export class DateRecognizer {
	private readonly weekdays =
		"maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag";

	private readonly months =
		"jan(?:uari)?|feb(?:ruari)?|mrt|maart|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|aug(?:ustus)?|sep(?:t(?:ember)?)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?";

	recognize(input: string): DateRecognitionResult {
		const normalized = input.toLocaleLowerCase("nl-NL").replace(/\s+/g, " ").trim();

		const patterns = [
			new RegExp(`\\bvolgende\\s+week\\s+(${this.weekdays})\\b`, "u"),
			new RegExp(`\\b(?:volgende|komende)\\s+(${this.weekdays})\\b`, "u"),
			new RegExp(`\\b(?:${this.weekdays})\\b`, "u"),
			/\b(?:vandaag|morgen|overmorgen)\b/u,
			/\bover\s+(?:\d+|een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf)\s+(?:dag|dagen|week|weken)\b/u,
			/\b(?:\d+|een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf)\s+(?:dag|dagen|week|weken)\b/u,
			new RegExp(`\\b(?:[1-9]|[12]\\d|3[01])\\s+(?:${this.months})(?:\\s+\\d{4})?\\b`, "u"),
			/\b(?:[1-9]|[12]\d|3[01])[-/](?:0?[1-9]|1[0-2])(?:[-/]\d{2,4})?\b/u,
		];

		for (const pattern of patterns) {
			const match = normalized.match(pattern);
			if (match?.[0]) {
				return { datumTekst: match[0] };
			}
		}

		return {};
	}
}
