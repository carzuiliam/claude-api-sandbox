import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, Button, IconButton, SvgIcon, TextField } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { ClaudeService } from '../ai/ClaudeService';
import type { ClaudeMessage } from '../ai/ClaudeService';
import LeftBubble from './LeftBubble';
import RightBubble from './RightBubble';
import SettingsModal from './SettingsModal';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: 600,
    height: '80vh',
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

const Chat = () => {
  const { classes } = useStyles();
  const [claudeService] = useState(() => new ClaudeService());
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [agent, setAgent] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
      claudeService.setSystemAgent(agent.trim());

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
    <Box className={classes.root}>
      <Box className={classes.container}>
        <Box className={classes.messages}>
          {messages.map((message, index) => (
            message.role === 'user' ?
              <RightBubble key={index} text={message.content} /> :
              <LeftBubble key={index} text={message.content} />
          ))}
        </Box>
        <Box className={classes.inputRow}>
          <IconButton aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <SvgIcon>
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </SvgIcon>
          </IconButton>
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
      <SettingsModal
        open={settingsOpen}
        agent={agent}
        agentDisabled={messages.length > 0}
        streaming={streaming}
        onAgentChange={setAgent}
        onStreamingChange={setStreaming}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
};

export default Chat;
