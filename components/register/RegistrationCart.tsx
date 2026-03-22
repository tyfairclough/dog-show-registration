"use client";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Divider,
} from "@heroui/react";
import { DogFormData, DogClass } from "@/types";

interface RegistrationCartProps {
  dogs: DogFormData[];
  classes: DogClass[];
  onEditDog: (index: number) => void;
  onRemoveDog: (index: number) => void;
  onRemoveClass: (dogIndex: number, classId: string) => void;
  onAddAnotherDog: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function RegistrationCart({
  dogs,
  classes,
  onEditDog,
  onRemoveDog,
  onRemoveClass,
  onAddAnotherDog,
  onSubmit,
  isSubmitting,
}: RegistrationCartProps) {
  const getClassById = (id: string) => classes.find((c) => c.id === id);

  const calculateTotal = () => {
    let total = 0;
    for (const dog of dogs) {
      for (const classId of dog.selectedClasses) {
        const dogClass = getClassById(classId);
        if (dogClass) {
          total += dogClass.fee;
        }
      }
    }
    return total;
  };

  const totalClasses = dogs.reduce((sum, dog) => sum + dog.selectedClasses.length, 0);

  if (dogs.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardBody>
          <p className="text-stone-600 mb-4">
            You haven&apos;t added any dogs yet. Add a dog to get started!
          </p>
          <Button color="primary" onPress={onAddAnotherDog}>
            Add Your First Dog
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-bold">Your Registration</h2>
          <span className="text-sm text-stone-600">
            {dogs.length} dog{dogs.length !== 1 ? "s" : ""}, {totalClasses} class
            {totalClasses !== 1 ? "es" : ""}
          </span>
        </div>
      </CardHeader>
      <CardBody className="gap-4">
        {dogs.map((dog, dogIndex) => (
          <div key={dog.id || dogIndex} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐕</span>
                <div>
                  <h3 className="font-semibold">{dog.name}</h3>
                  <p className="text-sm text-stone-600">
                    {dog.breed}, {dog.age} year{dog.age !== 1 ? "s" : ""} old,{" "}
                    {dog.sex}
                    {dog.isRescue ? ", rescue" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => onEditDog(dogIndex)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => onRemoveDog(dogIndex)}
                >
                  Remove
                </Button>
              </div>
            </div>

            {dog.selectedClasses.length === 0 ? (
              <p className="text-sm text-warning bg-warning-50 p-2 rounded">
                No classes selected for this dog
              </p>
            ) : (
              <div className="space-y-2">
                {dog.selectedClasses.map((classId) => {
                  const dogClass = getClassById(classId);
                  if (!dogClass) return null;
                  return (
                    <div
                      key={classId}
                      className="flex items-center justify-between bg-cream-200/80 p-2 rounded border border-cream-300/50"
                    >
                      <span>{dogClass.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">
                          £{dogClass.fee.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => onRemoveClass(dogIndex, classId)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <Button variant="flat" onPress={onAddAnotherDog} className="w-full">
          + Add Another Dog
        </Button>
      </CardBody>

      <Divider />

      <CardFooter className="flex flex-col gap-4">
        <div className="flex justify-between items-center w-full text-lg">
          <span className="font-medium">Total to pay on the day:</span>
          <span className="font-bold text-primary">
            £{calculateTotal().toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-stone-600 text-center">
          Registration is free. Fees are collected at the event.
        </p>
        <Button
          color="primary"
          size="lg"
          className="w-full"
          isDisabled={totalClasses === 0}
          isLoading={isSubmitting}
          onPress={onSubmit}
        >
          Submit Registration
        </Button>
      </CardFooter>
    </Card>
  );
}
