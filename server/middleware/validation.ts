import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

/**
 * Sanitize string by removing potentially dangerous HTML/script tags and control characters
 */
export function sanitizeString(input: unknown, maxLength = 64): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"&/\\;`]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize identifier to alphanumeric characters, underscores, and hyphens
 */
export function sanitizeIdentifier(input: unknown, maxLength = 32): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Middleware: Validate and sanitize POST /api/generate-trivia payload
 */
export function validateGenerateTrivia(req: Request, res: Response, next: NextFunction) {
  try {
    const rawCategory = req.body?.category;
    const category = sanitizeIdentifier(rawCategory, 32) || 'all_mix';

    const rawDiff = req.body?.difficulty;
    const validDifficulties = ['Easy', 'Medium', 'Hard', 'All'];
    const difficulty = validDifficulties.includes(rawDiff) ? rawDiff : 'Medium';

    const rawCount = Number(req.body?.count);
    const count = Number.isFinite(rawCount) ? Math.max(1, Math.min(rawCount, 50)) : 5;

    let customTopic: string | undefined = undefined;
    if (req.body?.customTopic) {
      customTopic = sanitizeString(req.body.customTopic, 100);
      if (customTopic.length === 0) {
        customTopic = undefined;
      }
    }

    const hostVoiceName = sanitizeString(req.body?.personality?.name, 32) || 'Your Host';

    // Attach normalized/sanitized body
    req.body = {
      ...req.body,
      category,
      difficulty,
      count,
      customTopic,
      hostVoiceName,
    };

    next();
  } catch (err: any) {
    logger.warn('Validation failed for /api/generate-trivia', { error: err.message });
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid trivia request parameters' });
  }
}

/**
 * Middleware: Validate and sanitize POST /api/leaderboard payload
 */
export function validateLeaderboardSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      playerName,
      score,
      accuracyPct,
      difficulty,
      category,
      highestStreak,
      hostName,
      hostId,
      totalQuestions,
      correctQuestions,
    } = req.body || {};

    const cleanPlayerName = sanitizeString(playerName, 24);
    if (!cleanPlayerName) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'A valid player name between 1 and 24 characters is required.',
      });
    }

    const rawScore = Number(score);
    if (!Number.isFinite(rawScore) || rawScore < 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Score must be a positive finite number.',
      });
    }

    const cleanScore = Math.min(10000000, Math.round(rawScore));
    const cleanAccuracy = Math.max(0, Math.min(100, Math.round(Number(accuracyPct) || 0)));
    const cleanDifficulty = difficulty === 'Easy' || difficulty === 'Hard' ? difficulty : 'Medium';
    const cleanCategory = sanitizeIdentifier(category, 32) || 'all_mix';
    const cleanStreak = Math.max(0, Math.min(100, Math.round(Number(highestStreak) || 0)));
    const cleanHostName = sanitizeString(hostName, 32) || 'The Host';
    const cleanHostId = sanitizeIdentifier(hostId, 20) || 'roxy';
    const cleanTotal = Math.max(1, Math.min(100, Math.round(Number(totalQuestions) || 5)));
    const cleanCorrect = Math.max(0, Math.min(cleanTotal, Math.round(Number(correctQuestions) || 0)));

    req.body = {
      playerName: cleanPlayerName,
      score: cleanScore,
      accuracyPct: cleanAccuracy,
      difficulty: cleanDifficulty,
      category: cleanCategory,
      highestStreak: cleanStreak,
      hostName: cleanHostName,
      hostId: cleanHostId,
      totalQuestions: cleanTotal,
      correctQuestions: cleanCorrect,
    };

    next();
  } catch (err: any) {
    logger.warn('Validation failed for /api/leaderboard', { error: err.message });
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid leaderboard entry payload' });
  }
}

/**
 * Middleware: Validate and sanitize POST /api/host-banter payload
 */
export function validateHostBanterRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const eventType = sanitizeIdentifier(req.body?.eventType, 32) || 'general';
    const personality = req.body?.personality || {};
    const hostName = sanitizeString(personality.name, 32) || 'The Host';

    req.body.eventType = eventType;
    req.body.personality = {
      ...personality,
      name: hostName,
      catchphrase: sanitizeString(personality.catchphrase, 120),
    };

    next();
  } catch (err: any) {
    logger.warn('Validation failed for /api/host-banter', { error: err.message });
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid host banter request' });
  }
}

/**
 * Middleware: Validate and sanitize POST /api/host-tts payload
 */
export function validateTTSRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const rawText = req.body?.text;
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Speech text must be a non-empty string.',
      });
    }

    const cleanText = rawText
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim()
      .slice(0, 500);

    const voice = sanitizeIdentifier(req.body?.voice, 32) || 'Puck';

    req.body.text = cleanText;
    req.body.voice = voice;

    next();
  } catch (err: any) {
    logger.warn('Validation failed for /api/host-tts', { error: err.message });
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid TTS payload' });
  }
}

/**
 * Middleware: Validate and sanitize POST /api/lifeline-search payload
 */
export function validateLifelineSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const question = sanitizeString(req.body?.question, 300);
    if (!question) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'A valid question string is required for Google Search grounding.',
      });
    }

    const rawOptions = Array.isArray(req.body?.options) ? req.body.options : [];
    const options = rawOptions.map((opt: unknown) => sanitizeString(opt, 80)).filter(Boolean);
    const category = sanitizeIdentifier(req.body?.category, 32) || 'general';

    req.body.question = question;
    req.body.options = options;
    req.body.category = category;

    next();
  } catch (err: any) {
    logger.warn('Validation failed for /api/lifeline-search', { error: err.message });
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid lifeline search parameters' });
  }
}
