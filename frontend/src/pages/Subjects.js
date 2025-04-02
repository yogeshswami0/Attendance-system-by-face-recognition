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
  Alert,
  Fade,
  Zoom
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [subjectData, setSubjectData] = useState({
    id: null,
    code: '',
    name: '',
    faculty: '',
    description: ''
  });

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch subjects',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Handle dialog open/close
  const handleOpenDialog = () => {
    setSubjectData({
      id: null,
      code: '',
      name: '',
      faculty: '',
      description: ''
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleEditSubject = (subject) => {
    setSubjectData(subject);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSubjectData({
      id: null,
      code: '',
      name: '',
      faculty: '',
      description: ''
    });
  };

  // Handle student submission
  const handleSubmit = async () => {
    if (!subjectData.name || !subjectData.code || !subjectData.faculty) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await axios.post('/api/subjects', subjectData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setSubjects(prev => [...prev, response.data]);
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Subject added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding subject:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to add subject',
        severity: 'error'
      });
    }
  };

  // Handle student deletion
  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`/api/subjects/${id}`);
      setSubjects(prev => prev.filter(subject => subject.id !== id));
      setSnackbar({
        open: true,
        message: 'Subject deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete subject',
        severity: 'error'
      });
    }
  };

  // DataGrid columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 150 },
    { field: 'faculty', headerName: 'Faculty', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton 
            color="primary" 
            onClick={() => handleEditSubject(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            onClick={() => handleDeleteSubject(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Subjects</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenDialog}
        >
          Add Subject
        </Button>
      </Box>

      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={subjects}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          autoHeight
          loading={loading}
          disableSelectionOnClick
        />
      </Paper>

      {/* Add Subject Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Subject</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Full Name"
                fullWidth
                value={subjectData.name}
                onChange={(e) => setSubjectData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="code"
                label="Code"
                fullWidth
                value={subjectData.code}
                onChange={(e) => setSubjectData(prev => ({ ...prev, code: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="faculty"
                label="Faculty"
                fullWidth
                value={subjectData.faculty}
                onChange={(e) => setSubjectData(prev => ({ ...prev, faculty: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                value={subjectData.description}
                onChange={(e) => setSubjectData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!subjectData.name || !subjectData.code || !subjectData.faculty}
          >
            Add Subject
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

export default Subjects; 