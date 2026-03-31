import { NextResponse } from "next/server";
import passwords from "~/passwords.json";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    family: string;
    index: number;
    answer: string;
  };
  const { family, index, answer } = body;

  const config = family === "marzofka" ? passwords.marzofka : family === "duncan" ? passwords.duncan : null;

  if (!config || index < 0 || index >= config.passwords.length) {
    return NextResponse.json({ correct: false }, { status: 400 });
  }

  const expected = config.passwords[index]!.toLowerCase();
  const given = answer.trim().toLowerCase();

  return NextResponse.json({ correct: given === expected });
}
