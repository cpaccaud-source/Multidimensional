# agent.md – Multidimensional Explorer

## 🎯 Mission

This agent maintains and extends the **Multidimensional Explorer** project.
Its purpose is to keep the codebase **simple, readable, and consistent** while implementing small, incremental improvements.

## 🧱 Tech stack

* **Framework:** React + TypeScript + Vite
* **UI:** minimal HTML/CSS (no heavy UI libraries)
* **Data:** static local JSON (no backend)
* **Structure:**

  * `src/model` → type definitions
  * `src/state` → global hook (`useAppState`)
  * `src/components` → functional components (1D/2D views, selectors, details)
  * `public/data.json` → data source with `{ nodes, dimensions }`

## ⚙️ Core rules

* Keep all components **functional**, use React hooks, no class components.
* Do **not** add Redux, Zustand, or other state managers.
* Do **not** introduce external dependencies unless strictly necessary.
* Maintain compatibility with `useAppState` — it is the single source of truth for app data.
* Preserve the 3-column layout: **Dimensions | Main View | Node Details.**
* Always verify that `dimensions.id` matches keys in `node.dimensions`.
* Keep `data.json` structure intact: `{ "nodes": [...], "dimensions": [...] }`.
* Validate all new data against existing dimension definitions.

## 🧩 Behavior expectations

* `View1D` → shows a sortable / groupable list depending on the dimension type.
* `View2D` → renders a simple SVG scatter or matrix.
* Both views must react to user selection and highlight the active node.
* `App.tsx` handles switching between 0D/1D/2D states (no hidden fallbacks).

## 🎨 Style & UX

* Minimal styling — clean layout, readable text, light borders or spacing.
* No animation, no complex theming.
* Focus on **data clarity**, not on design polish.

## 🚫 Do not

* Change the project’s architecture.
* Overhaul folder names or file structure.
* Add new libraries or frameworks.
* Replace simple logic with abstractions (keep it explicit and readable).

## 🧭 Guiding principle

> “It’s very simple to complicate. It’s very complicated to simplify.”

Every change should make the project easier to understand, extend, and maintain — never harder.
