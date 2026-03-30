import prisma from '../../../../../../lib/prisma';
import { sendBetApproval } from '../../../../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { betId } = req.query;
  const betIdInt = parseInt(betId);
  const { approved } = req.body;

  if (approved === undefined) {
    return res.status(400).json({ error: 'approved field is required' });
  }

  try {
    const bet = await prisma.bet.findUnique({
      where: { id: betIdInt },
      include: { baby: true },
    });

    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    if (approved) {
      const updated = await prisma.bet.update({
        where: { id: betIdInt },
        data: { verified: true },
      });

      // Notify bettor if they provided email
      if (bet.betterEmail) {
        try {
          await sendBetApproval({
            toEmail: bet.betterEmail,
            babyName: bet.baby.name,
            betDate: bet.betDate,
            approved: true,
          });
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError.message);
        }
      }

      res.status(200).json(updated);
    } else {
      // Reject and delete the bet
      await prisma.bet.delete({ where: { id: betIdInt } });

      // Notify bettor if they provided email
      if (bet.betterEmail) {
        try {
          await sendBetApproval({
            toEmail: bet.betterEmail,
            babyName: bet.baby.name,
            betDate: bet.betDate,
            approved: false,
          });
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError.message);
        }
      }

      res.status(200).json({ deleted: true });
    }
  } catch (error) {
    console.error('Error verifying bet:', error.message);
    res.status(500).json({ error: 'Failed to verify bet' });
  }
}
