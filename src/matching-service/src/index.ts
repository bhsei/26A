import express, { Request, Response } from 'express';
import { getRecommendedFeed } from './matching_service';

const app = express();
app.use(express.json());

const PORT = process.env.MATCHING_PORT || 4000;

// Endpoint du feed pour un candidat
app.get('/feed/:candidateId', async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.candidateId;
    const cards = await getRecommendedFeed(candidateId);
    
    return res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error('Error generating feed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while computing feed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Matching Service running on port ${PORT}`);
});