import prisma from '../../../../lib/prisma';
import { requireOwner } from '../../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { babyId } = req.query;
  const { ownerIdToRemove } = req.body;

  if (!ownerIdToRemove) {
    return res.status(400).json({ error: 'ownerIdToRemove is required' });
  }

  const owner = await requireOwner(req, res, babyId);
  if (!owner) return;

  // Only the primary owner can remove co-owners.
  if (owner.role !== 'primary') {
    return res.status(403).json({ error: 'Only the primary owner can remove co-owners' });
  }

  try {

    // Find the owner to remove
    const ownerToRemove = await prisma.babyOwner.findUnique({
      where: { id: ownerIdToRemove },
    });

    if (!ownerToRemove || ownerToRemove.babyId !== babyId) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    if (ownerToRemove.role === 'primary') {
      return res.status(400).json({ error: 'Cannot remove the primary owner' });
    }

    await prisma.babyOwner.delete({
      where: { id: ownerIdToRemove },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing owner:', error);
    res.status(500).json({ error: 'Failed to remove owner' });
  }
}
