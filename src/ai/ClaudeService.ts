import Anthropic from "@anthropic-ai/sdk";

export interface ClaudeMessage {
    role: "user" | "assistant";
    content: string;
};

export class ClaudeService {
    client = new Anthropic({
        baseURL: `${window.location.origin}/anthropic`,
        apiKey: "proxy",
        dangerouslyAllowBrowser: true,
    });

    model: string;
    maxTokens: number;
    messages: ClaudeMessage[];
    
    constructor() {
        this.model = import.meta.env.VITE_CLAUDE_MODEL;
        this.maxTokens = Number(import.meta.env.VITE_CLAUDE_MAX_TOKENS);
        this.messages = [];
    }

    sendMessage = async (_message: string) => {
        this.messages.push({
            role: "user",
            content: _message,
        });

        const message = await this.client.messages.create({
            model: this.model,
            max_tokens: this.maxTokens,
            messages: this.messages,
        });

        for (const block of message.content) {
            if (block.type === "text") {
                this.messages.push({
                    role: "assistant",
                    content: block.text,
                });
            }
        }
    }

    getLastMessage = () => {
        return this.messages.length > 0 ?
            this.messages[this.messages.length - 1] :
            null;
    }
};