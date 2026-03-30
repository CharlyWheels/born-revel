import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const articles = await prisma.article.findMany({
        include: {
          articleProviders: {
            include: { provider: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.status(200).json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error.message);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
