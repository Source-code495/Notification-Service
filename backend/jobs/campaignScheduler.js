import cron from "node-cron";
import prisma from "../config/prisma.js";
import { deliverCampaignNow } from "../services/campaignDeliveryService.js";

let started = false;

const runOnce = async () => {
  const now = new Date();

  const dueCampaigns = await prisma.campaign.findMany({
    where: {
      status: "scheduled",
      scheduled_at: { lte: now },
    },
    select: { campaign_id: true },
    orderBy: [{ scheduled_at: "asc" }],
    take: 50,
  });

  for (const c of dueCampaigns) {
    // Claim work atomically to avoid double-sends if multiple instances run.
    const claimed = await prisma.campaign.updateMany({
      where: { campaign_id: c.campaign_id, status: "scheduled" },
      data: { status: "sending" },
    });

    if (claimed.count === 0) continue;

    try {
      const result = await deliverCampaignNow({
        campaign_id: c.campaign_id,
        allowedStatuses: ["sending"],
      });

      // If nothing to send, unlock back to draft so it can be edited/rescheduled.
      if (result.recipients === 0) {
        await prisma.campaign.updateMany({
          where: { campaign_id: c.campaign_id, status: "sending" },
          data: { status: "draft", scheduled_at: null },
        });
      }
    } catch (err) {
      console.error("Scheduled campaign send failed", {
        campaign_id: c.campaign_id,
        error: err?.message,
      });

      // Put it back to scheduled for retry next minute.
      await prisma.campaign.updateMany({
        where: { campaign_id: c.campaign_id, status: "sending" },
        data: { status: "scheduled" },
      });
    }
  }
};

export const startCampaignSchedulerCron = () => {
  if (started) return;
  started = true;

  cron.schedule("* * * * *", async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error("Campaign scheduler cron run failed", err);
    }
  });

  console.log("Campaign scheduler cron started (runs every minute)");
};
