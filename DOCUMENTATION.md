# TwentyFourSeven - Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [State Management](#state-management)
6. [Data Storage](#data-storage)
7. [Development Guide](#development-guide)

---

## 🎯 Overview

**TwentyFourSeven** - Aplikasi tracking aktivitas harian dengan grid 24 jam × hari dalam bulan.

### Key Features

- ✅ Grid 24 jam × jumlah hari dalam bulan
- ✅ 6 kategori aktivitas (S, F, A, P, C, E)
- ✅ Copy/Paste multiple cells (termasuk dari Google Sheets/Excel)
- ✅ Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
- ✅ Rectangle selection (Shift+Arrow / Shift+Click)
- ✅ Keyboard navigation (Enter, Arrow keys)
- ✅ Statistik bulanan dengan pie chart
- ✅ LocalStorage persistence
- ✅ Auto-replace input saat cell di-klik

---

## 🛠 Tech Stack

- **React** 18.3.1 + **TypeScript** 5.5.3 + **Vite** 5.3.1
- **Zustand** 4.5.2 - State Management
- **Tailwind CSS** 3.4.1 - Styling

---

## ✨ Features

### 1. Activity Tracking

- Grid 24 jam (rows) × N hari (columns)
- Input validation: S, F, A, P, C, E atau empty
- Auto uppercase & real-time save ke LocalStorage
- Auto-replace: Klik cell → ketik langsung menimpa nilai lama

### 2. Cell Selection

- **Single**: Click cell
- **Multiple**: Ctrl+Click toggle
- **Rectangle**: Shift+Click atau Shift+Arrow
- **Drag**: Mouse drag untuk select area

### 3. Copy/Paste

- **Internal**: Ctrl+C/V antar cell
- **External**: Paste dari Google Sheets/Excel (TSV format)
- **Pattern Paste**: Paste dengan posisi relatif
- Visual feedback: border hijau untuk copied cells

### 4. Undo/Redo

- **Ctrl+Z**: Undo perubahan
- **Ctrl+Shift+Z**: Redo perubahan
- Global scope: Berfungsi bahkan saat input fokus
- History tracking untuk semua cell changes

### 5. Keyboard Navigation

- **Enter / Arrow Down**: Pindah ke jam berikutnya
- **Arrow Up/Down/Left/Right**: Navigate antar cell
- **Shift+Arrow**: Expand rectangle selection
- Auto wrap: Navigasi otomatis ke hari/jam berikutnya

### 6. Statistics

- Monthly stats per kategori
- Pie chart visualisasi (Canvas API)
- Auto update saat data berubah

---

## 🏗 Architecture

### Component Hierarchy

```
App
├── Header (Month navigation)
├── ActivityTable (Grid + Selection)
│   └── ActivityCell[] (24 × daysInMonth)
└── Stats (Monthly stats + Pie chart)
```

### State Flow

```
User Input → ActivityCell → saveActivity → LocalStorage
                ↓
          pushHistory (undo/redo)
                ↓
          Store.refreshStats → Stats Component
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut             | Action                     | Notes                                 |
| -------------------- | -------------------------- | ------------------------------------- |
| **Ctrl+C**           | Copy selected cells        | Works with multiple selection         |
| **Ctrl+V**           | Paste cells                | Internal + External (TSV dari Sheets) |
| **Ctrl+Z**           | Undo                       | Global (works even in input)          |
| **Ctrl+Shift+Z**     | Redo                       | Global                                |
| **Delete/Backspace** | Delete selected cells      | Multiple selection support            |
| **Enter**            | Navigate down (next hour)  | Auto wrap to next day                 |
| **Arrow Up/Down**    | Navigate vertically        | Hour navigation                       |
| **Arrow Left/Right** | Navigate horizontally      | Day navigation                        |
| **Shift+Arrow**      | Expand rectangle selection | Excel-like selection                  |
| **Shift+Click**      | Rectangle select to cell   | From selectionStart                   |
| **Ctrl+Click**       | Toggle cell selection      | Multiple selection                    |

---

## 🗄 State Management

### Zustand Store

**Key States**:

```typescript
{
  currentDate: Date,
  selectedCells: Set<string>,
  selectionStart: { year, month, day, hour } | null,
  selectionEnd: { year, month, day, hour } | null,
  copiedCells: CopiedCell[],
  history: Array<{[cellId]: ActivityKey}>,
  future: Array<{[cellId]: ActivityKey}>,
  dataVersion: number,
  statsCache: MonthStats | null
}
```

**Key Actions**:

- `expandSelection(direction)`: Shift+Arrow rectangle expansion
- `selectRectangle(start, end)`: Select all cells in rectangle
- `copySelection()`: Copy selected cells to clipboard
- `pasteToSelection(clipboardText?)`: Paste internal/external data (TSV support)
- `pushHistory()`: Save current state for undo
- `undo()`: Restore previous state
- `redo()`: Restore next state
- `refreshStats()`: Recalculate monthly statistics

---

## 💾 Data Storage

### LocalStorage Schema

**Key Format**: `twentyfourseven-{YEAR}-{MONTH}-{DAY}-{HOUR}`

**Example**:

```
twentyfourseven-2025-11-1-8  → "S"
twentyfourseven-2025-11-15-14 → "F"
```

### Functions (`utils/storage.ts`)

```typescript
loadActivity(year, month, day, hour): ActivityKey
saveActivity(year, month, day, hour, value): void
getCellClass(value): string  // Map to CSS class
getDaysInMonth(year, month): number
```

---

## 🎨 Styling

### Activity Colors

| Code | Category | Color                          |
| ---- | -------- | ------------------------------ |
| S    | Sleep    | `bg-green-50 text-green-800`   |
| F    | Family   | `bg-amber-50 text-orange-600`  |
| A    | Activity | `bg-blue-50 text-blue-700`     |
| P    | Personal | `bg-pink-50 text-pink-700`     |
| C    | Career   | `bg-purple-50 text-purple-700` |
| E    | Exercise | `bg-orange-50 text-orange-600` |

### Selection Styles

```css
.cell-selected {
  box-shadow: inset 0 0 0 2px #3b82f6; /* Blue border */
}

.cell-copied {
  box-shadow: inset 0 0 0 2px #10b981; /* Green border */
  animation: copiedPulse 0.5s;
}
```

### Input UX

```css
input {
  caret-color: transparent; /* No blinking cursor */
  cursor: pointer;
  user-select: none;
}
```

---

## 👨‍💻 Development Guide

### Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build
```

### Adding New Activity Type

1. Update `VALID_VALUES` in `src/constants/index.ts`
2. Update `ActivityKey` type in `src/types/index.ts`
3. Add CSS class in `src/index.css`
4. Update `getCellClass()` in `src/utils/storage.ts`

### Debugging

**Check LocalStorage**:

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('twentyfourseven'))
  .forEach(k => console.log(k, localStorage.getItem(k)));
```

**Clear Data**:

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('twentyfourseven'))
  .forEach(k => localStorage.removeItem(k));
```

---

## 🚀 Future Enhancements

- [ ] Export/Import to CSV/JSON
- [ ] Dark mode
- [ ] Custom categories
- [ ] Week/Year view
- [ ] Cloud sync
- [ ] Activity templates

---

**Last Updated**: November 1, 2025 | **Version**: 1.0.0
