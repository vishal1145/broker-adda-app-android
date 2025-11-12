import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  Modal
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { authAPI, notificationsAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'
import { NotificationsScreenLoader } from '../components/ContentLoader'

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
  const insets = useSafeAreaInsets()
  
  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Notifications data
  const [notifications, setNotifications] = useState([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [countsByType, setCountsByType] = useState({
    lead: { total: 0, unread: 0 },
    property: { total: 0, unread: 0 },
    transfer: { total: 0, unread: 0 },
    approval: { total: 0, unread: 0 }
  })

  // Type filter options
  const typeOptions = [
    { key: 'all', label: 'All Notifications' },
    { key: 'lead', label: 'Lead' },
    { key: 'property', label: 'Property' },
    { key: 'approval', label: 'Approval' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'broker', label: 'Broker' }
  ]

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
  const fetchNotifications = async (type = null) => {
    try {
      setIsLoadingNotifications(true)
      const token = await storage.getToken()
      
      if (token) {
        // Use provided type or selectedType state, but only send if not 'all'
        const apiType = type !== null ? type : (selectedType !== 'all' ? selectedType : null)
        const response = await notificationsAPI.getNotifications(token, apiType)
        
        if (response && response.success && response.data && response.data.notifications) {
          const apiNotifications = response.data.notifications.map((notification) => {
            // Map API notification type to display type
            let notificationType = notification.type || 'property'
            
            // Determine icon based on type
            let icon = 'notifications'
            if (notificationType === 'property') icon = 'home'
            else if (notificationType === 'lead') icon = 'trending-up'
            else if (notificationType === 'approval') icon = 'check-circle'
            else if (notificationType === 'transfer') icon = 'swap-horiz'
            else if (notificationType === 'broker') icon = 'person'
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
          
          // Store countsByType from API response
          if (response.data.countsByType) {
            setCountsByType({
              lead: response.data.countsByType.lead || { total: 0, unread: 0 },
              property: response.data.countsByType.property || { total: 0, unread: 0 },
              transfer: response.data.countsByType.transfer || { total: 0, unread: 0 },
              approval: response.data.countsByType.approval || { total: 0, unread: 0 }
            })
          }
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

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const token = await storage.getToken()
      if (!token) return

      // Call API to mark all as read on server
      const response = await notificationsAPI.markAllAsRead(token)

      // Update local state to mark all as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({
          ...notif,
          isRead: true,
          priority: 'low'
        }))
      )

      // Show success message with updated count
      if (response && response.success) {
        const updatedCount = response.data?.updatedCount || 0
        const message = updatedCount > 0 
          ? `${updatedCount} notification${updatedCount === 1 ? '' : 's'} marked as read`
          : response.message || 'All notifications marked as read'
        Snackbar.showSuccess('Success', message)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      // Still update local state even if API call fails
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({
          ...notif,
          isRead: true,
          priority: 'low'
        }))
      )
      // Show error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark all notifications as read'
      Snackbar.showError('Error', errorMessage)
    }
  }

  // Handle type filter change
  const handleTypeFilterChange = (type) => {
    setSelectedType(type)
    fetchNotifications(type === 'all' ? null : type)
  }

  // Handle type change in modal
  const handleTypeChangeInModal = (typeKey) => {
    setSelectedType(typeKey)
    setShowTypeModal(false)
    fetchNotifications(typeKey === 'all' ? null : typeKey)
  }

  // Load profile and notifications on component mount
  useEffect(() => {
    fetchUserProfile()
    fetchNotifications()
  }, [])

  // Refresh data when screen comes into focus (e.g., returning from other screens)
  const isFirstMount = useRef(true)
  useFocusEffect(
    React.useCallback(() => {
      // Skip refresh on initial mount (already handled by useEffect)
      if (isFirstMount.current) {
        isFirstMount.current = false
        return
      }
      
      // Refresh all data when screen is focused, respecting current filter
      console.log('NotificationsScreen focused - refreshing data')
      const apiType = selectedType !== 'all' ? selectedType : null
      fetchNotifications(apiType)
      fetchUserProfile()
    }, [selectedType])
  )

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
      case 'approval': return 'check-circle'
      case 'transfer': return 'swap-horiz'
      case 'broker': return 'person'
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
        {/* Header - Fixed at top */}
        <View style={styles.header}>
          <View style={styles.headerPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            <View style={styles.patternCircle3} />
          </View>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>Manage your notifications</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={handleMarkAllAsRead}
              >
                <MaterialIcons name="done-all" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isLoadingNotifications ? (
          <NotificationsScreenLoader />
        ) : (
        <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollViewContent, { paddingBottom: 20 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview - four cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardGreen]}> 
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="trending-up" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>{countsByType.lead?.total || 0}</Text>
                </View>
                <Text style={styles.statTitle}>Lead Updates</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardYellow]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="home" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>{countsByType.property?.total || 0}</Text>
                </View>
                <Text style={styles.statTitle}>Property Updates</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardPurple]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>{countsByType.approval?.total || 0}</Text>
                </View>
                <Text style={styles.statTitle}>Approval Updates</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardBlue]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="swap-horiz" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>{countsByType.transfer?.total || 0}</Text>
                </View>
                <Text style={styles.statTitle}>Transfer Updates</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.dropdownContainerFullWidth}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {typeOptions.find(option => option.key === selectedType)?.label || 'All Notifications'}
              </Text>
              <MaterialIcons 
                name="keyboard-arrow-down" 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notifications
            </Text>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>{notifications.length}</Text>
              <Text style={styles.countSeparator}> / </Text>
              <Text style={styles.unreadCountText}>{notifications.filter(n => !n.isRead).length} Unread</Text>
            </View>
          </View>
          
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Notifications Found</Text>
              <Text style={styles.emptyMessage}>No notifications available at the moment</Text>
            </View>
          ) : (
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <NotificationCard notification={item} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
        )}
      </View>

      {/* Type Filter Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowTypeModal(false)}
          />
          <View style={styles.typeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTypeModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statusModalBody}>
              <View style={styles.chipContainer}>
                {typeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterChip,
                      selectedType === option.key && styles.filterChipActive
                    ]}
                    onPress={() => handleTypeChangeInModal(option.key)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedType === option.key && styles.filterChipTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 0, // Will be overridden by inline style with safe area inset
  },

  // Header Styles
  header: {
    backgroundColor: '#0D542BFF',
    paddingTop: 20,
    paddingBottom:20,
    paddingHorizontal: 20,
    marginBottom: 0,
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
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
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
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  statCardFullWidth: {
    width: width - 40,
  },
  statCardGreen: {
    backgroundColor: '#34D399',
  },
  statCardYellow: {
    backgroundColor: '#FCD34D',
  },
  statCardBlue: {
    backgroundColor: '#3B82F6',
  },
  statCardPurple: {
    backgroundColor: '#A855F7',
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
    flexShrink: 0,
    textAlign: 'right',
    minWidth: 40,
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
  dropdownContainerFullWidth: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  countText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  unreadCountText: {
    color: '#0D542BFF',
    fontWeight: '700',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countSeparator: {
    color: '#6B7280',
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 13,
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

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  typeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '60%',
    minHeight: 300,
  },
  statusModalBody: {
    paddingVertical: 0,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 0,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#E8F5E8',
    borderWidth: 0,
  },
  filterChipText: {
    fontSize: 14,
    color: '#000000',
  },
  filterChipTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
})

export default NotificationsScreen
