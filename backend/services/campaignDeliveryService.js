import prisma from "../config/prisma.js";

export const deliverCampaignNow = async ({ campaign_id, allowedStatuses }) => {
  const campaign = await prisma.campaign.findUnique({
    where: { campaign_id },
    select: {
      campaign_id: true,
      notification_type: true,
      city_filters: true,
      status: true,
    },
  });

  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "CAMPAIGN_NOT_FOUND";
    throw err;
  }

  if (Array.isArray(allowedStatuses) && !allowedStatuses.includes(campaign.status)) {
    const err = new Error(`Campaign status ${campaign.status} is not deliverable`);
    err.code = "CAMPAIGN_STATUS_NOT_DELIVERABLE";
    throw err;
  }

  const cityFilters = Array.isArray(campaign.city_filters) ? campaign.city_filters : [];
  const hasCityFilters = cityFilters.length > 0;

  // Current product logic: Campaigns are only "offers".
  const users = await prisma.user.findMany({
    where: {
      is_active: true,
      ...(hasCityFilters ? { city: { in: cityFilters } } : {}),
      preference: {
        OR: [{ offers_push: true }, { offers_email: true }, { offers_sms: true }],
      },
    },
    select: {
      user_id: true,
      preference: {
        select: {
          offers_push: true,
          offers_email: true,
          offers_sms: true,
        },
      },
    },
  });

  if (users.length === 0) {
    return { recipients: 0, logCount: 0 };
  }

  const now = new Date();
  const logData = [];

  for (const u of users) {
    const pref = u.preference;
    if (pref?.offers_push) {
      logData.push({
        user_id: u.user_id,
        campaign_id: campaign.campaign_id,
        status: "success",
        sent_at: now,
        channel: "push",
      });
    }
    if (pref?.offers_email) {
      logData.push({
        user_id: u.user_id,
        campaign_id: campaign.campaign_id,
        status: "success",
        sent_at: now,
        channel: "email",
      });
    }
    if (pref?.offers_sms) {
      logData.push({
        user_id: u.user_id,
        campaign_id: campaign.campaign_id,
        status: "success",
        sent_at: now,
        channel: "sms",
      });
    }
  }

  if (logData.length === 0) {
    return { recipients: 0, logCount: 0 };
  }

  await prisma.$transaction([
    prisma.notificationLog.createMany({ data: logData }),
    prisma.campaign.update({
      where: { campaign_id },
      data: { status: "sent", scheduled_at: null },
    }),
  ]);

  return { recipients: users.length, logCount: logData.length };
};
