import prisma from '../../../../../lib/prisma';

export default async function handler(req, res) {
  const { babyId } = req.query;

  if (req.method === 'GET') {
    try {
      const giftItems = await prisma.giftItem.findMany({
        where: { babyId },
        include: {
          article: {
            include: {
              articleProviders: {
                include: { provider: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json(giftItems);
    } catch (error) {
      console.error('Error fetching gift items:', error.message);
      res.status(500).json({ error: 'Failed to fetch gift items' });
    }
  } else if (req.method === 'POST') {
    const { articleId, acceptSimilar, priceRangeMin, priceRangeMax, providerIds } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'articleId is required' });
    }

    try {
      const giftItem = await prisma.giftItem.create({
        data: {
          babyId,
          articleId,
          acceptSimilar: acceptSimilar || false,
          priceRangeMin: priceRangeMin || null,
          priceRangeMax: priceRangeMax || null,
          providerIds: providerIds || [],
        },
        include: {
          article: {
            include: {
              articleProviders: {
                include: { provider: true },
              },
            },
          },
        },
      });

      res.status(201).json(giftItem);
    } catch (error) {
      console.error('Error adding gift item:', error.message);
      res.status(500).json({ error: 'Failed to add gift item' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
