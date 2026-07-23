import { useLanguage } from '../context/LanguageContext';

import { useState } from 'react';
import { GIFT_PLACEHOLDER_IMAGE } from '../lib/images';

const GiftCard = ({ giftItem, isOwner, onReserve, onEdit, onDelete, onRescrape }) => {
  const [rescanning, setRescanning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { t, language } = useLanguage();
  const article = giftItem.article;
  const providers = article?.articleProviders || [];
  const providerImageUrl = providers.find((ap) => ap.imageUrl)?.imageUrl || null;
  const imageUrl =
    article?.imageUrls?.[0] || providerImageUrl || GIFT_PLACEHOLDER_IMAGE;
  const status = giftItem.status || 'available';
  const reservedByName = giftItem.reservedByName;
  const reservationType = giftItem.reservationType;

  const statusColors = {
    available: 'bg-green-500/20 text-green-200 border-green-400/30',
    reserved: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
    bought: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    donated: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
    paid: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  };

  const statusLabels = {
    available: t('giftCard.available'),
    reserved: t('giftCard.reserved'),
    bought: t('giftCard.bought'),
    donated: t('giftCard.donated'),
    paid: t('giftCard.paid'),
  };

  const reservationTypeLabels = {
    buy: t('giftCard.buying'),
    donate: t('giftCard.donating'),
    pay: t('giftCard.paying'),
  };

  const isReserved = status !== 'available';
  const opacityClass = isReserved && !isOwner ? 'opacity-60' : '';

  // Calculate price range
  const prices = providers
    .filter((ap) => ap.price)
    .map((ap) => ap.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const priceRange =
    minPrice && maxPrice
      ? minPrice === maxPrice
        ? `€${minPrice.toFixed(2)}`
        : `€${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`
      : null;

  // Filter providers by providerIds if specified
  const displayProviders = giftItem.providerIds?.length
    ? providers.filter((ap) => giftItem.providerIds.includes(ap.provider?.id))
    : providers;

  const hasScrapedData =
    (article?.imageUrls?.length || 0) > 0 ||
    Boolean(article?.category) ||
    providers.some((ap) => ap.lastScraped || ap.details || ap.price || ap.imageUrl);

  const isScraping = providers.some((ap) => ap.buyUrl && !ap.lastScraped);

  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 transition-all hover:bg-white/15 ${opacityClass}`}
    >
      {/* Clickable area */}
      <div className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* Image */}
        <div className="aspect-square w-full rounded-lg overflow-hidden mb-3 bg-white/5">
          <img
            src={imageUrl}
            alt={article?.name || t('giftCard.gift')}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = GIFT_PLACEHOLDER_IMAGE;
            }}
          />
        </div>

        {/* Name */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white font-semibold text-lg line-clamp-2">
            {article?.name || 'Unknown Product'}
          </h3>
        <div className="flex items-center gap-1">
          {isScraping && (
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/70 bg-white/10 border border-white/20 px-2 py-1 rounded-full"
              title="Scraping in progress"
            >
              <span className="h-3 w-3 border border-white/60 border-t-transparent rounded-full animate-spin" />
              {t('giftCard.scrapingLabel')}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${
              hasScrapedData
                ? 'text-emerald-100 bg-emerald-500/20 border-emerald-400/30'
                : 'text-white/70 bg-white/10 border-white/20'
            }`}
            title={hasScrapedData ? 'Data enriched by scraping' : 'User provided only'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasScrapedData ? 'bg-emerald-300' : 'bg-white/60'
              }`}
            />
            {hasScrapedData ? t('giftCard.scraped') : t('giftCard.user')}
          </span>
        </div>
      </div>

      {/* Price Range */}
      {priceRange && (
        <div className="text-white/80 text-sm mb-2">{priceRange}</div>
      )}

      {/* Accept Similar Badge */}
      {giftItem.acceptSimilar && (
        <div className="inline-block bg-white/10 text-white/80 text-xs px-2 py-1 rounded mb-2">
          {t('giftCard.acceptSimilar')}
        </div>
      )}

      {/* Status Badge */}
      <div
        className={`inline-block px-2 py-1 rounded text-xs font-medium border mb-2 ${statusColors[status] || statusColors.available}`}
      >
        {statusLabels[status]}
      </div>
      </div>{/* end clickable area */}

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          {/* Description */}
          {article?.description && (
            <p className="text-white/80 text-sm leading-relaxed">{article.description}</p>
          )}

          {/* Brand & Category */}
          <div className="flex flex-wrap gap-2">
            {article?.brand && (
              <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded">
                {t('gifts.brand')}: {article.brand}
              </span>
            )}
            {article?.category && (
              <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded">
                {t('gifts.category')}: {article.category}
              </span>
            )}
          </div>

          {/* All Images */}
          {article?.imageUrls?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {article.imageUrls.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${article.name} ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover flex-shrink-0 border border-white/20"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          )}

          {/* Provider Links */}
          {displayProviders.length > 0 && (
            <div className="space-y-2">
              {displayProviders.map((ap) => (
                <a
                  key={ap.provider?.id || ap.providerId}
                  href={ap.buyUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    {ap.provider?.logoUrl ? (
                      <img src={ap.provider.logoUrl} alt={ap.provider.name} className="h-5 w-auto" />
                    ) : (
                      <span className="text-white font-medium text-sm">{ap.provider?.name || 'Store'}</span>
                    )}
                    {ap.price && (
                      <span className="text-white/80 text-sm font-semibold">€{ap.price.toFixed(2)}</span>
                    )}
                  </div>
                  {ap.buyUrl && (
                    <svg className="w-4 h-4 text-white/50 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reserved Info */}

      {/* Provider Logos */}
      {displayProviders.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {displayProviders.slice(0, 3).map((ap) => {
            const providerIsScraping = ap.buyUrl && !ap.lastScraped;
            return (
            <div
              key={ap.provider?.id || ap.providerId}
              className="flex items-center gap-1 bg-white/10 rounded px-2 py-1"
            >
              {ap.provider?.logoUrl ? (
                <img
                  src={ap.provider.logoUrl}
                  alt={ap.provider.name}
                  className="h-4 w-auto"
                />
              ) : (
                <span className="text-white/60 text-xs">{ap.provider?.name}</span>
              )}
              {providerIsScraping && (
                <span
                  className="h-3 w-3 border border-white/60 border-t-transparent rounded-full animate-spin"
                  title="Scraping provider data"
                />
              )}
            </div>
          );
          })}
          {displayProviders.length > 3 && (
            <div className="text-white/60 text-xs flex items-center">
              +{displayProviders.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        {!isOwner && status === 'available' && (
          <>
            <button
              onClick={() => onReserve && onReserve(giftItem)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              {t('giftCard.reserve')}
            </button>
          </>
        )}
        {isOwner && (
          <>
            {onRescrape && (
              <button
                onClick={async () => {
                  setRescanning(true);
                  try { await onRescrape(giftItem); } finally { setRescanning(false); }
                }}
                disabled={rescanning}
                className="flex-1 bg-emerald-500/50 hover:bg-emerald-500/70 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
              >
                {rescanning ? t('gifts.rescanning') : t('gifts.rescan')}
              </button>
            )}
            <button
              onClick={() => onEdit && onEdit(giftItem)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              {t('common.edit')}
            </button>
            <button
              onClick={() => onDelete && onDelete(giftItem)}
              className="flex-1 bg-red-500/50 hover:bg-red-500/70 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              {t('common.delete')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GiftCard;
