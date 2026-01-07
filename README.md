# TwentyFourSeven
> The ultimate daily quest dashboard.

**TwentyFourSeven** is a high-performance productivity suite that combines a 24-hour activity grid with a contextual note-taking engine. It is designed to visualize daily output while capturing granular thoughts and tasks in real-time.

---

## 📚 Documentation & Reports
This repository contains detailed documentation and reports:
- **[📘 Full Documentation](./DOCUMENTATION.md)**: Detailed feature breakdown, user flows, and glossary.
- **[📋 Changelog](./CHANGELOG.md)**: Version history and release notes.
- **[🎨 UX Report](./UX_REPORT.md)**: Usability evaluation and design strategy.

---

## 🚀 Key Features
- **24/7 Activity Grid:** Log time in 1-hour increments with a high-density table.
- **Smart Notes:** Contextual note-taking with auto-detection for `!important`, `todo tasks`, and `http://links`.
- **Statistics Engine:** Real-time visual breakdown of your time usage.
- **Local & Private:** 100% Client-side. Data stored in LocalStorage.
- **Keyboard Optimized:** Navigate the grid and manage notes without touching the mouse.

---

## 📦 Latest Updates (v1.1.2)
**Date:** 2026-01-07
**Focus:** Architectural Refactoring and UI Polish.

- **Refactored Codebase:** Migrated to a **Feature-First** architecture (`src/features`, `src/shared`) for better maintainability.
- **UI Refinements:**
    - Simplified Date Header toggles for small note groups.
    - Redesigned Filter Bar for better spacing and consistency.

---

## 🛠️ Technical Architecture
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

## 💻 Tech Stack
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS + Vanilla CSS Variables
- **State Management:** Zustand
- **Icons:** Lucide React

---

## 🏃‍♂️ Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```
