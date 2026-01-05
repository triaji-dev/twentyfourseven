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

### Changed
- **Unified Notes View:** Removed the monthly fragmentation of notes; all notes are now accessible through a unified, searchable stream.
- **Header Modernization:** Implemented a glassmorphism design with a rotating logo and animated dynamic subtitles.
- **Selection Logic:** Enhanced the rectangle selection model (Shift+Click) to feel more like industrial spreadsheet software (Excel/Sheets).
- **Default Notes Behavior:** Notes now save automatically on "Outside Click" rather than requiring an explicit Save button.

### Fixed
- **Tag Visibility:** Fixed an issue where tag suggestions were cut off at the bottom of the viewport.
- **Keyboard Navigation:** Ensured `Delete` and `Backspace` keys correctly interface with the multi-cell selection in the Activity Table.
- **Auto-Scroll:** New notes now automatically scroll into view upon creation.

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
- **v1.1.0 (Current):** Refined UI, Dynamic Categories, and Smart Notes.
- **v1.0.0 (Nov 2025):** Core Grid and Basic Stats release.
