import { RegistrationWithDetails } from "@/types";

export interface GroupedRegistration {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  dogs: {
    dogId: string;
    dogName: string;
    dogBreed: string | null;
    registrations: {
      id: string;
      className: string;
      classFee: number;
      status: string;
      createdAt: string;
    }[];
  }[];
}

export function groupRegistrationsByOwner(
  registrations: RegistrationWithDetails[]
): GroupedRegistration[] {
  const grouped: Record<string, GroupedRegistration> = {};

  for (const reg of registrations) {
    const ownerKey = reg.owner_id;

    if (!grouped[ownerKey]) {
      grouped[ownerKey] = {
        ownerId: reg.owner_id,
        ownerName: reg.owner_name,
        ownerEmail: reg.owner_email,
        dogs: [],
      };
    }

    let dogEntry = grouped[ownerKey].dogs.find((d) => d.dogId === reg.dog_id);
    if (!dogEntry) {
      dogEntry = {
        dogId: reg.dog_id,
        dogName: reg.dog_name,
        dogBreed: reg.dog_breed,
        registrations: [],
      };
      grouped[ownerKey].dogs.push(dogEntry);
    }

    dogEntry.registrations.push({
      id: reg.id,
      className: reg.class_name,
      // Ensure numeric fee on the client even if API returns a string
      classFee: typeof reg.class_fee === "number" ? reg.class_fee : Number(reg.class_fee),
      status: reg.status,
      createdAt: reg.created_at,
    });
  }

  return Object.values(grouped);
}

