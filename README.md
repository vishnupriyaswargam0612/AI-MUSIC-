# 🎵 CoverComposer - AI-Powered Music & Album Cover Generator

## 📌 Overview

CoverComposer is an AI-powered web application that combines **emotion detection**, **mood-based music recommendation**, and **AI-generated album artwork** into a single interactive platform. Users can detect their emotions through facial expressions or manually select a mood, receive personalized music recommendations, and generate unique album covers using Generative AI.


## 🚀 Features

### 🔐 User Authentication

* Secure user registration and login
* Session management
* Personalized user experience

### 😊 Emotion Detection

* Real-time facial emotion recognition using Face API.js
* Detects emotions such as:

  * Happy
  * Sad
  * Calm
  * Energetic
  * Neutral
  * Surprise

### 🎶 Mood-Based Music Recommendation

* Personalized music suggestions based on detected mood
* Interactive music player
* Dynamic recommendation engine

### 🎨 AI Album Cover Generator

* Generates creative album artwork using Google Gemini AI
* Mood-based visual design generation
* Unique cover art for every mood and theme

### 🖼️ Art Gallery

* Stores previously generated album covers
* Browse and revisit artwork collections

### 📜 History Management

* Tracks user activities
* Saves listening history
* Stores generated covers and mood records

## 🏗️ System Architecture

### Frontend Layer

* HTML5
* CSS3
* JavaScript

### Backend Layer

* Flask (Python)
* REST API Integration

### AI Services

* Face API.js (Emotion Detection)
* Google Gemini AI (Album Cover Generation)

### Database

* SQLite3



## 📂 Project Structure

```bash
CoverComposer/
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── images/
│
├── templates/
│   └── index.html
│
├── database/
│   └── covercomposer.db
│
├── app.py
├── requirements.txt
└── README.md
```



## ⚙️ Technologies Used

| Category          | Technologies          |
| ----------------- | --------------------- |
| Frontend          | HTML, CSS, JavaScript |
| Backend           | Flask, Python         |
| Database          | SQLite                |
| AI                | Google Gemini AI      |
| Emotion Detection | Face API.js           |
| Version Control   | Git & GitHub          |



## 🔄 Workflow

1. User registers or logs in.
2. User selects a mood manually or enables webcam detection.
3. Face API.js detects facial emotions.
4. Mood is sent to the Flask backend.
5. Music Recommendation Engine suggests suitable tracks.
6. Gemini AI generates an album cover.
7. Results are displayed on the dashboard.
8. History and artwork are stored in SQLite.
9. Users can revisit previous activities through History and Gallery modules.



## 💾 Database Tables

### Users

Stores:

* User ID
* Username
* Password

### History

Stores:

* Selected Mood
* Recommended Music
* Generated Cover
* Timestamp

### Gallery

Stores:

* Generated Artwork
* User Information
* Cover Metadata



## 📸 Key Modules

### Authentication Module

* Signup
* Login
* Session Handling

### Mood Detection Module

* Face Recognition
* Emotion Classification

### Recommendation Module

* Mood Mapping
* Playlist Suggestions

### AI Cover Generation Module

* Prompt Creation
* Gemini AI Integration
* Artwork Generation

### History & Gallery Module

* Activity Tracking
* Artwork Storage
* Retrieval System

---

## 🛠️ Installation

### Clone Repository

```bash
git clone https://github.com/your-username/CoverComposer.git
cd CoverComposer
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Application

```bash
python app.py
```

or

```bash
uvicorn main:app --reload
```

### Open Browser

```bash
http://127.0.0.1:8000
```



## 🎯 Future Enhancements

* More moods and music genres
* AI-generated lyrics
* Custom instrument selection
* Multiple audio export formats
* Cloud deployment support
* Advanced recommendation engine
* User profile customization



## 🌱 Sustainable Development Goal (SDG)

### SDG 3: Good Health and Well-Being

CoverComposer promotes emotional well-being by recognizing users' moods and providing personalized music experiences. Through emotion-aware recommendations and creative AI-generated artwork, the platform helps users express emotions, reduce stress, and enhance mental wellness through music and artistic engagement.



## 👥 Team

Developed as part of a Generative AI Project focused on combining Artificial Intelligence, Emotion Recognition, Music Recommendation Systems, and Creative Content Generation.



## 📜 License

This project is developed for educational and research purposes.


👩‍💻 Author
Swargam Vishnu Priya

Computer Science and Engineering Student
Prasad V. Potluri Siddhartha Institute of Technology (PVPSIT)

📧 Email: vishnupriyaswargam0612@gmail.com
