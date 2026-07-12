/**
 * RepeatResolver
 *
 * Purpose:
 * Calculate an initial due date for recurring tasks without an explicit date.
 *
 * Responsibility:
 * Resolve interval, weekday and monthly-position recurrence rules.
 */

import { RepeatRule } from "./RepeatRule";

export class RepeatResolver {
	resolveInitialDueDate(rule: RepeatRule, from = new Date()): string {
		const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());

		if (rule.position && rule.weekday !== undefined) {
			return this.resolveMonthlyWeekday(date, rule.weekday, rule.position);
		}

		if (rule.weekday !== undefined) {
			let difference = rule.weekday - date.getDay();
			if (difference <= 0) difference += 7;
			date.setDate(date.getDate() + difference);
			return this.format(date);
		}

		switch (rule.unit) {
			case "day":
				date.setDate(date.getDate() + rule.every);
				break;
			case "week":
				date.setDate(date.getDate() + rule.every * 7);
				break;
			case "month":
				date.setMonth(date.getMonth() + rule.every);
				break;
			case "year":
				date.setFullYear(date.getFullYear() + rule.every);
				break;
		}

		return this.format(date);
	}

	private resolveMonthlyWeekday(
		from: Date,
		weekday: number,
		position: "first" | "last"
	): string {
		for (let monthOffset = 0; monthOffset < 24; monthOffset++) {
			const candidate =
				position === "first"
					? this.firstWeekdayOfMonth(from, monthOffset, weekday)
					: this.lastWeekdayOfMonth(from, monthOffset, weekday);

			if (candidate > from) return this.format(candidate);
		}

		return this.format(from);
	}

	private firstWeekdayOfMonth(
		from: Date,
		monthOffset: number,
		weekday: number
	): Date {
		const first = new Date(from.getFullYear(), from.getMonth() + monthOffset, 1);
		const difference = (weekday - first.getDay() + 7) % 7;
		first.setDate(first.getDate() + difference);
		return first;
	}

	private lastWeekdayOfMonth(
		from: Date,
		monthOffset: number,
		weekday: number
	): Date {
		const last = new Date(from.getFullYear(), from.getMonth() + monthOffset + 1, 0);
		const difference = (last.getDay() - weekday + 7) % 7;
		last.setDate(last.getDate() - difference);
		return last;
	}

	private format(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}
}
