import { WorkspaceWidget } from "./WorkspaceWidget";
import { InboxWidget } from "./widgets/InboxWidget";
import { PeopleWidget } from "./widgets/PeopleWidget";
import { PriorityWidget } from "./widgets/PriorityWidget";
import { ProjectsWidget } from "./widgets/ProjectsWidget";
import { RecurringWidget } from "./widgets/RecurringWidget";
import { ThisWeekWidget } from "./widgets/ThisWeekWidget";
import { TodayWidget } from "./widgets/TodayWidget";
import { WaitingForWidget } from "./widgets/WaitingForWidget";

export class WidgetRegistry {
	all(): WorkspaceWidget[] {
		return [
			new TodayWidget(),
			new ThisWeekWidget(),
			new InboxWidget(),
			new WaitingForWidget(),
			new ProjectsWidget(),
			new PeopleWidget(),
			new PriorityWidget(),
			new RecurringWidget(),
		];
	}
}
