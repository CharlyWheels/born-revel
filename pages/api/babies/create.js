import prisma from '../../../lib/prisma';
import slugify from 'slugify';
import { requireAuth } from '../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { name, dueDate, customSlug } = req.body;

  if (!name || !dueDate) {
    return res.status(400).json({ error: 'name and dueDate are required' });
  }

  try {
    // Ensure user exists (identity derived from the verified token, not the body)
    let user = await prisma.user.findUnique({ where: { id: auth.uid } });
    if (!user) {
      user = await prisma.user.create({
        data: { id: auth.uid, email: auth.email },
      });
    }

    // Generate slug
    const slug = customSlug
      ? slugify(customSlug, { lower: true, strict: true })
      : slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);

    // Check slug uniqueness
    const existing = await prisma.baby.findUnique({ where: { customSlug: slug } });
    if (existing) {
      return res.status(409).json({ error: 'This URL slug is already taken. Please choose another.' });
    }

    // Create baby + primary owner in a transaction
    const baby = await prisma.$transaction(async (tx) => {
      const newBaby = await tx.baby.create({
        data: {
          name,
          dueDate: new Date(dueDate),
          customSlug: slug,
          country: user.country || 'ES',
        },
      });

      await tx.babyOwner.create({
        data: {
          userId: user.id,
          babyId: newBaby.id,
          role: 'primary',
        },
      });

      return newBaby;
    });

    const fullBaby = await prisma.baby.findUnique({
      where: { id: baby.id },
      include: {
        owners: { include: { user: true } },
      },
    });

    res.status(201).json(fullBaby);
  } catch (error) {
    console.error('Error creating baby:', error);
    res.status(500).json({ error: 'Failed to create baby' });
  }
}
