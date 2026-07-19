import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class InboxWidget implements WorkspaceWidget {
	id = "inbox" as const;
	title = "Inbox";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		const statusHashtags = context.settings.gtdDefinitions
			.filter((item) => {
				const text = [item.label, ...item.synonyms].join(" ").toLocaleLowerCase("nl-NL");
				return /waiting|wachten|someday|ooit|misschien/u.test(text);
			})
			.map((item) => item.hashtag);
		renderTaskList(
			container,
			context.queries.inbox(context.tasks, statusHashtags),
			context,
			"Inbox is leeg."
		);
	}
}
