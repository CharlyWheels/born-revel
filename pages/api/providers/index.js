import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { country } = req.query;

    try {
      const providers = await prisma.provider.findMany({
        where: country ? { country: country.toUpperCase() } : {},
        orderBy: { name: 'asc' },
      });
      res.status(200).json(providers);
    } catch (error) {
      console.error('Error fetching providers:', error.message);
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  } else if (req.method === 'POST') {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { name, logoUrl, country, websiteUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    try {
      const provider = await prisma.provider.create({
        data: {
          name,
          logoUrl: logoUrl || null,
          country: country || 'ES',
          websiteUrl: websiteUrl || null,
        },
      });
      res.status(201).json(provider);
    } catch (error) {
      console.error('Error creating provider:', error.message);
      res.status(500).json({ error: 'Failed to create provider' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
