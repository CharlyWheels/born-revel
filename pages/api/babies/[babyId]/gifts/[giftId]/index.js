import prisma from '../../../../../../lib/prisma';
import { requireOwner } from '../../../../../../lib/apiAuth';

export default async function handler(req, res) {
  const { babyId, giftId } = req.query;
  const giftIdInt = Number.parseInt(giftId, 10);

  if (Number.isNaN(giftIdInt)) {
    return res.status(400).json({ error: 'Invalid gift id' });
  }

  const owner = await requireOwner(req, res, babyId);
  if (!owner) return;

  if (req.method === 'PUT') {
    const { acceptSimilar, priceRangeMin, priceRangeMax, providerIds } = req.body;

    try {
      const updateData = {};
      if (acceptSimilar !== undefined) updateData.acceptSimilar = acceptSimilar;
      if (priceRangeMin !== undefined) updateData.priceRangeMin = priceRangeMin;
      if (priceRangeMax !== undefined) updateData.priceRangeMax = priceRangeMax;
      if (providerIds !== undefined) updateData.providerIds = providerIds;

      // Scope to the owned baby so a valid owner can't edit another baby's gift by id.
      const { count } = await prisma.giftItem.updateMany({
        where: { id: giftIdInt, babyId },
        data: updateData,
      });

      if (count === 0) {
        return res.status(404).json({ error: 'Gift item not found' });
      }

      const giftItem = await prisma.giftItem.findUnique({
        where: { id: giftIdInt },
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

      res.status(200).json(giftItem);
    } catch (error) {
      console.error('Error updating gift item:', error.message);
      res.status(500).json({ error: 'Failed to update gift item' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { count } = await prisma.giftItem.deleteMany({ where: { id: giftIdInt, babyId } });
      if (count === 0) {
        return res.status(404).json({ error: 'Gift item not found' });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting gift item:', error.message);
      res.status(500).json({ error: 'Failed to delete gift item' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
