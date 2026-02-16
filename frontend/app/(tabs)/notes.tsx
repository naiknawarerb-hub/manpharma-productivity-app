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
import Slider from '@react-native-community/slider';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface StudyNote {
  _id: string;
  title: string;
  subject: string;
  content: string;
  progress_percentage: number;
  created_date: string;
  updated_date: string;
}

export default function NotesScreen() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content: '',
    progress_percentage: 0,
  });

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/study-notes`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const openModal = (note?: StudyNote) => {
    if (note) {
      setSelectedNote(note);
      setFormData({
        title: note.title,
        subject: note.subject,
        content: note.content,
        progress_percentage: note.progress_percentage,
      });
    } else {
      setSelectedNote(null);
      setFormData({ title: '', subject: '', content: '', progress_percentage: 0 });
    }
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!formData.title.trim() || !formData.subject.trim()) {
      Alert.alert('Error', 'Please enter title and subject');
      return;
    }

    try {
      const url = selectedNote
        ? `${BACKEND_URL}/api/study-notes/${selectedNote._id}`
        : `${BACKEND_URL}/api/study-notes`;
      
      const method = selectedNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        setFormData({ title: '', subject: '', content: '', progress_percentage: 0 });
        fetchNotes();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/study-notes/${noteId}`, {
              method: 'DELETE',
            });
            fetchNotes();
          } catch (error) {
            console.error('Error deleting note:', error);
          }
        },
      },
    ]);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#f44336';
    if (progress < 70) return '#FF9800';
    return '#4CAF50';
  };

  const renderNoteCard = (note: StudyNote) => (
    <Card key={note._id} style={styles.noteCard}>
      <TouchableOpacity onPress={() => openModal(note)}>
        <Card.Content>
          <View style={styles.noteHeader}>
            <View style={styles.noteTitleContainer}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.subjectBadge}>
                <MaterialCommunityIcons name="book-open" size={14} color="#6200ee" />
                <Text style={styles.subjectText}>{note.subject}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteNote(note._id)}>
              <MaterialCommunityIcons name="delete" size={24} color="#f44336" />
            </TouchableOpacity>
          </View>

          {note.content ? (
            <Text style={styles.noteContent} numberOfLines={2}>
              {note.content}
            </Text>
          ) : null}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={[styles.progressValue, { color: getProgressColor(note.progress_percentage) }]}>
                {note.progress_percentage}%
              </Text>
            </View>
            <ProgressBar
              progress={note.progress_percentage / 100}
              color={getProgressColor(note.progress_percentage)}
              style={styles.progressBar}
            />
          </View>

          <Text style={styles.dateText}>
            Updated: {new Date(note.updated_date).toLocaleDateString()}
          </Text>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading notes...</Text>
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
        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="notebook" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No study notes yet</Text>
            <Text style={styles.emptySubtext}>Create your first note</Text>
          </View>
        ) : (
          notes.map(renderNoteCard)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedNote ? 'Edit Note' : 'New Study Note'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Title *"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Subject *"
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes content"
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={6}
              />

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Progress: {formData.progress_percentage}%</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  value={formData.progress_percentage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, progress_percentage: Math.round(value) })
                  }
                  minimumTrackTintColor="#6200ee"
                  maximumTrackTintColor="#e0e0e0"
                  thumbTintColor="#6200ee"
                />
              </View>

              <Button
                mode="contained"
                onPress={saveNote}
                style={styles.saveButton}
                buttonColor="#6200ee"
              >
                {selectedNote ? 'Update Note' : 'Create Note'}
              </Button>
            </View>
          </ScrollView>
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
  noteCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subjectText: {
    fontSize: 12,
    color: '#6200ee',
    marginLeft: 4,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
  },
  progressValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
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
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    marginTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: '90%',
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
    height: 120,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  saveButton: {
    marginTop: 8,
  },
});
