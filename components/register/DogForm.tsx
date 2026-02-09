"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { DogFormData } from "@/types";

interface DogFormProps {
  onSubmit: (dog: DogFormData) => void;
  onCancel: () => void;
  editingDog?: DogFormData | null;
}

const commonBreeds = [
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Bulldog",
  "Beagle",
  "Poodle",
  "Rottweiler",
  "Yorkshire Terrier",
  "Boxer",
  "Dachshund",
  "Cocker Spaniel",
  "Shih Tzu",
  "Border Collie",
  "Jack Russell Terrier",
  "Cavalier King Charles Spaniel",
  "Staffordshire Bull Terrier",
  "French Bulldog",
  "Springer Spaniel",
  "Chihuahua",
  "Mixed Breed / Crossbreed",
  "Other",
];

export default function DogForm({ onSubmit, onCancel, editingDog }: DogFormProps) {
  const [name, setName] = useState(editingDog?.name || "");
  const [breed, setBreed] = useState(editingDog?.breed || "");
  const [age, setAge] = useState(editingDog?.age?.toString() || "");
  const [sex, setSex] = useState<"male" | "female">(editingDog?.sex || "male");
  const [isRescue, setIsRescue] = useState(editingDog?.isRescue || false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your dog's name");
      return;
    }

    if (!breed) {
      setError("Please select a breed");
      return;
    }

    if (!age || parseInt(age) < 0 || parseInt(age) > 25) {
      setError("Please enter a valid age (0-25 years)");
      return;
    }

    onSubmit({
      id: editingDog?.id,
      name: name.trim(),
      breed,
      age: parseInt(age),
      sex,
      isRescue,
      selectedClasses: editingDog?.selectedClasses || [],
    });
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-col items-start">
        <h2 className="text-2xl font-bold">
          {editingDog ? "Edit Dog Details" : "Add a Dog"}
        </h2>
        <p className="text-sm text-gray-500">
          Enter your dog&apos;s details to see which classes they&apos;re eligible for
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardBody className="gap-4">
          {error && (
            <div className="p-3 bg-danger-50 text-danger border border-danger-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <Input
            label="Dog's Name"
            placeholder="e.g., Max"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isRequired
          />

          <Select
            label="Breed"
            placeholder="Select a breed"
            selectedKeys={breed ? new Set([breed]) : new Set()}
            onSelectionChange={(keys) => {
              const arr = Array.from(keys) as string[];
              setBreed(arr[0] || "");
            }}
            isRequired
          >
            {commonBreeds.map((b) => (
              <SelectItem key={b}>{b}</SelectItem>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Age (years)"
              placeholder="e.g., 3"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={0}
              max={25}
              isRequired
            />

            <Select
              label="Sex"
              selectedKeys={new Set([sex])}
              onSelectionChange={(keys) => {
                const arr = Array.from(keys) as string[];
                setSex((arr[0] as "male" | "female") || "male");
              }}
              isRequired
            >
              <SelectItem key="male">Male</SelectItem>
              <SelectItem key="female">Female</SelectItem>
            </Select>
          </div>

          <Switch
            isSelected={isRescue}
            onValueChange={setIsRescue}
          >
            <div className="flex flex-col">
              <span>Rescue dog</span>
              <span className="text-xs text-gray-500">
                Is this dog from a rescue shelter or charity?
              </span>
            </div>
          </Switch>
        </CardBody>
        <CardFooter className="flex gap-2">
          <Button variant="flat" onPress={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" color="primary" className="flex-1">
            {editingDog ? "Save Changes" : "Add Dog"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
