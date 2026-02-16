from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def object_id_to_str(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

# ===================== MODELS =====================

class VideoStage(BaseModel):
    name: str
    completed: bool = False
    completed_date: Optional[datetime] = None

class VideoProject(BaseModel):
    title: str
    description: Optional[str] = ""
    stages: List[VideoStage] = Field(default_factory=lambda: [
        VideoStage(name="Idea"),
        VideoStage(name="Script"),
        VideoStage(name="PPT"),
        VideoStage(name="Recording"),
        VideoStage(name="Editing"),
        VideoStage(name="Upload")
    ])
    due_date: Optional[datetime] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)

class VideoProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stages: Optional[List[VideoStage]] = None
    due_date: Optional[datetime] = None

class StudyNote(BaseModel):
    title: str
    subject: str
    content: Optional[str] = ""
    progress_percentage: int = 0
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)

class StudyNoteUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    progress_percentage: Optional[int] = None

class CalendarItem(BaseModel):
    title: str
    content_type: str
    scheduled_date: datetime
    status: str = "draft"  # draft, scheduled, posted
    platform: Optional[str] = ""
    description: Optional[str] = ""
    created_date: datetime = Field(default_factory=datetime.utcnow)

class CalendarItemUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    status: Optional[str] = None
    platform: Optional[str] = None
    description: Optional[str] = None

class Task(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"  # low, medium, high
    status: str = "pending"  # pending, in_progress, completed
    due_date: Optional[datetime] = None
    category: Optional[str] = ""
    created_date: datetime = Field(default_factory=datetime.utcnow)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    category: Optional[str] = None

# ===================== NEW MODELS - REVENUE TRACKING =====================

class Revenue(BaseModel):
    amount: float
    source_category: str  # Course Sales, Freelance, Other
    source_detail: Optional[str] = ""  # Course name, Client name
    platform: Optional[str] = ""  # YouTube, Udemy, Direct, etc.
    payment_status: str = "Pending"  # Pending, Received
    payment_date: datetime
    description: Optional[str] = ""
    created_date: datetime = Field(default_factory=datetime.utcnow)

class RevenueUpdate(BaseModel):
    amount: Optional[float] = None
    source_category: Optional[str] = None
    source_detail: Optional[str] = None
    platform: Optional[str] = None
    payment_status: Optional[str] = None
    payment_date: Optional[datetime] = None
    description: Optional[str] = None

# ===================== CONTENT PERFORMANCE ANALYTICS =====================

class ContentPerformance(BaseModel):
    content_id: Optional[str] = ""
    content_title: str
    content_type: str  # Video, Post, Story, Course, Reel
    platform: str  # YouTube, Instagram, Facebook, etc.
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    reach: int = 0
    recorded_date: datetime = Field(default_factory=datetime.utcnow)
    created_date: datetime = Field(default_factory=datetime.utcnow)

class ContentPerformanceUpdate(BaseModel):
    content_id: Optional[str] = None
    content_title: Optional[str] = None
    content_type: Optional[str] = None
    platform: Optional[str] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    reach: Optional[int] = None
    recorded_date: Optional[datetime] = None

# ===================== IDEA BANK / RESEARCH VAULT =====================

class IdeaBank(BaseModel):
    title: str
    content: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = ""
    links: List[str] = Field(default_factory=list)
    priority: str = "medium"  # low, medium, high
    status: str = "idea"  # idea, researching, ready, used
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)

class IdeaBankUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    links: Optional[List[str]] = None
    priority: Optional[str] = None
    status: Optional[str] = None

# ===================== RECURRING TASKS =====================

