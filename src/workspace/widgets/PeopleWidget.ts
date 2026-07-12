import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderGroups } from "./WidgetRenderer";

export class PeopleWidget implements WorkspaceWidget {
	id = "people" as const;
	title = "Personen";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		renderGroups(
			container,
			context.settings.personDefinitions.map((item) => ({
				label: `${item.firstName} ${item.lastName}`.trim(),
				hashtag: item.hashtag,
				tasks: context.queries.withHashtag(context.tasks, item.hashtag),
			})),
			context
		);
	}
}
