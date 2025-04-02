import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Layout components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Attendance from './pages/Attendance';
import AttendanceReport from './pages/AttendanceReport';
import CameraPage from './pages/CameraPage';

function App() {
  const [open, setOpen] = React.useState(true);
  
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navbar open={open} toggleDrawer={toggleDrawer} />
      <Sidebar open={open} toggleDrawer={toggleDrawer} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          mt: 8
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<AttendanceReport />} />
          <Route path="/camera" element={<CameraPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App; 