"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from "@heroui/react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/admin');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to admin page
        const redirect = searchParams.get('redirect') || '/admin';
        router.push(redirect);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-gray-500">Essex Therapy Dogs - Back Office</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="gap-4">
            {error && (
              <div className="p-3 bg-danger-50 text-danger border border-danger-200 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              isRequired
              autoComplete="username"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              isRequired
              autoComplete="current-password"
            />
          </CardBody>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Login
            </Button>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </CardHeader>
        </Card>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
