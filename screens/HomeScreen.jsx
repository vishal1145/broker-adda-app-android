import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native'
import Footer from '../components/Footer'

const { width } = Dimensions.get('window')

const HomeScreen = ({ onLogout, activeTab, onTabPress }) => {
  const [userName] = useState('Ankit Yadav')
  const [userRole] = useState('CHANNEL PARTNER')
  
  // Performance data
  const [performanceData] = useState({
    totalVisitors: 3847,
    activeTags: 1264,
    expiredTags: 586,
    visitorsChange: 12,
    activeTagsChange: 8.3,
    expiredTagsChange: -4.2
  })

  // Tag validity data
  const [tagValidityData] = useState({
    active: 45,
    expiring7Days: 25,
    expiring30Days: 15,
    expired: 15
  })

  const DonutChart = ({ data, size = 200 }) => {
    const colors = {
      active: '#1A1A1A',
      expiring7Days: '#FFD700',
      expiring30Days: '#87CEEB',
      expired: '#FF6B6B'
    }

    // Create a simple circular representation using colored circles
    const segments = [
      { color: colors.active, percentage: data.active, label: 'Active' },
      { color: colors.expiring7Days, percentage: data.expiring7Days, label: 'Expiring in 7 Days' },
      { color: colors.expiring30Days, percentage: data.expiring30Days, label: 'Expiring in 30 Days' },
      { color: colors.expired, percentage: data.expired, label: 'Expired' }
    ]

    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChart}>
          <View style={styles.donutCenter}>
            <Text style={styles.donutCenterText}>100%</Text>
            <Text style={styles.donutCenterSubtext}>Total Tags</Text>
          </View>
        </View>
        <View style={styles.donutSegments}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.segmentRow}>
              <View style={[styles.segmentColor, { backgroundColor: segment.color }]} />
              <Text style={styles.segmentText}>{segment.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const PerformanceCard = ({ title, value, change, changeType, icon, iconColor }) => (
    <View style={styles.performanceCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.cardValue}>{value.toLocaleString()}</Text>
      <Text style={[
        styles.cardChange,
        { color: changeType === 'positive' ? '#4CAF50' : '#F44336' }
      ]}>
        {changeType === 'positive' ? '+' : ''}{change}% from last month
      </Text>
    </View>
  )

  // Tab press handler is now passed from parent component


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome, {userName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{userRole}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={onLogout}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitials}>
                {userName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Performance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <View style={styles.performanceGrid}>
            <PerformanceCard
              title="Total Visitors"
              value={performanceData.totalVisitors}
              change={performanceData.visitorsChange}
              changeType="positive"
              icon="👥"
              iconColor="#FF6B6B"
            />
            <PerformanceCard
              title="Active Tags"
              value={performanceData.activeTags}
              change={performanceData.activeTagsChange}
              changeType="positive"
              icon="✓"
              iconColor="#2196F3"
            />
            <PerformanceCard
              title="Expired Tags"
              value={performanceData.expiredTags}
              change={performanceData.expiredTagsChange}
              changeType="negative"
              icon="⏰"
              iconColor="#FFD700"
            />
          </View>
        </View>

        {/* Tag Validity Status */}
        <View style={styles.section}>
          <View style={styles.tagValidityCard}>
            <View style={styles.tagValidityHeader}>
              <Text style={styles.tagValidityTitle}>Tag Validity Status</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartContainer}>
              <DonutChart data={tagValidityData} size={200} />
            </View>
          </View>
        </View>
      </ScrollView>
      <Footer activeTab={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileButton: {
    marginLeft: 16,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    width: (width - 60) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagValidityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tagValidityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  tagValidityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutCenterText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  donutCenterSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
  },
  donutSegments: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmentColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
})

export default HomeScreen
