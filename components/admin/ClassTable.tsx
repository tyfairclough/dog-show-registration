"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Image,
  Tooltip,
} from "@heroui/react";
import { DogClass } from "@/types";

interface ClassTableProps {
  classes: DogClass[];
  onEdit: (dogClass: DogClass) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function ClassTable({ classes, onEdit, onDelete, isLoading }: ClassTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class? This will also remove all registrations for this class.")) {
      return;
    }
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const formatConstraints = (dogClass: DogClass) => {
    const constraints: string[] = [];
    if (dogClass.allowed_breeds) constraints.push(`Breeds: ${dogClass.allowed_breeds}`);
    if (dogClass.allowed_sex) constraints.push(`Sex: ${dogClass.allowed_sex}`);
    if (dogClass.min_age) constraints.push(`Min age: ${dogClass.min_age}`);
    if (dogClass.max_age) constraints.push(`Max age: ${dogClass.max_age}`);
    if (dogClass.rescue_only) constraints.push("Rescue only");
    return constraints.length > 0 ? constraints.join(", ") : "None";
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading classes...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No classes created yet. Create your first class to get started.
      </div>
    );
  }

  return (
    <Table aria-label="Classes table">
      <TableHeader>
        <TableColumn>IMAGE</TableColumn>
        <TableColumn>NAME</TableColumn>
        <TableColumn>CAPACITY</TableColumn>
        <TableColumn>FEE</TableColumn>
        <TableColumn>CONSTRAINTS</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {classes.map((dogClass) => (
          <TableRow key={dogClass.id}>
            <TableCell>
              {dogClass.image_square ? (
                <Image
                  src={dogClass.image_square}
                  alt={dogClass.name}
                  width={50}
                  height={50}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-[50px] h-[50px] bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{dogClass.name}</div>
                {dogClass.description && (
                  <div className="text-sm text-gray-500 truncate max-w-[200px]">
                    {dogClass.description}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Chip
                color={dogClass.current_registrations >= dogClass.max_capacity ? "danger" : "success"}
                variant="flat"
                size="sm"
              >
                {dogClass.current_registrations} / {dogClass.max_capacity}
              </Chip>
            </TableCell>
            <TableCell>£{dogClass.fee.toFixed(2)}</TableCell>
            <TableCell>
              <Tooltip content={formatConstraints(dogClass)}>
                <span className="text-sm text-gray-600 truncate max-w-[150px] block cursor-help">
                  {formatConstraints(dogClass)}
                </span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => onEdit(dogClass)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  isLoading={deletingId === dogClass.id}
                  onPress={() => handleDelete(dogClass.id)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
