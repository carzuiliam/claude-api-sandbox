import { Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useState } from 'react';
import { ClaudeService } from './ai/ClaudeService';
import Chat from './components/Chat';
import MessageStack from './components/MessageStack';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    padding: theme.spacing(2),
    boxSizing: 'border-box',
  },
  area: {
    width: '100%',
    height: '100%',
    display: 'flex',
    gap: theme.spacing(2),
  },
  chat: {
    flex: 3,
    minWidth: 0,
  },
  sidePanel: {
    flex: 2,
    minWidth: 0,
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxSizing: 'border-box',
  },
}));

const App = () => {
  const { classes } = useStyles();
  const [claudeService] = useState(() => new ClaudeService());

  return (
    <Box className={classes.root}>
      <Box className={classes.area}>
        <Box className={classes.chat}>
          <Chat claudeService={claudeService} />
        </Box>
        <Box className={classes.sidePanel}>
          <MessageStack claudeService={claudeService} />
        </Box>
      </Box>
    </Box>
  );
};

export default App;
