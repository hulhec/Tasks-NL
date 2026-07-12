/* eslint-disable obsidianmd/ui/sentence-case */
import {
	ItemView,
	Menu,
	Notice,
	setIcon,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import TasksNLPlugin from "../main";
import { Task } from "../models/Task";
import { TaskQueryService } from "./TaskQueryService";
import { refreshOpenMarkdownViews } from "../services/OpenFileSyncService";
import { normalizeWorkspaceExcludedTags } from "../settings";

export const TASKS_NL_WORKSPACE_VIEW = "tasks-nl-workspace";

type WorkspaceSectionId =
	| "review"
	| "inbox"
	| "today"
	| "week"
	| "later"
	| "waiting"
	| "someday"
	| `hidden-${string}`;

interface WorkspaceSection {
	id: WorkspaceSectionId;
	label: string;
	tasks: Task[];
}

interface MetadataDefinition {
	hashtag: string;
	label: string;
	type: "gtd" | "project" | "person";
}

const PRIORITY_EMOJI: Record<Task["prioriteit"], string> = {
	highest: "🔺",
	high: "⏫",
	medium: "🔼",
	normal: "",
	low: "🔽",
	lowest: "⏬",
};

export class TasksNLWorkspaceView extends ItemView {
	private readonly queries = new TaskQueryService();

	private loading = false;
	private searchText = "";
	private selectedProject = "";
	private selectedPerson = "";
	private showHiddenOnly = false;
	private allTasks: Task[] = [];
	private taskById = new Map<string, Task>();
	private refreshTimer?: number;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: TasksNLPlugin
	) {
		super(leaf);
	}

	getViewType(): string {
		return TASKS_NL_WORKSPACE_VIEW;
	}

	getDisplayText(): string {
		return "Tasks NL";
	}

	getIcon(): string {
		return "layout-list";
	}

	async onOpen(): Promise<void> {
		this.registerEvent(
			this.app.vault.on("create", () => this.scheduleRefresh())
		);

		this.registerEvent(
			this.app.vault.on("modify", () => this.scheduleRefresh())
		);

		this.registerEvent(
			this.app.vault.on("delete", () => this.scheduleRefresh())
		);

		this.registerEvent(
			this.app.vault.on("rename", () => this.scheduleRefresh())
		);

		await this.refresh();
	}

	async onClose(): Promise<void> {
		if (this.refreshTimer !== undefined) {
			window.clearTimeout(this.refreshTimer);
		}
	}

	async refresh(): Promise<void> {
		if (this.loading) {
			return;
		}

		this.loading = true;

		try {
			const allTasks = await this.plugin.repository.leesAlleTaken();
			this.render(allTasks);
		} catch (error) {
			console.error("Tasks NL Workspace refresh failed", error);
			new Notice("Tasks NL Workspace could not be loaded.");
		} finally {
			this.loading = false;
		}
	}

	private render(allTasks: Task[]): void {
		this.allTasks = allTasks;
		const container = this.contentEl;

		container.empty();
		container.addClass("tasks-nl-workspace");

		const toolbar = container.createDiv({
			cls: "tasks-nl-workspace-toolbar",
		});

		const sections = this.buildSections(allTasks);
		this.renderHeader(toolbar);
		this.renderNavigation(toolbar);
		this.renderSearchBar(toolbar, allTasks);

		this.renderSections(container, sections);
		this.renderFooter(container, allTasks, sections);
	}

	private renderHeader(container: HTMLElement): void {
		const header = container.createDiv({
			cls: "tasks-nl-workspace-header",
		});

		header.createEl("h4", {
			text: "Tasks NL",
		});

		const actions = header.createDiv({
			cls: "tasks-nl-workspace-actions",
		});

		const reviewButton = actions.createEl("button", {
			cls: "clickable-icon",
			attr: {
				type: "button",
				"aria-label": "Create review",
			},
		});

		setIcon(reviewButton, "layout-template");
		reviewButton.addEventListener("click", () => this.plugin.openTemplatePicker());

		const settingsButton = actions.createEl("button", {
			cls: "clickable-icon",
			attr: {
				type: "button",
				"aria-label": "Tasks NL settings",
			},
		});

		setIcon(settingsButton, "settings");

		settingsButton.addEventListener("click", () => this.plugin.openSettings());
	}

	private renderNavigation(container: HTMLElement): void {
		const bar = container.createDiv({
			cls: "tasks-nl-workspace-filterbar",
		});

		const sections: Array<[WorkspaceSectionId, string]> = [
			["inbox", "Inbox"],
			["today", "Actual"],
			["week", "This week"],
			["later", "7+ days"],
			["waiting", "Waiting"],
			["someday", "Someday"],
		];

		for (const [id, label] of sections) {
			const button = bar.createEl("button", {
				cls: "tasks-nl-workspace-tab",
				text: label,
				attr: {
					type: "button",
					"aria-label": `Go to ${label}`,
				},
			});

			button.addEventListener("click", () => {
				const section = this.contentEl.querySelector<HTMLElement>(
					`#tasks-nl-section-${id}`
				);

				section?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			});
		}
	}

	private renderSearchBar(container: HTMLElement, tasks: Task[]): void {
		const row = container.createDiv({
			cls: "tasks-nl-workspace-searchrow",
		});

		const search = row.createEl("input", {
			cls: `tasks-nl-workspace-search${this.searchText.trim() ? " is-active" : ""}`,
			attr: {
				type: "search",
				placeholder: "Search...",
				"aria-label": "Search tasks",
			},
		});

		search.value = this.searchText;

		search.addEventListener("input", () => {
			this.searchText = search.value;
			this.render(tasks);

			requestAnimationFrame(() => {
				const nextSearch =
					this.contentEl.querySelector<HTMLInputElement>(
						".tasks-nl-workspace-search"
					);

				nextSearch?.focus();
				nextSearch?.setSelectionRange(
					this.searchText.length,
					this.searchText.length
				);
			});
		});

		const projectButton = row.createEl("button", {
			cls: `tasks-nl-workspace-project-filter${this.selectedProject ? " is-active" : ""}`,
			attr: {
				type: "button",
				"aria-label": "Filter by project",
			},
		});

		projectButton.setText(
			this.selectedProject
				? `📁 ${this.getProjectLabel(this.selectedProject)}`
				: "Select a project"
		);

		projectButton.addEventListener("click", (event) => {
			this.showProjectMenu(event, tasks);
		});

		const personButton = row.createEl("button", {
			cls: `tasks-nl-workspace-person-filter${this.selectedPerson ? " is-active" : ""}`,
			attr: {
				type: "button",
				"aria-label": "Filter by person",
			},
		});

		personButton.setText(
			this.selectedPerson
				? `👤 ${this.getPersonLabel(this.selectedPerson)}`
				: "Select a person"
		);

		personButton.addEventListener("click", (event) => {
			this.showPersonMenu(event, tasks);
		});

		const hiddenButton = row.createEl("button", {
			cls: `tasks-nl-workspace-hidden-filter${this.showHiddenOnly ? " is-active" : ""}`,
			attr: {
				type: "button",
				"aria-label": "Show only hidden tasks",
				"aria-pressed": String(this.showHiddenOnly),
			},
		});
		setIcon(hiddenButton, "eye-off");
		hiddenButton.createSpan({ text: "Hidden" });
		hiddenButton.addEventListener("click", () => {
			this.showHiddenOnly = !this.showHiddenOnly;
			this.render(tasks);
		});
	}

	private showProjectMenu(event: MouseEvent, tasks: Task[]): void {
		const menu = new Menu();

		menu.addItem((item) =>
			item
				.setTitle("All projects")
				.setChecked(this.selectedProject === "")
				.onClick(() => {
					this.selectedProject = "";
					this.render(tasks);
				})
		);

		for (const project of this.plugin.settings.projectDefinitions) {
			const hashtag = this.normalizeHashtag(project.hashtag);

			menu.addItem((item) =>
				item
					.setTitle(project.name || project.alias || project.hashtag)
					.setChecked(this.selectedProject === hashtag)
					.onClick(() => {
						this.selectedProject = hashtag;
						this.render(tasks);
					})
			);
		}

		menu.showAtMouseEvent(event);
	}

	private showPersonMenu(event: MouseEvent, tasks: Task[]): void {
		const menu = new Menu();

		menu.addItem((item) =>
			item
				.setTitle("All people")
				.setChecked(this.selectedPerson === "")
				.onClick(() => {
					this.selectedPerson = "";
					this.render(tasks);
				})
		);

		for (const person of this.plugin.settings.personDefinitions) {
			const hashtag = this.normalizeHashtag(person.hashtag);

			const fullName = [
				person.firstName,
				person.lastName,
			]
				.filter(Boolean)
				.join(" ");

			menu.addItem((item) =>
				item
					.setTitle(
						fullName ||
						person.firstName ||
						person.alias ||
						person.hashtag.replace(/^#/u, "")
					)
					.setChecked(this.selectedPerson === hashtag)
					.onClick(() => {
						this.selectedPerson = hashtag;
						this.render(tasks);
					})
			);
		}

		menu.showAtMouseEvent(event);
	}

	private buildSections(tasks: Task[]): WorkspaceSection[] {
		this.taskById = new Map(tasks.map((task) => [task.id, task]));

		if (this.showHiddenOnly) {
			return this.buildHiddenSections(tasks);
		}

		const reviewTasks = this.reviewTasks(tasks);
		const nonReviewTasks = tasks.filter((task) => !this.isReviewTask(task));
		const openTasks = nonReviewTasks.filter((task) => !task.voltooid);

		const rawSections: WorkspaceSection[] = [
			{
				id: "review",
				label: "Review",
				tasks: reviewTasks,
			},
			{
				id: "inbox",
				label: "Inbox",
				tasks: this.queries.inbox(nonReviewTasks),
			},
			{
				id: "today",
				label: "Actual",
				tasks: this.queries.actual(nonReviewTasks),
			},
			{
				id: "week",
				label: "This week",
				tasks: this.queries.thisWeek(nonReviewTasks),
			},
			{
				id: "later",
				label: "7+ days",
				tasks: this.afterSevenDays(openTasks),
			},
			{
				id: "waiting",
				label: "Waiting For",
				tasks: this.tasksForGtdSection(nonReviewTasks, "waiting"),
			},
			{
				id: "someday",
				label: "Someday",
				tasks: this.tasksForGtdSection(nonReviewTasks, "someday"),
			},
		];

		return rawSections.map((section) => ({
			...section,
			tasks: this.applyGlobalFilters(section.tasks, section.id),
		}));
	}


	private buildHiddenSections(tasks: Task[]): WorkspaceSection[] {
		const excludedTags = normalizeWorkspaceExcludedTags(
			this.plugin.settings.workspaceExcludedTags
		);
		const gtdStatusTags = new Set([
			...this.gtdHashtags("waiting"),
			...this.gtdHashtags("someday"),
		]);
		const groupingTags = excludedTags
			.filter((tag) => !gtdStatusTags.has(tag))
			.sort((a, b) =>
				a.localeCompare(b, "en", { sensitivity: "base" })
			);
		const excluded = new Set(groupingTags);

		let hiddenTasks = tasks.filter((task) => {
			if (task.voltooid) return false;

			// Review subtasks inherit #tasks-nl-review from their parent and
			// must never be shown in the Hidden overview.
			if (task.parentId && this.isReviewTask(task)) return false;

			return (
				Boolean(task.verborgenDoorVolgorde) ||
				this.effectiveHashtags(task).some((tag) =>
					excluded.has(this.normalizeHashtag(tag))
				)
			);
		});

		if (this.selectedProject) {
			hiddenTasks = hiddenTasks.filter((task) =>
				task.hashtags.some(
					(tag) =>
						this.normalizeHashtag(tag) ===
						this.selectedProject
				)
			);
		}

		if (this.selectedPerson) {
			hiddenTasks = hiddenTasks.filter((task) =>
				task.hashtags.some(
					(tag) =>
						this.normalizeHashtag(tag) ===
						this.selectedPerson
				)
			);
		}

		const query = this.searchText
			.trim()
			.toLocaleLowerCase("nl-NL");

		if (query) {
			hiddenTasks = hiddenTasks.filter((task) => {
				const haystack = [
					task.titel,
					task.bronBestand ?? "",
					...task.hashtags,
				]
					.join(" ")
					.toLocaleLowerCase("nl-NL");

				return haystack.includes(query);
			});
		}

		const assigned = new Set<string>();
		const sections: WorkspaceSection[] = [];

		for (const excludedTag of groupingTags) {
			const sectionTasks = hiddenTasks.filter((task) => {
				if (assigned.has(task.id)) return false;

				const effective = new Set(
					this.effectiveHashtags(task).map((tag) =>
						this.normalizeHashtag(tag)
					)
				);

				return effective.has(excludedTag);
			});

			if (sectionTasks.length === 0) continue;
			for (const task of sectionTasks) assigned.add(task.id);

			sections.push({
				id: `hidden-${excludedTag.replace(/^#/u, "")}`,
				label: excludedTag,
				tasks: this.sortWorkspaceTasks(sectionTasks),
			});
		}

		const otherHidden = hiddenTasks.filter(
			(task) => !assigned.has(task.id)
		);

		if (otherHidden.length > 0) {
			sections.push({
				id: "hidden-other",
				label: "Other hidden",
				tasks: this.sortWorkspaceTasks(otherHidden),
			});
		}

		return sections;
	}

	private reviewTasks(tasks: Task[]): Task[] {
		return tasks.filter((task) => !task.voltooid && this.isReviewTask(task));
	}

	private isReviewTask(task: Task): boolean {
		return this.effectiveHashtags(task).some(
			(tag) => this.normalizeHashtag(tag) === "#tasks-nl-review"
		);
	}

	private tasksForGtdSection(tasks: Task[], kind: "waiting" | "someday"): Task[] {
		const wanted = new Set(this.gtdHashtags(kind));
		const byId = new Map(tasks.map((task) => [task.id, task]));
		const rootFor = (task: Task): Task => {
			let current = task;
			const seen = new Set<string>();
			while (current.parentId && !seen.has(current.id)) {
				seen.add(current.id);
				const parent = byId.get(current.parentId);
				if (!parent) break;
				current = parent;
			}
			return current;
		};
		return tasks.filter((task) => {
			if (task.voltooid) return false;
			const root = rootFor(task);
			return [...task.hashtags, ...root.hashtags].some((tag) => wanted.has(this.normalizeHashtag(tag)));
		});
	}

	private applyGlobalFilters(
		tasks: Task[],
		sectionId: WorkspaceSectionId
	): Task[] {
		let filtered = tasks;

		const excludedTags = normalizeWorkspaceExcludedTags(
			this.plugin.settings.workspaceExcludedTags
		);
		const excluded = new Set(excludedTags);
		const gtdStatusTags = new Set([
			...this.gtdHashtags("waiting"),
			...this.gtdHashtags("someday"),
		]);
		const isHidden = (task: Task): boolean =>
			Boolean(task.verborgenDoorVolgorde) ||
			this.effectiveHashtags(task).some((tag) => {
				const normalized = this.normalizeHashtag(tag);
				// GTD status tags classify a task; they must not hide it from
				// date sections such as Actual or This week. A task may appear
				// in both its date section and Waiting For/Someday.
				return excluded.has(normalized) && !gtdStatusTags.has(normalized);
			});

		if (this.showHiddenOnly) {
			filtered = filtered
				.filter(isHidden)
				// Review subtasks inherit #tasks-nl-review from their parent.
				// They must not appear when the Hidden filter is enabled.
				.filter(
					(task) =>
						!(Boolean(task.parentId) && this.isReviewTask(task))
				);
		} else {
			filtered = filtered.filter((task) => !isHidden(task));
		}

		if (this.selectedProject) {
			filtered = filtered.filter((task) =>
				task.hashtags.some(
					(tag) =>
						this.normalizeHashtag(tag) ===
						this.selectedProject
				)
			);
		}

		if (this.selectedPerson) {
			filtered = filtered.filter((task) =>
				task.hashtags.some(
					(tag) =>
						this.normalizeHashtag(tag) ===
						this.selectedPerson
				)
			);
		}

		const query = this.searchText
			.trim()
			.toLocaleLowerCase("nl-NL");

		if (query) {
			filtered = filtered.filter((task) => {
				const haystack = [
					task.titel,
					task.bronBestand ?? "",
					...task.hashtags,
				]
					.join(" ")
					.toLocaleLowerCase("nl-NL");

				return haystack.includes(query);
			});
		}

		if (this.showHiddenOnly) {
			// Do not call withVisibleParents here: that could add review parents
			// back to the Hidden result after their subtasks were removed.
			return this.queries.sortByExcludedHashtag(
				filtered,
				excludedTags,
				(task) => this.effectiveHashtags(task)
			);
		}

		return this.withVisibleParents(this.sortWorkspaceTasks(filtered));
	}

	private withVisibleParents(tasks: Task[]): Task[] {
		const taskById = new Map(this.allTasks.map((task) => [task.id, task]));
		const parentIds = new Set(
			tasks.map((task) => task.parentId).filter((id): id is string => Boolean(id))
		);
		const result: Task[] = [];
		const added = new Set<string>();

		for (const task of tasks) {
			if (parentIds.has(task.id)) continue;

			if (task.parentId) {
				const parent = taskById.get(task.parentId);
				if (parent && !parent.voltooid && !added.has(parent.id)) {
					result.push(parent);
					added.add(parent.id);
				}
			}

			if (!added.has(task.id)) {
				result.push(task);
				added.add(task.id);
			}
		}

		return result;
	}

	private sortWorkspaceTasks(tasks: Task[]): Task[] {
		const priorityOrder: Record<Task["prioriteit"], number> = {
			highest: 0,
			high: 1,
			medium: 2,
			normal: 3,
			low: 4,
			lowest: 5,
		};

		return [...tasks].sort((a, b) => {
			const dateA = a.vervalDatum ?? "9999-12-31";
			const dateB = b.vervalDatum ?? "9999-12-31";

			if (dateA !== dateB) {
				return dateA.localeCompare(dateB);
			}

			const priorityDifference =
				priorityOrder[a.prioriteit] - priorityOrder[b.prioriteit];

			if (priorityDifference !== 0) {
				return priorityDifference;
			}

			return (a.titel || "Task").localeCompare(
				b.titel || "Task",
				"en",
				{ sensitivity: "base" }
			);
		});
	}

	private renderSections(
		container: HTMLElement,
		sections: WorkspaceSection[]
	): void {
		const list = container.createDiv({
			cls: "tasks-nl-workspace-list",
		});

		for (const section of sections) {
			if (section.id === "review" && section.tasks.length === 0) continue;
			this.renderSection(list, section);
		}
	}

	private renderSection(
		container: HTMLElement,
		sectionData: WorkspaceSection
	): void {
		const section = container.createEl("section", {
			cls: "tasks-nl-workspace-section",
			attr: {
				id: `tasks-nl-section-${sectionData.id}`,
			},
		});

		const heading = section.createDiv({
			cls: "tasks-nl-workspace-section-header",
		});

		heading.createEl("h3", {
			text: sectionData.label,
		});

		heading.createSpan({
			cls: "tasks-nl-workspace-section-count",
			text: String(sectionData.tasks.length),
		});

		const rows = section.createDiv({
			cls: "tasks-nl-workspace-taskrows",
		});

		if (sectionData.tasks.length === 0) {
			rows.createDiv({
				cls: "tasks-nl-workspace-section-empty",
				text: "No tasks",
			});

			return;
		}

		for (const task of sectionData.tasks) {
			this.renderTaskRow(rows, task, sectionData.id);
		}
	}

	private renderTaskRow(
		container: HTMLElement,
		task: Task,
		sectionId: WorkspaceSectionId
	): void {
		const row = container.createEl("button", {
			cls: `tasks-nl-workspace-taskrow${task.parentId ? " is-subtask" : ""}`,
			attr: {
				type: "button",
				"aria-label": `Open ${task.titel || "Task"}`,
			},
		});
		//checkbox
		const checkbox = row.createSpan({
			cls: "tasks-nl-workspace-checkbox",
			attr: {
				role: "checkbox",
				tabindex: "0",
				"aria-checked": "false",
				"aria-label": `Complete ${task.titel || "Task"}`,
			},
		});

		checkbox.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();

			void this.completeTask(task);
		});

		checkbox.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			void this.completeTask(task);
		});
		//task title
		row.createSpan({
			cls: "tasks-nl-workspace-task-title",
			text: task.titel || "Task",
		});

		const definitions = task.hashtags
			.filter(
				(hashtag) =>
					!this.shouldHideSectionTag(hashtag, sectionId)
			)
			.map((hashtag) => ({
				hashtag,
				definition: this.getMetadataDefinition(hashtag),
			}));

		const priority = row.createSpan({
			cls: "tasks-nl-workspace-priority",
			text: PRIORITY_EMOJI[task.prioriteit],
		});

		priority.setAttribute(
			"aria-label",
			task.prioriteit === "normal"
				? "Normal priority"
				: `Priority ${task.prioriteit}`
		);
		// Recurring picture
		row.createSpan({
			cls: "tasks-nl-workspace-recurring",
			text: task.herhaling ? "🔁" : "",
			attr: task.herhaling
				? {
					title: task.herhaling,
				}
				: {},
		});

		const source = row.createSpan({
			cls: "tasks-nl-workspace-source",
		});

		if (task.bronBestand) {
			setIcon(source, "file-text");
			source.setAttribute("title", task.bronBestand);
			source.setAttribute("role", "button");
			source.setAttribute("tabindex", "0");
			source.setAttribute("aria-label", `Open Markdown file ${task.bronBestand}`);

			const openSource = (event: Event): void => {
				event.preventDefault();
				event.stopPropagation();
				if ("stopImmediatePropagation" in event) {
					event.stopImmediatePropagation();
				}
				void this.openSourceFile(task);
			};

			source.addEventListener("pointerdown", (event) => {
				event.stopPropagation();
			});
			source.addEventListener("click", openSource);
			source.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					openSource(event);
				}
			});
		}
		//Project
		this.renderMetadataColumn(
			row,
			definitions.filter(
				(item) => item.definition?.type === "project"
			),
			"tasks-nl-workspace-project"
		);
		//Person
		this.renderMetadataColumn(
			row,
			definitions.filter(
				(item) => item.definition?.type === "person"
			),
			"tasks-nl-workspace-person"
		);
		//GTD
		this.renderMetadataColumn(
			row,
			definitions.filter(
				(item) => item.definition?.type === "gtd"
			),
			"tasks-nl-workspace-gtd",
			sectionId
		);
		//Date
		row.createSpan({
			cls: "tasks-nl-workspace-date",
			text: task.vervalDatum
				? this.formatCompactDate(task.vervalDatum)
				: "",
		});

		row.addEventListener("click", () => {
			void this.openTask(task);
		});
	}

	private renderMetadataColumn(
		row: HTMLElement,
		items: Array<{
			hashtag: string;
			definition?: MetadataDefinition;
		}>,
		className: string,
		sectionId?: WorkspaceSectionId
	): void {
		const column = row.createSpan({
			cls: `tasks-nl-workspace-meta-column ${className}`,
		});

		for (const item of items.slice(0, 1)) {
			const definition = item.definition;

			let label =
				definition?.label ??
				item.hashtag.replace(/^#/u, "");

			if (definition?.type === "gtd") {
				const normalized = this.normalizeHashtag(item.hashtag);

				if (this.gtdHashtags("waiting").includes(normalized)) {
					label = sectionId === "waiting" ? "" : "Wait";
				} else if (
					this.gtdHashtags("someday").includes(normalized)
				) {
					label = sectionId === "someday" ? "" : "Maybe";
				} else {
					label = definition.label
						.split(/\s+/u)
						.map((word: string) =>
							word.charAt(0).toUpperCase()
						)
						.join("");
				}
			}

			if (!label) {
				continue;
			}

			column.createSpan({
				cls: "tasks-nl-workspace-badge",
				text: label,
			});
		}
	}
	private shouldHideSectionTag(
		hashtag: string,
		sectionId: WorkspaceSectionId
	): boolean {
		const normalized = this.normalizeHashtag(hashtag);

		if (
			sectionId === "waiting" &&
			this.gtdHashtags("waiting").includes(normalized)
		) {
			return true;
		}

		if (
			sectionId === "someday" &&
			this.gtdHashtags("someday").includes(normalized)
		) {
			return true;
		}

		return false;
	}

	private renderFooter(
		container: HTMLElement,
		allTasks: Task[],
		sections: WorkspaceSection[]
	): void {
		const openCount = allTasks.filter(
			(task) => !task.voltooid
		).length;

		const visibleTaskIds = new Set(
			sections.flatMap((section) =>
				section.tasks.map((task) => task.id)
			)
		);

		container.createDiv({
			cls: "tasks-nl-workspace-footer",
			text:
				`${visibleTaskIds.size} unique tasks shown · ` +
				`${openCount} open tasks`,
		});
	}

	private scheduleRefresh(): void {
		if (this.refreshTimer !== undefined) {
			window.clearTimeout(this.refreshTimer);
		}

		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = undefined;
			void this.refresh();
		}, 250);
	}

	private afterSevenDays(tasks: Task[]): Task[] {
		const threshold = new Date();
		threshold.setHours(0, 0, 0, 0);
		threshold.setDate(threshold.getDate() + 8);

		const iso = this.toIsoDate(threshold);

		return [...tasks]
			.filter(
				(task) =>
					task.vervalDatum !== undefined &&
					task.vervalDatum >= iso
			)
			.sort((a, b) =>
				(a.vervalDatum ?? "").localeCompare(
					b.vervalDatum ?? ""
				)
			);
	}

	private gtdHashtags(kind: "waiting" | "someday"): string[] {
		const searchTerms =
			kind === "waiting"
				? ["waiting", "wachten", "pauze"]
				: ["someday", "maybe", "ooit", "misschien"];

		const configured = this.plugin.settings.gtdDefinitions
			.filter((definition) => {
				const text = [
					definition.label,
					definition.hashtag,
					...definition.synonyms,
				]
					.join(" ")
					.toLocaleLowerCase("nl-NL");

				return searchTerms.some((term) =>
					text.includes(term)
				);
			})
			.map((definition) => definition.hashtag);

		const legacy =
			kind === "waiting"
				? [
					"#waiting-for",
					"#waiting",
					"#wachtenop",
					"#wachten-op",
				]
				: [
					"#someday-maybe",
					"#someday",
					"#somedaymaybe",
				];

		return Array.from(
			new Set(
				[...configured, ...legacy].map((tag) =>
					this.normalizeHashtag(tag)
				)
			)
		);
	}

	private effectiveHashtags(task: Task): string[] {
		const hashtags = new Set(task.hashtags);
		let current = task;
		const seen = new Set<string>();
		while (current.parentId && !seen.has(current.id)) {
			seen.add(current.id);
			const parent = this.taskById.get(current.parentId);
			if (!parent) break;
			for (const hashtag of parent.hashtags) hashtags.add(hashtag);
			current = parent;
		}
		return [...hashtags];
	}

	private getMetadataDefinition(
		hashtag: string
	): MetadataDefinition | undefined {
		const wanted = this.normalizeHashtag(hashtag);
		const wantedWithoutHash = wanted.replace(/^#/u, "");

		// GTD
		for (const definition of this.plugin.settings.gtdDefinitions) {
			const candidates = [
				definition.hashtag,
				definition.label,
				...definition.synonyms,
			]
				.filter(Boolean)
				.map((value) => this.normalizeHashtag(value));

			if (candidates.includes(wanted)) {
				return {
					hashtag: wanted,
					label: definition.label,
					type: "gtd",
				};
			}
		}

		// Projects
		for (const definition of this.plugin.settings.projectDefinitions) {
			const projectCandidates = [
				definition.hashtag,
				definition.alias,
				definition.name,
			]
				.filter(Boolean)
				.map((value) =>
					this.normalizeHashtag(String(value))
				);

			const configuredHashtag = this
				.normalizeHashtag(definition.hashtag)
				.replace(/^#/u, "");

			if (
				projectCandidates.includes(wanted) ||
				configuredHashtag === wantedWithoutHash
			) {
				return {
					hashtag: wanted,
					label:
						definition.alias ||
						definition.name ||
						hashtag.replace(/^#/u, ""),
					type: "project",
				};
			}
		}

		// People
		for (const definition of this.plugin.settings.personDefinitions) {
			const fullName = [
				definition.firstName,
				definition.lastName,
			]
				.filter(Boolean)
				.join(" ");

			const personCandidates = [
				definition.hashtag,
				definition.alias,
				definition.firstName,
				definition.lastName,
				fullName,
			]
				.filter(Boolean)
				.map((value) =>
					this.normalizeHashtag(String(value))
				);

			if (personCandidates.includes(wanted)) {
				return {
					hashtag: wanted,
					label:
						definition.alias ||
						definition.firstName ||
						hashtag.replace(/^#/u, ""),
					type: "person",
				};
			}
		}

		return undefined;
	}

	private getProjectLabel(hashtag: string): string {
		const definition =
			this.plugin.settings.projectDefinitions.find(
				(project) =>
					this.normalizeHashtag(project.hashtag) ===
					hashtag
			);

		return (
			definition?.alias ||
			definition?.name ||
			hashtag.replace(/^#/u, "")
		);
	}

	private getPersonLabel(hashtag: string): string {
		const definition =
			this.plugin.settings.personDefinitions.find(
				(person) =>
					this.normalizeHashtag(person.hashtag) ===
					hashtag
			);

		const fullName = definition
			? [
				definition.firstName,
				definition.lastName,
			]
				.filter(Boolean)
				.join(" ")
			: "";

		return (
			definition?.firstName ||
			definition?.alias ||
			hashtag.replace(/^#/u, "")
		);
	}

	private normalizeHashtag(value: string): string {
		const normalized = value
			.trim()
			.toLocaleLowerCase("nl-NL");

		return normalized.startsWith("#")
			? normalized
			: `#${normalized}`;
	}

	private formatCompactDate(value: string): string {
		const date = this.fromIsoDate(value);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.getTime() === today.getTime()) {
			return "Today";
		}

		if (date.getTime() === tomorrow.getTime()) {
			return "Tomorrow";
		}

		return new Intl.DateTimeFormat("en-GB", {
			weekday: "short",
			day: "2-digit",
			month: "2-digit",
		}).format(date);
	}

	private fromIsoDate(value: string): Date {
		const [year, month, day] = value
			.split("-")
			.map(Number);

		return new Date(
			year ?? 0,
			(month ?? 1) - 1,
			day ?? 1
		);
	}

	private toIsoDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(
			2,
			"0"
		);
		const day = String(date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	}

	private async completeTask(task: Task): Promise<void> {
		if (
			!task.bronBestand ||
			task.regelNummer === undefined
		) {
			new Notice(
				"The source line for this task could not be found."
			);
			return;
		}

		const file =
			this.app.vault.getAbstractFileByPath(
				task.bronBestand
			);

		if (!(file instanceof TFile)) {
			new Notice(
				"The source file for this task could not be found."
			);
			return;
		}

		try {
			let changed = false;

			await this.app.vault.process(file, (content) => {
				const lines = content.split("\n");
				const currentLine = lines[task.regelNummer!];

				if (currentLine === undefined) {
					return content;
				}

				const completedLine = currentLine.replace(
					/^(\s*[-*+]\s+\[)\s(\])/u,
					"$1x$2"
				);

				if (completedLine === currentLine) {
					return content;
				}

				if (!task.parentId) {
					this.completeDescendants(lines, task.regelNummer!);
				}

				if (task.herhaling && task.vervalDatum) {
					const nextDate = this.nextRecurringDate(task.vervalDatum, task.herhaling);
					const nextLine = currentLine
						.replace(/^(\s*[-*+]\s+\[)[ xX](\])/u, "$1 $2")
						.replace(/📅\s+\d{4}-\d{2}-\d{2}/u, `📅 ${nextDate}`);

					if (/🏁\s+delete/u.test(currentLine)) {
						lines[task.regelNummer!] = nextLine;
					} else {
						lines[task.regelNummer!] = completedLine;
						lines.splice(task.regelNummer! + 1, 0, nextLine);
					}
				} else {
					lines[task.regelNummer!] = completedLine;
				}

				if (task.parentId) {
					this.completeFinishedAncestors(lines, task.regelNummer!);
				}
				changed = true;

				return lines.join("\n");
			});

			if (!changed) {
				new Notice(
					"This task could not be completed automatically."
				);
				return;
			}

			await refreshOpenMarkdownViews(this.app, file);
			await this.refresh();
		} catch (error) {
			console.error(
				"Tasks NL could not complete task",
				error
			);

			new Notice(
				"The task could not be completed."
			);
		}
	}

	private completeDescendants(lines: string[], parentLine: number): void {
		const getIndent = (line: string): number =>
			(line.match(/^(\s*)/u)?.[1] ?? "").replace(/\t/gu, "    ").length;
		const taskPattern = /^(\s*[-*+]\s+\[)[ xX](\])\s+/u;
		const parentIndent = getIndent(lines[parentLine] ?? "");

		for (let index = parentLine + 1; index < lines.length; index += 1) {
			const line = lines[index] ?? "";
			const indent = getIndent(line);
			if (taskPattern.test(line) && indent <= parentIndent) break;
			if (taskPattern.test(line) && indent > parentIndent) {
				lines[index] = line.replace(taskPattern, "$1x$2 ");
			}
		}
	}

	private completeFinishedAncestors(lines: string[], childLine: number): void {
		const getIndent = (line: string): number =>
			(line.match(/^(\s*)/u)?.[1] ?? "").replace(/\t/gu, "    ").length;
		const taskPattern = /^\s*[-*+]\s+\[([ xX])\]\s+/u;
		let currentLine = childLine;

		while (currentLine > 0) {
			const currentIndent = getIndent(lines[currentLine] ?? "");
			let parentLine = -1;

			for (let index = currentLine - 1; index >= 0; index -= 1) {
				const line = lines[index] ?? "";
				if (taskPattern.test(line) && getIndent(line) < currentIndent) {
					parentLine = index;
					break;
				}
			}

			if (parentLine < 0) return;
			const parentIndent = getIndent(lines[parentLine] ?? "");
			const descendants: Array<{ indent: number; completed: boolean }> = [];

			for (let index = parentLine + 1; index < lines.length; index += 1) {
				const line = lines[index] ?? "";
				const indent = getIndent(line);
				if (taskPattern.test(line) && indent <= parentIndent) break;
				const match = line.match(taskPattern);
				if (match && indent > parentIndent) {
					descendants.push({
						indent,
						completed: match[1]?.toLowerCase() === "x",
					});
				}
			}

			const directIndent = Math.min(...descendants.map((item) => item.indent));
			const directChildren = descendants.filter((item) => item.indent === directIndent);
			const hasDirectChild = directChildren.length > 0;
			const allDirectChildrenCompleted = directChildren.every((item) => item.completed);

			if (!hasDirectChild || !allDirectChildrenCompleted) return;
			lines[parentLine] = (lines[parentLine] ?? "").replace(
				/^(\s*[-*+]\s+\[)[ xX](\])/u,
				"$1x$2"
			);
			currentLine = parentLine;
		}
	}

	private nextRecurringDate(current: string, recurrence: string): string {
		const date = this.fromIsoDate(current);
		const normalized = recurrence.toLocaleLowerCase("en-US");
		const interval = normalized.match(/every\s+(?:(\d+)\s+)?(day|week|month|year)s?/u);

		if (normalized.includes(" on ")) {
			const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
			const wanted = weekdays.findIndex((day) => normalized.includes(day));
			if (wanted >= 0) {
				let difference = wanted - date.getDay();
				if (difference <= 0) difference += 7;
				date.setDate(date.getDate() + difference);
				return this.toIsoDate(date);
			}
		}

		const every = Number(interval?.[1] ?? 1);
		switch (interval?.[2]) {
			case "day": date.setDate(date.getDate() + every); break;
			case "week": date.setDate(date.getDate() + every * 7); break;
			case "month": date.setMonth(date.getMonth() + every); break;
			case "year": date.setFullYear(date.getFullYear() + every); break;
			default: date.setDate(date.getDate() + 1);
		}
		return this.toIsoDate(date);
	}

	private async openSourceFile(task: Task): Promise<void> {
		if (!task.bronBestand) {
			return;
		}

		const abstractFile = this.app.vault.getAbstractFileByPath(task.bronBestand);
		if (!(abstractFile instanceof TFile)) {
			new Notice(`Markdown file not found: ${task.bronBestand}`);
			return;
		}

		const leaf = this.app.workspace.getLeaf("tab");
		await leaf.openFile(abstractFile, { active: true });

		if (typeof task.regelNummer === "number") {
			this.app.workspace.trigger("editor:focus-line", {
				file: abstractFile,
				line: Math.max(0, task.regelNummer),
			});
		}
	}

	private async openTask(task: Task): Promise<void> {
		await this.plugin.openTaskModalForTask(task);
	}
}