import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <HeroUIProvider>
          <Navigation />
          {children}
        </HeroUIProvider>
      </body>
    </html>
  );
}
