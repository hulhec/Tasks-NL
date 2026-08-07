import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

const MARKER = /\s*<!--\s*tasks-nl-(?:focus:[123]|project-next)\s*-->/gu;

function buildDecorations(view: EditorView): DecorationSet {
	const ranges: Array<{ from: number; to: number }> = [];
	for (const visible of view.visibleRanges) {
		const text = view.state.doc.sliceString(visible.from, visible.to);
		for (const match of text.matchAll(MARKER)) {
			if (match.index === undefined) continue;
			ranges.push({ from: visible.from + match.index, to: visible.from + match.index + match[0].length });
		}
	}
	ranges.sort((a, b) => a.from - b.from);
	const builder = new RangeSetBuilder<Decoration>();
	for (const range of ranges) builder.add(range.from, range.to, Decoration.replace({}));
	return builder.finish();
}

export const internalMarkerExtension = ViewPlugin.fromClass(class {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = buildDecorations(view);
	}

	update(update: ViewUpdate): void {
		if (update.docChanged || update.viewportChanged) this.decorations = buildDecorations(update.view);
	}
}, { decorations: (plugin) => plugin.decorations });
