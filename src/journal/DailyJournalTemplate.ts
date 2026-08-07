export type DailyJournalBlock = "top-three" | "next-project-steps";

const block = (id: DailyJournalBlock, heading: string, marker: string, emptyText: string): string => [
	`##### ${heading}`,
	"",
	"```dataviewjs",
	`const tasksNlJournalBlock = "${id}";`,
	"void tasksNlJournalBlock;",
	`const markerPattern = /${marker}/;`,
	"const taskPattern = /^\\s*[-*+]\\s+\\[([ xX])\\]\\s+(.+)$/;",
	"const rows = [];",
	"for (const page of dv.pages()) {",
	"  const file = app.vault.getAbstractFileByPath(page.file.path);",
	"  if (!file) continue;",
	"  const content = await app.vault.cachedRead(file);",
	"  content.split(\"\\n\").forEach((line) => {",
	"    const task = line.match(taskPattern);",
	"    const markerMatch = line.match(markerPattern);",
	"    if (!task || !markerMatch || task[1].toLowerCase() === \"x\") return;",
	"    const title = task[2]",
	"      .replace(markerPattern, \"\")",
	"      .replace(/<!--\\s*tasks-nl-(?:focus:[123]|project-next)\\s*-->/g, \"\")",
	"      .replace(/📅\\s+\\d{4}-\\d{2}-\\d{2}/g, \"\")",
	"      .replace(/[🔺⏫🔼🔽⏬]/g, \"\")",
	"      .replace(/\\s{2,}/g, \" \").trim();",
	"    rows.push({ order: markerMatch[1] ? Number(markerMatch[1]) : 0, title, path: page.file.path });",
	"  });",
	"}",
	"rows.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, \"nl\"));",
	"if (rows.length === 0) dv.paragraph(" + JSON.stringify(emptyText) + ");",
	"else {",
	`  const wrap = dv.el("div", "", { cls: "tasks-nl-journal-list tasks-nl-journal-${id}" });`,
	"  for (const row of rows) {",
	"    const item = document.createElement(\"div\");",
	"    item.className = \"tasks-nl-journal-item\";",
	"    const badge = document.createElement(\"span\");",
	"    badge.className = \"tasks-nl-journal-badge\";",
	`    badge.textContent = ${id === "top-three" ? "String(row.order)" : '"🚩"'};`,
	"    const link = document.createElement(\"a\");",
	"    link.className = \"internal-link tasks-nl-journal-link\";",
	"    link.textContent = row.title;",
	"    link.href = row.path;",
	"    link.dataset.href = row.path;",
	"    item.append(badge, link);",
	"    wrap.append(item);",
	"  }",
	"}",
	"```",
].join("\n");

export const DAILY_TOP_THREE_BLOCK = block(
	"top-three", "Top drie acties", "<!--\\s*tasks-nl-focus:([123])\\s*-->", "Nog geen focustaken gekozen.",
);

export const DAILY_NEXT_PROJECT_STEPS_BLOCK = block(
	"next-project-steps", "Eerstvolgende projectstappen", "<!--\\s*tasks-nl-project-next\\s*-->", "Nog geen eerstvolgende projectstappen gevonden.",
);

function removeBlock(source: string, id: DailyJournalBlock): string {
	const externalMarkers = new RegExp(`(?:^|\\n)(?:<!--\\s*tasks-nl-journal:${id}:start\\s*-->|%%\\s*tasks-nl-journal:${id}:start\\s*%%)[\\s\\S]*?(?:<!--\\s*tasks-nl-journal:${id}:end\\s*-->|%%\\s*tasks-nl-journal:${id}:end\\s*%%)(?:\\n|$)`, "gu");
	const embeddedMarker = new RegExp(`(?:^|\\n)#{1,6}[^\\n]*\\n\\s*\\n\\x60\\x60\\x60dataviewjs\\nconst tasksNlJournalBlock = ["']${id}["'];[\\s\\S]*?\\n\\x60\\x60\\x60(?:\\n|$)`, "gu");
	return source
		.replace(externalMarkers, "\n")
		.replace(embeddedMarker, "\n")
		.replace(/^\n+|\n+$/gu, "");
}

export function setDailyJournalBlock(source: string, id: DailyJournalBlock, enabled: boolean): string {
	const cleaned = removeBlock(source, id);
	if (!enabled) return cleaned;
	const selected = id === "top-three" ? DAILY_TOP_THREE_BLOCK : DAILY_NEXT_PROJECT_STEPS_BLOCK;
	return `${selected}\n\n${cleaned}`.trimEnd();
}

export function synchronizeDailyJournalBlocks(source: string, includeTopThree: boolean, includeNextProjectSteps: boolean): string {
	let result = setDailyJournalBlock(source, "next-project-steps", includeNextProjectSteps);
	result = setDailyJournalBlock(result, "top-three", includeTopThree);
	return result;
}

export function migrateLegacyDailyJournalBlocks(
	source: string,
	includeTopThree: boolean,
	includeNextProjectSteps: boolean,
): string {
	const hasLegacyBlock = /(?:<!--|%%)\s*tasks-nl-journal:(?:top-three|next-project-steps):(?:start|end)\s*(?:-->|%%)/u.test(source);
	if (!hasLegacyBlock) return source;
	return synchronizeDailyJournalBlocks(source, includeTopThree, includeNextProjectSteps);
}
