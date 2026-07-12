# Tasks NL Architecture

Version: 0.1 (Draft)

## Vision

Tasks NL allows users to write tasks in natural Dutch.

The plugin interprets the text and converts it into standardized Markdown without requiring the user to learn a special syntax.

The user writes naturally.
Tasks NL adds structure.

---

# Core Principle

> Write naturally. Store consistently.

The original input is interpreted into structured task metadata and then converted into a standardized Markdown task.

---

# Processing Pipeline

```
Natural Dutch
      │
      ▼
DutchTaskParser
      │
      ▼
TaskInterpretation
      │
      ▼
TaskNormalizer
      │
      ▼
TaskLineFormatter
      │
      ▼
Markdown
      │
      ▼
Obsidian
```

---

# Responsibilities

## DutchTaskParser

Purpose

Interpret natural Dutch language.

Responsibilities

- recognize dates
- recognize priorities
- recognize GTD status
- recognize projects
- recognize people
- recognize tags

Does NOT

- modify the title
- generate Markdown
- write files

---

## TaskInterpretation

Purpose

Temporary model containing everything the parser understood.

Responsibilities

- keep recognized metadata
- preserve the original interpretation

Does NOT

- normalize
- format

---

## TaskNormalizer

Purpose

Convert a parsed task into a clean internal task.

Responsibilities

- remove metadata words from the title
- clean whitespace
- prepare data for formatting

Does NOT

- parse Dutch
- generate Markdown

---

## TaskLineFormatter

Purpose

Convert a normalized task into a Markdown task line.

Responsibilities

- build the final Markdown
- append metadata

Does NOT

- understand Dutch
- normalize titles

---

## TaskCreationService

Purpose

Coordinate the complete task creation process.

Responsibilities

- call the parser
- call the normalizer
- call the formatter
- insert Markdown into the editor

Does NOT

- contain parsing logic
- contain formatting logic

---

# Design Principles

- Single Responsibility Principle
- Small focused classes
- Markdown is the only storage format
- One task equals one Markdown line
- No database
- Natural language first
- Standardized Markdown output
- Build small, test often

---

# Future Components

Interpreter

- DateRecognizer
- TimeRecognizer
- PriorityRecognizer
- StatusRecognizer
- ProjectRecognizer
- PersonRecognizer
- TagRecognizer

Vocabulary

- DateWords
- PriorityWords
- StatusWords

Services

- TaskCreationService

Formatter

- TaskLineFormatter

Normalizer

- TaskNormalizer

---

# Long-term Goal

Tasks NL should feel like writing in natural Dutch while producing consistent, machine-readable Markdown that remains readable and maintainable for many years.

## Review flow

Review settings define weekly and monthly Markdown layouts, filename formats and a shared vault folder. The review creator resolves variables, ensures the folder exists, handles filename conflicts and writes a Markdown note. Review tasks receive the internal `#tasks-nl-review` marker. Workspace filtering isolates those tasks in the Review section.
