export type InterpretationPriority =
	| "highest"
	| "high"
	| "medium"
	| "normal"
	| "low"
	| "lowest";

import { RepeatRule } from "../../planning/RepeatRule";

export interface TaskInterpretation {
	titel: string;
	origineleTekst: string;
	datumTekst?: string;
	datum?: string;
	prioriteit: InterpretationPriority;
	hashtags: string[];
	repeat?: RepeatRule;
	metadataPhrases: string[];
	resterendeWoorden: string[];
}
