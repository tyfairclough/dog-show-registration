import { NextRequest, NextResponse } from 'next/server';
import { registrationOperations } from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Registration id is required' }, { status: 400 });
    }

    const existing = await registrationOperations.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    await registrationOperations.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}
