import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar,
  Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SubjectIcon from '@mui/icons-material/Subject';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Students', icon: <PeopleIcon />, path: '/students' },
  { text: 'Subjects', icon: <SubjectIcon />, path: '/subjects' },
  { text: 'Take Attendance', icon: <CameraAltIcon />, path: '/camera' },
  { text: 'Attendance', icon: <AssignmentIcon />, path: '/attendance' },
  { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
];

const Sidebar = ({ open, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          display: { xs: open ? 'block' : 'none', sm: 'block' }
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 