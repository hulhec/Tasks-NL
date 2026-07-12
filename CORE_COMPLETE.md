# Tasks NL Core Complete

Version 0.6.2 marks the Tasks NL core as feature complete.

## Stable pipeline

Natural Dutch input is processed through:

1. Date recognition
2. Priority recognition
3. Dictionary matching
4. Repeat recognition
5. Task normalization
6. Markdown formatting
7. Editor insertion

## Stable principles

- Markdown is the source of truth.
- One task equals one Markdown line.
- Dates and recurrence use Tasks-compatible syntax.
- GTD, projects and people use configurable hashtags.
- Metadata presentation never modifies Markdown.
- New product functionality should build above the core through repository, presentation and workspace layers.

## Core modules

- `src/nlp`
- `src/dictionary`
- `src/planning`
- `src/normalizer`
- `src/parser`
- `src/services`

Changes to these modules after 0.6.2 should primarily be bug fixes or compatibility updates.
