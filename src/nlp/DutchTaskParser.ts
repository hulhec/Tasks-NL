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
	private readonly repeatRecognizer = new RepeatRecognizer();
	private readonly repeatResolver = new RepeatResolver();
	private readonly dictionaryEngine: DictionaryEngine;

	constructor(settings: TasksNLSettings) {
		this.dictionaryEngine = new DictionaryEngine(settings);
	}

	parse(invoer: string): TaskInterpretation {
		const origineleTekst = invoer.trim();
		const woorden = origineleTekst ? origineleTekst.split(/\s+/u) : [];

		const dateResult = this.dateRecognizer.recognize(origineleTekst);
		const priorityResult = this.priorityRecognizer.recognize(origineleTekst);
		const repeat = this.repeatRecognizer.recognize(origineleTekst);

		const datumTekst = dateResult.datumTekst;
		const datum = datumTekst
			? this.dateResolver.resolve(datumTekst)
			: repeat
				? this.repeatResolver.resolveInitialDueDate(repeat)
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
			...(priorityResult.matchedText ? [priorityResult.matchedText] : []),
			...(repeat ? [repeat.originalText] : []),
			...dictionaryMatches.map((match) => match.matchedText),
		];

		return {
			titel: origineleTekst,
			origineleTekst,
			datumTekst,
			datum,
			prioriteit: priorityResult.priority,
			hashtags,
			repeat,
			metadataPhrases,
			resterendeWoorden: woorden,
		};
	}
}
