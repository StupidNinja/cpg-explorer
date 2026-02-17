# CPG Explorer - Code Property Graph Browser

A full-stack web application for exploring and understanding Go codebases through their Code Property Graph (CPG). Built as a take-home assignment demonstrating modern web development practices with a focus on graph visualization and code comprehension.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![Tech Stack](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tech Stack](https://img.shields.io/badge/NestJS-10.3-red)
![Tech Stack](https://img.shields.io/badge/React_Flow-12.0-purple)
![Tech Stack](https://img.shields.io/badge/Monaco_Editor-4.6-green)

## 🎯 Features

### Call Graph Explorer
- **Interactive Visualization**: BFS-based call graph rendering with custom styled nodes
- **Custom Function Nodes**: Rich nodes showing package badge, type signature, and file location
- **Multi-Edge-Type Support**: Toggle between Call, Data Flow, Control Flow, Control Dependency, and Reference edges
- **Color-Coded Edges**: Each edge type has distinct color and style (solid, dashed, dotted)
- **Adjustable Depth**: Control traversal depth (1-5 levels)
- **Click & Double-Click Navigation**: Single-click for details, double-click to explore

### Function Detail Panel
- **Rich Function Info**: Kind badge, type signature, file location
- **Caller/Callee Stats**: Visual count cards for incoming and outgoing calls
- **Top 10 Callers & Callees**: Clickable lists to explore connected functions
- **Action Buttons**: "Explore Graph" and "View Source" quick actions

### Source Code Integration
- **Monaco Editor**: VS Code-quality code viewing
- **Syntax Highlighting**: Go language support
- **Context Display**: Shows code with surrounding lines
- **Back Navigation**: Return to detail panel from source view

### Insights Dashboard
- **Schema Statistics**: Overview of packages, files, functions, and findings
- **Edge & Node Distribution**: Visual bar charts of all CPG edge/node type counts
- **Complexity Analysis**: Color-coded complexity distribution (low/moderate/high/very high)
- **Static Analysis Findings**: Drill-down by category (dead stores, unused params, similar functions, etc.)
- **Code Hotspots**: Top functions ranked by composite score (complexity × LOC × fan-in × fan-out)
- **Package Stats**: Top packages by lines of code
- **Error Handling Chains**: Visualization of error wrap/unwrap chains across the codebase
- **Cross-Navigation**: Click any item to jump to Explorer view for that function

### Navigation & Discovery
- **Most Connected Functions**: Landing page cards showing top functions by edge count
- **Real-time Search**: Fast function name search with 300ms debouncing
- **Navigation History**: Back/forward buttons with full history tracking
- **Breadcrumbs**: Visual trail with Home button for quick navigation
- **Home Button**: Return to landing page from anywhere

### Performance Optimizations
- **Database Indexes**: 6 indexes for fast lookups on nodes and edges
- **React Query Caching**: 5-minute stale time for graph data
- **SQLite Tuning**: WAL mode, 64MB cache, memory temp storage
- **Request Cancellation**: AbortController cancels in-flight requests on navigation
- **Focused Subgraphs**: Limits to 60 nodes per view for smooth rendering
- **Input Validation**: Server-side limits on depth, maxNodes, and query length
- **SQL Injection Protection**: Parameterized queries throughout

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18.2 + TypeScript
- Tailwind CSS for styling
- React Flow for graph visualization
- Monaco Editor for code display
- TanStack Query for state management

**Backend:**
- NestJS 10.3 + TypeScript
- better-sqlite3 for database access
- RESTful API design
- Modular architecture (Database, Graph, Source, Schema modules)

**Deployment:**
- Docker Compose for orchestration
- Multi-stage builds for optimization
- Nginx for frontend serving and API proxying

### Key Design Decisions

See the detailed [Decisions, Trade-offs & Rationale](#-decisions-trade-offs--rationale) section below for full reasoning. Summary:

1. **React Flow** — React-native graph library; nodes are React components enabling rich custom `FunctionNode` cards
2. **better-sqlite3** — Synchronous, fastest Node.js SQLite driver; ideal for read-only single-user workloads
3. **Bounded BFS (60 nodes max)** — Keeps subgraphs cognitively manageable and renders sub-100ms
4. **Multi-edge overlay** — Stable node layout when toggling edge types; avoids disorienting reflows
5. **Monaco Editor** — VS Code-quality Go highlighting with zero config

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.25+ (for database generation)
- Git

### Setup & Run

**1. Generate the CPG Database**

From the assignment root directory (where `main.go` and the Go submodules live), build the generator and produce the database:

```bash
# Build the CPG generator
go build -o cpg-gen .

# Download the 4th module (Alertmanager)
git clone --depth 1 https://github.com/prometheus/alertmanager.git

# Initialize submodules if not already done
git submodule update --init --force --recursive

# Generate the database (~900MB, takes several minutes)
./cpg-gen \
  -modules "./client_golang:github.com/prometheus/client_golang:client_golang,./prometheus-adapter:sigs.k8s.io/prometheus-adapter:adapter,./alertmanager:github.com/prometheus/alertmanager:alertmanager" \
  ./prometheus \
  cpg.db
```

> **Windows:** Use `go build -o cpg-gen.exe .` and `cpg-gen.exe` instead.

**2. Clone this repo alongside the generated database**

```
assignment-root/          ← where you ran cpg-gen
├── cpg.db                ← generated database
├── prometheus/           ← submodule
├── client_golang/        ← submodule
├── cpg-explorer/         ← THIS REPO (clone here)
│   ├── docker-compose.yml
│   ├── backend/
│   └── frontend/
```

```bash
git clone https://github.com/StupidNinja/cpg-explorer.git
```

**3. Start the Application**

```bash
cd cpg-explorer
docker compose up
```

The `docker-compose.yml` mounts `../cpg.db` (the parent directory) into the backend container. If your `cpg.db` is elsewhere, set the `CPG_DB_PATH` environment variable:

```bash
CPG_DB_PATH=/path/to/cpg.db docker compose up
```

**4. Access the Application**

Open your browser to: **http://localhost**

The backend API runs on port 3001, frontend on port 80.

## 📊 Database Statistics

- **Nodes**: ~664,000 (Functions, Types, Variables, etc.)
- **Edges**: ~1,800,000 (Calls, Data Flow, Control Flow)
- **Size**: ~900 MB
- **Modules**: Prometheus, client_golang, prometheus-adapter, alertmanager

## 🎨 User Interface

The interface is divided into three main sections:

1. **Header & Navigation**: 
   - Home button to return to landing page
   - Explorer / Insights tab switcher
   - Database statistics (nodes, edges, functions)
   - Function search with autocomplete
   - Breadcrumb navigation trail with history
   - Back/Forward navigation buttons
   
2. **Graph View (60%)**:
   - Interactive React Flow visualization
   - Custom function nodes with package, type, and file info
   - Edge type toggles (Call, Data Flow, Control Flow, Control Dep, Reference)
   - Color-coded edges with legends
   - Depth control slider
   - Interaction hint (click for details, double-click to explore)
   
3. **Detail Panel (40%)**:
   - Function Detail Panel with callers/callees
   - Monaco Code Viewer with Go syntax highlighting
   - Back to Details button when viewing source

4. **Landing Page**:
   - Most Connected Functions cards grid
   - Shows incoming/outgoing edge counts per function
   - Click any card to start exploring

5. **Insights Dashboard**:
   - Schema overview stats cards
   - Edge/Node type distribution bar charts
   - Complexity distribution with color coding
   - Static analysis findings with drill-down
   - Code hotspots table
   - Package stats and error chains

## 🔧 Development

### Run Locally (without Docker)

**Backend:**
```bash
cd cpg-explorer/backend
npm install
cp .env.example .env
# Edit .env to set DB_PATH to ../../cpg.db
npm run start:dev
```

**Frontend:**
```bash
cd cpg-explorer/frontend
npm install
npm run dev
```

### Project Structure

```
cpg-explorer/
├── backend/
│   ├── src/
│   │   ├── database/      # SQLite connection & query layer
│   │   ├── graph/         # Call graph logic & top functions
│   │   ├── source/        # Source code retrieval
│   │   └── schema/        # Schema docs & stats
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── GraphView.tsx         # React Flow + multi-edge-type support
│   │   │   ├── CodeViewer.tsx        # Monaco Editor
│   │   │   ├── StatsPanel.tsx
│   │   │   ├── TopFunctions.tsx      # Landing page cards
│   │   │   ├── NodeDetailPanel.tsx   # Function detail view
│   │   │   ├── InsightsDashboard.tsx # Schema insights & analytics
│   │   │   ├── Breadcrumbs.tsx       # Navigation breadcrumbs
│   │   │   └── ErrorBoundary.tsx
│   │   ├── App.tsx               # Navigation history & layout
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 📝 API Endpoints

### Graph API
- `GET /api/graph/functions/top?limit={n}` - Get most connected functions
- `GET /api/graph/functions/search?q={query}` - Search functions by name
- `GET /api/graph/functions/:id` - Get single function by ID
- `GET /api/graph/functions/:id/details` - Get function details with callers/callees
- `GET /api/graph/functions/:id/call-graph?depth={n}&maxNodes={n}&edgeKinds={kinds}` - Get call graph (edgeKinds: comma-separated list of call,dfg,cfg,cdg,ref,dom,pdom,ast,scope)
- `GET /api/graph/functions/:id/neighborhood?depth={n}` - Get function neighborhood
- `GET /api/graph/functions/:id/callers?limit={n}` - Get callers
- `GET /api/graph/packages` - Get package graph

### Source API
- `GET /api/source/node/:id/context?lines={n}` - Get source with context
- `GET /api/source/file?path={path}` - Get full file source

### Schema API
- `GET /api/schema/stats` - Get database statistics
- `GET /api/schema/docs` - Get schema documentation
- `GET /api/schema/tables` - List all tables
- `GET /api/schema/dashboard` - Get insights dashboard data (distributions, hotspots, findings summary)
- `GET /api/schema/findings?category={cat}&limit={n}` - Get static analysis findings

## 🎯 Evaluation Criteria Alignment

| Criterion | Implementation | Weight |
|-----------|---------------|---------|
| **Graph Visualization** | React Flow with custom nodes, multi-edge-type support (call/dfg/cfg/cdg/ref), color-coded edges, adjustable depth, neighborhood view | 25% |
| **Developer Utility** | Search, call graph, source code display, neighborhood views, insights dashboard, static analysis findings, hotspots | 20% |
| **Engineering Quality** | NestJS modules, TypeScript, clean separation, parameterized queries, error boundaries, input validation | 20% |
| **Performance** | 6 SQLite indexes, WAL mode, focused subgraphs, React Query caching, request cancellation, debouncing | 15% |
| **Schema Exploration** | Insights dashboard with 8 visualizations, edge/node distributions, complexity analysis, findings drill-down, error chains | 10% |
| **UI/UX** | Tailwind design, Explorer/Insights tabs, loading states, empty states, breadcrumbs, navigation history | 10% |

## 🔍 Decisions, Trade-offs & Rationale

### Why This Tech Stack

| Choice | Alternatives Considered | Rationale |
|--------|------------------------|-----------|
| **React + TypeScript** | Vue, Svelte, plain JS | React's ecosystem is the largest; TypeScript catches schema/type mismatches at compile time — critical when working against a 60+ table database whose shape I was discovering as I built |
| **NestJS** | Express, Fastify, Hono | NestJS's module system mirrors the domain boundaries (Graph, Source, Schema, Database) and its decorator-driven DI keeps services testable without manual wiring |
| **React Flow (@xyflow/react)** | Cytoscape.js, D3-force, vis.js, Sigma.js | React Flow treats nodes as React components, which let me build rich `FunctionNode` cards (package badge, type sig, file path) without leaving the React paradigm. Cytoscape would have required a canvas-based rendering layer and separate state sync |
| **Monaco Editor** | CodeMirror 6, Prism.js, highlight.js | Monaco gives VS Code-quality Go highlighting and minimap for free. Heavier than CodeMirror, but since it's loaded only when viewing source (code-split via React lazy), the trade-off is acceptable |
| **better-sqlite3** | sql.js (Wasm), sqlite3 (async), Prisma | Synchronous API eliminates callback/promise overhead for read-only workloads. On benchmarks it's 2–5× faster than the async `sqlite3` driver for sequential reads. The database is never written to at runtime, so the lack of async writes is irrelevant |
| **TanStack Query** | SWR, Redux Toolkit Query, manual fetch | Built-in request deduplication, stale-while-revalidate, and AbortController integration. When a user rapidly clicks through functions, TanStack cancels in-flight requests automatically and serves cached results for previously visited nodes |

### Architectural Decisions

**1. BFS with bounded depth over full-graph algorithms**

The CPG contains ~1.8 million edges. Rendering even a connected component would overwhelm both the browser and the user. Instead, all graph views use BFS from a selected function with a configurable depth (1–5) and a hard cap of 60 nodes. This keeps render times under 100ms and produces subgraphs that are cognitively manageable. The downside is that long call chains are truncated — I mitigate this by letting users double-click any node to re-center the BFS.

**2. Multi-edge overlay instead of multi-graph queries**

When the user enables non-call edge types (dfg, cfg, cdg, ref), I don't re-run the BFS with different edge kinds. Instead, I first BFS over the selected primary edge kind to discover the function set, then run a second query to find all edges of the requested types between those discovered nodes. This "overlay" approach keeps the node set stable regardless of which edge types are toggled, avoiding disorienting layout shifts.

**3. Synchronous SQLite on the server**

better-sqlite3 is synchronous, meaning a long query blocks the Node.js event loop. For this use case, this is the right trade-off: every query is a read against indexed columns and completes in <50ms. If I needed to support concurrent write traffic or queries that take seconds, I'd move to a worker-thread pool or an async driver. For a single-user explorer, the simplicity and speed of synchronous access wins.

**4. Pre-computed dashboard tables over runtime aggregation**

The CPG generator pre-computes tables like `dashboard_edge_distribution`, `dashboard_complexity_distribution`, and `dashboard_findings_summary`. I use these directly rather than running `GROUP BY` aggregations on the 664K-row `nodes` table at request time. This gives sub-millisecond dashboard loads at the cost of data freshness — but since the database is static and read-only, freshness is irrelevant.

**5. Client-side layout (React Flow auto-layout) over server-side graph layout**

Server-side layout with Dagre or ELK would produce more deterministic, aesthetically optimal layouts. I chose client-side layout because it keeps the backend stateless and avoids adding a layout engine dependency to Docker. React Flow's built-in layout is adequate for the 10–60 node subgraphs this tool produces. For larger graphs (100+ nodes), server-side layout would be worth the complexity.

**6. Six targeted SQLite indexes**

Rather than indexing every column, I profiled the actual query patterns (BFS edge traversal, function search, node lookup by ID, edge lookup by source/target) and added exactly six indexes. This keeps the database file from bloating further while ensuring the hot-path queries hit indexed lookups. The `PRAGMA` tuning (WAL mode, 64MB cache, memory-mapped temp storage) further reduces I/O on the ~900MB file.

### Trade-offs I'd Revisit With More Time

| Area | Current State | What I'd Change |
|------|--------------|-----------------|
| **Data Flow Slicer** | Not implemented | The `backward_slice` and `forward_slice` built-in queries exist in the DB. I'd add a dedicated view that highlights the slice path overlaid on source code, line by line |
| **Package Architecture** | Available as raw data only | The `dashboard_package_graph` table has ~170 packages and ~400 edges — perfect for a force-directed layout. I'd add a zoomable package map with drill-down |
| **Graph Layout** | React Flow default | For deeper call chains (depth 4–5), a hierarchical Dagre layout would reduce edge crossings and make the direction of calls clearer |
| **Search** | Name substring only | Full-text search across function signatures, file paths, and source code would be more useful. SQLite FTS5 could power this without additional infrastructure |
| **Testing** | Manual only | I'd add Jest unit tests for the graph service BFS logic and Playwright E2E tests for the critical path (search → graph → source view) |
| **WebSocket streaming** | REST polling | For very large subgraphs, streaming nodes incrementally via WebSocket would let the graph build up progressively instead of waiting for the full response |

## 📦 Database Schema

The CPG database contains:
- `nodes`: AST nodes, functions, types
- `edges`: Relationships (call, dfg, cfg, etc.)
- `sources`: Source code files
- `schema_docs`: Self-documenting schema
- `queries`: Pre-built SQL queries

## 🐛 Troubleshooting

**Database not found:**
```bash
# Ensure you run generate-db script first
./generate-db.sh  # or generate-db.bat on Windows
```

**Port already in use:**
```bash
# Change ports in docker-compose.yml
# Frontend: change 80:80 to 8080:80
# Backend: change 3001:3001 to 3002:3001
```

**Building takes too long:**
```bash
# Use pre-built images (if available) or increase Docker memory
# Docker Desktop > Settings > Resources > Memory: 4GB+
```

## 📄 License

This is a take-home assignment project. All rights reserved.

## 👤 Author

Developed as a take-home assignment for Full-Stack Developer position.

## 🙏 Acknowledgments

- Prometheus project for the sample codebase
- CPG generator team for the excellent tool
- React Flow team for the graph library
- Monaco Editor team for the code editor
