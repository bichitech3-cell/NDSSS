import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { paidApiLimiter } from '../middleware/rateLimiter';
import { validateBody, GenerateAiContentSchema } from '../middleware/validate';

const router = Router();

// Server-side AI proxy route: All Gemini AI calls are strictly backend-only.
// process.env.GEMINI_API_KEY is never sent or exposed to the browser client.
router.post(
  '/generate',
  authenticate,
  paidApiLimiter,
  validateBody(GenerateAiContentSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { prompt, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: 'AI service unavailable: Server secret not configured.' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are an academic administrator assistant for a Nigerian secondary school. Context: ${context || 'General school operation'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
        }
      });

      return res.json({
        content: response.text,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error generating content from server-side AI model.' });
    }
  }
);

export default router;
