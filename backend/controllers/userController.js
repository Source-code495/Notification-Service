import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import fs from "fs";
import csv from "csv-parser";

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, city } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        city,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "all").trim();
    const city = String(req.query.city || "all").trim();
    const status = String(req.query.status || "all").trim();
    const preference = String(req.query.preference || "any").trim();

    const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(limitRaw || "10", 10) || 10));

    const where = { AND: [] };

    if (q) {
      where.AND.push({
        OR: [{ name: { contains: q } }, { email: { contains: q } }],
      });
    }

    if (role && role !== "all") {
      where.AND.push({ role });
    }

    if (city && city !== "all") {
      where.AND.push({ city });
    }

    if (status === "active") {
      where.AND.push({ is_active: true });
    } else if (status === "inactive") {
      where.AND.push({ is_active: false });
    }

    if (preference && preference !== "any") {
      const prefField =
        preference === "offers"
          ? "offers"
          : preference === "order_updates"
            ? "order_updates"
            : preference === "newsletter"
              ? "newsletter"
              : null;

      if (prefField) {
        where.AND.push({ preference: { is: { [prefField]: true } } });
      }
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const total = await prisma.user.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await prisma.user.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { user_id: "desc" }],
      skip,
      take: limit,
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        is_active: true,
        preference: {
          select: {
            offers: true,
            order_updates: true,
            newsletter: true,
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

// GET USER FILTER OPTIONS (roles + distinct cities)
export const getUserOptions = async (req, res) => {
  try {
    const citiesRaw = await prisma.user.findMany({
      distinct: ["city"],
      select: { city: true },
      where: { city: { not: null } },
    });

    const cities = citiesRaw
      .map((r) => (r.city || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json({
      roles: ["admin", "creator", "viewer", "user"],
      cities,
      statuses: ["all", "active", "inactive"],
      preferences: ["any", "offers", "order_updates", "newsletter"],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET CURRENT USER (ME)
export const getMe = async (req, res) => {
  try {
    const id = req.user?.userId;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const me = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!me) return res.status(404).json({ message: "User not found" });
    res.json(me);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE CURRENT USER (ME)
export const updateMe = async (req, res) => {
  try {
    const id = req.user?.userId;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const { name, phone, city } = req.body || {};
    const data = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }
      data.name = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = String(phone).trim();
      data.phone = trimmed ? trimmed : null;
    }

    if (city !== undefined) {
      const trimmed = String(city).trim();
      data.city = trimmed ? trimmed : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const updated = await prisma.user.update({
      where: { user_id: id },
      data,
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHANGE PASSWORD (ME)
export const changeMyPassword = async (req, res) => {
  try {
    const id = req.user?.userId;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required." });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: id },
      select: { password: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { user_id: id },
      data: { password: hashed },
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.user?.role === "user" && req.user?.userId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { city, is_active } = req.body || {};

    const data = {};

    if (city !== undefined) {
      data.city = city === "" ? null : city;
    }

    if (is_active !== undefined) {
      if (typeof is_active === "string") {
        data.is_active = is_active.toLowerCase() === "true";
      } else {
        data.is_active = !!is_active;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Only city/status can be updated." });
    }

    const updated = await prisma.user.update({
      where: { user_id: id },
      data,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);

  if (req.user?.role === "user" && req.user?.userId !== id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.user.delete({
    where: { user_id: id },
  });

  res.json({ message: "User deleted" });
};

// CSV UPLOAD
export const uploadUsers = async (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const hashedTempPassword = await bcrypt.hash("temp123", 10);

        await prisma.$transaction(
          results.map((user) =>
            prisma.user.create({
              data: {
                name: user.name,
                email: user.email,
                password: hashedTempPassword,
                role: "viewer",
                city: user.city,
                is_active: user.is_active === "true",
              },
            })
          )
        );

        res.json({ message: "All users uploaded successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Upload failed. No users were inserted.",
          error: error.message,
        });
      }
    });
};
