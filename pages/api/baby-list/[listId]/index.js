import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { listId } = req.query;
  if (req.method === 'GET') {
    try {
      const babyList = await prisma.babyList.findUnique({
        where: { id: parseInt(listId) },
        include: { articles: true },
      });
      res.status(200).json(babyList);
    } catch (error) {
      console.error('Error fetching list details:', error.message);
      res.status(500).json({ error: 'Failed to fetch list details' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 