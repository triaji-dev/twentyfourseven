# TwentyFourSeven UI/UX Documentation
*Version 1.1.2 | System Date: Jan 2026*

## 1. Overview
### 1.1 Brief Purpose
TwentyFourSeven is a high-performance, modular time-tracking and note-taking dashboard designed for power users. It combines a 24-hour activity grid with an advanced contextual note-taking system to provide a comprehensive record of daily output and thought processes.

### 1.2 Primary User Groups
*   **Knowledge Workers:** Users needing to track billable or focused hours across various projects/categories.
*   **Journalers/Planners:** Individuals using the system for daily reflection and "todo" management.
*   **Power Users:** Users who prefer keyboard-heavy workflows, fast entry, and data portability.

### 1.3 Supported Platforms
*   **Desktop (Primary):** Optimized for mouse and keyboard interaction. Supports complex selection and keyboard navigation.
*   **Responsive:** Grid layout adapts to screen size, though advanced selection features may be limited on touch devices.

---

## 2. Information Architecture
### 2.1 Navigation Model
*   **Global Navigation:** Header-based navigation for time (Month/Year) and system settings (Import/Export/Categories).
*   **Local Navigation (Contextual):** Tab-based switching in the sidebar between Statistics and Notes.
*   **Temporal Navigation:** Ability to jump between days by clicking columns in the Activity Table or using the Date Navigator in the Notes panel.

### 2.2 Sitemap (Markdown Outline)
- **Main View**
  - **Header**
    - Logo & Dynamic Subtitle
    - Settings Button (Modal Trigger)
    - Data Export (JSON Download)
    - Data Import (JSON Upload)
    - Month/Year Picker
  - **Main Dashboard**
    - **Activity Table (Activity Tracker)**
      - 24-hour Row Header (00-23)
      - Date/Day Column Headers
      - Interactive Activity Cells (Grid)
    - **Sidebar (Utility Panel)**
      - **Statistic Tab**
        - Category Distribution Pie Chart
        - Legend with Hours & Percentages
      - **Notes Tab**
        - Global Notes Search/Filter Bar
        - Tag Suggestion List
        - Date Navigator (Calendar Strip)
        - Note Type Toggles (Important, Todo, Link, Text)
        - Active Note Stream
        - Recycle Bin (Soft-deleted notes)
- **Settings Modal**
  - Category Management (Key, Name, Color)
  - Color Picker Tool

---

## 3. UI Elements Inventory
### 3.1 Layout & Containers
| Element | Purpose | Default State | Microinteractions |
| :--- | :--- | :--- | :--- |
| **Main Container** | Root layout | Fullscreen grid | 2-column on desktop, stack on mobile. |
| **Sidebar** | Houses Stats/Notes | Visible (Right) | Glassmorphism effect (80% opacity, backdrop blur). |
| **Activity Grid** | Time entry area | Scrollable (Horizontal) | Sticky headers for hours and dates. |

### 3.2 Navigation & Buttons
*   **Primary Action Buttons (Header):**
    *   **Appearance:** Icon-only with subtle background (`#262626`).
    *   **States:** Hover adds `scale-105` and background shift to `#404040`.
    *   **Special Behavior:** Settings icon rotates 45° on hover. Download/Upload icons shift vertically.
*   **Month/Year Picker:**
    *   **Trigger:** Click on Month or Year text.
    *   **Dropdown:** Emerges below trigger. Year picker supports mouse wheel scrolling for rapid increment/decrement.
*   **Sidebar Tabs:**
    *   **Interaction:** Click to switch visibility of `Statistic` and `Notes` components.
    *   **Active State:** High-contrast text with background fill.

### 3.3 Activity Cells (Interactive Inputs)
*   **Type:** Single-character text input (`maxLength: 1`).
*   **Behavior:** 
    *   Accepts specific category keys (e.g., 'W' for Work, 'E' for Exercise).
    *   Auto-converts input to uppercase.
    *   Auto-selects content on focus for quick replacement.
*   **States:**
    *   **Default:** Gray background or category-specific color.
    *   **Focused:** Border glow, text selected.
    *   **Selected (Multi-select):** Outlined with colored overlay.
    *   **Copied:** Dashed border animation.

### 3.4 Notes Elements
*   **Note Card:**
    *   **Macro:** Displays type icon, content, timestamp, and actions.
    *   **Micro:** Hover reveals floating action menu (Edit, Copy, Delete, Pin).
*   **Rich Input:**
    *   **Behavior:** Auto-expanding textarea for notes.
    *   **Validation:** Required content for saving.
*   **Tag Badge:**
    *   **Appearance:** Small capsule with `#` prefix. Clickable for filtering.

---