class RecurringTask(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"
    category: Optional[str] = ""
    frequency: str = "weekly"  # daily, weekly, monthly
    frequency_detail: Optional[str] = ""  # "Every Monday", "1st of month", etc.
    next_due_date: datetime
    last_generated_date: Optional[datetime] = None
    is_active: bool = True
    created_date: datetime = Field(default_factory=datetime.utcnow)

class RecurringTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    frequency_detail: Optional[str] = None
    next_due_date: Optional[datetime] = None
    is_active: Optional[bool] = None

# ===================== VIDEO PROJECTS ROUTES =====================

@api_router.post("/videos")
async def create_video(video: VideoProject):
    video_dict = video.dict()
    result = await db.videos.insert_one(video_dict)
    video_dict["_id"] = str(result.inserted_id)
    return video_dict

@api_router.get("/videos")
async def get_videos():
    videos = await db.videos.find().to_list(1000)
    for video in videos:
        video["_id"] = str(video["_id"])
    return videos

@api_router.get("/videos/{video_id}")
async def get_video(video_id: str):
    try:
        video = await db.videos.find_one({"_id": ObjectId(video_id)})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        video["_id"] = str(video["_id"])
        return video
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/videos/{video_id}")
async def update_video(video_id: str, video_update: VideoProjectUpdate):
    try:
        update_data = {k: v for k, v in video_update.dict().items() if v is not None}
        if update_data:
            update_data["updated_date"] = datetime.utcnow()
            result = await db.videos.update_one(
                {"_id": ObjectId(video_id)},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Video not found")
        video = await db.videos.find_one({"_id": ObjectId(video_id)})
        video["_id"] = str(video["_id"])
        return video
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    try:
        result = await db.videos.delete_one({"_id": ObjectId(video_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===================== STUDY NOTES ROUTES =====================

@api_router.post("/study-notes")
async def create_study_note(note: StudyNote):
    note_dict = note.dict()
    result = await db.study_notes.insert_one(note_dict)
    note_dict["_id"] = str(result.inserted_id)
    return note_dict

@api_router.get("/study-notes")
async def get_study_notes():
    notes = await db.study_notes.find().to_list(1000)
    for note in notes:
        note["_id"] = str(note["_id"])
    return notes

@api_router.get("/study-notes/{note_id}")
async def get_study_note(note_id: str):
    try:
        note = await db.study_notes.find_one({"_id": ObjectId(note_id)})
        if not note:
            raise HTTPException(status_code=404, detail="Study note not found")
        note["_id"] = str(note["_id"])
        return note
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/study-notes/{note_id}")
async def update_study_note(note_id: str, note_update: StudyNoteUpdate):
    try:
        update_data = {k: v for k, v in note_update.dict().items() if v is not None}
        if update_data:
            update_data["updated_date"] = datetime.utcnow()
            result = await db.study_notes.update_one(
                {"_id": ObjectId(note_id)},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Study note not found")
        note = await db.study_notes.find_one({"_id": ObjectId(note_id)})
        note["_id"] = str(note["_id"])
        return note
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/study-notes/{note_id}")
async def delete_study_note(note_id: str):
    try:
        result = await db.study_notes.delete_one({"_id": ObjectId(note_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Study note not found")
        return {"message": "Study note deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===================== CALENDAR ROUTES =====================

@api_router.post("/calendar")
async def create_calendar_item(item: CalendarItem):
    item_dict = item.dict()
    result = await db.calendar.insert_one(item_dict)
    item_dict["_id"] = str(result.inserted_id)
    return item_dict

@api_router.get("/calendar")
async def get_calendar_items():
    items = await db.calendar.find().to_list(1000)
    for item in items:
        item["_id"] = str(item["_id"])
    return items

@api_router.get("/calendar/{item_id}")
async def get_calendar_item(item_id: str):
    try:
        item = await db.calendar.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Calendar item not found")
        item["_id"] = str(item["_id"])
        return item
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/calendar/{item_id}")
async def update_calendar_item(item_id: str, item_update: CalendarItemUpdate):
    try:
        update_data = {k: v for k, v in item_update.dict().items() if v is not None}
        if update_data:
            result = await db.calendar.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Calendar item not found")
        item = await db.calendar.find_one({"_id": ObjectId(item_id)})
        item["_id"] = str(item["_id"])
        return item
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/calendar/{item_id}")
async def delete_calendar_item(item_id: str):
    try:
        result = await db.calendar.delete_one({"_id": ObjectId(item_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Calendar item not found")
        return {"message": "Calendar item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===================== TASKS ROUTES =====================

@api_router.post("/tasks")
async def create_task(task: Task):
    task_dict = task.dict()
    result = await db.tasks.insert_one(task_dict)
    task_dict["_id"] = str(result.inserted_id)
    return task_dict

@api_router.get("/tasks")
async def get_tasks():
    tasks = await db.tasks.find().to_list(1000)
    for task in tasks:
        task["_id"] = str(task["_id"])
    return tasks

@api_router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task["_id"] = str(task["_id"])
        return task
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task_update: TaskUpdate):
    try:
        update_data = {k: v for k, v in task_update.dict().items() if v is not None}
        if update_data:
            result = await db.tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Task not found")
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        task["_id"] = str(task["_id"])
        return task
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    try:
        result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===================== DASHBOARD STATS ROUTE =====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Count videos in progress
    videos = await db.videos.find().to_list(1000)
    videos_in_progress = sum(1 for v in videos if not all(stage.get('completed', False) for stage in v.get('stages', [])))
    
    # Count upcoming calendar items (next 7 days)
    now = datetime.utcnow()
    calendar_items = await db.calendar.find().to_list(1000)
    upcoming_items = sum(1 for item in calendar_items if item.get('scheduled_date') and item['scheduled_date'] >= now and item.get('status') != 'posted')
    
    # Count pending tasks
    tasks = await db.tasks.find({"status": {"$in": ["pending", "in_progress"]}}).to_list(1000)
    pending_tasks = len(tasks)
    
    # Count total items
    total_videos = len(videos)
    total_notes = await db.study_notes.count_documents({})
    
    return {
        "videos_in_progress": videos_in_progress,
        "upcoming_calendar_items": upcoming_items,
        "pending_tasks": pending_tasks,
        "total_videos": total_videos,
        "total_study_notes": total_notes
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
