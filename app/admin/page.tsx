"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Tabs, Tab, Button } from "@heroui/react";
import Link from "next/link";
import ClassTable from "@/components/admin/ClassTable";
import ClassForm from "@/components/admin/ClassForm";
import RegistrationTable from "@/components/admin/RegistrationTable";
import { DogClass, CreateClassRequest, AdminOwnerWithDogs } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Class management state
  const [classes, setClasses] = useState<DogClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<DogClass | null>(null);
  
  // Registration management state
  const [registrationOwners, setRegistrationOwners] = useState<AdminOwnerWithDogs[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();

        const normalizedClasses: DogClass[] = Array.isArray(data)
          ? data.map((dogClass: any) => {
              const numericFee = Number(dogClass?.fee);
              return {
                ...dogClass,
                fee: Number.isFinite(numericFee) ? numericFee : 0,
              } as DogClass;
            })
          : [];

        setClasses(normalizedClasses);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setClassesLoading(false);
    }
  }, []);

  // Fetch registrations (silent: no full-table loading state — e.g. after inline delete)
  const fetchRegistrations = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setRegistrationsLoading(true);
    try {
      const response = await fetch('/api/registrations');
      if (response.ok) {
        const data = (await response.json()) as AdminOwnerWithDogs[];
        setRegistrationOwners(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      if (!silent) setRegistrationsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verify session on mount
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUsername(data.username || "");
          fetchClasses();
          fetchRegistrations();
        } else {
          router.push('/admin/login');
        }
      })
      .catch(() => {
        router.push('/admin/login');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, fetchClasses, fetchRegistrations]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setIsClassFormOpen(true);
  };

  const handleEditClass = (dogClass: DogClass) => {
    setEditingClass(dogClass);
    setIsClassFormOpen(true);
  };

  const handleSaveClass = async (data: CreateClassRequest) => {
    const url = editingClass ? `/api/classes/${editingClass.id}` : '/api/classes';
    const method = editingClass ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save class');
    }

    await fetchClasses();
  };

  const handleDeleteClass = async (id: string) => {
    const response = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchClasses();
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100dvh-100px)] items-center justify-center bg-cream-100">
        <div className="text-center">
          <p className="text-stone-700">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream-100 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <Link href="/">
            <Button variant="light" size="sm">
              ← Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {username && (
              <span className="text-sm text-stone-700">Logged in as: {username}</span>
            )}
            <Button color="danger" variant="flat" size="sm" onPress={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Administrator Portal</h1>
          <p className="text-stone-700 mb-8">
            Manage classes, available spaces, and registrations for the dog show.
          </p>
          
          <Tabs
            aria-label="Admin sections"
            color="primary"
            classNames={{
              cursor: "bg-[var(--etd-primary)]",
            }}
          >
            <Tab key="classes" title="Manage Classes">
              <Card className="mt-4">
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Class Management</h2>
                  <Button
                    variant="solid"
                    className="bg-[var(--etd-teal)] text-white font-semibold"
                    onPress={handleCreateClass}
                  >
                    + Create New Class
                  </Button>
                </CardHeader>
                <CardBody>
                  <ClassTable
                    classes={classes}
                    onEdit={handleEditClass}
                    onDelete={handleDeleteClass}
                    isLoading={classesLoading}
                  />
                </CardBody>
              </Card>
            </Tab>
            <Tab key="registrations" title="Manage Registrations">
              <Card className="mt-4">
                <CardHeader className="flex flex-wrap justify-between items-center gap-3">
                  <h2 className="text-2xl font-semibold">Registration Management</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="bordered"
                      size="sm"
                      onPress={() => {
                        window.open(
                          "/api/pdf/registration-forms?mode=blank",
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      Print blank form
                    </Button>
                    <Button
                      variant="bordered"
                      size="sm"
                      onPress={() => {
                        window.open(
                          "/admin/registrations/print",
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      Print all registrations
                    </Button>
                    <Button
                      variant="flat"
                      size="sm"
                      onPress={() => {
                        fetchRegistrations();
                        fetchClasses();
                      }}
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <RegistrationTable
                    owners={registrationOwners}
                    isLoading={registrationsLoading}
                    onRegistrationDeleted={() => fetchRegistrations({ silent: true })}
                  />
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>

      <ClassForm
        isOpen={isClassFormOpen}
        onClose={() => setIsClassFormOpen(false)}
        onSave={handleSaveClass}
        editingClass={editingClass}
      />
    </main>
  );
}
