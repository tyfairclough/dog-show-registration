"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardBody, Switch } from "@heroui/react";

export default function AdminSettings() {
  const [agilityRegistrationEnabled, setAgilityRegistrationEnabled] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) {
        throw new Error("Failed to load settings");
      }
      const data = await response.json();
      setAgilityRegistrationEnabled(Boolean(data.agilityRegistrationEnabled));
    } catch {
      setError("Could not load settings. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleAgilityToggle = async (enabled: boolean) => {
    const previous = agilityRegistrationEnabled;
    setAgilityRegistrationEnabled(enabled);
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agilityRegistrationEnabled: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const data = await response.json();
      setAgilityRegistrationEnabled(Boolean(data.agilityRegistrationEnabled));
    } catch {
      setAgilityRegistrationEnabled(previous);
      setError("Could not save setting. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <h2 className="text-2xl font-semibold">Site Settings</h2>
      </CardHeader>
      <CardBody className="gap-4">
        {error && (
          <div className="p-3 bg-danger-50 text-danger border border-danger-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        {isLoading ? (
          <p className="text-stone-600 text-sm">Loading settings...</p>
        ) : (
          <Switch
            isSelected={agilityRegistrationEnabled}
            onValueChange={handleAgilityToggle}
            isDisabled={isSaving}
          >
            <div className="flex flex-col">
              <span className="font-medium">Agility session registration</span>
              <span className="text-xs text-stone-600">
                When off, volunteers cannot select agility during online
                registration. Existing agility registrations are unchanged.
              </span>
            </div>
          </Switch>
        )}
      </CardBody>
    </Card>
  );
}
