import prisma from '../../../../lib/prisma';
import { scrapeProduct } from '../../../../lib/scraping';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { articleId } = req.query;
  const articleIdInt = parseInt(articleId);
  const { providerId, url, price, location, details, imageUrl, providerName, providerCountry } = req.body;

  try {
    let actualProviderId = providerId;

    // If no existing provider, create one
    if (!actualProviderId && (url || providerName)) {
      const name = providerName || (url ? new URL(url).hostname.replace('www.', '') : 'Unknown');
      const provider = await prisma.provider.create({
        data: {
          name,
          country: providerCountry || 'ES',
          websiteUrl: url ? new URL(url).origin : null,
        },
      });
      actualProviderId = provider.id;
    }

    if (!actualProviderId) {
      return res.status(400).json({ error: 'Either providerId or provider details are required' });
    }

    // If URL is provided, try to scrape
    let scrapedData = null;
    if (url) {
      const result = await scrapeProduct(url);
      if (result.success) {
        scrapedData = result.data;
      }
    }

    // Create/update the article-provider relationship
    const articleProvider = await prisma.articleProvider.upsert({
      where: {
        articleId_providerId: {
          articleId: articleIdInt,
          providerId: actualProviderId,
        },
      },
      update: {
        price: price ?? scrapedData?.price ?? null,
        buyUrl: url || null,
        location: location || null,
        details: details ?? scrapedData?.description ?? null,
        imageUrl: imageUrl ?? scrapedData?.imageUrls?.[0] ?? null,
        lastScraped: url ? new Date() : null,
      },
      create: {
        articleId: articleIdInt,
        providerId: actualProviderId,
        price: price ?? scrapedData?.price ?? null,
        buyUrl: url || null,
        location: location || null,
        details: details ?? scrapedData?.description ?? null,
        imageUrl: imageUrl ?? scrapedData?.imageUrls?.[0] ?? null,
        lastScraped: url ? new Date() : null,
      },
    });

    // Also update the article with better data if we got it
    if (scrapedData) {
      const article = await prisma.article.findUnique({ where: { id: articleIdInt } });
      if (article) {
        const shouldUpdateDescription = !article.description && scrapedData.description;
        const shouldUpdateImages =
          article.imageUrls.length === 0 && scrapedData.imageUrls?.length > 0;
        const shouldUpdateBrand = !article.brand && scrapedData.brand;
        if (shouldUpdateDescription || shouldUpdateImages || shouldUpdateBrand) {
        await prisma.article.update({
          where: { id: articleIdInt },
          data: {
            ...(shouldUpdateDescription ? { description: scrapedData.description } : {}),
            ...(shouldUpdateImages ? { imageUrls: scrapedData.imageUrls } : {}),
            ...(shouldUpdateBrand ? { brand: scrapedData.brand } : {}),
          },
        });
        }
      }
    }

    const full = await prisma.articleProvider.findUnique({
      where: { id: articleProvider.id },
      include: { provider: true, article: true },
    });

    res.status(200).json(full);
  } catch (error) {
    console.error('Error adding provider to article:', error.message);
    res.status(500).json({ error: 'Failed to add provider' });
  }
}
