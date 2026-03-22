import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";
import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";
import { DevResourceErrorLogger } from "@/components/dev/DevResourceErrorLogger";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Essex Therapy Dogs - Fun Dog Show Registration",
  description: "Register your dog for the Essex Therapy Dogs Fun Dog Show",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        {process.env.NODE_ENV === "development" ? (
          <DevResourceErrorLogger />
        ) : null}
        <HeroUIProvider>
          <Navigation />
          <div className="flex min-h-screen flex-col">
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <SiteFooter />
          </div>
        </HeroUIProvider>
      </body>
    </html>
  );
}
