"use client";

import { useEffect, useState } from "react";
import { RegistrationWithDetails } from "@/types";
import {
  groupRegistrationsByOwner,
  GroupedRegistration,
} from "@/lib/registrationGrouping";

export default function AdminPrintRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/registrations");
        if (!response.ok) {
          throw new Error("Failed to fetch registrations");
        }
        const data = (await response.json()) as RegistrationWithDetails[];
        setRegistrations(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error loading registrations"
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!isLoading && !error && registrations.length > 0) {
      // Allow the browser a tick to render before opening the dialog
      const id = window.setTimeout(() => {
        window.print();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [isLoading, error, registrations.length]);

  const grouped: GroupedRegistration[] = groupRegistrationsByOwner(registrations);

  return (
    <main className="admin-print-registrations">
      <header className="admin-print-header no-print-screen">
        <h1>All registrations (print view)</h1>
        <p>This view is optimised for printing. Use your browser&apos;s print function.</p>
      </header>

      {isLoading && (
        <div className="admin-print-message">Loading registrations…</div>
      )}

      {error && !isLoading && (
        <div className="admin-print-message error">
          Failed to load registrations: {error}
        </div>
      )}

      {!isLoading && !error && registrations.length === 0 && (
        <div className="admin-print-message">No registrations to print.</div>
      )}

      <section>
        {grouped.map((owner, index) => (
          <article
            key={owner.ownerId}
            className="print-owner-record"
            aria-label={`Registrations for ${owner.ownerName}`}
          >
            <header className="print-owner-header">
              <h2>{owner.ownerName}</h2>
              <p>{owner.ownerEmail}</p>
            </header>
            <div className="print-owner-body">
              {owner.dogs.map((dog) => (
                <section key={dog.dogId} className="print-dog-section">
                  <h3 className="print-dog-heading">
                    {dog.dogName}
                    {dog.dogBreed && <span className="print-dog-breed"> ({dog.dogBreed})</span>}
                  </h3>
                  <table className="print-registrations-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dog.registrations.map((reg) => (
                        <tr key={reg.id}>
                          <td>{reg.className}</td>
                          <td>£{reg.classFee.toFixed(2)}</td>
                          <td>{reg.status}</td>
                          <td>
                            {new Date(reg.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
            {index !== grouped.length - 1 && (
              <div className="print-owner-separator" aria-hidden="true" />
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

