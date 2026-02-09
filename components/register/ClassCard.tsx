"use client";

import { Card, CardBody, Button, Chip, Image } from "@heroui/react";
import { DogClass, DogFormData } from "@/types";

interface ClassCardProps {
  dogClass: DogClass;
  dog: DogFormData;
  isSelected: boolean;
  onToggle: () => void;
}

export function checkEligibility(dogClass: DogClass, dog: DogFormData): { eligible: boolean; reason?: string } {
  // Check capacity
  if (dogClass.current_registrations >= dogClass.max_capacity) {
    return { eligible: false, reason: "Class is full" };
  }

  // Check breed constraint
  if (dogClass.allowed_breeds) {
    const breedList = dogClass.allowed_breeds.split(",").map(b => b.trim().toLowerCase());
    const dogBreed = dog.breed.toLowerCase();
    const mode = dogClass.breed_restriction_mode || 'allow';
    
    if (mode === 'allow') {
      // Only allow selected breeds
      if (!breedList.includes(dogBreed)) {
        return { eligible: false, reason: `Only for: ${dogClass.allowed_breeds}` };
      }
    } else {
      // Exclude selected breeds (allow all except these)
      if (breedList.includes(dogBreed)) {
        return { eligible: false, reason: `Not available for: ${dog.breed}` };
      }
    }
  }

  // Check sex constraint
  if (dogClass.allowed_sex) {
    if (dogClass.allowed_sex.toLowerCase() !== dog.sex.toLowerCase()) {
      return { eligible: false, reason: `Only for ${dogClass.allowed_sex} dogs` };
    }
  }

  // Check min age
  if (dogClass.min_age !== null && dog.age < dogClass.min_age) {
    return { eligible: false, reason: `Minimum age: ${dogClass.min_age} years` };
  }

  // Check max age
  if (dogClass.max_age !== null && dog.age > dogClass.max_age) {
    return { eligible: false, reason: `Maximum age: ${dogClass.max_age} years` };
  }

  // Check rescue only
  if (dogClass.rescue_only && !dog.isRescue) {
    return { eligible: false, reason: "Rescue dogs only" };
  }

  return { eligible: true };
}

export default function ClassCard({ dogClass, dog, isSelected, onToggle }: ClassCardProps) {
  const { eligible, reason } = checkEligibility(dogClass, dog);
  const spotsLeft = dogClass.max_capacity - dogClass.current_registrations;

  return (
    <Card
      className={`transition-all ${
        isSelected
          ? "ring-2 ring-primary bg-primary-50"
          : eligible
          ? "hover:shadow-md cursor-pointer"
          : "opacity-60"
      }`}
      isPressable={eligible}
      onPress={eligible ? onToggle : undefined}
    >
      <CardBody className="flex flex-row gap-4">
        {dogClass.image_square ? (
          <Image
            src={dogClass.image_square}
            alt={dogClass.name}
            width={80}
            height={80}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
            🏆
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg">{dogClass.name}</h3>
            <Chip
              size="sm"
              color={spotsLeft <= 3 ? "warning" : "success"}
              variant="flat"
            >
              {spotsLeft} spots left
            </Chip>
          </div>

          {dogClass.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {dogClass.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="font-medium text-primary">£{dogClass.fee.toFixed(2)}</span>

            {!eligible ? (
              <Chip size="sm" color="danger" variant="flat">
                {reason}
              </Chip>
            ) : isSelected ? (
              <Button size="sm" color="primary" variant="solid">
                ✓ Selected
              </Button>
            ) : (
              <Button size="sm" color="primary" variant="flat">
                Select
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
