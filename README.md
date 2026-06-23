# BIM Clash Manager

> Professional Navisworks Clash Detection Management Dashboard

A portfolio-grade BIM coordination tool that parses Navisworks clash detection XML reports and provides an interactive management dashboard with integrated 3D Speckle viewer.

![BIM Clash Manager Screenshot](screenshot-placeholder.png)

## Features

- **XML Parsing** — Upload Navisworks clash detection XML reports (supports 1,400+ clashes)
- **KPI Dashboard** — Real-time clash statistics by severity, discipline, and floor
- **Interactive Charts** — Stacked bars by discipline/floor, donut status distribution (Recharts)
- **Advanced Filtering** — Search + multi-select filters by test, status, severity, floor, discipline, IFC type
- **Clash Table** — Sortable, paginated table with inline status management
- **Detail Panel** — Full clash metadata, object properties, assignment & comments
- **Status Management** — Track clash resolution workflow (Active → Reviewed → Approved → Resolved)
- **3D Viewer** — Speckle viewer integration for visual clash inspection
- **CSV Export** — Export filtered clash data for reporting
- **LocalStorage Persistence** — Status overrides survive browser refresh
- **Responsive Design** — Works on desktop and tablet screens

## Tech Stack

- **React 18** + **Vite** — Fast development & build
- **Tailwind CSS v4** — Utility-first styling
- **Recharts** — Interactive data visualization
- **fast-xml-parser** — Efficient XML parsing
- **Lucide React** — Premium icon system
- **@speckle/viewer** — 3D BIM model viewer
- **Vercel** — Deployment target

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repository
git clone <repo-url>
cd ClashDetectionApp

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

## How to Use

1. **Upload** — Drop your Navisworks XML clash report or click "Load Demo Data"
2. **Analyze** — Review KPIs and charts for clash distribution patterns
3. **Filter** — Narrow down clashes by discipline, floor, severity, or status
4. **Triage** — Click any clash row to see full details, update status, assign team members
5. **Export** — Download filtered results as CSV for coordination meetings

## Clash Data

The app processes Navisworks Manage clash detection reports with this structure:

- **3 Clash Tests**: ARC vs STR (322), ARC vs MEP (833), STR vs MEP (312)
- **1,467 total clashes** across 3 IFC discipline models
- **5 floor levels**: Foundation, Ground, First, Second, Roof
- **Severity classification**: Critical (>50mm), Major (10-50mm), Minor (<10mm)

## 3D Viewer Setup

To enable Speckle 3D viewer integration:

1. Upload your IFC models to [Speckle](https://speckle.systems)
2. Update `src/config/speckle.js` with your stream URL
3. Restart the dev server

## Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Project Structure

```
src/
├── App.jsx                    # Root component
├── main.jsx                   # Entry point
├── index.css                  # Design system
├── components/
│   ├── Header.jsx             # App header + project info
│   ├── KpiCards.jsx           # 5 KPI summary cards
│   ├── ChartsSection.jsx      # 3 Recharts visualizations
│   ├── FilterPanel.jsx        # Filter controls sidebar
│   ├── ClashTable.jsx         # Sortable paginated table
│   ├── ClashDetailPanel.jsx   # Clash detail slide-over
│   ├── SpeckleViewer.jsx      # 3D model viewer
│   └── UploadZone.jsx         # Drag-drop XML upload
├── config/
│   └── speckle.js             # Speckle viewer config
├── hooks/
│   └── useClashData.js        # State management
├── utils/
│   ├── parseXml.js            # XML parser
│   ├── filterClashes.js       # Filter engine
│   └── exportCsv.js           # CSV export
└── lib/
    └── utils.js               # Utility helpers
```

## License

MIT

---

*Built by Mutahir Saeed — BIM/VDC Engineer*
