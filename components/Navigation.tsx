"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <Navbar isBordered>
      <NavbarBrand>
        <Link href="/" className="font-bold text-xl">
          Essex Therapy Dogs
        </Link>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem isActive={pathname === "/register"}>
          <Link href="/register" className={pathname === "/register" ? "text-primary" : ""}>
            Register
          </Link>
        </NavbarItem>
        <NavbarItem isActive={pathname === "/admin"}>
          <Link href="/admin" className={pathname === "/admin" ? "text-primary" : ""}>
            Admin
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Link href="/register">
            <Button as="span" color="primary" variant="flat">
              Register Your Dog
            </Button>
          </Link>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
