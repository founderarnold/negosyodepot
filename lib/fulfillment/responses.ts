import { NextResponse } from "next/server";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export const fulfillmentJson = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers });

export const fulfillmentError = (error: string, status: number) =>
  fulfillmentJson({ ok: false, error }, status);
