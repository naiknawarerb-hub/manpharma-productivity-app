#!/usr/bin/env python3
"""
Backend API Testing for ManPharma Tutorials Productivity App
Tests all CRUD operations for Videos, Study Notes, Calendar, and Tasks APIs
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Backend URL from environment
BACKEND_URL = "https://content-flow-hub-1.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Store created IDs for cleanup and further testing
        self.created_video_ids = []
        self.created_note_ids = []
        self.created_calendar_ids = []
        self.created_task_ids = []
        
        self.test_results = {
            'videos': {'passed': 0, 'failed': 0, 'errors': []},
            'study_notes': {'passed': 0, 'failed': 0, 'errors': []},
            'calendar': {'passed': 0, 'failed': 0, 'errors': []},
            'tasks': {'passed': 0, 'failed': 0, 'errors': []},
            'dashboard': {'passed': 0, 'failed': 0, 'errors': []}
        }

    def log_test(self, category, test_name, success, response=None, error=None):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {category} - {test_name}")
        
        if success:
            self.test_results[category]['passed'] += 1
        else:
            self.test_results[category]['failed'] += 1
            error_msg = error or (f"HTTP {response.status_code}: {response.text}" if response else "Unknown error")
            self.test_results[category]['errors'].append(f"{test_name}: {error_msg}")
            print(f"   Error: {error_msg}")

    def test_videos_api(self):
        """Test Video Projects CRUD operations"""
        print("\n=== Testing Videos API ===")
        
        # Test CREATE video
        video_data = {
            "title": "Python Flask Tutorial Series",
            "description": "Complete tutorial series on building web apps with Flask for pharmaceutical data management",
            "due_date": (datetime.utcnow() + timedelta(days=14)).isoformat()
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/videos", json=video_data)
            if response.status_code == 200:
                video_id = response.json().get('_id')
                if video_id:
                    self.created_video_ids.append(video_id)
                    self.log_test('videos', 'Create video project', True)
                    
                    # Verify stages are initialized correctly
                    video_response = response.json()
                    stages = video_response.get('stages', [])
                    expected_stages = ["Idea", "Script", "PPT", "Recording", "Editing", "Upload"]
                    if len(stages) == 6 and all(stage['name'] in expected_stages for stage in stages):
                        self.log_test('videos', 'Video stages initialization', True)
                    else:
                        self.log_test('videos', 'Video stages initialization', False, error="Stages not properly initialized")
                else:
                    self.log_test('videos', 'Create video project', False, response)
            else:
                self.log_test('videos', 'Create video project', False, response)
        except Exception as e:
            self.log_test('videos', 'Create video project', False, error=str(e))

        # Test GET all videos
        try:
            response = self.session.get(f"{BACKEND_URL}/videos")
            if response.status_code == 200:
                videos = response.json()
                if isinstance(videos, list):
                    self.log_test('videos', 'Get all videos', True)
                else:
                    self.log_test('videos', 'Get all videos', False, error="Response is not a list")
            else:
                self.log_test('videos', 'Get all videos', False, response)
        except Exception as e:
            self.log_test('videos', 'Get all videos', False, error=str(e))

        # Test GET single video
        if self.created_video_ids:
            video_id = self.created_video_ids[0]
            try:
                response = self.session.get(f"{BACKEND_URL}/videos/{video_id}")
                if response.status_code == 200:
                    video = response.json()
                    if video.get('_id') == video_id and video.get('title'):
                        self.log_test('videos', 'Get single video', True)
                    else:
                        self.log_test('videos', 'Get single video', False, error="Invalid video data returned")
                else:
                    self.log_test('videos', 'Get single video', False, response)
            except Exception as e:
                self.log_test('videos', 'Get single video', False, error=str(e))

            # Test UPDATE video (including stages update)
            update_data = {
                "title": "Advanced Python Flask Tutorial Series",
                "stages": [
                    {"name": "Idea", "completed": True, "completed_date": datetime.utcnow().isoformat()},
                    {"name": "Script", "completed": True, "completed_date": datetime.utcnow().isoformat()},
                    {"name": "PPT", "completed": False},
                    {"name": "Recording", "completed": False},
                    {"name": "Editing", "completed": False},
                    {"name": "Upload", "completed": False}
                ]
            }
            
            try:
                response = self.session.put(f"{BACKEND_URL}/videos/{video_id}", json=update_data)
                if response.status_code == 200:
                    updated_video = response.json()
                    if updated_video.get('title') == update_data['title']:
                        self.log_test('videos', 'Update video with stages', True)
                    else:
                        self.log_test('videos', 'Update video with stages', False, error="Video not updated properly")
                else:
                    self.log_test('videos', 'Update video with stages', False, response)
            except Exception as e:
                self.log_test('videos', 'Update video with stages', False, error=str(e))

        # Test DELETE video
        if self.created_video_ids:
            video_id = self.created_video_ids.pop()  # Remove from list so we don't try to delete again
            try:
                response = self.session.delete(f"{BACKEND_URL}/videos/{video_id}")
                if response.status_code == 200:
                    self.log_test('videos', 'Delete video', True)
                else:
                    self.log_test('videos', 'Delete video', False, response)
            except Exception as e:
                self.log_test('videos', 'Delete video', False, error=str(e))

        # Test error handling - Get non-existent video
        try:
            response = self.session.get(f"{BACKEND_URL}/videos/507f1f77bcf86cd799439011")  # Valid ObjectId format
            if response.status_code == 404:
                self.log_test('videos', 'Get non-existent video (404)', True)
            else:
                self.log_test('videos', 'Get non-existent video (404)', False, response)
        except Exception as e:
            self.log_test('videos', 'Get non-existent video (404)', False, error=str(e))

    def test_study_notes_api(self):
        """Test Study Notes CRUD operations"""
        print("\n=== Testing Study Notes API ===")
        
        # Test CREATE note
        note_data = {
            "title": "Pharmaceutical API Development Best Practices",
            "subject": "Software Engineering",
            "content": "Key principles for developing robust APIs in pharmaceutical applications including validation, security, and compliance considerations.",
            "progress_percentage": 25
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/study-notes", json=note_data)
            if response.status_code == 200:
                note_id = response.json().get('_id')
                if note_id:
                    self.created_note_ids.append(note_id)
                    self.log_test('study_notes', 'Create study note', True)
                else:
                    self.log_test('study_notes', 'Create study note', False, response)
            else:
                self.log_test('study_notes', 'Create study note', False, response)
        except Exception as e:
            self.log_test('study_notes', 'Create study note', False, error=str(e))

        # Test GET all notes
        try:
            response = self.session.get(f"{BACKEND_URL}/study-notes")
            if response.status_code == 200:
                notes = response.json()
                if isinstance(notes, list):
                    self.log_test('study_notes', 'Get all study notes', True)
                else:
                    self.log_test('study_notes', 'Get all study notes', False, error="Response is not a list")
            else:
                self.log_test('study_notes', 'Get all study notes', False, response)
        except Exception as e:
            self.log_test('study_notes', 'Get all study notes', False, error=str(e))

        # Test GET single note
        if self.created_note_ids:
            note_id = self.created_note_ids[0]
            try:
                response = self.session.get(f"{BACKEND_URL}/study-notes/{note_id}")
                if response.status_code == 200:
                    note = response.json()
                    if note.get('_id') == note_id and note.get('title'):
                        self.log_test('study_notes', 'Get single study note', True)
                    else:
                        self.log_test('study_notes', 'Get single study note', False, error="Invalid note data returned")
                else:
                    self.log_test('study_notes', 'Get single study note', False, response)
            except Exception as e:
                self.log_test('study_notes', 'Get single study note', False, error=str(e))

            # Test UPDATE note
            update_data = {
                "progress_percentage": 75,
                "content": "Updated content with additional sections on authentication and data validation in pharmaceutical APIs."
            }
            
            try:
                response = self.session.put(f"{BACKEND_URL}/study-notes/{note_id}", json=update_data)
                if response.status_code == 200:
                    updated_note = response.json()
                    if updated_note.get('progress_percentage') == 75:
                        self.log_test('study_notes', 'Update study note progress', True)
                    else:
                        self.log_test('study_notes', 'Update study note progress', False, error="Note not updated properly")
                else:
                    self.log_test('study_notes', 'Update study note progress', False, response)
            except Exception as e:
                self.log_test('study_notes', 'Update study note progress', False, error=str(e))

        # Test DELETE note
        if self.created_note_ids:
            note_id = self.created_note_ids.pop()
            try:
                response = self.session.delete(f"{BACKEND_URL}/study-notes/{note_id}")
                if response.status_code == 200:
                    self.log_test('study_notes', 'Delete study note', True)
                else:
                    self.log_test('study_notes', 'Delete study note', False, response)
            except Exception as e:
                self.log_test('study_notes', 'Delete study note', False, error=str(e))

    def test_calendar_api(self):
        """Test Calendar CRUD operations"""
        print("\n=== Testing Calendar API ===")
        
        # Test CREATE calendar item
        calendar_data = {
            "title": "Launch Flask Tutorial Series",
            "content_type": "Video Series",
            "scheduled_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "status": "scheduled",
            "platform": "YouTube",
            "description": "Premier of the comprehensive Flask tutorial series for pharmaceutical developers"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/calendar", json=calendar_data)
            if response.status_code == 200:
                calendar_id = response.json().get('_id')
                if calendar_id:
                    self.created_calendar_ids.append(calendar_id)
                    self.log_test('calendar', 'Create calendar item', True)
                else:
                    self.log_test('calendar', 'Create calendar item', False, response)
            else:
                self.log_test('calendar', 'Create calendar item', False, response)
        except Exception as e:
            self.log_test('calendar', 'Create calendar item', False, error=str(e))

        # Test GET all calendar items
        try:
            response = self.session.get(f"{BACKEND_URL}/calendar")
            if response.status_code == 200:
                items = response.json()
                if isinstance(items, list):
                    self.log_test('calendar', 'Get all calendar items', True)
                else:
                    self.log_test('calendar', 'Get all calendar items', False, error="Response is not a list")
            else:
                self.log_test('calendar', 'Get all calendar items', False, response)
        except Exception as e:
            self.log_test('calendar', 'Get all calendar items', False, error=str(e))

        # Test GET single calendar item
        if self.created_calendar_ids:
            calendar_id = self.created_calendar_ids[0]
            try:
                response = self.session.get(f"{BACKEND_URL}/calendar/{calendar_id}")
                if response.status_code == 200:
                    item = response.json()
                    if item.get('_id') == calendar_id and item.get('title'):
                        self.log_test('calendar', 'Get single calendar item', True)
                    else:
                        self.log_test('calendar', 'Get single calendar item', False, error="Invalid calendar data returned")
                else:
                    self.log_test('calendar', 'Get single calendar item', False, response)
            except Exception as e:
                self.log_test('calendar', 'Get single calendar item', False, error=str(e))

            # Test UPDATE calendar item
            update_data = {
                "status": "posted",
                "platform": "YouTube, LinkedIn"
            }
            
            try:
                response = self.session.put(f"{BACKEND_URL}/calendar/{calendar_id}", json=update_data)
                if response.status_code == 200:
                    updated_item = response.json()
                    if updated_item.get('status') == 'posted':
                        self.log_test('calendar', 'Update calendar status to posted', True)
                    else:
                        self.log_test('calendar', 'Update calendar status to posted', False, error="Calendar item not updated properly")
                else:
                    self.log_test('calendar', 'Update calendar status to posted', False, response)
            except Exception as e:
                self.log_test('calendar', 'Update calendar status to posted', False, error=str(e))

        # Test DELETE calendar item
        if self.created_calendar_ids:
            calendar_id = self.created_calendar_ids.pop()
            try:
                response = self.session.delete(f"{BACKEND_URL}/calendar/{calendar_id}")
                if response.status_code == 200:
                    self.log_test('calendar', 'Delete calendar item', True)
                else:
                    self.log_test('calendar', 'Delete calendar item', False, response)
            except Exception as e:
                self.log_test('calendar', 'Delete calendar item', False, error=str(e))

    def test_tasks_api(self):
        """Test Tasks CRUD operations"""
        print("\n=== Testing Tasks API ===")
        
        # Test CREATE task
        task_data = {
            "title": "Research Flask-SQLAlchemy integration patterns",
            "description": "Investigate best practices for database integration in pharmaceutical applications",
            "priority": "high",
            "status": "pending",
            "due_date": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "category": "Research"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/tasks", json=task_data)
            if response.status_code == 200:
                task_id = response.json().get('_id')
                if task_id:
                    self.created_task_ids.append(task_id)
                    self.log_test('tasks', 'Create task', True)
                else:
                    self.log_test('tasks', 'Create task', False, response)
            else:
                self.log_test('tasks', 'Create task', False, response)
        except Exception as e:
            self.log_test('tasks', 'Create task', False, error=str(e))

        # Test GET all tasks
        try:
            response = self.session.get(f"{BACKEND_URL}/tasks")
            if response.status_code == 200:
                tasks = response.json()
                if isinstance(tasks, list):
                    self.log_test('tasks', 'Get all tasks', True)
                else:
                    self.log_test('tasks', 'Get all tasks', False, error="Response is not a list")
            else:
                self.log_test('tasks', 'Get all tasks', False, response)
        except Exception as e:
            self.log_test('tasks', 'Get all tasks', False, error=str(e))

        # Test GET single task
        if self.created_task_ids:
            task_id = self.created_task_ids[0]
            try:
                response = self.session.get(f"{BACKEND_URL}/tasks/{task_id}")
                if response.status_code == 200:
                    task = response.json()
                    if task.get('_id') == task_id and task.get('title'):
                        self.log_test('tasks', 'Get single task', True)
                    else:
                        self.log_test('tasks', 'Get single task', False, error="Invalid task data returned")
                else:
                    self.log_test('tasks', 'Get single task', False, response)
            except Exception as e:
                self.log_test('tasks', 'Get single task', False, error=str(e))

            # Test UPDATE task
            update_data = {
                "status": "in_progress",
                "priority": "medium"
            }
            
            try:
                response = self.session.put(f"{BACKEND_URL}/tasks/{task_id}", json=update_data)
                if response.status_code == 200:
                    updated_task = response.json()
                    if updated_task.get('status') == 'in_progress':
                        self.log_test('tasks', 'Update task status and priority', True)
                    else:
                        self.log_test('tasks', 'Update task status and priority', False, error="Task not updated properly")
                else:
                    self.log_test('tasks', 'Update task status and priority', False, response)
            except Exception as e:
                self.log_test('tasks', 'Update task status and priority', False, error=str(e))

        # Test DELETE task
        if self.created_task_ids:
            task_id = self.created_task_ids.pop()
            try:
                response = self.session.delete(f"{BACKEND_URL}/tasks/{task_id}")
                if response.status_code == 200:
                    self.log_test('tasks', 'Delete task', True)
                else:
                    self.log_test('tasks', 'Delete task', False, response)
            except Exception as e:
                self.log_test('tasks', 'Delete task', False, error=str(e))

    def test_dashboard_stats(self):
        """Test Dashboard Stats endpoint"""
        print("\n=== Testing Dashboard Stats API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = [
                    'videos_in_progress',
                    'upcoming_calendar_items', 
                    'pending_tasks',
                    'total_videos',
                    'total_study_notes'
                ]
                
                if all(field in stats for field in required_fields):
                    # Verify all fields are integers
                    if all(isinstance(stats[field], int) for field in required_fields):
                        self.log_test('dashboard', 'Get dashboard statistics', True)
                    else:
                        self.log_test('dashboard', 'Get dashboard statistics', False, error="Stats fields are not integers")
                else:
                    missing_fields = [f for f in required_fields if f not in stats]
                    self.log_test('dashboard', 'Get dashboard statistics', False, error=f"Missing fields: {missing_fields}")
            else:
                self.log_test('dashboard', 'Get dashboard statistics', False, response)
        except Exception as e:
            self.log_test('dashboard', 'Get dashboard statistics', False, error=str(e))

    def cleanup_test_data(self):
        """Clean up any remaining test data"""
        print("\n=== Cleaning up test data ===")
        
        # Clean up remaining videos
        for video_id in self.created_video_ids:
            try:
                self.session.delete(f"{BACKEND_URL}/videos/{video_id}")
            except:
                pass
                
        # Clean up remaining notes
        for note_id in self.created_note_ids:
            try:
                self.session.delete(f"{BACKEND_URL}/study-notes/{note_id}")
            except:
                pass
                
        # Clean up remaining calendar items
        for calendar_id in self.created_calendar_ids:
            try:
                self.session.delete(f"{BACKEND_URL}/calendar/{calendar_id}")
            except:
                pass
                
        # Clean up remaining tasks
        for task_id in self.created_task_ids:
            try:
                self.session.delete(f"{BACKEND_URL}/tasks/{task_id}")
            except:
                pass

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("BACKEND API TEST RESULTS SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category.upper()}:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            if results['errors']:
                print(f"  Errors:")
                for error in results['errors']:
                    print(f"    - {error}")
        
        print(f"\n{'='*60}")
        print(f"OVERALL RESULTS:")
        print(f"  ✅ Total Passed: {total_passed}")
        print(f"  ❌ Total Failed: {total_failed}")
        print(f"  📊 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "No tests run")
        
        if total_failed == 0:
            print(f"  🎉 ALL TESTS PASSED!")
        else:
            print(f"  ⚠️  {total_failed} tests failed - check errors above")

    def run_all_tests(self):
        """Run all API tests"""
        print("Starting ManPharma Tutorials Backend API Tests...")
        print(f"Testing against: {BACKEND_URL}")
        
        try:
            self.test_videos_api()
            self.test_study_notes_api() 
            self.test_calendar_api()
            self.test_tasks_api()
            self.test_dashboard_stats()
            
        finally:
            self.cleanup_test_data()
            self.print_summary()

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()