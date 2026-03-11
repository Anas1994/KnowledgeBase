from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
from bs4 import BeautifulSoup
import PyPDF2
import io
from docx import Document as DocxDocument
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ─── MODELS ─────────────────────────────────────────────────────────────────

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Source(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: str  # pdf, url, txt, etc.
    content: str  # extracted text content
    chunks: int = 0
    size: str = ""
    status: str = "processing"  # processing, indexed, error
    url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notebook_id: str = "default"

class SourceCreate(BaseModel):
    title: str
    type: str
    url: Optional[str] = None
    notebook_id: str = "default"

class GenerateRequest(BaseModel):
    output_type: str  # slides, report, mindmap, flashcards, quiz, audio, video, infographic, datatable
    notebook_id: str = "default"
    title: str = ""

class GenerateResponse(BaseModel):
    id: str
    type: str
    title: str
    content: str
    slides_data: Optional[List[dict]] = None  # For PPTX generation
    theme: Optional[str] = None  # Theme for styling

# ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

async def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""

async def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = DocxDocument(io.BytesIO(file_content))
        text_parts = []
        
        # Extract text from paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text.strip())
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    if cell.text.strip():
                        row_text.append(cell.text.strip())
                if row_text:
                    text_parts.append(" | ".join(row_text))
        
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return ""

async def extract_text_from_url(url: str) -> str:
    """Extract text content from URL"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get text
            text = soup.get_text(separator='\n', strip=True)
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            text = '\n'.join(line for line in lines if line)
            return text[:50000]  # Limit to 50k chars
    except Exception as e:
        logger.error(f"URL extraction error: {e}")
        return ""

def count_chunks(text: str, chunk_size: int = 500) -> int:
    """Count approximate chunks for indexing"""
    words = text.split()
    return max(1, len(words) // chunk_size)

async def generate_with_ai(prompt: str, system_message: str = "You are an expert research assistant.") -> str:
    """Generate content using GPT-5.1 via Emergent"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-5.1")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# ─── ROUTES ─────────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "NotebookLM API Ready"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# ─── SOURCE MANAGEMENT ──────────────────────────────────────────────────────

