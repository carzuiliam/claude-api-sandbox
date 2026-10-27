import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

interface SettingsModalProps {
  open: boolean;
  agent: string;
  agentDisabled: boolean;
  streaming: boolean;
  onAgentChange: (agent: string) => void;
  onStreamingChange: (streaming: boolean) => void;
  onClose: () => void;
}

const useStyles = makeStyles()((theme) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
}));

const SettingsModal = ({
  open,
  agent,
  agentDisabled,
  streaming,
  onAgentChange,
  onStreamingChange,
  onClose,
}: SettingsModalProps) => {
  const { classes } = useStyles();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className={classes.content}>
        <Box className={classes.section}>
          <Typography variant="subtitle1">Agent</Typography>
          <TextField
            fullWidth
            multiline
            size="small"
            minRows={3}
            maxRows={6}
            placeholder="Describe how Claude should behave..."
            value={agent}
            disabled={agentDisabled}
            onChange={(event) => onAgentChange(event.target.value)}
          />
        </Box>
        <Box className={classes.section}>
          <Typography variant="subtitle1">Options</Typography>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
