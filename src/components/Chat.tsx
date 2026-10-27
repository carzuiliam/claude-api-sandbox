import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { ClaudeService } from '../ai/ClaudeService';
import type { ClaudeMessage } from '../ai/ClaudeService';
import LeftBubble from './LeftBubble';
import RightBubble from './RightBubble';

interface ChatProps {
  agent: string;
  agentEnabled: boolean;
  streaming: boolean;
  outputSchema: string;
  outputSchemaEnabled: boolean;
}

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

const Chat = ({ agent, agentEnabled, streaming, outputSchema, outputSchemaEnabled }: ChatProps) => {
  const { classes } = useStyles();
  const [claudeService] = useState(() => new ClaudeService());
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
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
      claudeService.setSystemAgent(agentEnabled ? agent.trim() : '');
      claudeService.setStructuredOutput(outputSchemaEnabled ? outputSchema.trim() : '');

      if (streaming) {
        setMessages((previous) => [...previous, { role: 'assistant', content: '' }]);
        await claudeService.sendMessageStream(text, appendToLastMessage);
      } else {
        await claudeService.sendMessage(text);

        const lastMessage = claudeService.getLastMessage();

        if (lastMessage?.role === 'assistant') {
          setMessages((previous) => [...previous, lastMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to send message to Claude:', error);
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
          message.role === 'user' ?
            <RightBubble key={index} text={message.content} /> :
            <LeftBubble key={index} text={message.content} />
        ))}
      </Box>
      <Box className={classes.inputRow}>
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
    </Box>
  );
};

export default Chat;
