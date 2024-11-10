// app/api/get-survey-slot/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const creatorParentId = "1234";
  const date = "2024-11-09";
  const latitude = "32.9377784";
  const longitude = "-96.3539706";
  const isSurveyCreating = "true";
  const clientId = "7125";

  const apiUrl = `https://mysites.ensiteservices.com/api/ensite/getslotforsurvey?creatorparentid=${creatorParentId}&date=${date}&latitude=${latitude}&longitude=${longitude}&issurveycreating=${isSurveyCreating}&clientid=${clientId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ENSITE_ACCESS_TOKEN}`
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching survey slot: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
