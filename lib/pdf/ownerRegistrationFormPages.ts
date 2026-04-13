import {
  classOperations,
  dogOperations,
  ownerOperations,
  registrationOperations,
} from '@/lib/db';
import type {
  RegistrationFormClassRow,
  RegistrationFormPageInput,
} from '@/lib/pdf/registrationFormHtml';

export async function getSortedRegistrationFormClassRows(): Promise<RegistrationFormClassRow[]> {
  const classes = await classOperations.getAll();
  return classes
    .map((c) => ({ id: c.id, name: c.name, fee: Number(c.fee) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

async function activeClassIdsForDog(dogId: string): Promise<Set<string>> {
  const regs = await registrationOperations.getByDogId(dogId);
  return new Set(regs.filter((r) => r.status !== 'cancelled').map((r) => r.class_id));
}

type OwnerFormFields = { name: string; email: string };

type DogFormFields = {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  sex: string | null;
  is_rescue: number;
};

export async function buildRegistrationFormPageForDog(
  owner: OwnerFormFields,
  dog: DogFormFields,
  classRows: RegistrationFormClassRow[],
  isBlank: boolean
): Promise<RegistrationFormPageInput> {
  return {
    owner: { name: owner.name, email: owner.email },
    dog: {
      name: dog.name,
      breed: dog.breed,
      age: dog.age,
      sex: dog.sex,
      is_rescue: dog.is_rescue,
    },
    classes: classRows,
    selectedClassIds: await activeClassIdsForDog(dog.id),
    isBlank,
  };
}

export function blankRegistrationFormPage(
  classRows: RegistrationFormClassRow[]
): RegistrationFormPageInput {
  return {
    owner: null,
    dog: null,
    classes: classRows,
    selectedClassIds: new Set(),
    isBlank: true,
  };
}

/**
 * One form page per dog (sorted by name), or a single blank template if the owner has no dogs.
 */
export async function getRegistrationFormPagesForOwner(
  owner: OwnerFormFields & { id: string },
  classRows: RegistrationFormClassRow[]
): Promise<RegistrationFormPageInput[]> {
  const dogs = await dogOperations.getByOwnerId(owner.id);
  dogs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const pages = await Promise.all(
    dogs.map((dog) => buildRegistrationFormPageForDog(owner, dog, classRows, false))
  );
  if (pages.length === 0) {
    return [blankRegistrationFormPage(classRows)];
  }
  return pages;
}

/** Invalid or unknown retrieval token → null */
export async function getRegistrationFormPagesForToken(
  token: string
): Promise<RegistrationFormPageInput[] | null> {
  const owner = await ownerOperations.getByToken(token);
  if (!owner) return null;
  const classRows = await getSortedRegistrationFormClassRows();
  return getRegistrationFormPagesForOwner(owner, classRows);
}
