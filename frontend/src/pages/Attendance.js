import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Snackbar,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import { format } from 'date-fns';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.get(`/api/attendance/report?date=${formattedDate}`);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch attendance data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when date changes
  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (attendanceData.length === 0) {
      setSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning'
      });
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const headers = ['ID', 'Name', 'Roll Number', 'Time', 'Status'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    attendanceData.forEach((record) => {
      const row = [
        record.student_id,
        record.name,
        record.roll_number,
        record.time,
        record.status
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: 'Attendance data exported successfully',
      severity: 'success'
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Records
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField {...params} fullWidth />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={exportToCSV}
              disabled={attendanceData.length === 0}
            >
              Export to CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : attendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No attendance records found for this date
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.student_id}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell>{record.roll_number}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>{record.status}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={attendanceData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Attendance;