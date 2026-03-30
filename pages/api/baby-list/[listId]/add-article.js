import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { listId } = req.query;
  if (req.method === 'POST') {
    const { articleId } = req.body;
    try {
      const updatedList = await prisma.babyList.update({
        where: { id: parseInt(listId) },
        data: {
          articles: {
            connect: { id: articleId },
          },
        },
        include: { articles: true },
      });
      res.status(200).json(updatedList);
    } catch (error) {
      console.error('Error adding article to list:', error.message);
      res.status(500).json({ error: 'Failed to add article to list' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 