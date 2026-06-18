import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured in environment variables.' },
        { status: 400 }
      );
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Avodani Missions <onboarding@resend.dev>';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email via Resend API.');
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Email dispatch error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
