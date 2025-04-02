import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  CardHeader,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fade,
  Button
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const [studentCount, setStudentCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [subjects, setSubjects] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    // Fetch student count
    axios.get('/api/students')
      .then(response => {
        setStudentCount(response.data.length);
      })
      .catch(error => console.error('Error fetching students:', error));

    // Fetch subjects
    axios.get('/api/subjects')
      .then(response => {
        setSubjects(response.data);
        setSubjectCount(response.data.length);
      })
      .catch(error => console.error('Error fetching subjects:', error));

    // Fetch overall statistics
    axios.get('/api/attendance/statistics')
      .then(response => {
        setAttendanceStats({
          present: response.data.today_attendance,
          absent: response.data.student_count - response.data.today_attendance,
          percentage: response.data.today_percentage
        });
      })
      .catch(error => console.error('Error fetching statistics:', error));

    // Fetch today's attendance
    const today = format(new Date(), 'yyyy-MM-dd');
    axios.get(`/api/attendance/report?date=${today}`)
      .then(response => {
        setTodayAttendance(response.data);
      })
      .catch(error => console.error('Error fetching attendance:', error));

    // Create chart data from subjects (attendance by subject)
    if (subjects.length > 0) {
      const subjectNames = subjects.map(subject => subject.name);
      const subjectAttendance = subjects.map(subject => Math.round(Math.random() * 30) + 70); // Mock data

      setChartData({
        labels: subjectNames,
        datasets: [
          {
            label: 'Attendance Percentage',
            data: subjectAttendance,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          },
        ],
      });
    }
  }, [subjects.length]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Fade in={true} style={{ transitionDelay: '100ms' }}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="primary">Total Students</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {studentCount}
              </Typography>
              <Button size="small" onClick={() => navigate('/students')}>View Students</Button>
            </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Fade in={true} style={{ transitionDelay: '200ms' }}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="primary">Total Subjects</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {subjectCount}
              </Typography>
              <Button size="small" onClick={() => navigate('/subjects')}>Manage Subjects</Button>
            </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Fade in={true} style={{ transitionDelay: '300ms' }}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="primary">Today's Attendance</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {attendanceStats.present} / {studentCount}
              </Typography>
              <Button size="small" onClick={() => navigate('/attendance')}>View Details</Button>
            </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Fade in={true} style={{ transitionDelay: '400ms' }}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="primary">Attendance Rate</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {attendanceStats.percentage}%
              </Typography>
              <Button size="small" onClick={() => navigate('/reports')}>View Reports</Button>
            </Paper>
          </Fade>
        </Grid>
        
        {/* Subjects List */}
        <Grid item xs={12} md={4}>
          <Fade in={true} style={{ transitionDelay: '500ms' }}>
            <Paper elevation={3} sx={{ height: '100%' }}>
              <CardHeader title="Registered Subjects" />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ height: 300, overflow: 'auto' }}>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <React.Fragment key={subject.id}>
                        <ListItem button onClick={() => navigate(`/subjects/${subject.id}`)}>
                          <ListItemText 
                            primary={subject.name} 
                            secondary={`${subject.code} - ${subject.faculty || 'No faculty assigned'}`} 
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No subjects registered yet" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Paper>
          </Fade>
        </Grid>
        
        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Fade in={true} style={{ transitionDelay: '600ms' }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Attendance by Subject</Typography>
              {subjects.length > 0 ? (
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
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No subjects available for chart data</Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/subjects')}
                  >
                    Add Subjects
                  </Button>
                </Box>
              )}
            </Paper>
          </Fade>
        </Grid>
        
        {/* Recent Attendance */}
        <Grid item xs={12}>
          <Fade in={true} style={{ transitionDelay: '700ms' }}>
            <Paper elevation={3} sx={{ height: '100%' }}>
              <CardHeader title="Today's Attendance Log" />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {todayAttendance.length > 0 ? (
                    todayAttendance.map((record) => (
                      <React.Fragment key={record.id}>
                        <ListItem>
                          <ListItemText 
                            primary={record.name} 
                            secondary={`${record.roll_number} - ${record.subject_name || 'Unknown Subject'} - ${record.time}`} 
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No attendance records for today" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Paper>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 