# Equity Research RAG

> A retrieval-augmented question-answering system purpose-built for **fundamental equity research** — turning annual reports, earnings transcripts, broker notes, and financial statements into grounded, fully source-attributed answers.

[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

---


## Overview

Equity Research RAG is an end-to-end intelligent Q&A system built from the ground up for analysts working with large volumes of unstructured financial documents — 10-K/10-Q filings, annual and interim reports, earnings call transcripts, sell-side research notes, investor presentations, and financial statements across **PDF / Word / PPT / Excel** formats.

The system was designed to handle a research knowledge base on the order of **5,000+ multi-format documents**, serving daily analyst queries with sub-2-second response times. The core engineering challenges it solves are: **complex multi-format document parsing**, **low retrieval recall on domain-specific terminology**, **multi-turn conversational understanding**, and **answer trustworthiness with full source traceability**.

### Headline Results

| Metric | Before | After |
|---|---|---|
| Retrieval MRR | 0.72 | **0.92** (+28%) |
| Document parsing accuracy | 82% | **97%** |
| Chunk-split recall | 67% | **91%** |
| User trust score | 6.8/10 | **8.4/10** |
| P99 latency | 350ms | **150ms** |

---

## System Architecture

graph TD

    %% Utility Modules
    subgraph UtilModules ["🛠️ Utility Modules"]
        Logger["📝 Logger Utils<br/>get_logger.py"]
        Database["🔌 Database Utils<br/>database.py"]
        Password["🔐 Password Utils<br/>password.py"]
        Migration["📊 DB Migration<br/>alembic"]
    end

    %% Infrastructure
    subgraph Infrastructure ["🐳 Infrastructure"]
        Docker["🐳 Docker Containerization"]
        DockerCompose["📦 Docker Compose<br/>Orchestration"]
        APIContainer("swxy_api Container")
        PostgreSQLContainer("gsk_pg Container")
        ESContainer("es01 Container")
        RedisContainer("redis Container")
        NLTKData("📚 NLTK Data Mount")
        FileVolume("📁 File Storage Mount")

        DockerCompose --> APIContainer
        DockerCompose --> PostgreSQLContainer
        DockerCompose --> ESContainer
        DockerCompose --> RedisContainer
        Docker --> NLTKData
        Docker --> FileVolume
    end

    %% Main Flow
    User["👤 User Request"]
    FastAPI["🌐 FastAPI Entry<br/>app_main.py"]

    User --> FastAPI

    Auth["🔐 JWT Auth Middleware<br/>access_security"]
    CORS["🌍 CORS Middleware"]

    FastAPI --> Auth
    FastAPI --> CORS

    Router{"🧭 Router Dispatch"}
    FastAPI --> Router

    UserRouter["👥 User Router<br/>user_rt.py"]
    HistoryRouter["📜 History Router<br/>history_rt.py"]

    Router --> UserRouter
    Router --> HistoryRouter

    subgraph ChatFlow ["💬 Chat Service Flow"]
        ChatRouter["💬 Chat Router<br/>chat_rt.py"]
        Router --> ChatRouter

        CreateSession["Create Session<br/>create_session"]
        QuickParse["Quick Parse<br/>quick_parse"]
        GetContent["Get Content<br/>get_parsed_content"]
        ChatOnDocs["Chat on Docs<br/>chat_on_docs"]
        UploadFiles["Upload Files<br/>upload_files"]

        ChatRouter --> CreateSession
        ChatRouter --> QuickParse
        ChatRouter --> GetContent
        ChatRouter --> ChatOnDocs
        ChatRouter --> UploadFiles

        QuickParseService["📄 Quick Parse Service<br/>quick_parse_service.py"]
        QuickParse --> QuickParseService

        DocumentParsers{"Document Parsers"}
        QuickParseService --> DocumentParsers

        PDFParser["PDF Parser<br/>pdfplumber"]
        DOCXParser["DOCX Parser<br/>python-docx"]
        TXTParser["TXT Parser<br/>Encoding Detection"]
        RedisStore["📦 Redis Store<br/>2-Hour Expiry"]

        DocumentParsers --> PDFParser
        DocumentParsers --> DOCXParser
        DocumentParsers --> TXTParser
        DocumentParsers --> RedisStore
    end

    subgraph FileProcessing ["📁 File Processing Flow"]
        DocumentService["📋 Document Service<br/>document_operations.py"]
        FileParser["📄 File Parsing<br/>file_parse.py"]

        UploadFiles --> DocumentService
        DocumentService --> FileParser

        subgraph DeepDocEngine ["🔍 DeepDoc Parsing Engine"]
            DeepDoc["🔍 DeepDoc Engine"]
            FileParser --> DeepDoc

            MultiParsers{"Multi-Format Parsers"}
            DeepDoc --> MultiParsers

            PDFDeepParser["PDF Parser<br/>pdf_parser.py"]
            DOCXDeepParser["DOCX Parser<br/>docx_parser.py"]
            ExcelParser["Excel Parser<br/>excel_parser.py"]
            MarkdownParser["Markdown Parser<br/>markdown_parser.py"]
            HTMLParser["HTML Parser<br/>html_parser.py"]
            JSONParser["JSON Parser<br/>json_parser.py"]
            PPTParser["PPT Parser<br/>ppt_parser.py"]

            MultiParsers --> PDFDeepParser
            MultiParsers --> DOCXDeepParser
            MultiParsers --> ExcelParser
            MultiParsers --> MarkdownParser
            MultiParsers --> HTMLParser
            MultiParsers --> JSONParser
            MultiParsers --> PPTParser

            ParsedContent["📄 Parsed Document Content"]
            DeepDoc --> ParsedContent
        end

        subgraph VisionProcessing ["🖼️ Vision Processing Submodule"]
            OCR["OCR Recognition<br/>ocr.py"]
            LayoutRec["Layout Recognition<br/>layout_recognizer.py"]
            TableRec["Table Recognition<br/>table_structure_recognizer.py"]
        end

        PDFDeepParser -.-> VisionProcessing
        DOCXDeepParser -.-> VisionProcessing
        PPTParser -.-> VisionProcessing

        ChunkProcessing["📋 Chunk Processing<br/>Chunk Splitting"]
        EmbeddingGen["🎯 Embedding Generation<br/>generate_embedding"]
        ESIndexing["📊 ES Indexing<br/>Store Chunks + Vectors"]

        ParsedContent --> ChunkProcessing
        ChunkProcessing --> EmbeddingGen
        EmbeddingGen --> ESIndexing
    end

    subgraph ChatEngine ["🤖 Chat Engine"]
        RetrievalStep["🔍 Content Retrieval"]
        ChatStep["🤖 Chat Generation"]

        ChatOnDocs --> RetrievalStep
        ChatOnDocs --> ChatStep

        subgraph RetrievalEngine ["🔍 Retrieval Engine"]
            RetrievalCore["🧠 Retrieval Core<br/>retrieval.py"]
            RAGDealer["RAG Dealer<br/>Dealer Class"]
            ESQuery["🔎 ES Query<br/>search_v2.py"]

            RetrievalStep --> RetrievalCore
            RetrievalCore --> RAGDealer
            RAGDealer --> ESQuery
        end

        ChatCore["💭 Chat Core<br/>chat.py"]
        ChatStep --> ChatCore

        GenQuestions["Generate Recommended Qs"]
        GenSessionName["Generate Session Name"]
        SaveToDB["💾 Save to DB"]

        ChatCore --> GenQuestions
        ChatCore --> GenSessionName
        ChatCore --> SaveToDB

        QuickContent["Quick Content Fetch<br/>Fetch from Redis"]
        ChatCore --> QuickContent

        HybridRanking["📊 Hybrid Ranking<br/>Vector + Full-Text Weighting"]
        KnowledgeContent["📚 Knowledge Base Fetch<br/>Return Relevant Chunks"]

        HybridRanking --> KnowledgeContent

        PromptConstruct["📝 Prompt Construction<br/>Concat KB + Quick Parse"]
        KnowledgeContent --> PromptConstruct
        QuickContent --> PromptConstruct

        LLMCall["🧠 LLM Call<br/>OpenAI/DashScope"]
        StreamResponse["📡 Streaming Response"]

        PromptConstruct --> LLMCall
        LLMCall --> StreamResponse
    end

    subgraph DataStorage ["💾 Data Storage Layer"]
        Elasticsearch[("🔍 Elasticsearch<br/>Doc Index/Vector Data")]
        PostgreSQL[("🐘 PostgreSQL<br/>Users/Sessions/Messages")]
        Redis[("🔴 Redis<br/>Temp Content Cache")]
        FileStorage[("📁 Local File Storage<br/>storage/file/")]

        UserTable("👤 users table")
        SessionTable("💬 sessions table")
        MessageTable("💭 messages table")
        KBTable("📚 knowledge_bases table")
        UploadTable("📋 document_uploads table")

        PostgreSQL --> UserTable
        PostgreSQL --> SessionTable
        PostgreSQL --> MessageTable
        PostgreSQL --> KBTable
        PostgreSQL --> UploadTable
    end

    ESQuery --> Elasticsearch
    Elasticsearch --> HybridRanking
    ESIndexing --> Elasticsearch
    SaveToDB --> PostgreSQL
    RedisStore --> Redis
    DocumentService --> FileStorage

    subgraph ExternalServices ["🌍 External Services"]
        OpenAI["🤖 OpenAI API<br/>GPT Models"]
        DashScope["☁️ DashScope API<br/>Alibaba Cloud LLMs"]
        EmbeddingAPI["🎯 Embedding API<br/>Text Vectorization"]
    end

    LLMCall --> OpenAI
    LLMCall --> DashScope
    EmbeddingGen --> EmbeddingAPI
```

---

## Pipeline Modules

### 1. Document Parsing — *parsing accuracy 82% → 97%*

Robust ingestion across the messy reality of financial documents (PDF / PPT / scanned files / multi-format).

- **Structured PDF parsing** — layout analysis (Deepdoc / LayoutLMv3-style) optimized for the table-heavy nature of financial documents. For **borderless tables** (common in financial statements), integrate a TabRec model (e.g. MinerU 2.5) with a heuristic pre-check (column-spacing variance < 5px) to decide the parsing path: borderless-table recognition lifted from **62% → 97%**, and a rules + ML hybrid scheme raised semi-structured table accuracy from **55% → 92%**.
- **Scanned-document preprocessing pipeline** — Laplacian-variance-based dynamic grading of blur level (clear / moderate / severe). Moderate blur runs a *denoise → sharpen → super-resolution (Real-ESRGAN) → contrast-enhance* chain; severely blurred pages fall back directly to MinerU. **OCR accuracy 73% → 94%.**
- **Watermark / stamp removal** — a watermark-detection model combining ResNet feature extraction with U-Net semantic segmentation, plus a grayscale-variance heuristic (watermark gray < 30, text > 80) as a prior, achieving pixel-level separation of watermark and text, then inpainting to fill the watermark region. Throughput ~**1.8s/page**.
- **Custom finance tokenizer dictionary** — a domain dictionary of **500+ terms** integrated with jieba-style segmentation, tuned for specialized vocabulary (e.g. *EBITDA*, *free cash flow*, *goodwill impairment*, *segment reporting*). Tokenization accuracy **73% → 96%.**

### 2. Semantic Chunking — *chunk-split recall 67% → 91%*

A chunking strategy with **semantic awareness** that respects financial document structure rather than slicing blindly by token count.

- **Document hierarchy detection** — an **XGBoost hierarchy classifier** identifies section levels using features such as numbering style, font size, bold/not, indentation depth, and relative position; **94% accuracy on a 500-document labeled set**, resolving the inconsistent and irregular numbering of filings (~23% of documents have skipped / repeated / mixed numbering).
- **Semantic-completeness splitting** — recursive splitting along the document tree (section → subsection → paragraph) with a `should_merge` rule (list lead-ins, transition-word detection, semantic similarity > 0.75) to decide whether to merge, avoiding truncation of key disclosures. **Truncation rate 23% → 4%.**
- **Table-aware chunking** — small tables (< 1024 tokens) kept whole as a single chunk; large tables split by row but with the header repeated in every chunk to avoid LLM misreads; figures/charts described via a vision LLM (GPT-4V) or extracted to data via a chart-to-data model (Deplot).
- **Intelligent overlap design** — sentence-boundary-based overlap (100 tokens) with `truncate_to_sentence_boundary` to guarantee overlap edges are complete sentences, eliminating ~87% of mid-sentence truncation. Recall **0.89 → 0.91**. Chunk size set to **1024** (chosen by experiment over 512 / 1024 / 2048 as the best recall/cost tradeoff).
- **Chunk metadata management** — records `section_path` (section breadcrumb), `page_num`, `bbox` coordinates, `content_type`, `is_key_clause` (key-disclosure flag), and `prev/next_chunk_id` (for context expansion), supporting answer traceability and precise location.

### 3. Hybrid Retrieval & Reranking — *MRR 0.72 → 0.92*

- **Hybrid retrieval architecture** — parallel dense retrieval (a finance-tuned embedding model such as `bge-large-zh-v1.5` + **Milvus HNSW** index) and keyword retrieval (**BM25 + Elasticsearch**), fused with the **RRF algorithm (Reciprocal Rank Fusion)** to avoid score-normalization problems. Ablations show RRF beats weighted-sum fusion by ~3 MRR points (0.87 vs 0.84).
- **Dynamic weighting strategy** — two-stage intent detection: (1) a fast semantic-similarity pass (threshold 0.6); (2) an LLM second-pass confirmation for the uncertain middle band. **Precise queries** (containing specific terms / figures) use a (0.3 vector, 0.7 keyword) weighting; **conceptual queries** use (0.7 vector, 0.3 keyword). Grid-search tuning of the weight parameters lifted overall **MRR 0.84 → 0.89**.
- **Embedding fine-tuning** — built **2,000 finance-domain triplets** (`query`, `positive_doc`, `negative_doc`), used **Hard Negative Mining** to surface hard negatives (chunks that rank 2–10 but are actually irrelevant), and fine-tuned the embedding model with **Contrastive Loss**. On specialized-term queries, **Recall@5 rose from 0.87 → 0.93 (+6%)**.
- **Cross-encoder reranking** — a reranker (e.g. `bge-reranker-large`) re-scores the coarse top-10. **Batched inference (batch=10) + INT8 quantization** cut latency from **300ms → 80ms** while lifting **MRR to 0.92**. An **NLI model (RoBERTa-MNLI)** validates entailment between answer and evidence; LLM-hallucination detection accuracy **94%**.
- **Query optimization** — (1) **Query expansion**: the LLM generates 3 phrasings (colloquial / formal / jargon), raising recall from 0.87 → 0.91 at +2x latency, so it's used only on core business scenarios; (2) **HyDE**: generate a hypothetical answer document, then retrieve against it to improve semantic-query results.
- **Evaluation system** — a test set of **500 documents × 10 questions (2,000 QA pairs)**, with **MRR / Precision@K / NDCG@K / retrieval latency** metrics, and a weekly bad-case analysis loop (SQL query for `hit=False` cases) driving continuous iteration.

### 4. Answer Generation & Multi-Turn Dialogue — *answer accuracy 0.89 → 0.94, satisfaction 88%*

- **Multi-turn query rewriting** — a two-stage strategy judges topic continuity: (1) fast similarity check (threshold 0.6); (2) an LLM second-pass when uncertain. The LLM rewrites the query using the most recent 3 turns of history, resolving pronouns ("it", "that one") to concrete entities. **Rewrite accuracy 94%** (e.g. "is that loss covered" → "is the loss covered under the policy's scope").
- **Conversation-history compression** — a **sliding-window + summarization** mechanism: keep the most recent 5 turns verbatim, summarize earlier turns with the LLM (≤ 50 words) to keep input tokens < 1500, supporting **20+ turns** without overflow. Session history stored in **Redis (TTL = 24h)**, isolated per `session_id`.
- **Answer attribution & traceability** — a **post-hoc grounding** approach: each answer sentence is matched to retrieved chunks via Sentence-BERT similarity plus **NLI verification (entailment > 0.7)** to decide whether a document supports the sentence. **Attribution accuracy 94%.** With `section_path`, `page_num`, and `bbox` in chunk metadata, the frontend renders citations like **`[1] §3.1 · p.5`** with jump-to-source.
- **Hallucination detection & handling** — for unverified sentences (no supporting document), judge whether they contain factual claims (numbers, identifiers, strong assertions); high-risk sentences are removed, low-risk ones marked **"⚠️ no supporting source found."** Hallucination-detection recall **87%**; user trust **6.8/10 → 8.4/10**; complaint rate **2.3% → 0.8%**.
- **Prompt engineering** — a multi-turn QA prompt that fuses dialogue history with retrieval results, enforcing conversational coherence and answer consistency; **streaming responses (WebSocket)** return the answer token-by-token.

### 5. System Engineering & Performance — *100+ QPS, P99 350ms → 150ms*

- **Distributed architecture** — production deployment across **6 servers**: API gateway (**FastAPI, 4 workers + Nginx**), session layer (**Redis Cluster, 3 primary + 3 replica**), retrieval cluster (**distributed Milvus, 2 nodes + Elasticsearch, 2 nodes primary/replica**), model serving (**2× A10 GPU + Triton Server**), and storage/monitoring (**MinIO + Prometheus + Grafana**). Monthly cost ~**$5,200**.
- **Three-pronged performance optimization** — (1) **Redis caching** of frequent queries: 42% hit rate, cache-hit latency 500ms → 50ms; (2) **async parallelism**: vector search and BM25 run concurrently, latency 120ms (serial) → 75ms; (3) **batching**: embedding batched inference (batch=32), per-request latency 30ms → 1.6ms.
- **Monitoring & alerting** — Prometheus + Grafana track QPS, P50/P95/P99 latency, retrieval recall, GPU utilization, and cache hit rate; alert rules (P95 latency > 2s, recall < 0.85 trigger notifications); weekly review of 100 bad cases feeding back into optimization.
- **A/B testing** — reranker upgrade (base → large) tested at 50% traffic for 2 weeks: thumbs-up rate **81% → 87% (p<0.01)**; +70ms latency but clearly higher satisfaction, rolled out fully. Dynamic-weighting strategy tested at 30% traffic: **MRR 0.84 → 0.89 (+6%)**, rolled out fully.
- **Engineering standards** — an evaluation dataset (2,000 QA pairs), a finance-domain dictionary (500+ terms), and a weekly bad-case review process (50 cases/week), distilling a reusable RAG framework codebase and documentation to support fast transfer to other domains.

---

## Project Outcomes

- **Retrieval quality** — MRR 0.72 → **0.92 (+28%)**, Top-5 recall **93%**, P99 latency 350ms → **150ms**; parsing accuracy 82% → **97%**, chunk-split recall 67% → **91%**.
- **Answer quality** — answer accuracy **94%**, user satisfaction (thumbs-up) **88%**, user trust 6.8/10 → **8.4/10**, complaint rate (wrong answers) 2.3% → **0.8% (−65%)**; ~32% of users actively check the source documents.
- **Reusable assets** — a finance-domain evaluation dataset (2,000 QA pairs), a specialized dictionary (500+ terms), and a reusable RAG framework, with technical documentation and best practices that provide a standardized blueprint for follow-on projects.

---

## Quick Start

### Prerequisites

- Python 3.10+
- Docker & Docker Compose (for Milvus, Elasticsearch, Redis)
- GPU recommended for embedding / reranking model inference

### Installation

```bash
git clone https://github.com/<your-username>/Fundamental-Equity-Research-RAG.git
cd equity-research-rag

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Start backing services (Milvus, Elasticsearch, Redis)
docker compose up -d
```

### Configuration

```bash
cp .env.example .env
```

```dotenv
# .env
LLM_API_KEY=your_key_here
EMBEDDING_MODEL=bge-large-zh-v1.5
RERANKER_MODEL=bge-reranker-large
MILVUS_HOST=localhost
MILVUS_PORT=19530
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379
```

### Usage

```bash
# 1. Ingest documents (parsing -> chunking -> indexing)
python ingest.py --input ./data/filings --collection equity_research

# 2. Start the API server
python app.py

# 3. Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What drove revenue growth in the latest annual report?"}'
```

---

## Project Structure

```
equity-research-rag/
├── ingest.py              # Document ingestion pipeline
├── app.py                 # FastAPI application entrypoint
├── parsing/               # PDF / Office / OCR / watermark removal
├── chunking/              # Semantic chunking & metadata
├── retrieval/             # Hybrid search, RRF, dynamic weighting, rerank
├── generation/            # Answer generation, attribution, hallucination checks
├── eval/                  # Evaluation harness & bad-case analysis
├── docs/                  # Documentation (optional GitHub Pages source)
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## Evaluation

```bash
python -m eval.run --testset ./eval/testset.jsonl
```

Reports MRR, Precision@K, NDCG@K, and retrieval latency over the test set, and logs `hit=False` cases for weekly bad-case review.

---

## Roadmap

- [ ] Support for additional financial document formats
- [ ] Multi-language support (English + Chinese filings)
- [ ] Agentic multi-hop reasoning across multiple documents
- [ ] Portfolio-level cross-company comparison queries

---

## Documentation Site (GitHub Pages)

You can host this README (or a fuller docs set) as a free website via **GitHub Pages**: go to **Settings → Pages**, set the source to **Deploy from a branch**, and pick either the repo root or a `/docs` folder. The site goes live at `https://<your-username>.github.io/<repository-name>/`. For a richer docs site, MkDocs Material (`pip install mkdocs-material` then `mkdocs gh-deploy`) works well — ask if you'd like a step-by-step setup.

---

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

Built on open-source components including Milvus, Elasticsearch, FastAPI, Triton, and the broader RAG ecosystem.

