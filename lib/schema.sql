-- Dog Show Registration System Database Schema

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 20,
    current_registrations INTEGER NOT NULL DEFAULT 0,
    fee REAL NOT NULL DEFAULT 0,
    image_original TEXT,
    image_square TEXT,
    image_mobile TEXT,
    allowed_breeds TEXT,
    breed_restriction_mode TEXT NOT NULL DEFAULT 'allow',
    allowed_sex TEXT,
    min_age INTEGER,
    max_age INTEGER,
    rescue_only INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    retrieval_token TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dogs table
CREATE TABLE IF NOT EXISTS dogs (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    breed TEXT,
    age INTEGER,
    sex TEXT,
    is_rescue INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    dog_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(dog_id, class_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dogs_owner ON dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_registrations_dog ON registrations(dog_id);
CREATE INDEX IF NOT EXISTS idx_registrations_class ON registrations(class_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_token ON owners(retrieval_token);
