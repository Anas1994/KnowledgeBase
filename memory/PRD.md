# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build an AI-powered research workspace (NotebookLM-style) with source document upload, AI chat, and output generation. Enhanced with Saudi-themed dual themes, localization, and professional infographic generation.

## What's Been Implemented

### Core Features
- Source upload & indexing (PDF, DOCX, TXT, XLSX, PPTX, Images)
- AI chat with source context (GPT-5.1)
- Studio output generation (Slides, Infographics, Reports, etc.)
- AI image generation (Gemini Nano Banana)
- PPTX/PNG export

### Dual Theme System (Feb 2026)
- Light "Saudi Vision 2030" + Dark "Saudi Healthcare Command" themes
- Sun/moon toggle with 60+ CSS custom properties

### Localization (Feb 2026)
- English/Arabic with RTL support, 200+ translated keys

### Extended File Support (Feb 2026)
- Excel (.xlsx): openpyxl extraction
- PowerPoint (.pptx): python-pptx text extraction
- Images (.png/.jpg/.jpeg): AI vision via GPT-5.1 ImageContent
- PDF, DOCX, TXT (existing)

### Enhanced Infographic Generation (Feb 2026)
- **Canvas Renderer**: Professional 2-column card layout with:
  - Gradient header with title, subtitle, gold divider, section badges
  - Cards: colored left borders, numbered badges, icon shapes, word-wrapped bullets
  - Dynamic height calculation per card based on content
  - 12 geometric icon types (chart, users, clock, target, shield, globe, etc.)
  - Saudi-themed footer
- **Visual Preview**: Modal shows infographic as styled card grid (not raw text)
- **AI Prompt**: Enhanced to generate 4 bullets per section, icons, stat labels
- Export: 1200px wide PNG, dynamic height

## Key API Endpoints
- `POST /api/sources/upload` — Upload docs (PDF, DOCX, TXT, XLSX, PPTX, images)
- `POST /api/generate` — Generate outputs (slides, infographic, report, etc.)
- `POST /api/chat` — AI chat with source context
- `GET /api/sources`, `GET /api/outputs`, `POST /api/outputs`
- `DELETE /api/sources/{id}`, `DELETE /api/outputs/{id}`

## DB Schema
- **sources**: `{id, title, type, content, chunks, size, status, url, notebook_id, created_at}`
- **outputs**: `{id, type, title, content, slides_data, notebook_id, created_at, size}`

## 3rd Party Integrations
- OpenAI GPT-5.1 (Emergent LLM Key) — text gen + image vision
- Gemini Nano Banana (Emergent LLM Key) — image gen
- openpyxl, python-pptx, python-docx, PyPDF2, Pillow
- pptxgenjs, pdfjs-dist (frontend)

## Prioritized Backlog
### P1
1. Break down NotebookLM_Workspace.jsx (~2700 lines)
2. User authentication
3. Persist theme preference in localStorage

### P2
1. Collaborative editing
2. More AI output types with actual generation
3. Google Drive integration
4. Notebook export (JSON, CSV, ZIP)
