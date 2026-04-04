-- AlterTable: sync production DB with prisma/schema.prisma Owner.activity_waiver_accepted_at
ALTER TABLE `owners` ADD COLUMN `activity_waiver_accepted_at` DATETIME(3) NULL;
