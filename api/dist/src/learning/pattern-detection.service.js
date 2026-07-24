// Common English stopwords, filtered out so frequency counting finds actual
// signal (domain terms, actions) rather than "the", "and", "was" dominating.
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'is', 'was', 'were', 'are', 'be', 'been', 'this',
    'that', 'it', 'as', 'has', 'have', 'had', 'not', 'no', 'so', 'if', 'than',
    'entity', 'redacted_email', 'redacted_phone', 'redacted_id',
]);
/**
 * Pattern Detection (Sprint 8 — real gap named since Sprint 2's verification
 * pass). LearningService.extract() captures individual patterns; nothing
 * previously clustered multiple Learnings into a detected trend. This is that
 * missing piece.
 *
 * Honest about what it is: frequency-based term clustering, not an ML model.
 * A term counts as "detected" only if it recurs across at least 2 different
 * Learnings — a single mention is an observation, not yet a pattern. This
 * threshold is what actually distinguishes "detection" from just listing
 * every word that ever appeared once.
 */
export class PatternDetectionService {
    detect(learnings, minOccurrences = 2) {
        const termMap = new Map();
        for (const learning of learnings) {
            if (!learning.reusable)
                continue; // only patterns proven to work should cluster
            const terms = this.extractTerms(learning.pattern);
            for (const term of new Set(terms)) { // dedupe within one learning so repeated words don't inflate one record's weight
                const entry = termMap.get(term) ?? { learningIds: new Set(), confidenceSum: 0, count: 0 };
                entry.learningIds.add(learning.id);
                entry.confidenceSum += learning.confidence;
                entry.count += 1;
                termMap.set(term, entry);
            }
        }
        const patterns = [];
        for (const [term, entry] of termMap) {
            if (entry.learningIds.size >= minOccurrences) {
                patterns.push({
                    term,
                    occurrences: entry.learningIds.size,
                    learningIds: [...entry.learningIds],
                    averageConfidence: Number((entry.confidenceSum / entry.count).toFixed(3)),
                });
            }
        }
        return patterns.sort((a, b) => b.occurrences - a.occurrences || b.averageConfidence - a.averageConfidence);
    }
    extractTerms(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    }
}
/**
 * Capability Gap Suggestion (Self-Evolving Intelligence sprint — the one
 * safe piece of that request). SUGGESTS, never creates. Compares real
 * detected patterns against the tenant's existing Capability names — a
 * pattern with no matching capability is surfaced as a candidate, nothing
 * more. Creating the actual Capability record still requires a human
 * explicitly calling the existing, unchanged Capability API — this
 * function has no ability to create one itself, by design.
 */
export function suggestCapabilityGaps(patterns, existingCapabilityNames) {
    const existingLower = new Set(existingCapabilityNames.map((n) => n.toLowerCase()));
    return patterns
        .filter((p) => !existingLower.has(p.term.toLowerCase()) && ![...existingLower].some((name) => name.includes(p.term.toLowerCase()) || p.term.toLowerCase().includes(name)))
        .map((p) => ({ term: p.term, occurrences: p.occurrences, averageConfidence: p.averageConfidence }));
}
