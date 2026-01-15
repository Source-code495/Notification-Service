import prisma from "../config/prisma.js";

const toOptionalBoolean = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  throw new Error(`${fieldName} must be a boolean`);
};

const hasAny = (obj, keys) => keys.some((k) => Object.prototype.hasOwnProperty.call(obj, k));

// GET USER PREFERENCES
export const getPreferences = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const prefs = await prisma.preference.findUnique({
      where: { user_id: userId },
    });
    
    if (!prefs) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE / CREATE PREFERENCES
export const updatePreferences = async (req, res) => {
  const userId = req.params.userId;
  const body = req.body || {};

  // console.log(req.user.userId, userId);
  
  if(req.user.userId !== userId){
    return  res.status(403).json({ message: "Forbidden" });
  }

  try {
    const existing = await prisma.preference.findUnique({
      where: { user_id: userId },
    });
    const channelKeys = [
      "offers_sms",
      "offers_email",
      "offers_push",
      "order_updates_sms",
      "order_updates_email",
      "order_updates_push",
      "newsletter_sms",
      "newsletter_email",
      "newsletter_push",
    ];

    const legacyKeys = ["offers", "order_updates", "newsletter"];

    const hasChannelFields = hasAny(body, channelKeys);
    const hasLegacyFields = hasAny(body, legacyKeys);

    if (!hasChannelFields && !hasLegacyFields && !existing) {
      return res.status(400).json({ message: "No preference fields provided" });
    }

    // If caller sends legacy booleans only (old UI), map them to all channels.
    // This keeps the old "on/off" semantics: ON => sms/email/push all enabled.
    const legacyOffers = toOptionalBoolean(body.offers, "offers");
    const legacyOrderUpdates = toOptionalBoolean(body.order_updates, "order_updates");
    const legacyNewsletter = toOptionalBoolean(body.newsletter, "newsletter");

    const expandLegacy = (legacyValue) => {
      if (legacyValue === undefined) return undefined;
      return {
        sms: legacyValue,
        email: legacyValue,
        push: legacyValue,
      };
    };

    const legacyOffersExpanded = !hasChannelFields ? expandLegacy(legacyOffers) : undefined;
    const legacyOrderUpdatesExpanded = !hasChannelFields ? expandLegacy(legacyOrderUpdates) : undefined;
    const legacyNewsletterExpanded = !hasChannelFields ? expandLegacy(legacyNewsletter) : undefined;

    const pickNext = (fieldName, fallback, expandedLegacy, legacyKey) => {
      // If channel-specific field is provided explicitly, use it.
      const direct = toOptionalBoolean(body[fieldName], fieldName);
      if (direct !== undefined) return direct;
      // If legacy booleans are being used, expand them into channel fields.
      if (expandedLegacy && Object.prototype.hasOwnProperty.call(expandedLegacy, legacyKey)) {
        return expandedLegacy[legacyKey];
      }
      return fallback;
    };

    const offers_sms = pickNext(
      "offers_sms",
      existing?.offers_sms ?? false,
      legacyOffersExpanded,
      "sms"
    );
    const offers_email = pickNext(
      "offers_email",
      existing?.offers_email ?? false,
      legacyOffersExpanded,
      "email"
    );
    const offers_push = pickNext(
      "offers_push",
      existing?.offers_push ?? false,
      legacyOffersExpanded,
      "push"
    );

    const order_updates_sms = pickNext(
      "order_updates_sms",
      existing?.order_updates_sms ?? false,
      legacyOrderUpdatesExpanded,
      "sms"
    );
    const order_updates_email = pickNext(
      "order_updates_email",
      existing?.order_updates_email ?? false,
      legacyOrderUpdatesExpanded,
      "email"
    );
    const order_updates_push = pickNext(
      "order_updates_push",
      existing?.order_updates_push ?? false,
      legacyOrderUpdatesExpanded,
      "push"
    );

    const newsletter_sms = pickNext(
      "newsletter_sms",
      existing?.newsletter_sms ?? false,
      legacyNewsletterExpanded,
      "sms"
    );
    const newsletter_email = pickNext(
      "newsletter_email",
      existing?.newsletter_email ?? false,
      legacyNewsletterExpanded,
      "email"
    );
    const newsletter_push = pickNext(
      "newsletter_push",
      existing?.newsletter_push ?? false,
      legacyNewsletterExpanded,
      "push"
    );

    const offers = Boolean(offers_sms || offers_email || offers_push);
    const order_updates = Boolean(order_updates_sms || order_updates_email || order_updates_push);
    const newsletter = Boolean(newsletter_sms || newsletter_email || newsletter_push);

    const data = {
      offers,
      order_updates,
      newsletter,
      offers_sms,
      offers_email,
      offers_push,
      order_updates_sms,
      order_updates_email,
      order_updates_push,
      newsletter_sms,
      newsletter_email,
      newsletter_push,
    };

    const prefs = existing
      ? await prisma.preference.update({ where: { user_id: userId }, data })
      : await prisma.preference.create({ data: { user_id: userId, ...data } });

    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
