import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class PriorityWidget implements WorkspaceWidget {
	id = "priority" as const;
	title = "Hoge prioriteit";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderTaskList(container, context.queries.highPriority(context.tasks), context, "Geen hoge prioriteiten.");
	}
}
