import { NextRequest, NextResponse } from "next/server";
import { syncRomaniaFixtures } from "@/lib/sync-romania";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret") ?? request.nextUrl.searchParams.get("secret");
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncRomaniaFixtures();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
