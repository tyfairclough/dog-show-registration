import { NextRequest, NextResponse } from 'next/server';
import { classOperations } from '@/lib/db';
import { deleteImages } from '@/lib/image';

// GET single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dogClass = await classOperations.getById(id);

    if (!dogClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dogClass);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

// PUT update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingClass = await classOperations.getById(id);

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate fields if provided
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Class name cannot be empty' },
        { status: 400 }
      );
    }

    if (body.maxCapacity !== undefined && (typeof body.maxCapacity !== 'number' || body.maxCapacity < 1)) {
      return NextResponse.json(
        { error: 'Max capacity must be a positive number' },
        { status: 400 }
      );
    }

    if (body.fee !== undefined && (typeof body.fee !== 'number' || body.fee < 0)) {
      return NextResponse.json(
        { error: 'Fee must be a non-negative number' },
        { status: 400 }
      );
    }

    // If new images are provided, delete old ones
    if (body.imageOriginal && existingClass.image_original) {
      deleteImages({
        original: existingClass.image_original,
        square: existingClass.image_square || undefined,
        mobile: existingClass.image_mobile || undefined,
      });
    }

    const updatedClass = await classOperations.update(id, {
      name: body.name,
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
      rescueOnly: body.rescueOnly,
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingClass = await classOperations.getById(id);

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Delete associated images
    if (existingClass.image_original) {
      deleteImages({
        original: existingClass.image_original,
        square: existingClass.image_square || undefined,
        mobile: existingClass.image_mobile || undefined,
      });
    }

    await classOperations.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
