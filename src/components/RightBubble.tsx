import { Box, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

interface RightBubbleProps {
  text: string;
}

const useStyles = makeStyles()((theme) => ({
  root: {
    alignSelf: 'flex-end',
    maxWidth: '75%',
    padding: theme.spacing(1, 1.5),
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    borderBottomRightRadius: 0,
    position: 'relative',
    marginRight: 12,
    '&::before': {
      content: '""',
      position: 'absolute',
      bottom: -1,
      right: -12,
      borderBottom: `11px solid ${theme.palette.divider}`,
      borderRight: '11px solid transparent',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      right: -10,
      borderBottom: `10px solid ${theme.palette.common.white}`,
      borderRight: '10px solid transparent',
    },
  },
  text: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

const RightBubble = ({ text }: RightBubbleProps) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      <Typography className={classes.text}>{text}</Typography>
    </Box>
  );
};

export default RightBubble;
