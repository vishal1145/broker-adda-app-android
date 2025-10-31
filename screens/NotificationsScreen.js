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
// LinearGradient not used here

const { width } = Dimensions.get('window')

const NotificationsScreen = ({ navigation }) => {
  
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
      iconColor: '#0D542BFF'
    }
  ])

  // Filters removed as per UI requirement

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'lead':
      case 'property':
      case 'payment':
      case 'message':
      case 'system':
        return '#0D542B' // consistent dark green icons as in screenshot
      default:
        return '#0D542B'
    }
  }

  const getTypeBgColor = (type) => {
    switch (type) {
      case 'lead':
      case 'property':
      case 'payment':
      case 'message':
      case 'system':
        return '#E6F4EA' // soft green tint behind icons
      default:
        return '#E6F4EA'
    }
  }

  const getBadgeTextColor = (type) => {
    switch (type) {
      case 'lead':
        return '#0D542B'
      case 'payment':
        return '#F4B000' // bright yellow text
      default:
        return '#111827'
    }
  }

  const getBadgeBgColor = (type) => {
    switch (type) {
      case 'lead':
        return '#E6F4EA'
      case 'payment':
        return '#FFF4CC' // soft yellow
      default:
        return 'transparent'
    }
  }

  const getTypeIconName = (type, fallback) => {
    switch (type) {
      case 'lead': return 'trending-up'
      case 'property': return 'home'
      case 'payment': return 'attach-money'
      case 'message': return 'chat-bubble-outline'
      case 'system': return 'build'
      default: return fallback || 'notifications'
    }
  }

  const filteredNotifications = notifications

  const NotificationCard = ({ notification }) => (
    <TouchableOpacity style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIcon, { backgroundColor: getTypeBgColor(notification.type) }]}>
          <MaterialIcons name={getTypeIconName(notification.type, notification.icon)} size={18} color={getTypeColor(notification.type)} />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationTime}>{notification.time}</Text>
        </View>
      </View>

      <Text style={styles.notificationDescription}>{notification.description}</Text>

      <View style={styles.footerDivider} />

      <View style={styles.notificationFooter}>
        {['lead', 'payment'].includes(notification.type) ? (
          <View style={[styles.typeBadge, { backgroundColor: getBadgeBgColor(notification.type) }]}>
            <Text style={[styles.typeText, { color: getBadgeTextColor(notification.type) }]}>
              {notification.type.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={styles.typeTextPlain}>{notification.type.toUpperCase()}</Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
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
              <Text style={styles.headerSubtitle}>Latest updates</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="mark-email-read" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Overview - two cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardGreen]}> 
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="trending-up" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>{notifications.filter(notif => notif.type === 'lead').length}</Text>
                </View>
                <Text style={styles.statTitle}>Lead Updates</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardYellow]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="home" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>{notifications.filter(notif => notif.type === 'property').length}</Text>
                </View>
                <Text style={styles.statTitle}>Property Updates</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filters intentionally removed */}

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notifications (
              <Text style={styles.countText}>{notifications.length}</Text>
              <Text> / </Text>
              <Text style={styles.unreadCountText}>{notifications.filter(n => !n.isRead).length} Unread</Text>
              )
            </Text>
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
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0D542BFF',
  },
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
  simpleHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  simpleHeaderText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  modernHeader: {
    backgroundColor: '#0D542BFF',
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardGreen: {
    backgroundColor: '#34D399',
  },
  statCardYellow: {
    backgroundColor: '#FCD34D',
  },
  statCardContent: {
    padding: 16,
    minHeight: 88,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#0D542BFF',
    borderColor: '#0D542BFF',
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
  countText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  unreadCountText: {
    color: '#0D542BFF',
    fontWeight: '700',
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
    color: '#0D542BFF',
    marginLeft: 4,
  },

  // Notification Card Styles
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadCard: {
    // intentionally simplified to keep all cards consistent with design
    borderLeftWidth: 0,
    backgroundColor: '#FFFFFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
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
    backgroundColor: '#0D542BFF',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  typeBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeTextPlain: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
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
