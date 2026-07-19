# Tasks NL 1.0.0 — Community Plugin Review Report

## Result

The source compiles successfully with TypeScript, the production bundle is generated successfully, and ESLint completes without errors.

## Reviewed areas

### Code and lifecycle
- Vault and workspace events registered through the Obsidian plugin/view lifecycle were reviewed.
- The hourly automatic-review timer is registered with `registerInterval`.
- No external network requests were found in the runtime source.
- No `innerHTML` assignment or dynamic script execution was found.
- Markdown files remain the source of task data.
- Focus values are stored as hidden task-line metadata rather than hashtags.

### Manifest and release metadata
- Plugin version: `1.0.0`
- Minimum Obsidian version: `1.8.7`
- Desktop-only: `false`
- Package license aligned with the MIT `LICENSE` file.
- `versions.json` maps `1.0.0` to Obsidian `1.8.7`.
- Release description and package metadata are aligned.

### Settings and migration
- Existing settings are merged with defaults.
- NL/ENG settings language remains available at the top of the settings screen.
- Existing user-defined dictionaries, projects, people, recurrence fields, templates, and Workspace options are preserved by the merge logic.
- Recurrence fields support user-defined input text mapped to English Tasks syntax.

### Workspace
Reviewed:
- Inbox selection for open tasks without a due date and without excluded GTD status.
- Waiting For and Someday classification.
- Project and person badges.
- Up to two people per task.
- Focus positions 1, 2, and 3.
- Hidden-tag filtering.
- Keyboard-accessible task controls.
- Responsive CSS for narrow screens.

### Documentation
- Main README rewritten for the Community Plugins listing.
- Dutch and English manuals retained.
- All existing screenshots remain in the repository.
- A new 1.0.0 banner image was added.
- Language links now appear before the first image.
- NL/ENG settings, recurrence fields, focus positions, projects, people, installation, privacy, compatibility, and release assets are documented.

## Automated checks

```text
npm run lint   PASS
npm run build  PASS
```

## Manual checks still required before submission

These checks require a real Obsidian installation and cannot be proven by static inspection:

1. Install the GitHub release through BRAT.
2. Test on at least one desktop platform.
3. Test on iOS/iPadOS and/or Android because `isDesktopOnly` is false.
4. Test light and dark themes.
5. Test a representative large vault and note startup/Workspace refresh behaviour.
6. Confirm that completing a recurring task produces the intended next occurrence.
7. Confirm that changing a focus position updates the Markdown file and open editor consistently.
8. Confirm that the Community directory renders the README images from the public repository.

## Release checklist

Create a GitHub release whose tag is exactly:

```text
1.0.0
```

Attach these files individually:
- `main.js`
- `manifest.json`
- `styles.css`

Do not rely only on GitHub's automatically generated source archives.

## Submission readiness

The repository is technically prepared for a 1.0.0 release. Publication should follow only after the manual desktop/mobile/BRAT checks above have passed.
