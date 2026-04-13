"use client";

import { useState, useEffect } from "react";
import { Button, Progress, Card, CardBody, Checkbox } from "@heroui/react";
import Link from "next/link";
import OwnerForm from "@/components/register/OwnerForm";
import DogForm from "@/components/register/DogForm";
import ClassCard from "@/components/register/ClassCard";
import { DogClass, DogFormData, Owner } from "@/types";

type Step = "owner" | "dogs" | "classes" | "review";

function dogNeedsPoolWaiver(d: DogFormData): boolean {
  return d.activities.splashPool || d.activities.agility;
}

function anyDogNeedsWaiver(dogs: DogFormData[]): boolean {
  return dogs.some(dogNeedsPoolWaiver);
}

function activitySummary(d: DogFormData): string[] {
  const parts: string[] = [];
  if (d.activities.funDogShow) parts.push("Fun dog show");
  if (d.activities.splashPool) parts.push("Splash pool");
  if (d.activities.agility) parts.push("Agility");
  return parts;
}

export default function RegisterPage() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [dogs, setDogs] = useState<DogFormData[]>([]);
  const [currentDogIndex, setCurrentDogIndex] = useState<number | null>(null);
  const [isAddingDog, setIsAddingDog] = useState(false);

  const [classes, setClasses] = useState<DogClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectingClassesForDog, setSelectingClassesForDog] = useState<number | null>(null);

  const [step, setStep] = useState<Step>("owner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [retrievalToken, setRetrievalToken] = useState<string | null>(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);

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

  useEffect(() => {
    setWaiverAccepted(false);
  }, [dogs]);

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

  const handleDogSubmit = (dog: DogFormData) => {
    let nextDogs: DogFormData[];
    let dogIndex: number;

    if (currentDogIndex !== null) {
      nextDogs = [...dogs];
      nextDogs[currentDogIndex] = { ...dog, id: dogs[currentDogIndex].id };
      dogIndex = currentDogIndex;
    } else {
      dogIndex = dogs.length;
      nextDogs = [...dogs, { ...dog, id: dog.id ?? `temp-${Date.now()}` }];
    }

    setDogs(nextDogs);
    setIsAddingDog(false);
    setCurrentDogIndex(null);

    if (dog.activities.funDogShow) {
      setSelectingClassesForDog(dogIndex);
      setStep("classes");
    } else {
      setSelectingClassesForDog(null);
      setStep("review");
    }
  };

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

  const handleRemoveClass = (dogIndex: number, classId: string) => {
    const newDogs = [...dogs];
    newDogs[dogIndex].selectedClasses = newDogs[dogIndex].selectedClasses.filter(
      (id) => id !== classId
    );
    setDogs(newDogs);
  };

  const handleEditDog = (index: number) => {
    setCurrentDogIndex(index);
    setIsAddingDog(true);
    setStep("dogs");
  };

  const handleRemoveDog = (index: number) => {
    setDogs(dogs.filter((_, i) => i !== index));
  };

  const handleAddAnotherDog = () => {
    setCurrentDogIndex(null);
    setIsAddingDog(true);
    setStep("dogs");
  };

  const handleFinishClassSelection = () => {
    setSelectingClassesForDog(null);
    setStep("review");
  };

  const needsWaiver = anyDogNeedsWaiver(dogs);
  const canSubmit =
    dogs.length > 0 &&
    dogs.every((d) => {
      const hasActivity =
        d.activities.funDogShow ||
        d.activities.splashPool ||
        d.activities.agility;
      if (!hasActivity) return false;
      if (d.activities.funDogShow && d.selectedClasses.length === 0) return false;
      return true;
    }) &&
    (!needsWaiver || waiverAccepted);

  const handleSubmit = async () => {
    if (!owner || !canSubmit) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      for (const dog of dogs) {
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
            activityFunShow: dog.activities.funDogShow,
            activitySplashPool: dog.activities.splashPool,
            activityAgility: dog.activities.agility,
          }),
        });

        if (!dogResponse.ok) {
          throw new Error("Failed to create dog");
        }

        const createdDog = await dogResponse.json();

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

      const submitResponse = await fetch("/api/registrations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: owner.id,
          ownerName: ownerName,
          ownerEmail: ownerEmail,
          waiverAccepted: needsWaiver ? true : undefined,
        }),
      });

      if (!submitResponse.ok) {
        const errBody = await submitResponse.json().catch(() => ({}));
        if (errBody?.error) {
          throw new Error(errBody.error);
        }
        throw new Error("Failed to finalize registration");
      }

      const submitJson = (await submitResponse.json()) as { retrievalToken?: string };
      setRetrievalToken(
        submitJson.retrievalToken ?? owner.retrieval_token ?? null
      );
      setSubmitSuccess(true);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgress = () => {
    switch (step) {
      case "owner":
        return 25;
      case "dogs":
        return 50;
      case "classes":
        return 75;
      case "review":
        return 100;
      default:
        return 0;
    }
  };

  if (submitSuccess) {
    return (
      <main className="bg-cream-100 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center py-12">
            <CardBody className="gap-6">
              <div className="text-6xl">🎉</div>
              <h1 className="text-3xl font-bold text-success">Registration Complete!</h1>
              <p className="text-stone-700">
                Thank you for registering for the Essex Therapy Dogs Fun Dog Show.
              </p>
              <p className="text-stone-700">
                A confirmation has been sent to <strong>{ownerEmail}</strong>.
              </p>
              <p className="text-sm text-stone-600">
                You can retrieve your registration anytime by entering your email on our website.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <Link href="/">
                  <Button variant="flat">Back to Home</Button>
                </Link>
                <Link href="/register/retrieve">
                  <Button color="primary">View My Registration</Button>
                </Link>
                {(retrievalToken || owner?.retrieval_token) && (
                  <Button
                    variant="bordered"
                    onPress={() => {
                      const t = retrievalToken ?? owner?.retrieval_token;
                      if (!t) return;
                      window.open(
                        `/api/registration-forms/print?token=${encodeURIComponent(t)}&autoPrint=1`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    Print all my registration forms
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    );
  }

  const classStepDog =
    selectingClassesForDog !== null ? dogs[selectingClassesForDog] : null;

  return (
    <main className="bg-cream-100 py-12">
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
            <p className="text-stone-700">
              Sign up for the Essex Therapy Dogs Fun Dog Show
            </p>
          </div>

          <div className="mb-8">
            <Progress
              value={getProgress()}
              color="primary"
              className="h-2"
              aria-label="Registration progress"
            />
            <div className="flex justify-between mt-2 text-sm text-stone-600">
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

          {step === "owner" && (
            <OwnerForm
              onSubmit={handleOwnerSubmit}
              initialName={ownerName}
              initialEmail={ownerEmail}
            />
          )}

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

          {step === "classes" && selectingClassesForDog !== null && classStepDog && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    Select Classes for {classStepDog.name}
                  </h2>
                  <p className="text-stone-600">
                    Choose which classes your dog should enter
                  </p>
                </div>
                <Button color="primary" onPress={handleFinishClassSelection}>
                  Done Selecting
                </Button>
              </div>

              {classesLoading ? (
                <p className="text-center py-8 text-stone-600">Loading classes...</p>
              ) : classes.length === 0 ? (
                <Card className="text-center py-8">
                  <CardBody>
                    <p className="text-stone-600">
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
                      dog={classStepDog}
                      isSelected={classStepDog.selectedClasses.includes(dogClass.id)}
                      onToggle={() => handleClassToggle(dogClass.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Contact Details</h3>
                        <p className="text-stone-700">{ownerName}</p>
                        <p className="text-stone-600 text-sm">{ownerEmail}</p>
                      </div>
                      <Button size="sm" variant="flat" onPress={() => setStep("owner")}>
                        Edit
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                <h2 className="text-xl font-bold mb-4">Your dogs & activities</h2>

                {dogs.map((dog, index) => (
                  <Card key={dog.id} className="mb-4">
                    <CardBody>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🐕</span>
                          <div>
                            <h3 className="font-semibold text-lg">{dog.name}</h3>
                            <p className="text-sm text-stone-600">
                              {activitySummary(dog).join(" · ")}
                            </p>
                            {dog.activities.funDogShow &&
                              dog.breed !== undefined &&
                              dog.age !== undefined &&
                              dog.sex !== undefined && (
                                <p className="text-sm text-stone-600 mt-1">
                                  {dog.breed} • {dog.age} year{dog.age !== 1 ? "s" : ""} • {dog.sex}
                                  {dog.isRescue ? " • rescue" : ""}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {dog.activities.funDogShow && (
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => {
                                setSelectingClassesForDog(index);
                                setStep("classes");
                              }}
                            >
                              Edit classes
                            </Button>
                          )}
                          <Button size="sm" variant="flat" onPress={() => handleEditDog(index)}>
                            Edit dog
                          </Button>
                        </div>
                      </div>

                      {dog.activities.funDogShow && dog.selectedClasses.length === 0 && (
                        <p className="text-warning text-sm bg-warning-50 p-2 rounded">
                          Select at least one class for the fun dog show
                        </p>
                      )}

                      {dog.activities.funDogShow && dog.selectedClasses.length > 0 && (
                        <div className="space-y-2">
                          {dog.selectedClasses.map((classId) => {
                            const c = classes.find((cl) => cl.id === classId);
                            if (!c) return null;

                            const feeNumber =
                              typeof c.fee === "number" ? c.fee : Number(c.fee ?? 0);
                            const formattedFee = Number.isFinite(feeNumber)
                              ? feeNumber.toFixed(2)
                              : "0.00";

                            return (
                              <div
                                key={classId}
                                className="flex justify-between items-center bg-cream-200/80 p-2 rounded border border-cream-300/50"
                              >
                                <span>{c.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-primary">£{formattedFee}</span>
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

                {needsWaiver && (
                  <Card className="mb-4 border border-stone-300">
                    <CardBody className="gap-3">
                      <h3 className="font-semibold text-lg">Activity waiver</h3>
                      <div
                        className="h-28 overflow-y-auto rounded-md border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-stone-700 leading-relaxed"
                        tabIndex={0}
                        role="region"
                        aria-label="Agility course disclaimer"
                      >
                        <p>
                          Participation in the agility course is entirely voluntary and undertaken at
                          your own risk.
                        </p>
                        <p className="mt-2 font-medium">By taking part, participants confirm that:</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          <li>
                            They are responsible for ensuring their dog is fit, healthy, and suitable
                            to take part in physical activity.
                          </li>
                          <li>
                            Their dog is under control at all times and able to interact safely with
                            people and other dogs.
                          </li>
                          <li>
                            They will follow all instructions provided by event organisers and
                            volunteers.
                          </li>
                        </ul>
                        <p className="mt-2 font-medium">
                          The organisers, volunteers, and hosting venue accept no liability for:
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          <li>
                            Injury, loss, or damage to persons, dogs, or property arising from
                            participation in the agility course.
                          </li>
                          <li>
                            Any incidents resulting from failure to follow instructions or control a
                            dog appropriately.
                          </li>
                        </ul>
                        <p className="mt-2 font-medium">Owners/handlers are fully responsible for:</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          <li>Their dog&apos;s behaviour at all times.</li>
                          <li>Cleaning up after their dog.</li>
                          <li>Ensuring their dog does not pose a risk to others.</li>
                        </ul>
                        <p className="mt-2">
                          Children must be supervised by a responsible adult at all times while using
                          or near the agility course.
                        </p>
                        <p className="mt-2">
                          The organisers reserve the right to refuse participation or ask any
                          participant to leave the activity area if they believe there is a risk to
                          safety.
                        </p>
                        <p className="mt-2">
                          I can confirm I have read and understand this Agility Course Disclaimer
                          and the risks associated with it.
                        </p>
                      </div>
                      <Checkbox isSelected={waiverAccepted} onValueChange={setWaiverAccepted}>
                        I have read and agree to the waiver for splash pool and/or agility
                        activities
                      </Checkbox>
                    </CardBody>
                  </Card>
                )}

                <Button variant="flat" className="w-full" onPress={handleAddAnotherDog}>
                  + Add another dog
                </Button>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardBody className="gap-4">
                    <h3 className="font-bold text-lg">Registration summary</h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Dogs:</span>
                        <span>{dogs.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Show classes:</span>
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
                          {(() => {
                            const total = dogs.reduce((totalAcc, dog) => {
                              return (
                                totalAcc +
                                dog.selectedClasses.reduce((sum, classId) => {
                                  const c = classes.find((cl) => cl.id === classId);
                                  if (!c) return sum;

                                  const feeNumber =
                                    typeof c.fee === "number" ? c.fee : Number(c.fee ?? 0);
                                  return sum + (Number.isFinite(feeNumber) ? feeNumber : 0);
                                }, 0)
                              );
                            }, 0);

                            return Number.isFinite(total) ? total.toFixed(2) : "0.00";
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">Fees collected at the event</p>
                    </div>

                    <Button
                      color="primary"
                      size="lg"
                      className="w-full"
                      isDisabled={!canSubmit}
                      isLoading={isSubmitting}
                      onPress={handleSubmit}
                    >
                      Submit registration
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
