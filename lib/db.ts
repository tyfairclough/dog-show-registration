import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'dogshow.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Class operations
export const classOperations = {
  getAll: () => {
    return db.prepare('SELECT * FROM classes ORDER BY created_at DESC').all();
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  },

  create: (data: {
    name: string;
    description?: string;
    maxCapacity: number;
    fee: number;
    imageOriginal?: string;
    imageSquare?: string;
    imageMobile?: string;
    allowedBreeds?: string;
    breedRestrictionMode?: 'allow' | 'exclude';
    allowedSex?: string;
    minAge?: number;
    maxAge?: number;
    rescueOnly: boolean;
  }) => {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO classes (id, name, description, max_capacity, fee, image_original, image_square, image_mobile, allowed_breeds, breed_restriction_mode, allowed_sex, min_age, max_age, rescue_only)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name,
      data.description || null,
      data.maxCapacity,
      data.fee,
      data.imageOriginal || null,
      data.imageSquare || null,
      data.imageMobile || null,
      data.allowedBreeds || null,
      data.breedRestrictionMode || 'allow',
      data.allowedSex || null,
      data.minAge || null,
      data.maxAge || null,
      data.rescueOnly ? 1 : 0
    );
    return classOperations.getById(id);
  },

  update: (id: string, data: Partial<{
    name: string;
    description: string;
    maxCapacity: number;
    fee: number;
    imageOriginal: string;
    imageSquare: string;
    imageMobile: string;
    allowedBreeds: string;
    breedRestrictionMode: 'allow' | 'exclude';
    allowedSex: string;
    minAge: number;
    maxAge: number;
    rescueOnly: boolean;
  }>) => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.maxCapacity !== undefined) { fields.push('max_capacity = ?'); values.push(data.maxCapacity); }
    if (data.fee !== undefined) { fields.push('fee = ?'); values.push(data.fee); }
    if (data.imageOriginal !== undefined) { fields.push('image_original = ?'); values.push(data.imageOriginal); }
    if (data.imageSquare !== undefined) { fields.push('image_square = ?'); values.push(data.imageSquare); }
    if (data.imageMobile !== undefined) { fields.push('image_mobile = ?'); values.push(data.imageMobile); }
    if (data.allowedBreeds !== undefined) { fields.push('allowed_breeds = ?'); values.push(data.allowedBreeds); }
    if (data.breedRestrictionMode !== undefined) { fields.push('breed_restriction_mode = ?'); values.push(data.breedRestrictionMode); }
    if (data.allowedSex !== undefined) { fields.push('allowed_sex = ?'); values.push(data.allowedSex); }
    if (data.minAge !== undefined) { fields.push('min_age = ?'); values.push(data.minAge); }
    if (data.maxAge !== undefined) { fields.push('max_age = ?'); values.push(data.maxAge); }
    if (data.rescueOnly !== undefined) { fields.push('rescue_only = ?'); values.push(data.rescueOnly ? 1 : 0); }

    if (fields.length === 0) return classOperations.getById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return classOperations.getById(id);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
    return stmt.run(id);
  },

  updateRegistrationCount: (classId: string) => {
    const stmt = db.prepare(`
      UPDATE classes 
      SET current_registrations = (
        SELECT COUNT(*) FROM registrations WHERE class_id = ? AND status != 'cancelled'
      )
      WHERE id = ?
    `);
    return stmt.run(classId, classId);
  }
};

