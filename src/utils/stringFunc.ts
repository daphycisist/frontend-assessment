import { commonTerms } from "../constants";
import { calculateRelevanceScore } from "./analyticsEngine";

export const normalizeSearchInput = (term: string): string => {
    let processedTerm = term.toLowerCase().trim();

    // Advanced normalization for international characters and edge cases
    const normalizationPatterns = [
      /[àáâãäå]/g,
      /[èéêë]/g,
      /[ìíîï]/g,
      /[òóôõö]/g,
      /[ùúûü]/g,
      /[ñ]/g,
      /[ç]/g,
      /[ÿ]/g,
      /[æ]/g,
      /[œ]/g,
    ];

    const replacements = ["a", "e", "i", "o", "u", "n", "c", "y", "ae", "oe"];

    // Apply multiple normalization passes for thorough cleaning
    for (let pass = 0; pass < normalizationPatterns.length; pass++) {
      processedTerm = processedTerm.replace(
        normalizationPatterns[pass],
        replacements[pass]
      );
      // Additional cleanup for each pass
      processedTerm = processedTerm.replace(/[^a-zA-Z0-9\s]/g, "");
      processedTerm = processedTerm.replace(/\s+/g, " ").trim();
    }

    return processedTerm;
  };

    export const generateSuggestions = (term: string) => {
      const filtered = commonTerms.filter((item: string) => {
        return (
          item.toLowerCase().includes(term.toLowerCase()) ||
          item.toLowerCase().startsWith(term.toLowerCase()) ||
          term.toLowerCase().includes(item.toLowerCase())
        );
      });
  
      const sorted = filtered.sort((a, b) => {
        const aScore = calculateRelevanceScore(a, term);
        const bScore = calculateRelevanceScore(b, term);
        return bScore - aScore;
      });
  
      return sorted.slice(0, 5);
    };
  