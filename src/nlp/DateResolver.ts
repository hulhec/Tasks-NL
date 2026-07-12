/**
 * DateResolver
 *
 * Purpose:
 * Convert recognized Dutch date expressions into ISO dates.
 *
 * Responsibility:
 * Resolve relative dates, weekdays and explicit Dutch dates.
 *
 * Does NOT:
 * Search complete sentences for date phrases.
 */

export class DateResolver {
	private readonly weekdays: Record<string, number> = {
		zondag: 0,
		maandag: 1,
		dinsdag: 2,
		woensdag: 3,
		donderdag: 4,
		vrijdag: 5,
		zaterdag: 6,
	};

	private readonly months: Record<string, number> = {
		jan: 0,
		januari: 0,
		feb: 1,
		februari: 1,
		mrt: 2,
		maart: 2,
		apr: 3,
		april: 3,
		mei: 4,
		jun: 5,
		juni: 5,
		jul: 6,
		juli: 6,
		aug: 7,
		augustus: 7,
		sep: 8,
		sept: 8,
		september: 8,
		okt: 9,
		oktober: 9,
		nov: 10,
		november: 10,
		dec: 11,
		december: 11,
	};

	resolve(expression: string): string | undefined {
		const normalized = expression.toLocaleLowerCase("nl-NL").replace(/\s+/g, " ").trim();
		const today = this.startOfDay(new Date());

		if (normalized === "vandaag") return this.format(today);
		if (normalized === "morgen") return this.addDays(today, 1);
		if (normalized === "overmorgen") return this.addDays(today, 2);

		const relative = normalized.match(
			/^(?:over\s+)?(\d+|een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf)\s+(dag|dagen|week|weken)$/u
		);
		if (relative?.[1] && relative[2]) {
			const amount = this.toNumber(relative[1]);
			if (amount !== undefined) {
				const multiplier = relative[2].startsWith("week") ? 7 : 1;
				return this.addDays(today, amount * multiplier);
			}
		}

		const weekdayMatch = normalized.match(
			/^(?:(volgende week|volgende|komende)\s+)?(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)$/u
		);
		if (weekdayMatch?.[2]) {
			const prefix = weekdayMatch[1];
			const weeksAhead = prefix === "volgende" || prefix === "volgende week" ? 1 : 0;
			return this.resolveWeekday(today, this.weekdays[weekdayMatch[2]], weeksAhead);
		}

		const writtenDate = normalized.match(
			/^([1-9]|[12]\d|3[01])\s+([a-zé]+)(?:\s+(\d{4}))?$/u
		);
		if (writtenDate?.[1] && writtenDate[2]) {
			const month = this.months[writtenDate[2]];
			if (month !== undefined) {
				const explicitYear = writtenDate[3] ? Number(writtenDate[3]) : undefined;
				return this.resolveCalendarDate(
					Number(writtenDate[1]),
					month,
					explicitYear,
					today
				);
			}
		}

		const numericDate = normalized.match(
			/^([1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])(?:[-/](\d{2}|\d{4}))?$/u
		);
		if (numericDate?.[1] && numericDate[2]) {
			const rawYear = numericDate[3];
			let year: number | undefined;
			if (rawYear) year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);

			return this.resolveCalendarDate(
				Number(numericDate[1]),
				Number(numericDate[2]) - 1,
				year,
				today
			);
		}

		return undefined;
	}

	private resolveWeekday(today: Date, targetDay: number | undefined, weeksAhead: number): string | undefined {
		if (targetDay === undefined) return undefined;

		const date = new Date(today);
		let difference = targetDay - date.getDay();
		if (difference <= 0) difference += 7;
		difference += weeksAhead * 7;
		date.setDate(date.getDate() + difference);
		return this.format(date);
	}

	private resolveCalendarDate(
		day: number,
		month: number,
		explicitYear: number | undefined,
		today: Date
	): string | undefined {
		let year = explicitYear ?? today.getFullYear();
		let date = new Date(year, month, day);

		if (!this.isValidDate(date, year, month, day)) return undefined;

		if (explicitYear === undefined && date < today) {
			year += 1;
			date = new Date(year, month, day);
		}

		return this.format(date);
	}

	private isValidDate(date: Date, year: number, month: number, day: number): boolean {
		return (
			date.getFullYear() === year &&
			date.getMonth() === month &&
			date.getDate() === day
		);
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
		};

		if (/^\d+$/u.test(value)) return Number(value);
		return numbers[value];
	}

	private addDays(date: Date, amount: number): string {
		const result = new Date(date);
		result.setDate(result.getDate() + amount);
		return this.format(result);
	}

	private startOfDay(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	private format(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}
}
