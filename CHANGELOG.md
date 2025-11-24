# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Added "Rewrite" and "Proofread" options to the context menu.
- Implemented automatic tool selection and processing in the side panel when triggered from the context menu.
- Exposed `selectTool` and `resetTools` methods in `ToolSelector` component for programmatic control.

### Changed
- Updated `selectedText` message protocol to include an `action` field instead of a boolean `summarize` field.
- Refactored `SidepanelApp` to handle the new `action` based message format.
