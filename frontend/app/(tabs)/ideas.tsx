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
import { Card, Button, Chip } from 'react-native-paper';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Idea {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  links: string[];
  priority: string;
  status: string;
  created_date: string;
  updated_date: string;
}

export default function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    category: '',
    links: [] as string[],
    priority: 'medium',
    status: 'idea',
  });
  const [newTag, setNewTag] = useState('');
  const [newLink, setNewLink] = useState('');

  const priorities = ['low', 'medium', 'high'];
  const statuses = ['idea', 'researching', 'ready', 'used'];
  const categories = ['Pharmacology', 'Pathology', 'Clinical', 'Anatomy', 'Other'];

  const fetchIdeas = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ideas`);
      const data = await response.json();
      setIdeas(data);
      setFilteredIdeas(data);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIdeas(ideas);
    } else {
      const filtered = ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          idea.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredIdeas(filtered);
    }
  }, [searchQuery, ideas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIdeas();
  };

  const openModal = (idea?: Idea) => {
    if (idea) {
      setSelectedIdea(idea);
      setFormData({
        title: idea.title,
        content: idea.content,
        tags: idea.tags || [],
        category: idea.category,
        links: idea.links || [],
        priority: idea.priority,
        status: idea.status,
      });
    } else {
      setSelectedIdea(null);
      setFormData({
        title: '',
        content: '',
        tags: [],
        category: '',
        links: [],
        priority: 'medium',
        status: 'idea',
      });
    }
    setModalVisible(true);
  };

  const saveIdea = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an idea title');
      return;
    }

    try {
      const url = selectedIdea
        ? `${BACKEND_URL}/api/ideas/${selectedIdea._id}`
        : `${BACKEND_URL}/api/ideas`;
      
      const method = selectedIdea ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchIdeas();
      }
    } catch (error) {
      console.error('Error saving idea:', error);
      Alert.alert('Error', 'Failed to save idea');
    }
  };

  const deleteIdea = async (ideaId: string) => {
    Alert.alert('Delete Idea', 'Are you sure you want to delete this idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/ideas/${ideaId}`, {
              method: 'DELETE',
            });
            fetchIdeas();
          } catch (error) {
            console.error('Error deleting idea:', error);
          }
        },
      },
    ]);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const addLink = () => {
    if (newLink.trim() && !formData.links.includes(newLink.trim())) {
      setFormData({ ...formData, links: [...formData.links, newLink.trim()] });
      setNewLink('');
    }
  };

  const removeLink = (link: string) => {
    setFormData({ ...formData, links: formData.links.filter((l) => l !== link) });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used': return '#9E9E9E';
      case 'ready': return '#4CAF50';
      case 'researching': return '#03A9F4';
      default: return '#FF9800';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading ideas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ideas, tags, categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredIdeas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="lightbulb-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No ideas found' : 'No ideas yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Start your idea bank'}
            </Text>
          </View>
        ) : (
          filteredIdeas.map((idea) => (
            <Card key={idea._id} style={styles.ideaCard}>
              <TouchableOpacity onPress={() => openModal(idea)}>
                <Card.Content>
                  <View style={styles.ideaHeader}>
                    <View style={styles.ideaTitleContainer}>
                      <Text style={styles.ideaTitle}>{idea.title}</Text>
                      <View style={styles.badgesRow}>
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityColor(idea.priority) },
                          ]}
                        >
                          <Text style={styles.priorityText}>{idea.priority}</Text>
                        </View>
                        <Chip
                          style={[styles.statusChip, { backgroundColor: getStatusColor(idea.status) + '20' }]}
                          textStyle={[styles.statusText, { color: getStatusColor(idea.status) }]}
                        >
                          {idea.status}
                        </Chip>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => deleteIdea(idea._id)}>
                      <MaterialCommunityIcons name="delete" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>

                  {idea.category ? (
                    <View style={styles.categoryContainer}>
                      <MaterialCommunityIcons name="tag" size={16} color="#6200ee" />
                      <Text style={styles.categoryText}>{idea.category}</Text>
                    </View>
                  ) : null}

                  {idea.content ? (
                    <Text style={styles.ideaContent} numberOfLines={3}>
                      {idea.content}
                    </Text>
                  ) : null}

                  {idea.tags && idea.tags.length > 0 ? (
                    <View style={styles.tagsContainer}>
                      {idea.tags.slice(0, 3).map((tag, index) => (
                        <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                          {tag}
                        </Chip>
                      ))}
                      {idea.tags.length > 3 ? (
                        <Text style={styles.moreText}>+{idea.tags.length - 3} more</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {idea.links && idea.links.length > 0 ? (
                    <View style={styles.linksContainer}>
                      <MaterialCommunityIcons name="link" size={16} color="#03A9F4" />
                      <Text style={styles.linksText}>{idea.links.length} link(s)</Text>
                    </View>
                  ) : null}
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))
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
                  {selectedIdea ? 'Edit Idea' : 'New Idea'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Idea Title *"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description, notes, or script snippets"
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setFormData({ ...formData, category })}
                  >
                    <Chip
                      selected={formData.category === category}
                      style={styles.chip}
                      selectedColor="#6200ee"
                    >
                      {category}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Tags</Text>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, styles.addItemInput]}
                  placeholder="Add tag"
                  value={newTag}
                  onChangeText={setNewTag}
                />
                <TouchableOpacity style={styles.addButton} onPress={addTag}>
                  <MaterialCommunityIcons name="plus" size={24} color="#6200ee" />
                </TouchableOpacity>
              </View>
              <View style={styles.itemsList}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    style={styles.chip}
                    onClose={() => removeTag(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>

              <Text style={styles.label}>Reference Links</Text>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, styles.addItemInput]}
                  placeholder="Add link URL"
                  value={newLink}
                  onChangeText={setNewLink}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.addButton} onPress={addLink}>
                  <MaterialCommunityIcons name="plus" size={24} color="#6200ee" />
                </TouchableOpacity>
              </View>
              <View style={styles.linksList}>
                {formData.links.map((link, index) => (
                  <View key={index} style={styles.linkItem}>
                    <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                    <TouchableOpacity onPress={() => removeLink(link)}>
                      <MaterialCommunityIcons name="close" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Priority</Text>
              <View style={styles.chipsContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setFormData({ ...formData, priority })}
                  >
                    <Chip
                      selected={formData.priority === priority}
                      style={styles.chip}
                      selectedColor={getPriorityColor(priority)}
                    >
                      {priority}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.chipsContainer}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFormData({ ...formData, status })}
                  >
                    <Chip
                      selected={formData.status === status}
                      style={styles.chip}
                      selectedColor={getStatusColor(status)}
                    >
                      {status}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                mode="contained"
                onPress={saveIdea}
                style={styles.saveButton}
                buttonColor="#6200ee"
              >
                {selectedIdea ? 'Update Idea' : 'Save Idea'}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
  ideaCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ideaTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  ideaTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    color: '#6200ee',
    marginLeft: 6,
    fontWeight: '600',
  },
  ideaContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#e3f2fd',
    marginRight: 6,
    marginBottom: 6,
    height: 28,
  },
  tagText: {
    fontSize: 11,
    color: '#1976d2',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  linksText: {
    fontSize: 12,
    color: '#03A9F4',
    marginLeft: 6,
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
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: '95%',
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
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
    height: 100,
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
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3e5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  linksList: {
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: '#03A9F4',
    marginRight: 8,
  },
  saveButton: {
    marginTop: 16,
  },
});
