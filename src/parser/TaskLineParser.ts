import { Task, TaskPriority } from "../models/Task";

const TASK_DATE_PATTERN = /(?:📅|⏳|🛫|🛬|➕|✅)\s+(\d{4}-\d{2}-\d{2})/gu;

export function parseTaskLine(line: string): Task | null {
	const match = line.match(/^\s*-\s+\[([ xX])\]\s+(.+)$/u);
	if (!match?.[1] || !match[2]) return null;

	const content = match[2];
	const dueDate = findDisplayDate(content);
	const repeat = content.match(
		/🔁\s+(.+?)(?=\s+🏁|\s+(?:📅|⏳|🛫|🛬|➕|✅)|\s+#[\p{L}\p{N}_/-]+|$)/u
	)?.[1]?.trim();
	const priority = parsePriority(content);
	const hashtags = Array.from(content.matchAll(/#([\p{L}\p{N}_/-]+)/gu))
		.map((item) => item[1])
		.filter((tag): tag is string => Boolean(tag))
		.map((tag) => `#${tag}`);

	const title = content
		.replace(
			/🔁\s+(.+?)(?=\s+🏁|\s+(?:📅|⏳|🛫|🛬|➕|✅)|\s+#[\p{L}\p{N}_/-]+|$)/gu,
			""
		)
		.replace(/🏁\s+(?:delete|keep)/gu, "")
		.replace(TASK_DATE_PATTERN, "")
		.replace(/[🔺⏫🔼🔽⏬]/gu, "")
		.replace(/#[\p{L}\p{N}_/-]+/gu, "")
		.replace(/\s{2,}/gu, " ")
		.trim();

	return {
		id: crypto.randomUUID(),
		titel: title,
		voltooid: match[1].toLowerCase() === "x",
		prioriteit: priority,
		vervalDatum: dueDate,
		herhaling: repeat,
		hashtags,
	};
}

function findDisplayDate(content: string): string | undefined {
	const preferredMarkers = ["📅", "⏳", "🛫", "🛬", "➕", "✅"];

	for (const marker of preferredMarkers) {
		const escapedMarker = escapeRegExp(marker);
		const value = content.match(
			new RegExp(`${escapedMarker}\\s+(\\d{4}-\\d{2}-\\d{2})`, "u")
		)?.[1];
		if (value) return value;
	}

	return undefined;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePriority(content: string): TaskPriority {
	if (content.includes("🔺")) return "highest";
	if (content.includes("⏫")) return "high";
	if (content.includes("🔼")) return "medium";
	if (content.includes("🔽")) return "low";
	if (content.includes("⏬")) return "lowest";
	return "normal";
}
