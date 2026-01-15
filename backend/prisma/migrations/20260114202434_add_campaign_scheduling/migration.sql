-- AlterTable
ALTER TABLE `Campaign` ADD COLUMN `scheduled_at` DATETIME(3) NULL,
    MODIFY `status` ENUM('draft', 'scheduled', 'sent') NOT NULL DEFAULT 'draft';
