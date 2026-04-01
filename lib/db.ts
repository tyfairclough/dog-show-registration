import crypto from 'crypto';
import prisma from './prisma';

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Class operations (Prisma-backed)
export const classOperations = {
  getAll: async () => {
    return prisma.class.findMany({
      orderBy: { created_at: 'desc' },
    });
  },

  getById: async (id: string) => {
    return prisma.class.findUnique({
      where: { id },
    });
  },

  create: async (data: {
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

    await prisma.class.create({
      data: {
        id,
        name: data.name,
        description: data.description ?? null,
        max_capacity: data.maxCapacity,
        fee: data.fee,
        image_original: data.imageOriginal ?? null,
        image_square: data.imageSquare ?? null,
        image_mobile: data.imageMobile ?? null,
        allowed_breeds: data.allowedBreeds ?? null,
        breed_restriction_mode: data.breedRestrictionMode ?? 'allow',
        allowed_sex: data.allowedSex ?? null,
        min_age: data.minAge ?? null,
        max_age: data.maxAge ?? null,
        rescue_only: data.rescueOnly ? 1 : 0,
      },
    });

    return classOperations.getById(id);
  },

  update: async (
    id: string,
    data: Partial<{
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
    }>
  ) => {
    const updateData: Record<string, string | number | null> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.maxCapacity !== undefined) updateData.max_capacity = data.maxCapacity;
    if (data.fee !== undefined) updateData.fee = data.fee;
    if (data.imageOriginal !== undefined) updateData.image_original = data.imageOriginal;
    if (data.imageSquare !== undefined) updateData.image_square = data.imageSquare;
    if (data.imageMobile !== undefined) updateData.image_mobile = data.imageMobile;
    if (data.allowedBreeds !== undefined) updateData.allowed_breeds = data.allowedBreeds;
    if (data.breedRestrictionMode !== undefined)
      updateData.breed_restriction_mode = data.breedRestrictionMode;
    if (data.allowedSex !== undefined) updateData.allowed_sex = data.allowedSex;
    if (data.minAge !== undefined) updateData.min_age = data.minAge;
    if (data.maxAge !== undefined) updateData.max_age = data.maxAge;
    if (data.rescueOnly !== undefined) updateData.rescue_only = data.rescueOnly ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return classOperations.getById(id);
    }

    await prisma.class.update({
      where: { id },
      data: updateData,
    });
    return classOperations.getById(id);
  },

  delete: async (id: string) => {
    return prisma.class.delete({
      where: { id },
    });
  },

  updateRegistrationCount: async (classId: string) => {
    const count = await prisma.registration.count({
      where: {
        class_id: classId,
        status: { not: 'cancelled' },
      },
    });

    return prisma.class.update({
      where: { id: classId },
      data: { current_registrations: count },
    });
  },
};

// Owner operations (Prisma-backed)
export const ownerOperations = {
  getAll: async () => {
    return prisma.owner.findMany({
      orderBy: { created_at: 'desc' },
    });
  },

  getById: async (id: string) => {
    return prisma.owner.findUnique({
      where: { id },
    });
  },

  getByEmail: async (email: string) => {
    return prisma.owner.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  getByToken: async (token: string) => {
    return prisma.owner.findUnique({
      where: { retrieval_token: token },
    });
  },

  create: async (data: { name: string; email: string }) => {
    const id = generateId();
    const retrievalToken = generateId();
    await prisma.owner.create({
      data: {
        id,
        name: data.name,
        email: data.email.toLowerCase(),
        retrieval_token: retrievalToken,
      },
    });
    return ownerOperations.getById(id);
  },

  update: async (id: string, data: { name?: string; email?: string }) => {
    const updateData: Record<string, string> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.toLowerCase();

    if (Object.keys(updateData).length === 0) {
      return ownerOperations.getById(id);
    }

    await prisma.owner.update({
      where: { id },
      data: updateData,
    });

    return ownerOperations.getById(id);
  },
};

// Dog operations (Prisma-backed)
export const dogOperations = {
  getAll: async () => {
    return prisma.dog.findMany({
      orderBy: { created_at: 'desc' },
    });
  },

  getById: async (id: string) => {
    return prisma.dog.findUnique({
      where: { id },
    });
  },

  getByOwnerId: async (ownerId: string) => {
    return prisma.dog.findMany({
      where: { owner_id: ownerId },
      orderBy: { created_at: 'desc' },
    });
  },

  create: async (data: {
    ownerId: string;
    name: string;
    breed?: string;
    age?: number;
    sex?: string;
    isRescue: boolean;
  }) => {
    const id = generateId();
    await prisma.dog.create({
      data: {
        id,
        owner_id: data.ownerId,
        name: data.name,
        breed: data.breed ?? null,
        age: data.age ?? null,
        sex: data.sex ?? null,
        is_rescue: data.isRescue ? 1 : 0,
      },
    });
    return dogOperations.getById(id);
  },

  update: async (
    id: string,
    data: Partial<{
      name: string;
      breed: string;
      age: number;
      sex: string;
      isRescue: boolean;
    }>
  ) => {
    const updateData: Record<string, string | number | null> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.breed !== undefined) updateData.breed = data.breed;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.sex !== undefined) updateData.sex = data.sex;
    if (data.isRescue !== undefined) updateData.is_rescue = data.isRescue ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return dogOperations.getById(id);
    }

    await prisma.dog.update({
      where: { id },
      data: updateData,
    });

    return dogOperations.getById(id);
  },

  delete: async (id: string) => {
    return prisma.dog.delete({
      where: { id },
    });
  },
};

