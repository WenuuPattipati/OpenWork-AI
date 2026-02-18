/**
 * openFDA API Integration
 * Provides drug labels, adverse events, and recall data
 */

export interface DrugLabel {
  brandName: string;
  genericName: string;
  manufacturer: string;
  indications: string;
  dosage: string;
  contraindications: string;
  warnings: string;
  adverseReactions: string;
  drugInteractions: string;
}

export interface AdverseEvent {
  drugName: string;
  reaction: string;
  seriousness: string;
  reportDate: string;
  count: number;
}

/**
 * Search openFDA for drug label information
 */
export async function searchDrugLabels(
  drugName: string,
  limit: number = 5
): Promise<DrugLabel[]> {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"+openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("openFDA API error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    const labels: DrugLabel[] = (data.results || []).map((result: any) => ({
      brandName: result.openfda?.brand_name?.[0] || "",
      genericName: result.openfda?.generic_name?.[0] || "",
      manufacturer: result.openfda?.manufacturer_name?.[0] || "",
      indications: result.indications_and_usage?.[0] || "",
      dosage: result.dosage_and_administration?.[0] || "",
      contraindications: result.contraindications?.[0] || "",
      warnings: result.warnings?.[0] || result.boxed_warning?.[0] || "",
      adverseReactions: result.adverse_reactions?.[0] || "",
      drugInteractions: result.drug_interactions?.[0] || "",
    }));
    
    return labels;
  } catch (error) {
    console.error("Error fetching drug labels:", error);
    return [];
  }
}

/**
 * Search openFDA for adverse event reports
 */
export async function searchAdverseEvents(
  drugName: string,
  limit: number = 10
): Promise<AdverseEvent[]> {
  try {
    const url = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("openFDA adverse events API error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    const events: AdverseEvent[] = (data.results || []).map((result: any) => ({
      drugName: drugName,
      reaction: result.term || "",
      seriousness: "Reported",
      reportDate: "",
      count: result.count || 0,
    }));
    
    return events;
  } catch (error) {
    console.error("Error fetching adverse events:", error);
    return [];
  }
}
