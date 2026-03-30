import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { articleId } = req.query;

  if (req.method === 'PUT') {
    const { name, description, imageUrls, category, brand } = req.body;

    try {
      const article = await prisma.article.update({
        where: { id: parseInt(articleId) },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(imageUrls && { imageUrls }),
          ...(category && { category }),
          ...(brand && { brand }),
        },
      });

      res.status(200).json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: `Failed to update article: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
