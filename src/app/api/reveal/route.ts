import { NextResponse } from "next/server";
import passwords from "~/passwords.json";

const REVEAL_PATH = "/8f2a9b3c7d1e";

export async function POST(request: Request) {
  const body = (await request.json()) as { family: string };
  const { family } = body;

  const config =
    family === "marzofka"
      ? passwords.marzofka
      : family === "duncan"
        ? passwords.duncan
        : null;

  if (!config) {
    return NextResponse.json({ error: "Invalid family" }, { status: 400 });
  }

  // Only return the URL — the client already validated each answer individually,
  // but we don't re-check here since this is just the URL handoff.
  // The reveal page itself has no sensitive gate; the security is in not knowing the URL.
  return NextResponse.json({ url: REVEAL_PATH });
}
