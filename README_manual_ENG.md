
<div align="center">
  <img src="image/logo_task_nl.png" width="150" alt="Task-NL logo">
</div>

# Tasks NL – English Manual

This manual describes Tasks NL version 0.9.0 for Obsidian. The plugin lets you enter tasks using natural Dutch language, stores them as regular Markdown tasks, and displays them in a GTD-oriented Workspace.

## 1. General workflow

Tasks NL uses your Markdown files as its source. A task therefore remains a normal Markdown line, for example:

```markdown
- [ ] Call Peter 📅 2026-07-13 🔥 high #Pweb
```

A typical workflow is:

1. Open **Create or edit task** from the Command Palette or the ribbon.
2. Enter the task in natural language.
3. Check the live preview when needed.
4. Save the task in the active file.
5. Use the Workspace to view tasks by status, date, project, or person.
6. Create a weekly or monthly review at regular intervals.

Tasks NL recognises dates, priorities, recurrence, projects, people, and GTD terms. The exact interpretation also depends on the definitions configured in the settings.

## 2. Settings

<img src="image/i-general.png" width="600">

Open **Settings → Community plugins → Tasks NL**. The settings screen is divided into several sections.

### General

**Default task title**

The default title used when no usable task title has been entered.

**Keep original task text**

Preserves the original input text alongside or inside the resulting task. Enable this option when you want to retain exactly what you typed.

**Keep completed recurring task**

Keeps the completed occurrence of a recurring task when the next occurrence is created. When disabled, the new open occurrence remains the main relevant task.

**Show ribbon icon**

Displays a Tasks NL button in Obsidian’s left ribbon.

**Show Workspace icon**

Displays a separate button for the Tasks NL Workspace in the left ribbon.

**Show status bar item**

Displays Tasks NL in Obsidian’s status bar.

### Capture

<img src="image/i-capture.png" width="600">

This section manages the dictionaries used to interpret natural-language input.

**GTD definitions**

<img src="image/i_GTDstatus.png" width="600">

Links a label and synonyms to a hashtag, for example Waiting For or Someday. Synonyms allow different phrases to produce the same classification.

**Project definitions**

<img src="image/i-projects.png" width="600">

Defines a project name, alias, and hashtag. A recognised project can therefore be stored as a consistent hashtag in the task.

**Person definitions**

<img src="image/i-people.png" width="600">

Defines a first name, last name, alias, and hashtag. This allows people to be recognised in natural-language input and used as filters in the Workspace.

Use unique aliases and hashtags to prevent ambiguous recognition.

### Reviews

Tasks NL includes templates for weekly and monthly reviews.

**Automatic creation**

Automatically creates the relevant review document on the selected weekday.

**Weekday**

Determines the day on which automatic reviews are created. For a monthly review, the last selected weekday of the month is used.

**Folder in vault**

The folder in which the review file is stored. Weekly and monthly reviews may use the same folder.

**Filename format**

Defines the filename using Moment-style formatting. Place literal text between square brackets.

**Main task**

The main task inserted into the review document. Use `{{FILENAME}}` to insert the generated filename.

**Subtasks, one per line**

The default subtasks for the review process. Each line becomes a separate Markdown subtask.

**Markdown template**

The full contents of the review note. You can include fixed text, headings, and placeholders.

### Preview

**Show live preview**

Shows how Tasks NL interprets the input and how it will be stored as Markdown. This is useful for checking date, priority, and hashtag recognition.

### Workspace

**Excluded tags**

<img src="image/i-exclude.png" width="600">

A comma-separated list of hashtags whose tasks are normally hidden, for example:

```text
#reminder, #birthday, #holiday-idea
```

The **Hidden** button in the Workspace displays these hidden tasks. In the included hotfix, tasks are grouped under headings based on the matching excluded hashtag. The hashtag headings are sorted alphabetically, and tasks inside each group use the normal Workspace sorting. Hidden review subtasks are not shown in this overview.

## 3. Creating a new task

<img src="image/new task.png" width="600">

Run **Tasks NL: Create or edit task** while the cursor is not positioned on an existing task.

1. Enter the task description in the input field.
2. Use natural-language terms for a date, priority, person, project, or recurrence.
3. Check **Preview** when live preview is enabled.
4. Select an explicit due date under **Due date** when required.
5. Add subtasks, one per line.
6. Confirm to insert the Markdown task into the active file.

Example:

```text
Call tomorrow Peter high new website
```

may be converted to:

```markdown
- [ ] Call Peter 📅 2026-07-13 🔥 high #Pweb
```

The exact output depends on your dictionaries and settings.

## 4. Editing a task

<img src="image/edit task.png" width="600">

Place the cursor on an existing Markdown task and run **Create or edit task**.

The dialog reads the existing task, including its title, date, priority, recurrence, hashtags, and any subtasks.