@api_router.post("/sources/upload")
async def upload_source(file: UploadFile = File(...), notebook_id: str = "default"):
    """Upload and process a document file (PDF, DOCX, TXT, etc.)"""
    try:
        content = await file.read()
        filename = file.filename or "unknown"
        file_ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'
        
        logger.info(f"Processing file: {filename}, extension: {file_ext}, size: {len(content)} bytes")
        
        # Extract text based on file type
        if file_ext == 'pdf':
            text = await extract_text_from_pdf(content)
            file_type = 'pdf'
        elif file_ext in ['docx', 'doc']:
            text = await extract_text_from_docx(content)
            file_type = 'docx'
        elif file_ext == 'txt':
            text = content.decode('utf-8', errors='ignore')
            file_type = 'txt'
        else:
            # Try to decode as text first, fallback to docx if it looks like a ZIP
            try:
                if content[:4] == b'PK\x03\x04':  # ZIP file signature (DOCX is a ZIP)
                    text = await extract_text_from_docx(content)
                    file_type = 'docx'
                else:
                    text = content.decode('utf-8', errors='ignore')
                    file_type = 'txt'
            except:
                text = content.decode('utf-8', errors='ignore')
                file_type = 'txt'
        
        logger.info(f"Extracted text length: {len(text)} chars")
        
        if not text or len(text.strip()) < 10:
            raise HTTPException(status_code=400, detail=f"Could not extract readable text from file. File type: {file_ext}")
        
        # Create source document
        source = Source(
            title=filename.rsplit('.', 1)[0] if '.' in filename else filename,
            type=file_type,
            content=text,
            chunks=count_chunks(text),
            size=f"{len(content) / 1024:.1f} KB",
            status="indexed",
            notebook_id=notebook_id
        )
        
        # Store in MongoDB
        doc = source.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.sources.insert_one(doc)
        
        return {
            "id": source.id,
            "title": source.title,
            "type": source.type,
            "chunks": source.chunks,
            "size": source.size,
            "status": source.status,
            "content_preview": text[:200] + "..." if len(text) > 200 else text
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/sources/url")
async def add_url_source(data: SourceCreate):
    """Add a URL as a source"""
    try:
        if not data.url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        text = await extract_text_from_url(data.url)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from URL")
        
        source = Source(
            title=data.title or data.url,
            type="url",
            content=text,
            chunks=count_chunks(text),
            size="—",
            status="indexed",
            url=data.url,
            notebook_id=data.notebook_id
        )
        
        doc = source.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.sources.insert_one(doc)
        
        return {
            "id": source.id,
            "title": source.title,
            "type": source.type,
            "chunks": source.chunks,
            "status": source.status,
            "url": source.url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL add error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/sources")
async def get_sources(notebook_id: str = "default"):
    """Get all sources for a notebook"""
    sources = await db.sources.find(
        {"notebook_id": notebook_id}, 
        {"_id": 0, "content": 0}  # Exclude large content field
    ).to_list(100)
    return sources

@api_router.get("/sources/{source_id}")
async def get_source(source_id: str):
    """Get a specific source with content"""
    source = await db.sources.find_one({"id": source_id}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source

@api_router.delete("/sources/{source_id}")
async def delete_source(source_id: str):
    """Delete a source"""
    result = await db.sources.delete_one({"id": source_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"status": "deleted"}

# ─── AI GENERATION ──────────────────────────────────────────────────────────

@api_router.post("/generate", response_model=GenerateResponse)
async def generate_output(request: GenerateRequest):
    """Generate AI-powered output from sources"""
    
    # Get all indexed sources for the notebook
    sources = await db.sources.find(
        {"notebook_id": request.notebook_id, "status": "indexed"},
        {"_id": 0}
    ).to_list(50)
    
    if not sources:
        raise HTTPException(status_code=400, detail="No indexed sources found. Please add sources first.")
    
    # Combine source content (limit to avoid token overflow)
    combined_content = ""
    for src in sources:
        combined_content += f"\n\n--- SOURCE: {src['title']} ---\n{src.get('content', '')[:10000]}"
    combined_content = combined_content[:40000]  # Limit total content
    
    source_titles = [s['title'] for s in sources]
    title = request.title or f"{request.output_type.title()} - Research Summary"
    
    # Generate based on output type
    if request.output_type == "slides":
        return await generate_slides(combined_content, source_titles, title)
    elif request.output_type == "report":
        return await generate_report(combined_content, source_titles, title)
    elif request.output_type == "mindmap":
        return await generate_mindmap(combined_content, source_titles, title)
    elif request.output_type == "flashcards":
        return await generate_flashcards(combined_content, source_titles, title)
    elif request.output_type == "quiz":
        return await generate_quiz(combined_content, source_titles, title)
    elif request.output_type == "audio":
        return await generate_audio_script(combined_content, source_titles, title)
    elif request.output_type == "datatable":
        return await generate_datatable(combined_content, source_titles, title)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown output type: {request.output_type}")

async def generate_slides(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate PowerPoint slide content using AI with rich formatting"""
    
    prompt = f"""Based on the following research content from {len(sources)} sources, create a professional PowerPoint presentation.

SOURCES ANALYZED: {', '.join(sources)}

CONTENT:
{content}

Create a presentation with exactly 8-10 slides. For each slide, provide:
1. A clear, concise title (max 8 words)
2. 3-5 bullet points with key insights (each bullet max 15 words)
3. Speaker notes (2-3 sentences explaining the slide)
4. Layout type: "title", "bullets", "two-column", "image-left", "image-right", "quote", "timeline", "comparison"
5. An image search keyword (1-3 words) that represents this slide's content visually
6. An icon name from this list that best represents the slide: home, briefcase, chart, users, cog, shield, cloud, mobile, check, lightbulb, rocket, target, clock, globe, lock, server, database, code, team, growth

Format your response as JSON array:
[
  {{
    "slideNumber": 1,
    "title": "Slide Title Here",
    "subtitle": "Optional subtitle for title slides",
    "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
    "notes": "Speaker notes explaining this slide content.",
    "layout": "title",
    "imageKeyword": "technology innovation",
    "icon": "rocket",
    "highlight": "Key phrase to emphasize"
  }}
]

Slide 1 should be "title" layout with subtitle.
Include variety of layouts: use "two-column" for comparisons, "timeline" for phases, "image-left/right" for key concepts.
Only output the JSON array, no other text."""

    response = await generate_with_ai(prompt, "You are an expert presentation designer. Create visually engaging, professional slide content with varied layouts.")
    
    # Parse JSON response
    try:
        import json
        # Clean response - extract JSON from response
        response_clean = response.strip()
        if response_clean.startswith("```"):
            response_clean = response_clean.split("```")[1]
            if response_clean.startswith("json"):
                response_clean = response_clean[4:]
        slides_data = json.loads(response_clean)
        
        # Ensure all slides have required fields with defaults
        for slide in slides_data:
            slide.setdefault('layout', 'bullets')
            slide.setdefault('imageKeyword', 'business')
            slide.setdefault('icon', 'briefcase')
            slide.setdefault('subtitle', '')
            slide.setdefault('highlight', '')
            slide.setdefault('bullets', [])
            slide.setdefault('notes', '')
    except Exception as e:
        logger.error(f"JSON parse error: {e}")
        # Fallback if JSON parsing fails
        slides_data = [
            {"slideNumber": 1, "title": title, "subtitle": f"Based on {len(sources)} sources", "bullets": [], "notes": "Title slide", "layout": "title", "imageKeyword": "presentation", "icon": "briefcase"},
            {"slideNumber": 2, "title": "Key Findings", "bullets": ["Analysis in progress", "See full content below"], "notes": response[:500], "layout": "bullets", "imageKeyword": "analysis", "icon": "chart"}
        ]
    
    # Determine theme based on content keywords
    content_lower = content.lower()
    if any(word in content_lower for word in ['tech', 'software', 'code', 'development', 'app', 'digital']):
        theme = 'tech'
    elif any(word in content_lower for word in ['finance', 'money', 'budget', 'cost', 'revenue', 'profit']):
        theme = 'finance'
    elif any(word in content_lower for word in ['health', 'medical', 'patient', 'care', 'hospital']):
        theme = 'health'
    elif any(word in content_lower for word in ['education', 'learn', 'student', 'school', 'training']):
        theme = 'education'
    elif any(word in content_lower for word in ['home', 'house', 'smart', 'automation', 'iot']):
        theme = 'smart_home'
    else:
        theme = 'corporate'
    
    # Create text version for preview
    text_content = f"📊 PRESENTATION: {title}\n\nSources: {', '.join(sources)}\nTheme: {theme}\n\n"
    for slide in slides_data:
        text_content += f"\n{'='*50}\nSlide {slide.get('slideNumber', '?')}: {slide.get('title', 'Untitled')} [{slide.get('layout', 'bullets')}]\n{'='*50}\n"
        if slide.get('subtitle'):
            text_content += f"Subtitle: {slide.get('subtitle')}\n"
        for bullet in slide.get('bullets', []):
            text_content += f"• {bullet}\n"
        if slide.get('highlight'):
            text_content += f"💡 Highlight: {slide.get('highlight')}\n"
        text_content += f"🖼️ Image: {slide.get('imageKeyword', 'business')}\n"
        text_content += f"\n📝 Notes: {slide.get('notes', '')}\n"
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="slides",
        title=title,
        content=text_content,
        slides_data=slides_data,
        theme=theme
    )

async def generate_report(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate a structured research report"""
    
    prompt = f"""Based on the following research content from {len(sources)} sources, create a comprehensive research report.

SOURCES: {', '.join(sources)}

CONTENT:
{content}

Create a well-structured report with:
1. Executive Summary (2-3 paragraphs)
2. Introduction & Background
3. Key Findings (with specific details from sources)
4. Analysis & Insights
5. Conclusions
6. Recommendations

Use markdown formatting. Include specific citations to the sources where relevant.
Be thorough, analytical, and professional."""

    response = await generate_with_ai(prompt, "You are an expert research analyst. Create detailed, well-structured reports.")
    
    report = f"""📄 RESEARCH REPORT

Title: {title}
Generated: {datetime.now().strftime('%B %d, %Y')}
Sources: {len(sources)} documents analyzed

{'═'*60}

{response}

{'═'*60}

SOURCES REFERENCED:
{chr(10).join(f'• {s}' for s in sources)}
"""
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="report",
        title=title,
        content=report
    )

async def generate_mindmap(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate a mind map structure"""
    
    prompt = f"""Based on the following content from {len(sources)} sources, create a detailed mind map structure.

SOURCES: {', '.join(sources)}

CONTENT:
{content}

Create a hierarchical mind map with:
- One central topic
- 4-6 main branches
- 2-4 sub-branches for each main branch
- Key concepts and connections

Format as an ASCII tree structure using ├── and └── characters.
Make it comprehensive and capture all major themes."""

    response = await generate_with_ai(prompt, "You are an expert at organizing information visually. Create clear mind maps.")
    
    mindmap = f"""🗺️ MIND MAP: {title}

Generated from {len(sources)} sources: {', '.join(sources)}

{'─'*60}

{response}

{'─'*60}
"""
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="mindmap",
        title=title,
        content=mindmap
    )

async def generate_flashcards(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate study flashcards"""
    
    prompt = f"""Based on the following content from {len(sources)} sources, create 15-20 study flashcards.

SOURCES: {', '.join(sources)}

CONTENT:
{content}

For each flashcard provide:
- A clear question (Q:)
- A concise answer (A:)

Cover key concepts, definitions, relationships, and important facts.
Make questions that test understanding, not just memorization."""

    response = await generate_with_ai(prompt, "You are an expert educator. Create effective study flashcards.")
    
    flashcards = f"""🃏 FLASHCARD SET: {title}

Generated from {len(sources)} sources
Total cards: ~15-20

{'═'*50}

{response}

{'═'*50}
"""
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="flashcards",
        title=title,
        content=flashcards
    )

async def generate_quiz(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate a quiz with various question types"""
    
    prompt = f"""Based on the following content from {len(sources)} sources, create a comprehensive quiz.

SOURCES: {', '.join(sources)}

CONTENT:
{content}

Create a quiz with:
- 5 Multiple Choice questions (with 4 options each, mark correct with ✓)
- 5 True/False questions (with answers)
- 3 Short Answer questions (with sample answers)

Format clearly with question numbers and clear answer indicators."""

    response = await generate_with_ai(prompt, "You are an expert test creator. Create challenging but fair assessments.")
    
    quiz = f"""📝 QUIZ: {title}

Generated from {len(sources)} sources
Question types: Multiple Choice, True/False, Short Answer

{'═'*50}

{response}

{'═'*50}
"""
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="quiz",
        title=title,
        content=quiz
    )

async def generate_audio_script(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate a podcast-style audio script"""
    
    prompt = f"""Based on the following content from {len(sources)} sources, create an engaging podcast script for two hosts.

SOURCES: {', '.join(sources)}

CONTENT:
{content}

Create a ~10 minute podcast script with:
- Introduction and hook
- Discussion of key topics
- Interesting insights and analysis
- Conclusion and takeaways

Format as a dialogue between HOST A and HOST B.
Make it conversational, engaging, and informative."""

    response = await generate_with_ai(prompt, "You are an expert podcast scriptwriter. Create engaging audio content.")
    
    script = f"""🎙️ PODCAST SCRIPT: {title}

Duration: ~10-12 minutes
Sources: {', '.join(sources)}

{'═'*50}

{response}

{'═'*50}

[End of script - Ready for recording]
"""
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="audio",
        title=title,
        content=script
    )

async def generate_datatable(content: str, sources: List[str], title: str) -> GenerateResponse:
    """Generate structured data extraction"""
    
    prompt = f"""Based on the following content from {len(sources)} sources, extract key data into structured tables.

SOURCES: {', '.join(sources)}

CONTENT:
{content}

Create:
1. A summary table of main topics/entities found
2. A comparison table if applicable
3. Key statistics or metrics mentioned
4. Timeline of events if applicable

Use ASCII table formatting with | and - characters.
Include all relevant data points from the sources."""

    response = await generate_with_ai(prompt, "You are an expert data analyst. Extract and structure information clearly.")
    
    datatable = f"""📋 DATA EXTRACTION: {title}

Sources analyzed: {len(sources)}
{', '.join(sources)}

{'═'*50}

{response}

{'═'*50}
"""
    
    return GenerateResponse(
        id=str(uuid.uuid4()),
        type="datatable",
        title=title,
        content=datatable
    )

# ─── OUTPUT STORAGE ─────────────────────────────────────────────────────────

class SaveOutputRequest(BaseModel):
    id: str
    type: str
    title: str
    content: str
    slides_data: Optional[List[dict]] = None
    notebook_id: str = "default"

@api_router.post("/outputs")
async def save_output(request: SaveOutputRequest):
    """Save a generated output to the database"""
    doc = {
        "id": request.id,
        "type": request.type,
        "title": request.title,
        "content": request.content,
        "slides_data": request.slides_data,
        "notebook_id": request.notebook_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "size": f"{len(request.content) / 1024:.1f} KB"
    }
    await db.outputs.insert_one(doc)
    return {"status": "saved", "id": request.id}

@api_router.get("/outputs")
async def get_outputs(notebook_id: str = "default"):
    """Get all outputs for a notebook"""
    outputs = await db.outputs.find(
        {"notebook_id": notebook_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return outputs

@api_router.delete("/outputs/{output_id}")
async def delete_output(output_id: str):
    """Delete an output"""
    result = await db.outputs.delete_one({"id": output_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Output not found")
    return {"status": "deleted"}

# ─── CHAT WITH SOURCES ──────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    notebook_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    citations: List[str] = []

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_sources(request: ChatRequest):
    """Chat with AI about the indexed sources"""
    
    # Get all indexed sources
    sources = await db.sources.find(
        {"notebook_id": request.notebook_id, "status": "indexed"},
        {"_id": 0}
    ).to_list(50)
    
    if not sources:
        return ChatResponse(
            response="No sources have been indexed yet. Please add some documents or URLs first.",
            citations=[]
        )
    
    # Combine source content
    combined_content = ""
    for src in sources:
        combined_content += f"\n\n--- SOURCE: {src['title']} ---\n{src.get('content', '')[:8000]}"
    combined_content = combined_content[:35000]
    
    prompt = f"""You are a research assistant with access to the following sources:

{combined_content}

USER QUESTION: {request.message}

Based ONLY on the sources provided above, answer the user's question.
- Cite specific sources when making claims
- If information isn't in the sources, say so
- Be thorough but concise
- Use markdown formatting for clarity"""

    response = await generate_with_ai(prompt, "You are an expert research assistant. Answer questions based only on provided sources.")
    
    # Extract citations (simple approach - list sources mentioned)
    citations = []
    for src in sources:
        if src['title'].lower() in response.lower():
            citations.append(src['title'])
    
    if not citations and sources:
        citations = [sources[0]['title']]  # Default to first source
    
    return ChatResponse(
        response=response,
        citations=citations
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
