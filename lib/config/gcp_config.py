"""
Google Cloud Platform Configuration for Open Work
Limitless.ai Project - Indian Treatment Guidelines Priority
"""

import os
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from google.cloud import storage
from google.cloud import firestore
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Required environment variables
REQUIRED_ENV_VARS = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_CLOUD_STORAGE_BUCKET',
    'GEMINI_API_KEY',
    'GEMINI_PRO_MODEL',
    'GEMINI_FLASH_MODEL'
]

def validate_environment():
    """Validate all required environment variables are set"""
    missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")

# Validate environment on import
validate_environment()

@dataclass(frozen=True)
class GCPConfig:
    """Google Cloud Platform configuration"""
    
    # Project Configuration
    project_id: str = os.getenv('GOOGLE_CLOUD_PROJECT_ID', '')
    region: str = os.getenv('GOOGLE_CLOUD_REGION', 'us-central1')
    
    # Storage Configuration - Indian Guidelines
    storage_bucket: str = os.getenv('GOOGLE_CLOUD_STORAGE_BUCKET', '')
    storage_region: str = os.getenv('GOOGLE_CLOUD_STORAGE_BUCKET_REGION', 'us-central1')
    guidelines_path: str = 'guidelines/'
    
    # Firestore Configuration - Vector Database
    firestore_database_id: str = os.getenv('FIRESTORE_DATABASE_ID', '(default)')
    firestore_guidelines_collection: str = os.getenv('FIRESTORE_COLLECTION_GUIDELINES', 'indian_treatment_guidelines')
    firestore_chunks_collection: str = os.getenv('FIRESTORE_COLLECTION_GUIDELINE_CHUNKS', 'guideline_chunks')
    
    # Authentication
    credentials_path: str = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './gcp-service-account.json')

@dataclass(frozen=True)
class GeminiConfig:
    """Gemini Model Configuration - STRICT 3.0 ONLY"""
    
    # API Configuration
    api_key: str = os.getenv('GEMINI_API_KEY', '')
    
    # Model Specifications - ONLY 3.0 Models
    flash_model: str = os.getenv('GEMINI_FLASH_MODEL', 'gemini-3-flash-preview')
    pro_model: str = os.getenv('GEMINI_PRO_MODEL', 'gemini-3-pro-preview')

    # Agent-Specific Model Assignments
    # Agent 1: Query Intelligence - Uses Flash for speed and reasoning
    agent_1_model: str = os.getenv('AGENT_1_MODEL', 'gemini-3-flash-preview')  # Query Intelligence
    agent_5_model: str = os.getenv('AGENT_5_MODEL', 'gemini-3-pro-preview')  # Evidence Gap Analyzer
    agent_6_model: str = os.getenv('AGENT_6_MODEL', 'gemini-3-pro-preview')  # Synthesis Engine (ALWAYS PRO)
    agent_7_model: str = os.getenv('AGENT_7_MODEL', 'gemini-3-flash-preview')  # Verification Gate

    # Embedding Model
    embedding_model: str = os.getenv('GEMINI_EMBEDDING_MODEL', 'text-embedding-004')

    # Model Selection Rules
    use_pro_for_synthesis: bool = os.getenv('USE_PRO_FOR_SYNTHESIS', 'true').lower() == 'true'
    use_pro_for_complex_queries: bool = os.getenv('USE_PRO_FOR_COMPLEX_QUERIES', 'true').lower() == 'true'
    use_pro_for_contradictions: bool = os.getenv('USE_PRO_FOR_CONTRADICTIONS', 'true').lower() == 'true'
    
    # Fallback Model
    fallback_model: str = os.getenv('FALLBACK_MODEL', 'gemini-3-flash-preview')
    
    # Generation Configuration
    temperature: float = 0.2
    max_output_tokens: int = 1000
    top_p: float = 0.8
    top_k: int = 40

