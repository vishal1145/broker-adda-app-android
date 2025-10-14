import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const NotificationsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  // Sample notifications data
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Lead Assignment',
      description: 'You have been assigned a new lead for "Downtown Luxury Condo"',
      time: '2 minutes ago',
      type: 'lead',
      priority: 'high',
      isRead: false,
      icon: 'trending-up',
      iconColor: '#10B981'
    },
    {
      id: 2,
      title: 'Property Viewing Scheduled',
      description: 'Property viewing for "Suburban Family Home" scheduled for tomorrow at 2:00 PM',
      time: '1 hour ago',
      type: 'property',
      priority: 'medium',
      isRead: false,
      icon: 'home',
      iconColor: '#3B82F6'
    },
    {
      id: 3,
      title: 'Commission Payment Processed',
      description: 'Your commission payment of $12,500 has been processed and will reflect in your account within 2-3 business days',
      time: '3 hours ago',
      type: 'payment',
      priority: 'high',
      isRead: true,
      icon: 'attach-money',
      iconColor: '#F59E0B'
    },
    {
      id: 4,
      title: 'New Message from Client',
      description: 'Sarah Johnson sent you a message regarding the property inquiry',
      time: '5 hours ago',
      type: 'message',
      priority: 'medium',
      isRead: true,
      icon: 'message',
      iconColor: '#8B5CF6'
    },
    {
      id: 5,
      title: 'System Maintenance Notice',
      description: 'Scheduled maintenance will occur tonight from 11 PM to 1 AM. Some features may be temporarily unavailable.',
      time: '1 day ago',
      type: 'system',
      priority: 'low',
      isRead: true,
      icon: 'build',
      iconColor: '#6B7280'
    },
    {
      id: 6,
      title: 'Property Status Updated',
      description: 'The property "Beachfront Villa" status has been updated to "Under Contract"',
      time: '2 days ago',
      type: 'property',
      priority: 'medium',
      isRead: true,
      icon: 'update',
      iconColor: '#009689'
    }
  ])

  const filterOptions = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: notifications.filter(notif => !notif.isRead).length },
    { key: 'lead', label: 'Leads', count: notifications.filter(notif => notif.type === 'lead').length },
    { key: 'property', label: 'Properties', count: notifications.filter(notif => notif.type === 'property').length },
    { key: 'payment', label: 'Payments', count: notifications.filter(notif => notif.type === 'payment').length }
  ]

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const filteredNotifications = selectedFilter === 'all' 
    ? notifications 
    : selectedFilter === 'unread'
    ? notifications.filter(notif => !notif.isRead)
    : notifications.filter(notif => notif.type === selectedFilter)

  const NotificationCard = ({ notification }) => (
    <TouchableOpacity style={[
      styles.notificationCard,
      !notification.isRead && styles.unreadCard
    ]}>
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIcon, { backgroundColor: notification.iconColor + '20' }]}>
          <MaterialIcons name={notification.icon} size={20} color={notification.iconColor} />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={[styles.notificationTitle, !notification.isRead && styles.unreadTitle]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>{notification.time}</Text>
        </View>
        <View style={styles.notificationActions}>
          {!notification.isRead && <View style={styles.unreadDot} />}
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(notification.priority) }]} />
        </View>
      </View>
      
      <Text style={styles.notificationDescription}>{notification.description}</Text>
      
      <View style={styles.notificationFooter}>
        <View style={styles.typeBadge}>
          <Text style={[styles.typeText, { color: notification.iconColor }]}>
            {notification.type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.priorityBadge}>
          <Text style={[styles.priorityText, { color: getPriorityColor(notification.priority) }]}>
            {notification.priority.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.modernHeader}>
          {/* Background Pattern */}
          <View style={styles.headerPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            <View style={styles.patternCircle3} />
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>Stay updated with latest activities</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="mark-email-read" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="settings" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{notifications.length}</Text>
                <Text style={styles.statLabel}>Total Notifications</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="fiber-new" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{notifications.filter(notif => !notif.isRead).length}</Text>
                <Text style={styles.statLabel}>Unread</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{notifications.filter(notif => notif.type === 'lead').length}</Text>
                <Text style={styles.statLabel}>Lead Updates</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="home" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{notifications.filter(notif => notif.type === 'property').length}</Text>
                <Text style={styles.statLabel}>Property Updates</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.key && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === filter.key && styles.filterTabTextActive
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterBadge,
                  selectedFilter === filter.key && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.key && styles.filterBadgeTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications ({filteredNotifications.length})</Text>
            <TouchableOpacity style={styles.sortButton}>
              <MaterialIcons name="sort" size={20} color="#009689" />
              <Text style={styles.sortText}>Sort</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <NotificationCard notification={item} />}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 0,
  },

  // Header Styles
  modernHeader: {
    backgroundColor: '#009689',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  patternCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 100,
    left: -20,
  },
  patternCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 20,
    right: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#009689',
    borderColor: '#009689',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Notifications Section
  notificationsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#009689',
    marginLeft: 4,
  },

  // Notification Card Styles
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#009689',
    backgroundColor: '#F8FAFC',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009689',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
})

export default NotificationsScreen
