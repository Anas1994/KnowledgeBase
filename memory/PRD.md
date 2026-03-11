# NotebookLM Workspace - Product Requirements Document

## Original Problem Statement
Build a NotebookLM-like workspace app that:
- Runs AI on uploaded documents as sources
- Correlates data from multiple sources
- Generates formal PPT files with fancy layouts, themes, icons
- Uses GPT-5.1 via Emergent LLM key

## Architecture

### Backend (FastAPI)
- **Document Processing**: PDF (PyPDF2), DOCX (python-docx), URL scraping (BeautifulSoup)
- **AI Integration**: GPT-5.1 via emergentintegrations library
- **Database**: MongoDB for source and output storage
- **Smart Theme Detection**: Analyzes content keywords to select appropriate theme

### Frontend (React + pptxgenjs)
- **Professional PPTX Generation** with:
  - 6 theme presets (tech, smart_home, corporate, finance, health, education)
  - Master slides with gradients, shapes, and decorations
  - Multiple layouts: title, bullets, two-column, timeline, image-left/right, quote
  - Card backgrounds with shadows
  - Icon placeholders
  - Numbered bullets with theme colors
  - Slide numbers and accent bars

## What's Been Implemented (Jan 2026)
- [x] PDF and DOCX text extraction (fixed ZIP/binary detection)
- [x] URL scraping and indexing
- [x] AI-powered chat with source citations
- [x] AI generates varied slide layouts (timeline, two-column, image layouts)
- [x] Professional PPTX with themes, shapes, cards, icons
- [x] Source and output persistence in MongoDB

## Slide Layout Types
1. **Title** - Large centered title with decorative elements
2. **Bullets** - Standard numbered list with icon and highlight box
3. **Two-Column** - Split content in card backgrounds
4. **Timeline** - Horizontal timeline with phase markers
5. **Image-Left/Right** - Content with image placeholder
6. **Quote** - Large quote mark with emphasized text

## Theme Presets
- **Tech** (Blue) - Software, development, digital content
- **Smart Home** (Emerald) - Home automation, IoT, devices
- **Corporate** (Indigo) - Business, general presentations
- **Finance** (Teal) - Money, budgets, revenue
- **Health** (Pink) - Medical, patient care
- **Education** (Amber) - Learning, training, schools

## Next Tasks
1. Add actual image search integration (Unsplash/Pexels)
2. Add chart generation for data
3. Support more file types (XLSX for tables)
4. User authentication
