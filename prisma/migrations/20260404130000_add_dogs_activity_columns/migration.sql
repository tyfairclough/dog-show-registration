-- AlterTable: sync production `dogs` with prisma/schema.prisma (activity flags)
ALTER TABLE `dogs` ADD COLUMN `activity_fun_show` INT NOT NULL DEFAULT 0;
ALTER TABLE `dogs` ADD COLUMN `activity_splash_pool` INT NOT NULL DEFAULT 0;
ALTER TABLE `dogs` ADD COLUMN `activity_agility` INT NOT NULL DEFAULT 0;
