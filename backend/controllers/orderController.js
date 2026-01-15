import prisma from "../config/prisma.js";

export const createOrder = async (req, res) => {
  try {
    const { items, total_amount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (total_amount == null || total_amount < 0) {
      return res.status(400).json({ message: "Valid total amount is required" });
    }

    // Set estimated delivery to 5 days from now
    const estimated_delivery = new Date();
    estimated_delivery.setDate(estimated_delivery.getDate() + 5);

    console.log("Creating order for User ID:", req.user.userId);

    // Verify user exists first
    const userExists = await prisma.user.findUnique({
      where: { user_id: req.user.userId },
    });
    
    const pref = await prisma.preference.findUnique({
      where: { user_id: req.user.userId },
    });

    if (!userExists) {
        return res.status(404).json({ message: "User not found. Please log out and log in again." });
    }

    const order = await prisma.order.create({
      data: {
        user_id: req.user.userId,
        items, // items is JSON
        total_amount: parseFloat(total_amount),
        status: "ORDER_CONFIRMED",
        estimated_delivery,
      },
    });

    const now = new Date();
    const logData = [];
    if (pref?.order_updates_push) {
      logData.push({ user_id: req.user.userId, order_id: order.id, status: "ORDER_CONFIRMED", sent_at: now, channel: "push" });
    }
    if (pref?.order_updates_email) {
      logData.push({ user_id: req.user.userId, order_id: order.id, status: "ORDER_CONFIRMED", sent_at: now, channel: "email" });
    }
    if (pref?.order_updates_sms) {
      logData.push({ user_id: req.user.userId, order_id: order.id, status: "ORDER_CONFIRMED", sent_at: now, channel: "sms" });
    }
    if (logData.length > 0) {
      await prisma.notificationLog.createMany({ data: logData });
    }
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "all").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = {
      AND: [],
    };

    if (status && status !== "all") {
      where.AND.push({ status });
    }

    if (from) {
      const d = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ created_at: { gte: d } });
    }

    if (to) {
      const d = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ created_at: { lte: d } });
    }

    if (q) {
      where.AND.push({
        OR: [
          { id: { contains: q } },
          { user: { name: { contains: q } } },
          { user: { email: { contains: q } } },
        ]
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const total = await prisma.order.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.order.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
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

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["ORDER_CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const order = await prisma.order.findUnique({ where: { id }});
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    const pref = await prisma.preference.findUnique({
        where: { user_id: order.user_id },
    })
    
    const updated = await prisma.order.update({
        where: { id },
        data: { status }
    });

    const now = new Date();
    const logData = [];
    if (pref?.order_updates_push) {
      logData.push({ user_id: order.user_id, order_id: id, status, sent_at: now, channel: "push" });
    }
    if (pref?.order_updates_email) {
      logData.push({ user_id: order.user_id, order_id: id, status, sent_at: now, channel: "email" });
    }
    if (pref?.order_updates_sms) {
      logData.push({ user_id: order.user_id, order_id: id, status, sent_at: now, channel: "sms" });
    }
    if (logData.length > 0) {
      await prisma.notificationLog.createMany({ data: logData });
    }
    
    res.json(updated);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "all").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = {
      user_id: req.user.userId,
      AND: [],
    };

    if (status && status !== "all") {
      where.AND.push({ status });
    }

    if (from) {
      const d = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ created_at: { gte: d } });
    }

    if (to) {
      const d = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) where.AND.push({ created_at: { lte: d } });
    }

    if (q) {
      where.AND.push({
        id: { contains: q },
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const total = await prisma.order.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.order.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
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
