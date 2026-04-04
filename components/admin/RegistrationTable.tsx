"use client";

import { useState, useEffect } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { AdminOwnerWithDogs } from "@/types";

interface RegistrationTableProps {
  owners: AdminOwnerWithDogs[];
  isLoading: boolean;
  onRegistrationDeleted?: () => void;
}

type DeleteTarget =
  | {
      kind: "classRow";
      registrationId: string;
      dogName: string;
      className: string;
    }
  | { kind: "wholeOwner"; ownerId: string; ownerName: string };

export default function RegistrationTable({
  owners,
  isLoading,
  onRegistrationDeleted,
}: RegistrationTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!feedback || feedback.type !== "success") return;
    const t = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.kind === "classRow") {
        const response = await fetch(
          `/api/registrations/${encodeURIComponent(deleteTarget.registrationId)}`,
          { method: "DELETE" }
        );
        const data = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          setFeedback({
            type: "danger",
            message: data.error ?? "Could not delete this registration. Please try again.",
          });
          return;
        }

        setDeleteTarget(null);
        setFeedback({ type: "success", message: "Registration deleted successfully." });
        onRegistrationDeleted?.();
        return;
      }

      const response = await fetch(
        `/api/owners/${encodeURIComponent(deleteTarget.ownerId)}`,
        { method: "DELETE" }
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setFeedback({
          type: "danger",
          message: data.error ?? "Could not delete this registration. Please try again.",
        });
        return;
      }

      setDeleteTarget(null);
      setFeedback({
        type: "success",
        message:
          "This person's registration, all show class entries, and all activity bookings have been removed.",
      });
      onRegistrationDeleted?.();
    } catch {
      setFeedback({
        type: "danger",
        message: "Could not delete this registration. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };
  if (isLoading) {
    return <div className="text-center py-8 text-stone-600">Loading registrations...</div>;
  }

  if (owners.length === 0) {
    return (
      <div className="text-center py-8 text-stone-600">
        No registrations yet. Registrations will appear here once people start signing up.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role="status"
          className={
            feedback.type === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          }
        >
          {feedback.message}
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        isDismissable={!deleteLoading}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {deleteTarget?.kind === "wholeOwner"
              ? "Delete entire registration"
              : "Delete class registration"}
          </ModalHeader>
          <ModalBody>
            {deleteTarget?.kind === "wholeOwner" ? (
              <p className="text-sm text-stone-700">
                Are you sure you want to delete this entire registration? This will remove{" "}
                <span className="font-medium">{deleteTarget.ownerName}</span>, all of their dogs,
                every show class entry, and all activity bookings (fun dog show, splash pool,
                agility). This cannot be undone.
              </p>
            ) : deleteTarget?.kind === "classRow" ? (
              <p className="text-sm text-stone-700">
                Are you sure you want to delete this registration? This removes{" "}
                <span className="font-medium">{deleteTarget.dogName}</span>&apos;s entry for{" "}
                <span className="font-medium">{deleteTarget.className}</span> and cannot be undone.
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setDeleteTarget(null)} isDisabled={deleteLoading}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmDelete} isLoading={deleteLoading}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {owners.map((owner) => (
        <Card key={owner.ownerId} className="shadow-xs">
          <CardHeader className="bg-cream-100 flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{owner.ownerName}</h3>
              <p className="text-sm text-stone-600">{owner.ownerEmail}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 justify-end">
              <Button
                size="sm"
                variant="flat"
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
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() =>
                  setDeleteTarget({
                    kind: "wholeOwner",
                    ownerId: owner.ownerId,
                    ownerName: owner.ownerName,
                  })
                }
              >
                Delete entire registration
              </Button>
            </div>
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
                  <div className="flex flex-wrap gap-1 ml-0 sm:ml-2">
                    {dog.activityFunShow && (
                      <Chip size="sm" variant="flat" color="primary">
                        Fun dog show
                      </Chip>
                    )}
                    {dog.activitySplashPool && (
                      <Chip size="sm" variant="flat" color="secondary">
                        Splash pool
                      </Chip>
                    )}
                    {dog.activityAgility && (
                      <Chip size="sm" variant="flat" color="success">
                        Agility
                      </Chip>
                    )}
                  </div>
                </div>
                {dog.registrations.length === 0 ? (
                  <p className="text-sm text-stone-600 bg-cream-50 border border-cream-200 rounded p-2">
                    No show class entries (splash pool / agility only, or no classes yet).
                  </p>
                ) : (
                  <Table aria-label={`Registrations for ${dog.dogName}`} removeWrapper>
                    <TableHeader>
                      <TableColumn>CLASS</TableColumn>
                      <TableColumn>FEE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn align="end">ACTIONS</TableColumn>
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
                          <TableCell>
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              className="min-w-0"
                              onPress={() =>
                                setDeleteTarget({
                                  kind: "classRow",
                                  registrationId: reg.id,
                                  dogName: dog.dogName,
                                  className: reg.className,
                                })
                              }
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
              <span className="text-stone-600">
                {owner.dogs.length} dog{owner.dogs.length !== 1 ? "s" : ""} registered
              </span>
              <span className="font-medium">
                Total: £
                {owner.dogs
                  .reduce(
                    (sum, dog) =>
                      sum +
                      dog.registrations.reduce(
                        (s, r) => (r.status !== "cancelled" ? s + r.classFee : s),
                        0
                      ),
                    0
                  )
                  .toFixed(2)}
              </span>
            </div>
          </CardBody>
        </Card>
      ))}
      </div>
    </div>
  );
}
