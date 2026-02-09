"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Progress, Card, CardBody } from "@heroui/react";
import Link from "next/link";
import OwnerForm from "@/components/register/OwnerForm";
import DogForm from "@/components/register/DogForm";
import ClassCard from "@/components/register/ClassCard";
import RegistrationCart from "@/components/register/RegistrationCart";
import { DogClass, DogFormData, Owner } from "@/types";

type Step = "owner" | "dogs" | "classes" | "review";

export default function RegisterPage() {
  // Owner state
  const [owner, setOwner] = useState<Owner | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Dogs state
  const [dogs, setDogs] = useState<DogFormData[]>([]);
  const [currentDogIndex, setCurrentDogIndex] = useState<number | null>(null);
  const [isAddingDog, setIsAddingDog] = useState(false);

  // Classes state
  const [classes, setClasses] = useState<DogClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectingClassesForDog, setSelectingClassesForDog] = useState<number | null>(null);

  // Flow state
  const [step, setStep] = useState<Step>("owner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Fetch classes on mount
  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setClassesLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch classes:", err);
        setClassesLoading(false);
      });
  }, []);

  // Handle owner form submission
  const handleOwnerSubmit = async (name: string, email: string) => {
    const response = await fetch("/api/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (response.ok) {
      const ownerData = await response.json();
      setOwner(ownerData);
      setOwnerName(name);
      setOwnerEmail(email);
      setStep("dogs");
      setIsAddingDog(true);
    } else {
      throw new Error("Failed to create owner");
    }
  };

  // Handle dog form submission
  const handleDogSubmit = (dog: DogFormData) => {
    if (currentDogIndex !== null) {
      // Editing existing dog
      const newDogs = [...dogs];
      newDogs[currentDogIndex] = { ...dog, id: dogs[currentDogIndex].id };
      setDogs(newDogs);
    } else {
      // Adding new dog
      setDogs([...dogs, { ...dog, id: `temp-${Date.now()}` }]);
    }
    setIsAddingDog(false);
    setCurrentDogIndex(null);
    
    // Go to class selection for this dog
    const dogIndex = currentDogIndex ?? dogs.length;
    setSelectingClassesForDog(dogIndex);
    setStep("classes");
  };

  // Handle class toggle for a dog
  const handleClassToggle = (classId: string) => {
    if (selectingClassesForDog === null) return;

    const newDogs = [...dogs];
    const dog = newDogs[selectingClassesForDog];
    
    if (dog.selectedClasses.includes(classId)) {
      dog.selectedClasses = dog.selectedClasses.filter((id) => id !== classId);
    } else {
      dog.selectedClasses = [...dog.selectedClasses, classId];
    }
    
    setDogs(newDogs);
  };

  // Handle removing a class from a dog
  const handleRemoveClass = (dogIndex: number, classId: string) => {
    const newDogs = [...dogs];
    newDogs[dogIndex].selectedClasses = newDogs[dogIndex].selectedClasses.filter(
      (id) => id !== classId
    );
    setDogs(newDogs);
  };

  // Handle editing a dog
  const handleEditDog = (index: number) => {
    setCurrentDogIndex(index);
    setIsAddingDog(true);
    setStep("dogs");
  };

  // Handle removing a dog
  const handleRemoveDog = (index: number) => {
    setDogs(dogs.filter((_, i) => i !== index));
  };

  // Handle adding another dog
  const handleAddAnotherDog = () => {
    setCurrentDogIndex(null);
    setIsAddingDog(true);
    setStep("dogs");
  };

  // Finish class selection and go to review
  const handleFinishClassSelection = () => {
    setSelectingClassesForDog(null);
    setStep("review");
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!owner) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Create dogs and registrations
      for (const dog of dogs) {
        // Create dog in database
        const dogResponse = await fetch("/api/dogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId: owner.id,
            name: dog.name,
            breed: dog.breed,
            age: dog.age,
            sex: dog.sex,
            isRescue: dog.isRescue,
          }),
        });

        if (!dogResponse.ok) {
          throw new Error("Failed to create dog");
        }

        const createdDog = await dogResponse.json();

        // Create registrations for each selected class
        for (const classId of dog.selectedClasses) {
          const regResponse = await fetch("/api/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dogId: createdDog.id,
              classId,
            }),
          });

          if (!regResponse.ok) {
            const error = await regResponse.json();
            console.error("Registration error:", error);
          }
        }
      }

      // Submit and send confirmation email
      await fetch("/api/registrations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: owner.id,
          ownerName: ownerName,
          ownerEmail: ownerEmail,
        }),
      });

      setSubmitSuccess(true);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress
  const getProgress = () => {
    switch (step) {
      case "owner": return 25;
      case "dogs": return 50;
      case "classes": return 75;
      case "review": return 100;
      default: return 0;
    }
  };

  // Success screen
  if (submitSuccess) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center py-12">
            <CardBody className="gap-6">
              <div className="text-6xl">🎉</div>
              <h1 className="text-3xl font-bold text-success">Registration Complete!</h1>
              <p className="text-gray-600">
                Thank you for registering for the Essex Therapy Dogs Fun Dog Show.
              </p>
              <p className="text-gray-600">
                A confirmation has been sent to <strong>{ownerEmail}</strong>.
              </p>
              <p className="text-sm text-gray-500">
                You can retrieve your registration anytime by entering your email on our website.
              </p>
              <div className="flex gap-4 justify-center mt-4">
                <Link href="/">
                  <Button variant="flat">Back to Home</Button>
                </Link>
                <Link href="/register/retrieve">
                  <Button color="primary">View My Registration</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link href="/">
            <Button variant="light" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Register Your Dog</h1>
            <p className="text-gray-600">
              Sign up for the Essex Therapy Dogs Fun Dog Show
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <Progress
              value={getProgress()}
              color="primary"
              className="h-2"
              aria-label="Registration progress"
            />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span className={step === "owner" ? "text-primary font-medium" : ""}>
                Your Details
              </span>
              <span className={step === "dogs" ? "text-primary font-medium" : ""}>
                Add Dogs
              </span>
              <span className={step === "classes" ? "text-primary font-medium" : ""}>
                Select Classes
              </span>
              <span className={step === "review" ? "text-primary font-medium" : ""}>
                Review
              </span>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-danger-50 text-danger border border-danger-200 rounded-lg">
              {submitError}
            </div>
          )}

          {/* Step: Owner details */}
          {step === "owner" && (
            <OwnerForm
              onSubmit={handleOwnerSubmit}
              initialName={ownerName}
              initialEmail={ownerEmail}
            />
          )}

          {/* Step: Add/Edit dog */}
          {step === "dogs" && isAddingDog && (
            <DogForm
              onSubmit={handleDogSubmit}
              onCancel={() => {
                setIsAddingDog(false);
                setCurrentDogIndex(null);
                if (dogs.length > 0) {
                  setStep("review");
                }
              }}
              editingDog={currentDogIndex !== null ? dogs[currentDogIndex] : null}
            />
          )}

          {/* Step: Select classes for dog */}
          {step === "classes" && selectingClassesForDog !== null && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    Select Classes for {dogs[selectingClassesForDog]?.name}
                  </h2>
                  <p className="text-gray-500">
                    Choose which classes your dog should enter
                  </p>
                </div>
                <Button color="primary" onPress={handleFinishClassSelection}>
                  Done Selecting
                </Button>
              </div>

              {classesLoading ? (
                <p className="text-center py-8 text-gray-500">Loading classes...</p>
              ) : classes.length === 0 ? (
                <Card className="text-center py-8">
                  <CardBody>
                    <p className="text-gray-500">
                      No classes are currently available. Please check back later.
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {classes.map((dogClass) => (
                    <ClassCard
                      key={dogClass.id}
                      dogClass={dogClass}
                      dog={dogs[selectingClassesForDog]}
                      isSelected={dogs[selectingClassesForDog].selectedClasses.includes(
                        dogClass.id
                      )}
                      onToggle={() => handleClassToggle(dogClass.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Review */}
          {step === "review" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Contact Details</h3>
                        <p className="text-gray-600">{ownerName}</p>
                        <p className="text-gray-500 text-sm">{ownerEmail}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setStep("owner")}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                <h2 className="text-xl font-bold mb-4">Your Dogs & Classes</h2>
                
                {dogs.map((dog, index) => (
                  <Card key={dog.id} className="mb-4">
                    <CardBody>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🐕</span>
                          <div>
                            <h3 className="font-semibold text-lg">{dog.name}</h3>
                            <p className="text-sm text-gray-500">
                              {dog.breed} • {dog.age} year{dog.age !== 1 ? "s" : ""} • {dog.sex}
                              {dog.isRescue ? " • rescue" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setSelectingClassesForDog(index);
                              setStep("classes");
                            }}
                          >
                            Edit Classes
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => handleEditDog(index)}
                          >
                            Edit Dog
                          </Button>
                        </div>
                      </div>

                      {dog.selectedClasses.length === 0 ? (
                        <p className="text-warning text-sm bg-warning-50 p-2 rounded">
                          No classes selected
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {dog.selectedClasses.map((classId) => {
                            const c = classes.find((cl) => cl.id === classId);
                            if (!c) return null;
                            return (
                              <div
                                key={classId}
                                className="flex justify-between items-center bg-gray-50 p-2 rounded"
                              >
                                <span>{c.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-primary">£{c.fee.toFixed(2)}</span>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    isIconOnly
                                    onPress={() => handleRemoveClass(index, classId)}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}

                <Button
                  variant="flat"
                  className="w-full"
                  onPress={handleAddAnotherDog}
                >
                  + Add Another Dog
                </Button>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardBody className="gap-4">
                    <h3 className="font-bold text-lg">Registration Summary</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Dogs:</span>
                        <span>{dogs.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total classes:</span>
                        <span>
                          {dogs.reduce((s, d) => s + d.selectedClasses.length, 0)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total on the day:</span>
                        <span className="text-primary">
                          £
                          {dogs
                            .reduce((total, dog) => {
                              return (
                                total +
                                dog.selectedClasses.reduce((sum, classId) => {
                                  const c = classes.find((cl) => cl.id === classId);
                                  return sum + (c?.fee || 0);
                                }, 0)
                              );
                            }, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Fees collected at the event
                      </p>
                    </div>

                    <Button
                      color="primary"
                      size="lg"
                      className="w-full"
                      isDisabled={
                        dogs.length === 0 ||
                        dogs.every((d) => d.selectedClasses.length === 0)
                      }
                      isLoading={isSubmitting}
                      onPress={handleSubmit}
                    >
                      Submit Registration
                    </Button>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