@dataclass(frozen=True)
class DataSourceConfig:
    """Data Source Priority Configuration"""
    
    # Priority Order (1 = highest)
    priority_indian_guidelines: int = int(os.getenv('PRIORITY_INDIAN_GUIDELINES', '1'))
    priority_pubmed: int = int(os.getenv('PRIORITY_PUBMED', '2'))
    priority_pmc_fulltext: int = int(os.getenv('PRIORITY_PMC_FULLTEXT', '3'))
    priority_dailymed: int = int(os.getenv('PRIORITY_DAILYMED', '4'))
    priority_tavily_web: int = int(os.getenv('PRIORITY_TAVILY_WEB', '5'))
    
    # Guidelines Search Configuration
    guidelines_min_similarity_score: float = float(os.getenv('GUIDELINES_MIN_SIMILARITY_SCORE', '0.75'))
    guidelines_max_results_per_variant: int = int(os.getenv('GUIDELINES_MAX_RESULTS_PER_VARIANT', '20'))
    guidelines_vector_search_enabled: bool = os.getenv('GUIDELINES_VECTOR_SEARCH_ENABLED', 'true').lower() == 'true'
    
    # External API Configuration
    ncbi_api_key: str = os.getenv('NCBI_API_KEY', '')
    ncbi_dailymed_api_key: str = os.getenv('NCBI_API_KEY_DAILYMED', '')
    ncbi_rate_limit_per_second: int = int(os.getenv('NCBI_RATE_LIMIT_PER_SECOND', '10'))
    
    tavily_api_key: str = os.getenv('TAVILY_API_KEY', '')
    tavily_search_depth: str = os.getenv('TAVILY_SEARCH_DEPTH', 'advanced')
    tavily_max_results: int = int(os.getenv('TAVILY_MAX_RESULTS', '10'))
    
    huggingface_api_key: str = os.getenv('HUGGINGFACE_API_KEY', '')

@dataclass(frozen=True)
class BGEConfig:
    """BGE Re-ranker Configuration"""
    
    model_name: str = os.getenv('BGE_MODEL_NAME', 'BAAI/bge-reranker-v2-m3')
    device: str = os.getenv('BGE_DEVICE', 'cpu')
    batch_size_cpu: int = int(os.getenv('BGE_BATCH_SIZE_CPU', '32'))
    batch_size_gpu: int = int(os.getenv('BGE_BATCH_SIZE_GPU', '128'))
    max_sequence_length: int = int(os.getenv('BGE_MAX_SEQUENCE_LENGTH', '512'))
    
    # Re-ranking Configuration
    stage1_top_documents: int = int(os.getenv('STAGE1_TOP_DOCUMENTS', '20'))
    stage2_top_chunks: int = int(os.getenv('STAGE2_TOP_CHUNKS', '10'))
    chunk_size: int = int(os.getenv('CHUNK_SIZE', '1000'))
    chunk_overlap: int = int(os.getenv('CHUNK_OVERLAP', '200'))

# Initialize configuration instances
gcp_config = GCPConfig()
gemini_config = GeminiConfig()
data_source_config = DataSourceConfig()
bge_config = BGEConfig()

class GCPClientManager:
    """Singleton manager for Google Cloud clients"""
    
    _instance: Optional['GCPClientManager'] = None
    _storage_client: Optional[storage.Client] = None
    _firestore_client: Optional[firestore.Client] = None
    
    def __new__(cls) -> 'GCPClientManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_storage_client(self) -> storage.Client:
        """Get Google Cloud Storage client"""
        if self._storage_client is None:
            self._storage_client = storage.Client(
                project=gcp_config.project_id
            )
        return self._storage_client
    
    def get_firestore_client(self) -> firestore.Client:
        """Get Firestore client"""
        if self._firestore_client is None:
            self._firestore_client = firestore.Client(
                project=gcp_config.project_id,
                database=gcp_config.firestore_database_id
            )
        return self._firestore_client
    
    def get_guidelines_bucket(self) -> storage.Bucket:
        """Get Indian Guidelines bucket"""
        storage_client = self.get_storage_client()
        return storage_client.bucket(gcp_config.storage_bucket)
    
    def get_firestore_collections(self) -> Dict[str, firestore.CollectionReference]:
        """Get Firestore collections"""
        db = self.get_firestore_client()
        return {
            'guidelines': db.collection(gcp_config.firestore_guidelines_collection),
            'chunks': db.collection(gcp_config.firestore_chunks_collection),
        }

