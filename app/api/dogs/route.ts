import { NextRequest, NextResponse } from 'next/server';
import { dogOperations } from '@/lib/db';
import { CreateDogRequest } from '@/types';

// GET all dogs or by owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    if (ownerId) {
      const dogs = await dogOperations.getByOwnerId(ownerId);
      return NextResponse.json(dogs);
    }

    const dogs = await dogOperations.getAll();
    return NextResponse.json(dogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dogs' },
      { status: 500 }
    );
  }
}

// POST create new dog
export async function POST(request: NextRequest) {
  try {
    const body: CreateDogRequest = await request.json();

    if (!body.ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Dog name is required' },
        { status: 400 }
      );
    }

    const dog = await dogOperations.create({
      ownerId: body.ownerId,
      name: body.name.trim(),
      breed: body.breed,
      age: body.age,
      sex: body.sex,
      isRescue: body.isRescue ?? false,
    });

    return NextResponse.json(dog, { status: 201 });
  } catch (error) {
    console.error('Error creating dog:', error);
    return NextResponse.json(
      { error: 'Failed to create dog' },
      { status: 500 }
    );
  }
}