- Change the text or any explicit fields.
- Check the preview.
- Existing subtasks are displayed under **Existing subtasks**.
- Save to replace the original task line.

For tasks with a source file, Tasks NL opens or updates the task in that original Markdown file. Markdown remains the source of truth, so all changes remain readable without the plugin.

## 5. Workspace

<img src="image/Workspace header.png" width="600">

Run **Tasks NL: Open workspace** or use the Workspace ribbon icon.

### Top bar

The top bar contains:

- a button for creating a review;
- a button for opening the Tasks NL settings;
- navigation buttons for the main sections;
- a search field;
- a project filter;
- a person filter;
- the **Hidden** button.

### Sections

**Review**

Open review tasks containing the `#tasks-nl-review` hashtag.

**Inbox**

Open tasks without a due date and without hashtags. These are tasks that still need to be processed or classified.

**Actual**

Open tasks with a due date up to and including tomorrow.

**This week**

Open tasks from the day after tomorrow through the next seven days.

**7+ days**

Open tasks with a due date more than seven days in the future.

**Waiting For**

Tasks containing the configured GTD hashtag or a classification derived from it.

**Someday**

Tasks marked as Someday through the configured GTD definition.

A task may appear in more than one relevant section. For example, a dated task with Waiting For status may appear both in a date section and under Waiting For.

### Searching and filtering

The search field filters the displayed tasks. The project and person filters use the hashtags configured in the settings. The **Hidden** button switches the Workspace to hidden tasks only.

In Hidden mode:

1. tasks are grouped under the first matching excluded hashtag;
2. hashtag headings are sorted alphabetically;
3. tasks inside each heading use the standard date, priority, and title sorting;
4. tasks hidden only because of task order or structure appear under **Other hidden**;
5. hidden subtasks belonging to Review tasks are not displayed.

Click a task to open its source or edit it. Use the checkbox to complete a task.

## 6. Review and the review screen

Click the review icon in the Workspace or run **Tasks NL: Create task from template**.

The review screen displays the available review templates, including weekly and monthly reviews. After selecting a template, Tasks NL creates a new Markdown file with:

- the configured filename;
- the selected destination folder;
- the main task;
- the configured subtasks;
- the contents of the Markdown template;
- the tasks collected for the template.

Review tasks are marked with `#tasks-nl-review` and appear in the separate Review section of the Workspace. This keeps them separate from ordinary Inbox, date, and GTD tasks.

### Recommended review process

1. Create the review from a template.
2. Complete the review subtasks from top to bottom.
3. Process Inbox tasks.
4. Check overdue and upcoming tasks.
5. Review Waiting For and Someday.
6. Update projects and people.
7. Complete the main review task.

When excluded hashtags are used, hidden review subtasks remain outside the Hidden overview. This prevents internal review steps from cluttering that overview.

## 7. Available commands

Open Obsidian’s Command Palette with `Ctrl/Cmd + P` and search for “Tasks NL”.

### Tasks NL: Open workspace

Opens or activates the Tasks NL Workspace.

### Tasks NL: Create task from template

Opens the template picker for weekly reviews, monthly reviews, and other configured templates.

### Tasks NL: Create or edit task

Creates a new task or edits the task at the current cursor position.

[Enjoying this application? Buy me a coffee](https://buymeacoffee.com/joostvanderhulst)


---

## Inspiration

This plugin is inspired by the Obsidian Community Plugin **Tasks**.

Tasks NL can operate completely independently, but it can also be used alongside the Community Tasks plugin. It uses the same task syntax and icons to maximize compatibility.

Icons used (Tasks syntax):

- 📅 Due date
- ✅ Completion date
- 🔁 Recurrence
- 🏁 On completion (`delete` / `keep`)
- ⏫ ⏬ 🔼 Priority (when used)

This keeps Markdown files readable and compatible with both plugins.


## Acknowledgements

Tasks NL is inspired by the excellent **Tasks Community Plugin** for Obsidian.

Tasks NL is an independent project that can operate completely on its own and does not require the Tasks Community Plugin. At the same time, it is fully compatible with the Tasks task format and can also be used alongside the Tasks plugin without conflicts.

To maximize compatibility, Tasks NL uses the same task syntax and icons where applicable, including:

- 📅 Due Date
- ✅ Completion Date
- 🔁 Recurrence
- 🏁 On Completion (`delete` / `keep`)
- ⏫ High Priority
- 🔼 Medium Priority
- 🔽 Low Priority

This compatibility allows users to migrate between both plugins or use them together while keeping their Markdown task files fully compatible.

**Tasks** is an official Obsidian Community Plugin. All credit for the original task format, syntax and concepts belongs to the Tasks project and its contributors. Tasks NL is an independent project inspired by the Tasks plugin and designed to be compatible with its task format.

