import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderGroups } from "./WidgetRenderer";

export class ProjectsWidget implements WorkspaceWidget {
	id = "projects" as const;
	title = "Projecten";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderGroups(
			container,
			context.settings.projectDefinitions.map((item) => ({
				label: item.name,
				hashtag: item.hashtag,
				tasks: context.queries.withHashtag(context.tasks, item.hashtag),
			})),
			context
		);
	}
}
