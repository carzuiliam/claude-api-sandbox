import { Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import Chat from './components/Chat';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    boxSizing: 'border-box',
  },
  area: {
    width: '100%',
    maxWidth: 1000,
    height: '80vh',
  },
}));

const App = () => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      <Box className={classes.area}>
        <Chat />
      </Box>
    </Box>
  );
};

export default App;
