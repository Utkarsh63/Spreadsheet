# Trademarkia Sheets — Production-Grade Project Plan

> **Assignment**: Real-time collaborative spreadsheet (Google Sheets, stripped to essentials)
> **Stack**: Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Firebase
> **Deployment**: Vercel
> **Principles**: SOLID · Clean Architecture · DRY · Separation of Concerns

---

## Table of Contents

1. [Project Overview & Goals](#1-project-overview--goals)
2. [Technology Decisions & Justifications](#2-technology-decisions--justifications)
3. [Project Structure](#3-project-structure)
4. [Environment & Configuration Strategy](#4-environment--configuration-strategy)
5. [Phase 1 — Foundation & Tooling](#5-phase-1--foundation--tooling)
6. [Phase 2 — Firebase Setup & Security](#6-phase-2--firebase-setup--security)
7. [Phase 3 — Type System & Contracts](#7-phase-3--type-system--contracts)
8. [Phase 4 — Data Layer (Services)](#8-phase-4--data-layer-services)
9. [Phase 5 — State Management](#9-phase-5--state-management)
10. [Phase 6 — Authentication & Identity](#10-phase-6--authentication--identity)
11. [Phase 7 — Core UI Components](#11-phase-7--core-ui-components)
12. [Phase 8 — Spreadsheet Engine](#12-phase-8--spreadsheet-engine)
13. [Phase 9 — Real-time Sync & Presence](#13-phase-9--real-time-sync--presence)
14. [Phase 10 — Bonus Features](#14-phase-10--bonus-features)
15. [Phase 11 — Quality, Testing & Hardening](#15-phase-11--quality-testing--hardening)
16. [Phase 12 — Deployment & CI/CD](#16-phase-12--deployment--cicd)
17. [SOLID Principles Applied](#17-solid-principles-applied)
18. [Git Commit Strategy](#18-git-commit-strategy)
19. [Final Submission Checklist](#19-final-submission-checklist)

---

## 1. Project Overview & Goals

### What We Are Building

A **lightweight, real-time collaborative spreadsheet** application with:

| Feature | Priority | Notes |
|---|---|---|
| Document dashboard | Required | List, create, open documents |
| Scrollable editable grid | Required | Rows numbered, columns lettered |
| Formula support (`=SUM`, arithmetic) | Required | Must justify parser depth |
| Real-time sync across sessions | Required | Non-negotiable |
| Write-state indicator | Required | Users see if changes landed |
| Multi-user presence | Required | Active users visible in UI |
| Google sign-in + guest display name | Required | Firebase Auth |
| Zero TypeScript errors on build | Required | Non-negotiable |
| Cell formatting (bold, italic, colour) | Bonus | |
| Column/row resize | Bonus | |
| Keyboard navigation | Bonus | Arrow, Tab, Enter |
| Column/row reorder by drag | Bonus (Extra) | |
| Export (CSV / XLSX) | Bonus | |

### Evaluation Weights (from assignment)

| Area | Weight |
|---|---|
| Functionality — does it work under concurrent use? | 30% |
| Architecture — server/client boundaries, App Router patterns, data flow | 25% |
| Code quality — strict TypeScript, clean components, no unnecessary abstractions | 20% |
| Real-time behaviour — sync correctness, conflict handling, edge cases | 15% |
| Documentation — README, commit narrative, demo clarity | 10% |

---

## 2. Technology Decisions & Justifications

### Next.js 14 App Router

- **Why**: Server Components reduce client bundle size. Route groups enable clean layout separation between auth pages and the editor. Streaming and Suspense improve perceived performance.
- **Server vs Client boundary rule**: Everything that touches Firebase client SDK must be a Client Component (`'use client'`). Layout shells, loading skeletons, and static wrappers stay as Server Components.

### TypeScript — Strict Mode

- **Why**: The assignment explicitly forbids ignoring TypeScript errors. Strict mode catches `undefined` access, null bugs, and incorrect prop types at compile time.
- **Config additions**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns` — all enabled.

### Firebase (Firestore + Realtime Database + Auth)

- **Firestore**: Stores document metadata and cell data. Chosen for its real-time `onSnapshot` listeners, offline support, and subcollection structure.
- **Realtime Database**: Stores ephemeral presence data (who is online, which cell they are on). Chosen because it is optimised for fast, frequent writes and has native `onDisconnect` hooks — perfect for presence.
- **Auth**: Google OAuth + anonymous sign-in with display name. Zero backend required.

### Why Firestore for cells, not Realtime DB?

Firestore subcollections (`documents/{id}/cells/{cellId}`) give us per-cell granularity. Each cell is a separate document — only the changed cell triggers a listener update across clients. Realtime DB would require downloading the entire sheet on any change.

### Zustand + Immer

- **Zustand**: Minimal boilerplate, no Context Provider wrapping needed, excellent TypeScript inference.
- **Immer**: Allows mutating draft state safely inside Zustand actions — critical for updating individual cells in a large grid without spreading the entire state.

### Tailwind CSS

- Utility-first, no CSS files to maintain, built-in dark mode, and PurgeCSS in production.

### pnpm

- Faster installs than npm, strict node_modules (prevents phantom dependency bugs), better monorepo support.

---

## 3. Project Structure

```
trademarkia-sheets/
├── .env.development.local          # Dev Firebase keys (gitignored)
├── .env.production.local           # Prod Firebase keys (gitignored)
├── .env.example                    # Template committed to git
├── .eslintrc.json
├── .prettierrc
├── .husky/
│   └── pre-commit                  # lint-staged hook
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
└── src/
    ├── app/                        # Next.js App Router — pages only
    │   ├── layout.tsx              # Root layout (providers)
    │   ├── globals.css
    │   ├── (auth)/                 # Route group — no shared layout with editor
    │   │   └── login/
    │   │       └── page.tsx
    │   ├── dashboard/
    │   │   ├── layout.tsx          # Dashboard shell (nav, header)
    │   │   ├── page.tsx            # Document list
    │   │   └── loading.tsx         # Skeleton loader (Suspense)
    │   └── document/
    │       └── [id]/
    │           ├── layout.tsx      # Editor shell
    │           ├── page.tsx        # Spreadsheet editor
    │           └── loading.tsx
    │
    ├── components/                 # Reusable UI — never import from app/
    │   ├── auth/
    │   │   ├── AuthProvider.tsx    # Context: current user, loading state
    │   │   ├── LoginForm.tsx       # Google + guest sign-in UI
    │   │   └── AuthGuard.tsx       # Redirect unauthenticated users
    │   ├── dashboard/
    │   │   ├── DocumentCard.tsx
    │   │   ├── DocumentList.tsx
    │   │   └── CreateDocumentButton.tsx
    │   ├── spreadsheet/
    │   │   ├── Grid.tsx            # Outer scroll container + row/col headers
    │   │   ├── Cell.tsx            # Individual editable cell
    │   │   ├── FormulaBar.tsx      # Active cell formula display/edit
    │   │   ├── Toolbar.tsx         # Formatting buttons (bold, italic, colour)
    │   │   └── ColumnHeader.tsx    # Lettered column header row
    │   ├── presence/
    │   │   ├── UserAvatars.tsx     # Stacked avatars of online users
    │   │   └── CellCursor.tsx      # Coloured cursor overlay per user
    │   └── ui/                     # Primitive components (design system)
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       ├── Spinner.tsx
    │       ├── Tooltip.tsx
    │       └── WriteStateIndicator.tsx
    │
    ├── lib/                        # Non-UI logic — pure functions, hooks, config
    │   ├── firebase/
    │   │   ├── config.ts           # Firebase app init (singleton)
    │   │   ├── auth.ts             # Auth functions
    │   │   ├── firestore.ts        # Firestore helpers
    │   │   └── realtime.ts         # Realtime DB helpers
    │   ├── hooks/
    │   │   ├── useAuth.ts          # Reads from AuthContext
    │   │   ├── useDocument.ts      # Subscribe to single document metadata
    │   │   ├── useCells.ts         # Subscribe to all cells of a document
    │   │   ├── usePresence.ts      # Subscribe to + publish presence
    │   │   └── useFormula.ts       # Formula evaluation hook
    │   ├── store/
    │   │   ├── spreadsheet.store.ts
    │   │   └── ui.store.ts         # UI state (selected cell, toolbar open, etc.)
    │   ├── types/
    │   │   └── index.ts            # All shared TypeScript interfaces
    │   └── utils/
    │       ├── cell.utils.ts       # cellId parsing (A1 → {col:0, row:0})
    │       ├── color.utils.ts      # Assign deterministic user colours
    │       ├── formula.ts          # Formula parser/evaluator
    │       └── export.ts           # CSV / XLSX export logic
    │
    └── services/                   # Business logic — one concern per file
        ├── document.service.ts     # CRUD for SpreadsheetDocument
        ├── cell.service.ts         # Read/write individual cells
        └── presence.service.ts     # Publish/subscribe presence via RTDB
```

### Structure Rules (enforce via ESLint if possible)

1. `app/` only contains pages, layouts, and loading files. No business logic.
2. `components/` never imports from `services/` directly — use hooks.
3. `services/` never imports from `components/` or `app/`.
4. `lib/firebase/config.ts` is the **only** place Firebase is initialised.
5. All types live in `lib/types/index.ts`. No inline `interface` in component files.

---

## 4. Environment & Configuration Strategy

### Files

| File | Committed? | Purpose |
|---|---|---|
| `.env.example` | ✅ Yes | Template with empty values, documents required keys |
| `.env.development.local` | ❌ No | Dev Firebase project keys |
| `.env.production.local` | ❌ No | Prod Firebase project keys |

### Why Two Firebase Projects?

Use a **separate Firebase project for development and production**. This prevents test data polluting production Firestore, and lets you use laxer security rules in dev without risk.

### Environment Variables Required

```bash
# Firebase Web SDK (client-side — safe to expose, prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000  # set to Vercel URL in prod
```

> **Security note**: Firebase client keys are safe to expose — they identify your project. Security is enforced via Firebase Security Rules, not by hiding the keys.

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fail the build on TypeScript errors (enforces assignment requirement)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Fail the build on ESLint errors
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
```

---

## 5. Phase 1 — Foundation & Tooling

**Goal**: Clean, linted, typed project that builds with zero errors before writing any feature code.

### Step 1.1 — Scaffold

```bash
pnpm create next-app@latest trademarkia-sheets \
  --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"
cd trademarkia-sheets
```

### Step 1.2 — Install Dependencies

```bash
# Firebase
pnpm add firebase

# State management
pnpm add zustand immer

# UI utilities
pnpm add clsx tailwind-merge class-variance-authority

# Icons
pnpm add lucide-react

# Export support (bonus)
pnpm add xlsx file-saver

# Date formatting
pnpm add date-fns

# Dev tooling
pnpm add -D \
  @types/file-saver \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-config-prettier \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  husky \
  lint-staged
```

### Step 1.3 — TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 1.4 — ESLint (.eslintrc.json)

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "@typescript-eslint/no-floating-promises": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Step 1.5 — Prettier (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Step 1.6 — Husky + lint-staged

```bash
npx husky init
echo 'npx lint-staged' > .husky/pre-commit
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### Step 1.7 — Create Folder Structure

```bash
mkdir -p src/{app/{(auth)/login,dashboard,document/[id]},components/{auth,dashboard,spreadsheet,presence,ui},lib/{firebase,hooks,store,types,utils},services}
```

### Verify Phase 1

```bash
pnpm build   # Must succeed with zero errors
pnpm lint    # Must pass
```

---

## 6. Phase 2 — Firebase Setup & Security

**Goal**: Two Firebase projects configured, security rules locked down, environment variables wired.

### Step 2.1 — Create Firebase Projects

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create **two projects**:
   - `trademarkia-sheets-dev`
   - `trademarkia-sheets-prod`
3. In each project, register a **Web App** and copy the config into the appropriate `.env.*.local` file.

### Step 2.2 — Enable Services (both projects)

| Service | Settings |
|---|---|
| **Authentication** | Enable: Google provider, Email/Password (anonymous not needed — we use guest + display name) |
| **Firestore** | Create database in **production mode**; apply rules below |
| **Realtime Database** | Create database; pick closest region; apply rules below |

### Step 2.3 — Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: is the requester authenticated?
    function isAuth() {
      return request.auth != null;
    }

    // Helper: is the requester the owner?
    function isOwner(ownerId) {
      return request.auth.uid == ownerId;
    }

    // Helper: is the requester a collaborator on this document?
    function isCollaborator(docData) {
      return request.auth.uid in docData.collaborators;
    }

    match /documents/{docId} {
      allow read: if isAuth() && isCollaborator(resource.data);
      allow create: if isAuth() && isOwner(request.resource.data.ownerId);
      allow update: if isAuth() && isCollaborator(resource.data);
      allow delete: if isAuth() && isOwner(resource.data.ownerId);

      match /cells/{cellId} {
        allow read, write: if isAuth()
          && isCollaborator(get(/databases/$(database)/documents/documents/$(docId)).data);
      }
    }

    match /users/{userId} {
      allow read: if isAuth();
      allow write: if isAuth() && request.auth.uid == userId;
    }
  }
}
```

### Step 2.4 — Realtime Database Rules

```json
{
  "rules": {
    "presence": {
      "$docId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid === $userId"
        }
      }
    }
  }
}
```

### Step 2.5 — Add Auth Domains

In Firebase Console → Authentication → Settings → Authorized domains:
- Add your Vercel preview domain: `*.vercel.app`
- Add your custom domain if applicable

### Step 2.6 — Firebase Config Singleton

```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
} as const;

// Singleton pattern — prevents duplicate init in Next.js hot reload
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);
export default app;
```

---

## 7. Phase 3 — Type System & Contracts

**Goal**: Define every shared data shape before writing any service or component. This is the contract the entire application honours.

**SOLID principle applied**: Interface Segregation — each interface has only the properties its consumers need.

```typescript
// src/lib/types/index.ts

// ─── User ────────────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  color: string;         // deterministic hex assigned on first sign-in
  isAnonymous: boolean;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface SpreadsheetDocument {
  id: string;
  title: string;
  ownerId: string;
  collaborators: string[];  // array of user UIDs
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDocumentInput = Pick<SpreadsheetDocument, 'title' | 'ownerId'>;

// ─── Cell ─────────────────────────────────────────────────────────────────────

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textColor?: string;       // hex string e.g. "#ff0000"
  backgroundColor?: string;
}

export interface CellData {
  id: string;               // e.g. "A1", "C14"
  value: string;            // raw value or formula string
  computed?: string;        // evaluated result (populated client-side)
  format?: CellFormat;
  lastModifiedBy?: string;  // user UID
  lastModifiedAt?: Date;
}

export type CellMap = Record<string, CellData>;

export interface CellPosition {
  col: number;   // 0-indexed
  row: number;   // 0-indexed
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export interface GridDimensions {
  rows: number;
  cols: number;
}

export interface ColumnMeta {
  index: number;
  width: number;   // pixels
  label: string;   // "A", "B", ... "Z", "AA", ...
}

export interface RowMeta {
  index: number;
  height: number;  // pixels
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export interface PresenceUser {
  uid: string;
  displayName: string;
  color: string;
  activeCell: string | null;  // e.g. "B4", null if not on a cell
  lastSeen: number;           // Unix timestamp (ms)
}

// ─── Write State ──────────────────────────────────────────────────────────────

export type WriteState = 'idle' | 'saving' | 'saved' | 'error';

// ─── Formula ──────────────────────────────────────────────────────────────────

export type FormulaResult = string | number;

export interface FormulaError {
  code: '#ERR' | '#DIV0' | '#REF' | '#NAME';
  message: string;
}
```

---

## 8. Phase 4 — Data Layer (Services)

**Goal**: All Firebase read/write operations live in service files. Components never call Firebase directly.

**SOLID principles applied**:
- **Single Responsibility**: Each service owns exactly one domain (documents, cells, presence).
- **Open/Closed**: Services expose stable interfaces; Firebase implementation can swap without touching components.
- **Dependency Inversion**: Components depend on service interfaces, not Firebase SDK directly.

### Step 4.1 — Document Service

```typescript
// src/services/document.service.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SpreadsheetDocument, CreateDocumentInput } from '@/lib/types';

const COL = 'documents';

export const documentService = {
  /**
   * Create a new blank document owned by the given user.
   */
  create: async (input: CreateDocumentInput): Promise<string> => {
    const ref = await addDoc(collection(db, COL), {
      title: input.title,
      ownerId: input.ownerId,
      collaborators: [input.ownerId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /**
   * Update document metadata (e.g. title).
   */
  update: async (
    docId: string,
    data: Partial<Pick<SpreadsheetDocument, 'title' | 'collaborators'>>
  ): Promise<void> => {
    await updateDoc(doc(db, COL, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Permanently delete a document and all its cells.
   * Note: deleting subcollections requires a Cloud Function in production.
   * For this assignment, we delete only the parent document.
   */
  delete: async (docId: string): Promise<void> => {
    await deleteDoc(doc(db, COL, docId));
  },

  /**
   * Subscribe to all documents the user collaborates on.
   * Returns the unsubscribe function for cleanup in useEffect.
   */
  subscribeToUserDocuments: (
    userId: string,
    onData: (docs: SpreadsheetDocument[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, COL),
      where('collaborators', 'array-contains', userId)
    );

    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SpreadsheetDocument, 'id'>),
        }));
        onData(docs);
      },
      onError
    );
  },
};
```

### Step 4.2 — Cell Service

```typescript
// src/services/cell.service.ts
import {
  doc, setDoc, collection, onSnapshot, serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CellData, CellMap } from '@/lib/types';

export const cellService = {
  /**
   * Write or merge a single cell. Using setDoc + merge to avoid
   * overwriting format data when only the value changes.
   */
  updateCell: async (
    docId: string,
    cellId: string,
    data: Partial<Omit<CellData, 'id'>>
  ): Promise<void> => {
    const ref = doc(db, 'documents', docId, 'cells', cellId);
    await setDoc(
      ref,
      { ...data, id: cellId, lastModifiedAt: serverTimestamp() },
      { merge: true }
    );
  },

  /**
   * Subscribe to all cells in a document.
   * Fires immediately with current data, then on every change.
   */
  subscribeToAllCells: (
    docId: string,
    onData: (cells: CellMap) => void,
    onError: (err: Error) => void
  ): Unsubscribe => {
    const ref = collection(db, 'documents', docId, 'cells');
    return onSnapshot(
      ref,
      (snap) => {
        const cells: CellMap = {};
        snap.forEach((d) => {
          cells[d.id] = { ...(d.data() as Omit<CellData, 'id'>), id: d.id };
        });
        onData(cells);
      },
      onError
    );
  },
};
```

### Step 4.3 — Presence Service

```typescript
// src/services/presence.service.ts
import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import type { PresenceUser } from '@/lib/types';

const presenceRef = (docId: string, uid: string) =>
  ref(rtdb, `presence/${docId}/${uid}`);

export const presenceService = {
  /**
   * Announce the user is in this document.
   * Registers onDisconnect cleanup so the record auto-removes
   * if the browser tab closes or network drops.
   */
  join: async (docId: string, user: PresenceUser): Promise<void> => {
    const r = presenceRef(docId, user.uid);
    await onDisconnect(r).remove();
    await set(r, { ...user, lastSeen: Date.now() });
  },

  /**
   * Update which cell this user is currently focused on.
   * Called on every cell selection change — kept cheap (single field).
   */
  updateActiveCell: async (
    docId: string,
    uid: string,
    activeCell: string | null
  ): Promise<void> => {
    const r = presenceRef(docId, uid);
    await set(r, { activeCell, lastSeen: Date.now() });
  },

  /**
   * Explicitly remove user from presence (called on tab unload or sign out).
   */
  leave: async (docId: string, uid: string): Promise<void> => {
    await remove(presenceRef(docId, uid));
  },

  /**
   * Subscribe to all present users in a document.
   * Returns the unsubscribe function.
   */
  subscribe: (
    docId: string,
    onData: (users: PresenceUser[]) => void
  ): (() => void) => {
    const r = ref(rtdb, `presence/${docId}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() as Record<string, PresenceUser> | null;
      onData(data ? Object.values(data) : []);
    });
    return unsub;
  },
};
```

---

## 9. Phase 5 — State Management

**Goal**: Centralised, typed, performant state with Zustand. Never use React `useState` for shared spreadsheet data.

### Design Decisions

- **Two stores**: `spreadsheet.store.ts` (cell data, sync state) and `ui.store.ts` (selected cell, formatting toolbar, etc.). Separating them prevents the entire editor re-rendering when a user just clicks a cell.
- **Immer middleware**: Enables direct mutation of nested objects inside `set()` without spreading the entire `cells` record.
- **Selectors**: All consumers use fine-grained selectors (`useSpreadsheetStore((s) => s.cells['A1'])`) to minimise re-renders.

```typescript
// src/lib/store/spreadsheet.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CellData, CellMap, PresenceUser, WriteState } from '@/lib/types';

interface SpreadsheetState {
  documentId: string | null;
  documentTitle: string;
  cells: CellMap;
  onlineUsers: PresenceUser[];
  writeState: WriteState;
}

interface SpreadsheetActions {
  setDocumentId: (id: string) => void;
  setDocumentTitle: (title: string) => void;
  setCell: (cellId: string, data: CellData) => void;
  setCells: (cells: CellMap) => void;
  setOnlineUsers: (users: PresenceUser[]) => void;
  setWriteState: (state: WriteState) => void;
  reset: () => void;
}

const initialState: SpreadsheetState = {
  documentId: null,
  documentTitle: 'Untitled',
  cells: {},
  onlineUsers: [],
  writeState: 'idle',
};

export const useSpreadsheetStore = create<SpreadsheetState & SpreadsheetActions>()(
  immer((set) => ({
    ...initialState,

    setDocumentId: (id) => set((s) => { s.documentId = id; }),
    setDocumentTitle: (title) => set((s) => { s.documentTitle = title; }),
    setCell: (cellId, data) => set((s) => { s.cells[cellId] = data; }),
    setCells: (cells) => set((s) => { s.cells = cells; }),
    setOnlineUsers: (users) => set((s) => { s.onlineUsers = users; }),
    setWriteState: (state) => set((s) => { s.writeState = state; }),
    reset: () => set(initialState),
  }))
);
```

```typescript
// src/lib/store/ui.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CellFormat } from '@/lib/types';

interface UIState {
  selectedCell: string | null;
  editingCell: string | null;
  activeFormat: CellFormat;
}

interface UIActions {
  selectCell: (cellId: string | null) => void;
  setEditingCell: (cellId: string | null) => void;
  setActiveFormat: (format: Partial<CellFormat>) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  immer((set) => ({
    selectedCell: null,
    editingCell: null,
    activeFormat: {},

    selectCell: (cellId) =>
      set((s) => {
        s.selectedCell = cellId;
        s.editingCell = null;
      }),
    setEditingCell: (cellId) => set((s) => { s.editingCell = cellId; }),
    setActiveFormat: (format) =>
      set((s) => {
        s.activeFormat = { ...s.activeFormat, ...format };
      }),
  }))
);
```

---

## 10. Phase 6 — Authentication & Identity

**Goal**: Users can sign in with Google or enter a display name as a guest. Identity is persistent for the session and carries a colour.

### Colour Assignment Strategy

Assign a deterministic colour per user so the same user always gets the same colour across sessions and across other users' screens.

```typescript
// src/lib/utils/color.utils.ts
const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899',
];

/**
 * Produces the same colour for the same uid every time.
 * Uses a simple hash of the uid string.
 */
export function getUserColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index] ?? '#6366f1';
}
```

### Auth Flow

```
User lands on any protected route
        ↓
AuthGuard checks useAuth() → loading? show spinner
        ↓
user === null? redirect to /login
        ↓
/login page: two options
  ┌─────────────────────────┐
  │  Continue with Google   │  → signInWithPopup → profile complete → /dashboard
  └─────────────────────────┘
  ┌─────────────────────────┐
  │  Enter display name     │  → signInAnonymously → updateProfile → /dashboard
  └─────────────────────────┘
        ↓
On first sign-in: write user doc to Firestore /users/{uid}
        ↓
AuthProvider stores user in Context + assigns colour
```

### Auth Functions

```typescript
// src/lib/firebase/auth.ts
import {
  signInWithPopup, GoogleAuthProvider,
  signInAnonymously, updateProfile,
  signOut as _signOut, onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInAsGuest = async (displayName: string): Promise<User> => {
  const result = await signInAnonymously(auth);
  await updateProfile(result.user, { displayName });
  return result.user;
};

export const signOut = () => _signOut(auth);

export const onAuthChange = (
  callback: (user: User | null) => void
): (() => void) => onAuthStateChanged(auth, callback);
```

---

## 11. Phase 7 — Core UI Components

**Goal**: Build primitive UI components first (design system), then compose them into feature components.

### Design System Primitives (src/components/ui/)

Each primitive should:
- Accept a `className` prop for extension via `clsx` / `tailwind-merge`
- Be typed with `React.ComponentPropsWithoutRef` to accept all native HTML attributes
- Export a `displayName` for React DevTools

#### WriteStateIndicator

Shows real-time save status. Critical for the assignment requirement.

```
idle   → no indicator (clean UI)
saving → "Saving…" with a spinner (yellow dot pulsing)
saved  → "Saved ✓" (green, fades after 2s)
error  → "Failed to save" (red, stays visible)
```

#### Button

```typescript
// src/components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';  // tailwind-merge + clsx wrapper

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50',
        ghost: 'hover:bg-gray-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-9 px-4',
        lg: 'h-10 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### Feature Component Build Order

Build in this order — each depends on the previous:

```
1. AuthProvider          → wraps entire app, provides useAuth()
2. AuthGuard             → redirects unauthenticated users
3. LoginForm             → Google + guest sign-in UI
4. Dashboard/DocumentList → shows user's documents
5. Grid                  → outer container with scroll + headers
6. Cell                  → individual cell (display + edit modes)
7. FormulaBar            → shows and allows editing active cell formula
8. Toolbar               → bold, italic, colour formatting buttons
9. UserAvatars           → stacked avatar chips of online users
10. CellCursor           → coloured border overlay on cells selected by others
11. WriteStateIndicator  → saving/saved status
```

---

## 12. Phase 8 — Spreadsheet Engine

**Goal**: A scrollable grid with editable cells, formula evaluation, and keyboard navigation.

### Cell ID Convention

Cells are identified by column letter(s) + row number: `A1`, `B2`, `Z100`, `AA1`.

```typescript
// src/lib/utils/cell.utils.ts

/** Convert 0-based column index to letter(s): 0→"A", 25→"Z", 26→"AA" */
export function colIndexToLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/** Convert cell ID string to {col, row} 0-based indices */
export function cellIdToPosition(cellId: string): { col: number; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(cellId);
  if (!match?.[1] || !match?.[2]) throw new Error(`Invalid cell ID: ${cellId}`);
  const col = match[1].split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const row = parseInt(match[2], 10) - 1;
  return { col, row };
}

/** Build a cell ID from 0-based col/row */
export function positionToCellId(col: number, row: number): string {
  return `${colIndexToLabel(col)}${row + 1}`;
}
```

### Formula Parser

**Depth justification**: We implement a recursive parser that handles:
1. `=SUM(A1:B5)` — range sum
2. `=A1+B2*C3` — cell references with arithmetic
3. `=A1*2+10` — mixed cell references and literals
4. Nested arithmetic with correct operator precedence

We do NOT implement: `IF()`, `VLOOKUP()`, string functions — these are out of scope for a stripped-down sheets clone and would require a full parser library. The chosen depth covers the assignment requirement and common corporate use cases.

```typescript
// src/lib/utils/formula.ts
import type { CellMap, FormulaResult } from '@/lib/types';

/** Expand a range like "A1:C3" into an array of cell IDs */
function expandRange(range: string): string[] {
  const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
  if (!match) return [];
  const [, startCol, startRow, endCol, endRow] = match;
  const cells: string[] = [];
  // Only handles single-letter columns for simplicity (A-Z)
  const c1 = startCol!.charCodeAt(0);
  const c2 = endCol!.charCodeAt(0);
  const r1 = parseInt(startRow!, 10);
  const r2 = parseInt(endRow!, 10);
  for (let c = c1; c <= c2; c++) {
    for (let r = r1; r <= r2; r++) {
      cells.push(`${String.fromCharCode(c)}${r}`);
    }
  }
  return cells;
}

/** Get numeric value of a cell (0 if empty or non-numeric) */
function cellNumeric(cellId: string, cells: CellMap): number {
  const val = cells[cellId]?.computed ?? cells[cellId]?.value ?? '';
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Evaluate a formula string against the current cell map */
export function evaluateFormula(raw: string, cells: CellMap): FormulaResult {
  if (!raw.startsWith('=')) return raw;

  try {
    let expr = raw.slice(1).toUpperCase();

    // Replace SUM(range) with computed sum
    expr = expr.replace(/SUM\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const sum = expandRange(range).reduce(
        (acc, id) => acc + cellNumeric(id, cells),
        0
      );
      return String(sum);
    });

    // Replace cell references with their values
    expr = expr.replace(/([A-Z]+)(\d+)/g, (cellId) =>
      String(cellNumeric(cellId, cells))
    );

    // Safe evaluate arithmetic expression
    // eslint-disable-next-line no-new-func
    const result: unknown = Function(`'use strict'; return (${expr})`)();
    if (typeof result === 'number' && !isFinite(result)) return '#DIV0';
    return String(result);
  } catch {
    return '#ERR';
  }
}
```

### Grid Component Architecture

```
<Grid>
  ├── Column headers row (A, B, C, …)
  ├── <div> scrollable body
  │   ├── Row 1: <RowHeader>1</RowHeader> + <Cell id="A1"/> <Cell id="B1"/> …
  │   ├── Row 2: <RowHeader>2</RowHeader> + <Cell id="A2"/> …
  │   └── …
  └── <CellCursor> overlay for each other online user's active cell
```

### Cell Component States

```
display   → shows computed value; clicking enters "selected" state
selected  → highlighted border; typing enters "editing" state; formula shown in FormulaBar
editing   → <input> rendered inside cell; Escape cancels; Enter/Tab commits
```

### Keyboard Navigation Map

| Key | Action |
|---|---|
| Arrow keys | Move selected cell |
| Tab | Move right (wrap to next row) |
| Shift+Tab | Move left |
| Enter | Move down |
| Shift+Enter | Move up |
| Any printable key | Start editing selected cell |
| Escape | Cancel edit, return to selected |
| F2 | Enter edit mode on selected cell |

---

## 13. Phase 9 — Real-time Sync & Presence

**Goal**: Changes appear on all open sessions within ~200ms. Users see each other's cursors. Write state is always visible.

### Sync Architecture

```
User edits cell
      ↓
Cell.tsx calls onCellChange(cellId, value)
      ↓
useSpreadsheetStore.setWriteState('saving')
      ↓
cellService.updateCell(docId, cellId, data)   [Firestore write]
      ↓ (optimistic — UI already shows new value)
      ↓
onSnapshot listener fires on ALL open sessions
      ↓
useCells hook calls store.setCells(updatedCells)
      ↓
All Cell components that read this cell re-render
      ↓
useSpreadsheetStore.setWriteState('saved')
      ↓
WriteStateIndicator shows "Saved ✓" → fades after 2s
```

### Conflict Handling Strategy

Firebase Firestore uses **last-write-wins** at the document level. Since each cell is its own Firestore document (`cells/{cellId}`), concurrent edits to **different cells** are non-conflicting.

Concurrent edits to the **same cell**: the last write wins. For a corporate spreadsheet tool, this is the standard approach (Google Sheets also uses last-write-wins per cell). We surface this by always showing the `lastModifiedBy` user's avatar on the cell.

### The useCells Hook

```typescript
// src/lib/hooks/useCells.ts
'use client';
import { useEffect } from 'react';
import { cellService } from '@/services/cell.service';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { evaluateFormula } from '@/lib/utils/formula';

export function useCells(docId: string) {
  const setCells = useSpreadsheetStore((s) => s.setCells);
  const cells = useSpreadsheetStore((s) => s.cells);

  useEffect(() => {
    const unsub = cellService.subscribeToAllCells(
      docId,
      (rawCells) => {
        // Compute formula results before storing
        const evaluated = Object.fromEntries(
          Object.entries(rawCells).map(([id, cell]) => [
            id,
            { ...cell, computed: evaluateFormula(cell.value, rawCells) },
          ])
        );
        setCells(evaluated);
      },
      (err) => console.error('Cell subscription error:', err)
    );
    return unsub;
  }, [docId, setCells]);

  return cells;
}
```

### The usePresence Hook

```typescript
// src/lib/hooks/usePresence.ts
'use client';
import { useEffect } from 'react';
import { presenceService } from '@/services/presence.service';
import { useSpreadsheetStore } from '@/lib/store/spreadsheet.store';
import { useAuth } from './useAuth';
import { getUserColor } from '@/lib/utils/color.utils';

export function usePresence(docId: string) {
  const { user } = useAuth();
  const setOnlineUsers = useSpreadsheetStore((s) => s.setOnlineUsers);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);  // from ui store

  // Join on mount, leave on unmount
  useEffect(() => {
    if (!user) return;
    void presenceService.join(docId, {
      uid: user.uid,
      displayName: user.displayName ?? 'Anonymous',
      color: getUserColor(user.uid),
      activeCell: null,
      lastSeen: Date.now(),
    });

    const unsub = presenceService.subscribe(docId, setOnlineUsers);

    const handleUnload = () => void presenceService.leave(docId, user.uid);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      void presenceService.leave(docId, user.uid);
      unsub();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [docId, user, setOnlineUsers]);

  // Broadcast active cell changes
  useEffect(() => {
    if (!user || !selectedCell) return;
    void presenceService.updateActiveCell(docId, user.uid, selectedCell);
  }, [docId, user, selectedCell]);
}
```

---

## 14. Phase 10 — Bonus Features

Implement only after all required features are stable.

### Cell Formatting

- Toolbar buttons: Bold (B), Italic (I), Text Colour picker, Background Colour picker
- Format stored in `CellData.format` field in Firestore
- Apply via `cellService.updateCell(docId, id, { format: { bold: true } })`
- Render: `<span style={{ fontWeight: cell.format?.bold ? 700 : 400 }}>`

### Column/Row Resize

- Store column widths in `useUIStore` (local state — no need to persist widths in Firestore)
- Implement drag handle at column header right edge
- `onMouseDown` → track `mousemove` delta → update width in store → all cells in that column re-read width

### Export

```typescript
// src/lib/utils/export.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { CellMap } from '@/lib/types';

export function exportToCSV(cells: CellMap, filename: string): void {
  const rows: string[][] = [];
  Object.entries(cells).forEach(([id, cell]) => {
    // Parse cell ID to row/col, build 2D array
    // ... (use cellIdToPosition utility)
    void id; void cell; // placeholder
  });
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

export function exportToXLSX(cells: CellMap, filename: string): void {
  const ws = XLSX.utils.aoa_to_sheet([]);
  Object.entries(cells).forEach(([id, cell]) => {
    ws[id] = { v: cell.computed ?? cell.value };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

---

## 15. Phase 11 — Quality, Testing & Hardening

### Pre-Deployment Checklist

```bash
# Must all pass before committing
pnpm build           # Zero TS errors, zero ESLint errors
pnpm lint            # ESLint clean
pnpm type-check      # tsc --noEmit
```

### Add to package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Edge Cases to Handle

| Scenario | Handling |
|---|---|
| User loses internet while editing | Show `error` write state; retry on reconnect using Firebase offline persistence |
| Two users edit the same cell simultaneously | Last-write-wins; both see the final value within ~200ms |
| Formula references a cell that doesn't exist | Return `0` for the missing cell value (never crash) |
| Formula results in division by zero | Return `#DIV0` string |
| Formula circular reference | Return `#ERR` (no infinite loop — evaluate depth-first, catch errors) |
| User closes tab mid-edit | `beforeunload` + Firebase `onDisconnect` cleans up presence |
| Very large grid (1000+ cells) | Virtualise rows using `react-window` or CSS `contain: strict` |

### Firebase Offline Support

Add this to `src/lib/firebase/firestore.ts`:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from './config';

// Enable offline persistence (call once on app init)
export function enableOfflineSupport(): void {
  enableIndexedDbPersistence(db).catch((err: { code: string }) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence only works in one tab at a time
      console.warn('Offline persistence disabled: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support IndexedDB
      console.warn('Offline persistence not supported in this browser');
    }
  });
}
```

---

## 16. Phase 12 — Deployment & CI/CD

### Vercel Setup

1. Push repo to GitHub (private repository)
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables from `.env.production.local`
5. Deploy

### Environment Variable Strategy on Vercel

| Vercel Environment | Firebase Project | Env Vars Source |
|---|---|---|
| Production | `trademarkia-sheets-prod` | Add manually in Vercel dashboard |
| Preview (PRs) | `trademarkia-sheets-dev` | Add with "Preview" scope |
| Development (local) | `trademarkia-sheets-dev` | `.env.development.local` |

### Post-Deployment Steps

1. Copy the Vercel production URL (e.g. `https://trademarkia-sheets.vercel.app`)
2. Add it to Firebase Console → Authentication → Authorized domains
3. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
4. Smoke test: open two incognito tabs, sign in, edit cells, verify sync

### GitHub Repository Setup

```bash
git init
git add .
git commit -m "feat: initial project scaffold with tooling"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trademarkia-sheets.git
git push -u origin main

# Grant access to recruiter
# GitHub → Settings → Collaborators → Add: recruitments@trademarkia.com
```

---

## 17. SOLID Principles Applied

| Principle | Where Applied |
|---|---|
| **S**ingle Responsibility | Each service file owns one domain. `documentService` only manages documents, never touches presence. Each component does one thing. |
| **O**pen/Closed | Services expose a stable interface. If Firebase is replaced with Supabase, only the service internals change — no component changes. |
| **L**iskov Substitution | All hooks return the same shape regardless of loading/error state (they return `null` or empty defaults, never `undefined` unexpectedly). |
| **I**nterface Segregation | `CellData` and `CellFormat` are separate interfaces. Components that only need formatting never import cell content types. `AppUser` does not include Firestore-specific fields. |
| **D**ependency Inversion | Components depend on hooks. Hooks depend on services. Services depend on Firebase config. Nothing depends backwards. |

---

## 18. Git Commit Strategy

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     A new feature
fix:      A bug fix
chore:    Build, config, dependency changes
refactor: Code restructure with no behaviour change
docs:     README, comments, this plan
style:    Formatting, Tailwind class changes
test:     Tests
perf:     Performance improvements
```

### Ideal Commit Sequence (shows evaluators your thinking)

```
feat: scaffold Next.js project with strict TypeScript and ESLint
chore: add Firebase config and environment variable strategy
feat: define shared TypeScript types for documents, cells, presence
feat: implement documentService with Firestore subscriptions
feat: implement cellService with per-cell real-time updates
feat: implement presenceService with onDisconnect cleanup
feat: add Zustand stores for spreadsheet and UI state
feat: implement AuthProvider and Google/guest sign-in
feat: build dashboard page with document list and create flow
feat: implement Grid component with row/column headers
feat: implement Cell component with display/selected/editing modes
feat: add formula evaluator for SUM and arithmetic
feat: implement real-time cell sync via useCells hook
feat: add presence system with user avatars and cell cursors
feat: add WriteStateIndicator showing save status
feat: cell formatting — bold, italic, text/background colour
feat: keyboard navigation (arrows, Tab, Enter)
feat: export to CSV and XLSX
feat: column and row resize by drag
chore: final pre-submission audit — zero TS errors, lint clean
docs: complete README with setup, architecture, and demo link
```

---

## 19. Final Submission Checklist

### Functional Requirements

- [ ] Document dashboard lists all user documents with title and last modified date
- [ ] New document can be created from dashboard
- [ ] Grid scrolls with numbered rows and lettered columns
- [ ] Cells are editable (click or type to enter edit mode)
- [ ] `=SUM(A1:A5)` formula works correctly
- [ ] Basic arithmetic formulas work: `=A1+B2*3`
- [ ] Real-time sync — edit in Tab A, see update in Tab B within ~200ms
- [ ] Write state indicator shows: Saving → Saved (→ fades) or Error
- [ ] Multiple users visible in UI (avatars)
- [ ] Active cell of each user visible as coloured border
- [ ] Google sign-in works on deployed URL
- [ ] Guest sign-in with custom display name works
- [ ] User colour is consistent across sessions

### Code Quality Requirements

- [ ] `pnpm build` — **zero errors**, zero TypeScript suppressions (`// @ts-ignore`, `as any`)
- [ ] `pnpm lint` — zero ESLint errors
- [ ] No `console.log` left in production code
- [ ] All Firebase listeners are unsubscribed in `useEffect` cleanup functions
- [ ] No hardcoded strings where environment variables should be used

### Submission Requirements

- [ ] GitHub repo is **private**
- [ ] `recruitments@trademarkia.com` has collaborator access
- [ ] Commits are incremental (not one giant push)
- [ ] Live URL is accessible and working
- [ ] `README.md` contains: setup instructions, architecture overview, design decisions, live URL link
- [ ] Demo video (2–3 min): two browser tabs open, live sync visible, presence working, brief code walkthrough
- [ ] Submitted via [https://forms.gle/4RpHZpAi8rbG9QCE8](https://forms.gle/4RpHZpAi8rbG9QCE8)

---

*This plan is a living document. Update it as you make decisions during implementation.*
