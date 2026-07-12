# Tasks NL – Design Principles

**Project:** Tasks NL

**Status:** Active

**Version:** 0.1

**Last updated:** 2026-07-09


## 1. Markdown is the Source of Truth

Tasks NL does not use its own database.

All tasks are stored as plain Markdown lines in `.md` files.

---

## 2. One Task = One Line

Every task is stored on a single Markdown line.

Example:

```markdown
- [ ] Call Peter 📅 2026-07-10 🔥 high +CRM @Peter #quote
```

No additional metadata is stored on separate lines.

---

## 3. Tasks Can Live Anywhere

Tasks NL works with tasks located in any Markdown file within the vault.

Tasks do not need to be stored in a central task file.

---

## 4. No Query Language

Tasks NL does not introduce its own query language.

Searching, filtering and reporting are handled by the Dashboard.

---

## 5. Dashboard First

The Dashboard is the control center.

Tasks NL is the engine responsible for reading, interpreting and writing tasks.

---

## 6. GTD First

Tasks NL is based on the Getting Things Done (GTD) methodology.

Every task has exactly one status:

- Inbox
- Next Action
- Waiting For
- Scheduled
- Someday / Maybe
- Completed

---

## 7. One Internal Task Model

Tasks can be created through:

- Form-based input
- Natural language input

Both methods produce the same internal task model.

---

## 8. Natural Dutch First

Tasks NL is designed around natural Dutch language.

Examples include:

- vandaag
- morgen
- overmorgen
- maandag
- volgende week
- wachten op
- ooit / misschien

These expressions are interpreted and converted into standardized metadata.

---

## 9. No Vendor Lock-in

If Tasks NL is removed, all tasks remain readable and usable as standard Markdown.

---

## 10. Users Write Naturally

Users are free to write naturally.

Tasks NL extracts metadata and converts it into standardized Markdown.

Example:

Input

```text
morgen Peter bellen hoog CRM
```

Output

```markdown
- [ ] Peter bellen 📅 2026-07-10 🔥 high +CRM
```

---

## 11. A Task Has Exactly One Status

Status is not represented by tags.

Not:

```text
#inbox #waiting
```

Instead, every task has one explicit GTD status.

---

## 12. Existing Dashboards Remain Leading

Tasks NL is designed to integrate with existing dashboards and workflows rather than replacing them.

---

# Core Philosophy

> Write naturally. Store consistently.

Users should never need to learn a special syntax.

Tasks NL translates natural Dutch into standardized, future-proof Markdown.

## Workspace header

The sticky toolbar is one rounded visual container. Navigation contains six balanced buttons: Inbox, Actual, This week, 7+ days, Waiting and Someday. Review creation is an icon action beside Settings. The Review task section is rendered only when open review tasks exist.
