# Changelog
### 0.9.0 final – Markdown source link correction

- Clicking a task row opens Edit task.
- Clicking the Markdown file icon now opens only the source note.
- Pointer, click, Enter and Space events no longer bubble to the task row.


## 0.9.0

- Kept task-title clicks opening Edit task and source icons opening the Markdown note.
- Added central refresh handling after vault-level task mutations.
- Open source-mode and reading-mode Markdown views now update immediately after completing a task in Workspace.
- Applied the same open-file refresh after editing a task from Workspace.
- Preserved cursor and scroll position while synchronising open editors.

## 0.8.9

- Restored the Review action button beside Settings in Workspace.
- Removed Review from the workspace navigation tiles while keeping the Review task section.
- Rounded the complete Workspace toolbar container.
- Reorganised stylesheet comments by component and removed release-number appendices.
- Updated project documentation for the current review workflow.

## 0.8.7

- Added duplicate review-file handling with three choices: stop, create an automatic copy, or enter a custom filename.
- Custom filenames are validated before creating the review note.

## 0.8.6

- Fixed review note creation when the configured folder already exists.
- Added safe support for nested review folders and file-path conflicts.

## 0.8.4

- Added a Review workspace category above Inbox.
- Review section is hidden when no review tasks are open.
- Added weekly and monthly review creation only.
- Added automatic review creation with a configurable weekday.
- Monthly review is created on the final selected weekday of the month.
- Added editable Markdown review templates with live preview.
- Added filename and vault-folder settings.
- Added duplicate-file choices: open, cancel, or create a copy.
- Review main tasks and active subtasks are marked and shown in Workspace.

## 0.8.3

- Templates create dedicated Markdown review notes.
- Added configurable Moment filename patterns and vault folders per template.
- Added `{{filename}}` support in template main tasks.
- Review tasks are inserted under the fixed Tasks section.
- Removed unused Workspace widget toggles from settings.


## 0.9.0

- Added task templates stored in plugin settings.
- Added editable Week review and Month review examples.
- Added custom template creation and deletion.
- Added a template button to Workspace and a command-palette action.
- Templates open in the normal task form before creation.
- Added `{{date}}`, `{{week}}`, and `{{month}}` variables.

## 0.8.0

## 0.8.1

- Limit the main task editor to two visible lines.
- Keep Waiting For and Someday tasks visible in date sections too.
- Apply a parent task's GTD status to its subtasks in workspace filtering.

- Open workspace tasks directly in the edit dialog.
- Keep task sequences visible in Waiting For and Someday.
- Show existing subtasks as compact single-line fields.
- Prepare clean open-source development package without dependencies.

## 0.7.6

### Added
- Date picker in the new-task and edit-task screens.
- One-day due-date shift in the edit-task screen.
- Sequential subtasks, stored as indented Markdown tasks.
- Workspace button to show only hidden tasks.

### Changed
- Task editing uses a multiline field.
- Subtasks are indented in the Workspace and appear one at a time.

### Fixed
- Completing a recurring task in the Workspace now creates its next occurrence.

## 0.7.5

### Changed
- Removed configurable metadata colours and coloured badges.
- Translated all user-facing screens and settings text to English.
- The New task command now loads and edits the task on the current Markdown line.
- Kept Dutch natural-language recognition for task input.

## 0.7.4

### Added
- Workspace setting for excluded tags outside Inbox and Today.
- Compact GTD labels `WF` and `SD` outside their own sections.

### Changed
- Sticky Workspace toolbar.
- Smaller single-line task rows.
- Project labels use configured abbreviations.
- Metadata uses fixed columns for project, person, GTD, priority, recurrence, source and date.

## 0.7.3

### Changed
- Workspace now shows Inbox, Today, This Week, 7+ Days, Waiting For and Someday together.
- Navigation buttons scroll to the matching section.
- Search and project filters apply to the complete Workspace.
- This Week and 7+ Days are flat chronological lists.
- Task rows use aligned columns for metadata, priority, recurrence, source and date.
- Waiting and Someday status tags are hidden inside their own sections.
- Workspace typography and spacing are larger and calmer.

### Fixed
- Existing Tasks date fields are removed from task titles and shown in the date column.
- Task titles no longer use ellipsis truncation.

## 0.7.2

### Changed
- Rebuilt Workspace task rows with fixed metadata columns and more compact spacing.
- The 7+ days view now uses one continuous date-sorted list instead of daily subgroups.
- Project filtering is visually more compact.

### Fixed
- Waiting now recognizes legacy tags such as `#wachtenop` and `#wachten-op`.
- Someday now recognizes legacy tags such as `#someday` and `#somedaymaybe`.
- Metadata badges stay grouped on the right side of each task row.

## 0.7.1

### Changed
- Replaced the widget grid with a compact Workspace based on GTD tabs, search and a project filter.
- Removed the persistent subtitle from the daily Workspace.
- Centered the Tasks NL branding in Settings.
- Rendered configured metadata as one compact badge instead of separate hashtag fragments.
- Added automatic Workspace refresh when Markdown files change.

## 0.7.0

### Added
- Configurable Tasks NL Workspace.
- Widgets for Today, This Week, Inbox, Waiting For, Projects, People, Priority and Recurring tasks.
- Workspace command and optional ribbon icon.
- Reusable TaskQueryService and Widget API.
- Click a task in the Workspace to open its source note.

### Changed
- Task parser now exposes recurrence metadata for Workspace widgets.
- Workspace settings are active instead of preparatory.

## 0.6.2

### Added
- Stable CodeMirror metadata decorations for Live Preview
- Tasks NL branding and subtitle
- Bedrijfsvoering in balans logo in About
- `CORE_COMPLETE.md`

### Changed
- Metadata styling now uses the same generated theme in Live Preview, Reading View and Tasks query results
- Preview priority labels are shown in Dutch
- Settings and task entry use consistent branding

### Fixed
- Metadata colors changing when the cursor enters or leaves a line

## 0.7.9

- Task modal moved higher and aligned through standard setting rows.
- Existing open subtasks can be edited in the task modal.
- Waiting and Someday task sequences remain visible in their workspace sections.
- Preview made more compact.
- Removed obsolete release folders and generated macOS/Git files from the distribution.

## 0.8.2

- Improved template picker layout.
- Added ISO week numbers to the built-in week review.
- Template tasks now default to today.
- Built-in reviews use explicit recurrence metadata.

## 0.8.5
- Fixed review note creation by using Obsidian moment API.
- Added filename sanitising and visible error notices.

## 0.8.8

- Improved duplicate review-note detection for case-insensitive and Unicode-normalized file systems.
- Removed the Review button from the Workspace header.
- Review tasks now appear only in the Review section.
