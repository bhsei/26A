import { prisma } from './prisma';

// TYPES DEFINITIONS FOR SQL RESULTS

interface DbCard {
  id: string;
  title: string;
  status: string;
  published_at: Date | null;
  [key: string]: any; // Allows flexible access to other raw SQL columns
}

interface CandidateTag {
  tag_id: string;
  type: string;
}

interface CardTag {
  card_id: string;
  tag_id: string;
  type: string;
}


// WEIGHTS FOR SCORING (SOFT RULES)
// Temporary weights to discuss with the product team

const WEIGHT_SKILL = 3;       // Matching skill tag
const WEIGHT_ROLE = 2;        // Matching role tag
const WEIGHT_LOCATION = 1;    // Matching location tag

/**
 * Hard Rules + Soft Rules
 */
export async function getRecommendedFeed(candidateId: string): Promise<DbCard[]> {
 
  // 1. HARD RULES: Filter eligible cards (Raw SQL with NOT EXISTS)

  const eligibleCards = await prisma.$queryRaw<DbCard[]>`
    SELECT c.* 
    FROM cards c
    WHERE c.status = 'published'
      AND c.published_at IS NOT NULL
      AND NOT EXISTS (
          -- Exclude already swiped cards (liked or passed)
          SELECT 1 
          FROM swipes s 
          WHERE s.card_id = c.id 
            AND s.candidate_id = ${candidateId}::uuid
      )
      AND NOT EXISTS (
          -- Exclude red-flagged cards by the candidate
          SELECT 1 
          FROM flags f 
          WHERE f.card_id = c.id 
            AND f.candidate_id = ${candidateId}::uuid 
            AND f.kind = 'red'
      )
  `;

  // Return early if no cards are eligible
  if (eligibleCards.length === 0) {
    return [];
  }


  // 2. DATA RETRIEVAL FOR SCORING (SOFT RULES)

  
  // A. Fetch candidate tags with their types
  const candidateTags = await prisma.$queryRaw<CandidateTag[]>`
    SELECT ct.tag_id, t.type 
    FROM candidate_tags ct
    JOIN tags t ON ct.tag_id = t.id
    WHERE ct.candidate_id = ${candidateId}::uuid
  `;

  // Optimization: Store candidate tag IDs in a Set for O(1) instant lookup
  const candidateTagIds = new Set(candidateTags.map((tag) => tag.tag_id));

  // B. Fetch all tags linked to the eligible cards
  const cardIds = eligibleCards.map((c) => c.id);
  const cardTags = await prisma.$queryRaw<CardTag[]>`
    SELECT ct.card_id, ct.tag_id, t.type
    FROM card_tags ct
    JOIN tags t ON ct.tag_id = t.id
    WHERE ct.card_id = ANY(${cardIds}::uuid[])
  `;

  // Optimization: Group card tags by card_id into a HashMap
  const cardTagsMap = new Map<string, CardTag[]>();
  for (const tag of cardTags) {
    const existing = cardTagsMap.get(tag.card_id) ?? [];
    existing.push(tag);
    cardTagsMap.set(tag.card_id, existing);
  }


  // 3. SCORE CALCULATION FOR EACH CARD (Optimized Loops)

  const scoredCards = eligibleCards.map((card) => {
    let score = 0;
    const tags = cardTagsMap.get(card.id) ?? [];

    for (const tag of tags) {
      if (candidateTagIds.has(tag.tag_id)) {
        if (tag.type === 'skill') score += WEIGHT_SKILL;
        else if (tag.type === 'role') score += WEIGHT_ROLE;
        else if (tag.type === 'location') score += WEIGHT_LOCATION;
        else score += 1;
      }
    }

    return { card, score };
  });


  // 4. FINAL SORTING (Descending Score, then Publication Date)

  scoredCards.sort((a, b) => {
    // Primary sort: higher score first
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Secondary fallback sort: most recent card first
    const dateA = a.card.published_at ? new Date(a.card.published_at).getTime() : 0;
    const dateB = b.card.published_at ? new Date(b.card.published_at).getTime() : 0;
    return dateB - dateA;
  });

  // Return sorted array of cards
  return scoredCards.map((sc) => sc.card);
}