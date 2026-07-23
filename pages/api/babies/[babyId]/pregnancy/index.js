import prisma from '../../../../../lib/prisma';
import pregnancyData from '../../../../../data/pregnancy-weeks.json';
import { requireOwner } from '../../../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { babyId } = req.query;

  // Owner management view. Public visitors use /api/public/[customSlug].
  const owner = await requireOwner(req, res, babyId);
  if (!owner) return;

  try {
    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      select: {
        dueDate: true,
        pregnancyStartDate: true,
        pregnancyTrackerEnabled: true,
        pregnancyTrackerPublic: true,
        pregnancyTrackerSettings: true,
      },
    });

    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    if (!baby.pregnancyTrackerEnabled) {
      return res.status(403).json({ error: 'Pregnancy tracker is not enabled' });
    }

    // Calculate pregnancy week based on due date
    // Standard pregnancy is 40 weeks (280 days)
    const dueDate = new Date(baby.dueDate);
    const now = new Date();

    // pregnancyStartDate is 280 days before dueDate if not explicitly set
    const startDate = baby.pregnancyStartDate
      ? new Date(baby.pregnancyStartDate)
      : new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);

    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.min(Math.max(Math.floor(daysSinceStart / 7) + 1, 1), 42);
    const daysRemaining = Math.max(Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)), 0);
    const totalDays = 280;
    const daysElapsed = totalDays - daysRemaining;
    const progressPercent = Math.min(Math.round((daysElapsed / totalDays) * 100), 100);

    // Get week data from our dataset
    const weekData = pregnancyData.find((w) => w.week === currentWeek) || pregnancyData[pregnancyData.length - 1];

    res.status(200).json({
      currentWeek,
      daysRemaining,
      daysElapsed,
      progressPercent,
      dueDate: baby.dueDate,
      startDate: startDate.toISOString(),
      weekData,
      settings: baby.pregnancyTrackerSettings,
      isPublic: baby.pregnancyTrackerPublic,
    });
  } catch (error) {
    console.error('Error fetching pregnancy data:', error.message);
    res.status(500).json({ error: 'Failed to fetch pregnancy data' });
  }
}
