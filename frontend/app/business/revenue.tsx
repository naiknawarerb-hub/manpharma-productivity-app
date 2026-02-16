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

export default function RevenueScreen() {
  const [revenues, setRevenues] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    source_category: 'Course Sales',
    source_detail: '',
    platform: '',
    payment_status: 'Pending',
    payment_date: new Date(),
    description: '',
  });

  const categories = ['Course Sales', 'Freelance', 'Other'];
  const statuses = ['Pending', 'Received'];
  const platforms = ['Udemy', 'YouTube', 'Instagram', 'Direct', 'Coursera', 'Other'];

  const fetchRevenues = async () => {
    try {
      const [revenuesRes, monthlyRes, categoryRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/revenue`),
        fetch(`${BACKEND_URL}/api/revenue/summary/monthly`),
        fetch(`${BACKEND_URL}/api/revenue/summary/category`),
      ]);
      
      const revenuesData = await revenuesRes.json();
      const monthlyDataRes = await monthlyRes.json();
      const categoryDataRes = await categoryRes.json();
      
      setRevenues(revenuesData);
      setMonthlyData(monthlyDataRes);
      setCategoryData(categoryDataRes);
    } catch (error) {
      console.error('Error fetching revenues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRevenues();
  };

  const openModal = (revenue?: any) => {
    if (revenue) {
      setSelectedRevenue(revenue);
      setFormData({
        amount: revenue.amount.toString(),
        source_category: revenue.source_category,
        source_detail: revenue.source_detail,
        platform: revenue.platform,
        payment_status: revenue.payment_status,
        payment_date: new Date(revenue.payment_date),
        description: revenue.description,
      });
    } else {
      setSelectedRevenue(null);
      setFormData({
        amount: '',
        source_category: 'Course Sales',
        source_detail: '',
        platform: '',
        payment_status: 'Pending',
        payment_date: new Date(),
        description: '',
      });
    }
    setModalVisible(true);
  };

  const saveRevenue = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const url = selectedRevenue
        ? `${BACKEND_URL}/api/revenue/${selectedRevenue._id}`
        : `${BACKEND_URL}/api/revenue`;
      
      const method = selectedRevenue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date.toISOString(),
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchRevenues();
      }
    } catch (error) {
      console.error('Error saving revenue:', error);
      Alert.alert('Error', 'Failed to save revenue');
    }
  };

  const deleteRevenue = async (revenueId: string) => {
    Alert.alert('Delete Revenue', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/revenue/${revenueId}`, {
              method: 'DELETE',
            });
            fetchRevenues();
          } catch (error) {
            console.error('Error deleting revenue:', error);
          }
        },
      },
    ]);
  };

  const totalReceived = categoryData.reduce((sum, cat) => sum + cat.total, 0);
  const currentMonthData = monthlyData[0] || { total_received: 0, total_pending: 0 };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading revenue data...</Text>
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
        <View style={styles.summarySection}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryLabel}>This Month</Text>
              <Text style={styles.summaryAmount}>₹{currentMonthData.total_received.toFixed(2)}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Received</Text>
                  <Text style={[styles.summaryItemValue, {color: '#4CAF50'}]}>
                    ₹{currentMonthData.total_received.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Pending</Text>
                  <Text style={[styles.summaryItemValue, {color: '#FF9800'}]}>
                    ₹{currentMonthData.total_pending.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>By Category</Text>
          <View style={styles.categoryRow}>
            {categoryData.map((cat, index) => (
              <Card key={index} style={styles.categoryCard}>
                <Card.Content style={styles.categoryContent}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <Text style={styles.categoryAmount}>₹{cat.total.toFixed(2)}</Text>
                  <Text style={styles.categoryCount}>{cat.count} entries</Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {revenues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="currency-inr" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No revenue entries yet</Text>
            <Text style={styles.emptySubtext}>Track your income</Text>
          </View>
        ) : (
          revenues.map((revenue) => (
            <Card key={revenue._id} style={styles.revenueCard}>
              <TouchableOpacity onPress={() => openModal(revenue)}>
                <Card.Content>
                  <View style={styles.revenueHeader}>
                    <View style={styles.revenueTitleContainer}>
                      <Text style={styles.revenueAmount}>₹{revenue.amount.toFixed(2)}</Text>
                      <View style={styles.revenueBadgesRow}>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: revenue.payment_status === 'Received' ? '#4CAF5020' : '#FF980020' }
                          ]}
                          textStyle={[
                            styles.statusText,
                            { color: revenue.payment_status === 'Received' ? '#4CAF50' : '#FF9800' }
                          ]}
                        >
                          {revenue.payment_status}
                        </Chip>
                        <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
                          {revenue.source_category}
                        </Chip>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => deleteRevenue(revenue._id)}>
                      <MaterialCommunityIcons name="delete" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>

                  {revenue.source_detail ? (
                    <Text style={styles.revenueDetail}>{revenue.source_detail}</Text>
                  ) : null}

                  {revenue.platform ? (
                    <View style={styles.platformContainer}>
                      <MaterialCommunityIcons name="web" size={16} color="#666" />
                      <Text style={styles.platformText}>{revenue.platform}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.revenueDate}>
                    {new Date(revenue.payment_date).toLocaleDateString()}
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
                  {selectedRevenue ? 'Edit Revenue' : 'Add Revenue'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Amount *"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Source Category</Text>
              <View style={styles.chipsContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setFormData({ ...formData, source_category: category })}
                  >
                    <Chip
                      selected={formData.source_category === category}
                      style={styles.chip}
                      selectedColor="#6200ee"
                    >
                      {category}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Source Detail (e.g., Course name, Client name)"
                value={formData.source_detail}
                onChangeText={(text) => setFormData({ ...formData, source_detail: text })}
              />

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

              <Text style={styles.label}>Payment Status</Text>
              <View style={styles.chipsContainer}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFormData({ ...formData, payment_status: status })}
                  >
                    <Chip
                      selected={formData.payment_status === status}
                      style={styles.chip}
                      selectedColor={status === 'Received' ? '#4CAF50' : '#FF9800'}
                    >
                      {status}
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
                  Date: {formData.payment_date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.payment_date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, payment_date: selectedDate });
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
                numberOfLines={2}
              />

              <Button
                mode="contained"
                onPress={saveRevenue}
                style={styles.saveButton}
                buttonColor="#6200ee"
              >
                {selectedRevenue ? 'Update' : 'Add Revenue'}
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
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#6200ee',
    borderRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  categoryContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  categoryCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
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
  revenueCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  revenueTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  revenueBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 28,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  categoryChipText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '600',
  },
  revenueDetail: {
    fontSize: 15,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
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
  revenueDate: {
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
    height: 60,
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