// Owner operations
export const ownerOperations = {
  getAll: () => {
    return db.prepare('SELECT * FROM owners ORDER BY created_at DESC').all();
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM owners WHERE id = ?').get(id);
  },

  getByEmail: (email: string) => {
    return db.prepare('SELECT * FROM owners WHERE email = ?').get(email);
  },

  getByToken: (token: string) => {
    return db.prepare('SELECT * FROM owners WHERE retrieval_token = ?').get(token);
  },

  create: (data: { name: string; email: string }) => {
    const id = generateId();
    const retrievalToken = generateId();
    const stmt = db.prepare(`
      INSERT INTO owners (id, name, email, retrieval_token)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, data.name, data.email.toLowerCase(), retrievalToken);
    return ownerOperations.getById(id);
  },

  update: (id: string, data: { name?: string; email?: string }) => {
    const fields: string[] = [];
    const values: string[] = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email.toLowerCase()); }

    if (fields.length === 0) return ownerOperations.getById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE owners SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return ownerOperations.getById(id);
  }
};

// Dog operations
export const dogOperations = {
  getAll: () => {
    return db.prepare('SELECT * FROM dogs ORDER BY created_at DESC').all();
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM dogs WHERE id = ?').get(id);
  },

  getByOwnerId: (ownerId: string) => {
    return db.prepare('SELECT * FROM dogs WHERE owner_id = ?').all(ownerId);
  },

  create: (data: {
    ownerId: string;
    name: string;
    breed?: string;
    age?: number;
    sex?: string;
    isRescue: boolean;
  }) => {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO dogs (id, owner_id, name, breed, age, sex, is_rescue)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.ownerId,
      data.name,
      data.breed || null,
      data.age || null,
      data.sex || null,
      data.isRescue ? 1 : 0
    );
    return dogOperations.getById(id);
  },

  update: (id: string, data: Partial<{
    name: string;
    breed: string;
    age: number;
    sex: string;
    isRescue: boolean;
  }>) => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.breed !== undefined) { fields.push('breed = ?'); values.push(data.breed); }
    if (data.age !== undefined) { fields.push('age = ?'); values.push(data.age); }
    if (data.sex !== undefined) { fields.push('sex = ?'); values.push(data.sex); }
    if (data.isRescue !== undefined) { fields.push('is_rescue = ?'); values.push(data.isRescue ? 1 : 0); }

    if (fields.length === 0) return dogOperations.getById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE dogs SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return dogOperations.getById(id);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM dogs WHERE id = ?');
    return stmt.run(id);
  }
};

// Registration operations
export const registrationOperations = {
  getAll: () => {
    return db.prepare(`
      SELECT 
        r.*,
        o.id as owner_id,
        d.name as dog_name,
        d.breed as dog_breed,
        d.age as dog_age,
        d.sex as dog_sex,
        d.is_rescue as dog_is_rescue,
        o.name as owner_name,
        o.email as owner_email,
        c.name as class_name,
        c.fee as class_fee
      FROM registrations r
      JOIN dogs d ON r.dog_id = d.id
      JOIN owners o ON d.owner_id = o.id
      JOIN classes c ON r.class_id = c.id
      ORDER BY r.created_at DESC
    `).all();
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM registrations WHERE id = ?').get(id);
  },

  getByDogId: (dogId: string) => {
    return db.prepare(`
      SELECT r.*, c.name as class_name, c.fee as class_fee
      FROM registrations r
      JOIN classes c ON r.class_id = c.id
      WHERE r.dog_id = ?
    `).all(dogId);
  },

  getByClassId: (classId: string) => {
    return db.prepare(`
      SELECT r.*, d.name as dog_name, d.breed as dog_breed, o.name as owner_name
      FROM registrations r
      JOIN dogs d ON r.dog_id = d.id
      JOIN owners o ON d.owner_id = o.id
      WHERE r.class_id = ?
    `).all(classId);
  },

  getByOwnerId: (ownerId: string) => {
    return db.prepare(`
      SELECT 
        r.*,
        d.name as dog_name,
        d.breed as dog_breed,
        c.name as class_name,
        c.fee as class_fee
      FROM registrations r
      JOIN dogs d ON r.dog_id = d.id
      JOIN classes c ON r.class_id = c.id
      WHERE d.owner_id = ?
      ORDER BY r.created_at DESC
    `).all(ownerId);
  },

  create: (data: { dogId: string; classId: string }) => {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO registrations (id, dog_id, class_id, status)
      VALUES (?, ?, ?, 'confirmed')
    `);
    stmt.run(id, data.dogId, data.classId);
    classOperations.updateRegistrationCount(data.classId);
    return registrationOperations.getById(id);
  },

  updateStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    const registration = registrationOperations.getById(id) as { class_id: string } | undefined;
    const stmt = db.prepare('UPDATE registrations SET status = ? WHERE id = ?');
    stmt.run(status, id);
    if (registration) {
      classOperations.updateRegistrationCount(registration.class_id);
    }
    return registrationOperations.getById(id);
  },

  delete: (id: string) => {
    const registration = registrationOperations.getById(id) as { class_id: string } | undefined;
    const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
    const result = stmt.run(id);
    if (registration) {
      classOperations.updateRegistrationCount(registration.class_id);
    }
    return result;
  }
};

export default db;
