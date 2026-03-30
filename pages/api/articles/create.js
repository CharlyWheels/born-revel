import prisma from '../../../lib/prisma';
import { scrapeProduct } from '../../../lib/scraping';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    name,
    description,
    imageUrls,
    category,
    brand,
    url,
    providerId,
    userId,
    providerPrice,
    providerDetails,
    providerImageUrl,
    providerBuyUrl,
    skipScrape,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
      : typeof imageUrls === 'string'
        ? imageUrls
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [];
    const normalizedProviderPrice =
      typeof providerPrice === 'number'
        ? providerPrice
        : providerPrice
          ? parseFloat(providerPrice)
          : null;

    // Create the article
    const article = await prisma.article.create({
      data: {
        name,
        description: description || null,
        imageUrls: normalizedImageUrls,
        category: category || null,
        brand: brand || null,
        createdById: userId || null,
      },
    });

    let resolvedProviderId = providerId || null;
    let scrapeStatus = url ? 'pending' : 'skipped';
    let parsedUrl = null;

    if (url) {
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        console.error('Invalid URL provided:', error.message);
      }
    }

    // If a URL is provided but no existing provider, create one from the domain
    if (url && !providerId && parsedUrl) {
      const providerName = parsedUrl.hostname.replace(/^www\./, '');
      const providerWebsite = parsedUrl.origin;
      const existingProvider = await prisma.provider.findFirst({
        where: {
          OR: [{ websiteUrl: providerWebsite }, { name: providerName }],
        },
      });

      const provider =
        existingProvider ||
        (await prisma.provider.create({
          data: {
            name: providerName,
            websiteUrl: providerWebsite,
          },
        }));

      resolvedProviderId = provider.id;
    }

    const resolvedBuyUrl = providerBuyUrl || url || null;
    const resolvedProviderImage =
      providerImageUrl || (normalizedImageUrls.length > 0 ? normalizedImageUrls[0] : null);
    const hasProviderPrice = typeof normalizedProviderPrice === 'number';
    const hasProviderData =
      hasProviderPrice || Boolean(providerDetails) || Boolean(resolvedProviderImage);

    if (resolvedProviderId && (resolvedBuyUrl || hasProviderData)) {
      const lastScraped = skipScrape || hasProviderData ? new Date() : null;
      await prisma.articleProvider.upsert({
        where: {
          articleId_providerId: { articleId: article.id, providerId: resolvedProviderId },
        },
        update: {
          price: hasProviderPrice ? normalizedProviderPrice : null,
          buyUrl: resolvedBuyUrl,
          details: providerDetails || null,
          imageUrl: resolvedProviderImage,
          lastScraped,
        },
        create: {
          articleId: article.id,
          providerId: resolvedProviderId,
          price: hasProviderPrice ? normalizedProviderPrice : null,
          buyUrl: resolvedBuyUrl,
          details: providerDetails || null,
          imageUrl: resolvedProviderImage,
          lastScraped,
        },
      });
    }

    if (url && resolvedProviderId) {
      const scrapeOptions = {
        shouldUpdateDescription: !description,
        shouldUpdateImages: normalizedImageUrls.length === 0,
        shouldUpdateBrand: !brand,
        fallbackCategory: category || null,
      };

      if (skipScrape) {
        scrapeStatus = 'client';
      } else if (!providerId) {
        const scrapeResult = await scrapeAndSave(article.id, resolvedProviderId, url, scrapeOptions);
        scrapeStatus = scrapeResult.success ? 'completed' : 'failed';
      } else {
        // Don't await — run in background
        scrapeAndSave(article.id, resolvedProviderId, url, scrapeOptions).catch((err) =>
          console.error('Background scraping failed:', err.message)
        );
        scrapeStatus = 'background';
      }
    }

    const fullArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: {
        articleProviders: {
          include: { provider: true },
        },
      },
    });

    res.status(201).json({ ...fullArticle, scrapeStatus });
  } catch (error) {
    console.error('Error creating article:', error.message);
    res.status(500).json({ error: 'Failed to create article' });
  }
}

async function scrapeAndSave(articleId, providerId, url, options = {}) {
  console.info('Scrape started:', { articleId, providerId, url });
  const result = await scrapeProduct(url);
  if (!result.success) {
    console.warn('Scrape failed:', { articleId, providerId, url, error: result.error });
    return { success: false, error: result.error };
  }

  await prisma.articleProvider.upsert({
    where: {
      articleId_providerId: { articleId, providerId },
    },
    update: {
      price: result.data.price,
      buyUrl: url,
      details: result.data.description,
      imageUrl: result.data.imageUrls?.[0] || null,
      lastScraped: new Date(),
    },
    create: {
      articleId,
      providerId,
      price: result.data.price,
      buyUrl: url,
      details: result.data.description,
      imageUrl: result.data.imageUrls?.[0] || null,
      lastScraped: new Date(),
    },
  });

  const articleData = {};
  if (options.shouldUpdateDescription && result.data.description) {
    articleData.description = result.data.description;
  }
  if (options.shouldUpdateImages && result.data.imageUrls?.length) {
    articleData.imageUrls = result.data.imageUrls;
  }
  if (options.shouldUpdateBrand && result.data.brand) {
    articleData.brand = result.data.brand;
  }
  if (result.data.category || options.fallbackCategory) {
    articleData.category = result.data.category || options.fallbackCategory;
  }

  if (Object.keys(articleData).length > 0) {
    await prisma.article.update({
      where: { id: articleId },
      data: articleData,
    });
  }

  console.info('Scrape completed:', {
    articleId,
    providerId,
    url,
    images: result.data.imageUrls?.length || 0,
    hasDescription: Boolean(result.data.description),
    hasPrice: typeof result.data.price === 'number',
    category: result.data.category || null,
  });

  return { success: true };
}
