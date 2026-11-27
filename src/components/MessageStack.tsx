import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { blue, grey } from '@mui/material/colors';
import { makeStyles } from 'tss-react/mui';
import type Anthropic from '@anthropic-ai/sdk';
import type { ClaudeService } from '../ai/ClaudeService';

interface MessageStackProps {
  claudeService: ClaudeService;
}

const useStyles = makeStyles()((theme) => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  entry: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    flexShrink: 0,
  },
  header: {
    padding: theme.spacing(0.5, 1),
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  user: {
    backgroundColor: grey[200],
  },
  assistant: {
    backgroundColor: blue[50],
  },
  json: {
    margin: 0,
    padding: theme.spacing(1),
    fontFamily: 'monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

// Shows the raw messages array sent to the API, updated whenever the history changes.
const MessageStack = ({ claudeService }: MessageStackProps) => {
  const { classes, cx } = useStyles();
  const [messages, setMessages] = useState<Anthropic.MessageParam[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => claudeService.onMessagesChange(setMessages), [claudeService]);

  // Keeps the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  return (
    <Box className={classes.container}>
      <Typography variant="h6">Message Stack</Typography>
      <Box className={classes.list} ref={listRef}>
        {messages.map((message, index) => (
          <Box key={index} className={classes.entry}>
            <Box className={cx(classes.header, message.role === 'assistant' ? classes.assistant : classes.user)}>
              [{index}] {message.role}
            </Box>
            <pre className={classes.json}>{JSON.stringify(message, null, 2)}</pre>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MessageStack;
