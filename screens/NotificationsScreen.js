import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { authAPI, notificationsAPI } from '../services/api'
import { storage } from '../services/storage'

const { width } = Dimensions.get('window')

// Helper function to handle image URLs - convert HTTP to HTTPS for APK builds
const getSecureImageUrl = (url) => {
  if (!url) return null
  console.log('Original URL:', url)
  // Convert HTTP to HTTPS for better compatibility with APK builds
  if (url.startsWith('http://')) {
    const secureUrl = url.replace('http://', 'https://')
    console.log('Converted to HTTPS:', secureUrl)
    return secureUrl
  }
  console.log('Using original URL:', url)
  return url
}

// Enhanced image component with fallback
const SafeImage = ({ source, style, imageType, fallbackText, ...props }) => {
  const [imageError, setImageError] = useState(false)
  const [currentSource, setCurrentSource] = useState(source)

  const handleError = (error) => {
    console.log(`Image error for ${imageType}:`, error)
    console.log('Failed URL:', currentSource?.uri)
    
    // If we're using HTTPS and it fails, try HTTP as fallback
    if (currentSource?.uri?.startsWith('https://')) {
      const httpUrl = currentSource.uri.replace('https://', 'http://')
      console.log('Trying HTTP fallback:', httpUrl)
      setCurrentSource({ uri: httpUrl })
      setImageError(false)
    } else {
      setImageError(true)
    }
  }

  const retry = () => {
    setImageError(false)
    setCurrentSource(source)
  }

  if (imageError) {
    return (
      <View style={[style, { backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }]}>
        {fallbackText ? (
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#065F46' }}>
            {fallbackText}
          </Text>
        ) : (
          <MaterialIcons name="person" size={20} color="#065F46" />
        )}
        <TouchableOpacity 
          style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#0D542BFF', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}
          onPress={retry}
        >
          <MaterialIcons name="refresh" size={10} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Image
      source={currentSource}
      style={style}
      onError={handleError}
      {...props}
    />
  )
}

const NotificationsScreen = ({ navigation }) => {
  
  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Notifications data
  const [notifications, setNotifications] = useState([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
  }

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      
      // Get token and broker ID from storage
      const token = await storage.getToken()
      const brokerId = await storage.getBrokerId()
      
      if (token && brokerId) {
        const response = await authAPI.getProfile(brokerId, token)
        
        if (response && response.data && response.data.broker) {
          const broker = response.data.broker
          setUserProfile(broker)
          
          // Set user name from profile data
          const name = broker.name || broker.userId?.name || broker.userId?.firstName || 'User'
          if (name && name !== 'User') {
            setUserName(name)
          }
          
          // Set profile image if available with secure URL
          if (broker.brokerImage) {
            const secureImageUrl = getSecureImageUrl(broker.brokerImage)
            setProfileImage(secureImageUrl)
          }
        } else {
          // No broker data found, keep default 'User'
          setUserName('User')
        }
      } else {
        // No token or broker ID, keep default 'User'
        setUserName('User')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Keep default name if API fails
      setUserName('User')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true)
      const token = await storage.getToken()
      
      if (token) {
        const response = await notificationsAPI.getNotifications(token)
        
        if (response && response.success && response.data && response.data.notifications) {
          const apiNotifications = response.data.notifications.map((notification) => {
            // Map API notification type to display type
            let notificationType = notification.type || 'property'
            
            // Determine icon based on type
            let icon = 'notifications'
            if (notificationType === 'property') icon = 'home'
            else if (notificationType === 'lead' || notificationType === 'approval') icon = 'trending-up'
            else if (notificationType.includes('payment')) icon = 'attach-money'
            else if (notificationType.includes('message')) icon = 'chat-bubble-outline'
            else if (notificationType.includes('system')) icon = 'build'
            
            return {
              id: notification._id,
              title: notification.title || 'Notification',
              description: notification.message || '',
              time: formatTimeAgo(notification.createdAt),
              type: notificationType,
              priority: notification.isRead ? 'low' : 'high',
              isRead: notification.isRead || false,
              icon: icon,
              iconColor: '#0D542B'
            }
          })
          
          setNotifications(apiNotifications)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Keep empty array if API fails
      setNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  // Handle message press
  const handleMessagePress = () => {
    navigation.navigate('ChatListScreen')
  }

  // Handle profile press
  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile')
  }

  // Load profile and notifications on component mount
  useEffect(() => {
    fetchUserProfile()
    fetchNotifications()
  }, [])

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
    return '#6B7280' // gray color for all icons
  }

  const getTypeBgColor = (type) => {
    return '#F3F4F6' // light gray background for all icons
  }

  const getBadgeTextColor = (type) => {
    return '#6B7280' // gray color for all types
  }

  const getBadgeBgColor = (type) => {
    return '#F3F4F6' // light gray background for all types
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
    <TouchableOpacity style={[
      styles.notificationCard,
      !notification.isRead && styles.notificationCardUnread
    ]}>
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
        <View style={[styles.typeBadge, { backgroundColor: getBadgeBgColor(notification.type) }]}>
          <Text style={[styles.typeText, { color: getBadgeTextColor(notification.type) }]}>
            {notification.type.toUpperCase()}
          </Text>
        </View>
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
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeGreeting}>Manage Your Notifications</Text>
                <Text style={styles.welcomeName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.profileButton} onPress={handleMessagePress}>
                <MaterialIcons name="message" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                <View style={styles.profileImageContainer}>
                  {profileImage ? (
                    <SafeImage 
                      source={{ uri: profileImage }} 
                      style={styles.profileImage}
                      imageType="profileImage"
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profileInitialsContainer}>
                      <Text style={styles.profileInitials}>
                        {(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </View>
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
  welcomeContainer: {
    marginBottom: 0,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileInitialsContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
