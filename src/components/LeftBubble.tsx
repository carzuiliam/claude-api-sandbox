import { Box } from '@mui/material';
import { blue } from '@mui/material/colors';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { makeStyles } from 'tss-react/mui';

interface LeftBubbleProps {
  text: string;
  json?: boolean;
}

// While streaming the JSON is incomplete and won't parse, so fall back to the raw text.
const formatJson = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

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
    ...theme.typography.body1,
    wordBreak: 'break-word',
    '& > :first-child': {
      marginTop: 0,
    },
    '& > :last-child': {
      marginBottom: 0,
    },
    '& p, & ul, & ol, & pre': {
      margin: theme.spacing(1, 0),
    },
    '& code': {
      fontFamily: 'monospace',
      backgroundColor: blue[100],
      padding: theme.spacing(0.25, 0.5),
      borderRadius: 4,
    },
    '& pre': {
      overflowX: 'auto',
      backgroundColor: blue[100],
      padding: theme.spacing(1),
      borderRadius: 4,
    },
    '& pre code': {
      padding: 0,
    },
    '& table': {
      display: 'block',
      overflowX: 'auto',
      borderCollapse: 'collapse',
      margin: theme.spacing(1, 0),
    },
    '& th, & td': {
      border: `1px solid ${blue[200]}`,
      padding: theme.spacing(0.5, 1),
    },
    '& th': {
      backgroundColor: blue[100],
    },
    '& ul.contains-task-list': {
      listStyle: 'none',
      paddingLeft: theme.spacing(1),
    },
  },
}));

const LeftBubble = ({ text, json = false }: LeftBubbleProps) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      <Box className={classes.text}>
        {json ? (
          <pre><code>{formatJson(text)}</code></pre>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        )}
      </Box>
    </Box>
  );
};

export default LeftBubble;
