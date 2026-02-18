/**
 * PMC Image Extractor
 * 
 * Extracts figures and images from PubMed Central (PMC) articles
 * These are high-quality medical images that are already part of the evidence
 */

export interface PMCImage {
  url: string;
  caption: string;
  figureNumber: string;
  pmcId: string;
  articleTitle: string;
  source: 'PMC';
}

/**
 * Extract image URLs from PMC article
 * PMC images follow predictable URL patterns
 */
export function extractPMCImages(pmcId: string, articleTitle: string): PMCImage[] {
  const images: PMCImage[] = [];
  
  // PMC images are hosted at: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{id}/bin/{filename}
  // Common patterns:
  // - Figure 1: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{id}/bin/figure1.jpg
  // - Figure 2: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{id}/bin/figure2.jpg
  
  // For now, we'll generate potential figure URLs
  // In a production system, you'd parse the article HTML to get actual figure URLs
  
  for (let i = 1; i <= 3; i++) {
    images.push({
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/bin/figure${i}.jpg`,
      caption: `Figure ${i} from ${articleTitle}`,
      figureNumber: `Figure ${i}`,
      pmcId,
      articleTitle,
      source: 'PMC'
    });
  }
  
  return images;
}

/**
 * Extract images from multiple PMC articles
 */
export function extractImagesFromPMCArticles(
  pmcArticles: Array<{ pmcId: string; title: string; url: string }>
): PMCImage[] {
  const allImages: PMCImage[] = [];
  
  // Extract from top 3 most relevant PMC articles
  const topArticles = pmcArticles.slice(0, 3);
  
  for (const article of topArticles) {
    const images = extractPMCImages(article.pmcId, article.title);
    allImages.push(...images);
  }
  
  return allImages;
}

/**
 * BETTER APPROACH: Extract actual figure URLs from PMC article page
 * This requires fetching and parsing the article HTML
 */
export async function fetchPMCArticleImages(pmcId: string): Promise<PMCImage[]> {
  try {
    // Fetch the PMC article page
    const response = await fetch(`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch PMC article ${pmcId}: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    
    // Extract figure URLs using regex
    // PMC figures are in <div class="fig"> with <img> tags
    const figureRegex = /<div[^>]*class="[^"]*fig[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*caption[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    
    const images: PMCImage[] = [];
    let match;
    let figureNum = 1;
    
    while ((match = figureRegex.exec(html)) !== null) {
      const imageUrl = match[1];
      const captionHtml = match[2];
      
      // Clean caption (remove HTML tags)
      const caption = captionHtml.replace(/<[^>]+>/g, '').trim();
      
      // Make URL absolute if relative
      const absoluteUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `https://www.ncbi.nlm.nih.gov${imageUrl}`;
      
      images.push({
        url: absoluteUrl,
        caption: caption || `Figure ${figureNum}`,
        figureNumber: `Figure ${figureNum}`,
        pmcId,
        articleTitle: '', // Will be filled by caller
        source: 'PMC'
      });
      
      figureNum++;
    }
    
    console.log(`📸 Extracted ${images.length} images from PMC${pmcId}`);
    return images;
    
  } catch (error) {
    console.error(`Error fetching PMC article images for ${pmcId}:`, error);
    return [];
  }
}

/**
 * Extract images from Europe PMC articles
 * Europe PMC has a different API for fetching figures
 */
export async function fetchEuropePMCImages(pmcId: string): Promise<PMCImage[]> {
  try {
    // Europe PMC API endpoint for figures
    const apiUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/MED/${pmcId}/figures`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.figures || data.figures.length === 0) {
      return [];
    }
    
    const images: PMCImage[] = data.figures.map((fig: any, index: number) => ({
      url: fig.imageUrl || fig.thumbnailUrl,
      caption: fig.caption || `Figure ${index + 1}`,
      figureNumber: fig.figureId || `Figure ${index + 1}`,
      pmcId,
      articleTitle: data.title || '',
      source: 'PMC'
    }));
    
    console.log(`📸 Extracted ${images.length} images from Europe PMC ${pmcId}`);
    return images;
    
  } catch (error) {
    console.error(`Error fetching Europe PMC images for ${pmcId}:`, error);
    return [];
  }
}
