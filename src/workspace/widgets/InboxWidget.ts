import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class InboxWidget implements WorkspaceWidget {
	id = "inbox" as const;
	title = "Inbox";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderTaskList(container, context.queries.inbox(context.tasks), context, "Inbox is leeg.");
	}
}
