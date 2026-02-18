#!/usr/bin/env python3
"""
Sub-Agent 2.4: DailyMed Retriever
Retrieves FDA drug labels (SPL) for drug-related queries
"""

import asyncio
import aiohttp
import time
from typing import List, Dict, Any, Optional
from xml.etree import ElementTree as ET

from lib.agents.base_agent import RetrievalAgent, AgentResult

class DailyMedRetriever(RetrievalAgent):
    """
    Sub-Agent 2.4: DailyMed Retriever
    
    Responsibilities:
    - Search FDA drug labels (SPL) for specific drugs
    - Parse structured product labels (XML)
    - Extract key sections: indications, dosing, warnings, interactions
    - Only triggered when drug entities detected in query
    """
    
    def __init__(self):
        super().__init__('dailymed_retriever', 'dailymed')
        self.base_url = "https://dailymed.nlm.nih.gov/dailymed/services/v2"
        self.rate_limit_delay = 0.5  # 2 requests/second to be safe
        
        # LOINC codes for key SPL sections
        self.section_codes = {
            '34067-9': 'indications_and_usage',
            '34068-7': 'dosage_and_administration', 
            '43685-7': 'warnings_and_precautions',
            '34084-4': 'adverse_reactions',
            '34073-7': 'drug_interactions',
            '34090-1': 'clinical_pharmacology',
            '34076-0': 'information_for_patients',
            '42229-5': 'spl_patient_package_insert'
        }
    
    async def _execute(self, input_data: Dict[str, Any], trace_id: str) -> AgentResult:
        """
        Execute DailyMed retrieval for drug entities
        
        Args:
            input_data: {
                'drug_names': List[str],
                'max_results_per_drug': int (optional, default 2)
            }
            trace_id: Unique trace identifier
            
        Returns:
            AgentResult with drug label data
        """
        
        try:
            drug_names = input_data.get('drug_names', [])
            max_results = input_data.get('max_results_per_drug', 2)
            
            if not drug_names:
                return AgentResult(
                    success=False,
                    data={'results': []},
                    error="No drug names provided"
                )
            
            print(f"💊 Searching DailyMed for {len(drug_names)} drugs: {drug_names}")
            
            start_time = time.time()
            results = await self.search_drug_labels(drug_names, max_results, trace_id)
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Log retrieval metrics
            await self.log_retrieval_metrics(
                trace_id=trace_id,
                query=' | '.join(drug_names),
                num_results=len(results),
                latency_ms=latency_ms,
                drugs_searched=len(drug_names),
                avg_results_per_drug=len(results) / len(drug_names) if drug_names else 0
            )
            
            print(f"✅ DailyMed: Found {len(results)} drug labels ({latency_ms}ms)")
            
            return AgentResult(
                success=True,
                data={'results': results},
                latency_ms=latency_ms,
                metadata={
                    'drugs_searched': len(drug_names),
                    'labels_found': len(results),
                    'avg_per_drug': len(results) / len(drug_names) if drug_names else 0
                }
            )
            
        except Exception as e:
            return AgentResult(
                success=False,
                data={'results': []},
                error=f"DailyMed retrieval failed: {str(e)}"
            )
    
    async def search_drug_labels(self, drug_names: List[str], max_results_per_drug: int, 
                               trace_id: str) -> List[Dict[str, Any]]:
        """
        Search for drug labels across multiple drug names
        
        Args:
            drug_names: List of drug names to search
            max_results_per_drug: Maximum results per drug
            trace_id: Trace identifier
            
        Returns:
            List of drug label data
        """
        
        all_results = []
        
        async with aiohttp.ClientSession() as session:
            for drug_name in drug_names:
                try:
                    # Search for SPLs for this drug
                    drug_results = await self._search_single_drug(
                        session, drug_name, max_results_per_drug
                    )
                    all_results.extend(drug_results)
                    
                    # Rate limiting
                    await asyncio.sleep(self.rate_limit_delay)
                    
                except Exception as e:
                    print(f"⚠️ Failed to search DailyMed for {drug_name}: {e}")
                    continue
        
        return all_results
    
    async def _search_single_drug(self, session: aiohttp.ClientSession, 
                                drug_name: str, max_results: int) -> List[Dict[str, Any]]:
        """
        Search DailyMed for a single drug
        
        Args:
            session: HTTP session
            drug_name: Drug name to search
            max_results: Maximum results to return
            
        Returns:
            List of drug label data for this drug
        """
        
        try:
            # Step 1: Search for SPLs
            search_url = f"{self.base_url}/spls.json"
            search_params = {
                'drug_name': drug_name,
                'published_after': '2020-01-01',  # Recent labels only
                'limit': max_results
            }
            
            async with session.get(search_url, params=search_params) as response:
                if response.status != 200:
                    print(f"⚠️ DailyMed search failed for {drug_name}: HTTP {response.status}")
                    return []
                
                search_data = await response.json()
                spls = search_data.get('data', [])
            
            if not spls:
                print(f"ℹ️ No DailyMed labels found for {drug_name}")
                return []
            
            # Step 2: Fetch detailed SPL data for each result
            results = []
            for spl in spls[:max_results]:
                try:
                    spl_data = await self._fetch_spl_details(session, spl, drug_name)
                    if spl_data:
                        results.append(spl_data)
                        
                except Exception as e:
                    print(f"⚠️ Failed to fetch SPL {spl.get('setid', 'unknown')}: {e}")
                    continue
            
            return results
            
        except Exception as e:
            print(f"❌ DailyMed search failed for {drug_name}: {e}")
            return []
    
    async def _fetch_spl_details(self, session: aiohttp.ClientSession, 
                               spl_summary: Dict, drug_name: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed SPL data including parsed sections
        
        Args:
            session: HTTP session
            spl_summary: SPL summary from search
            drug_name: Original drug name searched
            
        Returns:
            Detailed SPL data or None if failed
        """
        
        try:
            setid = spl_summary.get('setid')
            if not setid:
                return None
            
            # Fetch SPL XML
            xml_url = f"{self.base_url}/spls/{setid}.xml"
            
            async with session.get(xml_url) as response:
                if response.status != 200:
                    return None
                
                xml_content = await response.text()
            
            # Parse XML to extract sections
            sections = self._parse_spl_xml(xml_content)
            
            # Create structured result
            result = {
                'source': 'dailymed',
                'id': setid,
                'setid': setid,
                'drug_name': drug_name,
                'title': spl_summary.get('title', ''),
                'published_date': spl_summary.get('published', ''),
                'version': spl_summary.get('version', ''),
                'sections': sections,
                'text_for_search': self._create_searchable_text(sections),
                'metadata': {
                    'spl_version': spl_summary.get('version'),
                    'effective_time': spl_summary.get('effective_time'),
                    'labeler': spl_summary.get('labeler', {}).get('name', ''),
                    'application_number': spl_summary.get('application_number', ''),
                    'product_ndc': spl_summary.get('product_ndc', [])
                }
            }
            
            return result
            
        except Exception as e:
            print(f"⚠️ Failed to parse SPL {setid}: {e}")
            return None
    
    def _parse_spl_xml(self, xml_content: str) -> Dict[str, str]:
        """
        Parse SPL XML to extract key sections
        
        Args:
            xml_content: Raw XML content
            
        Returns:
            Dictionary of section name -> text content
        """
        
        try:
            root = ET.fromstring(xml_content)
            sections = {}
            
            # Extract sections by LOINC code
            for code, section_name in self.section_codes.items():
                section_elements = root.findall(f'.//*[@code="{code}"]')
                
                if section_elements:
                    # Combine text from all matching elements
                    section_texts = []
                    for element in section_elements:
                        text = ''.join(element.itertext()).strip()
                        if text and len(text) > 20:  # Skip very short sections
                            section_texts.append(text)
                    
                    if section_texts:
                        # Truncate very long sections
                        combined_text = '\n\n'.join(section_texts)
                        sections[section_name] = combined_text[:3000]  # Max 3000 chars per section
            
            # If no sections found, try to extract any text content
            if not sections:
                all_text = ''.join(root.itertext()).strip()
                if all_text:
                    sections['full_text'] = all_text[:5000]  # Max 5000 chars
            
            return sections
            
        except ET.ParseError as e:
            print(f"⚠️ XML parsing error: {e}")
            return {}
        except Exception as e:
            print(f"⚠️ Section extraction error: {e}")
            return {}
    
    def _create_searchable_text(self, sections: Dict[str, str]) -> str:
        """
        Create searchable text from all sections
        
        Args:
            sections: Dictionary of section content
            
        Returns:
            Combined searchable text
        """
        
        # Priority order for sections (most important first)
        priority_sections = [
            'indications_and_usage',
            'dosage_and_administration',
            'warnings_and_precautions',
            'adverse_reactions',
            'drug_interactions',
            'clinical_pharmacology'
        ]
        
        text_parts = []
        
        # Add priority sections first
        for section_name in priority_sections:
            if section_name in sections:
                text_parts.append(f"{section_name.replace('_', ' ').title()}:\n{sections[section_name]}")
        
        # Add remaining sections
        for section_name, content in sections.items():
            if section_name not in priority_sections:
                text_parts.append(f"{section_name.replace('_', ' ').title()}:\n{content}")
        
        return '\n\n'.join(text_parts)

# Convenience function
async def search_dailymed(drug_names: List[str], max_results_per_drug: int = 2, 
                         trace_id: str = None) -> AgentResult:
    """
    Convenience function to search DailyMed
    
    Args:
        drug_names: List of drug names
        max_results_per_drug: Maximum results per drug
        trace_id: Optional trace identifier
        
    Returns:
        AgentResult with drug label data
    """
    retriever = DailyMedRetriever()
    return await retriever.execute({
        'drug_names': drug_names,
        'max_results_per_drug': max_results_per_drug
    }, trace_id)