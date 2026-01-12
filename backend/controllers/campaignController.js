import prisma from "../config/prisma.js";

const normalizeCityFilters = (value) => {
  if (value == null) return null;

  // Accept array, JSON string, or comma-separated string.
  let raw = value;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "") return [];
    try {
      raw = JSON.parse(trimmed);
    } catch {
      raw = trimmed.split(",");
    }
  }

  if (!Array.isArray(raw)) {
    throw new Error("city_filters must be an array of city names");
  }

  const normalized = raw
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter((c) => c.length > 0);

  // Remove duplicates (case-insensitive) while preserving the first spelling.
  const seen = new Set();
  const deduped = [];
  for (const city of normalized) {
    const key = city.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(city);
    }
  }
  return deduped;
};

// CREATE CAMPAIGN
export const createCampaign = async (req, res) => {
  try {
    const { campaign_name, notification_type, campaign_message, image_url } = req.body;
    let city_filters = null;
    try {
      city_filters = normalizeCityFilters(req.body.city_filters);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
    if(campaign_name  == null || campaign_name.trim() === "" ){
        return res.status(400).json({ message: "Campaign name is required" });
    }
    if( notification_type !== "offers"  && notification_type !== "order_updates" && notification_type !== "newsletter" ){    
        return res.status(400).json({ message: "Invalid notification type" });
    }
    if(!campaign_message || campaign_message.trim() === "" ){
        return  res.status(400).json({ message: "Campaign message is required" });
    }

    if (image_url != null && typeof image_url !== "string") {
      return res.status(400).json({ message: "image_url must be a string" });
    }

    console.log(req.body);
    const campaign = await prisma.campaign.create({
      data: {
        campaign_name,
        notification_type,
        city_filters: city_filters && city_filters.length > 0 ? city_filters : null,
        image_url: image_url && image_url.trim() !== "" ? image_url.trim() : null,
        status: "draft",
        created_by: req.user.userId,
        campaign_message,
      },
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
      },
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL CAMPAIGNS
export const getCampaigns = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "all").trim();
    const status = String(req.query.status || "all").trim();
    const city = String(req.query.city || "").trim();
    const creator = String(req.query.creator || "").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = { AND: [] };

    // Creator role only sees their campaigns.
    if (req.user?.role === "creator") {
      where.AND.push({ created_by: req.user.userId });
    }

    if (q) {
      where.AND.push({
        OR: [
          { campaign_name: { contains: q } },
          { campaign_message: { contains: q } },
        ],
      });
    }

    if (type && type !== "all") {
      where.AND.push({ notification_type: type });
    }

    if (status && status !== "all") {
      where.AND.push({ status });
    }

    // City filter: show campaigns that target ALL cities (null) or explicitly contain that city.
    if (city) {
      where.AND.push({
        OR: [
          { city_filters: { equals: null } },
          { city_filters: { array_contains: city } },
        ],
      });
    }

    if (creator) {
      where.AND.push({
        creator: {
          is: {
            OR: [
              { name: { contains: creator } },
              { email: { contains: creator } },
            ],
          },
        },
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const total = await prisma.campaign.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.campaign.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { campaign_id: "desc" }],
      skip,
      take: limit,
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
      },
    });

    res.json({
      items,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE CAMPAIGN (edit cities/image/message/name)
export const updateCampaign = async (req, res) => {
  try {
    const campaign_id = Number(req.params.campaignId);
    if (!Number.isFinite(campaign_id)) {
      return res.status(400).json({ message: "Invalid campaign id" });
    }

    const existing = await prisma.campaign.findUnique({
      where: { campaign_id },
      select: { status: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (existing.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft campaigns can be edited" });
    }

    const data = {};
    const { campaign_name, campaign_message, image_url } = req.body;

    if (campaign_name != null) {
      if (typeof campaign_name !== "string" || campaign_name.trim() === "") {
        return res.status(400).json({ message: "Campaign name must be a non-empty string" });
      }
      data.campaign_name = campaign_name.trim();
    }

    if (campaign_message != null) {
      if (typeof campaign_message !== "string" || campaign_message.trim() === "") {
        return res.status(400).json({ message: "Campaign message must be a non-empty string" });
      }
      data.campaign_message = campaign_message;
    }

    if (image_url != null) {
      if (typeof image_url !== "string") {
        return res.status(400).json({ message: "image_url must be a string" });
      }
      data.image_url = image_url.trim() === "" ? null : image_url.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "city_filters")) {
      let city_filters = null;
      try {
        city_filters = normalizeCityFilters(req.body.city_filters);
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
      data.city_filters = city_filters && city_filters.length > 0 ? city_filters : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const updated = await prisma.campaign.update({
      where: { campaign_id },
      data,
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEND CAMPAIGN
export const sendCampaign = async (req, res) => {
  try {
    const { campaign_id } = req.body;

    const campaign = await prisma.campaign.findUnique({
      where: { campaign_id },
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const cityFilters = Array.isArray(campaign.city_filters) ? campaign.city_filters : [];
    const hasCityFilters = cityFilters.length > 0;

    const users = await prisma.user.findMany({
      where: {
        is_active: true,
        ...(hasCityFilters ? { city: { in: cityFilters } } : {}),
        preference: {
          [campaign.notification_type]: true,
        },
      },
    });
      
    if (users.length === 0) {
      return res.json({ message: "No eligible users found", recipients: 0 });
    }

    await prisma.$transaction([
      ...users.map((user) =>
        prisma.notificationLog.create({
          data: {
            user_id: user.user_id,
            campaign_id: campaign.campaign_id,
            status: "success",
            sent_at: new Date(),
          },
        })
      ),
      prisma.campaign.update({
        where: { campaign_id },
        data: { status: "sent" },
      }),
    ]);

    res.json({
      message: "Campaign sent successfully",
      recipients: users.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Campaign sending failed. No data was changed.",
      error: err.message,
    });
  }
};
