**Language:** [English](README_manual_ENG.md) · [Nederlands](README_manual_nl.md)

<div align="center">
  <img src="image/tasks-nl-v1-banner.png" width="900" alt="Tasks NL: natural task capture and GTD Workspace for Obsidian">
</div>

# Tasks NL

Tasks NL lets you capture tasks in natural Dutch, stores them as standard Markdown tasks, and presents them in a GTD-oriented Workspace. The settings interface is available in **NL — Nederlands** and **ENG — English**.

## Highlights

- Natural-language capture for dates, priorities, recurrence, projects, people, and GTD terms.
- Standard Markdown task lines; your vault remains the source of truth.
- GTD Workspace with Inbox, current tasks, this week, later, Waiting For, Someday, and Review.
- Focus positions **1, 2, and 3**, plus one manually selected next-task flag per project; both controls stay compact on desktop, iPad, and phone.
- Up to two people per task, both visible in the Workspace.
- Optional start dates introduced only by configurable words such as `start op` and `vanaf`; Actuals includes tasks while their start-to-due period overlaps today/tomorrow.
- Simplified recurrence: choose `elke` or `om de`; arbitrary day, week, month, and year intervals map automatically to English Tasks `every` syntax.
- Automatic daily journal creation at startup or reload, with configurable folder, Moment filename format, properties, free Markdown, and optional focus 1–3 and next-project steps. Every newly created document opens immediately.
- Desktop, iPad, and phone layouts.

## Workspace

<img src="image/Workspace header.png" width="900" alt="Tasks NL Workspace header">

Tasks remain in their normal Workspace section. A focus value of 1, 2, or 3 can be assigned directly from the task row. Each number can be used by one task at a time, and no focus hashtag is added.

## Settings language

Choose **NL — Nederlands** or **ENG — English** at the top of **Settings → Community plugins → Tasks NL**. This translates the settings labels and explanations. Recognition phrases remain independently configurable.

<img src="image/i-general.png" width="900" alt="Tasks NL general settings">


## Synchronising settings

Tasks NL stores its settings in Obsidian’s standard plugin file:

```text
<Vault>/.obsidian/plugins/tasks-nl/data.json
```

When using Obsidian Sync, enable **community plugins** and **plugin settings** under **Settings → Sync → Vault configuration sync** on every device. After the first sync, fully quit and restart Obsidian, especially on iPhone and iPad. See the [Obsidian Sync settings guide](https://obsidian.md/help/sync/settings).

Tasks NL does not create a visible settings file in your notes structure.

## Configurable recurrence

Enter any comma-separated recurrence phrases, such as `elke, om de` or English alternatives. Tasks NL recognises every positive interval and writes standard `every` syntax automatically.

## Day, week, and month formats

At the top of Settings, **General** and **Day, week and month formats** are separate main tabs. The formats screen uses the order **Day**, **Week**, **Month** and groups each form into creation, file, and content sections with a live preview. Each format has a YAML properties field and Markdown template; properties are written or merged into a single frontmatter block. Both fields are saved while typing and remain persistent after further edits or reload. Both `{DATE}` and `{{DATE}}` syntax are supported for known template codes, while other braces and code blocks remain unchanged. A generated journal is never overwritten. The day journal defaults to `Kalender/Dagjournaal` and `dddd DD-MMM-YY` (for example `woensdag 05-aug-26.md`) and is checked once when Tasks NL starts or reloads. The focus 1–3 and next-project-step switches insert or remove live DataviewJS blocks in the Markdown template and update the preview immediately. Only tasks marked `#tasks-nl-review` appear in the Workspace Review section.

<img src="image/i-capture.png" width="900" alt="Tasks NL capture and recurrence settings">

## Projects and people

Project and person definitions map natural wording to hashtags. A task may contain at most two configured people; both are displayed in the Workspace.

<img src="image/i-projects.png" width="900" alt="Tasks NL project settings">

<img src="image/i-people.png" width="900" alt="Tasks NL people settings">

## Task capture and editing

<img src="image/new task.png" width="900" alt="Create a task with Tasks NL">

<img src="image/edit task.png" width="900" alt="Edit a task with Tasks NL">

## Installation

### Community Plugins

After publication, install Tasks NL from **Settings → Community plugins → Browse**.

### BRAT

Before publication, add the GitHub repository through BRAT and select the latest release.

### Manual installation

Copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<Vault>/.obsidian/plugins/tasks-nl/
```

Restart Obsidian, then enable **Tasks NL** under Community plugins.

## Documentation

- [English manual](README_manual_ENG.md)
- [Nederlandse handleiding](README_manual_nl.md)
- [Architecture](doc/Architecture.md)
- [Roadmap](doc/ROADMAP.md)
- [Contributing](assets/Contributing.md)

## Release files

A GitHub release for version `1.5.0` must contain these files as individual assets:

- `main.js`
- `manifest.json`
- `styles.css`

The GitHub tag must exactly match the version in `manifest.json`: `1.5.0`.

## Privacy and network use

Tasks NL reads and updates Markdown files in the active vault to provide its task features. The plugin does not require an external service and does not send vault content over the network.

## Compatibility

- Minimum Obsidian version: **1.8.7**
- Desktop and mobile: supported
- Tasks NL can operate independently and uses familiar task metadata syntax for compatibility with the Obsidian Tasks ecosystem.

## Support

Bug reports and feature requests are welcome through GitHub Issues.

## License

Tasks NL is released under the [MIT License](LICENSE).
