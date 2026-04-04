import { NextRequest, NextResponse } from 'next/server';
import { ownerOperations } from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Owner id is required' }, { status: 400 });
    }

    const result = await ownerOperations.deleteWithAllRegistrations(id);
    if (!result) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting owner registration:', error);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}
