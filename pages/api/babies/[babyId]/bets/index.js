import prisma from '../../../../../lib/prisma';
import { sendBetNotification } from '../../../../../lib/email';
import { requireOwner } from '../../../../../lib/apiAuth';

export default async function handler(req, res) {
  const { babyId } = req.query;

  if (req.method === 'GET') {
    // Full bet list includes bettor emails — owner-only.
    // Public visitors read bets through /api/public/[customSlug].
    const owner = await requireOwner(req, res, babyId);
    if (!owner) return;

    try {
      const bets = await prisma.bet.findMany({
        where: { babyId },
        orderBy: { betDate: 'asc' },
      });

      const baby = await prisma.baby.findUnique({
        where: { id: babyId },
        select: { bettingSettings: true, dueDate: true },
      });

      res.status(200).json({ bets, settings: baby?.bettingSettings, dueDate: baby?.dueDate });
    } catch (error) {
      console.error('Error fetching bets:', error.message);
      res.status(500).json({ error: 'Failed to fetch bets' });
    }
  } else if (req.method === 'POST') {
    const { betterName, betterEmail, betDate, betDateEnd } = req.body;

    if (!betterName || !betDate) {
      return res.status(400).json({ error: 'betterName and betDate are required' });
    }

    try {
      // Check name uniqueness for this baby
      const existingBet = await prisma.bet.findUnique({
        where: { babyId_betterName: { babyId, betterName } },
      });

      if (existingBet) {
        return res.status(409).json({ error: 'This name has already been used for a bet on this baby' });
      }

      // Load baby settings to validate
      const baby = await prisma.baby.findUnique({
        where: { id: babyId },
        include: {
          owners: { include: { user: true } },
          bets: true,
        },
      });

      if (!baby) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      if (!baby.birthBettingEnabled) {
        return res.status(403).json({ error: 'Betting is not enabled for this baby' });
      }

      const settings = baby.bettingSettings || {};

      // Check if same-day betting is allowed
      if (!settings.allowSameDay) {
        const sameDayBet = baby.bets.find(
          (b) => new Date(b.betDate).toDateString() === new Date(betDate).toDateString() && b.verified
        );
        if (sameDayBet) {
          return res.status(409).json({ error: 'This date is already taken by a verified bet' });
        }
      }

      // Create the bet
      const bet = await prisma.bet.create({
        data: {
          babyId,
          betterName,
          betterEmail: betterEmail || null,
          betDate: new Date(betDate),
          betDateEnd: betDateEnd ? new Date(betDateEnd) : null,
          verified: false,
        },
      });

      // Notify owners via email
      const ownerEmails = baby.owners.map((o) => o.user.email);
      try {
        await sendBetNotification({
          ownerEmails,
          babyName: baby.name,
          betterName,
          betDate,
          babyId,
        });
      } catch (emailError) {
        console.error('Failed to send bet notification email:', emailError.message);
        // Don't fail the bet creation if email fails
      }

      res.status(201).json(bet);
    } catch (error) {
      console.error('Error placing bet:', error.message);
      res.status(500).json({ error: 'Failed to place bet' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
