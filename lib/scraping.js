import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;

/**
 * Check if URL is an Amazon domain
 */
function isAmazonUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return /(?:^|\.)amazon\.(com|es|co\.uk|de|fr|it|co\.jp|ca|com\.au|com\.br|com\.mx|nl|pl|se|sg|in)$/.test(hostname);
  } catch {
    return false;
  }
}

/**
 * Convert any Amazon regional URL to amazon.com (ASIN is universal)
 */
function toAmazonComUrl(url) {
  const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
  if (asinMatch) {
    return `https://www.amazon.com/dp/${asinMatch[1]}`;
  }
  return url.replace(/amazon\.(es|co\.uk|de|fr|it|co\.jp|ca|com\.au|com\.br|com\.mx|nl|pl|se|sg|in)/, 'amazon.com');
}

/**
 * Detect the language from the original Amazon URL domain
 */
function getAmazonLanguage(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('amazon.es') || hostname.includes('amazon.com.mx') || hostname.includes('amazon.com.br')) return 'ES';
    if (hostname.includes('amazon.de')) return 'DE';
    if (hostname.includes('amazon.fr')) return 'FR';
    if (hostname.includes('amazon.it')) return 'IT';
    if (hostname.includes('amazon.co.jp')) return 'JA';
    return 'EN';
  } catch {
    return 'EN';
  }
}

/**
 * Scrape Amazon product using Bright Data Datasets API (structured JSON)
 */
async function scrapeWithBrightDataAmazon(url) {
  const language = getAmazonLanguage(url);
  // Try amazon.com first (best support), fall back to original URL
  const amazonComUrl = toAmazonComUrl(url);
  const urlsToTry = amazonComUrl !== url ? [amazonComUrl, url] : [url];

  for (const tryUrl of urlsToTry) {
    console.info('[BrightData] Trying Amazon product:', tryUrl, 'language:', language);
    const result = await _triggerAmazonScrape(tryUrl, language);
    if (result) return result;
    console.info('[BrightData] No results for', tryUrl, '- trying next URL');
  }

  throw new Error('Bright Data Amazon scrape returned no product data for any URL variant');
}

async function _triggerAmazonScrape(url, language) {
  const triggerRes = await fetch(
    'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l7q7dkf244hwjntr0&format=json',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ url, language }]),
    }
  );

  if (!triggerRes.ok) {
    const err = await triggerRes.text();
    throw new Error(`Bright Data trigger failed (${triggerRes.status}): ${err}`);
  }

  const triggerData = await triggerRes.json();
  const snapshotId = triggerData.snapshot_id;

  if (!snapshotId) {
    throw new Error('Bright Data trigger did not return a snapshot_id');
  }

  console.info('[BrightData] Snapshot ID:', snapshotId);

  // Poll for results (max 90 seconds)
  const maxAttempts = 30;
  const pollInterval = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const snapshotRes = await fetch(
      `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
      {
        headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}` },
      }
    );

    if (snapshotRes.status === 202) {
      console.info(`[BrightData] Snapshot not ready yet (attempt ${i + 1}/${maxAttempts})`);
      continue;
    }

    if (!snapshotRes.ok) {
      const err = await snapshotRes.text();
      throw new Error(`Bright Data snapshot failed (${snapshotRes.status}): ${err}`);
    }

    const results = await snapshotRes.json();
    const product = Array.isArray(results) ? results[0] : results;

    if (!product || !product.title) {
      console.warn('[BrightData] Amazon result has no product data, fields:', Object.keys(product || {}));
      return null;
    }

    console.info('[BrightData] Amazon product extracted:', {
      title: product.title,
      brand: product.brand,
      imageCount: product.images?.length || 0,
      price: product.final_price || product.initial_price,
    });

    // Map to our format
    return {
      name: product.title || null,
      description: product.description?.slice(0, 200) || null,
      price: product.final_price || product.initial_price || null,
      currency: product.currency || 'EUR',
      imageUrls: (product.images || []).map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean).slice(0, 5),
      category: product.categories_flat || product.category || null,
      brand: product.brand || null,
      specs: product.specifications || {},
    };
  }

  console.warn('[BrightData] Scrape timed out for', url);
  return null;
}

