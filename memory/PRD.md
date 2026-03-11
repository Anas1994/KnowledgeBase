# NotebookLM Workspace - Product Requirements Document

## Original Problem Statement
Build a NotebookLM-like workspace app that:
- Runs AI on uploaded documents as sources
- Correlates data from multiple sources
- Generates formal PPT files with AI-generated diagrams, flowcharts, and visuals
- Uses GPT-5.1 via Emergent LLM key

## Architecture

### Backend (FastAPI)
- **Document Processing**: PDF (PyPDF2), DOCX (python-docx), URL scraping (BeautifulSoup)
- **AI Text Generation**: GPT-5.1 via emergentintegrations library
- **AI Image Generation**: GPT Image 1 via emergentintegrations for diagrams and visuals
- **Database**: MongoDB for source and output storage

### Image Generation for Slides
For each key slide, AI generates professional diagrams based on:
- **Slide title and content** → Determines diagram type
- **Layout type** → Selects appropriate visual style:
  - Timeline → Timeline infographic with numbered steps
  - Two-column → Comparison diagram
  - Image-left/right → Business diagram with icons
  - Keywords like "ecosystem", "platform", "journey" → Hub-and-spoke or flow diagrams
- **Theme colors** → Applies consistent color scheme

### Frontend (React + pptxgenjs)
- **AI-Generated Images** embedded directly in PPTX slides
- **Professional layouts** with images positioned contextually
- **6 theme presets** auto-selected based on content analysis

## What's Been Implemented (Jan 2026)
- [x] PDF and DOCX text extraction
- [x] AI-powered slide content generation from actual sources
- [x] AI-generated professional diagrams for key slides (GPT Image 1)
- [x] Images embedded in PPTX via base64
- [x] Multiple slide layouts (title, bullets, timeline, two-column, image layouts)
- [x] Themed presentations with consistent color schemes
- [x] Source and output persistence

## Image Generation Details
- Generates ~8 images per presentation for key content slides
- Each image takes ~15-20 seconds to generate
- Total generation time: ~3-4 minutes for full presentation with images
- Images are professional business diagrams, not photos

## Next Tasks
1. Add image caching to reduce regeneration time
2. Add chart generation for data slides
3. Support more file types (XLSX for tables)
4. User authentication
