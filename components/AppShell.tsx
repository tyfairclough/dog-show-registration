"use client";

import { HeroUIProvider } from "@heroui/system";
import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";

/**
 * Full chrome under HeroUIProvider. Loaded with `dynamic(..., { ssr: false })` in the root layout
 * so dev SSR does not hit HeroUI + Next 14 app-router issues (undefined element type in RSC flight).
 */
export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeroUIProvider>
      <Navigation />
      <div className="flex min-h-screen flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </HeroUIProvider>
  );
}
