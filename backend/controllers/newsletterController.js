import prisma from "../config/prisma.js";

// ============ NEWSLETTER CATEGORIES ============

export const createCategory = async (req, res) => {
  try {
    const { title, short_description, cover_image_url } = req.body;

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!short_description || String(short_description).trim() === "") {
      return res.status(400).json({ message: "Short description is required" });
    }

    const category = await prisma.newsletterCategory.create({
      data: {
        title: String(title).trim(),
        short_description: String(short_description).trim(),
        cover_image_url: cover_image_url && String(cover_image_url).trim() !== "" ? String(cover_image_url).trim() : null,
        created_by: req.user.userId,
      },
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
      },
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const creator = String(req.query.creator || "").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = { AND: [] };

    if (q) {
      where.AND.push({
        OR: [
          { title: { contains: q } },
          { short_description: { contains: q } },
        ],
      });
    }

    if (creator) {
      where.AND.push({
        creator: {
          is: {
            OR: [{ name: { contains: creator } }, { email: { contains: creator } }],
          },
        },
      });
    }

    if (req.user?.role === "creator") {
      where.AND.push({ created_by: req.user.userId });
    }

    if (where.AND.length === 0) delete where.AND;

    const total = await prisma.newsletterCategory.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const include = {
      creator: { select: { user_id: true, name: true, email: true } },
      _count: { select: { articles: true } },
    };

    // If the current caller is a normal user, include subscription info
    // so the UI can show Subscribe/Unsubscribe state.
    if (req.user?.role === "user") {
      include.subscriptions = {
        where: { user_id: req.user.userId },
        select: { id: true, subscribed_at: true },
        take: 1,
      };
    }

    const rows = await prisma.newsletterCategory.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { newsletter_id: "desc" }],
      skip,
      take: limit,
      include,
    });

    const items = req.user?.role === "user"
      ? rows.map((c) => {
          const isSubscribed = (c.subscriptions?.length || 0) > 0;
          const subscribed_at = c.subscriptions?.[0]?.subscribed_at ?? null;
          // avoid leaking the join rows shape to the client
          // eslint-disable-next-line no-unused-vars
          const { subscriptions, ...rest } = c;
          return { ...rest, isSubscribed, subscribed_at };
        })
      : rows;

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

