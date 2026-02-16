import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import RevenueScreen from '../business/revenue';
import AnalyticsScreen from '../business/analytics';

const renderScene = SceneMap({
  revenue: RevenueScreen,
  analytics: AnalyticsScreen,
});

export default function BusinessScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'revenue', title: 'Revenue' },
    { key: 'analytics', title: 'Analytics' },
  ]);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      labelStyle={styles.label}
      activeColor="#6200ee"
      inactiveColor="#666"
    />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={renderTabBar}
    />
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  indicator: {
    backgroundColor: '#6200ee',
    height: 3,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
});