// Registration operations (Prisma-backed)
export const registrationOperations = {
  getAll: async () => {
    const registrations = await prisma.registration.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        dog: {
          include: {
            owner: true,
          },
        },
        class: true,
      },
    });

    return registrations.map((r) => ({
      id: r.id,
      dog_id: r.dog_id,
      class_id: r.class_id,
      status: r.status,
      created_at: r.created_at,
      owner_id: r.dog.owner.id,
      dog_name: r.dog.name,
      dog_breed: r.dog.breed,
      dog_age: r.dog.age,
      dog_sex: r.dog.sex,
      dog_is_rescue: r.dog.is_rescue,
      owner_name: r.dog.owner.name,
      owner_email: r.dog.owner.email,
      class_name: r.class.name,
      class_fee: r.class.fee,
    }));
  },

  getById: async (id: string) => {
    return prisma.registration.findUnique({
      where: { id },
    });
  },

  getByDogId: async (dogId: string) => {
    const registrations = await prisma.registration.findMany({
      where: { dog_id: dogId },
      include: {
        class: true,
      },
    });

    return registrations.map((r) => ({
      ...r,
      class_name: r.class.name,
      class_fee: r.class.fee,
    }));
  },

  getByClassId: async (classId: string) => {
    const registrations = await prisma.registration.findMany({
      where: { class_id: classId },
      include: {
        dog: {
          include: { owner: true },
        },
      },
    });

    return registrations.map((r) => ({
      ...r,
      dog_name: r.dog.name,
      dog_breed: r.dog.breed,
      owner_name: r.dog.owner.name,
    }));
  },

  getByOwnerId: async (ownerId: string) => {
    const registrations = await prisma.registration.findMany({
      where: {
        dog: {
          owner_id: ownerId,
        },
      },
      orderBy: { created_at: 'desc' },
      include: {
        dog: true,
        class: true,
      },
    });

    return registrations.map((r) => ({
      ...r,
      dog_name: r.dog.name,
      dog_breed: r.dog.breed,
      class_name: r.class.name,
      class_fee: r.class.fee,
    }));
  },

  create: async (data: { dogId: string; classId: string }) => {
    const id = generateId();
    await prisma.registration.create({
      data: {
        id,
        dog_id: data.dogId,
        class_id: data.classId,
        status: 'confirmed',
      },
    });

    await classOperations.updateRegistrationCount(data.classId);
    return registrationOperations.getById(id);
  },

  updateStatus: async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    const registration = await registrationOperations.getById(id);

    await prisma.registration.update({
      where: { id },
      data: { status },
    });

    if (registration) {
      await classOperations.updateRegistrationCount((registration as any).class_id);
    }

    return registrationOperations.getById(id);
  },

  delete: async (id: string) => {
    const registration = await registrationOperations.getById(id);

    const result = await prisma.registration.delete({
      where: { id },
    });

    if (registration) {
      await classOperations.updateRegistrationCount((registration as any).class_id);
    }

    return result;
  },
};

export default prisma;

