# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build an AI-powered research workspace (NotebookLM-style) that allows users to upload source documents (TXT, PDF, DOCX), chat with an AI that uses these sources for context, and generate complex outputs like multi-slide PPTX presentations and infographics.

### Phase 2: Saudi Healthcare Command Theme
Transform the entire UI into a "Saudi Healthcare Command Theme" with a dark, premium aesthetic inspired by the Saudi Ministry of Health. Add English/Arabic localization with full RTL support.

## User Personas
- Healthcare professionals and analysts
- Ministry of Health staff
- Medical researchers analyzing clinical data and health policy documents

## Core Requirements
1. Source document upload and management (PDF, DOCX, TXT)
2. AI chat with source context (GPT-5.1 via Emergent LLM Key)
3. Studio output generation (Slide Decks, Infographics, Reports, etc.)
4. AI-powered image generation (Gemini Nano Banana via Emergent LLM Key)
5. Output persistence in MongoDB
6. Saudi Healthcare Command Theme UI
7. English/Arabic localization with RTL support

## Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── NotebookLM_Workspace.jsx  # Main UI component
│   │   ├── i18n/
│   │   │   ├── translations.js           # EN/AR dictionaries
│   │   │   └── LanguageContext.js         # React language context
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── memory/
    └── PRD.md
```

## What's Been Implemented

### Core Features (Previous Sessions)
- Source document upload and indexing (PDF, DOCX, TXT)
- AI chat with source context using GPT-5.1
- Studio output generation (Slide Decks, Infographics)
- AI image generation using Gemini Nano Banana
- Async image generation for PPT slides
- Output persistence in MongoDB
- PPTX export with professional layouts
- Infographic PNG export

### Saudi Healthcare Command Theme (Feb 2026)
- Complete dark theme with Riyadh cityscape background overlay
- Color palette: Saudi Green (#006C5B), Gold Accent (#C8A86B)
- Glass-morphism panels with backdrop-blur throughout
- Cairo + Inter typography via Google Fonts
- Noise texture overlay for depth
- "HealthOS" branding
- All panels, cards, modals, and views styled consistently

### English/Arabic Localization (Feb 2026)
- Complete EN/AR translation dictionary (~200+ keys)
- React LanguageContext with `useLanguage` hook
- Language toggle button in top nav (EN/ع)
- Full RTL layout support (dir="rtl" on root)
- All major UI sections translated:
  - Navigation tabs, sidebar, KPIs, section headers
  - Chat interface, Studio tools, Notes view
  - Upload modal, Share modal, Settings modal
  - Quick actions, activity feed, right studio rail

## Key API Endpoints
- `POST /api/upload` - Upload and process source documents
- `POST /api/generate` - Generate outputs (slides, infographics, etc.)
- `GET /api/sources` - Retrieve all processed sources
- `GET /api/outputs` - Retrieve all persisted outputs
- `POST /api/outputs` - Save a generated output
- `POST /api/generate_image/{output_id}/{slide_index}` - Async image generation
- `POST /api/chat` - AI chat with source context

## DB Schema
- **sources**: `{filename, filetype, content, chunks, status, created_at}`
- **outputs**: `{title, type, sources, content, created_at}`

## 3rd Party Integrations
- OpenAI GPT-5.1 (via Emergent LLM Key)
- Gemini Nano Banana Image Generation (via Emergent LLM Key)
- pptxgenjs (frontend PPTX generation)
- pdfjs-dist (frontend PDF parsing)
- python-docx (backend DOCX parsing)

## Prioritized Backlog

### P0 - None (all critical features implemented)

### P1 - Potential Improvements
1. Break down NotebookLM_Workspace.jsx into smaller components (Sidebar, Studio, ChatView, etc.)
2. Add more file type support (XLSX for tables)
3. User authentication

### P2 - Future Enhancements
1. Collaborative editing with real-time sync
2. More AI output types (Video Script, Mind Map, Quiz, Flashcards)
3. Google Drive integration for document import
4. Export notebook data (JSON, CSV, ZIP)
