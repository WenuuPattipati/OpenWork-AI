# OpenWork AI - Medical Research Synthesis Platform

**🔬 Advanced 7-Agent AI System for Evidence-First Medical Literature Synthesis**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Gemini 3.0](https://img.shields.io/badge/AI-Gemini%203.0-blue.svg)](https://ai.google.dev/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)

OpenWork is a **research synthesis tool** specifically designed for healthcare professionals who need rapid access to high-quality medical evidence. It transforms hours of manual literature review into seconds of intelligent synthesis, acting as a research assistant that finds relevant articles from high-quality publications and circulations to provide summarized answers with inline citations.

### 🚀 **Live Demo & Video**
- **Try the App**: [Detailed Research Interface (Cloud Run)](https://openwork-217388700222.us-central1.run.app/unified)
- **Watch the Video**: [YouTube Walkthrough]()

![OpenWork Dashboard](https://storage.googleapis.com/openwork-images/dashboard.png)

---

## 🎯 **What is OpenWork AI?**

OpenWork AI is designed to save time for health professionals by automating the discovery and analysis of medical literature. It acts on behalf of clinicians to find the most relevant research and synthesize it into a grounded, evidence-first response.

### **🚫 What OpenWork AI is NOT:**
- ❌ **Not a diagnostic tool** - It does not diagnose medical conditions.
- ❌ **Not a treatment recommendation engine** - It does not provide clinical recommendations or prescribe treatments.
- ❌ **Not clinical decision support** - It does not replace the professional judgment of a healthcare provider.
- ❌ **Not patient-facing** - Designed strictly for professional and educational use.

### **✅ What OpenWork AI IS:**
- ✅ **Research Synthesis Platform** - Finds and analyzes peer-reviewed medical publications.
- ✅ **Evidence-First Assistant** - Every claim is backed by inline citations to authoritative sources.
- ✅ **Time-Saving Infrastructure** - Reduces research time from hours to under 60 seconds.
- ✅ **Educational Resource** - Features a deep-learning "Study Mode" for clinicians and students.

---

## 🏗️ **System Architecture: The 7-Agent Orchestrator**

OpenWork AI operates through a sophisticated **7-agent system** powered by **Gemini** models. Each agent is specialized for a distinct stage of the research synthesis pipeline.

### **🔄 Architecture Flow Chart**
![OpenWork AI Architecture Workflow](https://storage.googleapis.com/openwork-images/Start%20Decision%20Options%20Flow-2026-02-10-024533.png)

---

## 🤖 **The 7-Agent System Detailed**

OpenWork AI operates through a sophisticated **7-agent system** powered by **Gemini** models. Each agent is specialized for a distinct stage of the research synthesis pipeline.

### **Agent 1: Query Intelligence**
- **Purpose**: Analyzes raw natural language to extract medical entities and generate specialized search variants.
- **Function**: Abbreviation expansion, intent classification, and routing to sub-agents.

### **Agent 2: Multi-source Retrieval Coordinator (Multi-Agent RAG System)**
![OpenWork AI Multi-Source Retrieval Coordinator](https://storage.googleapis.com/openwork-images/mermaid-diagram%20(sub-agents).png)
- **Technology**: Python Async Orchestrator
- **Purpose**: Coordinates parallel evidence collection.
- **Sub-Agents (2.1 to 2.5)**:
  - **2.1: Guidelines Retriever**: Vector search across Indian clinical practice guidelines.
  - **2.2: PubMed Intelligence**: Advanced query building with MeSH term mapping.
  - **2.3: Full-Text Fetcher**: Retrieves structured content from PMC and open-access PDFs.
  - **2.4: DailyMed Retriever**: Extracts safety, dosing, and warning sections from FDA labels.
  - **2.5: Tavily Smart Search**: On-demand search for recent literature.

### **Agent 3: Evidence Normalizer**
- **Purpose**: Standardizes data from multiple formats (XML, HTML, JSON) into a unified structure.
- **Function**: Deduplication across search variants and sources.

### **Agent 4: BGE Reranker**
- **Model**: `BAAI/bge-reranker-v2-m3`
- **Purpose**: Precision ranking of evidence relevance.
- **Process**: Scores 100+ documents/chunks to find the top 10 most grounded evidence segments.

### **Agent 5: Evidence Gap Analyzer**
- **Purpose**: Evaluates evidence coverage and identifies missing elements (recency, quality gaps).
- **Function**: Conditionally triggers Agent 2.5 if gaps are detected.

### **Agent 6: Synthesis Engine**
- **Purpose**: Generates the final research synthesis or interactive study materials.
- **Function**: Handles contradictions explicitly and ensures every claim has an inline citation [N].

### **Agent 7: Verification Gate**
- **Purpose**: Final anti-hallucination verification.
- **Function**: Performs semantic grounding checks to ensure the synthesis matches the source text.

---

## 📁 **Project Structure**

```
openwork-ai/
├── 📂 app/                 # Next.js UI & Unified Mode Interface
├── 📂 components/          # React Components (Tailwind CSS)
├── 📂 lib/                 # Core Infrastructure
│   ├── 📂 agents/          # 7-Agent System implementations
│   │   └── 📂 sub_agents/  # Specific retrieval agents (PubMed, Tavily, etc.)
│   ├── 📂 evidence/        # 46+ Database Connectors
│   ├── 📂 config/          # Gemini & GCP Config
│   └── 📂 citation/        # Unified Reference Parsing
├── 📂 public/              # Medical Illustrations & Assets
├── 📂 scripts/             # Setup & Security Utilities
├── 📄 README.md            # System Overview
├── 📄 project.md           # Technical Architecture
├── 📄 Product.md           # Product Vision & Goals
└── 📄 AGENTS.md            # Detailed Agent Documentation
```
The codebase is modularly organized into a Next.js frontend for professional medical UI interactions, an orchestration layer that manages the 7-agent pipeline, and a robust data layer connecting to 46+ authoritative medical sources.

---

## ⚡ **Key Features**

- **🔬 Evidence-First Research**: **Least Hallucination** commitment with mandatory inline citations.
- **🎓 Study & Learn Mode**: Interactive 5-question quizzes with evidence-based explanations.
- **🚀 High Performance**: End-to-end synthesis in under 60 seconds.
- **🩺 Professional UX**: Designed for rapid information access in clinical workflows.

---

## 🧠 **System Prompts**

The core logic for the agents is defined in the system prompts. Below is the location of the system prompt for each agent:

| Agent | System Prompt Location |
| :--- | :--- |
| **Agent 1: Query Intelligence** | `lib/agents/query-intelligence.ts` (Embedded) |
| **Agent 2.1: Guidelines** | `lib/agents/system-prompts/guidelines-retriever-prompt.ts` |
| **Agent 2.2: PubMed** | `lib/agents/system-prompts/pubmed-intelligence-prompt.ts` |
| **Agent 2.3: Full-Text** | `lib/agents/system-prompts/fulltext-fetcher-prompt.ts` |
| **Agent 2.4: DailyMed** | `lib/agents/system-prompts/dailymed-retriever-prompt.ts` |
| **Agent 2.5: Tavily** | `lib/agents/system-prompts/tavily-search-prompt.ts` |
| **Agent 3: Evidence Normalizer** | `lib/agents/evidence-normalizer.ts` (Logic-based normalization) |
| **Agent 4: BGE Reranker** | `lib/agents/system-prompts/bge-reranker-prompt.ts` |
| **Agent 5: Evidence Gap Analyzer** | `lib/agents/evidence-gap-analyzer.ts` (Embedded) |
| **Agent 6: Synthesis Engine** | `lib/agents/synthesis-engine.ts` (Embedded) |
| **Agent 7: Verification Gate** | `lib/agents/verification-gate.ts` (Embedded) |

---

## 🔑 **API Keys & Configuration**

To run this project, you will need to configure the following API keys in your `.env.local` file.

| Service | Description | Get Key |
| :--- | :--- | :--- |
| **Google Gemini** | Core LLM for all agents | [Get Gemini Key](https://aistudio.google.com/) |
| **Tavily AI** | Web search for recent literature | [Get Tavily Key](https://tavily.com/) |
| **NCBI (PubMed)** | Access to PubMed/PMC databases | [Get NCBI Key](https://www.ncbi.nlm.nih.gov/account/) |
| **DailyMed** | FDA drug label data | [DailyMed Services](https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm) |
| **Hugging Face** | BGE Reranker Model | [BGE Reranker V2-M3](https://huggingface.co/BAAI/bge-reranker-v2-m3) |

---

## ☁️ **Data Infrastructure**

OpenWork leverages a robust Google Cloud implementation for handling medical data.

### **Raw Guidelines Storage (GCS)**
Indian medical guidelines are stored in raw format within secured Google Cloud Storage buckets.
![Google Cloud Storage - Raw Guidelines](https://storage.googleapis.com/openwork-images/Screenshot%202026-02-18%20at%208.57.08%E2%80%AFpm.png)

### **Vector Database (Firestore)**
Processed guidelines are chunked and stored as vector embeddings in Firestore for semantic retrieval.
![Firestore - Vector Embeddings](https://storage.googleapis.com/openwork-images/Screenshot%202026-02-09%20at%207.16.21%E2%80%AFpm.png)

---

## 🚀 **Quick Start**

1. **Install**: `npm install && pip install -r requirements.txt`
2. **Configure**: Copy `.env.example` to `.env.local` and add your **Gemini** keys.
3. **Run**: `npm run dev`

---

## 🔒 **License**
Distributed under the MIT License. See `LICENSE` for details.