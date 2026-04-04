"use client";

import Link from "next/link";
import { Navbar, NavbarBrand } from "@heroui/react";

export default function Navigation() {
  return (
    <Navbar
      isBordered
      height="100px"
      classNames={{
        base:
          "bg-[var(--etd-primary)] text-primary-foreground border-b border-white/15 backdrop-blur-sm !h-[var(--navbar-height)]",
        wrapper: "!h-full !justify-center",
        brand: "gap-2 h-full !justify-center flex-grow basis-0",
        item:
          "[background:unset] [background-color:unset] data-[active=true]:[background:unset] data-[active=true]:[background-color:unset] data-[active=true]:text-primary-foreground",
      }}
    >
      <NavbarBrand>
        <Link
          href="https://www.essextherapydogs.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full items-center justify-center shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded-md"
        >
          <img
            src="/brand/essex-therapy-dogs-logo-light.svg"
            alt="Essex Therapy Dogs"
            className="h-16 w-auto max-w-[200px] object-contain object-center"
            width={200}
            height={64}
          />
        </Link>
      </NavbarBrand>
    </Navbar>
  );
}