/**
 * Scrape any URL using Bright Data Web Unlocker (full JS rendering) + OpenAI extraction
 */
async function scrapeWithBrightDataGeneral(url) {
  console.info('[BrightData] Scraping with Web Unlocker:', url);

  // First check if we have any active zones
  const zonesRes = await fetch('https://api.brightdata.com/zone/get_active_zones', {
    headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}` },
  });
  const zones = zonesRes.ok ? await zonesRes.json() : [];
  const unlockerZone = zones.find((z) => z.plan?.type === 'unblocker') || zones[0];

  if (!unlockerZone) {
    throw new Error('No Bright Data zones configured. Set up a Web Unlocker zone at brightdata.com/cp');
  }

  const res = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zone: unlockerZone.name,
      url,
      format: 'raw',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bright Data request failed (${res.status}): ${err}`);
  }

  const html = await res.text();

  // Parse the rendered HTML with Cheerio + OpenAI (reuse existing logic)
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, iframe, noscript').remove();

  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try { jsonLd.push(JSON.parse($(el).html())); } catch (e) { /* skip */ }
  });

  const meta = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
  };

  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    const alt = $(el).attr('alt') || '';
    if (src && (src.startsWith('http') || src.startsWith('//'))) {
      images.push({ src, alt });
    }
  });

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
  const pageData = { bodyText, meta, images: images.slice(0, 10), jsonLd, url };

  const productDetails = await extractProductDetails(pageData);
  productDetails.imageUrls = sanitizeImageUrls(
    productDetails.imageUrls,
    pageData.meta.ogImage,
    pageData.images.map((image) => image.src)
  );

  return productDetails;
}

/**
 * Fetch a URL and extract clean text content using Cheerio
 */
async function fetchAndClean(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer
  $('script, style, nav, footer, header, iframe, noscript').remove();

  // Extract structured data if available (JSON-LD)
  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).html()));
    } catch (e) {
      // skip invalid JSON-LD
    }
  });

  // Extract meta tags
  const meta = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
  };

  // Extract images from the main content
  const images = [];
  const extractImageUrlsFromElement = ($el) => {
    const urls = [];
    const directAttrs = [
      'src',
      'data-src',
      'data-lazy',
      'data-original',
      'data-zoom-image',
      'data-old-hires',
    ];
    directAttrs.forEach((attr) => {
      const value = $el.attr(attr);
      if (value) {
        urls.push(value);
      }
    });

    const srcset = $el.attr('srcset') || $el.attr('data-srcset');
    if (srcset) {
      srcset.split(',').forEach((entry) => {
        const url = entry.trim().split(' ')[0];
        if (url) {
          urls.push(url);
        }
      });
    }

    const dynamicImage = $el.attr('data-a-dynamic-image');
    if (dynamicImage) {
      try {
        const decoded = dynamicImage.replace(/&quot;/g, '"');
        const parsed = JSON.parse(decoded);
        Object.keys(parsed || {}).forEach((url) => {
          urls.push(url);
        });
      } catch (error) {
        // Ignore invalid JSON
      }
    }

    return urls;
  };

  $('img').each((_, el) => {
    const $el = $(el);
    const alt = $el.attr('alt') || '';
    const candidates = extractImageUrlsFromElement($el);
    candidates.forEach((src) => {
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        images.push({ src, alt });
      }
    });
  });

  // Get clean text content (limited to avoid token overload)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

  return { bodyText, meta, images: images.slice(0, 10), jsonLd, url };
}

/**
 * Use OpenAI GPT-4o-mini to extract product details from page content
 */
