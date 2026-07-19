/**
 * DictionaryEngine
 *
 * Purpose:
 * Match natural-language text against configurable dictionary entries.
 *
 * Responsibility:
 * Return unique hashtags and the exact phrases that must be removed from the
 * human-readable task title.
 *
 * Does NOT:
 * Parse dates, priorities or generate Markdown.
 */

import { TasksNLSettings } from "../settings";
import { DictionaryBuilder } from "./DictionaryBuilder";
import { DictionaryEntry, DictionaryEntryType } from "./DictionaryEntry";

export interface DictionaryMatch {
	type: DictionaryEntryType;
	hashtag: string;
	matchedText: string;
}

export class DictionaryEngine {
	private readonly entries: DictionaryEntry[];

	constructor(settings: TasksNLSettings) {
		this.entries = new DictionaryBuilder().build(settings);
	}

	findMatches(input: string): DictionaryMatch[] {
		const normalizedInput = this.normalize(input);
		const matches: DictionaryMatch[] = [];
		const usedHashtags = new Set<string>();
		let personMatches = 0;

		for (const entry of this.entries) {
			if (entry.type === "person" && personMatches >= 2) continue;
			const terms = [...entry.terms]
				.map((term) => term.trim())
				.filter(Boolean)
				.sort((a, b) => b.length - a.length);

			for (const term of terms) {
				if (!this.containsTerm(normalizedInput, term)) continue;

				const hashtag = this.normalizeHashtag(entry.hashtag);
				const key = hashtag.toLocaleLowerCase("nl-NL");

				if (!hashtag || usedHashtags.has(key)) break;

				usedHashtags.add(key);
				matches.push({
					type: entry.type,
					hashtag,
					matchedText: term,
				});
				if (entry.type === "person") personMatches += 1;
				break;
			}
		}

		return matches;
	}

	private containsTerm(input: string, term: string): boolean {
		const escaped = this.normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (!escaped) return false;

		return new RegExp(
			`(^|[\\s,.;:!?()])${escaped}(?=$|[\\s,.;:!?()])`,
			"u"
		).test(input);
	}

	private normalize(value: string): string {
		return value.toLocaleLowerCase("nl-NL").replace(/\s+/g, " ").trim();
	}

	private normalizeHashtag(value: string): string {
		const trimmed = value.trim();
		if (!trimmed) return "";
		return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
	}
}
