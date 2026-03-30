import prisma from '../../../../../../lib/prisma';

export default async function handler(req, res) {
  const { babyId, giftId } = req.query;
  const giftIdInt = parseInt(giftId);

  if (req.method === 'PUT') {
    const { acceptSimilar, priceRangeMin, priceRangeMax, providerIds } = req.body;

    try {
      const updateData = {};
      if (acceptSimilar !== undefined) updateData.acceptSimilar = acceptSimilar;
      if (priceRangeMin !== undefined) updateData.priceRangeMin = priceRangeMin;
      if (priceRangeMax !== undefined) updateData.priceRangeMax = priceRangeMax;
      if (providerIds !== undefined) updateData.providerIds = providerIds;

      const giftItem = await prisma.giftItem.update({
        where: { id: giftIdInt },
        data: updateData,
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
      await prisma.giftItem.delete({ where: { id: giftIdInt } });
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
