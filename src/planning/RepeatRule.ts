/**
 * RepeatRule
 *
 * Purpose:
 * Represent a Tasks-compatible recurrence rule.
 *
 * Responsibility:
 * Keep the normalized recurrence text and its scheduling semantics.
 */
export type RepeatUnit = "day" | "week" | "month" | "year";
export type RepeatPosition = "first" | "last";

export interface RepeatRule {
	originalText: string;
	tasksText: string;
	every: number;
	unit: RepeatUnit;
	weekday?: number;
	position?: RepeatPosition;
}
