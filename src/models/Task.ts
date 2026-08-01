export type TaskPriority =
	| "highest"
	| "high"
	| "medium"
	| "normal"
	| "low"
	| "lowest";

export interface Task {
	id: string;
	titel: string;
	voltooid: boolean;
	prioriteit: TaskPriority;
	vervalDatum?: string;
	startDatum?: string;
	herhaling?: string;
	focusStatus?: 1 | 2 | 3;
	nextProjectTask?: boolean;
	hashtags: string[];
	bronBestand?: string;
	regelNummer?: number;
	inspringNiveau?: number;
	parentId?: string;
	verborgenDoorVolgorde?: boolean;
}