## 4. Features List
### 4.1 Activity Tracking (Macro)
*   **Purpose:** Log time expenditures in 1-hour increments.
*   **Step-by-Step:**
    1.  Locate Day (Column) and Hour (Row).
    2.  Click cell to focus.
    3.  Type category key (mapped via Settings).
    4.  The system saves automatically and moves focus to the next hour (optional shortcut).
*   **Microinteractions:**
    *   **Key press:** Instant color change based on category map.
    *   **Keyboard Nav:** Arrow keys move focus between cells.
    *   **Selection Rectangle:** Click-and-drag to select multiple cells for batch pasting.

### 4.2 Modular Note System (Macro)
*   **Note Types & Detection:**
    *   **Important:** Start note with `!`. UI adds red accent and alert icon.
    *   **Todo:** Start note with `todo `. UI adds checkbox; toggling checkbox updates text persistence.
    *   **Link:** Paste URL. System detects protocol and fetches title metadata (if available).
*   **Microinteractions:**
    *   **Escape Key:** During editing, cancels changes and reverts to previous state.
    *   **Outside Click:** Saves current edit and exits edit mode.
    *   **Tag Suggestion:** Typing `#` opens a dropdown of previously used tags. Tab or Enter to select.

### 4.3 Data Portability (Backup)
*   **Export:** Generates a `twentyfourseven_backup_[timestamp].json` file.
*   **Import:** Overwrites entire local database with JSON content. Requires confirming page reload.

---

## 5. User Flows
### 5.1 Onboarding & Setup
1.  **User opens app.** Default categories are loaded.
2.  **User clicks Settings (Cog).** Refines category keys (e.g., 'D' for Deep Work, 'M' for Meetings).
3.  **User closes Modal.** App re-renders with new colors immediately.

### 5.2 Daily Logging Path
1.  **Goal:** Record 8 hours of work.
2.  **Start:** Select first hour of work day in the grid.
3.  **Path:** Type 'W', press Down Arrow, type 'W', etc.
4.  **Verification:** Check **Statistic Tab** to see "Work" category at 8 hours (33%).

### 5.3 Task Management inside Notes
1.  **Select Date:** User clicks date column or uses Note Navigator.
2.  **Add Todo:** Type `todo Buy groceries` in the note input.
3.  **Interaction:** Press Enter to save.
4.  **Completion:** Check the box inside the note card. Card dims or moves to "Completed" logic.

---

## 6. States & Contextual Behavior
### 6.1 System States
*   **Empty States:** 
    *   **Stats:** Shows "No activity logged" message or zeroed charts.
    *   **Notes:** Shows "No notes for this date" with an invitation to create one.
*   **Loading State:** Subtle opacity pulse on components while fetching from localStorage.

### 6.2 Role-Based Visibility
*   *Note: This is a client-side application; all features are visible to the local user.*
*   **Contextual Buttons:** Delete button only visible on note hover; Restore button only visible in Recycle Bin.

### 6.3 Responsive Breakpoints
*   **Mobile (< 768px):** Sidebar moves below the grid. Table becomes horizontally scrollable with touch-momentum.

---

## 7. Accessibility & Usability Notes
*   **Keyboard Focus:** Managed strictly using `tabindex`. Focused elements have a high-contrast ring (`2px solid #525252`).
*   **ARIA Labels:** All icon buttons in the Header and Note cards include `aria-label` for screen readers.
*   **Contrast:** Minimum contrast ratio of 4.5:1 for all primary text against the dark `#0a0a0a` background.
*   **Confirmation Dialogs:** Destructive actions (Permanent Delete, Restore) require explicit confirmation to prevent data loss.

---

## 8. Glossary
*   **Activity Key:** A single character (A-Z) used to trigger a category assignment.
*   **Bin/Recycle:** A temporary storage for deleted notes before permanent erasure.
*   **Category:** A grouping for time tracking (e.g., "Work", "Sleep").
*   **Glassmorphism:** A design style characterized by background blur and semi-transparent layers.
*   **Note Stream:** The chronological list of notes displayed in the Sidebar.
*   **Pinning:** Fixing a note to the top of the stream regardless of its chronological order.

---

## Appendix: Open Assumptions
*   *Assumption 1:* Browser supports `localStorage` with at least 5MB of space.
*   *Assumption 2:* URL parsing for "Link" notes relies on standard URL regex patterns.
*   *Assumption 3:* Exported JSON files are intended to be held privately by the user (no server storage).

---

## 9. Technical Architecture
### 9.1 Folder Structure
The project follows a **Feature-First** architecture to ensure modularity and scalability:
- **`src/features/`**: Contains self-contained feature modules (`note`, `activity`, `statistic`).
  - Each feature has its own `components`, `hooks`, and `types`.
- **`src/shared/`**: Common utilities, reusable components, global stores, and constants.
  - `components/`: Generic UI elements (Header, DateNavigator).
  - `store/`: Global state management (Zustand).
  - `utils/`: Helper functions.
