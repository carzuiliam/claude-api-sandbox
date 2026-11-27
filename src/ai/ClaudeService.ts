import Anthropic from "@anthropic-ai/sdk";
import { ToolService } from "./ToolService";
import { FileService } from "./FileService";
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
    private tools: Anthropic.ToolUnion[];
    
    // Optional params
    private systemAgent: string | null;
    private structuredOutput: { [key: string]: unknown } | null;

    // Internal params
    private toolService: ToolService;
    private fileService: FileService;
    private listeners: Set<(messages: Anthropic.MessageParam[]) => void> = new Set();

    // Creates the proxied client and loads model settings and tool definitions.
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
        this.fileService = new FileService();
    };

    // Sets the system prompt sent with every request.
    setSystemAgent = (_systemAgent: string) => {
        this.systemAgent = _systemAgent;
    };

    // Sets the JSON schema for structured output (an empty string clears it).
    setStructuredOutput = (_structuredOutput: string) => {
        this.structuredOutput = _structuredOutput ? JSON.parse(_structuredOutput) : null;
    };

    // Subscribes to history changes; returns a function that unsubscribes.
    onMessagesChange = (_listener: (messages: Anthropic.MessageParam[]) => void) => {
        this.listeners.add(_listener);
        
        _listener([...this.messages]);

        return () => {
            this.listeners.delete(_listener);
        };
    };

    // Appends a message to the history and notifies the listeners with a copy of it.
    pushMessage = (_message: Anthropic.MessageParam) => {
        this.messages.push(_message);
        this.listeners.forEach((listener) => listener([...this.messages]));
    };

    // Appends a plain text message to the conversation history.
    stackMessage = (_role: 'user' | 'assistant', _message: string) => {
        this.pushMessage({
            role: _role,
            content: _message,
        });
    };

    // Builds the request params from the history, tools, and optional settings.
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

    // Runs one client tool call and wraps its output (or error) as a tool result.
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
                case 'str_replace_based_edit_tool':
                    content = await this.fileService.runEditorCommand(_block.input);
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

    // Returns true when the conversation must be sent again (client tool results or a paused server tool turn).
    runTools = async (_message: Anthropic.Message): Promise<boolean> => {
        this.pushMessage({ role: 'assistant', content: _message.content });
        
        // Server tool errors (e.g. web search) come back as HTTP 200 with an error object instead of a result list.
        for (const block of _message.content) {
            if (block.type === 'web_search_tool_result' && !Array.isArray(block.content)) {
                console.error(`Web search failed: ${block.content.error_code}.`);
            }
        }
        
        // Long server tool turns (e.g. several web searches) may pause; resending the conversation resumes them.
        if (_message.stop_reason === 'pause_turn') {
            return true;
        }

        if (_message.stop_reason !== 'tool_use') {
            return false;
        }

        const toolUses = _message.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
        const results = await Promise.all(toolUses.map(this.runTool));

        this.pushMessage({ role: 'user', content: results });

        return true;
    };

    // Sends a user message and loops until Claude finishes, without streaming.
    sendMessage = async (_message: string) => {
        this.stackMessage('user', _message);

        let message: Anthropic.Message;

        do {
            message = await this.client.messages.create(this.buildMessageParams());
        } while (await this.runTools(message));
    };

    // Sends a user message and loops until Claude finishes, streaming text to the callback.
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

            if (role === 'assistant' && typeof content !== 'string' &&
                content.some((block) => block.type === 'tool_use' || block.type === 'server_tool_use')
            ) {
                return true;
            }
        }

        return false;
    };

    // Returns the last message's text and whether a tool ran in that turn.
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