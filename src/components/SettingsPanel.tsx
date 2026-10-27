import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

interface SettingsPanelProps {
  agent: string;
  agentEnabled: boolean;
  streaming: boolean;
  outputSchema: string;
  outputSchemaEnabled: boolean;
  onAgentChange: (agent: string) => void;
  onAgentEnabledChange: (agentEnabled: boolean) => void;
  onStreamingChange: (streaming: boolean) => void;
  onOutputSchemaChange: (outputSchema: string) => void;
  onOutputSchemaEnabledChange: (outputSchemaEnabled: boolean) => void;
}

const useStyles = makeStyles()((theme) => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  sectionTitle: {
    fontWeight: theme.typography.fontWeightBold,
  },
}));

const SettingsPanel = ({
  agent,
  agentEnabled,
  streaming,
  outputSchema,
  outputSchemaEnabled,
  onAgentChange,
  onAgentEnabledChange,
  onStreamingChange,
  onOutputSchemaChange,
  onOutputSchemaEnabledChange,
}: SettingsPanelProps) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.container}>
      <Box className={classes.section}>
        <Typography variant="subtitle1" className={classes.sectionTitle}>Agent</Typography>
        <FormControlLabel
          label="Enable Agent"
          control={
            <Checkbox
              checked={agentEnabled}
              onChange={(event) => onAgentEnabledChange(event.target.checked)}
            />
          }
        />
        <TextField
          fullWidth
          multiline
          size="small"
          minRows={3}
          maxRows={6}
          placeholder="Describe how Claude should behave..."
          value={agent}
          disabled={!agentEnabled}
          onChange={(event) => onAgentChange(event.target.value)}
        />
      </Box>
      <Box className={classes.section}>
        <Typography variant="subtitle1" className={classes.sectionTitle}>Streaming</Typography>
        <FormControlLabel
          label="Enable Streaming"
          control={
            <Checkbox
              checked={streaming}
              onChange={(event) => onStreamingChange(event.target.checked)}
            />
          }
        />
      </Box>
      <Box className={classes.section}>
        <Typography variant="subtitle1" className={classes.sectionTitle}>Structured Outputs</Typography>
        <FormControlLabel
          label="Enable Structured Outputs"
          control={
            <Checkbox
              checked={outputSchemaEnabled}
              onChange={(event) => onOutputSchemaEnabledChange(event.target.checked)}
            />
          }
        />
        <TextField
          fullWidth
          multiline
          size="small"
          minRows={3}
          maxRows={10}
          placeholder="Paste the JSON schema..."
          value={outputSchema}
          disabled={!outputSchemaEnabled}
          onChange={(event) => onOutputSchemaChange(event.target.value)}
        />
      </Box>
    </Box>
  );
};

export default SettingsPanel;
