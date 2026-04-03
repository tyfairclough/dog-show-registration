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
        wrapper: "!h-full",
        brand: "gap-2 h-full",
        item:
          "[background:unset] [background-color:unset] data-[active=true]:[background:unset] data-[active=true]:[background-color:unset] data-[active=true]:text-primary-foreground",
      }}
    >
      <NavbarBrand>
        <Link
          href="/"
          className="flex h-full w-full items-center shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded-md"
        >
          <img
            src="/brand/essex-therapy-dogs-logo-light.svg"
            alt="Essex Therapy Dogs"
            className="h-16 w-auto max-w-[200px] object-contain object-left"
            width={200}
            height={64}
          />
        </Link>
      </NavbarBrand>
    </Navbar>
  );
}
