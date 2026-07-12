import { App } from "obsidian";
import { Task } from "../models/Task";
import { TasksNLSettings } from "../settings";
import { TaskQueryService } from "./TaskQueryService";

export interface WorkspaceWidgetContext {
	app: App;
	tasks: Task[];
	settings: TasksNLSettings;
	queries: TaskQueryService;
	openTask: (task: Task) => Promise<void>;
}

export interface WorkspaceWidget {
	id: keyof TasksNLSettings["workspaceWidgets"];
	title: string;
	render(container: HTMLElement, context: WorkspaceWidgetContext): void;
}
