import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Divider,
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
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch students
  useEffect(() => {
    axios.get('/api/students')
      .then(response => {
        setStudents(response.data);
      })
      .catch(error => console.error('Error fetching students:', error));
  }, []);

  // Generate monthly report
  const generateReport = async () => {
    setLoading(true);
    try {
      // Get all days in the selected month
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      const daysInMonth = eachDayOfInterval({ start, end });
      
      // Generate labels for chart (dates of the month)
      const dateLabels = daysInMonth.map(date => format(date, 'd'));
      
      // Create mock data for chart (in a real app, this would come from the server)
      const mockData = daysInMonth.map(() => Math.floor(Math.random() * 40) + 60); // Random values between 60-100%
      
      setChartData({
        labels: dateLabels,
        datasets: [
          {
            label: 'Attendance Rate (%)',
            data: mockData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          },
        ],
      });
      
      // Mock report data (in a real app, this would come from the server)
      const mockReportData = students.map(student => {
        const presentDays = Math.floor(Math.random() * (daysInMonth.length + 1));
        const attendanceRate = (presentDays / daysInMonth.length) * 100;
        
        return {
          id: student.id,
          name: student.name,
          roll_number: student.roll_number,
          present_days: presentDays,
          absent_days: daysInMonth.length - presentDays,
          total_days: daysInMonth.length,
          attendance_rate: attendanceRate.toFixed(2)
        };
      });
      
      setReportData(mockReportData);
      setSnackbar({
        open: true,
        message: 'Report generated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate report',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle month change
  const handleMonthChange = (newDate) => {
    setSelectedMonth(newDate);
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (reportData.length === 0) {
      setSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning'
      });
      return;
    }

    const monthYear = format(selectedMonth, 'MMMM_yyyy');
    const headers = ['ID', 'Name', 'Roll Number', 'Present Days', 'Absent Days', 'Total Days', 'Attendance Rate (%)'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    reportData.forEach((record) => {
      const row = [
        record.id,
        record.name,
        record.roll_number,
        record.present_days,
        record.absent_days,
        record.total_days,
        record.attendance_rate
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: 'Report exported successfully',
      severity: 'success'
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Reports
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Month"
                views={['year', 'month']}
                value={selectedMonth}
                onChange={handleMonthChange}
                renderInput={(params) => (
                  <TextField {...params} fullWidth helperText="Select month and year" />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={generateReport}
              disabled={loading}
            >
              Generate Report
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={exportToCSV}
              disabled={reportData.length === 0 || loading}
            >
              Export to CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Chart */}
      {chartData.labels.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Monthly Attendance Trend - {format(selectedMonth, 'MMMM yyyy')}
          </Typography>
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              }
            }}
          />
        </Paper>
      )}
      
      {/* Report Table */}
      {reportData.length > 0 && (
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell align="right">Present Days</TableCell>
                  <TableCell align="right">Absent Days</TableCell>
                  <TableCell align="right">Total Days</TableCell>
                  <TableCell align="right">Attendance Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.id}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell>{record.roll_number}</TableCell>
                      <TableCell align="right">{record.present_days}</TableCell>
                      <TableCell align="right">{record.absent_days}</TableCell>
                      <TableCell align="right">{record.total_days}</TableCell>
                      <TableCell align="right">{record.attendance_rate}%</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={reportData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
      
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

export default AttendanceReport; 