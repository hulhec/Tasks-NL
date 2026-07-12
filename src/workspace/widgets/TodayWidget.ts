import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class TodayWidget implements WorkspaceWidget {
	id = "today" as const;
	title = "Today";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderTaskList(container, context.queries.actual(context.tasks), context, "Today niets gepland.");
	}
}
