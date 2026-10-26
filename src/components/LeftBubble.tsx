import { Box, Typography } from '@mui/material';
import { blue } from '@mui/material/colors';
import { makeStyles } from 'tss-react/mui';

interface LeftBubbleProps {
  text: string;
}

const useStyles = makeStyles()((theme) => ({
  root: {
    alignSelf: 'flex-start',
    maxWidth: '75%',
    padding: theme.spacing(1, 1.5),
    backgroundColor: blue[50],
    borderRadius: theme.spacing(2),
    borderBottomLeftRadius: 0,
    position: 'relative',
    marginLeft: 10,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: -10,
      borderBottom: `10px solid ${blue[50]}`,
      borderLeft: '10px solid transparent',
    },
  },
  text: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

const LeftBubble = ({ text }: LeftBubbleProps) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      <Typography className={classes.text}>{text}</Typography>
    </Box>
  );
};

export default LeftBubble;
