"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Card,
  CardHeader,
  CardBody,
  Button,
} from "@heroui/react";
import { RegistrationWithDetails } from "@/types";

interface RegistrationTableProps {
  registrations: RegistrationWithDetails[];
  isLoading: boolean;
}

interface GroupedRegistration {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  dogs: {
    dogId: string;
    dogName: string;
    dogBreed: string | null;
    registrations: {
      id: string;
      className: string;
      classFee: number;
      status: string;
      createdAt: string;
    }[];
  }[];
}

export default function RegistrationTable({ registrations, isLoading }: RegistrationTableProps) {
  // #region agent log
  fetch('http://127.0.0.1:7633/ingest/496538ca-312e-46af-92d8-12ee3f2190b8', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'a31452',
    },
    body: JSON.stringify({
      sessionId: 'a31452',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'components/admin/RegistrationTable.tsx:41',
      message: 'RegistrationTable props snapshot',
      data: {
        isLoading,
        registrationsIsArray: Array.isArray(registrations),
        registrationsType: typeof registrations,
        registrationsKeys:
          registrations && typeof registrations === 'object'
            ? Object.keys(registrations as any)
            : null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  if (isLoading) {
    return <div className="text-center py-8 text-stone-600">Loading registrations...</div>;
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8 text-stone-600">
        No registrations yet. Registrations will appear here once people start signing up.
      </div>
    );
  }

  // Group registrations by owner (stable id) and dog id
  const grouped: Record<string, GroupedRegistration> = {};

  for (const reg of registrations) {
    const ownerKey = reg.owner_id;

    if (!grouped[ownerKey]) {
      grouped[ownerKey] = {
        ownerId: reg.owner_id,
        ownerName: reg.owner_name,
        ownerEmail: reg.owner_email,
        dogs: [],
      };
    }

    let dogEntry = grouped[ownerKey].dogs.find((d) => d.dogId === reg.dog_id);
    if (!dogEntry) {
      dogEntry = {
        dogId: reg.dog_id,
        dogName: reg.dog_name,
        dogBreed: reg.dog_breed,
        registrations: [],
      };
      grouped[ownerKey].dogs.push(dogEntry);
    }
    
    dogEntry.registrations.push({
      id: reg.id,
      className: reg.class_name,
      classFee: reg.class_fee,
      status: reg.status,
      createdAt: reg.created_at,
    });
  }

  const groupedList = Object.values(grouped);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {groupedList.map((owner) => (
        <Card key={owner.ownerId} className="shadow-sm">
          <CardHeader className="bg-cream-100 flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{owner.ownerName}</h3>
              <p className="text-sm text-stone-600">{owner.ownerEmail}</p>
            </div>
            <Button
              size="sm"
              variant="flat"
              className="shrink-0"
              onPress={() => {
                window.open(
                  `/api/pdf/registration-forms?ownerId=${encodeURIComponent(owner.ownerId)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              Print this owner&apos;s forms
            </Button>
          </CardHeader>
          <CardBody>
            {owner.dogs.map((dog) => (
              <div key={dog.dogId} className="mb-4 last:mb-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-2xl">🐕</span>
                  <span className="font-medium">{dog.dogName}</span>
                  {dog.dogBreed && (
                    <span className="text-sm text-stone-600">({dog.dogBreed})</span>
                  )}
                  <Button
                    size="sm"
                    variant="bordered"
                    className="ml-auto shrink-0"
                    onPress={() => {
                      window.open(
                        `/api/pdf/registration-forms?dogId=${encodeURIComponent(dog.dogId)}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    Print
                  </Button>
                </div>
                <Table aria-label={`Registrations for ${dog.dogName}`} removeWrapper>
                  <TableHeader>
                    <TableColumn>CLASS</TableColumn>
                    <TableColumn>FEE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>DATE</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {dog.registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>{reg.className}</TableCell>
                        <TableCell>£{reg.classFee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={getStatusColor(reg.status)}
                          >
                            {reg.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
              <span className="text-stone-600">
                {owner.dogs.length} dog{owner.dogs.length !== 1 ? 's' : ''} registered
              </span>
              <span className="font-medium">
                Total: £{owner.dogs.reduce((sum, dog) => 
                  sum + dog.registrations.reduce((s, r) => 
                    r.status !== 'cancelled' ? s + r.classFee : s, 0
                  ), 0
                ).toFixed(2)}
              </span>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
