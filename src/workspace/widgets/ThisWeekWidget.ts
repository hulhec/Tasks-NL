import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class ThisWeekWidget implements WorkspaceWidget {
	id = "thisWeek" as const;
	title = "This week";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderTaskList(container, context.queries.thisWeek(context.tasks), context, "This week niets gepland.");
	}
}
