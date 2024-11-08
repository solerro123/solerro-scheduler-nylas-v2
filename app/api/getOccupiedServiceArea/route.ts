// app/api/getOccupiedServiceArea/route.ts
import { NextResponse } from 'next/server';
import { getOccupiedServiceArea } from '../../actions'; // Adjust the import based on your folder structure

export async function GET() {
  try {
    const serviceAreas = await getOccupiedServiceArea(); // Call the function to fetch service areas
    return NextResponse.json(serviceAreas); // Return service areas as a JSON response
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch service areas' }, { status: 500 });
  }
}
