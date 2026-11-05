import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { agents, schemas } from '../resources';

interface SettingsModalProps {
  open: boolean;
  streaming: boolean;
  agentName: string;
  schemaName: string;
  onClose: () => void;
  onStreamingChange: (streaming: boolean) => void;
  onAgentNameChange: (agentName: string) => void;
  onSchemaNameChange: (schemaName: string) => void;
}

const useStyles = makeStyles()((theme) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    paddingTop: `${theme.spacing(1)} !important`,
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
  schemaName,
  onClose,
  onStreamingChange,
  onAgentNameChange,
  onSchemaNameChange,
}: SettingsModalProps) => {
  const { classes } = useStyles();

  // A schema without an agent has no evaluation criteria, so it only makes sense alongside one.
  const handleAgentNameChange = (value: string) => {
    onAgentNameChange(value);

    if (!value) {
      onSchemaNameChange('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className={classes.content}>
        <FormControlLabel
          label="Enable Streaming"
          control={
            <Checkbox
              checked={streaming}
              onChange={(event) => onStreamingChange(event.target.checked)}
            />
          }
        />
        <ResourceSelect
          label="Use Agent"
          value={agentName}
          options={Object.keys(agents)}
          onChange={handleAgentNameChange}
        />
        <ResourceSelect
          label="Use Schema"
          value={schemaName}
          options={Object.keys(schemas)}
          disabled={!agentName}
          onChange={onSchemaNameChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
