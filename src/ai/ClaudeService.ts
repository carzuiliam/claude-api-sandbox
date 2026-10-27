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
    private structuredOutput: { [key: string]: unknown } | null;

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
        this.structuredOutput = null;
    };

    setSystemAgent = (_systemAgent: string) => {
        this.systemAgent = _systemAgent;
    };

    setStructuredOutput = (_structuredOutput: string) => {
        this.structuredOutput = _structuredOutput ? JSON.parse(_structuredOutput) : null;
    };

    stackMessage = (_role: 'user' | 'assistant', _message: string) => {
        this.messages.push({
            role: _role,
            content: _message,
        });
    };

    buildMessageParams = (): Anthropic.Messages.MessageCreateParamsNonStreaming => {
        const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
            model: this.model,
            max_tokens: this.maxTokens,
            messages: this.messages,
        };

        if (this.systemAgent) {
            params.system = this.systemAgent;
        }

        if (this.structuredOutput) {
            params.output_config = {
                format: {
                    type: 'json_schema',
                    schema: this.structuredOutput,
                },
            };
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