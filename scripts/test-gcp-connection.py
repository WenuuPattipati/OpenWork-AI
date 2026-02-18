#!/usr/bin/env python3
"""
Test Google Cloud Platform Connection for Open Work
Limitless.ai Project - Indian Treatment Guidelines
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Any

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.config.gcp_config import (
    gcp_config, 
    gemini_config, 
    data_source_config,
    gcp_client,
    GeminiModelSelector
)

import google.generativeai as genai
from google.cloud import storage, firestore
from google.cloud.exceptions import NotFound, Forbidden

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GCPConnectionTester:
    """Test all Google Cloud Platform connections and services"""
    
    def __init__(self):
        self.test_results = []
        
    def log_test_result(self, test_name: str, success: bool, message: str, details: Dict[str, Any] = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        })
    
    async def test_environment_variables(self) -> bool:
        """Test 1: Environment Variables"""
        try:
            required_vars = [
                'GOOGLE_CLOUD_PROJECT_ID',
                'GOOGLE_CLOUD_STORAGE_BUCKET', 
                'GEMINI_API_KEY',
                'GEMINI_PRO_MODEL',
                'GEMINI_FLASH_MODEL'
            ]
            
            missing_vars = []
            for var in required_vars:
                if not os.getenv(var):
                    missing_vars.append(var)
            
            if missing_vars:
                self.log_test_result(
                    "Environment Variables",
                    False,
                    f"Missing variables: {missing_vars}"
                )
                return False
            
            self.log_test_result(
                "Environment Variables",
                True,
                f"All {len(required_vars)} required variables present",
                {
                    'project_id': gcp_config.project_id,
                    'bucket': gcp_config.storage_bucket,
                    'gemini_models': {
                        'flash': gemini_config.flash_model,
                        'pro': gemini_config.pro_model
                    }
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result("Environment Variables", False, str(e))
            return False
    
    async def test_google_cloud_storage(self) -> bool:
        """Test 2: Google Cloud Storage - Indian Guidelines Bucket"""
        try:
            storage_client = gcp_client.get_storage_client()
            bucket = gcp_client.get_guidelines_bucket()
            
            # Test bucket exists and is accessible
            bucket.reload()
            
            # List first 10 files to verify content
            blobs = list(bucket.list_blobs(max_results=10))
            pdf_files = [blob.name for blob in blobs if blob.name.endswith('.pdf')]
            
            # Get total file count
            all_blobs = list(bucket.list_blobs())
            total_files = len(all_blobs)
            total_pdfs = len([b for b in all_blobs if b.name.endswith('.pdf')])
            
            self.log_test_result(
                "Google Cloud Storage",
                True,
                f"Connected to bucket '{bucket.name}'",
                {
                    'total_files': total_files,
                    'pdf_files': total_pdfs,
                    'sample_files': pdf_files[:5],
                    'bucket_location': bucket.location,
                    'bucket_storage_class': bucket.storage_class
                }
            )
            
            # Verify we have the expected ~120 PDFs
            if total_pdfs < 100:
                logger.warning(f"⚠️  Expected ~120 PDF guidelines, found only {total_pdfs}")
            
            return True
            
        except NotFound:
            self.log_test_result(
                "Google Cloud Storage",
                False,
                f"Bucket '{gcp_config.storage_bucket}' not found"
            )
            return False
        except Forbidden:
            self.log_test_result(
                "Google Cloud Storage", 
                False,
                "Access denied - check service account permissions"
            )
            return False
        except Exception as e:
            self.log_test_result("Google Cloud Storage", False, str(e))
            return False
    
    async def test_firestore(self) -> bool:
        """Test 3: Firestore - Vector Database"""
        try:
            db = gcp_client.get_firestore_client()
            collections = gcp_client.get_firestore_collections()
            
            # Test connection by listing collections
            all_collections = list(db.collections())
            collection_names = [col.id for col in all_collections]
            
            # Check if our target collections exist
            guidelines_exists = gcp_config.firestore_guidelines_collection in collection_names
            chunks_exists = gcp_config.firestore_chunks_collection in collection_names
            
            # Try to read from collections (if they exist)
            guidelines_count = 0
            chunks_count = 0
            
            if guidelines_exists:
                guidelines_docs = list(collections['guidelines'].limit(1).stream())
                guidelines_count = len(list(collections['guidelines'].stream()))
            
            if chunks_exists:
                chunks_docs = list(collections['chunks'].limit(1).stream())
                chunks_count = len(list(collections['chunks'].stream()))
            
            self.log_test_result(
                "Firestore Database",
                True,
                f"Connected to database '{gcp_config.firestore_database_id}'",
                {
                    'total_collections': len(collection_names),
                    'target_collections': {
                        'guidelines': {
                            'exists': guidelines_exists,
                            'document_count': guidelines_count
                        },
                        'chunks': {
                            'exists': chunks_exists,
                            'document_count': chunks_count
                        }
                    },
                    'all_collections': collection_names
                }
            )
            
            if not guidelines_exists or not chunks_exists:
                logger.warning("⚠️  Target collections don't exist yet - will be created during embedding process")
            
            return True
            
        except Exception as e:
            self.log_test_result("Firestore Database", False, str(e))
            return False
    
    async def test_gemini_api(self) -> bool:
        """Test 4: Gemini API - All Models"""
        try:
            # Test Flash model
            flash_model = genai.GenerativeModel(gemini_config.flash_model)
            flash_response = flash_model.generate_content(
                "Test connection. Respond with exactly: 'Flash model working'",
                generation_config=genai.GenerationConfig(
                    temperature=0,
                    max_output_tokens=10
                )
            )
            
            # Test Pro model  
            pro_model = genai.GenerativeModel(gemini_config.pro_model)
            pro_response = pro_model.generate_content(
                "Test connection. Respond with exactly: 'Pro model working'",
                generation_config=genai.GenerationConfig(
                    temperature=0,
                    max_output_tokens=10
                )
            )
            
            # Test embedding model
            embedding_result = genai.embed_content(
                model=gemini_config.embedding_model,
                content="Test embedding for Indian medical guidelines"
            )
            
            self.log_test_result(
                "Gemini API",
                True,
                "All models responding correctly",
                {
                    'flash_model': {
                        'name': gemini_config.flash_model,
                        'response_length': len(flash_response.text),
                        'usage': {
                            'input_tokens': flash_response.usage_metadata.prompt_token_count,
                            'output_tokens': flash_response.usage_metadata.candidates_token_count
                        }
                    },
                    'pro_model': {
                        'name': gemini_config.pro_model,
                        'response_length': len(pro_response.text),
                        'usage': {
                            'input_tokens': pro_response.usage_metadata.prompt_token_count,
                            'output_tokens': pro_response.usage_metadata.candidates_token_count
                        }
                    },
                    'embedding_model': {
                        'name': gemini_config.embedding_model,
                        'embedding_dimension': len(embedding_result['embedding']),
                        'sample_values': embedding_result['embedding'][:5]
                    }
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result("Gemini API", False, str(e))
            return False
    
    async def test_model_selection_logic(self) -> bool:
        """Test 5: Model Selection Logic"""
        try:
            # Test synthesis model selection (should always be Pro)
            synthesis_model_simple = GeminiModelSelector.select_synthesis_model(0.3, False)
            synthesis_model_complex = GeminiModelSelector.select_synthesis_model(0.8, True)
            
            # Test agent model selection
            agent_models = {}
            for agent in ['query_intelligence', 'evidence_gap_analyzer', 'synthesis_engine', 'verification_gate']:
                agent_models[agent] = GeminiModelSelector.get_agent_model(agent)
            
            # Validate all models are allowed
            all_models = [synthesis_model_simple, synthesis_model_complex] + list(agent_models.values())
            invalid_models = [m for m in all_models if not GeminiModelSelector.validate_model(m)]
            
            if invalid_models:
                self.log_test_result(
                    "Model Selection Logic",
                    False,
                    f"Invalid models detected: {invalid_models}"
                )
                return False
            
            # Verify synthesis always uses Pro
            if synthesis_model_simple != gemini_config.pro_model:
                self.log_test_result(
                    "Model Selection Logic",
                    False,
                    f"Synthesis model should always be Pro, got: {synthesis_model_simple}"
                )
                return False
            
            self.log_test_result(
                "Model Selection Logic",
                True,
                "All model selections valid and following rules",
                {
                    'synthesis_model_simple': synthesis_model_simple,
                    'synthesis_model_complex': synthesis_model_complex,
                    'agent_models': agent_models,
                    'always_pro_for_synthesis': synthesis_model_simple == gemini_config.pro_model
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result("Model Selection Logic", False, str(e))
            return False
    
    async def test_data_source_priorities(self) -> bool:
        """Test 6: Data Source Priority Configuration"""
        try:
            priorities = {
                'Indian Guidelines': data_source_config.priority_indian_guidelines,
                'PubMed': data_source_config.priority_pubmed,
                'PMC Full-text': data_source_config.priority_pmc_fulltext,
                'DailyMed': data_source_config.priority_dailymed,
                'Tavily Web': data_source_config.priority_tavily_web
            }
            
            # Verify Indian Guidelines has priority 1
            if priorities['Indian Guidelines'] != 1:
                self.log_test_result(
                    "Data Source Priorities",
                    False,
                    f"Indian Guidelines must have priority 1, got: {priorities['Indian Guidelines']}"
                )
                return False
            
            # Verify PubMed has priority 2
            if priorities['PubMed'] != 2:
                self.log_test_result(
                    "Data Source Priorities",
                    False,
                    f"PubMed should have priority 2, got: {priorities['PubMed']}"
                )
                return False
            
            # Verify all priorities are unique
            priority_values = list(priorities.values())
            if len(set(priority_values)) != len(priority_values):
                self.log_test_result(
                    "Data Source Priorities",
                    False,
                    "Duplicate priorities detected"
                )
                return False
            
            self.log_test_result(
                "Data Source Priorities",
                True,
                "Priority configuration correct",
                {
                    'priorities': priorities,
                    'guidelines_first': priorities['Indian Guidelines'] == 1,
                    'pubmed_second': priorities['PubMed'] == 2
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result("Data Source Priorities", False, str(e))
            return False
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all connection tests"""
        logger.info("🚀 Starting Open Work GCP Connection Tests")
        logger.info("=" * 60)
        
        tests = [
            self.test_environment_variables,
            self.test_google_cloud_storage,
            self.test_firestore,
            self.test_gemini_api,
            self.test_model_selection_logic,
            self.test_data_source_priorities
        ]
        
        results = []
        for test in tests:
            try:
                result = await test()
                results.append(result)
            except Exception as e:
                logger.error(f"Test failed with exception: {e}")
                results.append(False)
        
        # Summary
        passed = sum(results)
        total = len(results)
        
        logger.info("=" * 60)
        logger.info(f"🏁 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            logger.info("🎉 All tests passed! Open Work is ready for deployment.")
        else:
            logger.error(f"❌ {total - passed} tests failed. Please fix issues before proceeding.")
        
        return {
            'total_tests': total,
            'passed_tests': passed,
            'failed_tests': total - passed,
            'success_rate': passed / total,
            'all_passed': passed == total,
            'detailed_results': self.test_results
        }

async def main():
    """Main test runner"""
    tester = GCPConnectionTester()
    results = await tester.run_all_tests()
    
    # Exit with appropriate code
    exit_code = 0 if results['all_passed'] else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())