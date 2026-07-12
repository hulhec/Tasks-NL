/**
 * DictionaryBuilder
 *
 * Purpose:
 * Convert user-facing settings into a single internal dictionary.
 *
 * Responsibility:
 * Build normalized GTD, project and person entries for DictionaryEngine.
 *
 * Does NOT:
 * Search input text or generate Markdown.
 */

import { TasksNLSettings } from "../settings";
import { DictionaryEntry } from "./DictionaryEntry";

export class DictionaryBuilder {
	build(settings: TasksNLSettings): DictionaryEntry[] {
		return [
			...settings.gtdDefinitions.map((definition): DictionaryEntry => ({
				type: "gtd",
				hashtag: definition.hashtag,
				terms: definition.synonyms,
			})),
			...settings.projectDefinitions.map((definition): DictionaryEntry => ({
				type: "project",
				hashtag: definition.hashtag,
				terms: [
					definition.name,
					definition.alias,
					this.stripHash(definition.hashtag),
				],
			})),
			...settings.personDefinitions.map((definition): DictionaryEntry => {
				const fullName = `${definition.firstName} ${definition.lastName}`.trim();

				return {
					type: "person",
					hashtag: definition.hashtag,
					terms: [
						fullName,
						definition.firstName,
						definition.lastName,
						definition.alias,
						this.stripHash(definition.hashtag),
					],
				};
			}),
		];
	}

	private stripHash(value: string): string {
		return value.trim().replace(/^#/, "");
	}
}
