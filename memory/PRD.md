# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build an AI-powered research workspace (NotebookLM-style) that allows users to upload source documents, chat with an AI that uses these sources for context, and generate complex outputs like multi-slide PPTX presentations and infographics.

### Phase 2: Saudi Healthcare Command Theme + Light Saudi Vision Theme + Localization + Theme Toggle
Transform the entire UI into dual themes: a dark "Saudi Healthcare Command" theme and a light "Saudi Vision 2030" theme. Add English/Arabic localization with full RTL support. Implement a theme toggle to switch dynamically.

### Phase 3: Extended File Type Support
Extend the source upload system to accept and properly read: Excel sheets (.xlsx/.xls), PowerPoint presentations (.pptx/.ppt), Images (.png/.jpg/.jpeg/.gif/.webp/.bmp), PDFs (.pdf), plain text (.txt), and Word documents (.docx/.doc).

## Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI server
│   ├── tests/
│   │   └── test_file_upload.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── NotebookLM_Workspace.jsx  # Main UI component (~2620 lines)
│   │   ├── theme/
│   │   │   └── ThemeContext.js
│   │   ├── i18n/
│   │   │   ├── translations.js
│   │   │   └── LanguageContext.js
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
- Studio output generation (Slide Decks, Infographics, Reports, etc.)
- AI image generation using Gemini Nano Banana
- Output persistence in MongoDB
- PPTX export with professional layouts
- Infographic PNG export

### Dual Theme System (Feb 2026)
- Light "Saudi Vision 2030" theme (white/off-white backgrounds, Saudi Green accents)
- Dark "Saudi Healthcare Command" theme (dark navy with Riyadh cityscape overlay)
- Theme toggle (sun/moon icon) in nav bar with 60+ CSS custom properties
- All inline styles use CSS variables for theme-responsive rendering

### Localization (Feb 2026)
- English/Arabic translation dictionary (200+ keys)
- Language toggle button (EN/ع) in top nav
- Full RTL layout support

### Extended File Type Support (Feb 2026)
- **Excel (.xlsx/.xls)**: Extracts data from all sheets, preserves row/column structure using openpyxl
- **PowerPoint (.pptx/.ppt)**: Extracts text from all slides, shapes, and tables using python-pptx
- **Images (.png/.jpg/.jpeg/.gif/.webp/.bmp)**: AI vision extraction using GPT-5.1 via ImageContent from emergentintegrations
- **PDF (.pdf)**: Text extraction via PyPDF2
- **Word (.docx/.doc)**: Text and table extraction via python-docx
- **Text (.txt)**: Direct UTF-8 decoding
- Frontend: updated file validation, type mapping, icons, colors, accept attributes, and format labels

## Key API Endpoints
- `POST /api/sources/upload` - Upload and process source documents (PDF, DOCX, TXT, XLSX, PPTX, images)
- `POST /api/sources/url` - Add a URL as a source
- `GET /api/sources` - Retrieve all processed sources
- `GET /api/sources/{source_id}` - Get source with full content
- `DELETE /api/sources/{source_id}` - Delete a source
- `POST /api/generate` - Generate outputs (slides, infographics, reports, etc.)
- `POST /api/outputs` - Save a generated output
- `GET /api/outputs` - Retrieve all outputs
- `DELETE /api/outputs/{output_id}` - Delete an output
- `POST /api/generate-image` - Generate a single AI image for a slide
- `POST /api/chat` - AI chat with source context

## DB Schema
- **sources**: `{id, title, type, content, chunks, size, status, url, notebook_id, created_at}`
- **outputs**: `{id, type, title, content, slides_data, notebook_id, created_at, size}`

## 3rd Party Integrations
- OpenAI GPT-5.1 (via Emergent LLM Key) — text generation + image vision
- Gemini Nano Banana (via Emergent LLM Key) — image generation
- openpyxl — Excel parsing
- python-pptx — PowerPoint parsing
- python-docx — Word document parsing
- PyPDF2 — PDF parsing
- Pillow — Image processing
- pptxgenjs (frontend) — PPTX generation
- pdfjs-dist (frontend) — PDF rendering

## Prioritized Backlog

### P1 - Improvements
1. Break down NotebookLM_Workspace.jsx into smaller components (~2620 lines)
2. User authentication
3. Persist theme preference in localStorage

### P2 - Future
1. Collaborative editing
2. More AI output types (Video Script, Mind Map, Quiz - with actual generation)
3. Google Drive integration
4. Notebook export (JSON, CSV, ZIP)
