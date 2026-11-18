import Anthropic from "@anthropic-ai/sdk";
import { ToolService } from "./ToolService";
import toolSchema from "../resources/tools/tool-schema.json?raw";

export interface ClaudeMessage {
    role: "user" | "assistant";
    content: string;
    toolUsed?: boolean;
};

export class ClaudeService {
    // Required params
    private client: Anthropic;
    private model: string;
    private maxTokens: number;
    private messages: Anthropic.MessageParam[];
    private tools: Anthropic.Tool[];
    
    // Optional params
    private systemAgent: string | null;
    private structuredOutput: { [key: string]: unknown } | null;

    // Internal params
    private toolService: ToolService;

    constructor() {
        this.client = new Anthropic({
            baseURL: `${window.location.origin}/anthropic`,
            apiKey: "proxy",
            dangerouslyAllowBrowser: true,
        });

        this.model = import.meta.env.VITE_CLAUDE_MODEL;
        this.maxTokens = Number(import.meta.env.VITE_CLAUDE_MAX_TOKENS);
        this.messages = [];
        this.tools = JSON.parse(toolSchema);
        
        this.systemAgent = null;
        this.structuredOutput = null;

        this.toolService = new ToolService();
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
            tools: this.tools,
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

    runTool = async (_block: Anthropic.ToolUseBlock): Promise<Anthropic.ToolResultBlockParam> => {
        try {
            let content: string;

            switch (_block.name) {
                case 'search_cep':
                    content = await this.toolService.searchCep((_block.input as { cep: string }).cep);
                    break;
                case 'get_local_time':
                    content = this.toolService.getLocalTime();
                    break;
                default:
                    throw new Error(`Unknown tool: ${_block.name}.`);
            }

            return {
                type: 'tool_result',
                tool_use_id: _block.id,
                content,
            };
        } catch (error) {
            console.error(`Failed to run tool ${_block.name}:`, error);

            return {
                type: 'tool_result',
                tool_use_id: _block.id,
                content: error instanceof Error ? error.message : String(error),
                is_error: true,
            };
        }
    };

    runTools = async (_message: Anthropic.Message): Promise<boolean> => {
        this.messages.push({ role: 'assistant', content: _message.content });

        if (_message.stop_reason !== 'tool_use') {
            return false;
        }

        const toolUses = _message.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
        const results = await Promise.all(toolUses.map(this.runTool));

        this.messages.push({ role: 'user', content: results });

        return true;
    };

    sendMessage = async (_message: string) => {
        this.stackMessage('user', _message);

        let message: Anthropic.Message;

        do {
            message = await this.client.messages.create(this.buildMessageParams());
        } while (await this.runTools(message));
    };

    sendMessageStream = async (_message: string, _onText: (text: string) => void) => {
        this.stackMessage('user', _message);

        let message: Anthropic.Message;

        do {
            const stream = this.client.messages.stream(this.buildMessageParams());
            stream.on("text", _onText);

            message = await stream.finalMessage();
        } while (await this.runTools(message));
    };

    // Checks the turn since the last user prompt (tool results are user messages with block content).
    isToolUsedInLastTurn = (): boolean => {
        for (let index = this.messages.length - 1; index >= 0; index--) {
            const { role, content } = this.messages[index];

            if (role === 'user' && typeof content === 'string') {
                return false;
            }

            if (role === 'assistant' && typeof content !== 'string' && content.some((block) => block.type === 'tool_use')) {
                return true;
            }
        }

        return false;
    };

    getLastMessage = (): ClaudeMessage | null => {
        const lastMessage = this.messages[this.messages.length - 1];

        if (!lastMessage || lastMessage.role === 'system') {
            return null;
        }

        const content = typeof lastMessage.content === 'string' ?
            lastMessage.content :
            lastMessage.content
                .map((block) => block.type === 'text' ? block.text : '')
                .join('');

        return { role: lastMessage.role, content, toolUsed: this.isToolUsedInLastTurn() };
    };
};