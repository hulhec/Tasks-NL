import assert from "node:assert/strict";
import {
	DAILY_NEXT_PROJECT_STEPS_BLOCK,
	DAILY_TOP_THREE_BLOCK,
	migrateLegacyDailyJournalBlocks,
	synchronizeDailyJournalBlocks,
} from "../src/journal/DailyJournalTemplate";

const base = "##### Journaal\n\nEigen tekst";

const bothOn = synchronizeDailyJournalBlocks(base, true, true);
assert.match(bothOn, /const tasksNlJournalBlock = "top-three";/u);
assert.match(bothOn, /tasks-nl-focus:\(\[123\]\)/u);
assert.match(bothOn, /const tasksNlJournalBlock = "next-project-steps";/u);
assert.doesNotMatch(bothOn, /(?:<!--|%%)\s*tasks-nl-journal:/u);
assert.match(bothOn, /badge\.textContent = String\(row\.order\)/u);
assert.match(bothOn, /badge\.textContent = "🚩"/u);
assert.doesNotMatch(bothOn, /dv\.list/u);
assert.match(bothOn, /tasks-nl-project-next/u);
assert.match(bothOn, /```dataviewjs/u);
assert.ok(bothOn.endsWith(base));

const bothOff = synchronizeDailyJournalBlocks(bothOn, false, false);
assert.equal(bothOff, base);

const onAgain = synchronizeDailyJournalBlocks(bothOff, true, true);
assert.equal(onAgain, bothOn);
assert.equal(onAgain.split(DAILY_TOP_THREE_BLOCK).length - 1, 1);
assert.equal(onAgain.split(DAILY_NEXT_PROJECT_STEPS_BLOCK).length - 1, 1);

const topOnly = synchronizeDailyJournalBlocks(onAgain, true, false);
assert.match(topOnly, /tasksNlJournalBlock = "top-three"/u);
assert.doesNotMatch(topOnly, /tasksNlJournalBlock = "next-project-steps"/u);
assert.ok(topOnly.endsWith(base));

const nextOnly = synchronizeDailyJournalBlocks(topOnly, false, true);
assert.doesNotMatch(nextOnly, /tasksNlJournalBlock = "top-three"/u);
assert.match(nextOnly, /tasksNlJournalBlock = "next-project-steps"/u);
assert.ok(nextOnly.endsWith(base));

const scripts = bothOn.match(/```dataviewjs\n([\s\S]*?)\n```/gu) ?? [];
assert.equal(scripts.length, 2);
const renderedItems: Array<{ badge: string; title: string }> = [];
class MockElement {
	className = "";
	textContent = "";
	href = "";
	dataset: Record<string, string> = {};
	children: MockElement[] = [];
	append(...children: MockElement[]): void {
		this.children.push(...children);
		if (this.className.includes("tasks-nl-journal-list")) {
			for (const child of children) {
				const [badge, link] = child.children;
				assert.ok(badge && link);
				renderedItems.push({ badge: badge.textContent, title: link.textContent });
			}
		}
	}
}
const previousDocument = globalThis.document;
Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => new MockElement() } });
const dv = {
	pages: () => [{ file: { path: "Project.md" } }],
	paragraph: () => undefined,
	el: (_tag: string, _text: string, options: { cls: string }) => {
		const element = new MockElement();
		element.className = options.cls;
		return element;
	},
};
const content = [
	"- [ ] Focus twee <!-- tasks-nl-focus:2 -->",
	"- [ ] Focus een <!-- tasks-nl-focus:1 -->",
	"- [ ] Projectstap <!-- tasks-nl-project-next -->",
].join("\n");
const app = { vault: { getAbstractFileByPath: () => ({}), cachedRead: async () => content } };
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (...args: string[]) => (...values: unknown[]) => Promise<void>;
for (const fenced of scripts) {
	const code = fenced.replace(/^```dataviewjs\n|\n```$/gu, "");
	await new AsyncFunction("dv", "app", code)(dv, app);
}
Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
assert.deepEqual(renderedItems, [
	{ badge: "1", title: "Focus een" },
	{ badge: "2", title: "Focus twee" },
	{ badge: "🚩", title: "Projectstap" },
]);

const legacy = bothOn
	.replace(/##### Top drie acties[\s\S]*?```\n/u, "<!-- tasks-nl-journal:top-three:start -->\nOld top block\n<!-- tasks-nl-journal:top-three:end -->\n")
	.replace(/##### Eerstvolgende projectstappen[\s\S]*?```\n/u, "<!-- tasks-nl-journal:next-project-steps:start -->\nOld next block\n<!-- tasks-nl-journal:next-project-steps:end -->\n");
assert.equal(synchronizeDailyJournalBlocks(legacy, false, false), base);
const migratedLegacy = migrateLegacyDailyJournalBlocks(legacy, true, true);
assert.match(migratedLegacy, /tasksNlJournalBlock = "top-three"/u);
assert.match(migratedLegacy, /tasksNlJournalBlock = "next-project-steps"/u);
assert.doesNotMatch(migratedLegacy, /<!-- tasks-nl-journal:/u);
assert.ok(migratedLegacy.endsWith(base));
assert.equal(migrateLegacyDailyJournalBlocks(legacy, false, false), base);
assert.equal(migrateLegacyDailyJournalBlocks(bothOn, false, false), bothOn);

const legacyWithFlexibleSpacing = legacy
	.replaceAll("<!-- tasks-nl-journal:", "<!--   tasks-nl-journal:")
	.replaceAll(" -->", "   -->");
const migratedFlexible = migrateLegacyDailyJournalBlocks(legacyWithFlexibleSpacing, true, true);
assert.match(migratedFlexible, /tasksNlJournalBlock = "top-three"/u);
assert.match(migratedFlexible, /badge\.textContent = String\(row\.order\)/u);
assert.match(migratedFlexible, /badge\.textContent = "🚩"/u);
assert.doesNotMatch(migratedFlexible, /<!--\s*tasks-nl-journal:/u);

const visiblePercentMarkers = [
	"%% tasks-nl-journal:top-three:start %%",
	"##### Top drie acties",
	"",
	"```dataviewjs",
	"dv.list([]);",
	"```",
	"%% tasks-nl-journal:top-three:end %%",
	"",
	"%% tasks-nl-journal:next-project-steps:start %%",
	"##### Eerstvolgende projectstappen",
	"",
	"```dataviewjs",
	"dv.list([]);",
	"```",
	"%% tasks-nl-journal:next-project-steps:end %%",
	"",
	base,
].join("\n");
const migratedPercentMarkers = migrateLegacyDailyJournalBlocks(visiblePercentMarkers, true, true);
assert.doesNotMatch(migratedPercentMarkers, /%%\s*tasks-nl-journal:/u);
assert.doesNotMatch(migratedPercentMarkers, /dv\.list/u);
assert.match(migratedPercentMarkers, /tasksNlJournalBlock = "top-three"/u);
assert.match(migratedPercentMarkers, /tasksNlJournalBlock = "next-project-steps"/u);
assert.ok(migratedPercentMarkers.endsWith(base));
