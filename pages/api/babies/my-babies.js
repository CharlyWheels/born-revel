import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  try {
    const babyOwners = await prisma.babyOwner.findMany({
      where: { userId },
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
