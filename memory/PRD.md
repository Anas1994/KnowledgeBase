# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build an AI-powered research workspace with source document upload, AI chat, and output generation. Enhanced with Saudi-themed dual themes, localization, extended file support, and professional infographic generation.

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
- **Canvas Renderer** (1400px wide, dynamic height):
  - Gradient header with title, gold diamond divider, section badges, color indicators
  - 2-column card grid with colored left borders, numbered badges
  - **Donut charts** for percentage-based stats with gradient arcs + progress bars
  - **Workflow diagrams** for process types (connected numbered circles with arrows)
  - **Horizontal bar charts** for comparison data with gradient fills + shine effects
  - **Mini vertical bar charts** for numeric stats with gradient fills
  - 12 geometric icon types with glow background circles
  - Timeline dots on left margin connecting rows
  - Dynamic card height calculation based on content
  - Word-wrapped bullets with colored dot markers
  - Subtle dot grid pattern background
  - Professional footer with gold accent line
- **Visual Preview**: Modal shows infographic as styled card grid (not raw text)
- **AI Prompt**: Requests diverse visualTypes (process, stat, comparison) + percentage stats

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
1. Break down NotebookLM_Workspace.jsx (~2800 lines) into smaller components
2. User authentication
3. Persist theme preference in localStorage

### P2
1. Collaborative editing
2. More AI output types with actual generation
3. Google Drive integration
4. Notebook export (JSON, CSV, ZIP)
