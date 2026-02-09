import Link from "next/link";
import { Button } from "@heroui/react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <h1 className="text-5xl font-bold text-center">
            Essex Therapy Dogs
          </h1>
          <h2 className="text-3xl font-semibold text-center text-primary">
            Fun Dog Show Registration
          </h2>
          <p className="text-lg text-center text-gray-600 max-w-2xl">
            Welcome to the registration system for the Essex Therapy Dogs Fun Dog Show.
            View available classes and register your dogs, or access the administrator portal.
          </p>
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex gap-4">
              <Link href="/register">
                <Button color="primary" size="lg">
                  Register Your Dog
                </Button>
              </Link>
              <Link href="/admin">
                <Button color="secondary" variant="bordered" size="lg">
                  Admin Portal
                </Button>
              </Link>
            </div>
            <Link href="/register/retrieve" className="text-sm text-gray-500 hover:text-primary">
              Already registered? Retrieve your registration →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
