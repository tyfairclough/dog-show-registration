"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Autocomplete,
  AutocompleteItem,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { DogFormData } from "@/types";
import { DOG_BREED_OPTIONS } from "@/lib/kennelClubBreeds";

interface DogFormProps {
  onSubmit: (dog: DogFormData) => void;
  onCancel: () => void;
  editingDog?: DogFormData | null;
}

export default function DogForm({ onSubmit, onCancel, editingDog }: DogFormProps) {
  const [name, setName] = useState(editingDog?.name || "");
  const [breed, setBreed] = useState(editingDog?.breed || "");
  const [age, setAge] = useState(editingDog?.age?.toString() || "");
  const [sex, setSex] = useState<"male" | "female" | "">(editingDog?.sex || "");
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

    if (!/^\d+$/.test(age)) {
      setError("Please enter a whole number age (0-20 years)");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (parsedAge < 0 || parsedAge > 20) {
      setError("Please enter a valid age (0-20 years)");
      return;
    }

    if (!sex) {
      setError("Please select your dog's sex");
      return;
    }

    onSubmit({
      id: editingDog?.id,
      name: name.trim(),
      breed,
      age: parsedAge,
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
        <p className="text-sm text-stone-600">
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

          <Autocomplete
            label="Breed"
            placeholder="Start typing to find a breed"
            inputValue={breed}
            onInputChange={setBreed}
            selectedKey={breed || null}
            onSelectionChange={(key) => setBreed((key as string) || breed)}
            isRequired
          >
            {DOG_BREED_OPTIONS.map((b) => (
              <AutocompleteItem key={b}>{b}</AutocompleteItem>
            ))}
          </Autocomplete>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Age (years)"
              placeholder="Enter 0 for puppies"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={0}
              max={20}
              step={1}
              isRequired
            />

            <Select
              label="Sex"
              placeholder="Please select"
              selectedKeys={sex ? new Set([sex]) : new Set()}
              onSelectionChange={(keys) => {
                const arr = Array.from(keys) as string[];
                setSex((arr[0] as "male" | "female") || "");
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
              <span className="text-xs text-stone-600">
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
