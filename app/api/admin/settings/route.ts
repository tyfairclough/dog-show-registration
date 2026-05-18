import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth';
import {
  getPublicSiteSettings,
  setAgilityRegistrationEnabled,
} from '@/lib/settings';

async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return session !== null;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agilityRegistrationEnabled } = body;

    if (typeof agilityRegistrationEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'agilityRegistrationEnabled must be a boolean' },
        { status: 400 }
      );
    }

    await setAgilityRegistrationEnabled(agilityRegistrationEnabled);
    const settings = await getPublicSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
