import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { agents } from '../resources';

interface SettingsModalProps {
  open: boolean;
  streaming: boolean;
  agentName: string;
  useAgentSchema: boolean;
  onClose: () => void;
  onStreamingChange: (streaming: boolean) => void;
  onAgentNameChange: (agentName: string) => void;
  onUseAgentSchemaChange: (useAgentSchema: boolean) => void;
}

const useStyles = makeStyles()((theme) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    paddingTop: `${theme.spacing(1)} !important`,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2, 2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  legend: {
    padding: theme.spacing(0, 0.5),
    fontSize: theme.typography.body2.fontSize,
  },
}));

interface ResourceSelectProps {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

const ResourceSelect = ({ label, value, options, disabled = false, onChange }: ResourceSelectProps) => (
  <TextField
    select
    fullWidth
    size="small"
    label={label}
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
  >
    <MenuItem value="">None</MenuItem>
    {options.map((option) => (
      <MenuItem key={option} value={option}>{option}</MenuItem>
    ))}
  </TextField>
);

const SettingsModal = ({
  open,
  streaming,
  agentName,
  useAgentSchema,
  onClose,
  onStreamingChange,
  onAgentNameChange,
  onUseAgentSchemaChange,
}: SettingsModalProps) => {
  const { classes } = useStyles();

  // A schema without an agent has no evaluation criteria, so it only makes sense alongside one.
  const handleAgentNameChange = (value: string) => {
    onAgentNameChange(value);

    if (!value) {
      onUseAgentSchemaChange(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className={classes.content}>
        <FormControl component="fieldset" className={classes.group}>
          <FormLabel component="legend" className={classes.legend}>Streaming</FormLabel>
          <FormControlLabel
            label="Enable Streaming"
            control={
              <Checkbox
                checked={streaming}
                onChange={(event) => onStreamingChange(event.target.checked)}
              />
            }
          />
        </FormControl>
        <FormControl component="fieldset" className={classes.group}>
          <FormLabel component="legend" className={classes.legend}>Agent</FormLabel>
          <ResourceSelect
            label="Use Agent"
            value={agentName}
            options={Object.keys(agents)}
            onChange={handleAgentNameChange}
          />
          <FormControlLabel
            label="Use Agent Schema"
            disabled={!agentName}
            control={
              <Checkbox
                checked={useAgentSchema}
                onChange={(event) => onUseAgentSchemaChange(event.target.checked)}
              />
            }
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
