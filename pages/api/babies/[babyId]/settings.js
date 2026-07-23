import prisma from '../../../../lib/prisma';
import slugify from 'slugify';
import { requireOwner } from '../../../../lib/apiAuth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { babyId } = req.query;

  const owner = await requireOwner(req, res, babyId);
  if (!owner) return;
  const {
    name,
    dueDate,
    customSlug,
    country,
    giftRegistryEnabled,
    pregnancyTrackerEnabled,
    birthBettingEnabled,
    giftRegistrySettings,
    pregnancyTrackerPublic,
    pregnancyTrackerSettings,
    pregnancyStartDate,
    bettingSettings,
    paymentConfigs, // Array of { featureType, methods }
  } = req.body;

  try {
    // Validate slug uniqueness if changed
    if (customSlug) {
      const slug = slugify(customSlug, { lower: true, strict: true });
      const existing = await prisma.baby.findFirst({
        where: { customSlug: slug, NOT: { id: babyId } },
      });
      if (existing) {
        return res.status(409).json({ error: 'This URL slug is already taken.' });
      }
    }

    // Build update data (only include provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (customSlug !== undefined) updateData.customSlug = slugify(customSlug, { lower: true, strict: true });
    if (country !== undefined) updateData.country = country;
    if (giftRegistryEnabled !== undefined) updateData.giftRegistryEnabled = giftRegistryEnabled;
    if (pregnancyTrackerEnabled !== undefined) updateData.pregnancyTrackerEnabled = pregnancyTrackerEnabled;
    if (birthBettingEnabled !== undefined) updateData.birthBettingEnabled = birthBettingEnabled;
    if (giftRegistrySettings !== undefined) updateData.giftRegistrySettings = giftRegistrySettings;
    if (pregnancyTrackerPublic !== undefined) updateData.pregnancyTrackerPublic = pregnancyTrackerPublic;
    if (pregnancyTrackerSettings !== undefined) updateData.pregnancyTrackerSettings = pregnancyTrackerSettings;
    if (pregnancyStartDate !== undefined) updateData.pregnancyStartDate = pregnancyStartDate ? new Date(pregnancyStartDate) : null;
    if (bettingSettings !== undefined) updateData.bettingSettings = bettingSettings;

    const baby = await prisma.$transaction(async (tx) => {
      const updated = await tx.baby.update({
        where: { id: babyId },
        data: updateData,
      });

      // Update payment configs if provided
      if (paymentConfigs && Array.isArray(paymentConfigs)) {
        for (const config of paymentConfigs) {
          await tx.paymentConfig.upsert({
            where: {
              babyId_featureType: {
                babyId,
                featureType: config.featureType,
              },
            },
            update: { methods: config.methods },
            create: {
              babyId,
              featureType: config.featureType,
              methods: config.methods,
            },
          });
        }
      }

      return updated;
    });

    const fullBaby = await prisma.baby.findUnique({
      where: { id: babyId },
      include: {
        owners: { include: { user: true } },
        paymentConfigs: true,
      },
    });

    res.status(200).json(fullBaby);
  } catch (error) {
    console.error('Error updating baby settings:', error.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}
