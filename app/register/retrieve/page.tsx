"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Chip,
} from "@heroui/react";
import Link from "next/link";
import { Owner, Dog } from "@/types";

interface RegistrationData {
  owner: Owner;
  dogs: Dog[];
  registrations: {
    id: string;
    dog_id: string;
    class_id: string;
    status: string;
    created_at: string;
    dog_name: string;
    dog_breed: string | null;
    class_name: string;
    class_fee: number;
  }[];
}

function activityLabels(dog: Dog): string[] {
  const parts: string[] = [];
  if (dog.activity_fun_show === 1) parts.push("Fun dog show");
  if (dog.activity_splash_pool === 1) parts.push("Splash pool");
  if (dog.activity_agility === 1) parts.push("Agility");
  return parts;
}

function RetrieveContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<RegistrationData | null>(null);

  // Auto-fetch if token is in URL
  useEffect(() => {
    if (tokenFromUrl) {
      fetchByToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const fetchByToken = async (token: string) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/owners?token=${encodeURIComponent(token)}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError("Invalid or expired link. Please try using your email address.");
      }
    } catch (err) {
      setError("Failed to retrieve registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/owners?email=${encodeURIComponent(email.trim())}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 404) {
        setError("No registration found for this email address.");
      } else {
        setError("Failed to retrieve registration. Please try again.");
      }
    } catch (err) {
      setError("Failed to retrieve registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalFee = data?.registrations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.class_fee, 0) || 0;

  if (data) {
    return (
      <main className="bg-cream-100 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8">
            <Link href="/">
              <Button variant="light" size="sm">
                ← Back to Home
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader className="flex flex-col items-start gap-1">
              <h1 className="text-2xl font-bold">Your Registration</h1>
              <p className="text-sm text-stone-600">
                {data.owner.name} • {data.owner.email}
              </p>
            </CardHeader>
            <CardBody className="gap-6">
              {data.dogs.map((dog) => {
                const regs = data.registrations.filter((r) => r.dog_id === dog.id);
                return (
                  <div key={dog.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🐕</span>
                      <div>
                        <h3 className="font-semibold">{dog.name}</h3>
                        <p className="text-sm text-stone-600">
                          {activityLabels(dog).join(" · ")}
                        </p>
                        {dog.breed ? (
                          <span className="text-sm text-stone-600 block mt-0.5">{dog.breed}</span>
                        ) : null}
                      </div>
                    </div>
                    {regs.length === 0 ? (
                      <p className="text-sm text-stone-600 bg-cream-100 rounded p-2">
                        No fun dog show class entries (splash pool / agility only, or classes pending).
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {regs.map((reg) => (
                          <div
                            key={reg.id}
                            className="flex items-center justify-between bg-cream-200/80 p-2 rounded border border-cream-300/50"
                          >
                            <span>{reg.class_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-primary">
                                £
                                {typeof reg.class_fee === "number"
                                  ? reg.class_fee.toFixed(2)
                                  : Number(reg.class_fee).toFixed(2)}
                              </span>
                              <Chip
                                size="sm"
                                color={
                                  reg.status === "confirmed"
                                    ? "success"
                                    : reg.status === "cancelled"
                                      ? "danger"
                                      : "warning"
                                }
                                variant="flat"
                              >
                                {reg.status}
                              </Chip>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-medium">Total to pay on the day:</span>
                <span className="text-xl font-bold text-primary">
                  £{totalFee.toFixed(2)}
                </span>
              </div>
            </CardBody>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                variant="bordered"
                className="w-full sm:flex-1 sm:min-w-[200px]"
                isDisabled={!data.owner.retrieval_token}
                onPress={() => {
                  const t = data.owner.retrieval_token;
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
              <Link href="/register" className="w-full sm:flex-1 sm:min-w-[200px]">
                <Button variant="flat" className="w-full">
                  Add More Dogs
                </Button>
              </Link>
              <Button
                color="primary"
                className="w-full sm:flex-1 sm:min-w-[200px]"
                onPress={() => {
                  setData(null);
                  setEmail("");
                }}
              >
                Look Up Different Email
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream-100 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="mb-8">
          <Link href="/">
            <Button variant="light" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold">Retrieve Your Registration</h1>
            <p className="text-sm text-stone-600">
              Enter the email you used to register
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
                label="Email Address"
                placeholder="e.g., john@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                autoComplete="email"
              />
            </CardBody>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Find My Registration
              </Button>
              <Link href="/register" className="text-sm text-stone-600 hover:text-primary-700">
                Don&apos;t have a registration? Register now →
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function RetrievePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-[calc(100dvh-100px)] items-center justify-center bg-cream-100">
        <p className="text-stone-600">Loading...</p>
      </main>
    }>
      <RetrieveContent />
    </Suspense>
  );
}
