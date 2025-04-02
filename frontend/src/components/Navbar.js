import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ open, toggleDrawer }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={toggleDrawer}
          edge="start"
          sx={{ marginRight: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div">
          Face Recognition Attendance System
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 