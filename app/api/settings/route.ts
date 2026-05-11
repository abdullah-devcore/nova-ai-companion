import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getUserSettings,
  updateUserSettings,
} from "@/lib/database/queries";
import { handleError } from "@/lib/errors";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const settings = await getUserSettings();

    if (!settings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Validate enum fields if provided
    if (body.theme && !["light", "dark"].includes(body.theme)) {
      return NextResponse.json(
        { success: false, error: "Invalid theme" },
        { status: 400 }
      );
    }

    if (
      body.ai_personality &&
      !["helpful", "creative", "analytical", "friendly"].includes(
        body.ai_personality
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid AI personality" },
        { status: 400 }
      );
    }

    const settings = await updateUserSettings(body);

    if (!settings) {
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}
