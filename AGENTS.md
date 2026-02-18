# OpenWork AI - Agent Architecture & technical Breakdown

**OpenWork AI** is a professional **research synthesis tool** specifically designed for healthcare professionals. It utilizes a sophisticated **7-agent architecture** powered by **Gemini 3.0** models to retrieve, analyze, and synthesize medical literature with absolute grounding and zero hallucinations.

---

## 🏛️ **Architecture Overview**

OpenWork AI operates as a deterministic pipeline of AI agents, each specialized for a distinct cognitive task. The system avoids clinical recommendations, focusing instead on high-fidelity evidence extraction and synthesis.

![Agent 1 & 2 Workflow](https://storage.googleapis.com/openwork-images/mermaid-diagram%20(sub-agents).png)

---

## 🧠 **Agent 1: Query Intelligence**

- **File**: `lib/agents/query-intelligence.ts`
- **Model**: `gemini-3.0-flash-preview` (ThinkingLevel: HIGH)
- **Purpose**: Transform raw natural language into a structured research strategy.

### **Core Logic**
1. **Entity Extraction**: Identifies medical conditions, pharmacological agents, and clinical populations.
2. **Abbreviation Expansion**: Deterministically expands terms (e.g., "COPD" → "Chronic Obstructive Pulmonary Disease").
3. **Intent Classification**: Categorizes the query (e.g., `research`, `education`, `pharmacology`) to optimize sub-agent routing.
4. **Search Variant Generation**: Creates 3-5 optimized search queries per sub-agent.

---

## 🔄 **Agent 2: Multi-Source Retrieval Coordinator**

- **File**: `lib/agents/multi-source-retrieval.ts`
- **Purpose**: Orchestrate parallel retrieval from 46+ medical databases via 5 specialized sub-agents.

### **Sub-Agent 2.1: Guidelines Retriever**
- **File**: `lib/agents/sub-agents/guidelines-retriever.ts`
- **Source**: Firestore Vector Store (ICMR, AIIMS, RSSDI, etc.)
- **Logic**: Uses Gemini embeddings to find the most relevant clinical practice guideline chunks.

### **Sub-Agent 2.2: PubMed Intelligence**
- **File**: `lib/agents/sub-agents/pubmed-intelligence.ts`
- **Source**: NCBI E-utilities API
- **Logic**: Advanced Boolean query construction with MeSH term mapping to search 35M+ citations.

### **Sub-Agent 2.3: Full-Text Fetcher**
- **File**: `lib/agents/sub-agents/fulltext-fetcher.ts`
- **Source**: PMC XML & Unpaywall PDF discovery.
- **Logic**: Retrieves structured full-text to provide evidence beyond abstracts.

### **Sub-Agent 2.4: DailyMed Retriever**
- **File**: `lib/agents/sub-agents/dailymed-retriever.ts`
- **Source**: FDA DailyMed API
- **Logic**: Extracts safety, warnings, and dosing sections using LOINC-coded XML parsing.

### **Sub-Agent 2.5: Tavily Smart Search**
- **File**: `lib/agents/sub-agents/tavily-search.ts`
- **Source**: Tavily API
- **Logic**: Fallback for recent literature (2024-2026) not yet indexed in PubMed.

---

## 🔧 **Agent 3: Evidence Normalizer**

- **File**: `lib/agents/evidence-normalizer.ts`
- **Type**: Deterministic utility (Non-AI)
- **Purpose**: Standardize data from disparate formats (XML, HTML, JSON) into a unified `EvidenceCandidate` structure.
- **Function**: Deduplication and metadata cleaning across all retrieval streams.

---

## 🎯 **Agent 4: BGE Reranker**

- **File**: `lib/agents/bge-reranker.ts`
- **Model**: `BAAI/bge-reranker-v2-m3` (Cross-Encoder)
- **Purpose**: Precision ranking of evidence relevance at a granular level.
- **Two-Stage Process**:
    1. **Document-Level**: Identifies the most relevant studies from the pool of 100+ candidates.
    2. **Chunk-Level**: Cross-examines specific 1000-character segments to find the "smoking gun" evidence.

---

## 🔍 **Agent 5: Evidence Gap Analyzer**

- **File**: `lib/agents/evidence-gap-analyzer.ts`
- **Model**: `gemini-3.0-pro-exp`
- **Purpose**: Critical assessment of evidence sufficiency.
- **Logic**: analyzes the retrieved evidence pack for recency gaps or quality issues. If the evidence is insufficient for a professional synthesis, it triggers **Sub-Agent 2.5 (Tavily)** with a targeted bridge query.

---

## ✍️ **Agent 6: Synthesis Engine**

- **File**: `lib/agents/synthesis-engine.ts`
- **Model**: `gemini-3.0-pro-exp` (Complex) or `gemini-3.0-flash-preview` (Simple)
- **System Prompt**: `lib/agents/system-prompts/synthesis-engine-prompt.ts`
- **Purpose**: Generate the final research synthesis or study materials.

### **Operational Modes**
1. **Research Mode**: Generates a structured literature summary with strict inline citations (e.g., [1], [2]).
2. **Study & Learn Mode**: Generates interactive 5-question quizzes with evidence-based feedback.

---

## 🔒 **Agent 7: Verification Gate**

- **File**: `lib/agents/verification-gate.ts`
- **Model**: `gemini-3.0-flash-preview`
- **Purpose**: Anti-hallucination verification and citation audit.
- **Logic**: Extracts individual claims from the synthesis and performs a semantic grounding check against the original source text. If a claim isn't 100% verified, it is removed or rephrased.

---

## 📊 **Performance Metrics**

OpenWork AI is optimized for professional latency requirements:
- **Query Intelligence**: ~3 seconds
- **Parallel Retrieval**: ~10-15 seconds
- **Synthesis & Verification**: ~10 seconds
- **End-to-End Latency**: 30-45 seconds

---

## 🛡️ **Positioning & Boundaries**

This architecture is strictly designed for **Research Synthesis**. 
- Agents are explicitly prompted to avoid "diagnosis" or "clinical recommendation".
- Every AI output is accompanied by direct references to authoritative medical publications.
- The system prioritized **Grounding Score** over conversational fluidity.
