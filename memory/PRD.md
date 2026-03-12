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
- **Chat**: Multi-turn conversation with translation, summarization, analysis, comparison, markdown rendering

## Architecture
- **Frontend**: React.js, Context API, CSS Custom Properties, HTML5 Canvas, pptxgenjs
- **Backend**: FastAPI, MongoDB, OpenAI (Emergent LLM Key) for text + image generation
- **Libraries**: openpyxl, python-pptx, Pillow, pypdf, python-docx, pptxgenjs, pdfjs-dist

## Key Files
- `/app/frontend/src/components/NotebookLM_Workspace.jsx` - Main UI + Canvas renderer + PPTX builder + MdText markdown renderer
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
- [x] Canvas-based infographic with contextual visual selection
- [x] Professional PPTX generation with AI images, proper alignment, teal/gold theme
- [x] Enhanced chat: translation, multi-turn history, depth settings, markdown rendering, quick action chips, regenerate via API

## Completed Fix Log
- **Mar 12, 2026 (Session 1)**: Fixed irrelevant visuals in infographic generation
- **Mar 12, 2026 (Session 2)**: Complete PPTX overhaul with AI images, proper alignment, teal/gold theme
- **Mar 12, 2026 (Session 3)**: Enhanced chat holistically:
  - Translation support (Arabic, English, French, any language)
  - Multi-turn conversation with history (last 10 messages)
  - Chat depth settings (fast/balanced/deep) wired to backend
  - Markdown rendering in AI responses (MdText component)
  - 6 quick action chips: Translate to Arabic/English, Summarize, Key findings, Compare, Extract action items
  - Regenerate button uses real API instead of local mock
  - Removed local genAIResponse fallback

## Backlog
- P2: Extract infographic rendering logic from NotebookLM_Workspace.jsx into a utility module
- P2: Add visual slide preview in the modal (currently shows text-based preview)
- P3: Voice input for chat
