import os
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, Header
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

# Load .env file from the repository root (26A/.env) when running locally
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)


def get_clean_database_url() -> str:
    raw_url = os.getenv("MATCHING_DATABASE_URL") or os.getenv("DATABASE_URL") or ""
    parsed = urlparse(raw_url)
    query_params = parse_qs(parsed.query)
    # Remove Prisma-specific 'schema' query parameter unsupported by psycopg
    query_params.pop("schema", None)
    clean_query = urlencode(query_params, doseq=True)
    return urlunparse(parsed._replace(query=clean_query))


DATABASE_URL = get_clean_database_url()

app = FastAPI()

# Load the Sentence Transformer model once at startup
model = SentenceTransformer("all-MiniLM-L6-v2")


class RankRequest(BaseModel):
    candidateId: str
    limit: Optional[int] = None


def get_recommended_feed(candidate_id: str, limit: Optional[int] = None):
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # -------------------------------------------------------------
            # 1. HARD RULES (SQL): Only published cards not yet swiped
            # -------------------------------------------------------------
            cur.execute(
                """
                SELECT c.* 
                FROM cards c
                WHERE c.status = 'PUBLISHED'
                  AND c.published_at IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 
                      FROM swipes s 
                      WHERE s.card_id = c.id 
                        AND s.candidate_id = %s::uuid
                  )
                """,
                (candidate_id,),
            )
            eligible_cards = cur.fetchall()

            if not eligible_cards:
                return []

            # -------------------------------------------------------------
            # 2. FETCH CANDIDATE PROFILE & TAGS (Candidate & Cards)
            # -------------------------------------------------------------
            cur.execute(
                """
                SELECT education_level, years_experience
                FROM candidate_profiles
                WHERE user_id = %s::uuid
                """,
                (candidate_id,),
            )
            profile = cur.fetchone()

            cur.execute(
                """
                SELECT t.label, t.type 
                FROM candidate_tags ct
                JOIN tags t ON t.id = ct.tag_id
                WHERE ct.candidate_id = %s::uuid
                """,
                (candidate_id,),
            )
            candidate_tags = cur.fetchall()

            # Cold-start fallback: no tags or profile info -> sort by published_at DESC
            has_profile_info = profile and (
                profile.get("education_level") or profile.get("years_experience") is not None
            )
            if not candidate_tags and not has_profile_info:
                eligible_cards.sort(
                    key=lambda c: c["published_at"].timestamp() if c["published_at"] else 0,
                    reverse=True,
                )
                return eligible_cards[:limit] if limit else eligible_cards

            card_ids = [c["id"] for c in eligible_cards]
            cur.execute(
                """
                SELECT ct.card_id, t.label, t.type
                FROM card_tags ct
                JOIN tags t ON t.id = ct.tag_id
                WHERE ct.card_id = ANY(%s::uuid[])
                """,
                (card_ids,),
            )
            card_tags_rows = cur.fetchall()

    card_tags_map = {}
    for row in card_tags_rows:
        card_tags_map.setdefault(row["card_id"], []).append(row["label"])

    # -------------------------------------------------------------
    # 3. NLP SCORING WITH SENTENCE TRANSFORMERS (Embeddings)
    # -------------------------------------------------------------
    profile_parts = []
    if profile:
        if profile.get("education_level") and profile["education_level"] != "NONE":
            profile_parts.append(f"Education: {profile['education_level']}")
        if profile.get("years_experience") is not None:
            profile_parts.append(f"Experience: {profile['years_experience']} years")
    if candidate_tags:
        tags_desc = ", ".join(f"{t['label']} ({t['type'].lower()})" for t in candidate_tags)
        profile_parts.append(f"Skills and preferences: {tags_desc}")

    candidate_text = "Candidate profile. " + ". ".join(profile_parts)

    card_texts = []
    for card in eligible_cards:
        tags_str = ", ".join(card_tags_map.get(card["id"], []))
        text = (
            f"{card['title']}. {card.get('description') or ''} "
            f"Location: {card.get('location') or ''}. "
            f"Contract: {card.get('contract_type') or ''}. Tags: {tags_str}"
        )
        card_texts.append(text)

    # Encode texts into dense vectors and compute cosine similarity
    candidate_emb = model.encode(candidate_text, convert_to_tensor=True)
    card_embs = model.encode(card_texts, convert_to_tensor=True)
    similarities = util.cos_sim(candidate_emb, card_embs)[0]

    scored_cards = []
    for idx, card in enumerate(eligible_cards):
        score = float(similarities[idx])
        #card["score"] = round(score, 4)
        scored_cards.append((score, card))

    # -------------------------------------------------------------
    # 4. FINAL RANKING (Similarity score DESC, then published_at DESC)
    # -------------------------------------------------------------
    scored_cards.sort(
        key=lambda item: (
            round(item[0], 4),
            item[1]["published_at"].timestamp() if item[1]["published_at"] else 0,
        ),
        reverse=True,
    )

    ranked_cards = [card for _, card in scored_cards]
    return ranked_cards[:limit] if limit else ranked_cards


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/internal/rank")
def internal_rank(payload: RankRequest, x_request_id: Optional[str] = Header(default=None)):
    cards = get_recommended_feed(payload.candidateId, payload.limit)
    return {
        "requestId": x_request_id,
        "candidateId": payload.candidateId,
        "cardIds": [str(card["id"]) for card in cards],
        "cards": cards,
    }


@app.get("/feed/{candidate_id}")
def read_feed(candidate_id: str):
    cards = get_recommended_feed(candidate_id)
    return {
        "success": True,
        "count": len(cards),
        "data": cards,
    }