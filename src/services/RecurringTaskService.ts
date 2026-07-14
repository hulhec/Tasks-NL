import { App, TFile } from "obsidian";

const TASK_PATTERN = /^(\s*[-*+]\s+\[)([ xX])(\]\s+)(.*)$/u;
const REPEAT_PATTERN = /🔁\s+(.+?)(?=\s+🏁|\s+(?:📅|⏳|🛫|🛬|➕|✅)|\s+#[\p{L}\p{N}_/-]+|$)/u;
const DUE_PATTERN = /📅\s+(\d{4}-\d{2}-\d{2})/u;
const COMPLETION_PATTERN = /\s*✅\s+\d{4}-\d{2}-\d{2}/gu;

export class RecurringTaskService {
	private readonly snapshots = new Map<string, string>();
	private readonly processing = new Set<string>();

	constructor(private readonly app: App) {}

	async initialize(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		await Promise.all(files.map(async (file) => {
			this.snapshots.set(file.path, await this.app.vault.cachedRead(file));
		}));
	}

	remember(file: TFile, content: string): void {
		this.snapshots.set(file.path, content);
	}

	forget(path: string): void {
		this.snapshots.delete(path);
	}

	async handleModify(file: TFile): Promise<void> {
		if (file.extension !== "md" || this.processing.has(file.path)) return;

		const current = await this.app.vault.cachedRead(file);
		const previous = this.snapshots.get(file.path);
		this.snapshots.set(file.path, current);
		if (previous === undefined || previous === current) return;

		const completedLines = this.findNewlyCompletedRecurringLines(previous, current);
		if (completedLines.length === 0) return;

		this.processing.add(file.path);
		try {
			const updated = this.applyCompletions(current, completedLines);
			if (updated !== current) {
				await this.app.vault.modify(file, updated);
				this.snapshots.set(file.path, updated);
			}
		} finally {
			this.processing.delete(file.path);
		}
	}

	private findNewlyCompletedRecurringLines(previous: string, current: string): number[] {
		const oldLines = previous.split("\n");
		const newLines = current.split("\n");
		const matches: number[] = [];
		const count = Math.min(oldLines.length, newLines.length);

		for (let index = 0; index < count; index += 1) {
			const oldMatch = oldLines[index]?.match(TASK_PATTERN);
			const newMatch = newLines[index]?.match(TASK_PATTERN);
			if (!oldMatch || !newMatch) continue;
			if (oldMatch[2]?.toLowerCase() === "x" || newMatch[2]?.toLowerCase() !== "x") continue;
			if (!REPEAT_PATTERN.test(newMatch[4] ?? "")) continue;
			REPEAT_PATTERN.lastIndex = 0;
			matches.push(index);
		}
		return matches;
	}

	private applyCompletions(content: string, lineNumbers: number[]): string {
		const lines = content.split("\n");
		for (const lineNumber of [...lineNumbers].sort((a, b) => b - a)) {
			this.applyCompletion(lines, lineNumber);
		}
		return lines.join("\n");
	}

	private applyCompletion(lines: string[], lineNumber: number): void {
		const line = lines[lineNumber] ?? "";
		const match = line.match(TASK_PATTERN);
		if (!match?.[4]) return;

		const repeatText = match[4].match(REPEAT_PATTERN)?.[1]?.trim();
		if (!repeatText) return;

		const currentDue = match[4].match(DUE_PATTERN)?.[1];
		const nextDue = this.resolveNextDate(repeatText, currentDue);
		if (!nextDue) return;

		const startIndent = this.indent(line);
		let end = lineNumber + 1;
		while (end < lines.length) {
			const candidate = lines[end] ?? "";
			if (candidate.trim() === "") break;
			const task = candidate.match(TASK_PATTERN);
			if (!task) break;
			if (this.indent(candidate) <= startIndent) break;
			end += 1;
		}

		const originalBlock = lines.slice(lineNumber, end);
		const renewedBlock = originalBlock.map((item, index) =>
			this.renewTaskLine(item, index === 0 ? nextDue : undefined)
		);
		const deleteCompleted = /🏁\s+delete\b/u.test(match[4]);

		if (deleteCompleted) {
			lines.splice(lineNumber, end - lineNumber, ...renewedBlock);
			return;
		}

		const today = this.format(new Date());
		const completedBlock = originalBlock.map((item, index) => {
			if (index !== 0 || COMPLETION_PATTERN.test(item)) {
				COMPLETION_PATTERN.lastIndex = 0;
				return item;
			}
			COMPLETION_PATTERN.lastIndex = 0;
			return `${item} ✅ ${today}`;
		});
		lines.splice(lineNumber, end - lineNumber, ...completedBlock, ...renewedBlock);
	}

	private renewTaskLine(line: string, nextDue?: string): string {
		const match = line.match(TASK_PATTERN);
		if (!match) return line;

		let body = (match[4] ?? "").replace(COMPLETION_PATTERN, "").trim();
		if (nextDue) {
			body = DUE_PATTERN.test(body)
				? body.replace(DUE_PATTERN, `📅 ${nextDue}`)
				: `${body} 📅 ${nextDue}`;
		}
		return `${match[1]} ${match[3]}${body}`.replace(/\[\s\]/u, "[ ]");
	}

	private resolveNextDate(repeatText: string, dueDate?: string): string | undefined {
		const base = dueDate ? this.parseDate(dueDate) : new Date();
		if (!base) return undefined;
		const normalized = repeatText.toLowerCase().replace(/\s+/gu, " ").trim();
		const weekdayNames: Record<string, number> = {
			sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
			thursday: 4, friday: 5, saturday: 6,
		};

		const positioned = normalized.match(/^every month on the (first|last) (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/u);
		if (positioned?.[1] && positioned[2]) {
			const weekday = weekdayNames[positioned[2]];
			if (weekday === undefined) return undefined;
			return this.nextPositionedWeekday(base, weekday, positioned[1] as "first" | "last");
		}

		const weeklyOn = normalized.match(/^every(?:\s+\d+)?\s+weeks?\s+on\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/u);
		if (weeklyOn?.[1]) {
			const weekday = weekdayNames[weeklyOn[1]];
			if (weekday === undefined) return undefined;
			const date = new Date(base);
			let difference = weekday - date.getDay();
			if (difference <= 0) difference += 7;
			date.setDate(date.getDate() + difference);
			return this.format(date);
		}

		const interval = normalized.match(/^every(?:\s+(\d+))?\s+(day|days|week|weeks|month|months|year|years)$/u);
		if (!interval?.[2]) return undefined;
		const every = Number(interval[1] ?? "1");
		const date = new Date(base);
		if (interval[2].startsWith("day")) date.setDate(date.getDate() + every);
		else if (interval[2].startsWith("week")) date.setDate(date.getDate() + every * 7);
		else if (interval[2].startsWith("month")) date.setMonth(date.getMonth() + every);
		else date.setFullYear(date.getFullYear() + every);
		return this.format(date);
	}

	private nextPositionedWeekday(base: Date, weekday: number, position: "first" | "last"): string {
		for (let offset = 1; offset <= 24; offset += 1) {
			const year = base.getFullYear();
			const month = base.getMonth() + offset;
			let candidate: Date;
			if (position === "first") {
				candidate = new Date(year, month, 1);
				candidate.setDate(1 + ((weekday - candidate.getDay() + 7) % 7));
			} else {
				candidate = new Date(year, month + 1, 0);
				candidate.setDate(candidate.getDate() - ((candidate.getDay() - weekday + 7) % 7));
			}
			if (candidate > base) return this.format(candidate);
		}
		return this.format(base);
	}

	private parseDate(value: string): Date | undefined {
		const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
		if (!match?.[1] || !match[2] || !match[3]) return undefined;
		const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
		return Number.isNaN(date.getTime()) ? undefined : date;
	}

	private indent(line: string): number {
		return (line.match(/^(\s*)/u)?.[1] ?? "").replace(/\t/gu, "    ").length;
	}

	private format(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}
}
