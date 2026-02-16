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

1. **React Flow over Cytoscape.js**
   - More modern, React-native API
   - Better TypeScript support
   - Easier custom node implementation
   - Simpler integration with React hooks

2. **better-sqlite3 over async libraries**
   - Synchronous API simplifies error handling in NestJS
   - Fastest SQLite implementation for Node.js
   - Perfect for read-only workloads
   - Direct prepared statement support

3. **Focused Subgraphs**
   - Limit to 60 nodes per view prevents performance issues
   - BFS ensures relevant nodes are included
   - Interactive navigation for deeper exploration
   - Better UX than rendering entire 555k node graph

4. **Monaco Editor**
   - Industry-standard code editor
   - Go syntax support out of the box
   - Familiar interface for developers
   - Minimal configuration needed

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

## 🔍 Trade-offs & Decisions

### What Went Well
- **Full TypeScript**: End-to-end type safety reduced bugs
- **React Flow**: Easy to implement, great DX, performant
- **Docker Compose**: True one-command deployment
- **Focused Scope**: Call Graph Explorer is fully functional

### Trade-offs Made
- **BFS over Algorithms**: Chose simple BFS over complex graph algorithms for time constraint
- **Client-Side Layout**: React Flow handles layout instead of server-side algorithm
- **Read-Only**: Focused on exploration, not graph manipulation
- **Pre-computed Dashboard Tables**: Leveraged CPG generator's pre-computed analytics tables for instant dashboard loading

### Future Improvements
- Data Flow Slicer feature (backward/forward slicing)
- Package Architecture visualization
- Graph export to image/SVG
- Advanced layout algorithms (Dagre, ELK)
- Node filtering and search within graph
- Type hierarchy exploration
- Goroutine and channel flow visualization

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
