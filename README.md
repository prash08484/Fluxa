# Fluxa: Video Content AI Agent Platform

> Enterprise-grade AI-driven video content generation platform with multi-step agentic workflows, stateful orchestration, and human-in-the-loop interrupts.

**Version**: 0.1.0 | **Status**: Active Development

---

## Table of Contents

1. [High-Level Design (HLD)](#high-level-design-hld)
2. [Low-Level Design (LLD)](#low-level-design-lld)
3. [Quick Start](#quick-start)
4. [Architecture Diagrams](#architecture-diagrams)

---

## High-Level Design (HLD)

### System Overview

Fluxa is a production-grade AI orchestration platform that automates video content generation through a multi-stage agentic workflow. The system is architected as:

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend Layer                    │
│  (React 19 | Real-time UI | Project Management)              │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
┌───────▼─────────────┐    ┌──────▼────────────────┐
│  REST API Routes    │    │   WebSocket/SSE       │
│  (Next.js Route     │    │   (Real-time updates) │
│   Handlers)         │    │                       │
└───────┬─────────────┘    └──────────────────────┘
        │
        └───────────────────────┬──────────────────────────┐
                                │                          │
                    ┌───────────▼──────────────┐   ┌──────▼──────────────┐
                    │  Agentic Orchestration   │   │  Data Layer         │
                    │  (LangGraph + Agents)    │   │  (MongoDB + Stores) │
                    └───────────┬──────────────┘   └─────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │ LLM Provider │ │   External │ │  File      │
        │ (OpenAI      │ │   Services │ │  Storage   │
        │  gpt-4o)     │ │(Cloudinary)│ │(Cloudinary)│
        └──────────────┘ └────────────┘ └────────────┘
```

### Core Domains

#### 1. **Agentic Workflow Engine** (Service Layer)

The heart of Fluxa is a stateful, human-in-the-loop multi-stage pipeline orchestrated via LangGraph with MongoDB checkpointing:

```
Pipeline Flow:
START
  ├─→ trendsNode (AI discovers trending topics)
  ├─→ ideasNode (AI generates 5-10 content ideas)
  ⏸ [USER INTERRUPT: Pick 1-3 ideas]
  ├─→ analysisNode (AI deep-dives on selected ideas)
  ⏸ [USER INTERRUPT: Select final direction + save others]
  ├─→ scriptNode (AI writes full video script)
  ⏸ [USER INTERRUPT: Approve/regenerate script]
  ├─→ titlesNode (AI generates SEO titles)
  ⏸ [USER INTERRUPT: Pick title + thumbnail count]
  ├─→ descriptionNode (AI writes video description)
  ├─→ thumbnailNode (AI generates thumbnail concepts)
  └─→ END
```

**State Management**: Each interrupt is a checkpoint; state persists to MongoDB via `MongoDBSaver`. Users can pause, resume, and regenerate at any step.

#### 2. **Multi-Tier LLM Architecture**

Three model tiers optimize for cost vs. quality:

| Tier     | Model                    | Use Case                              |
| -------- | ------------------------ | ------------------------------------- |
| `fast`   | gpt-4o-mini (default)    | Structured tasks (SEO, trends, hooks)|
| `smart`  | gpt-4o (default)         | Quality-sensitive (ideas, analysis) |
| `best`   | gpt-4o (default)         | Script generation (highest quality) |

Model resolution happens at runtime via `services/ai/models/router.js`.

#### 3. **Authentication & Authorization**

- **Provider**: NextAuth.js v5 with Google OAuth2
- **Session Strategy**: JWT-based (stateless, scalable)
- **Scope**: User isolation via userId embedded in JWT
- **Future**: Ready for Mongo adapter → server-side session invalidation

#### 4. **Data Persistence**

| System       | Database  | Purpose                       | Schema          |
| ------------ | --------- | ----------------------------- | --------------- |
| Projects     | MongoDB   | User projects & metadata      | Custom schema   |
| Workflows    | MongoDB   | LangGraph state checkpoints   | Thread-based    |
| Library      | MongoDB   | Generated assets (ideas, etc) | Custom schema   |
| Auth         | JWT       | Session (stateless)           | JWT token       |
| Media Assets | Cloudinary| Images, videos                | Cloud storage   |

#### 5. **External Integrations**

| Service     | Purpose                        | Type        |
| ----------- | ------------------------------ | ----------- |
| OpenAI API  | LLM intelligence              | 3rd-party   |
| Cloudinary  | Image/video storage & delivery| 3rd-party   |
| YouTube API | Transcript extraction         | 3rd-party   |

### Data Flow: Create Project → Generate Assets

```
User Action: "Create Project"
    ↓
POST /api/projects
    ↓
Validate input (Zod schema)
    ↓
Auth check (NextAuth JWT)
    ↓
Store project metadata in MongoDB
    ↓
Initialize LangGraph workflow (sessionId = projectId)
    ↓
Invoke trendsNode + ideasNode
    ↓
Checkpoint state to MongoDB
    ↓
Return initial ideas to UI

User Action: "Approve Idea"
    ↓
POST /api/projects/{id} (with selected idea)
    ↓
Update LangGraph state via updateState()
    ↓
Resume graph → analysisNode
    ↓
Deep-dive analysis generated
    ↓
Checkpoint + pause at directionGateNode
    ↓
Return analysis to UI
    ↓
[Cycle repeats: user picks direction → script node → titles → descriptions → thumbnails]
```

---

## Low-Level Design (LLD)

### Module Architecture

#### **1. API Routes Layer** (`src/app/api/`)

**Responsibility**: HTTP handler → business logic → response

```
POST /api/projects
├─ Auth check (middleware)
├─ Validate body (Zod schema)
├─ Create MongoDB document
├─ Invoke runner.start({ sessionId, brief })
└─ Return { project, currentStep, state }

GET /api/projects/{id}
├─ Fetch project + current LangGraph state
└─ Return snapshot

POST /api/projects/{id}/advance
├─ Update LangGraph state via updateState()
├─ Resume execution
└─ Return next snapshot

POST /api/projects/{id}/regenerate
├─ Re-run specific node with user feedback
├─ Stay parked at same interrupt
└─ Return updated outputs
```

**Pattern**: All routes follow the `cfg()` pattern—`{ configurable: { thread_id: sessionId } }` for checkpoint-aware execution.

#### **2. Agentic Services** (`src/services/ai/`)

**Responsibility**: Pure AI orchestration logic, decoupled from HTTP

##### **Graph Orchestrator** (`graph/`)

```javascript
// graph.js
- Builds StateGraph using LangGraph
- Attaches 8 nodes: trends, ideas, analysis, directionGate, script, titles, description, thumbnail
- Returns compiled graph with MongoDB checkpointer
- Exports NODE_TO_STEP mapping for UI

// runner.js (Thin orchestrator)
- start({ sessionId, brief }): Initialize pipeline
- advance({ sessionId, input }): Update state & resume
- regenerate({ sessionId, step, feedback }): Re-run ONE node
- snapshot(sessionId): Get current state + step label

// state.js
- PipelineState: Zod schema defining graph state shape
  {
    brief: string,
    trends: string[],
    ideas: { title, description, angle }[],
    selectedIdeas: string[],
    analysis: string,
    selectedDirection: string,
    script: string,
    scriptFeedback?: string,
    titles: string[],
    selectedTitle: string,
    description: string,
    thumbnails: string[],
    status: 'in_progress' | 'complete' | 'archived'
  }

// nodes.js
- Stateless node executors
- Each node: (state) → { output_key: value, ... }
- Example: ideasNode → calls generateIdeas agent → returns { ideas }
```

##### **Agent Layer** (`agents/`)

Each agent is a **pure function**: input → LLM call → structured output

```javascript
// idea.agent.js
export async function generateIdeas({ brief, selectedTrends, feedback }) {
  const prompt = buildIdeaPrompt(brief, selectedTrends, feedback);
  const response = await llm.call(prompt, { schema: IdeaSchema });
  return { ideas: response.ideas };
}

// script.agent.js
export async function writeScript({ idea, angle, direction, feedback }) {
  const prompt = buildScriptPrompt(idea, angle, direction, feedback);
  const response = await llm.call(prompt, { schema: ScriptSchema });
  return { script: response.script };
}

// Similarly: thumbnail.agent.js, titles.agent.js, etc.
```

**Key Design**: Agents are **deterministic** and **stateless**. All state is managed by the graph.

##### **Prompt Layer** (`prompts/`)

Each prompt is a **module** exporting a `buildPrompt()` function:

```javascript
// ideas.prompt.js
export function buildIdeaPrompt(brief, trends, feedback) {
  return `
    You are a video content strategist.
    
    Context:
    - User brief: ${brief}
    - Trending topics: ${trends.join(', ')}
    ${feedback ? `- User feedback: ${feedback}` : ''}
    
    Generate 5-10 unique, viral-worthy video ideas...
    [Instructions, examples, output format]
  `;
}
```

**Rationale**: Separation of concerns—prompt engineering isolated from orchestration logic.

##### **LLM Provider** (`providers/openai.js`)

```javascript
export class OpenAIProvider {
  async call(prompt, { schema, tier = 'smart' }) {
    const model = resolveModel(tier);
    return model.invoke(prompt, { schema });
  }
}
```

**Future-proofing**: Swappable provider interface allows easy migration to Claude, Llama, etc.

#### **3. Data Stores** (`src/services/`)

**Pattern**: Thin adapters around MongoDB collections

```javascript
// services/projects/store.js
export async function createProject({ userId, brief, ...rest }) {
  const project = {
    _id: new ObjectId(),
    userId,
    sessionId: generateUUID(),
    brief,
    createdAt: new Date(),
    ...rest
  };
  return projectsCollection.insertOne(project);
}

export async function listProjects(userId) {
  return projectsCollection.find({ userId }).toArray();
}

// services/library/store.js
export async function saveIdea({ userId, projectId, idea }) {
  return libraryCollection.insertOne({
    userId, projectId, idea,
    savedAt: new Date()
  });
}
```

**Design**: Stores are **query-specific** (no generic DAO). Add new queries as needed.

#### **4. Frontend Layer** (`src/components/`)

**Structure**:

```
components/
├─ app/              # App shell components
│  ├─ Sidebar.js     # Navigation
│  ├─ PageHeader.js  # Breadcrumbs, title
│  ├─ BottomTabs.js  # Mobile nav
│  └─ toolUI.js      # Tool dispatcher
│
├─ canvas/          # Workflow visualizer
│  └─ ProjectWorkspace.js  # Main workflow canvas
│
├─ landing/         # Marketing pages
│  ├─ Hero.js
│  ├─ Features.js
│  └─ Pricing.js
│
└─ ui/              # Reusable primitives
   ├─ Button.js
   └─ CurvedArrow.js
```

**State Management**: React state + server actions (Next.js App Router pattern)

**Key Flows**:

```javascript
// src/app/(app)/projects/[id]/page.js
const [project, setProject] = useState(null);
const [step, setStep] = useState('ideas');

useEffect(() => {
  // Fetch project + LangGraph snapshot
  fetch(`/api/projects/${id}`)
    .then(r => r.json())
    .then(({ project, state }) => {
      setProject(project);
      setStep(state.step);
    });
}, [id]);

const handleApproveIdea = async (idea) => {
  // POST to advance endpoint
  const { state } = await fetch(`/api/projects/${id}/advance`, {
    method: 'POST',
    body: JSON.stringify({ selectedIdeas: [idea.id] })
  }).then(r => r.json());
  
  setStep(state.step);
};
```

#### **5. Authentication & Authorization** (`src/auth.js`)

```javascript
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google(...)],
  session: { strategy: 'jwt' },
  callbacks: {
    session: ({ session, token }) => {
      session.user.id = token.sub;
      return session;
    }
  }
});
```

**Auth Pattern in API Routes**:

```javascript
export async function GET(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Use session.user.id for DB queries
}
```

### State Management: LangGraph Checkpoint Model

**Why Checkpointing?**

1. **Resumability**: User can pause, leave, return days later
2. **Audit Trail**: Every state change is timestamped and versioned
3. **Error Recovery**: Retry failed nodes without recomputing earlier stages

**Checkpoint Schema** (MongoDB):

```javascript
{
  _id: ObjectId,
  thread_id: string,        // sessionId (project ID)
  values: {...},            // Current PipelineState
  next: string[],           // Next nodes to execute
  config: {...},            // LangGraph config
  checkpoint_id: string,    // Version ID
  checkpoint_ns: string,    // Namespace (usually empty)
  created_at: Date,
  updated_at: Date
}
```

**Execution Resume Logic**:

```javascript
// In runner.advance()
const g = await getGraph();
const state = await g.getState(cfg(sessionId)); // Fetch checkpoint
if ((state.next ?? []).length === 0) return snapshot(sessionId);

await g.updateState(cfg(sessionId), input);     // Merge user input
await g.invoke(null, cfg(sessionId));            // Resume execution
```

### Performance & Scaling Considerations

#### **LLM Call Optimization**

- **Batch Processing**: Ideas generated in parallel where possible
- **Token Budgeting**: Use `fast` tier for filtering, `best` tier only for final script
- **Caching**: Consider LLM response caching for identical briefs (future)

#### **Database Queries**

- **Indexing**: `userId`, `sessionId` indexed for fast lookups
- **Pagination**: List endpoints support `limit` / `skip` (future)
- **Connection Pooling**: MongoDB client shared across requests

#### **Frontend Optimization**

- **Code Splitting**: Tool components lazy-loaded
- **Image Optimization**: Next.js `Image` component for media
- **Real-time Updates**: Consider WebSocket upgrade for live state sync (future)

### Error Handling & Resilience

#### **Node-Level Errors**

```javascript
// nodes.js pattern:
export async function ideaNode(state) {
  try {
    const { ideas } = await generateIdeas(state);
    return { ideas };
  } catch (err) {
    console.error('Idea generation failed:', err);
    return { error: 'Failed to generate ideas. Try again.' };
  }
}
```

#### **Graph-Level Recovery**

- **Retry Logic**: Upstream (runner.js) retries failed nodes 2x
- **User Feedback Loop**: regenerate() allows user to provide hints for failed steps

#### **API Layer Error Responses**

```javascript
{
  success: boolean,
  data?: object,
  error?: {
    code: string,       // e.g., 'UNAUTHORIZED', 'INVALID_INPUT', 'RATE_LIMIT'
    message: string,
    details?: object    // e.g., Zod error flatten()
  }
}
```

### Security & Compliance

#### **Data Isolation**

- All queries filtered by `userId` from JWT
- No cross-user state leakage (enforced at store layer)

#### **API Security**

- All POST routes require `auth()`
- Input validation via Zod schemas
- Rate limiting: TBD (consider for v1.1)

#### **Secret Management**

```javascript
// .env.local (not committed)
OPENAI_API_KEY=sk-...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
MONGODB_URI=mongodb://...
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- OpenAI API key
- Google OAuth2 credentials

### Setup

```bash
# 1. Clone & install
git clone <repo>
cd Fluxa
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your keys:
#   - OPENAI_API_KEY
#   - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
#   - MONGODB_URI

# 3. Run dev server
npm run dev
# Open http://localhost:3000

# 4. Sign in with Google
# Create a new project → watch the workflow run
```

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...                    # Required
OPENAI_MODEL_FAST=gpt-4o-mini            # Optional
OPENAI_MODEL_SMART=gpt-4o                # Optional
OPENAI_MODEL_BEST=gpt-4o                 # Optional
AI_MOCK=true                             # Optional: use mock data for dev

# NextAuth
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=<random-secret>              # Generate with: openssl rand -base64 32

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@...
MONGO_DB=fluxa                           # Optional, defaults to 'vidagent'

# Cloudinary (future)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Scripts

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production server
```

---

## Architecture Diagrams

### Request/Response Cycle: Create & Advance Project

```
┌────────────────────────────────────────────────────────────────┐
│                          User Action                           │
│                  "Create New Project"                          │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                  ┌────────▼────────┐
                  │ POST /api/      │
                  │ projects        │
                  └────────┬────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐    ┌───────▼──────┐  ┌──────▼──────┐
    │   Auth  │    │   Zod        │  │   MongoDB   │
    │  Check  │    │  Validate    │  │   Store     │
    └────┬────┘    └───────┬──────┘  └──────┬──────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              ┌────────────▼────────────┐
              │  runner.start()         │
              │  - Init LangGraph       │
              │  - trendsNode           │
              │  - ideasNode            │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  MongoDB Checkpoint     │
              │  (state + next pause)   │
              └────────────┬────────────┘
                           │
                  ┌────────▼────────┐
                  │ Return Response │
                  │ { ideas, step } │
                  └─────────────────┘
```

### Component Dependency Graph

```
next.js App Router
    ├─ (app)/layout.js
    │   ├─ Sidebar.js
    │   ├─ PageHeader.js
    │   └─ BottomTabs.js
    │
    ├─ projects/[id]/page.js
    │   └─ ProjectWorkspace.js
    │       ├─ toolUI.js (dispatcher)
    │       │   ├─ IdeasTool.js
    │       │   ├─ ScriptTool.js
    │       │   ├─ ThumbnailTool.js
    │       │   └─ AnalyzeTool.js
    │       └─ API calls: /api/projects/*
    │
    └─ (marketing)/page.js
        ├─ Hero.js
        ├─ Features.js
        ├─ Pricing.js
        └─ CTA.js

API Routes → runner.js → graph.js → nodes.js → agents/

Services:
  ├─ ai/
  │   ├─ config.js
  │   ├─ graph/
  │   ├─ agents/
  │   ├─ prompts/
  │   ├─ providers/
  │   └─ models/router.js
  ├─ projects/store.js
  ├─ library/store.js
  ├─ db/mongo.js
  └─ storage/cloudinary.js
```

### Interrupt Points & User Decision Nodes

```
START ──→ Trends ──→ Ideas
                        │
                   ⏸ [INTERRUPT 1]
                   User: Pick 1-3 ideas
                        │
                    Analysis ──┐
                               │
                    ⏸ [INTERRUPT 2]
                   User: Confirm direction
                               │
                    Script ────┤
                        │      │
              ┌─────────┴──────┘
         ┌────▼───────┐
    ⏸ [INTERRUPT 3] (Approve/Regenerate)
    User: Review script
              │
         Titles ─────┐
              │      │
         ⏸ [INTERRUPT 4]
        User: Pick title
              │
       Description ──┤
              │      │
        Thumbnail ──┘
              │
             END
```

---

## Development Roadmap

### v0.2 (Next Sprint)
- [ ] WebSocket support for real-time state sync
- [ ] Batch idea regeneration with user feedback loop
- [ ] Analytics dashboard (trends, user paths)

### v0.3
- [ ] Multi-language support (prompts)
- [ ] Platform-specific optimizations (TikTok, Instagram)
- [ ] Advanced template system for scripts

### v1.0 (Production)
- [ ] Payment integration (Stripe)
- [ ] Rate limiting & quota system
- [ ] Mobile app (React Native)
- [ ] Multi-LLM support (Claude, Llama)

---

## Support & Contributing

For issues, questions, or contributions, please see [CONTRIBUTING.md](./CONTRIBUTING.md) (TBD).

---

**Last Updated**: January 2026 | **Maintained By**: Fluxa Team
