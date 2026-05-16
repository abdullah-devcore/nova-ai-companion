import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ExportFormat {
  format: "json" | "markdown" | "pdf";
  chatId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { format, chatId } = await request.json() as ExportFormat;

    // Get chat and messages
    const { data: chat } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (!messages) {
      return NextResponse.json({ error: "Messages not found" }, { status: 404 });
    }

    let content: string;
    let filename: string;
    let contentType: string;

    if (format === "json") {
      content = JSON.stringify({
        title: chat.title,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        message_count: messages.length,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        })),
      }, null, 2);
      filename = `${chat.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
      contentType = "application/json";
    } else if (format === "markdown") {
      const lines: string[] = [
        `# ${chat.title}`,
        `*Created: ${new Date(chat.created_at).toLocaleString()}*`,
        `*Messages: ${messages.length}*`,
        "",
      ];

      messages.forEach((m) => {
        if (m.role === "user") {
          lines.push(`## You\n${m.content}\n`);
        } else {
          lines.push(`## Nova\n${m.content}\n`);
        }
      });

      content = lines.join("\n");
      filename = `${chat.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
      contentType = "text/markdown";
    } else if (format === "pdf") {
      // For PDF, we'll return the data for the client to generate with a library
      const pdfData = {
        title: chat.title,
        created_at: chat.created_at,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
      content = JSON.stringify(pdfData);
      filename = `${chat.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      contentType = "application/json";
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[Export] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
