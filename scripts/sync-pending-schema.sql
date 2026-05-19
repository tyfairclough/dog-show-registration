-- Run on production (e.g. Hostinger phpMyAdmin) when POST /api/dogs returns 500.
-- Safe to re-run only if a statement fails because the object already exists; fix that line and continue.
-- After this file succeeds, baseline Prisma: npx prisma migrate resolve --applied "<migration_name>" for each folder in prisma/migrations.

-- 20260404120000_add_owners_activity_waiver_accepted_at
ALTER TABLE `owners` ADD COLUMN `activity_waiver_accepted_at` DATETIME(3) NULL;

-- 20260404130000_add_dogs_activity_columns
ALTER TABLE `dogs` ADD COLUMN `activity_fun_show` INT NOT NULL DEFAULT 0;
ALTER TABLE `dogs` ADD COLUMN `activity_splash_pool` INT NOT NULL DEFAULT 0;
ALTER TABLE `dogs` ADD COLUMN `activity_agility` INT NOT NULL DEFAULT 0;

-- 20260518120000_site_settings
CREATE TABLE `site_settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`key`, `value`) VALUES ('agility_registration_enabled', '0');
