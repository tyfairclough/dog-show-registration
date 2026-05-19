-- MySQL init script for Essex Therapy Dogs Fun Dog Show
-- Import this file into phpMyAdmin for database `u158443370_etd_show`

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Drop tables if they already exist (optional; comment out in production if needed)
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS dogs;
DROP TABLE IF EXISTS owners;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS site_settings;

-- Classes table
CREATE TABLE classes (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  max_capacity INT NOT NULL DEFAULT 20,
  current_registrations INT NOT NULL DEFAULT 0,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image_original VARCHAR(512) NULL,
  image_square VARCHAR(512) NULL,
  image_mobile VARCHAR(512) NULL,
  allowed_breeds TEXT NULL,
  breed_restriction_mode VARCHAR(20) NOT NULL DEFAULT 'allow',
  allowed_sex VARCHAR(10) NULL,
  min_age INT NULL,
  max_age INT NULL,
  rescue_only TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Owners table
CREATE TABLE owners (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  retrieval_token CHAR(36) NULL,
  activity_waiver_accepted_at DATETIME(3) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_owners_email (email),
  UNIQUE KEY uq_owners_retrieval_token (retrieval_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dogs table
CREATE TABLE dogs (
  id CHAR(36) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255) NULL,
  age INT NULL,
  sex VARCHAR(10) NULL,
  is_rescue TINYINT(1) NOT NULL DEFAULT 0,
  activity_fun_show INT NOT NULL DEFAULT 0,
  activity_splash_pool INT NOT NULL DEFAULT 0,
  activity_agility INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dogs_owner (owner_id),
  CONSTRAINT fk_dogs_owner
    FOREIGN KEY (owner_id)
    REFERENCES owners (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site settings (admin toggles)
CREATE TABLE site_settings (
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (`key`, `value`) VALUES ('agility_registration_enabled', '0');

-- Registrations table
CREATE TABLE registrations (
  id CHAR(36) NOT NULL,
  dog_id CHAR(36) NOT NULL,
  class_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_registrations_dog_class (dog_id, class_id),
  KEY idx_registrations_dog (dog_id),
  KEY idx_registrations_class (class_id),
  CONSTRAINT fk_registrations_dog
    FOREIGN KEY (dog_id)
    REFERENCES dogs (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_registrations_class
    FOREIGN KEY (class_id)
    REFERENCES classes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

