import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const babyOwners = await prisma.babyOwner.findMany({
      where: { userId: auth.uid },
      include: {
        baby: {
          include: {
            owners: { include: { user: true } },
            _count: {
              select: {
                giftItems: true,
                bets: true,
              },
            },
          },
        },
      },
    });

    const babies = babyOwners.map((bo) => ({
      ...bo.baby,
      role: bo.role,
    }));

    res.status(200).json(babies);
  } catch (error) {
    console.error('Error fetching babies:', error.message);
    res.status(500).json({ error: 'Failed to fetch babies' });
  }
}
