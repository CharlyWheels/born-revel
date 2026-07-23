import prisma from '../../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { babyId, giftId } = req.query;
  const giftIdInt = Number.parseInt(giftId, 10);
  const { reservedByName, reservationType } = req.body;

  if (Number.isNaN(giftIdInt)) {
    return res.status(400).json({ error: 'Invalid gift id' });
  }

  if (!reservedByName || !reservationType) {
    return res.status(400).json({ error: 'reservedByName and reservationType are required' });
  }

  if (!['buy', 'donate', 'pay'].includes(reservationType)) {
    return res.status(400).json({ error: 'reservationType must be buy, donate, or pay' });
  }

  try {
    const statusMap = { buy: 'bought', donate: 'donated', pay: 'paid' };

    // Atomic conditional update prevents a double-reservation race: only rows
    // still 'available' (and belonging to this baby) are updated.
    const { count } = await prisma.giftItem.updateMany({
      where: { id: giftIdInt, babyId, status: 'available' },
      data: {
        status: statusMap[reservationType] || 'reserved',
        reservedByName,
        reservationType,
      },
    });

    if (count === 0) {
      // Either the gift doesn't exist for this baby or it's already taken.
      const exists = await prisma.giftItem.findFirst({ where: { id: giftIdInt, babyId } });
      if (!exists) {
        return res.status(404).json({ error: 'Gift item not found' });
      }
      return res.status(409).json({ error: 'This gift has already been reserved' });
    }

    const updated = await prisma.giftItem.findUnique({
      where: { id: giftIdInt },
      include: { article: true },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error reserving gift:', error.message);
    res.status(500).json({ error: 'Failed to reserve gift' });
  }
}
