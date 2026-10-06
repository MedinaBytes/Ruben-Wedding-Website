import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Supabase Keep-Alive Endpoint
 * Configured via Vercel Cron to run once daily at 08:00 UTC.
 * Prevents Supabase Free Tier projects from auto-pausing after 7 days of inactivity.
 */
export async function GET(request: Request) {
  // Authorization check for Vercel Cron or manual admin trigger
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }
  }

  try {
    const supabase = createSupabaseAdminClient();
    const startTime = Date.now();

    // Lightweight query that exercises Postgres to reset the 7-day inactivity pause counter
    const { data, error } = await supabase
      .from("site_settings")
      .select("key")
      .limit(1);

    const durationMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase database keep-alive ping succeeded",
      rowsFound: data?.length ?? 0,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown database ping failure",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
