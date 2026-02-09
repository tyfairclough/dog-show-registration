"use client";

import { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
  Image,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { DogClass, CreateClassRequest } from "@/types";

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateClassRequest) => Promise<void>;
  editingClass?: DogClass | null;
}

const commonBreeds = [
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Bulldog",
  "Beagle",
  "Poodle",
  "Rottweiler",
  "Yorkshire Terrier",
  "Boxer",
  "Dachshund",
  "Cocker Spaniel",
  "Shih Tzu",
  "Border Collie",
  "Jack Russell Terrier",
  "Cavalier King Charles Spaniel",
  "Staffordshire Bull Terrier",
  "French Bulldog",
  "Springer Spaniel",
  "Chihuahua",
  "Mixed Breed / Crossbreed",
  "Other",
];

export default function ClassForm({ isOpen, onClose, onSave, editingClass }: ClassFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{
    original?: string;
    square?: string;
    mobile?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("20");
  const [fee, setFee] = useState("2");
  const [allowedBreeds, setAllowedBreeds] = useState<string[]>([]);
  const [breedRestrictionMode, setBreedRestrictionMode] = useState<"allow" | "exclude">("allow");
  const [allowedSex, setAllowedSex] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [rescueOnly, setRescueOnly] = useState(false);

  // Update form when editingClass changes (fix for useState not updating on prop change)
  useEffect(() => {
    if (isOpen && editingClass) {
      // Populate form with editing class data
      setName(editingClass.name || "");
      setDescription(editingClass.description || "");
      setMaxCapacity(editingClass.max_capacity?.toString() || "20");
      setFee(editingClass.fee?.toString() || "2");
      setAllowedBreeds(editingClass.allowed_breeds ? editingClass.allowed_breeds.split(",") : []);
      setBreedRestrictionMode(editingClass.breed_restriction_mode || "allow");
      setAllowedSex(editingClass.allowed_sex || "");
      setMinAge(editingClass.min_age?.toString() || "");
      setMaxAge(editingClass.max_age?.toString() || "");
      setRescueOnly(Boolean(editingClass.rescue_only));
      setImagePreview(editingClass.image_square || null);
    } else if (isOpen && !editingClass) {
      // Reset form for new class
      setName("");
      setDescription("");
      setMaxCapacity("20");
      setFee("2");
      setAllowedBreeds([]);
      setBreedRestrictionMode("allow");
      setAllowedSex("");
      setMinAge("");
      setMaxAge("");
      setRescueOnly(false);
      setImagePreview(null);
      setUploadedImages({});
    }
  }, [isOpen, editingClass]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setMaxCapacity("20");
    setFee("2");
    setAllowedBreeds([]);
    setBreedRestrictionMode("allow");
    setAllowedSex("");
    setMinAge("");
    setMaxAge("");
    setRescueOnly(false);
    setImagePreview(null);
    setUploadedImages({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedImages(data.images);
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Class name is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        maxCapacity: parseInt(maxCapacity) || 20,
        fee: parseFloat(fee) || 0,
        imageOriginal: uploadedImages.original || editingClass?.image_original || undefined,
        imageSquare: uploadedImages.square || editingClass?.image_square || undefined,
        imageMobile: uploadedImages.mobile || editingClass?.image_mobile || undefined,
        allowedBreeds: allowedBreeds.length > 0 ? allowedBreeds.join(",") : undefined,
        breedRestrictionMode: allowedBreeds.length > 0 ? breedRestrictionMode : undefined,
        allowedSex: allowedSex || undefined,
        minAge: minAge ? parseInt(minAge) : undefined,
        maxAge: maxAge ? parseInt(maxAge) : undefined,
        rescueOnly,
      });
      handleClose();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save class");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {editingClass ? "Edit Class" : "Create New Class"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Class Image (16:9)</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={160}
                    height={90}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-[160px] h-[90px] bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="flat"
                  onPress={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>

            {/* Basic Info */}
            <Input
              label="Class Name"
              placeholder="e.g., Best in Show"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
            />

            <Textarea
              label="Description"
              placeholder="Describe what this class is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Max Capacity"
                placeholder="20"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                min={1}
              />
              <Input
                type="number"
                label="Entry Fee (£)"
                placeholder="2.00"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                min={0}
                step={0.5}
              />
            </div>

            {/* Constraints Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3">Entry Constraints (Optional)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Leave empty to allow all dogs. Set constraints to restrict entry.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <RadioGroup
                    label="Breed Restriction Mode"
                    orientation="horizontal"
                    value={breedRestrictionMode}
                    onValueChange={(value) => setBreedRestrictionMode(value as "allow" | "exclude")}
                  >
                    <Radio value="allow">Only allow selected breeds</Radio>
                    <Radio value="exclude">Allow all except selected breeds</Radio>
                  </RadioGroup>
                  
                  <Select
                    label={breedRestrictionMode === "allow" ? "Allowed Breeds" : "Excluded Breeds"}
                    placeholder={breedRestrictionMode === "allow" 
                      ? "Select breeds to allow (leave empty for all)" 
                      : "Select breeds to exclude"}
                    selectionMode="multiple"
                    selectedKeys={new Set(allowedBreeds)}
                    onSelectionChange={(keys) => setAllowedBreeds(Array.from(keys) as string[])}
                  >
                    {commonBreeds.map((breed) => (
                      <SelectItem key={breed}>{breed}</SelectItem>
                    ))}
                  </Select>
                  
                  {breedRestrictionMode === "exclude" && allowedBreeds.length > 0 && (
                    <p className="text-sm text-warning">
                      Dogs with these breeds will NOT be able to enter this class: {allowedBreeds.join(", ")}
                    </p>
                  )}
                </div>

                <Select
                  label="Allowed Sex"
                  placeholder="Any sex"
                  selectedKeys={allowedSex ? new Set([allowedSex]) : new Set()}
                  onSelectionChange={(keys) => {
                    const arr = Array.from(keys) as string[];
                    setAllowedSex(arr[0] || "");
                  }}
                >
                  <SelectItem key="male">Male</SelectItem>
                  <SelectItem key="female">Female</SelectItem>
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Minimum Age (years)"
                    placeholder="No minimum"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    min={0}
                  />
                  <Input
                    type="number"
                    label="Maximum Age (years)"
                    placeholder="No maximum"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    min={0}
                  />
                </div>

                <Switch
                  isSelected={rescueOnly}
                  onValueChange={setRescueOnly}
                >
                  Rescue dogs only
                </Switch>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
            {editingClass ? "Save Changes" : "Create Class"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
