/**
 * Recent Data Prioritizer
 * 
 * Implements 2025/2024/2023 backward filtering as requested.
 * Modifies search queries to prioritize most recent evidence.
 */

/**
 * Get current year for dynamic filtering
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Generate year-based search filters for different databases
 */
export function getRecentYearFilters() {
  const currentYear = getCurrentYear();
  
  return {
    // Priority years (search these first)
    priority: [currentYear, currentYear - 1, currentYear - 2], // 2025, 2024, 2023
    
    // Extended range (fallback if priority yields insufficient results)
    extended: [currentYear - 3, currentYear - 4], // 2022, 2021
    
    // PubMed date filter format
    pubmedDateFilter: `${currentYear - 2}/01/01:${currentYear}/12/31[dp]`, // 2023-2025
    
    // Europe PMC date filter
    europePMCDateFilter: `PUB_YEAR:[${currentYear - 2} TO ${currentYear}]`, // 2023-2025
    
    // OpenAlex date filter
    openAlexDateFilter: `publication_year:${currentYear - 2}-${currentYear}`, // 2023-2025
    
    // ClinicalTrials.gov date filter
    clinicalTrialsDateFilter: `${currentYear - 2}-01-01_${currentYear}-12-31`
  };
}

/**
 * Add recency filters to search queries
 */
export function addRecencyFilters(baseQuery: string, database: string): string {
  const filters = getRecentYearFilters();
  
  switch (database.toLowerCase()) {
    case 'pubmed':
      return `${baseQuery} AND ${filters.pubmedDateFilter}`;
      
    case 'europepmc':
      return `${baseQuery} AND ${filters.europePMCDateFilter}`;
      
    case 'openalex':
      return `${baseQuery} AND ${filters.openAlexDateFilter}`;
      
    case 'cochrane':
      // Cochrane uses year range
      return `${baseQuery} AND publication_year:[${getCurrentYear() - 2} TO ${getCurrentYear()}]`;
      
    default:
      return baseQuery;
  }
}

/**
 * Score evidence items by recency (enhanced version)
 */
export function calculateRecencyScore(publicationDate: string | number): number {
  const currentYear = getCurrentYear();
  let pubYear: number;
  
  // Handle different date formats
  if (typeof publicationDate === 'string') {
    if (publicationDate.includes('-')) {
      pubYear = parseInt(publicationDate.split('-')[0]);
    } else if (publicationDate.length === 4) {
      pubYear = parseInt(publicationDate);
    } else {
      pubYear = new Date(publicationDate).getFullYear();
    }
  } else {
    pubYear = publicationDate;
  }
  
  if (isNaN(pubYear)) return 0;
  
  const yearsOld = currentYear - pubYear;
  
  // Enhanced scoring with 2025/2024/2023 priority
  if (yearsOld <= 0) return 100; // Current year or future
  if (yearsOld === 1) return 95;  // 2024
  if (yearsOld === 2) return 90;  // 2023
  if (yearsOld === 3) return 80;  // 2022
  if (yearsOld === 4) return 70;  // 2021
  if (yearsOld <= 5) return 60;   // 2020
  if (yearsOld <= 10) return 40;  // 2015-2019
  
  return Math.max(10, 50 - yearsOld * 2); // Older studies
}

/**
 * Filter evidence items by recency threshold
 */
export function filterByRecency<T extends { year?: string | number; publicationDate?: string }>(
  items: T[],
  minRecencyScore: number = 60 // Default: 2020 or newer
): T[] {
  return items.filter(item => {
    const date = item.year || item.publicationDate;
    if (!date) return false;
    
    const score = calculateRecencyScore(date);
    return score >= minRecencyScore;
  });
}