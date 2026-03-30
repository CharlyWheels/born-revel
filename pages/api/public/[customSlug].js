import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { customSlug } = req.query;

  try {
    const baby = await prisma.baby.findUnique({
      where: { customSlug },
      include: {
        owners: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        paymentConfigs: true,
      },
    });

    if (!baby) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Build public response
    const publicData = {
      id: baby.id,
      name: baby.name,
      dueDate: baby.dueDate,
      customSlug: baby.customSlug,
      owners: baby.owners.map((o) => ({
        name: o.user.name || 'Parent',
        role: o.role,
      })),
    };

    // Only include enabled features
    if (baby.giftRegistryEnabled) {
      const giftItems = await prisma.giftItem.findMany({
        where: { babyId: baby.id },
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

      publicData.giftRegistry = {
        enabled: true,
        settings: baby.giftRegistrySettings,
        items: giftItems,
        paymentConfig: baby.paymentConfigs.find((p) => p.featureType === 'gift'),
      };
    }

    if (baby.pregnancyTrackerEnabled && baby.pregnancyTrackerPublic) {
      publicData.pregnancyTracker = {
        enabled: true,
        settings: baby.pregnancyTrackerSettings,
        dueDate: baby.dueDate,
        pregnancyStartDate: baby.pregnancyStartDate,
      };
    }

    if (baby.birthBettingEnabled) {
      const bets = await prisma.bet.findMany({
        where: { babyId: baby.id },
        orderBy: { betDate: 'asc' },
      });

      publicData.birthBetting = {
        enabled: true,
        settings: baby.bettingSettings,
        bets,
        paymentConfig: baby.paymentConfigs.find((p) => p.featureType === 'betting'),
      };
    }

    res.status(200).json(publicData);
  } catch (error) {
    console.error('Error fetching public baby page:', error.message);
    res.status(500).json({ error: 'Failed to load page' });
  }
}
