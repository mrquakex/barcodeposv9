import { Request, Response, NextFunction } from 'express';

type Key = string;

const buckets = new Map<Key, { attempts: number; firstAt: number }>();

interface Options {
  windowMs: number; // ms
  max: number; // allowed attempts
}

export const createRateLimiter = (opts: Options, keyFn: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFn(req);
    const entry = buckets.get(key);
    if (!entry) {
      buckets.set(key, { attempts: 1, firstAt: now });
      return next();
    }
    if (now - entry.firstAt > opts.windowMs) {
      buckets.set(key, { attempts: 1, firstAt: now });
      return next();
    }
    if (entry.attempts >= opts.max) {
      const retrySecs = Math.ceil((opts.windowMs - (now - entry.firstAt)) / 1000);
      res.setHeader('Retry-After', retrySecs.toString());
      return res.status(429).json({ error: `Çok fazla deneme. ${retrySecs} sn sonra tekrar deneyin.` });
    }
    entry.attempts += 1;
    buckets.set(key, entry);
    next();
  };
};

export const loginRateLimit = createRateLimiter(
  { windowMs: 15 * 60 * 1000, max: 5 },
  (req) => `login:${req.ip}:${(req.body?.email || '').toLowerCase()}`
);


