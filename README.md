# Kivo Dependency Graph Project

**Kivo Dependency Graph Project** is a robust, interactive software architecture visualization tool built with **Next.js**. It is designed to ingest raw dependency data (nodes and edges), automatically classify components into functional modules (like HRMS, CRM, ATS), and render them in a force-directed graph using **Cytoscape.js**.

It features comprehensive **Multi-Tenant Access Control**, **Role-Based Administration**, and a **Ruby-based Data Extraction** engine, making it suitable for visualizing complex enterprise architectures.

## 🚀 Key Features

### 1. Interactive Graph Visualization

- **High-Performance Rendering:** Visualizes complex dependency networks using `cytoscape-fcose` for organized, non-overlapping layouts.
- **Smart Interaction:**
  - **Zoom & Pan:** Smooth navigation with scroll and drag gestures.
  - **Node Focus:** Click to highlight connections and view neighbor details in a popup.
  - **Search:** Real-time search with autocomplete to jump to specific nodes.
  - **Context Menus:** Right-click interactions for admins (Add/Edit/Delete).
- **Export Options:** - Download current graph state as **JSON**.
  - Export visualization as high-resolution **JPG**.

### 2. Administrative Dashboard

A powerful admin panel (`/admin`) for managing the system's data and security.

- **Graph Management:**
  - **File Upload:** Upload `.json` graph files. The system versions every upload in a `GraphLog`.
  - **Manual Modification:** Add nodes, create edges, or delete elements manually via the UI.
  - **Activity History:** View a timeline of all uploads and manual modifications (e.g., "Manual Add: Node X", "Manual Disconnect: A -> B").
- **User Management:**
  - View all registered users.
  - **Role Assignment:** Promote/Demote users (Admin vs. User).
  - Delete user accounts.
- **Module Management:**
  - Create **Custom Modules** with specific color coding.
  - Delete unused modules.
- **Company & Policy Management:**
  - **Multi-Tenancy:** Create profiles for different companies.
  - **Access Policies:** Configure exactly which **Modules** (e.g., HRMS, Finance) and specific **Features** a company is allowed to view.

### 3. Advanced Filtering & Topology

- **Dynamic Filtering:** Filter the graph by:
  - **Modules:** (e.g., Core, Services, API).
  - **Risk Levels:** High complexity vs. Normal.
  - **Topology:** Isolates, Hubs, or Leaf nodes.
  - **Layers:** Archetypes like Controllers, Models, Views.
- **Visual Feedback:** - **Dark/Light Mode:** Fully dynamic theming using Tailwind CSS v4.
  - **Complexity Indicators:** Visual cues for "High Complexity" nodes.

### 4. Data Extraction Engine (Ruby)

Includes a custom Ruby script (`final_script.rb`) to reverse-engineer Rails applications into graph data.

- **Complexity Analysis:** Calculates node weight based on Lines of Code (LOC).
- **Inheritance Detection:** Identifies `class < Parent` relationships (Strong Links).
- **Usage Detection:** Scans for constant references to map dependencies (Weak Links).
- **Smart Naming:** Converts file paths (e.g., `app/models/admin/user.rb`) into proper class names (`Admin::User`).

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Graph Engine:** [Cytoscape.js](https://js.cytoscape.org/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** MongoDB (via Mongoose)
- **Auth:** NextAuth.js v5 (Beta)
- **Icons:** Lucide React

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/w3villa-kunj-bhatia/kivo-graph-next.git](https://github.com/w3villa-kunj-bhatia/kivo-graph-next.git)
   cd kivo-graph-next
   ```

2. **Install dependencies:**

```bash
npm install

```

3. **Environment Setup:**
   Create a `.env` (or `.env.local`) file in the root directory:

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
   Visit `http://localhost:3000` in your browser.

## 📊 Data Input & Ruby Script Usage

### Option 1: Manual JSON Upload

The application accepts `.json` files via the Admin Dashboard.

**Format:**

```json
{
  "nodes": [
    {
      "data": {
        "id": "User",
        "label": "User",
        "module": "Core",
        "complexity": "normal"
      }
    }
  ],
  "edges": [
    {
      "data": {
        "source": "UserController",
        "target": "User",
        "type": "usage"
      }
    }
  ]
}
```

### Option 2: Ruby Extraction

To generate a graph from an existing Ruby on Rails project:

1. Copy `Ruby Script/final_script.rb` to your Rails project root.
2. Run the script:

```bash
ruby final_script.rb

```

3. This will generate `architecture_map.json`.
4. Upload this file in the **Admin Dashboard** > **Graph Activity** tab.

## 📂 Project Structure

```bash
src/
├── app/
│   ├── actions/          # Server Actions (Graph CRUD, User, Company, Policy)
│   ├── admin/            # Admin Dashboard (Companies, Users, Logs)
│   ├── api/              # API Routes (NextAuth)
│   ├── login/            # Authentication Pages
│   └── page.tsx          # Main Graph View
├── components/
│   ├── GraphCanvas.tsx   # Core Cytoscape Renderer
│   ├── UIOverlay.tsx     # Navigation & Controls
│   ├── FilterPanel.tsx   # Sidebar Filters
│   ├── GraphEditor/      # Modals for Node creation/editing
│   └── ...
├── lib/                  # DB Connect
├── models/               # Mongoose Schemas (User, Company, GraphLog, AccessPolicy)
├── store/                # Zustand (Graph State, Theme, Filters)
└── utils/                # Graph algorithms & Styles
