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
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [activeTab, setActiveTab] = useState('Property')
  
  // Dummy data for brokers
  const [dummyBrokers] = useState([
    {
      id: 1,
      name: 'Rajesh Kumar',
      company: 'Prime Realty Solutions',
      location: 'Mumbai, Maharashtra',
      experience: '10+ years',
      propertiesSold: 125,
      rating: 4.8,
      phone: '+91 98765 43210',
      email: 'rajesh@primerealty.com',
      image: null
    },
    {
      id: 2,
      name: 'Priya Sharma',
      company: 'Elite Properties',
      location: 'Delhi, NCR',
      experience: '8+ years',
      propertiesSold: 98,
      rating: 4.9,
      phone: '+91 98765 43211',
      email: 'priya@eliteproperties.com',
      image: null
    },
    {
      id: 3,
      name: 'Amit Patel',
      company: 'Dream Homes Realty',
      location: 'Bangalore, Karnataka',
      experience: '12+ years',
      propertiesSold: 156,
      rating: 4.7,
      phone: '+91 98765 43212',
      email: 'amit@dreamhomes.com',
      image: null
    }
  ])
  
  // Dummy data for leads (matching HomeScreen structure)
  const [dummyLeads] = useState([
    {
      id: 1,
      title: 'Residential for Buy',
      requirement: 'Buy',
      propertyType: 'Residential',
      timeAgo: '2h ago',
      preferredLocation: 'Mumbai',
      secondaryLocation: 'Pune',
      budget: '₹50,00,000',
      contactName: 'Rahul Mehta',
      phone: '+91 98765 43210',
      email: 'rahul@example.com'
    },
    {
      id: 2,
      title: 'Commercial for Rent',
      requirement: 'Rent',
      propertyType: 'Commercial',
      timeAgo: '5h ago',
      preferredLocation: 'Delhi',
      secondaryLocation: 'Gurgaon',
      budget: '₹2,00,000',
      contactName: 'Sneha Gupta',
      phone: '+91 98765 43211',
      email: 'sneha@example.com'
    },
    {
      id: 3,
      title: 'Residential for Buy',
      requirement: 'Buy',
      propertyType: 'Residential',
      timeAgo: '1d ago',
      preferredLocation: 'Bangalore',
      secondaryLocation: 'Hyderabad',
      budget: '₹75,00,000',
      contactName: 'Vikram Singh',
      phone: '+91 98765 43212',
      email: 'vikram@example.com'
    }
  ])
  
  // Dummy data for properties (matching PropertyScreen structure)
  const [dummyProperties] = useState([
    {
      id: 1,
      title: 'Luxury Downtown Condo',
      address: '123 Main Street, Downtown',
      price: '₹85,00,000',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      furnishing: 'Fully Furnished',
      type: 'Condo',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop']
    },
    {
      id: 2,
      title: 'Suburban Family Home',
      address: '456 Oak Avenue, Suburbia',
      price: '₹65,00,000',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2500,
      furnishing: 'Semi-Furnished',
      type: 'House',
      status: 'pending',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop']
    },
    {
      id: 3,
      title: 'Modern Townhouse',
      address: '321 Pine Street, Midtown',
      price: '₹45,00,000',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      furnishing: 'Unfurnished',
      type: 'Townhouse',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop']
    }
  ])
  
  // Get filtered results based on active tab
  const getFilteredResults = () => {
    // Return all dummy data based on active tab
    if (activeTab === 'Broker') return dummyBrokers
    if (activeTab === 'Leads') return dummyLeads
    if (activeTab === 'Property') return dummyProperties
    return []
  }
  
  const filteredResults = getFilteredResults()
  
  // Get heading text based on active tab
  const getHeadingText = () => {
    if (activeTab === 'Broker') return 'Broker Results'
    if (activeTab === 'Leads') return 'Leads Result'
    if (activeTab === 'Property') return 'Property Result'
    return 'Results'
  }

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
      
      if (token) {
        const response = await notificationsAPI.getNotifications(token)
        
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
    setRefreshing(false)
  }

  // Render Broker Card
  const renderBrokerCard = (broker) => {
    return (
      <TouchableOpacity 
        style={styles.brokerCard}
        activeOpacity={0.8}
      >
        <View style={styles.brokerContent}>
          <View style={styles.brokerImagePlaceholder}>
            <MaterialIcons name="person" size={32} color="#D1D5DB" />
          </View>
          <View style={styles.brokerTextContainer}>
            <View style={styles.brokerHeader}>
              <MaterialIcons name="business" size={16} color="#0D542BFF" />
              <Text style={styles.brokerType}>Broker</Text>
            </View>
            <Text style={styles.brokerName} numberOfLines={1}>
              {broker.name}
            </Text>
            <Text style={styles.brokerCompany} numberOfLines={1}>
              {broker.company}
            </Text>
            <View style={styles.brokerDetails}>
              <View style={styles.brokerDetailItem}>
                <MaterialIcons name="location-on" size={14} color="#6B7280" />
                <Text style={styles.brokerDetailText}>{broker.location}</Text>
              </View>
              <View style={styles.brokerDetailItem}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.brokerDetailText}>{broker.rating} ({broker.propertiesSold} properties)</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }
  
  // Render Lead Card (matching HomeScreen style)
  const renderLeadCard = (lead) => {
    const getRequirementColor = (req) => {
      return req === 'Buy' ? '#0D542BFF' : '#F59E0B'
    }

    const getRequirementTextColor = (req) => {
      return req === 'Buy' ? '#FFFFFF' : '#1F2937'
    }

    return (
      <TouchableOpacity 
        style={styles.leadCard}
        activeOpacity={0.8}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadHeaderLeft}>
            <Text style={styles.leadTitle}>{lead.title}</Text>
            <View style={styles.leadTags}>
              <View style={[styles.leadTag, { backgroundColor: getRequirementColor(lead.requirement) }]}>
                <Text style={[styles.leadTagText, { color: getRequirementTextColor(lead.requirement) }]}>
                  {lead.requirement}
                </Text>
              </View>
              <View style={[styles.leadTag, { backgroundColor: '#FCD34D' }]}>
                <Text style={styles.leadTagTextYellow}>{lead.propertyType}</Text>
              </View>
            </View>
          </View>
          <View style={styles.leadTime}>
            <MaterialIcons name="schedule" size={14} color="#6B7280" />
            <Text style={styles.leadTimeText}>{lead.timeAgo}</Text>
          </View>
        </View>

        <View style={styles.leadDivider} />

        <View style={styles.leadDetails}>
          <View style={styles.leadDetailItem}>
            <MaterialIcons name="location-on" size={16} color="#6B7280" />
            <Text style={styles.leadDetailText}>
              Preferred: {lead.preferredLocation}
            </Text>
          </View>
          <View style={styles.leadDetailItem}>
            <MaterialIcons name="location-on" size={16} color="#6B7280" />
            <Text style={styles.leadDetailText}>
              Secondary: {lead.secondaryLocation}
            </Text>
          </View>
          <View style={styles.leadDetailItem}>
            <MaterialIcons name="business" size={16} color="#6B7280" />
            <Text style={styles.leadDetailText}>
              Budget: {lead.budget}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }
  
  // Render Property Card (matching PropertyScreen style)
  const renderPropertyCard = (property) => {
    const hasImages = property.images && property.images.length > 0
    const getStatusBackgroundColor = (status) => {
      const statusLower = status?.toLowerCase() || 'active'
      if (statusLower.includes('approved') || statusLower.includes('active')) return '#D1FAE5'
      if (statusLower.includes('pending')) return '#FEF3C7'
      if (statusLower.includes('rejected')) return '#FEE2E2'
      if (statusLower.includes('sold')) return '#F3F4F6'
      return '#D1FAE5'
    }

    const getStatusTextColor = (status) => {
      const statusLower = status?.toLowerCase() || 'active'
      if (statusLower.includes('approved') || statusLower.includes('active')) return '#059669'
      if (statusLower.includes('pending')) return '#F59E0B'
      if (statusLower.includes('rejected')) return '#DC2626'
      if (statusLower.includes('sold')) return '#6B7280'
      return '#059669'
    }

    const getStatusDisplayText = (status) => {
      const statusLower = status?.toLowerCase() || 'active'
      if (statusLower.includes('approved')) return 'Approved'
      if (statusLower.includes('pending')) return 'Pending'
      if (statusLower.includes('rejected')) return 'Rejected'
      if (statusLower.includes('active')) return 'Active'
      if (statusLower.includes('sold')) return 'Sold'
      return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Active'
    }

    const statusBgColor = getStatusBackgroundColor(property.status)
    const statusTextColor = getStatusTextColor(property.status)

    return (
      <TouchableOpacity 
        style={styles.propertyCard}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopSection}>
          <View style={styles.propertyImageContainer}>
            {hasImages ? (
              <>
                <Image 
                  source={{ uri: property.images[0] }} 
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
                {property.type && (
                  <View style={styles.propertyTypeBadge}>
                    <Text style={styles.propertyTypeBadgeText}>{property.type}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.propertyImagePlaceholder}>
                <MaterialIcons name="home" size={48} color="#D1D5DB" />
                <Text style={styles.placeholderText}>No Image</Text>
                {property.type && (
                  <View style={styles.propertyTypeBadge}>
                    <Text style={styles.propertyTypeBadgeText}>{property.type}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.propertyContent}>
            <View style={styles.titleRow}>
              <MaterialIcons name="home" size={16} color="#1F2937" />
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {property.title}
              </Text>
            </View>
            
            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={14} color="#6B7280" />
              <Text style={styles.propertyAddressText} numberOfLines={1}>
                {property.address}
              </Text>
            </View>
            
            <Text style={styles.propertyPrice}>
              {property.price}
            </Text>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                <Text style={[styles.statusBadgeText, { color: statusTextColor }]}>
                  {getStatusDisplayText(property.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.propertyFeatures}>
          <View style={styles.featureItem}>
            <MaterialIcons name="bed" size={16} color="#6B7280" />
            <Text style={styles.featureText}>{property.bedrooms} Bed</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="bathtub" size={16} color="#6B7280" />
            <Text style={styles.featureText}>{property.bathrooms} Bath</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="home" size={16} color="#6B7280" />
            <Text style={styles.featureText}>{property.furnishing || 'Not Specified'}</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="square-foot" size={16} color="#6B7280" />
            <Text style={styles.featureText}>{property.sqft || 0} sq.ft</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
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

        {/* Tab Navigation */}
        <View style={styles.tabContainerWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Broker' && styles.tabActive
              ]}
              onPress={() => setActiveTab('Broker')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'Broker' && styles.tabTextActive
              ]}>
                Broker
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Leads' && styles.tabActive
              ]}
              onPress={() => setActiveTab('Leads')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'Leads' && styles.tabTextActive
              ]}>
                Leads
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Property' && styles.tabActive
              ]}
              onPress={() => setActiveTab('Property')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'Property' && styles.tabTextActive
              ]}>
                Property
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Results Section */}
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
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>{getHeadingText()}</Text>
            
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0D542BFF" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : filteredResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons 
                  name={activeTab === 'Broker' ? 'person' : activeTab === 'Leads' ? 'people' : 'home'} 
                  size={48} 
                  color="#9CA3AF" 
                />
                <Text style={styles.emptyTitle}>No {activeTab} Found</Text>
                <Text style={styles.emptyText}>
                  No {activeTab.toLowerCase()} available at the moment
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  if (activeTab === 'Broker') {
                    return renderBrokerCard(item)
                  } else if (activeTab === 'Leads') {
                    return renderLeadCard(item)
                  } else if (activeTab === 'Property') {
                    return renderPropertyCard(item)
                  }
                  return null
                }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
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

  // Tab Navigation
  tabContainerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#F8FAFC',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#E8F5E8',
  },
  tabText: {
    fontSize: 14,
    color: '#000000',
  },
  tabTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  
  // Broker Card Styles
  brokerCard: {
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
  brokerContent: {
    flexDirection: 'row',
    padding: 12,
  },
  brokerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brokerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brokerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  brokerType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D542BFF',
    textTransform: 'uppercase',
  },
  brokerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  brokerCompany: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  brokerDetails: {
    gap: 6,
  },
  brokerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brokerDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Lead Card Styles (matching HomeScreen)
  leadCard: {
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
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadHeaderLeft: {
    flex: 1,
  },
  leadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  leadTags: {
    flexDirection: 'row',
    gap: 8,
  },
  leadTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadTagTextYellow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  leadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leadTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  leadDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  leadDetails: {
    gap: 10,
  },
  leadDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadDetailText: {
    fontSize: 14,
    color: '#1F2937',
  },
  
  // Property Card Styles (matching PropertyScreen)
  propertyCard: {
    flexDirection: 'column',
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
  cardTopSection: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 0,
  },
  propertyImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  propertyTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0D542BFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  propertyTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  propertyAddressText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 0,
    marginRight: 0,
  },
  propertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 4,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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

