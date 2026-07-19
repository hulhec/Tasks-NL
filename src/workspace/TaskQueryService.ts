/**
 * TaskQueryService
 *
 * Purpose:
 * Provide reusable task selections for Workspace widgets.
 */

import { Task } from "../models/Task";

export class TaskQueryService {
	open(tasks: Task[]): Task[] {
		return tasks.filter((task) => !task.voltooid);
	}

	actual(tasks: Task[]): Task[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const tomorrowIso = this.toIsoDate(tomorrow);

		return tasks
			.filter(
				(task) =>
					!task.voltooid &&
					task.vervalDatum !== undefined &&
					task.vervalDatum <= tomorrowIso
			)
			.sort((a, b) =>
				(a.vervalDatum ?? "").localeCompare(
					b.vervalDatum ?? ""
				)
			);
	}

	thisWeek(tasks: Task[]): Task[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const startDate = new Date(today);
		startDate.setDate(startDate.getDate() + 2);

		const endDate = new Date(today);
		endDate.setDate(endDate.getDate() + 7);

		const startIso = this.toIsoDate(startDate);
		const endIso = this.toIsoDate(endDate);

		return tasks
			.filter(
				(task) =>
					!task.voltooid &&
					task.vervalDatum !== undefined &&
					task.vervalDatum >= startIso &&
					task.vervalDatum <= endIso
			)
			.sort((a, b) =>
				(a.vervalDatum ?? "").localeCompare(
					b.vervalDatum ?? ""
				)
			);
	}

	inbox(tasks: Task[], statusHashtags: string[] = []): Task[] {
		const excludedStatuses = new Set(
			statusHashtags.map((tag) => tag.toLocaleLowerCase("nl-NL"))
		);
		return this.sort(
			this.open(tasks).filter(
				(task) =>
					!task.vervalDatum &&
					!task.hashtags.some((tag) =>
						excludedStatuses.has(tag.toLocaleLowerCase("nl-NL"))
					)
			)
		);
	}

	withHashtag(tasks: Task[], hashtag: string): Task[] {
		const wanted = hashtag.toLocaleLowerCase("nl-NL");
		return this.sort(
			this.open(tasks).filter((task) =>
				task.hashtags.some(
					(tag) => tag.toLocaleLowerCase("nl-NL") === wanted
				)
			)
		);
	}

	withAnyHashtag(tasks: Task[], hashtags: string[]): Task[] {
		const wanted = new Set(
			hashtags.map((tag) => tag.toLocaleLowerCase("nl-NL"))
		);
		return this.sort(
			this.open(tasks).filter((task) =>
				task.hashtags.some((tag) =>
					wanted.has(tag.toLocaleLowerCase("nl-NL"))
				)
			)
		);
	}

	highPriority(tasks: Task[]): Task[] {
		return this.sort(
			this.open(tasks).filter((task) =>
				["highest", "high"].includes(task.prioriteit)
			)
		);
	}

	recurring(tasks: Task[]): Task[] {
		return this.sort(this.open(tasks).filter((task) => Boolean(task.herhaling)));
	}


	/**
	 * Sort hidden tasks by the excluded hashtag that caused them to be hidden.
	 * Hashtags are sorted alphabetically; tasks without a matching hashtag
	 * are placed last. The regular workspace order is used within each group.
	 */
	sortByExcludedHashtag(
		tasks: Task[],
		excludedHashtags: string[],
		getHashtags: (task: Task) => string[]
	): Task[] {
		const excluded = new Set(
			excludedHashtags.map((tag) => tag.toLocaleLowerCase("nl-NL"))
		);
		const regularOrder = new Map(
			this.sort(tasks).map((task, index) => [task.id, index])
		);
		const groupFor = (task: Task): string =>
			getHashtags(task)
				.map((tag) => tag.toLocaleLowerCase("nl-NL"))
				.filter((tag) => excluded.has(tag))
				.sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }))[0] ??
			"\uffff";

		return [...tasks].sort((a, b) => {
			const groupDifference = groupFor(a).localeCompare(
				groupFor(b),
				"nl",
				{ sensitivity: "base" }
			);
			if (groupDifference !== 0) return groupDifference;

			return (regularOrder.get(a.id) ?? 0) - (regularOrder.get(b.id) ?? 0);
		});
	}

	private sort(tasks: Task[]): Task[] {
		const priorityOrder = {
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
			if (dateA !== dateB) return dateA.localeCompare(dateB);
			return priorityOrder[a.prioriteit] - priorityOrder[b.prioriteit];
		});
	}

	private toIsoDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	private fromIsoDate(value: string): Date {
		const [year, month, day] = value.split("-").map(Number);
		return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
	}
}
