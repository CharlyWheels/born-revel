import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { articleId } = req.query;

  if (req.method === 'PUT') {
    const { name, description, imageUrls, category, brand } = req.body;

    try {
      const data = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (imageUrls !== undefined) data.imageUrls = imageUrls;
      if (category !== undefined) data.category = category;
      if (brand !== undefined) data.brand = brand;

      const article = await prisma.article.update({
        where: { id: parseInt(articleId) },
        data,
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
