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

    // Creator: show their campaign logs + their newsletter logs + all order-update logs.
    if (req.user?.role === "creator") {
      where.AND.push({
        OR: [
          { campaign: { is: { created_by: req.user.userId } } },
          { newsletterArticle: { is: { created_by: req.user.userId } } },
          { order_id: { not: null } },
        ],
      });
    }

    if (status && status !== "all") {
      where.AND.push({ status });
    }

    if (type && type !== "all") {
      if (type === "order_updates") {
        // Order updates are represented by logs linked to an Order.
        where.AND.push({ order_id: { not: null } });
      } else if (type === "newsletter") {
        where.AND.push({ newsletter_article_id: { not: null } });
      } else {
        // Campaign notifications (offers only)
        where.AND.push({ campaign: { is: { notification_type: type } } });
      }
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
          { newsletterArticle: { is: { title: { contains: q } } } },
          { order: { is: { id: { contains: q } } } },
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
        newsletterArticle: {
          select: {
            article_id: true,
            title: true,
            status: true,
            newsletter: {
              select: {
                newsletter_id: true,
                title: true,
              },
            },
          },
        },
        order: {
            select: {
                id: true,
                status: true
            }
        }
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

    const pref = await prisma.preference.findUnique({
      where: { user_id: req.user.userId },
      select: {
        offers_push: true,
        order_updates_push: true,
        newsletter_push: true,
      },
    });

    // // If preferences are missing or push isn't enabled for any type, user sees no notifications.
    // if (!pref) {
    //   return res.json({
    //     items: [],
    //     meta: {
    //       page: 1,
    //       limit,
    //       total: 0,
    //       totalPages: 1,
    //       hasPrev: false,
    //       hasNext: false,
    //     },
    //   });
    // }

    // 1. Get user's order IDs properly
    const orders = await prisma.order.findMany({
      where: { user_id: req.user.userId },
      select: { id: true },
    });

    const userOrderIds = orders.map(order => order.id);

    // 2. Base WHERE condition
    const where = {
      AND: [
        {
          OR: [
            { user_id: req.user.userId },
            { order_id: { in: userOrderIds } },
          ],
        },
        { channel: "push" },
      ],
    };

    // 3. Type filter + push permission
    const allowOffers = true
    const allowOrders = true;
    const allowNews = true;

    const typeOr = [];
    const wantsAll = !type || type === "all";

    if ((wantsAll && allowOffers) || type === "offers") {
      if (!allowOffers && !wantsAll) {
        return res.json({ items: [], meta: { page: 1, limit, total: 0, totalPages: 1, hasPrev: false, hasNext: false } });
      }
      typeOr.push({ campaign: { is: { notification_type: "offers" } } });
    }

    if ((wantsAll && allowOrders) || type === "order_updates") {
      if (!allowOrders && !wantsAll) {
        return res.json({ items: [], meta: { page: 1, limit, total: 0, totalPages: 1, hasPrev: false, hasNext: false } });
      }
      typeOr.push({ order_id: { not: null } });
    }

    if ((wantsAll && allowNews) || type === "newsletter") {
      if (!allowNews && !wantsAll) {
        return res.json({ items: [], meta: { page: 1, limit, total: 0, totalPages: 1, hasPrev: false, hasNext: false } });
      }
      typeOr.push({ newsletter_article_id: { not: null } });
    }

    if (typeOr.length === 0) {
      return res.json({ items: [], meta: { page: 1, limit, total: 0, totalPages: 1, hasPrev: false, hasNext: false } });
    }

    where.AND.push({ OR: typeOr });

    // 4. Date filters
    if (from) {
      const d = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) {
        where.AND.push({ sent_at: { gte: d } });
      }
    }

    if (to) {
      const d = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) {
        where.AND.push({ sent_at: { lte: d } });
      }
    }

    // 5. Search filter
    if (q) {
      where.AND.push({
        OR: [
          {
            newsletterArticle: {
              is: {
                OR: [{ title: { contains: q } }, { message: { contains: q } }],
              },
            },
          },
          {
            campaign: {
              is: {
                OR: [
                  { campaign_name: { contains: q } },
                  { campaign_message: { contains: q } },
                ],
              },
            },
          },
          {
            order: {
              is: { id: { contains: q } },
            },
          },
        ],
      });
    }

    // 6. Pagination
    const total = await prisma.notificationLog.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    // 7. Fetch data
    const items = await prisma.notificationLog.findMany({
      where,
      orderBy: { sent_at: "desc" },
      skip,
      take: limit,
      include: {
        newsletterArticle: {
          select: {
            article_id: true,
            title: true,
            message: true,
            status: true,
            newsletter: {
              select: {
                newsletter_id: true,
                title: true,
              },
            },
          },
        },
        campaign: {
          select: {
            campaign_id: true,
            campaign_name: true,
            notification_type: true,
            campaign_message: true,
            image_url: true,
            status: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total_amount: true,
          },
        },
      },
    });
    // NOTE: Preferences are respected at send-time; notifications list shows actual log rows.
    // const filteredItems = [];
    // for(const item of items){
    //     if(item.campaign){
    //         const notifType = item.campaign.notification_type;
    //         if((notifType === "offers" && pref?.offers) ||
    //            (notifType === "newsletter" && pref?.newsletter)){
    //             filteredItems.push(item);
    //         }
    //     }
    //     else if(item.order_id){
    //         if(pref?.order_updates){
    //             filteredItems.push(item);
    //         }
    //     }
    // }

    // 8. Response
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
    console.error(err);
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
      where: { user_id: userId, status: "success", campaign: { is: { notification_type: "offers" } },channel: "push" },
      }),
      prisma.notificationLog.count({
      // count any order-update notifications regardless of the related order's status
      where: { user_id: userId,order_id: { not: null },channel: "push"},
      }),
      prisma.notificationLog.count({
      where: { user_id: userId, status: "success", newsletter_article_id: { not: null },channel: "push" },
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
