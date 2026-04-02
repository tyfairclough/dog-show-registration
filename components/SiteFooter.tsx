import Link from "next/link";
import { Button } from "@heroui/react";
import FooterWave from "@/components/FooterWave";

export default function SiteFooter() {
  return (
    <>
      <FooterWave />
      <footer
        className="bg-[var(--etd-teal)] text-white"
        aria-label="Site footer"
      >
        <div className="mx-auto max-w-[1024px] px-6 py-10">
          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            <div className="text-sm text-white/90">
              <p>
                © Essex Therapy Dogs{" "}
                <span className="text-white/60" aria-hidden>
                  |
                </span>{" "}
                Another website designed by{" "}
                <a
                  href="https://www.onefoursix.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white underline decoration-white/50 underline-offset-2 transition hover:decoration-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--etd-teal)]"
                >
                  onefoursix
                </a>
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/90">
              <p className="font-medium text-white">
                Registered Charity No: 1215433
              </p>
              <p className="text-white/85">
                Essex Therapy Dogs is an independent charity and not affiliated
                with Pets As Therapy.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-sm text-white/90">
              <p>You can also find us on Facebook and Instagram</p>
              <div>
                <Link href="/admin">
                  <Button
                    as="span"
                    color="primary"
                    className="font-semibold"
                  >
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
