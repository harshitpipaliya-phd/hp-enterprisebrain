/**
 * DPDP-compliant anonymization (Sprint 3 Story 8).
 *
 * A Learning is meant to be reusable organizational knowledge — a pattern, not a
 * record about a specific person. Under India's DPDP Act 2023, storing a pattern
 * that still identifies an individual (a name, an employee/student ID, a contact
 * detail) as "reusable knowledge" is exactly the kind of retained personal data
 * that needs a lawful basis and purpose limitation the Learning ledger doesn't have.
 *
 * This strips identifiable references before a pattern is persisted. It is
 * deliberately conservative — pattern-matching common identifier shapes rather than
 * a full PII-detection model — because a false positive (over-redacting) loses
 * nothing, whereas a false negative (missing real PII) is the actual harm.
 */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
// Common ID shapes: employee/student IDs, PAN-like alphanumeric codes, roll numbers.
const ID_LIKE_RE = /\b(?:[A-Z]{2,5}-?\d{3,8}|\d{6,12})\b/g;
export function anonymize(input) {
    let redactionCount = 0;
    let text = input;
    text = text.replace(EMAIL_RE, () => { redactionCount++; return '[REDACTED_EMAIL]'; });
    text = text.replace(PHONE_RE, () => { redactionCount++; return '[REDACTED_PHONE]'; });
    text = text.replace(ID_LIKE_RE, () => { redactionCount++; return '[REDACTED_ID]'; });
    return { text, redactionCount };
}
/**
 * Generalizes a pattern by removing named-entity-shaped tokens (capitalized
 * multi-word sequences that look like a person or org name) so the learning reads
 * as a transferable pattern rather than a case file. Conservative: only strips
 * sequences of 2+ consecutive capitalized words, which covers most name shapes
 * without touching ordinary capitalized sentence starts.
 */
const NAME_LIKE_RE = /\b([A-Z][a-z]+ ){1,3}[A-Z][a-z]+\b/g;
export function generalize(input) {
    let redactionCount = 0;
    const text = input.replace(NAME_LIKE_RE, () => { redactionCount++; return '[ENTITY]'; });
    return { text, redactionCount };
}
