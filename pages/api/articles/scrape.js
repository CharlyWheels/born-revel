import { scrapeProduct } from '../../../lib/scraping';
import { requireAuth } from '../../../lib/apiAuth';

// Simple in-memory rate limiter per uid. Scraping triggers paid OpenAI +
// Bright Data calls, so we cap how often a single user can fire it.
const RATE_LIMIT = 10; // requests
const RATE_WINDOW_MS = 60 * 1000; // per minute
const hits = new Map(); // uid -> number[] (timestamps)

function isRateLimited(uid, now) {
  const recent = (hits.get(uid) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(uid, recent);
  return recent.length > RATE_LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

  if (isRateLimited(auth.uid, Date.now())) {
    return res.status(429).json({ error: 'Too many scrape requests. Please slow down.' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'invalid url' });
  }

  try {
    const result = await scrapeProduct(url);
    if (!result.success) {
      return res.status(502).json({ error: result.error || 'scrape failed' });
    }

    res.status(200).json(result.data);
  } catch (error) {
    console.error('Error scraping article:', error.message);
    res.status(500).json({ error: 'Failed to scrape article' });
  }
}
