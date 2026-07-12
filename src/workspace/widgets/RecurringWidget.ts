import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class RecurringWidget implements WorkspaceWidget {
	id = "recurring" as const;
	title = "Herhalend";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderTaskList(container, context.queries.recurring(context.tasks), context, "Geen herhalende taken.");
	}
}