class GeminiModelSelector:
    """Model selection logic for Gemini 3.0 models"""
    
    ALLOWED_MODELS = [
        'gemini-3.0-flash-thinking-exp-01-21',
        'gemini-3.0-pro-exp-02-05',
        'text-embedding-004'
    ]
    
    @classmethod
    def select_synthesis_model(cls, complexity_score: float, has_contradictions: bool) -> str:
        """Select appropriate model for synthesis based on complexity and contradictions"""
        
        # ALWAYS use Pro for synthesis as per requirements
        if gemini_config.use_pro_for_synthesis:
            return gemini_config.pro_model
        
        # Fallback logic (though Pro is always preferred)
        if complexity_score > 0.5 and gemini_config.use_pro_for_complex_queries:
            return gemini_config.pro_model
        
        if has_contradictions and gemini_config.use_pro_for_contradictions:
            return gemini_config.pro_model
        
        return gemini_config.fallback_model
    
    @classmethod
    def get_agent_model(cls, agent_name: str) -> str:
        """Get model for specific agent"""
        agent_models = {
            'query_intelligence': gemini_config.agent_1_model,
            'evidence_gap_analyzer': gemini_config.agent_5_model,
            'synthesis_engine': gemini_config.agent_6_model,
            'verification_gate': gemini_config.agent_7_model,
        }
        
        if agent_name not in agent_models:
            raise ValueError(f"Unknown agent: {agent_name}")
        
        return agent_models[agent_name]
    
    @classmethod
    def validate_model(cls, model_name: str) -> bool:
        """Validate model is allowed (only 3.0 models)"""
        return model_name in cls.ALLOWED_MODELS
    
    @classmethod
    def initialize_gemini(cls) -> None:
        """Initialize Gemini API with configuration"""
        genai.configure(api_key=gemini_config.api_key)
        logger.info(f"🤖 Gemini API initialized with key: {gemini_config.api_key[:10]}...")

def validate_configuration() -> None:
    """Validate complete configuration"""
    logger.info('🔧 Validating Open Work configuration...')
    
    # Validate Gemini models
    models_to_check = [
        gemini_config.flash_model,
        gemini_config.pro_model,
        gemini_config.embedding_model,
        gemini_config.agent_1_model,
        gemini_config.agent_5_model,
        gemini_config.agent_6_model,
        gemini_config.agent_7_model,
    ]
    
    for model in models_to_check:
        if not GeminiModelSelector.validate_model(model):
            raise ValueError(f"Invalid Gemini model: {model}. Only 3.0 models allowed.")
    
    # Validate data source priorities
    priorities = [
        data_source_config.priority_indian_guidelines,
        data_source_config.priority_pubmed,
        data_source_config.priority_pmc_fulltext,
        data_source_config.priority_dailymed,
        data_source_config.priority_tavily_web,
    ]
    
    if len(set(priorities)) != len(priorities):
        raise ValueError('Data source priorities must be unique')
    
    # Validate Indian Guidelines priority is 1
    if data_source_config.priority_indian_guidelines != 1:
        raise ValueError('Indian Guidelines must have priority 1 (highest)')
    
    logger.info('✅ Configuration validation passed')
    logger.info(f'📊 Project: {gcp_config.project_id}')
    logger.info(f'🗂️  Guidelines Bucket: {gcp_config.storage_bucket}')
    logger.info(f'🤖 Synthesis Model: {gemini_config.pro_model} (ALWAYS PRO)')
    logger.info(f'🔍 Primary Source: Indian Guidelines (Priority {data_source_config.priority_indian_guidelines})')
    logger.info(f'📚 Secondary Source: PubMed (Priority {data_source_config.priority_pubmed})')

def get_model_pricing() -> Dict[str, Dict[str, float]]:
    """Get pricing information for Gemini models"""
    return {
        'gemini-3.0-flash-thinking-exp-01-21': {
            'input_per_million': 0.075,
            'output_per_million': 0.30
        },
        'gemini-3.0-pro-exp-02-05': {
            'input_per_million': 1.25,
            'output_per_million': 5.00
        }
    }

def calculate_cost(model_name: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost for model usage"""
    pricing = get_model_pricing()
    
    if model_name not in pricing:
        logger.warning(f"Unknown model for pricing: {model_name}")
        return 0.0
    
    rates = pricing[model_name]
    cost = (
        (input_tokens / 1_000_000) * rates['input_per_million'] +
        (output_tokens / 1_000_000) * rates['output_per_million']
    )
    
    return cost

# Initialize singleton instance
gcp_client = GCPClientManager()

# Initialize Gemini API
GeminiModelSelector.initialize_gemini()

# Validate configuration on import
validate_configuration()

# Export key configurations for easy access
__all__ = [
    'gcp_config',
    'gemini_config', 
    'data_source_config',
    'bge_config',
    'gcp_client',
    'GeminiModelSelector',
    'validate_configuration',
    'calculate_cost'
]