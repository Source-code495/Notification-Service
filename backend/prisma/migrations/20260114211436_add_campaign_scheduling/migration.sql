-- AlterTable
ALTER TABLE `Campaign` MODIFY `status` ENUM('draft', 'scheduled', 'sending', 'sent') NOT NULL DEFAULT 'draft';