export const updateCategory = async (req, res) => {
  try {
    const newsletter_id = req.params.categoryId;

    const existing = await prisma.newsletterCategory.findUnique({
      where: { newsletter_id },
      select: { created_by: true },
    });

    if (!existing) return res.status(404).json({ message: "Category not found" });

    if (req.user?.role === "creator" && existing.created_by !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const data = {};
    const { title, short_description, cover_image_url } = req.body || {};

    if (title != null) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ message: "Title must be a non-empty string" });
      }
      data.title = title.trim();
    }

    if (short_description != null) {
      if (typeof short_description !== "string" || short_description.trim() === "") {
        return res.status(400).json({ message: "Short description must be a non-empty string" });
      }
      data.short_description = short_description.trim();
    }

    if (cover_image_url != null) {
      if (typeof cover_image_url !== "string") {
        return res.status(400).json({ message: "cover_image_url must be a string" });
      }
      data.cover_image_url = cover_image_url.trim() === "" ? null : cover_image_url.trim();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const updated = await prisma.newsletterCategory.update({
      where: { newsletter_id },
      data,
      include: { creator: { select: { user_id: true, name: true, email: true } } },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============ NEWSLETTER ARTICLES ============

export const createArticle = async (req, res) => {
  try {
    const newsletter_id = String(req.params.newsletter_id || req.body?.newsletter_id || "").trim();
    const { title, message } = req.body;

    if (!newsletter_id) {
      return res.status(400).json({ message: "Newsletter category ID is required" });
    }

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    const category = await prisma.newsletterCategory.findUnique({
      where: { newsletter_id },
      select: { created_by: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Newsletter category not found" });
    }

    if (req.user?.role === "creator" && category.created_by !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden: not the category creator" });
    }

    const article = await prisma.newsletterArticle.create({
      data: {
        newsletter_id,
        title: String(title).trim(),
        message: String(message),
        status: "draft",
        created_by: req.user.userId,
      },
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
        newsletter: { select: { newsletter_id: true, title: true } },
      },
    });

    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getArticles = async (req, res) => {
  try {
    const { newsletter_id } = req.params;
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    let status = String(req.query.status || "all").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const category = await prisma.newsletterCategory.findUnique({
      where: { newsletter_id },
      select: { newsletter_id: true, title: true, created_by: true },
    });
  
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if( req.user?.role === "creator" && category.created_by !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const where = { AND: [{ newsletter_id }] };

    if (q) {
      where.AND.push({ OR: [{ title: { contains: q } }, { message: { contains: q } }] });
    }

    if (status && status !== "all") {
      where.AND.push({ status });
    }

    // if   (req.user?.role === "creator") {
    //   where.AND.push({ created_by: req.user.userId });
    // }

    // Normal users should only see published articles.
    if (req.user?.role === "user") {
      where.AND.push({ status: "sent" });
      status = "sent";
    }

    const total = await prisma.newsletterArticle.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.newsletterArticle.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { article_id: "desc" }],
      skip,
      take: limit,
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
      },
    });

    res.json({
      category,
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

export const updateArticle = async (req, res) => {
  try {
    const { article_id } = req.params;

    const existing = await prisma.newsletterArticle.findUnique({
      where: { article_id },
      select: { status: true, created_by: true },
    });

    if (!existing) return res.status(404).json({ message: "Article not found" });

    if (req.user?.role === "creator" && existing.created_by !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (existing.status !== "draft") {
      return res.status(400).json({ message: "Only draft articles can be edited" });
    }

    const data = {};
    const { title, message } = req.body || {};

    if (title != null) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ message: "Title must be a non-empty string" });
      }
      data.title = title.trim();
    }

    if (message != null) {
      if (typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ message: "Message must be a non-empty string" });
      }
      data.message = message;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const updated = await prisma.newsletterArticle.update({
      where: { article_id },
      data,
      include: {
        creator: { select: { user_id: true, name: true, email: true } },
        newsletter: { select: { newsletter_id: true, title: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const publishArticle = async (req, res) => {
  try {
    const { article_id } = req.params;

    const article = await prisma.newsletterArticle.findUnique({
      where: { article_id },
      select: { article_id: true, status: true, created_by: true, newsletter_id: true },
    });

    if (!article) return res.status(404).json({ message: "Article not found" });

    if (req.user?.role === "creator" && article.created_by !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (article.status === "sent") {
      return res.status(400).json({ message: "Article already published" });
    }

    // Get users who have:
    // 1. Newsletter preference enabled (newsletter: true)
    // 2. Are subscribed to this specific newsletter
    // 3. Are active users
    const users = await prisma.user.findMany({
      where: {
        is_active: true,
        preference: {
          OR: [
            { newsletter_push: true },
            { newsletter_email: true },
            { newsletter_sms: true },
          ],
        },
        newsletterSubscriptions: {
          some: {
            newsletter_id: article.newsletter_id
          }
        }
      },
      select: {
        user_id: true,
        preference: {
          select: {
            newsletter_push: true,
            newsletter_email: true,
            newsletter_sms: true,
          },
        },
      },
    });

    if (users.length === 0) {
      return res.json({ message: "No eligible users found", recipients: 0 });
    }

    const now = new Date();
    const logData = [];
    for (const u of users) {
      const pref = u.preference;
      if (pref?.newsletter_push) {
        logData.push({
          user_id: u.user_id,
          newsletter_article_id: article.article_id,
          status: "success",
          sent_at: now,
          channel: "push",
        });
      }
      if (pref?.newsletter_email) {
        logData.push({
          user_id: u.user_id,
          newsletter_article_id: article.article_id,
          status: "success",
          sent_at: now,
          channel: "email",
        });
      }
      if (pref?.newsletter_sms) {
        logData.push({
          user_id: u.user_id,
          newsletter_article_id: article.article_id,
          status: "success",
          sent_at: now,
          channel: "sms",
        });
      }
    }

    if (logData.length === 0) {
      return res.json({ message: "No eligible users found", recipients: 0 });
    }

    await prisma.$transaction([
      prisma.notificationLog.createMany({ data: logData }),
      prisma.newsletterArticle.update({
        where: { article_id },
        data: { status: "sent", published_at: now },
      }),
    ]);

    res.json({ message: "Article published successfully", recipients: users.length });
  } catch (err) {
    res.status(500).json({ message: "Publishing failed", error: err.message });
  }
};

export const getArticleRecipients = async (req, res) => {
  try {
    const { article_id } = req.params;

    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const statusFilter = String(req.query.status || "all").trim();
    const city = String(req.query.city || "").trim();
    const role = String(req.query.role || "all").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const article = await prisma.newsletterArticle.findUnique({
      where: { article_id },
      select: {
        article_id: true,
        title: true,
        status: true,
        created_by: true,
        created_at: true,
        newsletter_id: true,
        newsletter: { select: { newsletter_id: true, title: true } },
      },
    });

    if (!article) return res.status(404).json({ message: "Article not found" });

    if (article.status === "sent") {
      const where = { AND: [{ newsletter_article_id: article_id }] };

      if (statusFilter && statusFilter !== "all") where.AND.push({ status: statusFilter });
      if (city) where.AND.push({ user: { is: { city: { contains: city } } } });
      if (role && role !== "all") where.AND.push({ user: { is: { role } } });
      if (q) {
        where.AND.push({
          OR: [
            { user: { is: { name: { contains: q } } } },
            { user: { is: { email: { contains: q } } } },
          ],
        });
      }

      const total = await prisma.notificationLog.count({ where });
      const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
      const safePage = Math.min(page, totalPages);
      const skip = (safePage - 1) * limit;

      const items = await prisma.notificationLog.findMany({
        where,
        orderBy: [{ sent_at: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true,
              city: true,
              role: true,
              is_active: true,
            },
          },
        },
      });

      return res.json({
        article,
        mode: "sent",
        items: items.map((l) => ({ id: l.id, user: l.user, status: l.status, sent_at: l.sent_at, channel: l.channel })),
        meta: {
          page: safePage,
          limit,
          total,
          totalPages,
          hasPrev: safePage > 1,
          hasNext: safePage < totalPages,
        },
      });
    }

    const where = {
      AND: [
        { is_active: true },
        {
          preference: {
            OR: [
              { newsletter_push: true },
              { newsletter_email: true },
              { newsletter_sms: true },
            ],
          },
        },
        {
          newsletterSubscriptions: {
            some: { newsletter_id: article.newsletter_id },
          },
        },
      ],
    };

    if (city) where.AND.push({ city: { contains: city } });
    if (role && role !== "all") where.AND.push({ role });
    if (q) where.AND.push({ OR: [{ name: { contains: q } }, { email: { contains: q } }] });

    const total = await prisma.user.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { user_id: "desc" }],
      skip,
      take: limit,
      select: {
        user_id: true,
        name: true,
        email: true,
        city: true,
        role: true,
        is_active: true,
        preference: {
          select: {
            newsletter_push: true,
            newsletter_email: true,
            newsletter_sms: true,
          },
        },
      },
    });

    res.json({
      article,
      mode: "draft",
      items: users.map((u) => ({
        user: {
          user_id: u.user_id,
          name: u.name,
          email: u.email,
          city: u.city,
          role: u.role,
          is_active: u.is_active,
        },
        status: "pending",
        sent_at: null,
        channels: [
          ...(u?.preference?.newsletter_push ? ["push"] : []),
          ...(u?.preference?.newsletter_email ? ["email"] : []),
          ...(u?.preference?.newsletter_sms ? ["sms"] : []),
        ],
      })),
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

// ============ USER SUBSCRIPTIONS ============

export const getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const items = await prisma.newsletterSubscription.findMany({
      where: { user_id: userId },
      orderBy: [{ subscribed_at: "desc" }, { id: "desc" }],
      include: {
        newsletter: {
          select: {
            newsletter_id: true,
            title: true,
            short_description: true,
            cover_image_url: true,
            created_at: true,
          },
        },
      },
    });

    res.json({
      items: items.map((s) => ({
        id: s.id,
        newsletter_id: s.newsletter_id,
        subscribed_at: s.subscribed_at,
        newsletter: s.newsletter,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const subscribeToCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const newsletter_id = String(req.params.newsletter_id || "").trim();

    if (!newsletter_id) return res.status(400).json({ message: "newsletter_id is required" });

    const exists = await prisma.newsletterCategory.findUnique({
      where: { newsletter_id },
      select: { newsletter_id: true },
    });

    if (!exists) return res.status(404).json({ message: "Newsletter category not found" });

    const subscription = await prisma.newsletterSubscription.upsert({
      where: { user_id_newsletter_id: { user_id: userId, newsletter_id } },
      create: { user_id: userId, newsletter_id },
      update: { subscribed_at: new Date() },
      select: { id: true, newsletter_id: true, subscribed_at: true },
    });

    res.status(201).json({ subscribed: true, ...subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unsubscribeFromCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const newsletter_id = String(req.params.newsletter_id || "").trim();

    if (!newsletter_id) return res.status(400).json({ message: "newsletter_id is required" });

    await prisma.newsletterSubscription.deleteMany({
      where: { user_id: userId, newsletter_id },
    });

    res.json({ subscribed: false, newsletter_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
