import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;
  if (req.method === 'GET') {
    try {
      const babyLists = await prisma.babyList.findMany({
        where: { userId },
      });

      res.status(200).json(babyLists);
    } catch (error) {
      console.error('Error fetching baby lists:', error.message);
      res.status(500).json({ error: 'Failed to fetch baby lists' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 