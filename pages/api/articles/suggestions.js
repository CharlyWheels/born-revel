import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { query, country } = req.query;

  if (!query || query.length < 2) {
    return res.status(200).json([]);
  }

  try {
    const articles = await prisma.article.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        articleProviders: {
          include: { provider: true },
          ...(country ? {
            where: {
              provider: { country: country.toUpperCase() },
            },
          } : {}),
        },
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    // Add a "create new" option at the end
    const results = articles.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      imageUrls: a.imageUrls,
      providers: a.articleProviders.map((ap) => ({
        id: ap.provider.id,
        name: ap.provider.name,
        price: ap.price,
        buyUrl: ap.buyUrl,
        logoUrl: ap.provider.logoUrl,
      })),
    }));

    // Always add the "create new" option as the last item
    results.push({
      id: '__create_new__',
      name: `Create "${query}" as new product`,
      isCreateNew: true,
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching suggestions:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
}
