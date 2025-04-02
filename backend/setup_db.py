import sqlite3
import os

# Create directories if they don't exist
os.makedirs('database', exist_ok=True)
os.makedirs('uploads', exist_ok=True)

# Initialize database
def init_db():
    conn = sqlite3.connect('database/attendance.db')
    c = conn.cursor()
    
    # Students table
    c.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        roll_number TEXT UNIQUE NOT NULL,
        image_path TEXT,
        face_encoding TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Attendance table
    c.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        date TEXT,
        time TEXT,
        status TEXT,
        FOREIGN KEY (student_id) REFERENCES students (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db() 