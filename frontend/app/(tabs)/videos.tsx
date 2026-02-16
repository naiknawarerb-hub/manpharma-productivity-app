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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, ProgressBar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface VideoStage {
  name: string;
  completed: boolean;
  completed_date?: string;
}

interface Video {
  _id: string;
  title: string;
  description: string;
  stages: VideoStage[];
  due_date?: string;
  created_date: string;
}

export default function VideosScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    due_date: new Date(),
  });

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos`);
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const createVideo = async () => {
    if (!newVideo.title.trim()) {
      Alert.alert('Error', 'Please enter a video title');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newVideo.title,
          description: newVideo.description,
          due_date: newVideo.due_date.toISOString(),
        }),
      });
      
      if (response.ok) {
        setNewVideo({ title: '', description: '', due_date: new Date() });
        setModalVisible(false);
        fetchVideos();
      }
    } catch (error) {
      console.error('Error creating video:', error);
      Alert.alert('Error', 'Failed to create video');
    }
  };

  const toggleStage = async (video: Video, stageIndex: number) => {
    const updatedStages = [...video.stages];
    updatedStages[stageIndex].completed = !updatedStages[stageIndex].completed;
    updatedStages[stageIndex].completed_date = updatedStages[stageIndex].completed
      ? new Date().toISOString()
      : undefined;

    try {
      await fetch(`${BACKEND_URL}/api/videos/${video._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: updatedStages }),
      });
      fetchVideos();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const deleteVideo = async (videoId: string) => {
    Alert.alert('Delete Video', 'Are you sure you want to delete this video?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/videos/${videoId}`, {
              method: 'DELETE',
            });
            fetchVideos();
          } catch (error) {
            console.error('Error deleting video:', error);
          }
        },
      },
    ]);
  };

  const getProgress = (stages: VideoStage[]) => {
    const completed = stages.filter((s) => s.completed).length;
    return completed / stages.length;
  };

  const renderVideoCard = (video: Video) => {
    const progress = getProgress(video.stages);
    const completedStages = video.stages.filter((s) => s.completed).length;

    return (
      <Card key={video._id} style={styles.videoCard}>
        <Card.Content>
          <View style={styles.videoHeader}>
            <View style={styles.videoTitleContainer}>
              <Text style={styles.videoTitle}>{video.title}</Text>
              {video.description ? (
                <Text style={styles.videoDescription}>{video.description}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => deleteVideo(video._id)}>
              <MaterialCommunityIcons name="delete" size={24} color="#f44336" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {completedStages} / {video.stages.length} stages completed
            </Text>
            <ProgressBar progress={progress} color="#6200ee" style={styles.progressBar} />
          </View>

          <View style={styles.stagesContainer}>
            {video.stages.map((stage, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stageItem}
                onPress={() => toggleStage(video, index)}
              >
                <MaterialCommunityIcons
                  name={stage.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={24}
                  color={stage.completed ? '#4CAF50' : '#ccc'}
                />
                <Text
                  style={[
                    styles.stageName,
                    stage.completed && styles.stageCompleted,
                  ]}
                >
                  {stage.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {video.due_date && (
            <View style={styles.dueDateContainer}>
              <MaterialCommunityIcons name="calendar" size={16} color="#666" />
              <Text style={styles.dueDateText}>
                Due: {new Date(video.due_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading videos...</Text>
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
        {videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="video-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No videos yet</Text>
            <Text style={styles.emptySubtext}>Create your first video project</Text>
          </View>
        ) : (
          videos.map(renderVideoCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Video Project</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Video Title *"
              value={newVideo.title}
              onChangeText={(text) => setNewVideo({ ...newVideo, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newVideo.description}
              onChangeText={(text) => setNewVideo({ ...newVideo, description: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDueDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#666" />
              <Text style={styles.dateButtonText}>
                Due: {newVideo.due_date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDueDatePicker && (
              <DateTimePicker
                value={newVideo.due_date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDueDatePicker(false);
                  if (selectedDate) {
                    setNewVideo({ ...newVideo, due_date: selectedDate });
                  }
                }}
              />
            )}

            <Button
              mode="contained"
              onPress={createVideo}
              style={styles.createButton}
              buttonColor="#6200ee"
            >
              Create Video
            </Button>
          </View>
        </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
  videoCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  videoTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  stagesContainer: {
    marginTop: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stageName: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  stageCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dueDateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  createButton: {
    marginTop: 8,
  },
});
