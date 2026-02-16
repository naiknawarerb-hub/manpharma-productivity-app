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
import DateTimePicker from '@react-native-community/datetimepicker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AnalyticsScreen() {
  const [performances, setPerformances] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any>({ top_by_views: [], top_by_engagement: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    content_title: '',
    content_type: 'Video',
    platform: 'YouTube',
    views: '',
    likes: '',
    comments: '',
    shares: '',
    reach: '',
    recorded_date: new Date(),
  });

  const contentTypes = ['Video', 'Post', 'Story', 'Reel', 'Course'];
  const platforms = ['YouTube', 'Instagram', 'Facebook', 'LinkedIn', 'Udemy'];

  const fetchAnalytics = async () => {
    try {
      const [perfRes, topRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/performance`),
        fetch(`${BACKEND_URL}/api/performance/analytics/top-content`),
      ]);
      
      const perfData = await perfRes.json();
      const topData = await topRes.json();
      
      setPerformances(perfData);
      setTopContent(topData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const openModal = (perf?: any) => {
    if (perf) {
      setSelectedPerformance(perf);
      setFormData({
        content_title: perf.content_title,
        content_type: perf.content_type,
        platform: perf.platform,
        views: perf.views.toString(),
        likes: perf.likes.toString(),
        comments: perf.comments.toString(),
        shares: perf.shares.toString(),
        reach: perf.reach.toString(),
        recorded_date: new Date(perf.recorded_date),
      });
    } else {
      setSelectedPerformance(null);
      setFormData({
        content_title: '',
        content_type: 'Video',
        platform: 'YouTube',
        views: '',
        likes: '',
        comments: '',
        shares: '',
        reach: '',
        recorded_date: new Date(),
      });
    }
    setModalVisible(true);
  };

  const savePerformance = async () => {
    if (!formData.content_title.trim()) {
      Alert.alert('Error', 'Please enter content title');
      return;
    }

    try {
      const url = selectedPerformance
        ? `${BACKEND_URL}/api/performance/${selectedPerformance._id}`
        : `${BACKEND_URL}/api/performance`;
      
      const method = selectedPerformance ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          views: parseInt(formData.views) || 0,
          likes: parseInt(formData.likes) || 0,
          comments: parseInt(formData.comments) || 0,
          shares: parseInt(formData.shares) || 0,
          reach: parseInt(formData.reach) || 0,
          recorded_date: formData.recorded_date.toISOString(),
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error saving performance:', error);
      Alert.alert('Error', 'Failed to save performance data');
    }
  };

  const deletePerformance = async (perfId: string) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/performance/${perfId}`, {
              method: 'DELETE',
            });
            fetchAnalytics();
          } catch (error) {
            console.error('Error deleting performance:', error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
        {topContent.top_by_views && topContent.top_by_views.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top by Views</Text>
            {topContent.top_by_views.slice(0, 3).map((item: any, index: number) => (
              <Card key={index} style={styles.topCard}>
                <Card.Content>
                  <View style={styles.topHeader}>
                    <Text style={styles.topRank}>#{index + 1}</Text>
                    <Text style={styles.topTitle} numberOfLines={1}>{item.content_title}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="eye" size={20} color="#6200ee" />
                      <Text style={styles.statValue}>{item.views}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="thumb-up" size={20} color="#4CAF50" />
                      <Text style={styles.statValue}>{item.likes}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="comment" size={20} color="#03A9F4" />
                      <Text style={styles.statValue}>{item.comments}</Text>
                    </View>
                  </View>
                  <Text style={styles.platformText}>{item.platform}</Text>
                </Card.Content>
              </Card>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>All Content Performance</Text>
        {performances.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-bar" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No analytics data yet</Text>
            <Text style={styles.emptySubtext}>Track your content performance</Text>
          </View>
        ) : (
          performances.map((perf) => (
            <Card key={perf._id} style={styles.perfCard}>
              <TouchableOpacity onPress={() => openModal(perf)}>
                <Card.Content>
                  <View style={styles.perfHeader}>
                    <View style={styles.perfTitleContainer}>
                      <Text style={styles.perfTitle}>{perf.content_title}</Text>
                      <View style={styles.perfBadges}>
                        <Chip style={styles.typeChip} textStyle={styles.typeText}>
                          {perf.content_type}
                        </Chip>
                        <Chip style={styles.platformChip} textStyle={styles.platformChipText}>
                          {perf.platform}
                        </Chip>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => deletePerformance(perf._id)}>
                      <MaterialCommunityIcons name="delete" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.gridItem}>
                      <MaterialCommunityIcons name="eye" size={18} color="#6200ee" />
                      <Text style={styles.gridValue}>{perf.views}</Text>
                      <Text style={styles.gridLabel}>Views</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <MaterialCommunityIcons name="thumb-up" size={18} color="#4CAF50" />
                      <Text style={styles.gridValue}>{perf.likes}</Text>
                      <Text style={styles.gridLabel}>Likes</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <MaterialCommunityIcons name="comment" size={18} color="#03A9F4" />
                      <Text style={styles.gridValue}>{perf.comments}</Text>
                      <Text style={styles.gridLabel}>Comments</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <MaterialCommunityIcons name="share" size={18} color="#FF9800" />
                      <Text style={styles.gridValue}>{perf.shares}</Text>
                      <Text style={styles.gridLabel}>Shares</Text>
                    </View>
                  </View>

                  <Text style={styles.perfDate}>
                    {new Date(perf.recorded_date).toLocaleDateString()}
                  </Text>
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
                  {selectedPerformance ? 'Edit Performance' : 'Add Performance Data'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Content Title *"
                value={formData.content_title}
                onChangeText={(text) => setFormData({ ...formData, content_title: text })}
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

              <View style={styles.metricsRow}>
                <TextInput
                  style={[styles.input, styles.metricInput]}
                  placeholder="Views"
                  value={formData.views}
                  onChangeText={(text) => setFormData({ ...formData, views: text })}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.metricInput]}
                  placeholder="Likes"
                  value={formData.likes}
                  onChangeText={(text) => setFormData({ ...formData, likes: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.metricsRow}>
                <TextInput
                  style={[styles.input, styles.metricInput]}
                  placeholder="Comments"
                  value={formData.comments}
                  onChangeText={(text) => setFormData({ ...formData, comments: text })}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.metricInput]}
                  placeholder="Shares"
                  value={formData.shares}
                  onChangeText={(text) => setFormData({ ...formData, shares: text })}
                  keyboardType="number-pad"
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Reach (optional)"
                value={formData.reach}
                onChangeText={(text) => setFormData({ ...formData, reach: text })}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  Recorded: {formData.recorded_date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.recorded_date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, recorded_date: selectedDate });
                    }
                  }}
                />
              )}

              <Button
                mode="contained"
                onPress={savePerformance}
                style={styles.saveButton}
                buttonColor="#6200ee"
              >
                {selectedPerformance ? 'Update' : 'Save Data'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  topCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginRight: 12,
  },
  topTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  platformText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  perfCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  perfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  perfTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  perfTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  perfBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    backgroundColor: '#f3e5ff',
    marginRight: 6,
    height: 26,
  },
  typeText: {
    fontSize: 11,
    color: '#6200ee',
    fontWeight: '600',
  },
  platformChip: {
    backgroundColor: '#e3f2fd',
    height: 26,
  },
  platformChipText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gridItem: {
    alignItems: 'center',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  gridLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  perfDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    textAlign: 'right',
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricInput: {
    flex: 1,
    marginRight: 8,
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
