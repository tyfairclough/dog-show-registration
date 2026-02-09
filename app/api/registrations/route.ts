import { NextRequest, NextResponse } from 'next/server';
import { registrationOperations } from '@/lib/db';
import { CreateRegistrationRequest } from '@/types';

// GET all registrations with details
export async function GET() {
  try {
    const registrations = registrationOperations.getAll();
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// POST create new registration
export async function POST(request: NextRequest) {
  try {
    const body: CreateRegistrationRequest = await request.json();

    // Validate required fields
    if (!body.dogId) {
      return NextResponse.json(
        { error: 'Dog ID is required' },
        { status: 400 }
      );
    }

    if (!body.classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const registration = registrationOperations.create({
      dogId: body.dogId,
      classId: body.classId,
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'This dog is already registered for this class' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
