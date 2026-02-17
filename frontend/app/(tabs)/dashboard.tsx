import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    videos_in_progress: 0,
    upcoming_calendar_items: 0,
    pending_tasks: 0,
    urgent_tasks: [] as any[],
    total_videos: 0,
    total_study_notes: 0,
    monthly_income: 0,
    pending_payments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ icon, title, value, color, subtitle }: any) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon} size={32} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </Card>
  );

  const QuickAction = ({ icon, label, onPress, color }: any) => (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#6200ee" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ManPharma Tutorials</Text>
        <Text style={styles.headerSubtitle}>Your Content Dashboard</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Work</Text>
        <StatCard
          icon="video-box"
          title="Videos in Progress"
          value={stats.videos_in_progress}
          color="#6200ee"
          subtitle={`${stats.total_videos} total videos`}
        />
        <StatCard
          icon="calendar-clock"
          title="Upcoming Posts"
          value={stats.upcoming_calendar_items}
          color="#03A9F4"
          subtitle="Next 7 days"
        />
        <StatCard
          icon="checkbox-marked-circle"
          title="Pending Tasks"
          value={stats.pending_tasks}
          color="#FF9800"
          subtitle="Requires attention"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income Snapshot</Text>
        <Card style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
          <View style={styles.statContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#4CAF5015' }]}>
              <MaterialCommunityIcons name="currency-inr" size={32} color="#4CAF50" />
            </View>
            <View style={styles.statText}>
              <Text style={styles.statValue}>₹{stats.monthly_income.toFixed(0)}</Text>
              <Text style={styles.statTitle}>This Month (Received)</Text>
              {stats.pending_payments > 0 && (
                <Text style={styles.statSubtitle}>
                  ₹{stats.pending_payments.toFixed(0)} pending
                </Text>
              )}
            </View>
          </View>
        </Card>
      </View>

      {stats.urgent_tasks && stats.urgent_tasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Urgent Tasks</Text>
          {stats.urgent_tasks.map((task: any) => (
            <Card key={task._id} style={styles.urgentTaskCard}>
              <Card.Content>
                <View style={styles.urgentTaskHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#f44336" />
                  <Text style={styles.urgentTaskTitle}>{task.title}</Text>
                </View>
                <Text style={styles.urgentTaskDue}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <QuickAction
            icon="plus-circle"
            label="Add Task"
            color="#6200ee"
            onPress={() => router.push('/(tabs)/tasks')}
          />
          <QuickAction
            icon="calendar-plus"
            label="Schedule Post"
            color="#03A9F4"
            onPress={() => router.push('/(tabs)/content')}
          />
          <QuickAction
            icon="currency-inr"
            label="Add Revenue"
            color="#4CAF50"
            onPress={() => router.push('/(tabs)/business')}
          />
          <QuickAction
            icon="lightbulb-on"
            label="Add Idea"
            color="#FF9800"
            onPress={() => router.push('/(tabs)/ideas')}
          />
          <QuickAction
            icon="video-plus"
            label="New Video"
            color="#9C27B0"
            onPress={() => router.push('/(tabs)/content')}
          />
          <QuickAction
            icon="chart-line"
            label="Analytics"
            color="#E91E63"
            onPress={() => router.push('/(tabs)/business')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <MaterialCommunityIcons name="video" size={28} color="#6200ee" />
            <Text style={styles.quickStatValue}>{stats.total_videos}</Text>
            <Text style={styles.quickStatLabel}>Total Videos</Text>
          </View>
          <View style={styles.quickStatCard}>
            <MaterialCommunityIcons name="book-open" size={28} color="#4CAF50" />
            <Text style={styles.quickStatValue}>{stats.total_study_notes}</Text>
            <Text style={styles.quickStatLabel}>Study Notes</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
  header: {
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 2,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    marginTop: 8,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  urgentTaskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  urgentTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgentTaskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  urgentTaskDue: {
    fontSize: 13,
    color: '#f44336',
    marginLeft: 28,
    fontWeight: '500',
  },
});
