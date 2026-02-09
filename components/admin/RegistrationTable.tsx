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
} from "@heroui/react";
import { RegistrationWithDetails } from "@/types";

interface RegistrationTableProps {
  registrations: RegistrationWithDetails[];
  isLoading: boolean;
}

interface GroupedRegistration {
  ownerName: string;
  ownerEmail: string;
  dogs: {
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
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading registrations...</div>;
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No registrations yet. Registrations will appear here once people start signing up.
      </div>
    );
  }

  // Group registrations by owner
  const grouped: Record<string, GroupedRegistration> = {};
  
  for (const reg of registrations) {
    const ownerKey = reg.owner_email;
    
    if (!grouped[ownerKey]) {
      grouped[ownerKey] = {
        ownerName: reg.owner_name,
        ownerEmail: reg.owner_email,
        dogs: [],
      };
    }
    
    // Find or create dog entry
    let dogEntry = grouped[ownerKey].dogs.find(d => d.dogName === reg.dog_name);
    if (!dogEntry) {
      dogEntry = {
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
      {groupedList.map((owner, index) => (
        <Card key={owner.ownerEmail} className="shadow-sm">
          <CardHeader className="bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold">{owner.ownerName}</h3>
              <p className="text-sm text-gray-500">{owner.ownerEmail}</p>
            </div>
          </CardHeader>
          <CardBody>
            {owner.dogs.map((dog, dogIndex) => (
              <div key={`${owner.ownerEmail}-${dog.dogName}-${dogIndex}`} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🐕</span>
                  <span className="font-medium">{dog.dogName}</span>
                  {dog.dogBreed && (
                    <span className="text-sm text-gray-500">({dog.dogBreed})</span>
                  )}
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
              <span className="text-gray-500">
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
