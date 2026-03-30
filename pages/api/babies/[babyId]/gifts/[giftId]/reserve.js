import prisma from '../../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { giftId } = req.query;
  const giftIdInt = parseInt(giftId);
  const { reservedByName, reservationType } = req.body;

  if (!reservedByName || !reservationType) {
    return res.status(400).json({ error: 'reservedByName and reservationType are required' });
  }

  if (!['buy', 'donate', 'pay'].includes(reservationType)) {
    return res.status(400).json({ error: 'reservationType must be buy, donate, or pay' });
  }

  try {
    const giftItem = await prisma.giftItem.findUnique({ where: { id: giftIdInt } });

    if (!giftItem) {
      return res.status(404).json({ error: 'Gift item not found' });
    }

    if (giftItem.status !== 'available') {
      return res.status(409).json({ error: 'This gift has already been reserved' });
    }

    const statusMap = { buy: 'bought', donate: 'donated', pay: 'paid' };

    const updated = await prisma.giftItem.update({
      where: { id: giftIdInt },
      data: {
        status: statusMap[reservationType] || 'reserved',
        reservedByName,
        reservationType,
      },
      include: {
        article: true,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error reserving gift:', error.message);
    res.status(500).json({ error: 'Failed to reserve gift' });
  }
}
