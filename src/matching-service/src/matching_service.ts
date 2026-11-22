import { db } from './db';

// -------------------------------------------------------------
// TYPES DEFINITIONS FOR SQL RESULTS
// -------------------------------------------------------------
interface DbCard {
  id: string;
  title: string;
  status: string;
  published_at: Date | null;
  score: number;
  [key: string]: any;
}

interface CandidateTag {
  tag_id: number; // Corrigé en number
  type: string;
}

interface CardTag {
  card_id: string;
  tag_id: number; // Corrigé en number
  type: string;
}

// -------------------------------------------------------------
// WEIGHTS FOR SCORING (SOFT RULES)
// -------------------------------------------------------------
const WEIGHTS: Record<string, number> = {
  SKILL: 3,
  ROLE: 2,
  SECTOR: 1,
  LOCATION: 1,
  CONTRACT: 1,
};

/**
 * Deterministic matching algorithm: Hard Rules + Soft Rules
 */
export async function getRecommendedFeed(candidateId: string): Promise<DbCard[]> {
  // 1. HARD RULES: Filter eligible cards
  // Note: Red flags are stored in `swipes`, so excluding swipes excludes red flags too.
  const { rows: eligibleCards } = await db.query<DbCard>(
    `SELECT c.* 
     FROM cards c
     WHERE c.status = 'PUBLISHED'
       AND c.published_at IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 
           FROM swipes s 
           WHERE s.card_id = c.id 
             AND s.candidate_id = $1::uuid
       )`,
    [candidateId]
  );

  if (eligibleCards.length === 0) {
    return [];
  }

  // 2. DATA RETRIEVAL FOR SCORING (SOFT RULES)
  const { rows: candidateTags } = await db.query<CandidateTag>(
    `SELECT ct.tag_id, t.type 
     FROM candidate_tags ct
     JOIN tags t ON t.id = ct.tag_id
     WHERE ct.candidate_id = $1::uuid`,
    [candidateId]
  );

  const candidateTagIds = new Set(candidateTags.map((tag) => tag.tag_id));

  const cardIds = eligibleCards.map((c) => c.id);
  const { rows: cardTags } = await db.query<CardTag>(
    `SELECT ct.card_id, ct.tag_id, t.type
     FROM card_tags ct
     JOIN tags t ON t.id = ct.tag_id
     WHERE ct.card_id = ANY($1::uuid[])`,
    [cardIds]
  );

  const cardTagsMap = new Map<string, CardTag[]>();
  for (const tag of cardTags) {
    const existing = cardTagsMap.get(tag.card_id) ?? [];
    existing.push(tag);
    cardTagsMap.set(tag.card_id, existing);
  }

  // 3. SCORE CALCULATION FOR EACH CARD
  const scoredCards = eligibleCards.map((card) => {
    let score = 0;
    const tags = cardTagsMap.get(card.id) ?? [];

    for (const tag of tags) {
      if (candidateTagIds.has(tag.tag_id)) {
        score += WEIGHTS[tag.type] ?? 1;
      }
    }

    return { card, score };
  });

  // 4. FINAL SORTING (Descending Score, then Publication Date)
  scoredCards.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const dateA = a.card.published_at ? new Date(a.card.published_at).getTime() : 0;
    const dateB = b.card.published_at ? new Date(b.card.published_at).getTime() : 0;
    return dateB - dateA;
  });

  return scoredCards.map((sc) => ({
    ...sc.card,
    score: sc.score,
  }));
}