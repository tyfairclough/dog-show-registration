// Type definitions for the dog show registration system

export interface DogClass {
  id: string;
  name: string;
  description: string | null;
  max_capacity: number;
  current_registrations: number;
  fee: number;
  image_original: string | null;
  image_square: string | null;
  image_mobile: string | null;
  allowed_breeds: string | null;
  breed_restriction_mode: 'allow' | 'exclude';
  allowed_sex: string | null;
  min_age: number | null;
  max_age: number | null;
  rescue_only: number;
  created_at: string;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  retrieval_token: string;
  created_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  age: number | null;
  sex: string | null;
  is_rescue: number;
  created_at: string;
}

export interface Registration {
  id: string;
  dog_id: string;
  class_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface RegistrationWithDetails extends Registration {
  dog_name: string;
  dog_breed: string | null;
  dog_age: number | null;
  dog_sex: string | null;
  dog_is_rescue: number;
  owner_name: string;
  owner_email: string;
  class_name: string;
  class_fee: number;
}

// API request/response types
export interface CreateClassRequest {
  name: string;
  description?: string;
  maxCapacity: number;
  fee: number;
  imageOriginal?: string;
  imageSquare?: string;
  imageMobile?: string;
  allowedBreeds?: string;
  breedRestrictionMode?: 'allow' | 'exclude';
  allowedSex?: string;
  minAge?: number;
  maxAge?: number;
  rescueOnly: boolean;
}

export interface CreateOwnerRequest {
  name: string;
  email: string;
}

export interface CreateDogRequest {
  ownerId: string;
  name: string;
  breed?: string;
  age?: number;
  sex?: string;
  isRescue: boolean;
}

export interface CreateRegistrationRequest {
  dogId: string;
  classId: string;
}

// Frontend types for registration flow
export interface DogFormData {
  id?: string;
  name: string;
  breed: string;
  age: number;
  sex: 'male' | 'female';
  isRescue: boolean;
  selectedClasses: string[];
}

export interface RegistrationCartItem {
  dog: DogFormData;
  classes: DogClass[];
}

// Constraint checking helper type
export interface DogConstraints {
  breed: string;
  sex: string;
  age: number;
  isRescue: boolean;
}
