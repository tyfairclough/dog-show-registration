-- CreateTable
CREATE TABLE `site_settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed: agility registration disabled by default
INSERT INTO `site_settings` (`key`, `value`) VALUES ('agility_registration_enabled', '0');
