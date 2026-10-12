import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    const conn = await connectDB();
    return NextResponse.json({
      ok: true,
      db: conn.connection.name,
      host: conn.connection.host,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}