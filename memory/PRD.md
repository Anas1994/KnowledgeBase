# NotebookLM Workspace - Product Requirements Document

## Original Problem Statement
Build a NotebookLM-like workspace app that:
- Runs AI on uploaded documents as sources
- Correlates data from multiple sources
- Generates formal PPT files based on uploaded sources
- Uses GPT-5.1 via Emergent LLM key

## Architecture

### Backend (FastAPI)
- **Document Processing**: PDF text extraction via PyPDF2, URL scraping via BeautifulSoup
- **AI Integration**: GPT-5.1 via emergentintegrations library
- **Database**: MongoDB for source and output storage
- **Endpoints**:
  - `POST /api/sources/upload` - Upload and process documents
  - `POST /api/sources/url` - Add URL sources
  - `GET /api/sources` - List all sources
  - `POST /api/chat` - AI chat with sources
  - `POST /api/generate` - Generate outputs (slides, reports, etc.)
  - `POST /api/outputs` - Save generated outputs
  - `GET /api/outputs` - List saved outputs

### Frontend (React)
- **pptxgenjs**: Loaded from CDN for PPTX generation
- **Real-time source processing**: Shows indexing status
- **Studio tools**: Audio, Slides, Video Script, Mind Map, Report, Flashcards, Quiz, Infographic, Data Table
- **Persistence**: Sources and outputs loaded from backend on mount

## What's Been Implemented (Jan 2026)
- [x] File upload with PDF/TXT extraction
- [x] URL scraping and indexing
- [x] AI-powered chat with source citations
- [x] AI generation for multiple output types using actual uploaded sources
- [x] Real PPTX file generation with slides data
- [x] Source management (add, delete, view)
- [x] Output persistence in MongoDB
- [x] Activity logging

## User Personas
1. **Researchers**: Upload papers, generate summaries and reports
2. **Students**: Create flashcards and quizzes from study materials
3. **Business Users**: Generate presentations from multiple documents

## Core Requirements (Static)
- Upload PDF/TXT files for indexing
- Add URL sources
- AI-powered Q&A about sources
- Generate structured outputs from source content
- Download actual PPTX files

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Document upload and processing
- [x] AI chat integration
- [x] PPTX generation from real sources
- [x] Output persistence

### P1 (High)
- [ ] Support for more file types (DOCX, XLSX)
- [ ] Persistent notebooks (save/load multiple notebooks)
- [ ] User authentication

### P2 (Medium)
- [ ] Audio podcast generation (TTS)
- [ ] Collaborative editing
- [ ] Export to PDF reports

## Next Tasks
1. Add DOCX file support
2. Implement user authentication
3. Add multiple notebook management
