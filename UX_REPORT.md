# TwentyFourSeven UX Evaluation Report
*Synthesis of Usability, Interaction, and Design Strategy.*

## 1. Title and Context
**Product Name:** TwentyFourSeven  
**Evaluation Target:** Daily time-tracking and contextual note-taking dashboard.  
**Evaluation Date:** January 5, 2026  
**Scope:** Core interface components including the 24-hour Activity Table, Interactive Notes Sidebar, Statistics Engine, and Settings Customization Modal.

---

## 2. Evaluation Method (Auto-Evaluation)
**Methodology:** 
- **Heuristic Review:** Mapping the interface against Nielsen’s 10 Usability Heuristics.
- **Cognitive Walkthrough:** Simulating a first-time user and a power user performing high-frequency tasks.
- **Micro-interaction Audit:** Testing keyboard focus, state transitions, and system feedback loops.

**Target Personas:**
- **The Power Logger:** Needs to track billable hours across 10+ projects using minimal mouse movement.
- **The Contextual Planner:** Uses notes to link specific hours to deep-work outcomes.

**Devices Considered:** 
- Primarily Desktop (1920x1080) with high-density keyboard usage.
- Tablet/Mobile (Responsive) for viewing and simple logging.

---

## 3. Summary of Key Findings
### Top Usability Strengths
- **Command Density:** High information-to-screen-real-estate ratio without feeling cluttered.
- **Keyboard Proficiency:** Excellent support for arrow navigation and "Type-to-Replace" mechanics in the grid.
- **Aesthetic Cohesion:** Consistent glassmorphism and dark-mode palette minimize eye strain during long tracking sessions.

### Top Usability Issues
- **Invisible Features:** Some "Smart" note prefixes (!, todo, *) have no visible affordance/prompt, making them hard to discover for new users.
- **Selection Ambiguity:** The difference between "Active Cell" (focused for typing) and "Selected Cells" (highlighted for batch actions) can be subtle.
- **Chart Compression:** Pie charts become difficult to read when more than 8 categories are defined.

### Quick-Win Opportunities
- **Contextual Tooltips:** Add brief tooltips for the Header icon buttons.
- **Empty State Hints:** Use the empty notes area to display a "Cheat Sheet" for smart prefixes.

---

## 4. User Tasks Evaluated
| Task | User Goal | Observed Behavior | UX Friction Point |
| :--- | :--- | :--- | :--- |
| **Log 1 Hour** | Record "Work" activity | Click cell -> Type 'W' | Selection vs. Focus; user often double-clicks unnecessarily. |
| **Add a Todo** | Create a checkbox task | Type `todo Buy milk` | User might not know the exact keyword "todo" is required. |
| **Batch Update** | Clear 4 hours of data | Shift+Arrow -> Backspace | Feedback on deletion is subtle; no "Undo" toast confirmation. |
| **Change Colors** | Update 'Work' to Blue | Open Settings -> Picker | Modal closing via "outside click" might cause accidental data loss if not confirmed. |

---

## 5. Detailed UX Observations
### 5.1 Activity Table (Grid)
- **Positive:** Horizontal scrolling is smooth; sticky headers keep time/date context visible.
- **Usability Problem:** When navigating via arrows, the "Selected" state often persists on the previous cell, creating visual noise.
- **Microinteraction:** The 8px font in cells is highly efficient but may pose readability issues for some; no "Zoom" or "Expand Cell" interaction.

### 5.2 Notes Sidebar
- **Positive:** Real-time filtering by tags is extremely responsive.
- **Usability Problem:** The "Search" bar auto-focuses on tab switch, which is good, but does not clear the previous filter automatically, leading to "No results" confusion.
- **Accessibility:** Note cards use low-contrast timestamps (`#525252` on `#171717`) which fail WCAG AA standards.

---

## 6. Pain Points and Evidence
1. **Discoverability of Syntax:**
   - *Problem:* Users are unaware they can use `!` or `todo`.
   - *Severity:* **High** (Core feature is ignored).
   - *Frequency:* Systematic for first-time users.
2. **Settings Persistence logic:**
   - *Problem:* Changes are only applied on "Close" of the modal. If the browser crashes or the user refreshes with the modal open, work is lost.
   - *Severity:* **Medium**.
3. **Esc Key Inconsistency:**
   - *Problem:* Native Escape clears a focused input, but doesn't always close the Settings Modal if the color picker is active.
   - *Severity:* **Low**.

---

## 7. Recommendations for Improvement
### Micro-Level (Quick Wins)
- **Inline Syntax Guide:** Add a `?` icon in the note input that shows a small popover with: `! Important`, `todo Task`, `# Tag`.
- **Focus Rings:** Increase the stroke width of the focused cell from 1px to 2px for better "Where am I?" awareness.
- **Success Toasts:** Show a brief, non-blocking toast message after a successful "Import" or "Permanent Delete".

### Structural Redesign
- **Settings Auto-Save:** Move from "Apply on Close" to real-time persistence. This aligns with the "Auto-save" philosophy of the rest of the app.
- **Legend Interactivity:** Clicking a category in the Stats Legend should highlight the corresponding cells in the Activity Grid (Cross-filtering).

---

## 8. UX Heuristics Analysis
- **Visibility of System Status:** (Satisfied) The rotating logo and pulsing bar show the app is alive.
- **Recognition vs Recall:** (Violated) Relying on users to remember "todo" or "!" syntax is a recall burden. *Recommendation: Add a syntax helper.*
- **Error Prevention:** (Satisfied) Confirms permanent deletions in the Recycle Bin.
- **Consistency:** (Satisfied) Buttons and typography remain consistent across all modules.

---

## 9. Accessibility & Inclusivity
- **Keyboard Operability:** 10/10. The app is fully navigable without a mouse.
- **Color Contrast:** 6/10. Several gray-on-gray elements in the sidebar need attention.
- **Motion Sensitivity:** The rotating logo (180 deg every 4s) might be distracting. *Recommendation: Honor `prefers-reduced-motion` to stop rotation.*

---

## 10. Prioritized Action Plan
1. **Immediate:** Fix contrast on Sidebar timestamps and add "Syntax Helper" tooltips.
2. **Next Sprint:** Implement real-time saving in the Settings Modal.
3. **Redesign:** Add "Legend-to-Grid" cross-filtering to make the stats actionable.

---

## 11. Open Questions & Assumptions
- **Unknown:** How does performance hold up when `localStorage` exceeds 2MB of raw text?
- **Assumption:** Users prefer the 24-hour vertical layout over a more traditional calendar view for "Micro-tracking."
- **Research Needed:** Conduct a 5-second test on the "Add Category" icon to see if users understand the "+" affordance in a dark UI.
