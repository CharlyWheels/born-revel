import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, items, userId, email } = req.body;
    try {
      // Check if the user exists
      let user = await prisma.user.findUnique({
        where: { id: userId },
      });

      // If the user does not exist, create the user
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email,
          },
        });
      }

      // Create the baby list
      const babyList = await prisma.babyList.create({
        data: {
          name,
          items,
          userId: user.id,
        },
      });

      res.status(201).json(babyList);
    } catch (error) {
      console.error('Error creating baby list:', error);
      res.status(500).json({ error: `Failed to create baby list: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 