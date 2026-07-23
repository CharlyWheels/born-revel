import prisma from '../../../../lib/prisma';
import { requireOwner } from '../../../../lib/apiAuth';

export default async function handler(req, res) {
  const { babyId } = req.query;

  if (req.method === 'GET') {
    // This returns owner emails and payment configs — owner-only.
    const owner = await requireOwner(req, res, babyId);
    if (!owner) return;

    try {
      const baby = await prisma.baby.findUnique({
        where: { id: babyId },
        include: {
          owners: { include: { user: true } },
          invitations: { where: { status: 'pending' } },
          paymentConfigs: true,
          _count: {
            select: {
              giftItems: true,
              bets: true,
            },
          },
        },
      });

      if (!baby) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      res.status(200).json(baby);
    } catch (error) {
      console.error('Error fetching baby:', error.message);
      res.status(500).json({ error: 'Failed to fetch baby' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
