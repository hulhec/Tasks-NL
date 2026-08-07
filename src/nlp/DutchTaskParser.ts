/**
 * DutchTaskParser
 *
 * Purpose:
 * Interpret Dutch natural-language task descriptions.
 *
 * Responsibility:
 * Coordinate date, priority and configurable dictionary recognition.
 *
 * Does NOT:
 * Normalize titles or generate Markdown.
 */

import { DictionaryEngine } from "../dictionary/DictionaryEngine";
import { TasksNLSettings } from "../settings";
import { DateRecognizer } from "./DateRecognizer";
import { DateResolver } from "./DateResolver";
import { PriorityRecognizer } from "./PriorityRecognizer";
import { RepeatRecognizer } from "../planning/RepeatRecognizer";
import { RepeatResolver } from "../planning/RepeatResolver";
import { TaskInterpretation } from "./models/TaskInterpretation";

export class DutchTaskParser {
	private readonly dateRecognizer = new DateRecognizer();
	private readonly dateResolver = new DateResolver();
	private readonly priorityRecognizer = new PriorityRecognizer();
	private readonly repeatRecognizer: RepeatRecognizer;
	private readonly repeatResolver = new RepeatResolver();
	private readonly dictionaryEngine: DictionaryEngine;
	private readonly startDateWords: string[];

	constructor(settings: TasksNLSettings) {
		this.repeatRecognizer = new RepeatRecognizer(settings.repeatKeywords);
		this.dictionaryEngine = new DictionaryEngine(settings);
		this.startDateWords = settings.startDateWords;
	}

	parse(invoer: string): TaskInterpretation {
		const origineleTekst = invoer.trim();
		const woorden = origineleTekst ? origineleTekst.split(/\s+/u) : [];

		const startResult = this.recognizeStartDate(origineleTekst);
		const dueInput = startResult?.fullText
			? this.removeExactPhrase(origineleTekst, startResult.fullText)
			: origineleTekst;
		const dateResult = this.dateRecognizer.recognize(dueInput);
		const priorityResult = this.priorityRecognizer.recognize(origineleTekst);
		const repeat = this.repeatRecognizer.recognize(origineleTekst);

		const datumTekst = dateResult.datumTekst;
		const datum = datumTekst
			? this.dateResolver.resolve(datumTekst)
			: repeat
				? this.repeatResolver.resolveInitialDueDate(repeat)
				: undefined;
		const startDatum = startResult
			? this.dateResolver.resolve(startResult.dateText)
			: undefined;
		const dictionaryMatches = this.dictionaryEngine.findMatches(origineleTekst);

		const hashtags = [
			...new Set(
				dictionaryMatches
					.map((match) => match.hashtag)
					.filter(Boolean)
			),
		];

		const metadataPhrases = [
			...(datumTekst ? [datumTekst] : []),
			...(startResult ? [startResult.fullText] : []),
			...(priorityResult.matchedText ? [priorityResult.matchedText] : []),
			...(repeat ? [repeat.originalText] : []),
			...dictionaryMatches.map((match) => match.matchedText),
		];

		return {
			titel: origineleTekst,
			origineleTekst,
			datumTekst,
			datum,
			startDatumTekst: startResult?.fullText,
			startDatum,
			prioriteit: priorityResult.priority,
			hashtags,
			repeat,
			metadataPhrases,
			resterendeWoorden: woorden,
		};
	}

	private recognizeStartDate(input: string): { fullText: string; dateText: string } | undefined {
		for (const word of [...this.startDateWords].sort((a, b) => b.length - a.length)) {
			const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const match = input.match(new RegExp(`\\b${escaped}\\b\\s+(.+)$`, "iu"));
			if (!match?.[1]) continue;
			const recognized = this.dateRecognizer.recognize(match[1]);
			if (!recognized.datumTekst) continue;
			return { fullText: `${word} ${recognized.datumTekst}`, dateText: recognized.datumTekst };
		}
		return undefined;
	}

	private removeExactPhrase(input: string, phrase: string): string {
		const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return input.replace(new RegExp(escaped, "iu"), " ");
	}
}
