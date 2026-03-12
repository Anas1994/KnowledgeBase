# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build an AI-powered research workspace (NotebookLM-style) that allows users to upload source documents (TXT, PDF, DOCX), chat with an AI that uses these sources for context, and generate complex outputs like multi-slide PPTX presentations and infographics.

### Phase 2: Saudi Healthcare Command Theme → Light Saudi Vision 2030 Theme
Transform the entire UI into a clean, professional light theme inspired by Saudi Vision 2030 with Saudi Green (#006C5B) and Gold (#C8A86B) accents. Add English/Arabic localization with full RTL support.

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
│   │   │   ├── translations.js           # EN/AR dictionaries (200+ keys)
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

### Light Saudi Vision 2030 Theme (Feb 2026)
- Clean white/off-white (#F5F7FA) backgrounds
- White cards with subtle shadows and #E7EAF3 borders
- Saudi Green (#006C5B) primary buttons and accents
- Gold (#C8A86B) secondary accents
- Dark text (#1A1F36, #6B7285) on light backgrounds
- Cairo + Inter typography via Google Fonts
- "HealthOS" branding with Saudi Green accent
- No glass-morphism or dark overlays - clean and professional

### English/Arabic Localization (Feb 2026)
- Complete EN/AR translation dictionary (200+ keys)
- React LanguageContext with `useLanguage` hook
- Language toggle button in top nav (EN/ع)
- Full RTL layout support (dir="rtl" on root)
- All UI sections translated: nav, sidebar, KPIs, cards, modals, studio tools, chat, notes

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

### P1 - Improvements
1. Break down NotebookLM_Workspace.jsx into smaller components
2. Add more file type support (XLSX)
3. User authentication

### P2 - Future
1. Collaborative editing
2. More AI output types (Video Script, Mind Map, Quiz, Flashcards - actual generation)
3. Google Drive integration
4. Notebook export (JSON, CSV, ZIP)
