import cv2
import numpy as np
import face_recognition
import json
import sqlite3
import base64
from datetime import datetime

def get_student_encodings():
    """
    Retrieve all student face encodings from the database
    """
    conn = sqlite3.connect('database/attendance.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT id, name, roll_number, face_encoding FROM students')
    students = [dict(row) for row in c.fetchall()]
    conn.close()
    
    # Convert stored encodings from JSON to numpy arrays
    for student in students:
        if student['face_encoding']:
            student['face_encoding'] = np.array(json.loads(student['face_encoding']))
    
    return students

def recognize_faces_from_image(image_path, tolerance=0.6):
    """
    Recognize faces in an image and match against known students
    """
    # Load image
    image = face_recognition.load_image_file(image_path)
    
    # Find all face locations and encodings
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)
    
    if not face_encodings:
        return []
    
    # Get all student encodings
    students = get_student_encodings()
    
    if not students:
        return []
    
    # Match faces
    recognized_students = []
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%H:%M:%S')
    
    for face_encoding, face_location in zip(face_encodings, face_locations):
        matches = face_recognition.compare_faces(
            [student['face_encoding'] for student in students if 'face_encoding' in student],
            face_encoding,
            tolerance=tolerance
        )
        
        face_distances = face_recognition.face_distance(
            [student['face_encoding'] for student in students if 'face_encoding' in student],
            face_encoding
        )
        
        if len(face_distances) > 0 and True in matches:
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                student = students[best_match_index]
                top, right, bottom, left = face_location
                
                recognized_students.append({
                    'student_id': student['id'],
                    'name': student['name'],
                    'roll_number': student['roll_number'],
                    'location': {
                        'top': top,
                        'right': right,
                        'bottom': bottom,
                        'left': left
                    },
                    'date': current_date,
                    'time': current_time
                })
    
    return recognized_students

def mark_attendance(recognized_students):
    """
    Mark attendance for recognized students
    """
    if not recognized_students:
        return 0
    
    conn = sqlite3.connect('database/attendance.db')
    c = conn.cursor()
    
    for student in recognized_students:
        # Check if attendance already marked for today
        c.execute(
            'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
            (student['student_id'], student['date'])
        )
        
        existing = c.fetchone()
        
        if not existing:
            c.execute(
                'INSERT INTO attendance (student_id, date, time, status) VALUES (?, ?, ?, ?)',
                (student['student_id'], student['date'], student['time'], 'present')
            )
    
    conn.commit()
    conn.close()
    
    return len(recognized_students)

def encode_image_to_base64(image_path):
    """
    Convert an image to base64 for sending to frontend
    """
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string 