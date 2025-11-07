import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { propertiesAPI, leadsAPI, authAPI, notificationsAPI } from '../services/api'
import { storage } from '../services/storage'

const { width } = Dimensions.get('window')

// Helper function to handle image URLs - convert HTTP to HTTPS for APK builds
const getSecureImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  return url
}

// Enhanced image component with fallback
const SafeImage = ({ source, style, imageType, fallbackText, ...props }) => {
  const [imageError, setImageError] = useState(false)
  const [currentSource, setCurrentSource] = useState(source)

  const handleError = (error) => {
    if (currentSource?.uri?.startsWith('https://')) {
      const httpUrl = currentSource.uri.replace('https://', 'http://')
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

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  // Fetch user profile
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
          setUserName(name)
          
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

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      const token = await storage.getToken()
      const brokerId = await storage.getUserId()
      const userId = await storage.getBrokerId()
      
      if (token) {
        const response = await notificationsAPI.getNotifications(token, brokerId, userId)
        
        if (response && response.success && response.data && response.data.notifications) {
          const unreadCount = response.data.notifications.filter(
            notification => !notification.isRead
          ).length
          
          setUnreadNotificationCount(unreadCount)
        }
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
      setUnreadNotificationCount(0)
    }
  }

  // Search function
  const performSearch = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const token = await storage.getToken()
      if (!token) {
        setIsSearching(false)
        return
      }

      // Search both properties and leads
      const [propertiesResponse, leadsResponse] = await Promise.all([
        propertiesAPI.getProperties(token).catch(() => ({ success: false, data: [] })),
        leadsAPI.getLeads(token).catch(() => ({ success: false, data: [] }))
      ])

      const allResults = []
      const queryLower = query.toLowerCase()

      // Filter properties
      if (propertiesResponse.success && propertiesResponse.data) {
        const properties = Array.isArray(propertiesResponse.data) 
          ? propertiesResponse.data 
          : (propertiesResponse.data.properties || [])
        
        properties.forEach(prop => {
          const matches = 
            (prop.title && prop.title.toLowerCase().includes(queryLower)) ||
            (prop.address && prop.address.toLowerCase().includes(queryLower)) ||
            (prop.city && prop.city.toLowerCase().includes(queryLower)) ||
            (prop.propertyType && prop.propertyType.toLowerCase().includes(queryLower))
          
          if (matches) {
            allResults.push({
              type: 'property',
              id: prop._id || prop.id,
              title: prop.title,
              address: prop.address ? `${prop.address}, ${prop.city}` : prop.city,
              price: prop.priceUnit === 'INR' ? `₹${prop.price?.toLocaleString()}` : `$${prop.price?.toLocaleString()}`,
              images: prop.images?.filter(img => img && img !== '') || [],
              propertyType: prop.propertyType || 'Property',
              data: prop
            })
          }
        })
      }

      // Filter leads
      if (leadsResponse.success && leadsResponse.data) {
        const leads = Array.isArray(leadsResponse.data) 
          ? leadsResponse.data 
          : (leadsResponse.data.leads || [])
        
        leads.forEach(lead => {
          const matches = 
            (lead.name && lead.name.toLowerCase().includes(queryLower)) ||
            (lead.phone && lead.phone.includes(query)) ||
            (lead.email && lead.email.toLowerCase().includes(queryLower)) ||
            (lead.requirement && lead.requirement.toLowerCase().includes(queryLower)) ||
            (lead.city && lead.city.toLowerCase().includes(queryLower))
          
          if (matches) {
            allResults.push({
              type: 'lead',
              id: lead._id || lead.id,
              title: lead.name || 'Unnamed Lead',
              address: lead.city || 'Location not specified',
              phone: lead.phone,
              email: lead.email,
              requirement: lead.requirement,
              status: lead.status,
              data: lead
            })
          }
        })
      }

      setSearchResults(allResults)
    } catch (error) {
      console.error('Error performing search:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle message press
  const handleMessagePress = () => {
    navigation.navigate('Notifications')
  }

  // Handle profile press
  const handleProfilePress = () => {
    navigation.navigate('Profile')
  }

  // Initial load
  useEffect(() => {
    fetchUserProfile()
    fetchUnreadNotificationCount()
  }, [])

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile()
      fetchUnreadNotificationCount()
    }, [])
  )

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchUserProfile()
    await fetchUnreadNotificationCount()
    if (searchQuery) {
      await performSearch(searchQuery)
    }
    setRefreshing(false)
  }

  const renderSearchResult = ({ item }) => {
    if (item.type === 'property') {
      return (
        <TouchableOpacity 
          style={styles.resultCard}
          onPress={() => navigation.navigate('PropertyDetails', { property: item.data })}
          activeOpacity={0.8}
        >
          <View style={styles.resultContent}>
            {item.images && item.images.length > 0 ? (
              <Image 
                source={{ uri: item.images[0] }} 
                style={styles.resultImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.resultImagePlaceholder}>
                <MaterialIcons name="home" size={32} color="#D1D5DB" />
              </View>
            )}
            <View style={styles.resultTextContainer}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="home" size={16} color="#0D542BFF" />
                <Text style={styles.resultType}>Property</Text>
              </View>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.resultAddress} numberOfLines={1}>
                {item.address}
              </Text>
              <Text style={styles.resultPrice}>{item.price}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )
    } else {
      return (
        <TouchableOpacity 
          style={styles.resultCard}
          onPress={() => navigation.navigate('LeadDetails', { lead: item.data })}
          activeOpacity={0.8}
        >
          <View style={styles.resultContent}>
            <View style={styles.resultImagePlaceholder}>
              <MaterialIcons name="person" size={32} color="#D1D5DB" />
            </View>
            <View style={styles.resultTextContainer}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="person" size={16} color="#0D542BFF" />
                <Text style={styles.resultType}>Lead</Text>
              </View>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.resultAddress} numberOfLines={1}>
                {item.address}
              </Text>
              {item.phone && (
                <Text style={styles.resultMeta}>{item.phone}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )
    }
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
        {/* Modern Header - Fixed at top */}
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
                <Text style={styles.welcomeGreeting}>Search</Text>
                <Text style={styles.welcomeName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.profileButton} onPress={handleMessagePress}>
                <View style={styles.notificationIconContainer}>
                  <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                  {unreadNotificationCount > 0 && (
                    <View style={[
                      styles.notificationBadge,
                      unreadNotificationCount > 9 && styles.notificationBadgeWide
                    ]}>
                      <Text style={styles.notificationBadgeText} numberOfLines={1} ellipsizeMode="clip">
                        {unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount)}
                      </Text>
                    </View>
                  )}
                </View>
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

        {/* Search Input - Below Header */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialIcons name="search" size={24} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties, leads, locations..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D542BFF"
            />
          }
        >
          {isSearching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0D542BFF" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {!isSearching && searchQuery.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Start Searching</Text>
              <Text style={styles.emptyText}>
                Search for properties, leads, or locations to get started
              </Text>
            </View>
          )}

          {!isSearching && searchQuery.length > 0 && searchResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptyText}>
                Try searching with different keywords
              </Text>
            </View>
          )}

          {!isSearching && searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsCount}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={renderSearchResult}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            </View>
          )}
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
  
  // Loading State
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },

  // Header Styles
  modernHeader: {
    backgroundColor: '#0D542BFF',
    paddingTop: 20,
    paddingBottom: 30,
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
  notificationIconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  notificationBadgeWide: {
    width: 'auto',
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 11,
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

  // Search Input
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Results Section
  resultsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  resultContent: {
    flexDirection: 'row',
    padding: 12,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  resultImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  resultType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D542BFF',
    textTransform: 'uppercase',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D542BFF',
    marginTop: 4,
  },
  resultMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
})

export default SearchScreen

