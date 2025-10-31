# TwentyFourSeven Time Tracker

A minimalist time tracking application built with React, Vite, TypeScript, and Tailwind CSS 4.

## Features

- 📅 Monthly view of hourly activities
- 🎨 Color-coded activity categories
- 📊 Visual statistics with pie chart
- 💾 Local storage persistence
- ⌨️ Keyboard shortcuts for productivity
- 🎯 Cell selection and bulk operations

## Activity Categories

- **S** - Sleep (Green)
- **F** - Family (Yellow)
- **A** - Architecture (Blue)
- **P** - Programming (Pink)
- **C** - Creativity (Purple)
- **E** - Entertainment (Orange)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build

```bash
# Build for production
npm run build
```

### Preview Production Build

```bash
# Preview production build locally
npm run preview
```

## Usage

1. Click on any cell to enter an activity code (S, F, A, P, C, or E)
2. Navigate between months using the arrow buttons
3. View statistics in the right panel
4. Use keyboard shortcuts:
   - **Click + Drag**: Select multiple cells
   - **Ctrl/Cmd + Click**: Multi-select cells
   - **Shift + Click**: Select range
   - **Ctrl/Cmd + C**: Copy selected cells
   - **Ctrl/Cmd + V**: Paste cells
   - **Delete/Backspace**: Clear selected cells
   - **Ctrl/Cmd + A**: Select all cells

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Canvas API** - Pie chart visualization

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Month navigation
│   ├── ActivityTable.tsx   # Main activity grid
│   ├── ActivityCell.tsx    # Individual cell component
│   └── Stats.tsx           # Statistics panel
├── hooks/
│   └── useMonthlyStats.ts  # Statistics calculation hook
├── utils/
│   └── storage.ts          # LocalStorage utilities
├── types/
│   └── index.ts            # TypeScript type definitions
├── constants/
│   └── index.ts            # App constants
├── App.tsx                 # Main app component
├── main.tsx                # App entry point
└── index.css               # Global styles

```

## License

MIT

## Author

TwentyFourSeven Time Tracker
