# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build a healthcare research workspace with dual-theme UI (Saudi Healthcare Command dark / Saudi Vision light), English/Arabic localization with RTL, multi-format source ingestion, and AI-powered content generation including professional infographics and slide decks.

## Core Requirements
- **UI & Theming**: Dark/light theme toggle with CSS custom properties
- **Localization**: English/Arabic with full RTL support
- **Source Ingestion**: Accept .docx, .pdf, .xlsx, .pptx, and image files
- **Content Generation**: Slides, reports, mind maps, flashcards, quizzes, audio scripts, data tables, infographics
- **Infographic Generation**: Contextually relevant visuals based on source content
- **Slide Deck Generation**: Professional PPTX with AI-generated images, proper alignment, varied layouts

## Architecture
- **Frontend**: React.js, Context API, CSS Custom Properties, HTML5 Canvas, pptxgenjs
- **Backend**: FastAPI, MongoDB, OpenAI (Emergent LLM Key) for text + image generation
- **Libraries**: openpyxl, python-pptx, Pillow, pypdf, python-docx, pptxgenjs, pdfjs-dist

## Key Files
- `/app/frontend/src/components/NotebookLM_Workspace.jsx` - Main UI + Canvas renderer + PPTX builder
- `/app/backend/server.py` - API endpoints + AI generation logic
- `/app/frontend/src/contexts/LanguageContext.jsx` - i18n
- `/app/frontend/src/contexts/ThemeContext.jsx` - Theme toggle

## Database Schema
- **sources**: {filename, filetype, content, chunks, status, created_at}
- **outputs**: {title, type, sources, content, slides_data, created_at}

## What's Implemented
- [x] Dual theme (dark/light) with toggle
- [x] English/Arabic localization with RTL
- [x] Source upload: .docx, .pdf, .xlsx, .pptx, images
- [x] All generation types: slides, report, mindmap, flashcards, quiz, audio, datatable, infographic
- [x] Canvas-based infographic with contextual visual selection (Fixed Mar 12, 2026)
- [x] Professional PPTX generation with AI images, proper alignment, teal/gold theme (Fixed Mar 12, 2026)

## Completed Fix Log
- **Mar 12, 2026 (Session 1)**: Fixed irrelevant visuals in infographic generation. Backend AI prompt defaults to visualType "none" for descriptive content.
- **Mar 12, 2026 (Session 2)**: Complete PPTX overhaul:
  - Rewrote all slide layouts (title, bullets, two-column, timeline, image-left/right, quote) with proper alignment
  - Added inline AI image generation (gpt-image-1) during Export for image-left/right slides
  - Updated health theme to Saudi teal (#004D40) / gold (#C8A86B)
  - Improved backend prompt for better layout distribution and contextual imageKeywords
  - Fixed theme detection to prioritize health keywords over tech keywords

## Backlog
- P2: Extract infographic rendering logic from NotebookLM_Workspace.jsx into a utility module
- P2: Add visual slide preview in the modal (currently shows text-based preview)
