import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { Montserrat } from "next/font/google";
import "./globals.css";

/* HeroUIProvider in the RSC tree triggers dev SSR "Element type is invalid … undefined"
 * (see heroui-inc/heroui#5756). Client-only shell avoids that while keeping provider + chrome. */
const AppShell = nextDynamic(() => import("@/components/AppShell"), {
  ssr: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Essex Therapy Dogs - Fun Dog Show Registration",
  description: "Register your dog for the Essex Therapy Dogs Fun Dog Show",
};

/** Avoid static prerender failures with HeroUI + Next 14.2.30+ (heroui-inc/heroui#5756). */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
