import { NextRequest, NextResponse } from 'next/server';
import { ownerOperations, dogOperations, registrationOperations } from '@/lib/db';
import {
  sendRegistrationConfirmation,
  sendAdminRegistrationNotification,
  type RegistrationDogDetail,
} from '@/lib/email';

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
    const { ownerId, ownerName, ownerEmail, waiverAccepted } = body;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    const owner = await ownerOperations.getById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    const dogs = await dogOperations.getByOwnerId(ownerId);

    const needsWaiver = dogs.some(
      (d) => d.activity_splash_pool === 1 || d.activity_agility === 1
    );

    if (needsWaiver && waiverAccepted !== true) {
      return NextResponse.json(
        { error: 'You must accept the waiver for splash pool and/or agility activities' },
        { status: 400 }
      );
    }

    if (needsWaiver) {
      await ownerOperations.markActivityWaiverAccepted(ownerId);
    }

    const emailDogs: RegistrationDogDetail[] = [];

    let totalFee = 0;

    for (const dog of dogs) {
      const registrations = await registrationOperations.getByDogId(dog.id);
      const activeRegistrations = registrations.filter((r) => r.status !== 'cancelled');

      const dogClasses = activeRegistrations.map((r) => ({
        name: r.class_name as string,
        fee: toCurrencyNumber(r.class_fee),
      }));

      const otherActivities: string[] = [];
      if (dog.activity_splash_pool === 1) {
        otherActivities.push('Splash pool session');
      }
      if (dog.activity_agility === 1) {
        otherActivities.push('Agility session');
      }

      const breedLabel =
        dog.breed && dog.breed.trim() !== '' ? dog.breed : 'Details on file at check-in';

      emailDogs.push({
        name: dog.name,
        breed: breedLabel,
        age: dog.age,
        sex: dog.sex,
        isRescue: dog.is_rescue === 1,
        activityFunShow: dog.activity_fun_show === 1,
        activitySplashPool: dog.activity_splash_pool === 1,
        activityAgility: dog.activity_agility === 1,
        classes: dogClasses,
        otherActivities,
      });

      totalFee += dogClasses.reduce((sum, c) => sum + toCurrencyNumber(c.fee), 0);
    }

    const resolvedName = ownerName || owner.name;
    const resolvedEmail = ownerEmail || owner.email;

    const registrantDogs = emailDogs.map(
      ({ name, breed, classes, otherActivities }) => ({
        name,
        breed,
        classes,
        otherActivities,
      })
    );

    await sendRegistrationConfirmation({
      ownerName: resolvedName,
      ownerEmail: resolvedEmail,
      retrievalToken: owner.retrieval_token,
      dogs: registrantDogs,
      totalFee,
    });

    try {
      await sendAdminRegistrationNotification({
        ownerName: resolvedName,
        ownerEmail: resolvedEmail,
        waiverJustAccepted: needsWaiver && waiverAccepted === true,
        dogs: emailDogs,
        totalFee,
        retrievalToken: owner.retrieval_token,
      });
    } catch (adminErr) {
      console.error('Admin registration notification failed:', adminErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration submitted and confirmation email sent',
      retrievalToken: owner.retrieval_token,
    });
  } catch (error) {
    console.error('Submit registration error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to submit registration';
    const isEmailSendError =
      typeof message === 'string' &&
      (message.includes('Mailgun') ||
        message.includes('Mailtrap') ||
        message.includes('EMAIL_FROM') ||
        message.includes('MAILTRAP_'));
    return NextResponse.json(
      {
        error: isEmailSendError
          ? 'Failed to send confirmation email. Please try again or contact us.'
          : 'Failed to submit registration',
      },
      { status: 500 }
    );
  }
}
