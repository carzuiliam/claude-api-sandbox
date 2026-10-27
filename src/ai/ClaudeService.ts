import Anthropic from "@anthropic-ai/sdk";

export interface ClaudeMessage {
    role: "user" | "assistant";
    content: string;
};

export class ClaudeService {
    // Required params
    private client: Anthropic;
    private model: string;
    private maxTokens: number;
    private messages: ClaudeMessage[];
    
    // Optional params;
    private systemAgent: string | null;

    constructor() {
        this.client = new Anthropic({
            baseURL: `${window.location.origin}/anthropic`,
            apiKey: "proxy",
            dangerouslyAllowBrowser: true,
        });

        this.model = import.meta.env.VITE_CLAUDE_MODEL;
        this.maxTokens = Number(import.meta.env.VITE_CLAUDE_MAX_TOKENS);
        this.messages = [];
        this.systemAgent = null;
    };

    setSystemAgent = (_systemAgent: string) => {
        this.systemAgent = _systemAgent;
    };

    stackMessage = (_role: 'user' | 'assistant', _message: string) => {
        this.messages.push({
            role: _role,
            content: _message,
        });
    }

    buildMessageParams = (): any => {
        const params: any = {
            model: this.model,
            max_tokens: this.maxTokens,
            messages: this.messages,
        };

        if (this.systemAgent) {
            params.system = this.systemAgent;
        }

        return params;
    };

    sendMessage = async (_message: string) => {
        this.stackMessage('user', _message);

        const message = await this.client.messages.create(this.buildMessageParams());
        
        for (const block of message.content) {
            if (block.type === "text") {
                this.stackMessage('assistant', block.text);
            }
        }
    };

    sendMessageStream = async (_message: string, _onText: (text: string) => void) => {
        this.stackMessage('user', _message);

        const stream = this.client.messages.stream(this.buildMessageParams());
        stream.on("text", _onText);
        
        const message = await stream.finalMessage();

        for (const block of message.content) {
            if (block.type === "text") {
                this.stackMessage('assistant', block.text);
            }
        }
    };

    getLastMessage = (): ClaudeMessage | null => {
        return this.messages.length > 0 ?
            this.messages[this.messages.length - 1] :
            null;
    };
};