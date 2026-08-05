import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const branches = await db.branch.findMany({
      orderBy: { code: 'asc' },
      select: { code: true, name: true },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
