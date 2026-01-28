# Kivo Graph Next

**Kivo Graph Next** is a robust, interactive software architecture visualization tool built with **Next.js 16**. It is designed to ingest raw dependency data (nodes and edges), automatically classify components into functional modules (like HRMS, CRM, ATS), and render them in a force-directed graph using **Cytoscape.js**.

It features user authentication, persistent graph state management, and a high-performance rendering engine capable of handling complex dependency networks.

## 🚀 Key Features

- **Interactive Visualization:** Zoom, pan, drag, and explore dependency graphs using a high-performance canvas.
- **Automatic Clustering:**
- **Module Classification:** Automatically groups nodes (e.g., Controllers, Services) into functional modules (HRMS, ATS, CRM, etc.) based on keyword analysis.
- **Smart Layout:** Uses the `fCoSE` (Fast Compound Spring Embedder) algorithm for organized, non-overlapping layouts.

- **Graph Interaction:**
- Click to highlight connections and view neighbor details.
- Search nodes by name.
- Filter by module or complexity.
- Export graph snapshots as images.

- **State Management:** Persists graph data and UI state (Dark mode, filters) using **Zustand**.
- **Authentication:** Secure user access via **NextAuth.js (v5)** with **MongoDB** storage.
- **Modern UI:** Built with **Tailwind CSS v4** and **Lucide React** icons, supporting fully dynamic Dark/Light themes.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Graph Engine:** [Cytoscape.js](https://js.cytoscape.org/)
- Plugins: `cytoscape-fcose`, `cytoscape-expand-collapse`

- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** MongoDB (via Mongoose)
- **Auth:** NextAuth.js v5 (Beta)
- **Utilities:** `clsx`, `tailwind-merge`, `lucide-react`

## 📦 Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/kivo-graph-next.git
cd kivo-graph-next

```

2. **Install dependencies:**

```bash
npm install

```

3. **Environment Setup:**
   Create a `.env` (or `.env.local`) file in the root directory and add the following variables:

```env
# Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/kivo-graph

# NextAuth Configuration
AUTH_SECRET=your_super_secret_key_here # Generate using `openssl rand -base64 32`
NEXTAUTH_URL=http://localhost:3000

```

4. **Run the development server:**

```bash
npm run dev

```

5. **Open the app:**
   Visit [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

## 📊 Data Input Format

The application accepts `.json` files containing an object with `nodes` and `edges` arrays.

**Example `graph.json`:**

```json
{
  "nodes": [
    {
      "data": {
        "id": "AuthService",
        "label": "AuthService",
        "complexity": "normal"
      }
    },
    {
      "data": {
        "id": "LoginController",
        "label": "LoginController"
      }
    }
  ],
  "edges": [
    {
      "data": {
        "source": "LoginController",
        "target": "AuthService",
        "type": "dependency"
      }
    }
  ]
}
```

### Automatic Classification Logic

The system (`src/utils/graphUtils.ts`) automatically classifies nodes into groups based on their `id` or `label` using the following keyword mapping:

| Module Category | Keywords Detected                                                   |
| --------------- | ------------------------------------------------------------------- |
| **HRMS**        | `attend`, `leave`, `holiday`, `shift`, `salary`, `payroll`          |
| **ATS**         | `candid`, `interview`, `application`, `hiring`, `resume`, `recruit` |
| **CRM**         | `deal`, `lead`, `invoice`, `quote`, `crm`, `client`, `bill`         |
| **Projects**    | `project`, `sprint`, `story`, `epic`, `task`, `kanban`              |
| **Comm**        | `chat`, `message`, `channel`, `email`, `notif`, `comm`              |
| **AI**          | `ai_`, `voice`, `eval`                                              |
| **Core**        | `user`, `company`, `auth`, `login`, `role`, `setting`, `profile`    |
| **Utils**       | _Default if no keywords match_                                      |

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router pages
│   ├── actions/          # Server actions (Auth, User, Company)
│   ├── admin/            # Admin dashboard
│   ├── api/              # API Routes (NextAuth)
│   ├── login/            # Login page
│   └── page.tsx          # Main Graph View
├── components/           # React Components
│   ├── GraphCanvas.tsx   # Main Cytoscape Wrapper
│   ├── UIOverlay.tsx     # Top Navigation & Controls
│   ├── PopupCard.tsx     # Node details popup
│   ├── ZoomDock.tsx      # Zoom controls
│   └── FilterPanel.tsx   # Sidebar filtering
├── lib/                  # Database connection utilities
├── models/               # Mongoose Schemas (User, Company)
├── store/                # Zustand stores (useGraphStore.ts)
└── utils/                # Helper functions
    ├── graphUtils.ts     # Data processing & classification
    ├── graphStyles.ts    # Cytoscape stylesheet
    └── constants.ts      # Colors & Config constants

```
