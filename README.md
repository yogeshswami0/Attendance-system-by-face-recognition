# Attendance-system-by-face-recognition

A modern attendance system that uses facial recognition technology to automate student attendance tracking. The system can detect and recognize multiple students in a single frame.

## Features

- **Real-time Face Recognition**: Automatically detects and recognizes students using webcam feed
- **Multi-Face Detection**: Can detect and recognize multiple students in one frame
- **Attendance Tracking**: Records attendance with timestamps
- **Student Management**: Add, update, and delete student profiles with photos
- **Dashboard**: Visualize attendance data with charts and statistics
- **Attendance Reports**: Generate and export attendance reports
- **Responsive UI**: Modern user interface that works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js with Material-UI 
- **Backend**: Flask (Python)
- **Database**: SQLite (development), PostgreSQL (production)
- **Face Recognition**: OpenCV, face_recognition library (based on dlib)

## Project Structure

```
attendance-system/
├── backend/              # Flask server
│   ├── app.py            # Main application entry point
│   ├── setup_db.py       # Database setup script
│   ├── requirements.txt  # Python dependencies
│   └── utils/            # Helper functions
├── frontend/             # React application
│   ├── public/           # Static files
│   └── src/              # React source code
│       ├── components/   # Reusable components
│       ├── pages/        # Page components
│       └── assets/       # Images, fonts, etc.
├── database/             # Database files
└── uploads/              # Student images storage
```

## Installation

### Prerequisites

- Python 3.8+ with pip
- Node.js 14+ with npm
- OpenCV and dlib dependencies

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```
   python setup_db.py
   ```

4. Start the Flask server:
   ```
   python app.py
   ```
   The server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```
   The application will open in your browser at http://localhost:3000

## Usage

1. **Adding Students**: 
   - Navigate to the "Students" page
   - Click "Add Student" and fill in student details
   - Upload a clear facial photo of the student

2. **Taking Attendance**:
   - Navigate to the "Take Attendance" page
   - Click "Start Recognition" to begin real-time face recognition
   - Students detected will be automatically marked present

3. **Viewing Attendance**:
   - Navigate to the "Attendance" page to view daily attendance records
   - Select dates to view specific attendance records
   - Export attendance data to CSV

4. **Generating Reports**:
   - Navigate to the "Reports" page
   - Select a month to generate attendance reports
   - View attendance statistics and export reports

## Future Enhancements

- Mobile application for remote attendance tracking
- Integration with learning management systems
- RFID or QR code for multi-factor authentication
- Cloud deployment for centralized management
- Liveness detection to prevent spoofing attacks

## License

MIT 