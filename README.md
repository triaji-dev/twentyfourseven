# TwentyFourSeven

> **The ultimate daily quest dashboard.**

**TwentyFourSeven** is a high-performance productivity suite that combines a 24-hour activity grid with a contextual note-taking engine. It is designed to visualize daily output while capturing granular thoughts and tasks in real-time.

---

## 🚀 Getting Started

### Installation
1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start development server:**
    ```bash
    npm run dev
    ```

3.  **Build for production:**
    ```bash
    npm run build
    ```

---

## 🏗️ Technical Architecture

**Tech Stack:**
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS + Vanilla CSS Variables
- **State Management:** Zustand
- **Icons:** Lucide React

The project follows a modular **Feature-First** directory structure:

```
src/
├── features/          # Domain-specific modules
│   ├── activity/      # Time grid and cell logic
│   ├── note/          # Note management system
│   └── statistic/     # Charts and data visualization
└── shared/            # Reusable core elements
    ├── components/    # Generic UI (Header, Modals)
    ├── store/         # Global Zustand state
    └── hooks/         # Shared logic
```

---

## 📖 Documentation

### 1. Overview
TwentyFourSeven is a high-performance, modular time-tracking and note-taking dashboard designed for power users. It combines a 24-hour activity grid with an advanced contextual note-taking system to provide a comprehensive record of daily output and thought processes.

**Target Audience:**
*   **Knowledge Workers:** Users needing to track billable or focused hours across various projects/categories.
*   **Power Users:** Users who prefer keyboard-heavy workflows, fast entry, and data portability.

### 2. Key Features

#### Activity Tracking (The Grid)
*   **24/7 Grid:** Log time in 1-hour increments with a high-density interactive table.
*   **Keyboard Optimized:** Navigate via Arrow keys, type Category Keys (A-Z) to log instantly.
*   **Selection:** Click-and-drag or Shift+Arrow to batch select and edit cells.

#### Smart Notes System
*   **Unified Stream:** Chronological feed of notes, tasks, and thoughts.
*   **Auto-Formatting:**
    *   `! ...` -> **Important Note** (Red accent)
    *   `todo ...` -> **Task** (Checkbox enabled)
    *   `http://...` -> **Link** (Auto-detected)
*   **Filtering:** Global Search, Tag Cloud, and Type Filters (Text, Todo, Impt, Link).
*   **Micro-interactions:** Drag-and-drop ordering, "Scroll-to-View" on creation.

#### Statistics Engine
*   **Real-time Visualization:** Donut charts breaking down category distribution.
*   **Scopes:** View Daily breakdown, Monthly limits, or All-time records.

#### Data Privacy & Portability
*   **100% Client-Side:** All data stored in `localStorage`.
*   **Backup/Restore:** Single-click JSON export/import for data safety.

### 3. User Flows

**Daily Logging Path:**
1.  **Select Hour:** Click cell in the Grid.
2.  **Log:** Press Category Key (e.g., 'W' for Work).
3.  **Focus Moves:** System auto-advances to the next hour.

**Task Management:**
1.  **Add Task:** Type `todo Call client` in Notes input.
2.  **Complete:** Click checkbox in the Note card.
3.  **Metadata:** Add `#work` tag for filtering.

---

## 🎨 UX & Design Report

**Evaluation Date:** Jan 2026
**Theme:** "Dark Glassmorphism" - High contrast, focus-centric, premium feel.

### Usability Highlights
*   **Command Density:** High information density without visual clutter, catering to pro users.
*   **Keyboard Proficiency:** "Type-to-Replace" mechanics in the grid mimic Excel efficiency.
*   **Visual Hierarchy:** Use of muted grays (`#525252`) vs accents (`#22c55e`, `#ef4444`) guides attention effectively.

### Recent Improvements (v1.1.2 - v1.1.3)
*   **Filter Bar:** Redesigned for better grouping and mutual exclusivity logic.
*   **Note Actions:** Fixed clipping issues by implementing smart scroll-following positioning for dropdowns.
*   **Visuals:** Unified "Glass" headers and improved mobile responsiveness.

### Design Heuristics
*   **Visibility:** System status (Saving, Loading) is communicated via subtle pulses rather than blocking modals.
*   **Consistency:** Consistent iconography (Lucide) and spacing (Tailwind grid) across all modules.

---

## 📜 Version History (Changelog)

### [v1.1.3] - 2026-01-12 (Current)
**Focus:** Critical UX Fixes and Interaction Polish.
*   **Fixed:** Note Action Dropdown clipping issues. Dropdowns now strictly follow the note scroll position while smartly avoiding viewport edges (opening upwards if needed).
*   **Improved:** Removed React Portals for note menus to ensure perfect z-index layering and scroll synchronization.
*   **Refined:** Enhanced visual feedback for "Selected" states in the grid.

### [v1.1.2] - 2026-01-07
**Focus:** Architectural Refactoring and UI Polish.
*   **Changed:** Refactored entire project to Feature-First architecture (`features/`, `shared/`).
*   **Changed:** Standardized Filter Bar UI with clearer grouping and "darker" hover states.
*   **Changed:** Simplified Date Header toggles for small note groups.

### [v1.1.1] - 2026-01-06
**Focus:** UI Refinement and Recycle Bin.
*   **Added:** Recycle Bin "Restore All" and "Delete All".
*   **Changed:** Consolidated Notes View toggles (Standard, Compact, Micro).
*   **Changed:** "Pinned" and "Recycle Bin" filters are now mutually exclusive.

### [v1.1.0] - 2026-01-05
**Focus:** Modern Aesthetics and Dynamic Customization.
*   **Added:** Dynamic Category Settings (User-defined colors/names).
*   **Added:** Searchable Tag Cloud and Type Auto-Detection.
*   **Added:** "Super Micro" view for maximum density.
*   **Added:** Pinning system for high-priority notes.

### [v1.0.0] - 2025-11-01
**Focus:** Core Grid and Basic Stats.
*   **Added:** 24/7 Activity Grid with LocalStorage persistence.
*   **Added:** Basic Monthly/Daily Donut Charts.
