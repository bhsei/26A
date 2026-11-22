import express, { Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getRecommendedFeed } from './matching_service';

const app = express();
app.use(express.json());

const PORT = process.env.MATCHING_PORT || 4000;

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'matching' });
});

app.post('/internal/matching/rank', async (req: Request, res: Response) => {
  const configuredKey = process.env.MATCHING_SERVICE_API_KEY;
  const suppliedKey = req.header('X-API-Key');
  if (!configuredKey || !suppliedKey ||
      configuredKey.length !== suppliedKey.length ||
      !timingSafeEqual(Buffer.from(configuredKey), Buffer.from(suppliedKey))) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Internal service authentication is required' });
  }
  const candidateId = req.body?.candidateId;
  const limit = Number(req.body?.limit ?? 20);
  if (typeof candidateId !== 'string' || candidateId.length === 0) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'candidateId is required' });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'limit must be from 1 to 50' });
  }
  try {
    const cards = await getRecommendedFeed(candidateId);
    return res.status(200).json({
      items: cards.slice(0, limit).map((card) => ({
        cardId: card.id,
        score: card.score,
      })),
    });
  } catch (error) {
    console.error('Error generating feed:', error);
    return res.status(503).json({
      code: 'RANKING_UNAVAILABLE',
      message: 'The matching service could not rank cards',
    });
  }
});


app.listen(PORT, () => {
  console.log(`Matching Service running on port ${PORT}`);
});