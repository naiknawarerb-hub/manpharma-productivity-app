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
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CalendarItem {
  _id: string;
  title: string;
  content_type: string;
  scheduled_date: string;
  status: string;
  platform: string;
  description: string;
  created_date: string;
}

export default function CalendarScreen() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'Video',
    scheduled_date: new Date(),
    status: 'draft',
    platform: '',
    description: '',
  });

  const contentTypes = ['Video', 'Post', 'Story', 'Reel', 'Article', 'Other'];
  const statusOptions = ['draft', 'scheduled', 'posted'];
  const platforms = ['YouTube', 'Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok'];

  const fetchItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/calendar`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching calendar items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const openModal = (item?: CalendarItem) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        title: item.title,
        content_type: item.content_type,
        scheduled_date: new Date(item.scheduled_date),
        status: item.status,
        platform: item.platform,
        description: item.description,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        title: '',
        content_type: 'Video',
        scheduled_date: new Date(),
        status: 'draft',
        platform: '',
        description: '',
      });
    }
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      const url = selectedItem
        ? `${BACKEND_URL}/api/calendar/${selectedItem._id}`
        : `${BACKEND_URL}/api/calendar`;
      
      const method = selectedItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduled_date: formData.scheduled_date.toISOString(),
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchItems();
      }
    } catch (error) {
      console.error('Error saving calendar item:', error);
      Alert.alert('Error', 'Failed to save calendar item');
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/calendar/${itemId}`, {
              method: 'DELETE',
            });
            fetchItems();
          } catch (error) {
            console.error('Error deleting item:', error);
          }
        },
      },
    ]);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    items.forEach((item) => {
      const date = new Date(item.scheduled_date).toISOString().split('T')[0];
      marked[date] = {
        marked: true,
        dotColor: item.status === 'posted' ? '#4CAF50' : item.status === 'scheduled' ? '#03A9F4' : '#FF9800',
      };
    });
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#6200ee',
    };
    return marked;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return '#4CAF50';
      case 'scheduled': return '#03A9F4';
      default: return '#FF9800';
    }
  };

  const filteredItems = items.filter(
    (item) => new Date(item.scheduled_date).toISOString().split('T')[0] === selectedDate
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={getMarkedDates()}
          theme={{
            selectedDayBackgroundColor: '#6200ee',
            todayTextColor: '#6200ee',
            arrowColor: '#6200ee',
          }}
          style={styles.calendar}
        />

        <View style={styles.itemsContainer}>
          <Text style={styles.dateTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No items scheduled</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <Card key={item._id} style={styles.itemCard}>
                <TouchableOpacity onPress={() => openModal(item)}>
                  <Card.Content>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleContainer}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={styles.badgesRow}>
                          <Chip
                            style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}
                            textStyle={[styles.badgeText, { color: getStatusColor(item.status) }]}
                          >
                            {item.status}
                          </Chip>
                          <Chip style={styles.typeBadge} textStyle={styles.typeBadgeText}>
                            {item.content_type}
                          </Chip>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => deleteItem(item._id)}>
                        <MaterialCommunityIcons name="delete" size={24} color="#f44336" />
                      </TouchableOpacity>
                    </View>

                    {item.platform ? (
                      <View style={styles.platformContainer}>
                        <MaterialCommunityIcons name="cloud-upload" size={16} color="#666" />
                        <Text style={styles.platformText}>{item.platform}</Text>
                      </View>
                    ) : null}

                    {item.description ? (
                      <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </Card.Content>
                </TouchableOpacity>
              </Card>
            ))
          )}
        </View>
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
                  {selectedItem ? 'Edit Schedule' : 'New Schedule'}
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

              <Text style={styles.label}>Content Type</Text>
              <View style={styles.chipsContainer}>
                {contentTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFormData({ ...formData, content_type: type })}
                  >
                    <Chip
                      selected={formData.content_type === type}
                      style={styles.chip}
                      selectedColor="#6200ee"
                    >
                      {type}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.chipsContainer}>
                {statusOptions.map((status) => (
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

              <Text style={styles.label}>Platform</Text>
              <View style={styles.chipsContainer}>
                {platforms.map((platform) => (
                  <TouchableOpacity
                    key={platform}
                    onPress={() => setFormData({ ...formData, platform })}
                  >
                    <Chip
                      selected={formData.platform === platform}
                      style={styles.chip}
                      selectedColor="#6200ee"
                    >
                      {platform}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  Scheduled: {formData.scheduled_date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.scheduled_date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, scheduled_date: selectedDate });
                    }
                  }}
                />
              )}

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <Button
                mode="contained"
                onPress={saveItem}
                style={styles.saveButton}
                buttonColor="#6200ee"
              >
                {selectedItem ? 'Update' : 'Create'}
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
  calendar: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  itemsContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  badge: {
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: '#e3f2fd',
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '600',
  },
  platformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  platformText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
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
    marginTop: 60,
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
    marginTop: 8,
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
  saveButton: {
    marginTop: 8,
  },
});
