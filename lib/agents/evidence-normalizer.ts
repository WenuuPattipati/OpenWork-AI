/**
 * Agent 3: Evidence Normalizer
 * Converts all source formats into unified EvidenceCandidate objects
 * UPDATED: Now handles 15+ evidence sources from comprehensive engine
 */

import { EvidenceCandidate, TraceContext } from './types';
import { RetrievalResults } from './multi-source-retrieval';

export class EvidenceNormalizer {
  normalizeAll(rawResults: RetrievalResults): EvidenceCandidate[] {
    const candidates: EvidenceCandidate[] = [];
    const seenIds = new Set<string>();

    console.log(`🔄 Starting evidence normalization for 15+ sources...`);

    // 1. Guidelines (Indian - Firestore)
    for (const doc of rawResults.guidelines) {
      const candidate: EvidenceCandidate = {
        source: 'indian_guideline',
        id: doc.chunk_id,
        title: doc.title || 'Untitled Guideline',
        text: doc.text || 'No content available',
        metadata: {
          organization: doc.organization,
          year: doc.year,
          guideline_id: doc.guideline_id,
          similarity_score: doc.similarity_score,
          badges: ['Practice Guideline', 'Indian Guidelines']
        },
        full_text_available: false
      };
      
      if (!seenIds.has(candidate.id)) {
        candidates.push(candidate);
        seenIds.add(candidate.id);
      }
    }

    // 2. PubMed (Evidence Engine) - CRITICAL: Always prioritize PubMed
    let pubmedCount = 0;
    for (const doc of rawResults.pubmed) {
      const pmid = doc.pmid || doc.id;
      
      if (!seenIds.has(pmid)) {
        const badges = [];
        if (doc.pub_types?.includes('Meta-Analysis')) badges.push('Meta-Analysis');
        if (doc.pub_types?.includes('Systematic Review')) badges.push('Systematic Review');
        if (doc.pub_types?.includes('Randomized Controlled Trial')) badges.push('RCT');
        if (doc.pmcid) badges.push('PMCID');
        if (doc.pub_date && new Date(doc.pub_date).getFullYear() >= 2020) badges.push('Recent');
        if (doc.journal_tier === 'tier_1') badges.push('Leading Journal');
        if (doc.journal_tier === 'specialty_elite') badges.push('Specialty Elite');

        const candidate: EvidenceCandidate = {
          source: 'pubmed',
          id: pmid,
          title: doc.title || 'Untitled PubMed Article',
          text: doc.abstract || 'No abstract available',
          metadata: {
            authors: doc.authors,
            journal: doc.journal,
            pub_date: doc.pub_date,
            doi: doc.doi,
            pmcid: doc.pmcid,
            pub_types: doc.pub_types,
            journal_tier: doc.journal_tier, // Preserve journal tier for prioritization
            badges: badges
          },
          full_text_available: !!doc.pmcid
        };
        
        candidates.push(candidate);
        seenIds.add(pmid);
        pubmedCount++;
      }
    }
    
    if (pubmedCount === 0 && rawResults.pubmed.length > 0) {
      console.warn('⚠️ PubMed results found but none normalized - possible deduplication issue');
    } else if (pubmedCount > 0) {
      console.log(`✅ Normalized ${pubmedCount} PubMed articles (primary evidence source)`);
    }

    // 3. DailyMed (Evidence Engine)
    for (const doc of rawResults.dailymed) {
      const setid = doc.setid || doc.id;
      
      if (!seenIds.has(setid)) {
        // Combine relevant sections
        const textParts: string[] = [];
        const sectionOrder = ['indications', 'dosage', 'clinical_pharmacology', 'warnings', 'adverse_reactions'];
        
        for (const sectionName of sectionOrder) {
          if (doc.sections?.[sectionName]) {
            textParts.push(`${sectionName.toUpperCase()}:\n${doc.sections[sectionName]}`);
          }
        }

        const candidate: EvidenceCandidate = {
          source: 'dailymed',
          id: setid,
          title: doc.title || doc.drug_name,
          text: textParts.join('\n\n') || doc.content || doc.text,
          metadata: {
            drug_name: doc.drug_name,
            published: doc.published,
            all_sections: doc.sections,
            badges: ['FDA Label', 'Drug Information']
          },
          full_text_available: true,
          full_text_sections: doc.sections
        };
        
        candidates.push(candidate);
        seenIds.add(setid);
      }
    }

    // 4. Clinical Trials (Evidence Engine)
    for (const doc of rawResults.clinical_trials) {
      const nctId = doc.nct_id || doc.id;
      
      if (!seenIds.has(nctId)) {
        const badges = ['Clinical Trial'];
        if (doc.phase) badges.push(`Phase ${doc.phase}`);
        if (doc.status === 'Completed') badges.push('Completed');
        if (doc.has_results) badges.push('Has Results');

        const candidate: EvidenceCandidate = {
          source: 'clinical_trials',
          id: nctId,
          title: doc.title || doc.brief_title || 'Untitled Clinical Trial',
          text: doc.brief_summary || doc.detailed_description || doc.summary || 'No summary available',
          metadata: {
            phase: doc.phase,
            status: doc.status,
            enrollment: doc.enrollment,
            start_date: doc.start_date,
            completion_date: doc.completion_date,
            sponsor: doc.sponsor,
            badges: badges
          },
          full_text_available: false
        };
        
        candidates.push(candidate);
        seenIds.add(nctId);
      }
    }

    // 5. Cochrane Reviews (Evidence Engine)
    for (const doc of rawResults.cochrane) {
      const cochraneId = doc.cochrane_id || doc.id;
      
      if (!seenIds.has(cochraneId)) {
        const candidate: EvidenceCandidate = {
          source: 'cochrane',
          id: cochraneId,
          title: doc.title || 'Untitled Cochrane Review',
          text: doc.abstract || doc.plain_language_summary || 'No abstract available',
          metadata: {
            authors: doc.authors,
            publication_date: doc.publication_date,
            doi: doc.doi,
            review_type: doc.review_type,
            badges: ['Cochrane Review', 'Systematic Review', 'High Quality']
          },
          full_text_available: false
        };
        
        candidates.push(candidate);
        seenIds.add(cochraneId);
      }
    }

    // 6. BMJ Best Practice (Evidence Engine)
    for (const doc of rawResults.bmj) {
      const bmjId = doc.topic_id || doc.id;
      
      if (!seenIds.has(bmjId)) {
        const candidate: EvidenceCandidate = {
          source: 'bmj_best_practice',
          id: bmjId,
          title: doc.title || 'Untitled BMJ Article',
          text: doc.summary || doc.content || 'No content available',
          metadata: {
            topic: doc.topic,
            last_updated: doc.last_updated,
            evidence_level: doc.evidence_level,
            badges: ['BMJ Best Practice', 'Clinical Guidelines', 'Evidence-Based']
          },
          full_text_available: false
        };
        
        candidates.push(candidate);
        seenIds.add(bmjId);
      }
    }

    // 7-14. Other sources (NICE, WHO, CDC, Landmark Trials, etc.)
    const otherSources = [
      { key: 'nice', name: 'NICE Guidelines', badges: ['NICE', 'UK Guidelines'] },
      { key: 'who', name: 'WHO Guidelines', badges: ['WHO', 'Global Guidelines'] },
      { key: 'cdc', name: 'CDC Guidelines', badges: ['CDC', 'US Guidelines'] },
      { key: 'landmark_trials', name: 'Landmark Trials', badges: ['Landmark Trial', 'High Impact'] },
      { key: 'semantic_scholar', name: 'Semantic Scholar', badges: ['Academic Paper'] },
      { key: 'europe_pmc', name: 'Europe PMC', badges: ['European Research'] },
      { key: 'pmc', name: 'PMC Full-text', badges: ['PMCID', 'Full Text'] },
      { key: 'openalex', name: 'OpenAlex', badges: ['Academic Literature'] }
    ];

    for (const sourceConfig of otherSources) {
      const sourceResults = rawResults[sourceConfig.key as keyof RetrievalResults] || [];
      
      for (const doc of sourceResults) {
        const docId = doc.id || doc.pmid || doc.doi || doc.url || `${sourceConfig.key}_${Math.random()}`;
        
        if (!seenIds.has(docId)) {
          const candidate: EvidenceCandidate = {
            source: sourceConfig.key as EvidenceCandidate['source'],
            id: docId,
            title: doc.title || 'Untitled',
            text: doc.abstract || doc.summary || doc.content || doc.text || doc.description || 'No content available',
            metadata: {
              ...doc,
              badges: sourceConfig.badges
            },
            full_text_available: !!doc.pmcid || !!doc.full_text_url
          };
          
          candidates.push(candidate);
          seenIds.add(docId);
        }
      }
    }

    // 15. Tavily (if present)
    for (const doc of rawResults.tavily) {
      const url = doc.url;
      
      if (!seenIds.has(url)) {
        const candidate: EvidenceCandidate = {
          source: 'tavily_web',
          id: url,
          title: doc.title || 'Untitled Web Content',
          text: doc.content || 'No content available',
          metadata: {
            url: url,
            score: doc.score,
            published_date: doc.published_date,
            badges: ['Web Search', 'Recent Content']
          },
          full_text_available: false
        };
        
        candidates.push(candidate);
        seenIds.add(url);
      }
    }

    console.log(`✅ Evidence normalization complete: ${candidates.length} unified candidates`);
    console.log(`   📚 Guidelines: ${rawResults.guidelines.length}`);
    console.log(`   🔬 PubMed: ${rawResults.pubmed.length}`);
    console.log(`   💊 DailyMed: ${rawResults.dailymed.length}`);
    console.log(`   🧪 Clinical Trials: ${rawResults.clinical_trials.length}`);
    console.log(`   📊 Cochrane: ${rawResults.cochrane.length}`);
    console.log(`   🏥 BMJ: ${rawResults.bmj.length}`);
    console.log(`   🇬🇧 NICE: ${rawResults.nice.length}`);
    console.log(`   🌍 WHO: ${rawResults.who.length}`);
    console.log(`   🇺🇸 CDC: ${rawResults.cdc.length}`);
    console.log(`   ⭐ Landmark Trials: ${rawResults.landmark_trials.length}`);
    console.log(`   🎓 Semantic Scholar: ${rawResults.semantic_scholar.length}`);
    console.log(`   🇪🇺 Europe PMC: ${rawResults.europe_pmc.length}`);
    console.log(`   📄 PMC: ${rawResults.pmc.length}`);
    console.log(`   🔍 OpenAlex: ${rawResults.openalex.length}`);
    console.log(`   🌐 Tavily: ${rawResults.tavily.length}`);

    return candidates;
  }
}