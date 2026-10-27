import { useState } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import Chat from './components/Chat';
import SettingsPanel from './components/SettingsPanel';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    boxSizing: 'border-box',
  },
  area: {
    width: '100%',
    maxWidth: 500,
    height: '80vh',
  },
}));

const App = () => {
  const { classes } = useStyles();
  const [agent, setAgent] = useState('');
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [outputSchema, setOutputSchema] = useState('');
  const [outputSchemaEnabled, setOutputSchemaEnabled] = useState(false);

  return (
    <Box className={classes.root}>
      <Box className={classes.area}>
        <SettingsPanel
          agent={agent}
          agentEnabled={agentEnabled}
          streaming={streaming}
          outputSchema={outputSchema}
          outputSchemaEnabled={outputSchemaEnabled}
          onAgentChange={setAgent}
          onAgentEnabledChange={setAgentEnabled}
          onStreamingChange={setStreaming}
          onOutputSchemaChange={setOutputSchema}
          onOutputSchemaEnabledChange={setOutputSchemaEnabled}
        />
      </Box>
      <Box className={classes.area}>
        <Chat
          agent={agent}
          agentEnabled={agentEnabled}
          streaming={streaming}
          outputSchema={outputSchema}
          outputSchemaEnabled={outputSchemaEnabled}
        />
      </Box>
    </Box>
  );
};

export default App;