async function extractProductDetails(pageData) {
  const prompt = `You are a product data extraction agent. Given the following web page content, extract product details in JSON format.

Page URL: ${pageData.url}
Page Title: ${pageData.meta.title}
Meta Description: ${pageData.meta.description}
OG Title: ${pageData.meta.ogTitle}
OG Description: ${pageData.meta.ogDescription}
OG Image: ${pageData.meta.ogImage}

JSON-LD data: ${JSON.stringify(pageData.jsonLd).slice(0, 2000)}

Images found: ${JSON.stringify(pageData.images.slice(0, 5))}

Page text content:
${pageData.bodyText}

Extract the following fields. If a field is not found, use null:
- name: Product name
- description: Short product description (max 200 chars)
- price: Price as a number (without currency symbol)
- currency: Currency code (EUR, USD, GBP, etc.)
- imageUrls: Array of product image URLs (up to 5)
- category: Product category if identifiable
- brand: Brand name if identifiable
- specs: Key specifications as key-value pairs object

Return ONLY valid JSON, no markdown or extra text.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

function isLikelyPlaceholderImage(url) {
  const lowered = url.toLowerCase();
  return (
    lowered.includes('1x1') ||
    lowered.includes('pixel') ||
    lowered.includes('transparent') ||
    lowered.includes('blank') ||
    lowered.includes('placeholder') ||
    lowered.includes('spacer') ||
    lowered.includes('sprite') ||
    lowered.includes('noimage') ||
    lowered.includes('no-img') ||
    lowered.includes('no_image') ||
    lowered.includes('nav-sprite') ||
    lowered.includes('loading')
  );
}

function sanitizeImageUrls(imageUrls, ogImage, fallbackUrls = []) {
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  const fallback = Array.isArray(fallbackUrls) ? fallbackUrls : [];
  const normalized = urls
    .concat(fallback)
    .map(normalizeImageUrl)
    .filter(Boolean)
    .filter((url) => !isLikelyPlaceholderImage(url));

  const ogNormalized = normalizeImageUrl(ogImage);
  if (ogNormalized && !isLikelyPlaceholderImage(ogNormalized)) {
    const existingIndex = normalized.indexOf(ogNormalized);
    if (existingIndex >= 0) {
      normalized.splice(existingIndex, 1);
    }
    normalized.unshift(ogNormalized);
  }

  return normalized.slice(0, 5);
}

/**
 * Main scraping function: fetch URL, extract product details using AI
 * @param {string} url - The product page URL to scrape
 * @returns {object} Extracted product details
 */
export async function scrapeProduct(url) {
  try {
    console.info('Scraping URL:', url);
    let productDetails;

    if (BRIGHTDATA_API_KEY) {
      // Use Bright Data for better scraping
      try {
        if (isAmazonUrl(url)) {
          productDetails = await scrapeWithBrightDataAmazon(url);
        } else {
          productDetails = await scrapeWithBrightDataGeneral(url);
        }
      } catch (bdError) {
        console.warn('Bright Data scraping failed, falling back to basic scraper:', bdError.message);
        // Fall back to basic scraping
        const pageData = await fetchAndClean(url);
        productDetails = await extractProductDetails(pageData);
        productDetails.imageUrls = sanitizeImageUrls(
          productDetails.imageUrls,
          pageData.meta.ogImage,
          pageData.images.map((image) => image.src)
        );
      }
    } else {
      // No Bright Data key — use basic Cheerio + OpenAI scraping
      const pageData = await fetchAndClean(url);
      productDetails = await extractProductDetails(pageData);
      productDetails.imageUrls = sanitizeImageUrls(
        productDetails.imageUrls,
        pageData.meta.ogImage,
        pageData.images.map((image) => image.src)
      );
    }

    console.info('Scraping extracted fields:', {
      url,
      hasName: Boolean(productDetails.name),
      hasDescription: Boolean(productDetails.description),
      imageCount: productDetails.imageUrls?.length || 0,
      hasPrice: typeof productDetails.price === 'number',
      category: productDetails.category || null,
      brand: productDetails.brand || null,
    });
    return {
      success: true,
      data: productDetails,
      source: url,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Scraping error:', error.message);
    return {
      success: false,
      error: error.message,
      source: url,
      scrapedAt: new Date().toISOString(),
    };
  }
}
