# Sanplayz — Adaptive Roulette Mathematics & Statistical Analysis Engine

An educational, deterministic mathematical and statistical analysis platform for roulette probability modeling, Bayesian posterior updating, Markov chain transition analysis, out-of-sample prediction tracking, and adaptive training memory.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)
![Tests](https://img.shields.io/badge/tests-32%20passed-brightgreen)

---

## 🎯 Key Capabilities

- **Single-Focus Sureshot Engine**:
  - Focuses exclusively on **ONE** high-probability outcome (either Color OR Parity, never both).
  - Enforces a strict confidence threshold ($\ge 80\% - 94\%$).
  - Instructs players to **WAIT** and gather spins until mathematical convergence conditions align.
  - Secondary cards clearly label neutral states: `NEUTRAL — NO BET (<75% EDGE)` to eliminate ambiguous wagers.

- **Persistent Multi-Table Model Training**:
  - Lifetime spin results are stored persistently in IndexedDB via Dexie.js.
  - Starting a new table (`New Table (Save & Train)`) resets active table spins while preserving historical memory for continuous Bayesian updating and model calibration.

- **Mobile-First Casino Layout**:
  - Dedicated mobile tab switcher (`⚡ Sureshot Signal`, `📜 Sliding & Logs`, `📊 Deep Math`).
  - Minimum $48\text{px}$ touch targets for rapid single-touch wheel number entry ($1$–$36$).
  - Clean responsive layout for both phones and desktop multi-column screens.

- **Rigorous Mathematical & Statistical Modeling**:
  - **Deterministic Mapping**: Standard European/French wheel numbers $1$–$36$ mapped to exact color and parity.
  - **Bayesian Posterior Updating**: Beta-Binomial conjugate updating for color and parity distribution.
  - **Markov State Transitions**: First-order transition probabilities tracking hot/cold state shifts.
  - **Randomness Hypothesis Testing**: Pearson Chi-Square Goodness-of-Fit and Wald-Wolfowitz Runs Test for non-random clustering.
  - **House Edge & EV Calculator**: Theoretical vs. empirical house edge analysis with payout multipliers.

---

## 🛠 Tech Stack

- **Core**: React 19, TypeScript, Vite 8
- **Styling**: Vanilla Modern CSS (Tailored dark mode, glassmorphism, responsive grid)
- **Local Persistence**: IndexedDB via Dexie.js
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library, JSDOM, Fake-IndexedDB
- **Linter**: Oxlint

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/SanthoshR16/Sanplayz.git

# Navigate to project folder
cd Sanplayz

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Tests & Linting

```bash
# Run Vitest test suites (11 files, 32 tests)
npm test

# Build production bundle
npm run build

# Run fast Oxlint
npm run lint
```

---

## 📜 Educational Disclaimer

This application is created strictly for **mathematical education, statistical exploration, and probability modeling**. Roulette outcomes in certified physical and random number generator (RNG) wheels are independent trials governed by casino house advantage. No statistical algorithm can eliminate or overcome the long-term mathematical house edge. Bet responsibly.
