# Dagjournaal – focus 1, 2, 3

Plaats dit DataviewJS-codeblok in je dagelijkse notitie. Het toont open taken die in Tasks NL als focus 1, 2 of 3 zijn gemarkeerd.

```dataviewjs
const focusPattern = /<!--\s*tasks-nl-focus:([123])\s*-->/;
const taskPattern = /^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/;

const rows = [];
for (const page of dv.pages()) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  if (!file) continue;

  const content = await app.vault.cachedRead(file);
  content.split("\n").forEach((line, index) => {
    const task = line.match(taskPattern);
    const focus = line.match(focusPattern);
    if (!task || !focus || task[1].toLowerCase() === "x") return;

    const title = task[2]
      .replace(focusPattern, "")
      .replace(/📅\s+\d{4}-\d{2}-\d{2}/g, "")
      .replace(/[🔺⏫🔼🔽⏬]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    rows.push({
      focus: Number(focus[1]),
      title,
      path: page.file.path,
      line: index,
    });
  });
}

rows.sort((a, b) => a.focus - b.focus || a.title.localeCompare(b.title, "nl"));

const wrap = dv.el("div", "", { cls: "tasks-nl-journal-focus" });
for (const row of rows.slice(0, 3)) {
  const item = wrap.createDiv({ cls: `tasks-nl-journal-focus-item focus-${row.focus}` });
  item.createSpan({ cls: "tasks-nl-journal-focus-number", text: String(row.focus) });
  const link = item.createEl("a", { cls: "internal-link", text: row.title });
  link.href = row.path;
  link.dataset.href = row.path;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    app.workspace.openLinkText(row.path, "", false);
  });
}

if (rows.length === 0) {
  wrap.createDiv({ cls: "tasks-nl-journal-focus-empty", text: "Nog geen focustaken gekozen." });
}
```

Voeg de CSS uit `dagjournaal-focus.css` toe aan een CSS snippet in `.obsidian/snippets/` en schakel die in via **Weergave → CSS snippets**.
