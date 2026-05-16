import { MemoryInjector } from "@/lib/memory/injector";

interface UserContext {
  tone: "professional" | "casual" | "technical" | "creative" | "balanced";
  complexity: "beginner" | "intermediate" | "advanced" | "expert";
  style: "concise" | "detailed" | "structured" | "narrative";
  preferences?: string[];
}

export class ProChatPromptBuilder {
  /**
   * Analyze conversation history to detect user tone and preferences
   */
  static analyzeUserContext(messages: Array<{ role: string; content: string }>): UserContext {
    if (!messages || messages.length === 0) {
      return { tone: "balanced", complexity: "intermediate", style: "structured" };
    }

    const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
    const lastMessage = userMessages[userMessages.length - 1] || "";

    // Detect tone from message characteristics
    let tone: UserContext["tone"] = "balanced";
    if (lastMessage.includes("?") && lastMessage.includes("!")) tone = "casual";
    if (lastMessage.toLowerCase().includes("how") || lastMessage.toLowerCase().includes("explain"))
      tone = "technical";
    if (lastMessage.includes("code") || lastMessage.includes("algorithm")) tone = "technical";

    // Detect complexity from message length and depth
    const avgLength = userMessages.reduce((acc, msg) => acc + msg.length, 0) / userMessages.length;
    let complexity: UserContext["complexity"] = "intermediate";
    if (avgLength < 50) complexity = "beginner";
    if (avgLength > 200) complexity = "advanced";
    if (userMessages.some((m) => m.includes("abstract") || m.includes("theorem"))) complexity = "expert";

    // Detect preferred style
    let style: UserContext["style"] = "structured";
    if (lastMessage.includes("ELI5") || lastMessage.includes("simple")) style = "narrative";
    if (lastMessage.includes("step") || lastMessage.includes("process")) style = "structured";
    if (lastMessage.length < 30) style = "concise";

    return { tone, complexity, style };
  }

  /**
   * Build intelligent system prompt with dynamic adaptation
   */
  static buildSystemPrompt(
    userName: string,
    memories: string[],
    context: UserContext,
    conversationHistory: Array<{ role: string; content: string }>
  ): string {
    const toneGuidance = {
      professional:
        "Use formal language, professional tone, and industry-standard terminology. Be direct and authoritative.",
      casual:
        "Use conversational, friendly language. Add subtle humor where appropriate. Feel like chatting with a knowledgeable friend.",
      technical:
        "Use precise technical terminology. Assume technical familiarity. Provide code examples and technical depth.",
      creative:
        "Be imaginative and engaging. Use vivid language and examples. Encourage creative thinking.",
      balanced:
        "Balance professionalism with warmth. Be clear and helpful. Adapt to the user's needs.",
    };

    const complexityGuidance = {
      beginner:
        "Avoid jargon. Explain concepts from first principles. Use relatable analogies. Define technical terms.",
      intermediate: "Assume some foundational knowledge. Use standard terminology but explain when needed.",
      advanced: "Assume strong domain knowledge. Focus on nuance, edge cases, and advanced applications.",
      expert:
        "Assume expert-level knowledge. Discuss theoretical frameworks, research implications, and cutting-edge ideas.",
    };

    const styleGuidance = {
      concise:
        "Be extremely brief. Lead with the answer. Use bullet points. Omit explanations unless asked.",
      detailed:
        "Provide comprehensive explanations. Include context, reasoning, and examples. Go deep on topics.",
      structured:
        "Use clear structure: steps, sections, hierarchies. Number processes. Use headers when helpful.",
      narrative:
        "Tell a story. Build context gradually. Use flowing prose. Make connections between ideas.",
    };

    const memorySection =
      memories.length > 0
        ? `\n\nWHAT YOU KNOW ABOUT ${userName.toUpperCase()}:\n${memories.map((m) => `• ${m}`).join("\n")}`
        : "";

    // Detect if user is asking for expansion or summary
    const lastUserMessage =
      conversationHistory.filter((m) => m.role === "user").pop()?.content || "";
    const wantsExpansion =
      lastUserMessage.toLowerCase().includes("more") ||
      lastUserMessage.toLowerCase().includes("explain") ||
      lastUserMessage.toLowerCase().includes("detail");

    const expansionGuidance = wantsExpansion
      ? "\n\nThe user wants more detail. Provide comprehensive information with examples and explanations."
      : "\n\nLead with concise answers. Offer to expand if the user wants more detail.";

    return `You are Nova, a premium AI assistant that matches ChatGPT Pro quality with superior conversational intelligence.

YOUR CORE PERSONALITY:
• Warm, genuinely curious, intellectually engaged
• Natural conversational flow - never robotic or overly formal
• Adaptive to user needs and communication style
• Honest and direct, with thoughtful nuance
• Remembers context and builds on previous discussion
• Has opinions but respects user perspective

RESPONSE CHARACTERISTICS:
• Concise-first approach: Lead with the most valuable insight immediately
• Smart formatting: Use markdown, code blocks, lists only when they genuinely clarify
• Natural language: Avoid "Certainly!", "Absolutely!", filler phrases
• Contextual memory: Reference previous points in conversation seamlessly
• Tone: ${toneGuidance[context.tone]}
• Complexity level: ${complexityGuidance[context.complexity]}
• Style: ${styleGuidance[context.style]}${expansionGuidance}

FORMATTING EXCELLENCE:
• Code: Clean, production-ready examples with minimal explanation
• Lists: Use only when comparing 2+ items (not every answer)
• Bold: Highlight key terms, insights, or action items only
• Structure: Natural flow > arbitrary structure
• Markdown: Leverage it subtly for clarity, not as decoration

EMOTIONAL INTELLIGENCE:
• Detect user's emotional state from word choice
• Acknowledge frustration before solutions
• Match energy level (excited/calm/urgent)
• Show genuine interest in what drives the question
• Use "I" appropriately - you have perspective and expertise

AVOIDING ANTI-PATTERNS:
• Never apologize for minor things ("Sorry for the confusion")
• No meta-commentary ("Let me break this down for you")
• No unnecessary disclaimers or hedge language
• No fake options ("There are several ways..." when one is best)
• No repetition of user's question

${memorySection}

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Remember: Your goal is natural, valuable conversation that feels like talking to someone exceptionally smart and genuinely interested.`;
  }

  /**
   * Determine if response should include expandable sections
   */
  static shouldIncludeExpansion(userMessage: string): boolean {
    const keywords = [
      "why",
      "how",
      "explain",
      "details",
      "more",
      "example",
      "deep",
      "understand",
      "teach",
      "background",
    ];
    return keywords.some((kw) => userMessage.toLowerCase().includes(kw));
  }

  /**
   * Build context-aware system prompt with memory injection
   */
  static async buildEnhancedPrompt(
    userName: string,
    messages: Array<{ role: string; content: string }>,
    userMemories?: string[]
  ): Promise<string> {
    const context = this.analyzeUserContext(messages);
    const memories = userMemories || [];

    return this.buildSystemPrompt(userName, memories, context, messages);
  }
}
