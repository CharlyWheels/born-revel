import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { token, userId, email } = req.body;

  if (!token || !userId || !email) {
    return res.status(400).json({ error: 'token, userId, and email are required' });
  }

  try {
    const invitation = await prisma.ownerInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation has already been ${invitation.status}` });
    }

    // Check if invitation has expired (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (new Date(invitation.createdAt) < sevenDaysAgo) {
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    if (invitation.email !== email) {
      return res.status(403).json({ error: 'This invitation was sent to a different email address' });
    }

    // Accept invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ensure user exists
      let user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        user = await tx.user.create({
          data: { id: userId, email },
        });
      }

      // Create baby owner
      await tx.babyOwner.create({
        data: {
          userId,
          babyId: invitation.babyId,
          role: 'co-owner',
        },
      });

      // Update invitation status
      const updated = await tx.ownerInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });

      return updated;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error accepting invitation:', error.message);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
}
