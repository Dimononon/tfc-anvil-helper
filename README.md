# TFC Anvil Helper

An interactive web application for **TerraFirmaCraft (TFC)** and **TerraFirmaGreg (TFG)** anvil working. It calculates exact target progress values from World Seed and Recipe IDs using authentic 128-bit Minecraft PRNG algorithms and finds optimal step sequences to complete any forging recipe with minimal hammer hits.

Live Web App: **[anvil.dimononon.com](https://anvil.dimononon.com)**

---

## Features

- **Instant Optimal Step Solver**: A* / BFS pathfinding engine that finds the minimum number of hammer actions and groups consecutive hits while strictly satisfying all mandatory forging rules (e.g. `punch_last`, `draw_second_last`, `upset_third_last`).
- **Authentic TFC 128-bit PRNG Calculation**: Computes exact target progress (`40` to `113`) directly from World Seed and Recipe ID via MD5 hashing and `Xoroshiro128PlusPlus` PRNG.
- **Metal Recipe Browser**:
  - **Categorized Sorting**: Recipes grouped by metal families and sorted logically (`Basic Stock` → `Small Parts & Fasteners` → `Tool & Instrument Heads` → `Armor` → `Utility`).
  - **Live Search**: Case-insensitive filtering by input and output IDs/names with automatic group expansion.
  - **Light Theme & Pixel-Perfect Icons**: Texture-mapped item atlas icons and pixel-perfect TFC GUI graphics.
- **Preset Support**: Vanilla TFC and TerraFirmaGreg (TFG).
- **Asynchronous Execution**: Non-blocking calculations keep the UI responsive.

---

## Operating Modes & Roadmap

### Implemented Features
- [x] **Minimal Information Mode**: Select any recipe from the GUI. The application automatically calculates target progress using your World Seed and outputs the optimal sequence of actions.
- [x] **Preset Selector**: Preset support for Vanilla TFC and TerraFirmaGreg (TFG).
- [x] **Categorized Recipe Browser**: Live search and group expansion for fast recipe lookups.
- [x] **Pixel-Perfect Anvil GUI**: Replicating TFC anvil screen, chevron markers, and grouped action sequence overlays.
- [x] **Craft History**: Left sidebar log of up to 20 recent recipe calculations with input/result icons, up to 6 grouped action steps, local storage persistence, deduplication, and automatic recalculation on world seed change.
- [x] **Mobile Adaptive UI**: Fully responsive layout optimized for mobile viewports and small screens.

### Work in Progress (`WIP`)
- [ ] **Pinned Recipes (`WIP`)**: Pin favorite or frequently used recipes.
- [ ] **Vanilla TFC-like UI (`WIP`)**: Authentic in-game TFC GUI theme option.
- [ ] **Manual Target Value Mode (`WIP`)**: Select a recipe and manually enter the target progress value (useful when using target progress reader texture packs).
- [ ] **Full Manual Mode / Custom Recipe Mode (`WIP`)**: Manually input custom mandatory forging rules and target progress values for custom or unlisted recipes.

---

## Technology Stack

- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Styling**: Vanilla CSS (Light Theme, Pixel-Perfect Canvas Scaler)
- **Deployment**: GitHub Actions → GitHub Pages ([anvil.dimononon.com](https://anvil.dimononon.com))

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Dimononon/tfc-anvil-helper.git
cd tfc-anvil-helper

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```
