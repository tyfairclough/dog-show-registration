import Link from "next/link";
import { Button } from "@heroui/react";

export default function Home() {
  return (
    <main className="bg-cream-100">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium uppercase tracking-widest text-primary-600">
              Comfort, connection & calm
            </p>
            <h1 className="text-5xl font-bold text-[var(--etd-primary)]">
              Essex Therapy Dogs
            </h1>
          </div>
          <h2 className="text-3xl font-semibold text-center text-secondary-600">
            Fun Dog Show Registration
          </h2>
          <p className="text-lg text-center text-stone-600 max-w-2xl">
            Welcome to the registration system for the Essex Therapy Dogs Fun Dog Show.
            View available classes and register your dogs.
          </p>
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex gap-4">
              <Link href="/register">
                <Button color="primary" size="lg">
                  Register Your Dog
                </Button>
              </Link>
            </div>
            <Link href="/register/retrieve" className="text-sm text-stone-600 hover:text-primary-600">
              Already registered? Retrieve your registration →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
