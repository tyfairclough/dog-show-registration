"use client";

import { useState, useEffect } from "react";
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
  Checkbox,
} from "@heroui/react";
import { DogFormData, DogActivities } from "@/types";
import { DOG_BREED_OPTIONS } from "@/lib/kennelClubBreeds";

interface DogFormProps {
  onSubmit: (dog: DogFormData) => void;
  onCancel: () => void;
  editingDog?: DogFormData | null;
  agilityRegistrationEnabled?: boolean;
}

type WizardStep = "name" | "activities" | "details";

const emptyActivities: DogActivities = {
  funDogShow: false,
  splashPool: false,
  agility: false,
};

/** Title case each whitespace-separated word (e.g. dog name from the previous step). */
function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function DogForm({
  onSubmit,
  onCancel,
  editingDog,
  agilityRegistrationEnabled = false,
}: DogFormProps) {
  const [step, setStep] = useState<WizardStep>("name");
  const [name, setName] = useState(editingDog?.name || "");
  const [activities, setActivities] = useState<DogActivities>(
    editingDog?.activities ?? { ...emptyActivities }
  );
  const [breed, setBreed] = useState(editingDog?.breed || "");
  const [age, setAge] = useState(editingDog?.age?.toString() || "");
  const [sex, setSex] = useState<"male" | "female" | "">(editingDog?.sex || "");
  const [isRescue, setIsRescue] = useState(editingDog?.isRescue || false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editingDog) return;
    setName(editingDog.name);
    setActivities({ ...editingDog.activities });
    setBreed(editingDog.breed || "");
    setAge(editingDog.age !== undefined ? String(editingDog.age) : "");
    setSex(editingDog.sex || "");
    setIsRescue(editingDog.isRescue);
    setStep("name");
    setError("");
  }, [editingDog]);

  const buildPayload = (): DogFormData => {
    const resolvedActivities: DogActivities = {
      ...activities,
      agility: agilityRegistrationEnabled ? activities.agility : false,
    };

    const base: DogFormData = {
      id: editingDog?.id,
      name: name.trim(),
      activities: resolvedActivities,
      isRescue,
      selectedClasses: resolvedActivities.funDogShow
        ? editingDog?.selectedClasses || []
        : [],
    };

    if (resolvedActivities.funDogShow) {
      return {
        ...base,
        breed,
        age: parseInt(age, 10),
        sex: sex as "male" | "female",
      };
    }

    return {
      ...base,
      breed: undefined,
      age: undefined,
      sex: undefined,
    };
  };

  const finish = () => {
    onSubmit(buildPayload());
  };

  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your dog's name");
      return;
    }
    setStep("activities");
  };

  const handleActivitiesNext = () => {
    setError("");
    const any =
      activities.funDogShow ||
      activities.splashPool ||
      (agilityRegistrationEnabled && activities.agility);
    if (!any) {
      setError("Select at least one activity");
      return;
    }
    if (activities.funDogShow) {
      setStep("details");
    } else {
      finish();
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

    finish();
  };

  const stepTitle =
    step === "name"
      ? editingDog
        ? "Edit Dog"
        : "Add your dog"
      : step === "activities"
        ? "Activities"
        : "Dog details";

  const stepSubtitle =
    step === "name"
      ? "You can add additional dogs later."
      : step === "activities"
        ? `Choose activities for ${titleCaseWords(name.trim())}`
        : "We need these details for fun dog show classes";

  const allActivitiesSelected = agilityRegistrationEnabled
    ? activities.funDogShow && activities.splashPool && activities.agility
    : activities.funDogShow && activities.splashPool;

  const handleSelectAll = (v: boolean) => {
    setActivities({
      funDogShow: v,
      splashPool: v,
      agility: agilityRegistrationEnabled ? v : false,
    });
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-col items-start">
        <h2 className="text-2xl font-bold">{stepTitle}</h2>
        <p className="text-sm text-stone-600">{stepSubtitle}</p>
      </CardHeader>

      {step === "name" && (
        <form onSubmit={handleNameNext}>
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
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="flat" onPress={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" color="primary" className="flex-1">
              Continue
            </Button>
          </CardFooter>
        </form>
      )}

      {step === "activities" && (
        <>
          <CardBody className="gap-4">
            {error && (
              <div className="p-3 bg-danger-50 text-danger border border-danger-200 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Checkbox
                isSelected={activities.funDogShow}
                onValueChange={(v) =>
                  setActivities((a) => ({ ...a, funDogShow: v }))
                }
              >
                <span className="flex flex-col gap-0.5">
                  <span>Fun dog show classes</span>
                  <span className="text-sm text-stone-600 font-normal">£2 per each</span>
                </span>
              </Checkbox>
              <Checkbox
                isSelected={activities.splashPool}
                onValueChange={(v) =>
                  setActivities((a) => ({ ...a, splashPool: v }))
                }
              >
                <span className="flex flex-col gap-0.5">
                  <span>Splash pool session</span>
                  <span className="text-sm text-stone-600 font-normal">£5 for 10 minutes</span>
                </span>
              </Checkbox>
              {agilityRegistrationEnabled && (
                <Checkbox
                  isSelected={activities.agility}
                  onValueChange={(v) =>
                    setActivities((a) => ({ ...a, agility: v }))
                  }
                >
                  Agility session
                </Checkbox>
              )}
              <Checkbox
                isSelected={allActivitiesSelected}
                onValueChange={handleSelectAll}
              >
                Select all
              </Checkbox>
            </div>
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="flat" onPress={() => setStep("name")} className="flex-1">
              Back
            </Button>
            <Button color="primary" onPress={handleActivitiesNext} className="flex-1">
              Continue
            </Button>
          </CardFooter>
        </>
      )}

      {step === "details" && (
        <form onSubmit={handleDetailsSubmit}>
          <CardBody className="gap-4">
            {error && (
              <div className="p-3 bg-danger-50 text-danger border border-danger-200 rounded-lg text-sm">
                {error}
              </div>
            )}

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

            <Switch isSelected={isRescue} onValueChange={setIsRescue}>
              <div className="flex flex-col">
                <span>Rescue dog</span>
                <span className="text-xs text-stone-600">
                  Is this dog from a rescue shelter or charity?
                </span>
              </div>
            </Switch>
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="flat" type="button" onPress={() => setStep("activities")} className="flex-1">
              Back
            </Button>
            <Button type="submit" color="primary" className="flex-1">
              {editingDog ? "Save Changes" : "Add Dog"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
