import { scrapeProduct } from '../../../lib/scraping';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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
      return res.status(500).json({ error: result.error || 'scrape failed' });
    }

    res.status(200).json(result.data);
  } catch (error) {
    console.error('Error scraping article:', error.message);
    res.status(500).json({ error: 'Failed to scrape article' });
  }
}
