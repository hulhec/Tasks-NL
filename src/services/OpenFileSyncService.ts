import { App, MarkdownView, TFile } from "obsidian";

/**
 * Refreshes every open Markdown view for a file after a vault-level mutation.
 * This keeps source mode and reading mode aligned with changes made in Workspace.
 */
export async function refreshOpenMarkdownViews(app: App, file: TFile): Promise<void> {
	const content = await app.vault.read(file);

	app.workspace.iterateAllLeaves((leaf) => {
		const view = leaf.view;
		if (!(view instanceof MarkdownView) || view.file?.path !== file.path) return;

		const editor = view.editor;
		if (editor.getValue() !== content) {
			const cursor = editor.getCursor();
			const scroll = editor.getScrollInfo();
			editor.setValue(content);

			const lastLine = Math.max(0, editor.lineCount() - 1);
			const line = Math.min(cursor.line, lastLine);
			const ch = Math.min(cursor.ch, editor.getLine(line).length);
			editor.setCursor({ line, ch });
			editor.scrollTo(scroll.left, scroll.top);
		}

		const refreshableView = view as MarkdownView & {
			previewMode?: { rerender(force?: boolean): void };
			requestUpdate?: () => void;
		};
		refreshableView.previewMode?.rerender(true);
		refreshableView.requestUpdate?.();
	});
}
