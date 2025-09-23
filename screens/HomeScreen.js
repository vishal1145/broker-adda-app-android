import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg'
const { width } = Dimensions.get('window')

const HomeScreen = ({ navigation }) => {
  const [userName] = useState('Jordan')

  const handleLogout = () => {
    // Navigate back to login screen
    navigation.navigate('Login')
  }
  
  // Performance data matching the screenshot
  const [performanceData] = useState({
    totalLeadsCreated: 1250,
    leadsReceived: 890,
    leadsClosed: 450,
    leadsInProgress: 210,
    leadsCreatedChange: 8.5,
    leadsReceivedChange: 12.3,
    leadsClosedChange: 5.1,
    leadsInProgressChange: 2.8
  })

  // Properties data
  const [propertiesData] = useState({
    activeProperties: 75,
    soldExpired: 15,
    pendingApproval: 8,
    activeChange: 4.5,
    soldChange: 4.5,
    pendingChange: 4.5
  })

  // Messages data
  const [messagesData] = useState({
    unreadMessages: 12,
    customerInquiries: 5
  })

  // Notifications data
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Announcement: Q3 Performance Review',
      description: 'Read the latest company-wide performance update.',
      time: '2 hours ago',
      type: 'announcement',
      icon: 'notifications',
      iconColor: '#FFD700'
    },
    {
      id: 2,
      title: 'Lead Transfer: John Doe from Sarah K.',
      description: 'New lead for \'123 Oak St\' transferred to you.',
      time: '5 hours ago',
      type: 'transfer',
      icon: 'flash-on',
      iconColor: '#FF9800'
    },
    {
      id: 3,
      title: 'Action Required: Incomplete Lead Profile',
      description: 'Update missing details for \'Jane Smith\'.',
      time: '1 day ago',
      type: 'action',
      icon: 'warning',
      iconColor: '#F44336'
    }
  ])

  // Leads by status data
  const [leadsStatusData] = useState({
    closed: 45,
    inProgress: 25,
    new: 18,
    rejected: 12
  })

  const DonutChart = ({ data, size = 200 }) => {
    const colors = {
      closed: '#2E7D32',
      inProgress: '#FFD700', 
      new: '#2196F3',
      rejected: '#F44336'
    }

    const segments = [
      { color: colors.closed, percentage: data.closed, label: 'Closed' },
      { color: colors.inProgress, percentage: data.inProgress, label: 'In Progress' },
      { color: colors.new, percentage: data.new, label: 'New' },
      { color: colors.rejected, percentage: data.rejected, label: 'Rejected' }
    ]

    const radius = size / 2 - 20
    const innerRadius = radius - 25
    const centerX = size / 2
    const centerY = size / 2

    // Create donut chart using stroke-based approach
    return (
      <View style={styles.donutContainer}>
        <Svg width={size} height={size} style={styles.donutSvg}>
          <G transform={`translate(${centerX}, ${centerY})`}>
            {/* Background circle */}
            <Circle
              r={radius}
              stroke="#F5F5F5"
              strokeWidth={25}
              fill="transparent"
            />
            
            {/* Segments using stroke */}
            {segments.map((segment, index) => {
              const circumference = 2 * Math.PI * radius
              const segmentLength = (segment.percentage / 100) * circumference
              const strokeDasharray = `${segmentLength} ${circumference}`
              const strokeDashoffset = -((segments.slice(0, index).reduce((sum, s) => sum + s.percentage, 0) / 100) * circumference)
              
              return (
                <Circle
                  key={index}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={25}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90)`}
                />
              )
            })}
            
            {/* Center hole */}
            <Circle
              r={innerRadius}
              fill="#FFFFFF"
            />
          </G>
        </Svg>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          {/* First row: Closed and In Progress */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.closed }]} />
              <Text style={styles.legendText}>Closed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.inProgress }]} />
              <Text style={styles.legendText}>In Progress</Text>
            </View>
          </View>
          
          {/* Second row: New and Rejected */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.new }]} />
              <Text style={styles.legendText}>New</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.rejected }]} />
              <Text style={styles.legendText}>Rejected</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const MetricCard = ({ title, value, change, icon, iconColor, isDownward = false }) => (
    <View style={styles.metricCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <MaterialIcons name={icon} size={16} color={iconColor === "#16BCC0" ? "#FFFFFF" : "#16BCC0"} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.changePill}>
          <MaterialIcons name={isDownward ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} size={12} color="#16BCC0" />
          <Text style={styles.changeText}>{change}%</Text>
        </View>
      </View>
      <Text style={styles.cardValue}>{value.toLocaleString()}</Text>
    </View>
  )

  const NotificationItem = ({ notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <MaterialIcons name={notification.icon} size={20} color={notification.iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationDescription}>{notification.description}</Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialIcons name="notifications" size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitials}>
                  {userName[0]}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>


        {/* Performance Summary */}
        <View style={[styles.section, styles.performanceSection]}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <View style={styles.performanceGrid}>
            <MetricCard
              title="Total Leads Created"
              value={performanceData.totalLeadsCreated}
              change={performanceData.leadsCreatedChange}
              icon="trending-up"
              iconColor="#16BCC0"
            />
            <MetricCard
              title="Leads Received"
              value={performanceData.leadsReceived}
              change={performanceData.leadsReceivedChange}
              icon="attach-money"
              iconColor="#16BCC0"
            />
            <MetricCard
              title="Leads Closed"
              value={performanceData.leadsClosed}
              change={performanceData.leadsClosedChange}
              icon="assignment-turned-in"
              iconColor="#16BCC0"
            />
            <MetricCard
              title="Leads In Progress"
              value={performanceData.leadsInProgress}
              change={performanceData.leadsInProgressChange}
              icon="group"
              iconColor="#16BCC0"
              isDownward={true}
            />
          </View>
        </View>

        {/* Properties Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties Summary</Text>
          <View style={styles.propertiesGrid}>
            <MetricCard
              title="Active Properties"
              value={propertiesData.activeProperties}
              change={propertiesData.activeChange}
              icon="business"
              iconColor="#16BCC0"
            />
            <MetricCard
              title="Sold/Expired"
              value={propertiesData.soldExpired}
              change={propertiesData.soldChange}
              icon="home"
              iconColor="#16BCC0"
            />
            <MetricCard
              title="Pending Approval"
              value={propertiesData.pendingApproval}
              change={propertiesData.pendingChange}
              icon="location-on"
              iconColor="#16BCC0"
            />
          </View>
        </View>

        {/* Messages & Inquiries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages & Inquiries</Text>
          <View style={styles.messagesContainer}>
            <View style={styles.messageItem}>
              <View style={styles.messageIcon}>
                <MaterialIcons name="mail" size={20} color="#16BCC0" />
              </View>
              <Text style={styles.messageText}>Unread Messages</Text>
              <View style={styles.messageBadge}>
                <Text style={styles.badgeText}>{messagesData.unreadMessages}</Text>
              </View>
            </View>
            <View style={styles.messageItem}>
              <View style={styles.messageIcon}>
                <MaterialIcons name="chat" size={20} color="#16BCC0" />
              </View>
              <Text style={styles.messageText}>Customer Inquiries</Text>
              <View style={styles.messageBadge}>
                <Text style={styles.badgeText}>{messagesData.customerInquiries}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </View>
        </View>

        {/* Leads by Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leads by Status</Text>
          <View style={styles.chartCard}>
            <DonutChart data={leadsStatusData} size={200} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 6,
    padding: 8,
  },
  profileButton: {
    marginLeft: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16BCC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  performanceSection: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'left',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16BCC0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageIcon: {
    marginRight: 12,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  messageBadge: {
    backgroundColor: '#16BCC0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16BCC0',
  },
  notificationsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999999',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutSvg: {
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#333333',
  },
})

export default HomeScreen