import { Box } from '@mui/material';
import { red } from '@mui/material/colors';
import { makeStyles } from 'tss-react/mui';

interface ErrorBubbleProps {
  text: string;
}

const useStyles = makeStyles()((theme) => ({
  root: {
    fontFamily: theme.typography.body2.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    alignSelf: 'center',
    maxWidth: '85%',
    padding: theme.spacing(1, 1.5),
    backgroundColor: red[50],
    border: `1px solid ${red[200]}`,
    borderRadius: theme.spacing(2),
    color: red[900],
    textAlign: 'center',
    wordBreak: 'break-word',
  },
}));

const ErrorBubble = ({ text }: ErrorBubbleProps) => {
  const { classes } = useStyles();

  return <Box className={classes.root}>{text}</Box>;
};

export default ErrorBubble;
