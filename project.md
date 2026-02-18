# OpenWork AI - Technical Architecture & Project Roadmap

**OpenWork AI** is a medical research synthesis platform utilizing a **7-agent architecture** and **Gemini 3.0** models to deliver grounded, evidence-first insights from authoritative medical literature.

---

## 🎯 **Mission Statement**
To empower healthcare professionals by transforming the vast landscape of medical literature into coherent, synthesized research insights, saving critical time and ensuring every claim is backed by peer-reviewed evidence.

---

## 🏛️ **System Architecture**

OpenWork AI is built on a modular, agentic pipeline that prioritizes accuracy, speed, and traceability.

### **The 7-Agent Pipeline**

| Agent | Component | AI Model | Key Responsibility |
| :--- | :--- | :--- | :--- |
| **1** | **Query Intelligence** | Gemini 3.0 Flash | Entity extraction, query expansion, and sub-agent routing. |
| **2** | **Retrieval Coordinator** | Python Async | Parallel execution of sub-agents 2.1 - 2.5 across 46+ databases. |
| **3** | **Evidence Normalizer** | Utility (No LLM) | Format standardization and cross-source deduplication. |
| **4** | **BGE Reranker** | Cross-Encoder | 2-stage ranking to identify the top 10 most relevant evidence chunks. |
| **5** | **Gap Analyzer** | Gemini 3.0 Pro | Identifying information gaps and triggering fallback web searches. |
| **6** | **Synthesis Engine** | Gemini 3.0 Pro/Flash | Generating research summaries or interactive study MCQs. |
| **7** | **Verification Gate** | Gemini 3.0 Flash | Final semantic grounding check against source text. |

---

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui.
- **AI/ML**: Google Gemini 3.0 (Flash & Pro), BAAI bge-reranker-v2-m3 (HuggingFace).
- **Backend Orchestration**: Python 3.9+ (FastAPI), Node.js.
- **Search & Retrieval**: 
    - **PubMed/PMC**: NCBI E-utilities.
    - **Drug Labels**: FDA DailyMed SPL.
    - **Guidelines**: Firestore Vector Store (Gemini Embeddings).
    - **Web Fallback**: Tavily Smart Search API.
- **Database**: Google Firestore (Vector Store for Guidelines).

---

## 📊 **Performance & Metrics**

We prioritize high-speed research synthesis without compromising on quality.

| Metric | Target | Description |
| :--- | :--- | :--- |
| **End-to-End Latency** | **30-45 seconds** | From query input to final verified synthesis. |
| **Sub-agent Retrieval** | **<10 seconds** | Parallel search across all data sources. |
| **Synthesis Speed** | **<8 seconds** | Generation time for citations and MCQs. |
| **Grounding Score** | **>70%** | Percentage of claims verified successfully by Agent 7. |

> [!NOTE]
> All cost estimations have been removed as the system is optimized for token efficiency and utilizes local ML models (BGE) to minimize API overhead.

---

## 🚀 **Evolution & Roadmap**

- **Phase 1 (Completed)**: Core 7-agent pipeline implementation and Gemini 3 integration.
- **Phase 2 (Completed)**: Multi-source expansion (PubMed, DailyMed, PMC) and Citation Engine 2.0.
- **Phase 3 (In-Progress)**: Advanced "Study Mode" MCQs with evidence-based reasoning.
- **Phase 4**: Real-time collaborative research workspaces and specialized cardiology/oncology modules.

---

## 🔒 **Security & Compliance**

- **Non-Diagnostic Focus**: Strict architecture prompts ensure no diagnostic or clinical recommendations are generated.
- **Data Privacy**: No Patient Health Information (PHI) is processed or stored.
- **Credential Safety**: All API keys are managed via environment variables and sanitized in project files.