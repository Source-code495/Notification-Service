import prisma from "../config/prisma.js";
import pkg from "@prisma/client";

const { Prisma } = pkg;

function monthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabelFromKey(key) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function buildMonthKeys(months) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const keys = [];
  for (let i = 0; i < months; i++) {
    keys.push(monthKey(new Date(start.getFullYear(), start.getMonth() + i, 1)));
  }
  return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1), keys };
}

function mapCounts(rows, keyField, countField) {
  const map = new Map();
  for (const r of rows || []) {
    map.set(String(r[keyField]), Number(r[countField] ?? 0));
  }
  return map;
}

export const getOverview = async (req, res) => {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months || "12", 10) || 12, 3), 36);
    const { start, end, keys } = buildMonthKeys(months);

    const role = req.user?.role;
    const userId = req.user?.userId;
    const isCreator = role === "creator" && userId;

    // Logs month-wise (notifications sent)
    const logsRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT DATE_FORMAT(nl.sent_at, '%Y-%m') AS ym, COUNT(*) AS cnt
        FROM NotificationLog nl
        ${isCreator ? Prisma.sql`JOIN Campaign c ON c.campaign_id = nl.campaign_id` : Prisma.empty}
        WHERE nl.sent_at >= ${start} AND nl.sent_at < ${end}
        ${isCreator ? Prisma.sql`AND c.created_by = ${userId}` : Prisma.empty}
        GROUP BY ym
        ORDER BY ym;
      `
    );

    // Campaigns month-wise (created)
    const campaignRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT DATE_FORMAT(c.created_at, '%Y-%m') AS ym, COUNT(*) AS cnt
        FROM Campaign c
        WHERE c.created_at >= ${start} AND c.created_at < ${end}
        ${isCreator ? Prisma.sql`AND c.created_by = ${userId}` : Prisma.empty}
        GROUP BY ym
        ORDER BY ym;
      `
    );

    // Campaigns by status
    const campaignStatusRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT c.status AS status, COUNT(*) AS cnt
        FROM Campaign c
        WHERE c.created_at >= ${start} AND c.created_at < ${end}
        ${isCreator ? Prisma.sql`AND c.created_by = ${userId}` : Prisma.empty}
        GROUP BY c.status;
      `
    );

    // Logs by status
    const logStatusRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT nl.status AS status, COUNT(*) AS cnt
        FROM NotificationLog nl
        ${isCreator ? Prisma.sql`JOIN Campaign c ON c.campaign_id = nl.campaign_id` : Prisma.empty}
        WHERE nl.sent_at >= ${start} AND nl.sent_at < ${end}
        ${isCreator ? Prisma.sql`AND c.created_by = ${userId}` : Prisma.empty}
        GROUP BY nl.status;
      `
    );

    // Campaigns by notification type
    const campaignTypeRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT c.notification_type AS notification_type, COUNT(*) AS cnt
        FROM Campaign c
        WHERE c.created_at >= ${start} AND c.created_at < ${end}
        ${isCreator ? Prisma.sql`AND c.created_by = ${userId}` : Prisma.empty}
        GROUP BY c.notification_type;
      `
    );

    // Top cities (users) - only for admin/viewer
    let usersByCity = [];
    if (role === "admin" || role === "viewer") {
      usersByCity = await prisma.$queryRaw(
        Prisma.sql`
          SELECT u.city AS city, COUNT(*) AS cnt
          FROM User u
          WHERE u.city IS NOT NULL AND u.city <> ''
          GROUP BY u.city
          ORDER BY cnt DESC
          LIMIT 7;
        `
      );
    }

    // Totals
    const [totalUsers, activeUsers] =
      role === "admin" || role === "viewer"
        ? await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { is_active: true } }),
          ])
        : [null, null];

    const totalCampaigns = await prisma.campaign.count({
      where: isCreator ? { created_by: userId } : undefined,
    });

    const totalLogs = await prisma.notificationLog.count({
      where: isCreator ? { campaign: { created_by: userId } } : undefined,
    });

    const logsMap = mapCounts(logsRows, "ym", "cnt");
    const campaignsMap = mapCounts(campaignRows, "ym", "cnt");

    const series = keys.map((k) => ({
      month: k,
      label: monthLabelFromKey(k),
      notificationsSent: logsMap.get(k) || 0,
      campaignsCreated: campaignsMap.get(k) || 0,
    }));

    res.json({
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
        months,
      },
      totals: {
        totalUsers,
        activeUsers,
        totalCampaigns,
        totalLogs,
      },
      series,
      breakdowns: {
        campaignsByStatus: (campaignStatusRows || []).map((r) => ({
          status: String(r.status),
          count: Number(r.cnt || 0),
        })),
        logsByStatus: (logStatusRows || []).map((r) => ({
          status: String(r.status),
          count: Number(r.cnt || 0),
        })),
        campaignsByType: (campaignTypeRows || []).map((r) => ({
          type: String(r.notification_type),
          count: Number(r.cnt || 0),
        })),
        usersByCity: (usersByCity || []).map((r) => ({
          city: String(r.city),
          count: Number(r.cnt || 0),
        })),
      },
      scope: {
        role,
        creatorOnly: isCreator,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load analytics", error: err.message });
  }
};
