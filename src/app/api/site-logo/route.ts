import { NextResponse } from "next/server";
import { getSiteLogo } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const logo = await getSiteLogo();
  return NextResponse.json(logo);
}
