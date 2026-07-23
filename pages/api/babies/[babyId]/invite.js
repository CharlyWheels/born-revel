import prisma from '../../../../lib/prisma';
import { sendOwnerInvitation } from '../../../../lib/email';
import { requireOwner } from '../../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { babyId } = req.query;
  const { email, inviterName } = req.body;

  if (!email || !inviterName) {
    return res.status(400).json({ error: 'email and inviterName are required' });
  }

  const owner = await requireOwner(req, res, babyId);
  if (!owner) return;

  try {
    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      include: { owners: { include: { user: true } } },
    });

    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Check if already an owner
    const alreadyOwner = baby.owners.some((o) => o.user.email === email);
    if (alreadyOwner) {
      return res.status(409).json({ error: 'This person is already an owner' });
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.ownerInvitation.findFirst({
      where: { babyId, email, status: 'pending' },
    });
    if (existingInvite) {
      return res.status(409).json({ error: 'An invitation is already pending for this email' });
    }

    // Create invitation
    const invitation = await prisma.ownerInvitation.create({
      data: { babyId, email },
    });

    // Send email
    try {
      await sendOwnerInvitation({
        toEmail: email,
        babyName: baby.name,
        inviterName,
        token: invitation.token,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError.message);
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${invitation.token}`;
    res.status(201).json({ ...invitation, inviteLink });
  } catch (error) {
    console.error('Error sending invitation:', error.message);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
}
