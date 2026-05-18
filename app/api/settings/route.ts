import { NextResponse } from 'next/server';
import { getPublicSiteSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
