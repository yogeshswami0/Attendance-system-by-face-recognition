import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Webcam from 'react-webcam';
import axios from 'axios';
import { format } from 'date-fns';

const CameraPage = () => {
  const webcamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureInterval, setCaptureInterval] = useState(null);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Handle webcam errors
  const handleWebcamError = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'Error accessing camera. Please check permissions.',
      severity: 'error'
    });
    setIsCameraReady(false);
  }, []);

  // Handle when webcam is ready
  const handleWebcamReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Fetch subjects when component mounts
  useEffect(() => {
    axios.get('/api/subjects')
      .then(response => {
        setSubjects(response.data);
      })
      .catch(error => console.error('Error fetching subjects:', error));
  }, []);

  // Capture image and send to server for recognition
  const captureImage = useCallback(async () => {
    if (webcamRef.current && selectedSubject) {
      try {
        // Get screenshot as base64 data
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        // Convert base64 to blob
        const byteString = atob(imageSrc.split(',')[1]);
        const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], 'capture.jpg', { type: mimeString });

        // Create form data
        const formData = new FormData();
        formData.append('image', file);
        formData.append('subject_id', selectedSubject);

        // Send to server
        const response = await axios.post('/api/attendance', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Update recognized students
        if (response.data.recognized_count > 0) {
          const newStudents = response.data.students.map(student => ({
            ...student,
            timestamp: new Date().toISOString()
          }));
          
          // Add new students to the list without duplicates
          setRecognizedStudents(prev => {
            const currentIds = new Set(prev.map(s => s.id));
            const uniqueNewStudents = newStudents.filter(s => !currentIds.has(s.id));
            return [...prev, ...uniqueNewStudents];
          });
          
          if (newStudents.length > 0) {
            setSnackbar({
              open: true,
              message: `Recognized ${response.data.recognized_count} student(s)!`,
              severity: 'success'
            });
          }
        }
      } catch (error) {
        console.error('Error recognizing faces:', error);
        console.log('Error details:', error.response?.data);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Error processing image',
          severity: 'error'
        });
      }
    } else if (!selectedSubject) {
      setSnackbar({
        open: true,
        message: 'Please select a subject before capturing',
        severity: 'warning'
      });
    }
  }, [webcamRef, selectedSubject]);

  // Start/stop continuous recognition
  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      // Stop capturing
      if (captureInterval) {
        clearInterval(captureInterval);
        setCaptureInterval(null);
      }
      setIsCapturing(false);
      setSnackbar({
        open: true,
        message: 'Attendance session stopped',
        severity: 'info'
      });
    } else {
      // Start capturing
      setIsCapturing(true);
      // Capture immediately
      captureImage();
      // Then set interval
      const interval = setInterval(captureImage, 3000); // Capture every 3 seconds
      setCaptureInterval(interval);
      setSnackbar({
        open: true,
        message: 'Attendance session started',
        severity: 'info'
      });
    }
  }, [isCapturing, captureInterval, captureImage]);

  // Clear attendance session
  const clearSession = useCallback(() => {
    setRecognizedStudents([]);
    setSnackbar({
      open: true,
      message: 'Attendance session cleared',
      severity: 'info'
    });
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (captureInterval) {
        clearInterval(captureInterval);
      }
    };
  }, [captureInterval]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Take Attendance
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Camera Feed
            </Typography>
            
            <Box className="webcam-container" position="relative">
              {!isCameraReady && (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center"
                  sx={{ 
                    width: '100%', 
                    height: 400, 
                    backgroundColor: '#f0f0f0',
                    borderRadius: 2
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                onUserMedia={handleWebcamReady}
                onUserMediaError={handleWebcamError}
                videoConstraints={{
                  width: 720,
                  height: 480,
                  facingMode: "user"
                }}
                className="webcam"
                style={{
                  display: isCameraReady ? 'block' : 'none',
                  width: '100%',
                  borderRadius: '8px'
                }}
              />
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
              <InputLabel id="subject-select-label">Subject</InputLabel>
              <Select
                labelId="subject-select-label"
                value={selectedSubject}
                label="Subject"
                onChange={(e) => setSelectedSubject(e.target.value)}
                required
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color={isCapturing ? "error" : "primary"}
                onClick={toggleCapture}
                disabled={!isCameraReady}
              >
                {isCapturing ? "Stop Recognition" : "Start Recognition"}
              </Button>
              
              <Button
                variant="outlined"
                onClick={clearSession}
                disabled={recognizedStudents.length === 0}
              >
                Clear Session
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={captureImage}
                disabled={!isCameraReady || isCapturing}
              >
                Capture Single Frame
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ maxHeight: 600, overflow: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recognized Students ({recognizedStudents.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recognizedStudents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  No students recognized yet
                </Typography>
              ) : (
                <List>
                  {recognizedStudents.map((student, index) => (
                    <React.Fragment key={`${student.id}-${index}`}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>{student.name.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={student.name} 
                          secondary={`${student.roll_number} - ${format(new Date(student.timestamp), 'HH:mm:ss')}`} 
                        />
                      </ListItem>
                      {index < recognizedStudents.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
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

export default CameraPage; 