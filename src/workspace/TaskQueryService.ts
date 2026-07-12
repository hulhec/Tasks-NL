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

	inbox(tasks: Task[]): Task[] {
		return this.sort(
			this.open(tasks).filter(
				(task) => !task.vervalDatum && task.hashtags.length === 0
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
