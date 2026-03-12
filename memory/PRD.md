# HealthOS - Health Intelligence Workspace

## Original Problem Statement
Build a healthcare research workspace with dual-theme UI (Saudi Healthcare Command dark / Saudi Vision light), English/Arabic localization with RTL, multi-format source ingestion, and AI-powered content generation including professional infographics.

## Core Requirements
- **UI & Theming**: Dark/light theme toggle with CSS custom properties
- **Localization**: English/Arabic with full RTL support
- **Source Ingestion**: Accept .docx, .pdf, .xlsx, .pptx, and image files
- **Content Generation**: Slides, reports, mind maps, flashcards, quizzes, audio scripts, data tables, infographics
- **Infographic Generation**: Visually rich, professional, and contextually relevant infographics with intelligent visual selection

## Architecture
- **Frontend**: React.js, Context API, CSS Custom Properties, HTML5 Canvas
- **Backend**: FastAPI, MongoDB, OpenAI (Emergent LLM Key)
- **Libraries**: openpyxl, python-pptx, Pillow, pypdf, python-docx, pptxgenjs, pdfjs-dist

## Key Files
- `/app/frontend/src/components/NotebookLM_Workspace.jsx` - Main UI + Canvas infographic renderer
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
- [x] Canvas-based infographic with header image generation
- [x] Contextual visual selection for infographics (visualType: none/stat/process/comparison) - Fixed Mar 12, 2026

## Completed Fix Log
- **Mar 12, 2026**: Fixed irrelevant visuals in infographic generation. Backend AI prompt now defaults to `visualType: "none"` for descriptive content. Frontend renders clean text-only cards when no visual is warranted. Tested: 100% pass rate.

## Backlog
- P2: Extract infographic rendering logic from NotebookLM_Workspace.jsx into a utility module for maintainability
