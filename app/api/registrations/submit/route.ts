import { NextRequest, NextResponse } from 'next/server';
import { ownerOperations, dogOperations, registrationOperations } from '@/lib/db';
import { sendRegistrationConfirmation } from '@/lib/email';

function toCurrencyNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, ownerName, ownerEmail } = body;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // Get owner data
    const owner = await ownerOperations.getById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    // Get all dogs for this owner
    const dogs = await dogOperations.getByOwnerId(ownerId);

    // Build email data
    const emailDogs: {
      name: string;
      breed: string;
      classes: { name: string; fee: number }[];
    }[] = [];

    let totalFee = 0;

    for (const dog of dogs) {
      const registrations = await registrationOperations.getByDogId(dog.id);

      const activeRegistrations = registrations.filter(r => r.status !== 'cancelled');

      if (activeRegistrations.length > 0) {
        const dogClasses = activeRegistrations.map(r => ({
          name: r.class_name,
          fee: toCurrencyNumber(r.class_fee),
        }));

        emailDogs.push({
          name: dog.name,
          breed: dog.breed || 'Unknown breed',
          classes: dogClasses,
        });

        totalFee += dogClasses.reduce((sum, c) => sum + toCurrencyNumber(c.fee), 0);
      }
    }

    // Send confirmation email
    await sendRegistrationConfirmation({
      ownerName: ownerName || owner.name,
      ownerEmail: ownerEmail || owner.email,
      retrievalToken: owner.retrieval_token,
      dogs: emailDogs,
      totalFee,
    });

    return NextResponse.json({
      success: true,
      message: 'Registration submitted and confirmation email sent',
      retrievalToken: owner.retrieval_token,
    });
  } catch (error) {
    console.error('Submit registration error:', error);
    return NextResponse.json(
      { error: 'Failed to submit registration' },
      { status: 500 }
    );
  }
}
