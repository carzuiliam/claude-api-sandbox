import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, Button, IconButton, SvgIcon, TextField, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeMessage, ClaudeService } from '../ai/ClaudeService';
import { agents, schemas } from '../resources';
import ErrorBubble from './ErrorBubble';
import LeftBubble from './LeftBubble';
import RightBubble from './RightBubble';
import SettingsModal from './SettingsModal';

interface ChatMessage extends ClaudeMessage {
  json?: boolean;
  error?: boolean;
}

// API errors carry the response body; prefer its message over the "400 {...}" summary.
const getErrorMessage = (error: unknown) => {
  if (error instanceof Anthropic.APIError) {
    const body = error.error as { error?: { message?: string } } | undefined;

    return body?.error?.message ?? error.message;
  }

  return error instanceof Error ? error.message : String(error);
};

const GearIcon = () => (
  <SvgIcon>
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </SvgIcon>
);

const useStyles = makeStyles()((theme) => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxSizing: 'border-box',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  inputRow: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'inherit',
  },
}));

interface ChatProps {
  claudeService: ClaudeService;
}

const Chat = ({ claudeService }: ChatProps) => {
  const { classes } = useStyles();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [useAgentSchema, setUseAgentSchema] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const appendToLastMessage = (text: string) => {
    setMessages((previous) => {
      const lastMessage = previous[previous.length - 1];

      return [...previous.slice(0, -1), { ...lastMessage, content: lastMessage.content + text }];
    });
  };

  const handleSubmit = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setMessages((previous) => [...previous, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const json = useAgentSchema && agentName in schemas;

      claudeService.setSystemAgent(agentName ? agents[agentName].trim() : '');
      claudeService.setStructuredOutput(json ? schemas[agentName].trim() : '');

      if (streaming) {
        setMessages((previous) => [...previous, { role: 'assistant', content: '', json }]);
        await claudeService.sendMessageStream(text, appendToLastMessage);

        const toolUsed = claudeService.isToolUsedInLastTurn();

        setMessages((previous) => [...previous.slice(0, -1), { ...previous[previous.length - 1], toolUsed }]);
      } else {
        await claudeService.sendMessage(text);

        const lastMessage = claudeService.getLastMessage();

        if (lastMessage?.role === 'assistant') {
          setMessages((previous) => [...previous, { ...lastMessage, json }]);
        }
      }
    } catch (error) {
      console.error('Failed to send message to Claude:', error);

      // Replace the empty streaming placeholder (if any) with the error bubble.
      setMessages((previous) => {
        const lastMessage = previous[previous.length - 1];
        const base = lastMessage?.role === 'assistant' && !lastMessage.content ? previous.slice(0, -1) : previous;

        return [...base, { role: 'assistant', content: getErrorMessage(error), error: true }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box className={classes.container}>
      <Box className={classes.messages}>
        {messages.map((message, index) => (
          message.error ?
            <ErrorBubble key={index} text={message.content} /> :
          message.role === 'user' ?
            <RightBubble key={index} text={message.content} /> :
            <LeftBubble key={index} text={message.content} json={message.json} toolUsed={message.toolUsed} />
        ))}
      </Box>
      <Box className={classes.inputRow}>
        <Tooltip title="Settings">
          <IconButton onClick={() => setSettingsOpen(true)}>
            <GearIcon />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          multiline
          size="small"
          maxRows={3}
          placeholder="Type a message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Send
        </Button>
      </Box>
      <SettingsModal
        open={settingsOpen}
        streaming={streaming}
        agentName={agentName}
        useAgentSchema={useAgentSchema}
        onClose={() => setSettingsOpen(false)}
        onStreamingChange={setStreaming}
        onAgentNameChange={setAgentName}
        onUseAgentSchemaChange={setUseAgentSchema}
      />
    </Box>
  );
};

export default Chat;
