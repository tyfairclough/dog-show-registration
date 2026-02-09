import { NextRequest, NextResponse } from 'next/server';
import { classOperations } from '@/lib/db';
import { CreateClassRequest } from '@/types';

// GET all classes
export async function GET() {
  try {
    const classes = classOperations.getAll();
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST create new class
export async function POST(request: NextRequest) {
  try {
    const body: CreateClassRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      );
    }

    if (typeof body.maxCapacity !== 'number' || body.maxCapacity < 1) {
      return NextResponse.json(
        { error: 'Max capacity must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.fee !== 'number' || body.fee < 0) {
      return NextResponse.json(
        { error: 'Fee must be a non-negative number' },
        { status: 400 }
      );
    }

    const newClass = classOperations.create({
      name: body.name.trim(),
      description: body.description,
      maxCapacity: body.maxCapacity,
      fee: body.fee,
      imageOriginal: body.imageOriginal,
      imageSquare: body.imageSquare,
      imageMobile: body.imageMobile,
      allowedBreeds: body.allowedBreeds,
      breedRestrictionMode: body.breedRestrictionMode,
      allowedSex: body.allowedSex,
      minAge: body.minAge,
      maxAge: body.maxAge,
      rescueOnly: body.rescueOnly ?? false,
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
