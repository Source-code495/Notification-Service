import prisma from "../config/prisma.js";

export const getLogs = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "all").trim();
    const type = String(req.query.type || "all").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = { AND: [] };

    // Creator only sees logs for their campaigns.
    if (req.user?.role === "creator") {
      where.AND.push({ campaign: { is: { created_by: req.user.userId } } });
    }

    if (status && status !== "all") {
      where.AND.push({ status });
    }

    if (type && type !== "all") {
      where.AND.push({ campaign: { is: { notification_type: type } } });
    }

    if (from) {
      const d = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ sent_at: { gte: d } });
    }

    if (to) {
      const d = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ sent_at: { lte: d } });
    }

    if (q) {
      where.AND.push({
        OR: [
          { user: { is: { name: { contains: q } } } },
          { user: { is: { email: { contains: q } } } },
          { campaign: { is: { campaign_name: { contains: q } } } },
        ],
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const total = await prisma.notificationLog.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.notificationLog.findMany({
      where,
      orderBy: { sent_at: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
            city: true,
          },
        },
        campaign: {
          select: {
            campaign_id: true,
            campaign_name: true,
            notification_type: true,
            status: true,
          },
        },
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

export const getMyNotifications = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "all").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = {
      AND: [
        { user_id: req.user.userId },
        { status: "success" }
      ]
    };

    if (type && type !== "all") {
      where.AND.push({ campaign: { is: { notification_type: type } } });
    }

    if (from) {
      const d = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ sent_at: { gte: d } });
    }

    if (to) {
      const d = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ sent_at: { lte: d } });
    }

    if (q) {
      where.AND.push({
        campaign: {
          is: {
             OR: [
               { campaign_name: { contains: q } },
               { campaign_message: { contains: q } }
             ]
          }
        }
      });
    }

    const total = await prisma.notificationLog.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.notificationLog.findMany({
      where,
      orderBy: { sent_at: "desc" },
      skip,
      take: limit,
      include: {
        campaign: {
          select: {
            campaign_id: true,
            campaign_name: true,
            notification_type: true,
            campaign_message: true,
            image_url: true,
          },
        },
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

export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const total = await prisma.notificationLog.count({
      where: { user_id: userId, status: "success" },
    });

    const [offers, orders, news] = await Promise.all([
      prisma.notificationLog.count({
        where: { user_id: userId, status: "success", campaign: { notification_type: "offers" } },
      }),
      prisma.notificationLog.count({
        where: { user_id: userId, status: "success", campaign: { notification_type: "order_updates" } },
      }),
      prisma.notificationLog.count({
        where: { user_id: userId, status: "success", campaign: { notification_type: "newsletter" } },
      }),
    ]);

    res.json({
      total,
      breakdown: {
        offers,
        order_updates: orders,
        newsletter: news,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
