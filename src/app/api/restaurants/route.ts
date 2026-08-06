import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const branches = await db.branch.findMany({
      orderBy: { code: 'asc' },
      select: { code: true, name: true },
    });

    // Move '10000' (สำนักงานใหญ่) to the front of the list
    const hoIndex = branches.findIndex(b => b.code === '10000');
    if (hoIndex > -1) {
      const [ho] = branches.splice(hoIndex, 1);
      branches.unshift(ho);
    }

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
