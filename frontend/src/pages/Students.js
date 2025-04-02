import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [newStudent, setNewStudent] = useState({
    name: '',
    roll_number: '',
    image: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch students',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle dialog open/close
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewStudent({
      name: '',
      roll_number: '',
      image: null
    });
    setPreviewUrl(null);
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewStudent(prev => ({
        ...prev,
        image: file
      }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle student submission
  const handleSubmit = async () => {
    if (!newStudent.name || !newStudent.roll_number || !newStudent.image) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newStudent.name);
      formData.append('roll_number', newStudent.roll_number);
      formData.append('image', newStudent.image);

      const response = await axios.post('/api/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setStudents(prev => [...prev, response.data]);
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Student added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding student:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to add student',
        severity: 'error'
      });
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`);
      setStudents(prev => prev.filter(student => student.id !== id));
      setSnackbar({
        open: true,
        message: 'Student deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete student',
        severity: 'error'
      });
    }
  };

  // DataGrid columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'roll_number', headerName: 'Roll Number', width: 150 },
    {
      field: 'image',
      headerName: 'Photo',
      width: 150,
      renderCell: (params) => (
        <Box
          component="img"
          sx={{
            height: 50,
            width: 50,
            objectFit: 'cover',
            borderRadius: '50%'
          }}
          src={`/${params.row.image_path}`}
          alt={params.row.name}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <IconButton 
          color="error" 
          onClick={() => handleDeleteStudent(params.row.id)}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Students</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenDialog}
        >
          Add Student
        </Button>
      </Box>

      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={students}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          autoHeight
          loading={loading}
          disableSelectionOnClick
        />
      </Paper>

      {/* Add Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Full Name"
                fullWidth
                value={newStudent.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="roll_number"
                label="Roll Number"
                fullWidth
                value={newStudent.roll_number}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography mb={1}>Student Photo</Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="raised-button-file">
                <Button variant="contained" component="span">
                  Upload Photo
                </Button>
              </label>
            </Grid>
            {previewUrl && (
              <Grid item xs={12} display="flex" justifyContent="center">
                <Box
                  component="img"
                  sx={{
                    height: 200,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 2
                  }}
                  src={previewUrl}
                  alt="Preview"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!newStudent.name || !newStudent.roll_number || !newStudent.image}
          >
            Add Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default Students;
