/**
 * DictionaryEntry
 *
 * Purpose:
 * Represent one searchable, configurable metadata definition.
 *
 * Responsibility:
 * Store the entry type, output hashtag, search terms.
 *
 * Does NOT:
 * Search input text or modify task titles.
 */

export type DictionaryEntryType = "gtd" | "project" | "person";

export interface DictionaryEntry {
	type: DictionaryEntryType;
	hashtag: string;
	terms: string[];
}
