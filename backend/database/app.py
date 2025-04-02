from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
import numpy as np
import cv2
import face_recognition
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Create uploads directory if it doesn't exist
os.makedirs('uploads', exist_ok=True)
os.makedirs('database', exist_ok=True)

# Initialize database
def init_db():
    conn = sqlite3.connect('database/attendance.db')
    c = conn.cursor()
    
    # Create tables if they don't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT UNIQUE NOT NULL,
            image_path TEXT NOT NULL,
            face_encoding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            faculty TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students (id),
            FOREIGN KEY (subject_id) REFERENCES subjects (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Ensure database schema is correct
def check_and_fix_db():
    try:
        conn = sqlite3.connect('database/attendance.db')
        c = conn.cursor()
        
        # Check if tables exist
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'")
        if not c.fetchone():
            print("Database tables missing. Creating tables...")
            init_db()
            return True
            
        # Check if attendance table has subject_id column
        c.execute("PRAGMA table_info(attendance)")
        columns = [col[1] for col in c.fetchall()]
        
        # If subject_id column doesn't exist, recreate the database
        needs_recreation = 'subject_id' not in columns
        conn.close()
        
        if needs_recreation:
            print("Database schema outdated. Recreating database...")
            import os
            if os.path.exists('database/attendance.db'):
                os.remove('database/attendance.db')
            init_db()
            return True
        return False
    except Exception as e:
        print(f"Error checking database: {e}")
        return False

# Initialize database only if it doesn't exist
if not os.path.exists('database/attendance.db'):
    print("Database not found. Creating new database...")
    init_db()
else:
    check_and_fix_db()

@app.route('/api/students', methods=['GET'])
def get_students():
    conn = sqlite3.connect('database/attendance.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT id, name, roll_number, image_path FROM students')
    students = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(students)

@app.route('/api/students', methods=['POST'])
def add_student():
    try:
        name = request.form.get('name')
        roll_number = request.form.get('roll_number')
        image = request.files.get('image')
        
        if not name or not roll_number or not image:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Save image
        image_path = f'uploads/{roll_number}.jpg'
        image.save(image_path)
        
        # Get face encoding
        img = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(img)
        
        if not face_locations:
            os.remove(image_path)
            return jsonify({'error': 'No face detected in the image'}), 400
        
        face_encoding = face_recognition.face_encodings(img, face_locations)[0]
        
        # Save to database
        conn = sqlite3.connect('database/attendance.db')
        c = conn.cursor()
        
        try:
            c.execute(
                'INSERT INTO students (name, roll_number, image_path, face_encoding) VALUES (?, ?, ?, ?)',
                (name, roll_number, image_path, json.dumps(face_encoding.tolist()))
            )
            conn.commit()
            student_id = c.lastrowid
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'Student with this roll number already exists'}), 400
        
        conn.close()
        
        return jsonify({
            'id': student_id,
            'name': name,
            'roll_number': roll_number,
            'image_path': image_path
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    conn = sqlite3.connect('database/attendance.db')
    c = conn.cursor()
    
    # Get image path
    c.execute('SELECT image_path FROM students WHERE id = ?', (student_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    image_path = result[0]
    
    # Delete from database
    c.execute('DELETE FROM students WHERE id = ?', (student_id,))
    c.execute('DELETE FROM attendance WHERE student_id = ?', (student_id,))
    conn.commit()
    conn.close()
    
    # Delete image
    if image_path and os.path.exists(image_path):
        os.remove(image_path)
    
    return jsonify({'message': 'Student deleted successfully'})

# Subject API endpoints
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    conn = sqlite3.connect('database/attendance.db')
    c = conn.cursor()
    c.execute('SELECT * FROM subjects ORDER BY created_at DESC')
    subjects = [dict(zip([col[0] for col in c.description], row)) for row in c.fetchall()]
    conn.close()
    return jsonify(subjects)

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'name' not in data or 'code' not in data or 'faculty' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Validate data types
        if not isinstance(data['name'], str) or not isinstance(data['code'], str) or not isinstance(data['faculty'], str):
            return jsonify({'error': 'Invalid data types'}), 400
            
        # Validate non-empty strings
        if not data['name'].strip() or not data['code'].strip() or not data['faculty'].strip():
            return jsonify({'error': 'Fields cannot be empty'}), 400
            
        conn = sqlite3.connect('database/attendance.db')
        c = conn.cursor()
        
        # Check if subject code already exists
        c.execute('SELECT id FROM subjects WHERE code = ?', (data['code'],))
        if c.fetchone():
            conn.close()
            return jsonify({'error': 'Subject code already exists'}), 400
            
        # Insert new subject
        c.execute('''
            INSERT INTO subjects (code, name, faculty, description)
            VALUES (?, ?, ?, ?)
        ''', (
            data['code'].strip(),
            data['name'].strip(),
            data['faculty'].strip(),
            data.get('description', '').strip()
        ))
        
        subject_id = c.lastrowid
        conn.commit()
        
        # Get the newly created subject
        c.execute('SELECT * FROM subjects WHERE id = ?', (subject_id,))
        subject = dict(zip([col[0] for col in c.description], c.fetchone()))
        conn.close()
        
        return jsonify(subject), 201
        
    except Exception as e:
        print(f"Error adding subject: {str(e)}")
        return jsonify({'error': 'Failed to add subject'}), 500

@app.route('/api/subjects/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    conn = sqlite3.connect('database/attendance.db')
    c = conn.cursor()
    
    c.execute('DELETE FROM subjects WHERE id = ?', (subject_id,))
    c.execute('DELETE FROM attendance WHERE subject_id = ?', (subject_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Subject deleted successfully'})

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    try:
        if 'image' not in request.files or 'subject_id' not in request.form:
            return jsonify({'error': 'Missing image or subject_id'}), 400
            
        image = request.files['image']
        subject_id = request.form['subject_id']
        
        if not image or not subject_id:
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Validate subject exists
        conn = sqlite3.connect('database/attendance.db')
        c = conn.cursor()
        c.execute('SELECT id FROM subjects WHERE id = ?', (subject_id,))
        if not c.fetchone():
            conn.close()
            return jsonify({'error': 'Invalid subject ID'}), 400
            
        # Process image and face recognition
        image_data = image.read()
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to RGB for face_recognition
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if not face_locations:
            conn.close()
            return jsonify({'error': 'No face detected in image. Please ensure your face is clearly visible.'}), 400
            
        face_encoding = face_recognition.face_encodings(rgb_img, face_locations)[0]
        
        # Get current date and time as strings
        current_date = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M:%S')
        
        # Get all students with their face encodings
        c.execute('SELECT id, name, face_encoding FROM students')
        students = c.fetchall()
        
        if not students:
            conn.close()
            return jsonify({'error': 'No students registered in the system. Please add students first.'}), 400
        
        # Find matching student
        matched_student = None
        matched_name = None
        best_match = None
        best_distance = float('inf')
        
        for student_id, name, stored_encoding in students:
            try:
                # Convert stored encoding from JSON string to numpy array
                stored_encoding = np.array(json.loads(stored_encoding))
                
                # Calculate face distance
                face_distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
                
                # Update best match if this is closer
                if face_distance < best_distance:
                    best_distance = face_distance
                    best_match = (student_id, name)
                
                # If distance is below threshold, consider it a match
                if face_distance < 0.6:  # Adjust this threshold as needed
                    matched_student = student_id
                    matched_name = name
                    break
                    
            except Exception as e:
                print(f"Error processing face encoding for student {student_id}: {str(e)}")
                continue
                
        if not matched_student:
            conn.close()
            if best_match:
                return jsonify({
                    'error': f'No matching student found. Best match was {best_match[1]} with confidence {1 - best_distance:.2%}. Please try again with better lighting or positioning.'
                }), 400
            return jsonify({'error': 'No matching student found. Please ensure you are registered in the system.'}), 400
            
        # Check for duplicate attendance
        c.execute('''
            SELECT id FROM attendance 
            WHERE student_id = ? AND subject_id = ? AND date = ?
        ''', (matched_student, subject_id, current_date))
        
        if c.fetchone():
            conn.close()
            return jsonify({'error': f'Attendance already marked for {matched_name}'}), 400
            
        # Mark attendance
        c.execute('''
            INSERT INTO attendance (student_id, subject_id, date, time, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (matched_student, subject_id, current_date, current_time, 'present'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': f'Attendance marked successfully for {matched_name}',
            'student_name': matched_name
        }), 200
        
    except Exception as e:
        print(f"Error marking attendance: {str(e)}")
        return jsonify({'error': f'Failed to mark attendance: {str(e)}'}), 500

@app.route('/api/attendance/report', methods=['GET'])
def get_attendance_report():
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    subject_id = request.args.get('subject_id')
    
    conn = sqlite3.connect('database/attendance.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if subject_id:
        c.execute('''
        SELECT a.id, a.date, a.time, a.status, 
               s.id as student_id, s.name, s.roll_number,
               sub.id as subject_id, sub.code, sub.name as subject_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE a.date = ? AND a.subject_id = ?
        ORDER BY a.time
        ''', (date, subject_id))
    else:
        c.execute('''
        SELECT a.id, a.date, a.time, a.status, 
               s.id as student_id, s.name, s.roll_number,
               sub.id as subject_id, sub.code, sub.name as subject_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE a.date = ?
        ORDER BY a.time
        ''', (date,))
    
    report = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify(report)

@app.route('/api/attendance/statistics', methods=['GET'])
def get_attendance_statistics():
    student_id = request.args.get('student_id')
    subject_id = request.args.get('subject_id')
    
    conn = sqlite3.connect('database/attendance.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    statistics = {}
    
    if student_id:
        # Get total classes for each subject
        c.execute('''
        SELECT s.id, s.code, s.name, COUNT(DISTINCT a.date) as total_classes
        FROM subjects s
        LEFT JOIN attendance a ON s.id = a.subject_id
        GROUP BY s.id
        ''')
        subject_totals = {row['id']: row['total_classes'] for row in c.fetchall()}
        
        # Get attended classes for this student
        c.execute('''
        SELECT s.id, s.code, s.name, COUNT(a.id) as attended_classes
        FROM subjects s
        LEFT JOIN attendance a ON s.id = a.subject_id AND a.student_id = ?
        GROUP BY s.id
        ''', (student_id,))
        
        subjects = []
        for row in c.fetchall():
            subject_data = dict(row)
            total_classes = subject_totals.get(row['id'], 0)
            attended = subject_data['attended_classes'] or 0
            
            # Calculate percentage
            percentage = 0
            if total_classes > 0:
                percentage = round((attended / total_classes) * 100, 2)
                
            subjects.append({
                'id': row['id'],
                'code': row['code'],
                'name': row['name'],
                'attended': attended,
                'total': total_classes,
                'percentage': percentage,
                'status': 'Good' if percentage >= 75 else 'Low'
            })
            
        # Get student details
        c.execute('SELECT name, roll_number FROM students WHERE id = ?', (student_id,))
        student = dict(c.fetchone() or {})
        
        statistics = {
            'student': student,
            'subjects': subjects,
            'overall_attendance': sum(s['percentage'] for s in subjects) / len(subjects) if subjects else 0
        }
    
    elif subject_id:
        # Get total classes for this subject
        c.execute('''
        SELECT COUNT(DISTINCT date) as total_classes
        FROM attendance
        WHERE subject_id = ?
        ''', (subject_id,))
        total_classes = c.fetchone()['total_classes']
        
        # Get attendance stats for all students in this subject
        c.execute('''
        SELECT s.id, s.name, s.roll_number, COUNT(a.id) as attended_classes
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.subject_id = ?
        GROUP BY s.id
        ''', (subject_id,))
        
        students = []
        for row in c.fetchall():
            student_data = dict(row)
            attended = student_data['attended_classes'] or 0
            
            # Calculate percentage
            percentage = 0
            if total_classes > 0:
                percentage = round((attended / total_classes) * 100, 2)
                
            students.append({
                'id': row['id'],
                'name': row['name'],
                'roll_number': row['roll_number'],
                'attended': attended,
                'total': total_classes,
                'percentage': percentage,
                'status': 'Good' if percentage >= 75 else 'Low'
            })
            
        # Get subject details
        c.execute('SELECT code, name, faculty FROM subjects WHERE id = ?', (subject_id,))
        subject = dict(c.fetchone() or {})
        
        statistics = {
            'subject': subject,
            'students': students,
            'class_average': sum(s['percentage'] for s in students) / len(students) if students else 0
        }
    
    else:
        # Overall statistics
        c.execute('SELECT COUNT(*) as count FROM students')
        student_count = c.fetchone()['count']
        
        c.execute('SELECT COUNT(*) as count FROM subjects')
        subject_count = c.fetchone()['count']
        
        c.execute('''
        SELECT COUNT(DISTINCT student_id, date) as count FROM attendance
        WHERE date = ?
        ''', (datetime.now().strftime('%Y-%m-%d'),))
        today_attendance = c.fetchone()['count']
        
        statistics = {
            'student_count': student_count,
            'subject_count': subject_count,
            'today_attendance': today_attendance,
            'today_percentage': round((today_attendance / student_count) * 100, 2) if student_count > 0 else 0
        }
    
    conn.close()
    return jsonify(statistics)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 