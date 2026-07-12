import { WorkspaceWidget, WorkspaceWidgetContext } from "../WorkspaceWidget";
import { renderTaskList } from "./WidgetRenderer";

export class WaitingForWidget implements WorkspaceWidget {
	id = "waitingFor" as const;
	title = "Waiting For";
	render(container: HTMLElement, context: WorkspaceWidgetContext): void {
		const hashtags = context.settings.gtdDefinitions
			.filter((item) => /waiting|wachten/iu.test(`${item.label} ${item.synonyms.join(" ")}`))
			.map((item) => item.hashtag);
		renderTaskList(container, context.queries.withAnyHashtag(context.tasks, hashtags), context, "Nergens op wachten.");
	}
}
