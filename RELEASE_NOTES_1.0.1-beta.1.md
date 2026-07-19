# Tasks NL 1.0.1-beta.1

Mobile test release.

## Fixed
- Settings are mirrored to `.tasks-nl/settings.json` inside the vault, so project, person, repeat and interface settings can sync between desktop and mobile.
- The mirrored settings file is reloaded automatically when it changes on another device.
- Project and person labels remain visible in the mobile Workspace.
- Portrait task rows use a compact multi-line layout.
- Landscape task rows use a wider single-line layout rather than hiding metadata.
- Safe-area spacing is applied in landscape mode.

## Test
Make sure your sync service includes the hidden `.tasks-nl` folder.
