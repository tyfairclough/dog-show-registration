"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from "@heroui/react";

interface OwnerFormProps {
  onSubmit: (name: string, email: string) => Promise<void>;
  initialName?: string;
  initialEmail?: string;
}

export default function OwnerForm({ onSubmit, initialName = "", initialEmail = "" }: OwnerFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(name.trim(), email.trim().toLowerCase());
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-col items-start">
        <h2 className="text-2xl font-bold">Your Details</h2>
        <p className="text-sm text-gray-500">
          Enter your contact information to register your dogs
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
            label="Your Name"
            placeholder="e.g., John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isRequired
            autoComplete="name"
          />
          <Input
            label="Email Address"
            placeholder="e.g., john@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isRequired
            autoComplete="email"
            description="We'll send your registration confirmation here"
          />
        </CardBody>
        <CardFooter>
          <Button
            type="submit"
            color="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
