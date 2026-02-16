#!/usr/bin/env python3
"""
Comprehensive backend API testing for ManPharma Tutorials app
Testing all NEW enhanced features:
1. Revenue Tracking API
2. Content Performance Analytics API  
3. Idea Bank API
4. Recurring Tasks API
5. Enhanced Dashboard Stats
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import sys

# Backend URL from environment configuration
BASE_URL = "https://content-flow-hub-1.preview.emergentagent.com/api"

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.test_results = []
        self.created_ids = {
            'revenue': [],
            'performance': [],
            'ideas': [],
            'recurring_tasks': []
        }
    
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details
        })
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == "GET":
                return requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                return requests.post(url, json=data, headers=headers, timeout=30)
            elif method == "PUT":
                return requests.put(url, json=data, headers=headers, timeout=30)
            elif method == "DELETE":
                return requests.delete(url, headers=headers, timeout=30)
        except Exception as e:
            raise Exception(f"Request failed: {str(e)}")

    def test_revenue_tracking(self):
        """Test Revenue Tracking API endpoints"""
        print("\n=== Testing Revenue Tracking API ===")
        
        # Test data for realistic educational content revenue
        revenue_data = {
            "amount": 250.75,
            "source_category": "Course Sales",
            "source_detail": "Pharmaceutical Chemistry Course",
            "platform": "Udemy",
            "payment_status": "Received",
            "payment_date": "2024-12-15T10:00:00Z",
            "description": "Q4 course sales revenue"
        }
        
        # 1. CREATE Revenue
        try:
            response = self.make_request("POST", "/revenue", revenue_data)
            if response.status_code == 200:
                created_revenue = response.json()
                revenue_id = created_revenue.get("_id")
                self.created_ids['revenue'].append(revenue_id)
                self.log_test("Revenue CREATE", True, f"Created with ID: {revenue_id}")
                
                # Verify required fields
                required_fields = ['amount', 'source_category', 'payment_status', 'payment_date']
                missing_fields = [field for field in required_fields if field not in created_revenue]
                if missing_fields:
                    self.log_test("Revenue CREATE - Required Fields", False, f"Missing: {missing_fields}")
                else:
                    self.log_test("Revenue CREATE - Required Fields", True)
            else:
                self.log_test("Revenue CREATE", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Revenue CREATE", False, str(e))
        
        # 2. GET All Revenues
        try:
            response = self.make_request("GET", "/revenue")
            if response.status_code == 200:
                revenues = response.json()
                self.log_test("Revenue GET All", True, f"Retrieved {len(revenues)} revenues")
            else:
                self.log_test("Revenue GET All", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Revenue GET All", False, str(e))
        
        # 3. GET Single Revenue
        if self.created_ids['revenue']:
            try:
                response = self.make_request("GET", f"/revenue/{self.created_ids['revenue'][0]}")
                if response.status_code == 200:
                    revenue = response.json()
                    self.log_test("Revenue GET Single", True, f"Retrieved: {revenue.get('source_detail', 'N/A')}")
                else:
                    self.log_test("Revenue GET Single", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Revenue GET Single", False, str(e))
        
        # 4. UPDATE Revenue
        if self.created_ids['revenue']:
            try:
                update_data = {"payment_status": "Pending", "amount": 300.0}
                response = self.make_request("PUT", f"/revenue/{self.created_ids['revenue'][0]}", update_data)
                if response.status_code == 200:
                    updated_revenue = response.json()
                    self.log_test("Revenue UPDATE", True, f"Updated status: {updated_revenue.get('payment_status')}")
                else:
                    self.log_test("Revenue UPDATE", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Revenue UPDATE", False, str(e))
        
        # 5. Monthly Summary
        try:
            response = self.make_request("GET", "/revenue/summary/monthly")
            if response.status_code == 200:
                monthly_data = response.json()
                self.log_test("Revenue Monthly Summary", True, f"Retrieved {len(monthly_data)} months")
                
                # Verify summary structure
                if monthly_data and isinstance(monthly_data[0], dict):
                    required_summary_fields = ['month', 'total_received', 'total_pending', 'count']
                    first_month = monthly_data[0]
                    has_all_fields = all(field in first_month for field in required_summary_fields)
                    self.log_test("Revenue Monthly Summary Structure", has_all_fields)
            else:
                self.log_test("Revenue Monthly Summary", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Revenue Monthly Summary", False, str(e))
        
        # 6. Category Summary
        try:
            response = self.make_request("GET", "/revenue/summary/category")
            if response.status_code == 200:
                category_data = response.json()
                self.log_test("Revenue Category Summary", True, f"Retrieved {len(category_data)} categories")
            else:
                self.log_test("Revenue Category Summary", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Revenue Category Summary", False, str(e))

    def test_content_performance(self):
        """Test Content Performance Analytics API"""
        print("\n=== Testing Content Performance Analytics API ===")
        
        # Test data for realistic pharmaceutical content
        performance_data = {
            "content_title": "Introduction to Pharmacokinetics",
            "content_type": "Video",
            "platform": "YouTube",
            "views": 15420,
            "likes": 892,
            "comments": 156,
            "shares": 78,
            "reach": 18950,
            "recorded_date": "2024-12-15T08:00:00Z"
        }
        
        # 1. CREATE Performance Record
        try:
            response = self.make_request("POST", "/performance", performance_data)
            if response.status_code == 200:
                created_performance = response.json()
                performance_id = created_performance.get("_id")
                self.created_ids['performance'].append(performance_id)
                self.log_test("Performance CREATE", True, f"Created with ID: {performance_id}")
                
                # Verify required fields
                required_fields = ['content_title', 'content_type', 'platform', 'views']
                missing_fields = [field for field in required_fields if field not in created_performance]
                if missing_fields:
                    self.log_test("Performance CREATE - Required Fields", False, f"Missing: {missing_fields}")
                else:
                    self.log_test("Performance CREATE - Required Fields", True)
            else:
                self.log_test("Performance CREATE", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Performance CREATE", False, str(e))
        
        # 2. GET All Performance Records
        try:
            response = self.make_request("GET", "/performance")
            if response.status_code == 200:
                performances = response.json()
                self.log_test("Performance GET All", True, f"Retrieved {len(performances)} records")
            else:
                self.log_test("Performance GET All", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance GET All", False, str(e))
        
        # 3. GET Single Performance
        if self.created_ids['performance']:
            try:
                response = self.make_request("GET", f"/performance/{self.created_ids['performance'][0]}")
                if response.status_code == 200:
                    performance = response.json()
                    self.log_test("Performance GET Single", True, f"Retrieved: {performance.get('content_title', 'N/A')}")
                else:
                    self.log_test("Performance GET Single", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Performance GET Single", False, str(e))
        
        # 4. UPDATE Performance
        if self.created_ids['performance']:
            try:
                update_data = {"views": 16000, "likes": 920}
                response = self.make_request("PUT", f"/performance/{self.created_ids['performance'][0]}", update_data)
                if response.status_code == 200:
                    updated_performance = response.json()
                    self.log_test("Performance UPDATE", True, f"Updated views: {updated_performance.get('views')}")
                else:
                    self.log_test("Performance UPDATE", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Performance UPDATE", False, str(e))
        
        # 5. Top Content Analytics
        try:
            response = self.make_request("GET", "/performance/analytics/top-content")
            if response.status_code == 200:
                top_content = response.json()
                self.log_test("Performance Top Content Analytics", True, f"Retrieved analytics with keys: {list(top_content.keys())}")
                
                # Verify analytics structure
                if 'top_by_views' in top_content and 'top_by_engagement' in top_content:
                    self.log_test("Performance Analytics Structure", True)
                else:
                    self.log_test("Performance Analytics Structure", False, "Missing top_by_views or top_by_engagement")
            else:
                self.log_test("Performance Top Content Analytics", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance Top Content Analytics", False, str(e))
        
        # 6. Performance Trends
        try:
            response = self.make_request("GET", "/performance/analytics/trends")
            if response.status_code == 200:
                trends = response.json()
                self.log_test("Performance Trends Analytics", True, f"Retrieved {len(trends)} trend records")
            else:
                self.log_test("Performance Trends Analytics", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance Trends Analytics", False, str(e))

    def test_idea_bank(self):
        """Test Idea Bank API"""
        print("\n=== Testing Idea Bank API ===")
        
        # Test data for realistic pharmaceutical education ideas
        idea_data = {
            "title": "Drug Interaction Video Series",
            "content": "Create comprehensive series covering major drug interactions in clinical practice",
            "tags": ["pharmacology", "drug interactions", "clinical", "safety"],
            "category": "Educational Content",
            "links": ["https://example.com/drug-interactions", "https://research.pharma.com/interactions"],
            "priority": "high",
            "status": "researching"
        }
        
        # 1. CREATE Idea
        try:
            response = self.make_request("POST", "/ideas", idea_data)
            if response.status_code == 200:
                created_idea = response.json()
                idea_id = created_idea.get("_id")
                self.created_ids['ideas'].append(idea_id)
                self.log_test("Idea CREATE", True, f"Created with ID: {idea_id}")
                
                # Verify required fields and arrays
                if created_idea.get('tags') and isinstance(created_idea['tags'], list):
                    self.log_test("Idea CREATE - Tags Array", True, f"Tags: {created_idea['tags']}")
                else:
                    self.log_test("Idea CREATE - Tags Array", False)
                
                if created_idea.get('links') and isinstance(created_idea['links'], list):
                    self.log_test("Idea CREATE - Links Array", True, f"Links count: {len(created_idea['links'])}")
                else:
                    self.log_test("Idea CREATE - Links Array", False)
            else:
                self.log_test("Idea CREATE", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Idea CREATE", False, str(e))
        
        # 2. GET All Ideas
        try:
            response = self.make_request("GET", "/ideas")
            if response.status_code == 200:
                ideas = response.json()
                self.log_test("Idea GET All", True, f"Retrieved {len(ideas)} ideas")
            else:
                self.log_test("Idea GET All", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Idea GET All", False, str(e))
        
        # 3. GET Single Idea
        if self.created_ids['ideas']:
            try:
                response = self.make_request("GET", f"/ideas/{self.created_ids['ideas'][0]}")
                if response.status_code == 200:
                    idea = response.json()
                    self.log_test("Idea GET Single", True, f"Retrieved: {idea.get('title', 'N/A')}")
                else:
                    self.log_test("Idea GET Single", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Idea GET Single", False, str(e))
        
        # 4. UPDATE Idea
        if self.created_ids['ideas']:
            try:
                update_data = {
                    "status": "ready",
                    "priority": "medium",
                    "tags": ["pharmacology", "video", "advanced"]
                }
                response = self.make_request("PUT", f"/ideas/{self.created_ids['ideas'][0]}", update_data)
                if response.status_code == 200:
                    updated_idea = response.json()
                    self.log_test("Idea UPDATE", True, f"Updated status: {updated_idea.get('status')}")
                    
                    # Verify updated_date field
                    if 'updated_date' in updated_idea:
                        self.log_test("Idea UPDATE - Updated Date", True)
                    else:
                        self.log_test("Idea UPDATE - Updated Date", False)
                else:
                    self.log_test("Idea UPDATE", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Idea UPDATE", False, str(e))
        
        # 5. Search Ideas
        try:
            # Search by title
            response = self.make_request("GET", "/ideas/search/drug")
            if response.status_code == 200:
                search_results = response.json()
                self.log_test("Idea SEARCH by Title", True, f"Found {len(search_results)} results for 'drug'")
            else:
                self.log_test("Idea SEARCH by Title", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Idea SEARCH by Title", False, str(e))
        
        # Search by tag
        try:
            response = self.make_request("GET", "/ideas/search/pharmacology")
            if response.status_code == 200:
                search_results = response.json()
                self.log_test("Idea SEARCH by Tag", True, f"Found {len(search_results)} results for 'pharmacology'")
            else:
                self.log_test("Idea SEARCH by Tag", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Idea SEARCH by Tag", False, str(e))

    def test_recurring_tasks(self):
        """Test Recurring Tasks API"""
        print("\n=== Testing Recurring Tasks API ===")
        
        # Test data for realistic recurring tasks
        recurring_task_data = {
            "title": "Weekly Content Planning Session",
            "description": "Review upcoming content calendar and plan new pharmaceutical topics",
            "priority": "high",
            "category": "Content Planning",
            "frequency": "weekly",
            "frequency_detail": "Every Monday",
            "next_due_date": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
            "is_active": True
        }
        
        # 1. CREATE Recurring Task
        try:
            response = self.make_request("POST", "/recurring-tasks", recurring_task_data)
            if response.status_code == 200:
                created_task = response.json()
                task_id = created_task.get("_id")
                self.created_ids['recurring_tasks'].append(task_id)
                self.log_test("Recurring Task CREATE", True, f"Created with ID: {task_id}")
                
                # Verify required fields
                required_fields = ['title', 'frequency', 'next_due_date', 'is_active']
                missing_fields = [field for field in required_fields if field not in created_task]
                if missing_fields:
                    self.log_test("Recurring Task CREATE - Required Fields", False, f"Missing: {missing_fields}")
                else:
                    self.log_test("Recurring Task CREATE - Required Fields", True)
            else:
                self.log_test("Recurring Task CREATE", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Recurring Task CREATE", False, str(e))
        
        # 2. GET All Recurring Tasks
        try:
            response = self.make_request("GET", "/recurring-tasks")
            if response.status_code == 200:
                tasks = response.json()
                self.log_test("Recurring Task GET All", True, f"Retrieved {len(tasks)} recurring tasks")
            else:
                self.log_test("Recurring Task GET All", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Recurring Task GET All", False, str(e))
        
        # 3. GET Single Recurring Task
        if self.created_ids['recurring_tasks']:
            try:
                response = self.make_request("GET", f"/recurring-tasks/{self.created_ids['recurring_tasks'][0]}")
                if response.status_code == 200:
                    task = response.json()
                    self.log_test("Recurring Task GET Single", True, f"Retrieved: {task.get('title', 'N/A')}")
                else:
                    self.log_test("Recurring Task GET Single", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Recurring Task GET Single", False, str(e))
        
        # 4. UPDATE Recurring Task
        if self.created_ids['recurring_tasks']:
            try:
                update_data = {"frequency": "monthly", "is_active": False}
                response = self.make_request("PUT", f"/recurring-tasks/{self.created_ids['recurring_tasks'][0]}", update_data)
                if response.status_code == 200:
                    updated_task = response.json()
                    self.log_test("Recurring Task UPDATE", True, f"Updated frequency: {updated_task.get('frequency')}")
                else:
                    self.log_test("Recurring Task UPDATE", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Recurring Task UPDATE", False, str(e))
        
        # 5. Generate Task Instance (single)
        if self.created_ids['recurring_tasks']:
            try:
                # First, make it active and due
                update_data = {"is_active": True, "next_due_date": datetime.utcnow().isoformat() + "Z"}
                self.make_request("PUT", f"/recurring-tasks/{self.created_ids['recurring_tasks'][0]}", update_data)
                
                # Now generate task instance
                response = self.make_request("POST", f"/recurring-tasks/{self.created_ids['recurring_tasks'][0]}/generate")
                if response.status_code == 200:
                    generated_task = response.json()
                    self.log_test("Recurring Task GENERATE Instance", True, f"Generated task: {generated_task.get('title', 'N/A')}")
                    
                    # Verify generated task has correct fields
                    if generated_task.get('due_date') and generated_task.get('status') == 'pending':
                        self.log_test("Recurring Task GENERATE - Correct Fields", True)
                    else:
                        self.log_test("Recurring Task GENERATE - Correct Fields", False)
                else:
                    self.log_test("Recurring Task GENERATE Instance", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Recurring Task GENERATE Instance", False, str(e))
        
        # 6. Auto-Generate All Due Tasks
        try:
            response = self.make_request("POST", "/recurring-tasks/auto-generate")
            if response.status_code == 200:
                result = response.json()
                self.log_test("Recurring Task AUTO-GENERATE", True, f"Generated {result.get('count', 0)} tasks")
                
                # Verify response structure
                if 'message' in result and 'count' in result:
                    self.log_test("Recurring Task AUTO-GENERATE Response", True)
                else:
                    self.log_test("Recurring Task AUTO-GENERATE Response", False)
            else:
                self.log_test("Recurring Task AUTO-GENERATE", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Recurring Task AUTO-GENERATE", False, str(e))

    def test_enhanced_dashboard(self):
        """Test Enhanced Dashboard Stats"""
        print("\n=== Testing Enhanced Dashboard Stats ===")
        
        try:
            response = self.make_request("GET", "/dashboard/stats")
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Dashboard Stats GET", True, f"Retrieved dashboard stats")
                
                # Verify enhanced fields are present
                required_new_fields = ['urgent_tasks', 'monthly_income', 'pending_payments']
                missing_fields = [field for field in required_new_fields if field not in stats]
                
                if missing_fields:
                    self.log_test("Dashboard Stats - Enhanced Fields", False, f"Missing: {missing_fields}")
                else:
                    self.log_test("Dashboard Stats - Enhanced Fields", True)
                
                # Verify urgent_tasks is an array
                if isinstance(stats.get('urgent_tasks'), list):
                    self.log_test("Dashboard Stats - Urgent Tasks Array", True, f"Found {len(stats['urgent_tasks'])} urgent tasks")
                else:
                    self.log_test("Dashboard Stats - Urgent Tasks Array", False)
                
                # Verify financial fields are numbers
                income_is_number = isinstance(stats.get('monthly_income'), (int, float))
                pending_is_number = isinstance(stats.get('pending_payments'), (int, float))
                
                if income_is_number and pending_is_number:
                    self.log_test("Dashboard Stats - Financial Fields", True, f"Income: {stats.get('monthly_income')}, Pending: {stats.get('pending_payments')}")
                else:
                    self.log_test("Dashboard Stats - Financial Fields", False)
                
                # Verify original fields still present
                original_fields = ['videos_in_progress', 'upcoming_calendar_items', 'pending_tasks', 'total_videos', 'total_study_notes']
                missing_original = [field for field in original_fields if field not in stats]
                
                if missing_original:
                    self.log_test("Dashboard Stats - Original Fields", False, f"Missing original fields: {missing_original}")
                else:
                    self.log_test("Dashboard Stats - Original Fields", True)
                    
            else:
                self.log_test("Dashboard Stats GET", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Dashboard Stats GET", False, str(e))

    def cleanup(self):
        """Clean up created test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Clean up revenue records
        for revenue_id in self.created_ids['revenue']:
            try:
                self.make_request("DELETE", f"/revenue/{revenue_id}")
                print(f"Deleted revenue: {revenue_id}")
            except:
                pass
        
        # Clean up performance records  
        for performance_id in self.created_ids['performance']:
            try:
                self.make_request("DELETE", f"/performance/{performance_id}")
                print(f"Deleted performance: {performance_id}")
            except:
                pass
        
        # Clean up ideas
        for idea_id in self.created_ids['ideas']:
            try:
                self.make_request("DELETE", f"/ideas/{idea_id}")
                print(f"Deleted idea: {idea_id}")
            except:
                pass
        
        # Clean up recurring tasks
        for task_id in self.created_ids['recurring_tasks']:
            try:
                self.make_request("DELETE", f"/recurring-tasks/{task_id}")
                print(f"Deleted recurring task: {task_id}")
            except:
                pass

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting ManPharma Tutorials Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 80)
        
        try:
            # Test all new features
            self.test_revenue_tracking()
            self.test_content_performance() 
            self.test_idea_bank()
            self.test_recurring_tasks()
            self.test_enhanced_dashboard()
            
            # Clean up test data
            self.cleanup()
            
            # Print summary
            self.print_summary()
            
        except Exception as e:
            print(f"❌ CRITICAL ERROR: {str(e)}")
            return False

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        failure_rate = ((total - passed) / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failure_rate > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎯 NEW FEATURES TESTED:")
        print("  ✅ Revenue Tracking with CRUD + Monthly/Category summaries")
        print("  ✅ Content Performance Analytics with Top Content/Trends")
        print("  ✅ Idea Bank with Search functionality")
        print("  ✅ Recurring Tasks with Auto-generation")
        print("  ✅ Enhanced Dashboard with Income/Urgent tasks")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester(BASE_URL)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)