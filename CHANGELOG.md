# TwentyFourSeven Version Log
*Tracking the evolution of the ultimate daily quest dashboard.*

## Product Summary
**TwentyFourSeven** is a high-performance productivity suite that combines a 24-hour activity grid with a contextual note-taking engine. It is designed to visualize daily output while capturing granular thoughts and tasks in real-time.

## Versioning Model
This product follows **Semantic Versioning (SemVer)**:
- **MAJOR:** Significant architectural shifts or breaking changes to data structures.
- **MINOR:** New user-facing features or significant UX improvements.
- **PATCH:** Bug fixes, minor UI polishes, and performance optimizations.

---

## [1.1.2] - 2026-01-07
### Status: Stable
**Main Focus:** Architectural Refactoring and UI Polish.

### Changed
- **Codebase Architecture:** Refactored entire project to a Feature-First folder structure (`features/`, `shared/`) for better scalability and maintainability.
- **Date Header Toggles:** Simplified the expand/collapse logic for small note groups (<= 3 notes) to bypass the 'semi' state.
- **Filter Bar UI:**
    - Standardized gap spacing across all filter groups.
    - Implemented mutual exclusivity between "Pinned" and "Recycle Bin" modes.
    - Optimized button sizing for "View Options" and "Status" groups.

## [1.1.1] - 2026-01-06
### Status: Stable
**Main Focus:** UI Refinement, Filter Bar Redesign, and Enhanced Recycle Bin.

### Added
- **Recycle Bin Batch Actions:** Added "Restore All" and "Delete All" buttons for bulk management of deleted notes.
- **Recycle Bin Header:** Added a new header indicating item count in Bin mode.

### Changed
- **Notes View Toggle:** Consolidated Full, Compact, and Micro view toggles into a single 3-state button with updated `Rows` icons.
- **Filter Bar Layout:** Completely redesigned the secondary filter row into a structured Grid layout.
    - **Alignment:** The "Note Types" group now occupies exactly 50% width to match the Search Bar.
    - **Grouping:** Buttons are grouped into "Attached" segments (Type, View, Status).
    - **Expansion:** View and Status groups now auto-expand to fill remaining space with consistent spacing.
- **Iconography Updates:**
    - Grouped by Type: `ArrowDownUp` -> `List`.
    - Show Completed: `CheckCircle2` -> `CheckCheck`.
    - View All Mode: `TextAlignJustify` -> `Grid`.
    - Create New Note: `StickyNote` -> `Square`.
- **Interaction Logic:** 
    - "Pinned" and "Recycle Bin" modes are now mutually exclusive.
    - Hover states for filter buttons are now significantly darker (`bg-black` or darker tint) for improved contrast against active states.
- **Micro View:** Optimized spacing and line-height for maximum density in Super Micro View.

## [1.1.0] - 2026-01-05
### Status: Stable
**Main Focus:** Modernized Aesthetics, Dynamic Customization, and Smarter Note Management.

### Added
- **Dynamic Category Settings:** Users can now define their own category keys, names, and colors via a new Settings Modal.
- **Note Type Auto-Detection:** 
    - Prefixing a note with `! ` automatically sets it to **Important**.
    - Prefixing with `todo ` or `* ` creates a **Task** with a checkbox.
    - Pasting a URL automatically fetches metadata and categorizes it as a **Link**.
- **Searchable Tag Cloud:** Added a searchable dropdown for tags in the Notes filter bar.
- **Recycle Bin:** Deleted notes are now moved to a temporary "Bin" and can be restored or permanently purged.
- **Pinning System:** High-priority notes can now be "Pinned" to remain at the top of the feed.
- **Auto-Formatting Tags:** Tags are now auto-capitalized and suggested via a dropdown while typing `#`.
- **Rich Text Support:** Notes now support bullet lists, numbered lists using `1.` prefix, and interactive checkboxes using `[ ]` syntax.
- **Super Micro View:** Added a new ultra-compact view mode that collapses all notes into single-line truncated rows with minimal font size for maximum density.
- **Compact View Truncation:** Notes in compact mode are now limited to 3 rows with automatic truncation to keep the feed organized.

