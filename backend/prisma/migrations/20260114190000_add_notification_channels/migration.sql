-- Add per-channel preferences and log channel support

-- 1) Preference: add channel flags (default false)
ALTER TABLE `Preference`
  ADD COLUMN `offers_sms` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `offers_email` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `offers_push` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `order_updates_sms` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `order_updates_email` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `order_updates_push` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `newsletter_sms` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `newsletter_email` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `newsletter_push` BOOLEAN NOT NULL DEFAULT false;

-- Backfill: preserve old behavior (legacy boolean => push)
UPDATE `Preference`
SET
  `offers_push` = IFNULL(`offers`, false),
  `order_updates_push` = IFNULL(`order_updates`, false),
  `newsletter_push` = IFNULL(`newsletter`, false);

-- 2) NotificationLog: track delivery channel
ALTER TABLE `NotificationLog`
  ADD COLUMN `channel` ENUM('push','sms','email') NOT NULL DEFAULT 'push';
