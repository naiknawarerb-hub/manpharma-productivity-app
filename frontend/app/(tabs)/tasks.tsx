import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date?: string;
  category: string;
  created_date: string;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: new Date(),
    category: '',
  });

  const priorities = ['low', 'medium', 'high'];
  const categories = ['Content', 'Editing', 'Research', 'Admin', 'Other'];

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`);
      const data = await response.json();
      // Sort: incomplete first, then completed at bottom
      const sorted = data.sort((a: Task, b: Task) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return 0;
      });
      setTasks(sorted);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const toggleTaskComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const openModal = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ? new Date(task.due_date) : new Date(),
        category: task.category,
      });
    } else {
      setSelectedTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: new Date(),
        category: '',
      });
    }
    setModalVisible(true);
  };

  const saveTask = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const url = selectedTask
        ? `${BACKEND_URL}/api/tasks/${selectedTask._id}`
        : `${BACKEND_URL}/api/tasks`;
      
      const method = selectedTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          due_date: formData.due_date.toISOString(),
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
              method: 'DELETE',
            });
            fetchTasks();
          } catch (error) {
            console.error('Error deleting task:', error);
          }
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#d32f2f';
      case 'medium': return '#f57c00';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Create your first task</Text>
          </View>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <Card key={task._id} style={[styles.taskCard, isCompleted && styles.completedCard]}>
                <Card.Content>
                  <View style={styles.taskRow}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => toggleTaskComplete(task)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={28}
                        color={isCompleted ? '#388e3c' : '#6200ee'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.taskContent}
                      onPress={() => openModal(task)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.taskTitle, isCompleted && styles.completedText]}>
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text style={[styles.taskDescription, isCompleted && styles.completedText]} numberOfLines={2}>
                          {task.description}
                        </Text>
                      ) : null}
                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                          <Text style={styles.priorityText}>{task.priority}</Text>
                        </View>
                        {task.category ? (
                          <Chip style={styles.categoryBadge} textStyle={styles.categoryText}>
                            {task.category}
                          </Chip>
                        ) : null}
                        {task.due_date && (
                          <Text style={styles.dueDate}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => deleteTask(task._id)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="delete" size={24} color={isCompleted ? '#999' : '#f44336'} />
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openModal()} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedTask ? 'Edit Task' : 'New Task'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Task Title *"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholderTextColor="#999"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.chipsContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setFormData({ ...formData, priority })}
                    activeOpacity={0.7}
                  >
                    <Chip
                      selected={formData.priority === priority}
                      style={[
                        styles.chip,
                        formData.priority === priority && { backgroundColor: getPriorityColor(priority) + '30', borderWidth: 2, borderColor: getPriorityColor(priority) }
                      ]}
                      selectedColor={getPriorityColor(priority)}
                      textStyle={formData.priority === priority && { color: getPriorityColor(priority), fontWeight: 'bold' }}
                    >
                      {priority}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setFormData({ ...formData, category })}
                    activeOpacity={0.7}
                  >
                    <Chip
                      selected={formData.category === category}
                      style={[
                        styles.chip,
                        formData.category === category && { backgroundColor: '#6200ee30', borderWidth: 2, borderColor: '#6200ee' }
                      ]}
                      selectedColor="#6200ee"
                    >
                      {category}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDueDatePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#6200ee" />
                <Text style={styles.dateButtonText}>
                  Due: {formData.due_date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDueDatePicker && (
                <DateTimePicker
                  value={formData.due_date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDueDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setFormData({ ...formData, due_date: selectedDate });
                    }
                  }}
                />
              )}

              <Button
                mode="contained"
                onPress={saveTask}
                style={styles.saveButton}
                buttonColor="#6200ee"
              >
                {selectedTask ? 'Update Task' : 'Create Task'}
              </Button>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  taskCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: '#fafafa',
    opacity: 0.7,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    height: 24,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 20,
  },
});