### Changed
- **Unified Notes View:** Removed the monthly fragmentation of notes; all notes are now accessible through a unified, searchable stream.
- **Header Modernization:** Implemented a glassmorphism design with a rotating logo and animated dynamic subtitles.
- **Selection Logic:** Enhanced the rectangle selection model (Shift+Click) to feel more like industrial spreadsheet software (Excel/Sheets).
- **Default Notes Behavior:** Notes now save automatically on "Outside Click" rather than requiring an explicit Save button.

### Fixed
- **Tag Visibility:** Fixed an issue where tag suggestions were cut off at the bottom of the viewport.
- **Keyboard Navigation:** Ensured `Delete` and `Backspace` keys correctly interface with the multi-cell selection in the Activity Table.
- **Auto-Scroll:** New notes now automatically scroll into view upon creation.
- **Search Highlighting:** Search terms are now visually highlighted within note content, links, and tags.
- **Text Selection:** Fixed `Shift+Arrow` selection in note editors (previously conflicted with table navigation).
- **Note Input:** Disabled automatic splitting of notes starting with `-` to allow multi-line lists in a single note.

### Improved UX/UI
- **Microinteractions:** Added a subtle pulsing "dot" indicator on the date header if a note exists for that day.
- **Animations:** Integrated smooth entry animations for the Settings Modal and Note Cards.
- **Typography:** Updated to a more refined 'Playfair Display' and 'Inter' font stack for a premium feel.
- **Mobile Responsiveness:** Improved grid horizontal scrolling on touch devices.

### Removed
- **Manual Save Button:** Note-editing now uses an "Edit-in-place" model with auto-save to reduce friction.
- **Fixed Monthly Tabs:** Removed the restrictive "Monthly Notes" tabs in favor of a chronological global stream.

### Performance
- **Local Storage Optimization:** Refined the data hashing logic to ensure faster lookups in the 24-hour grid.
- **State Caching:** Implemented memoization in the Statistics component to prevent chart re-renders during cell selection.

---

## [1.0.0] - 2025-11-01
### Status: Initial Release
**Main Focus:** Establishing the core 24-hour grid and basic activity logging.

### Added
- **24/7 Activity Grid:** Interactive 24-row x 31-column table for time logging.
- **Fixed Categories:** Initial support for 6 hardcoded categories (Sleep, Family, Activity, Personal, Career, Exercise).
- **Basic Undo/Redo:** Ctrl+Z and Ctrl+Shift+Z support for cell changes.
- **CSV/Sheet Support:** Ability to paste data directly from Google Sheets or Excel.
- **Monthly Statistics:** Basic pie chart visualization of logged hours.
- **LocalStorage Storage:** All data stored locally in the user's browser.

---

## Breaking Changes & Migration Notes
### Category Mapping (v1.1.0)
The storage schema for categories has transitioned from hardcoded indices to dynamic keys. 
- **Legacy Users:** Your existing data will be automatically mapped to the new dynamic category system upon first load.
- **Action Required:** If you previously used custom CSS overrides for colors, please migrate those styles to the new Settings Modal UI.

### Data Model Evolution
The Notes storage structure has been flattened to support global search. 
- **Workflows Altered:** Instead of navigating month-by-month to find old notes, use the Search bar or the Tag dropdown for faster retrieval.

## Affected Screens and User Flows
| Module | Impact Level | Description |
| :--- | :--- | :--- |
| **Header** | High | Complete visual overhaul and new Month/Year picker logic. |
| **Activity Table** | Medium | Improved selection mechanics and keyboard shortcuts. |
| **Notes Sidebar** | High | Completely rewritten filtering, sorting, and editing logic. |
| **Settings** | New | Entirely new flow for category customization. |

## Known Issues
- Large data sets (multi-year) may cause a slight delay in the first render of the Statistics chart. *Workaround: Clear the Recycle Bin regularly.*
- Metadata fetching for specific HTTPS links may fail if the target site blocks bot requests.

---

## Appendix: Historical Versions Summary
### Current Version: v1.1.2 (2026-01-07)
- **v1.1.2 (2026-01-07):** Architectural Refactoring and UI Polish.
- **v1.1.0 (2026-01-05):** Refined UI, Dynamic Categories, and Smart Notes.
- **v1.0.0 (2025-11-01):** Core Grid and Basic Stats release.
