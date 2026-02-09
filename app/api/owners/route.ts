import { NextRequest, NextResponse } from 'next/server';
import { ownerOperations, dogOperations, registrationOperations } from '@/lib/db';
import { CreateOwnerRequest, Owner } from '@/types';

// GET all owners or find by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (email) {
      const owner = ownerOperations.getByEmail(email.toLowerCase());
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }
      // Get dogs and registrations for this owner
      const dogs = dogOperations.getByOwnerId((owner as Owner).id);
      const registrations = registrationOperations.getByOwnerId((owner as Owner).id);
      return NextResponse.json({ owner, dogs, registrations });
    }

    if (token) {
      const owner = ownerOperations.getByToken(token);
      if (!owner) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
      }
      const dogs = dogOperations.getByOwnerId((owner as Owner).id);
      const registrations = registrationOperations.getByOwnerId((owner as Owner).id);
      return NextResponse.json({ owner, dogs, registrations });
    }

    const owners = ownerOperations.getAll();
    return NextResponse.json(owners);
  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    );
  }
}

// POST create new owner or return existing
export async function POST(request: NextRequest) {
  try {
    const body: CreateOwnerRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email || body.email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if owner already exists
    const existingOwner = ownerOperations.getByEmail(body.email.toLowerCase());
    if (existingOwner) {
      // Update name if different
      const owner = existingOwner as Owner;
      if (owner.name !== body.name.trim()) {
        ownerOperations.update(owner.id, { name: body.name.trim() });
      }
      return NextResponse.json(ownerOperations.getById(owner.id));
    }

    // Create new owner
    const owner = ownerOperations.create({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
    });

    return NextResponse.json(owner, { status: 201 });
  } catch (error) {
    console.error('Error creating owner:', error);
    return NextResponse.json(
      { error: 'Failed to create owner' },
      { status: 500 }
    );
  }
}
