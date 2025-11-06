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
  Alert,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { propertiesAPI, authAPI } from '../services/api'
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

const PropertiesScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [propertiesData, setPropertiesData] = useState([])
  const [brokerId, setBrokerId] = useState(null)
  const [token, setToken] = useState(null)

  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Transform API data to match screen expectations
  const transformPropertyData = (apiProperties) => {
    return apiProperties.map(prop => ({
      id: prop._id,
      title: prop.title,
      address: prop.address ? `${prop.address}, ${prop.city}` : prop.city,
      price: prop.priceUnit === 'INR' ? `₹${prop.price?.toLocaleString()}` : `$${prop.price?.toLocaleString()}`,
      priceRaw: prop.price || 0, // Raw numeric price for editing
      priceUnit: prop.priceUnit || 'INR', // Price unit for editing
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      sqft: prop.propertySize || 0,
      furnishing: prop.furnishing || 'Not Specified',
      type: prop.propertyType || 'Property',
      subType: prop.subType || '',
      status: prop.status?.toLowerCase().replace(' ', '_') || 'active',
      statusOriginal: prop.status || 'Pending Approval', // Preserve original status for API updates
      images: prop.images?.filter(img => img && img !== '') || [],
      features: prop.features || [],
      description: prop.description || prop.propertyDescription || '',
      propertyDescription: prop.propertyDescription || prop.description || '',
      agent: prop.broker?.name || 'Agent',
      listedDate: prop.createdAt ? new Date(prop.createdAt).toISOString().split('T')[0] : '',
      views: prop.viewsCount || 0,
      favorites: 0,
      amenities: prop.amenities || [],
      nearbyAmenities: prop.nearbyAmenities || [],
      locationBenefits: prop.locationBenefits || [],
      region: prop.region || {},
      facingDirection: prop.facingDirection || '',
      possessionStatus: prop.possessionStatus || '',
      propertyAgeYears: prop.propertyAgeYears || 0,
      videos: prop.videos || [],
      notes: prop.notes || ''
    }))
  }

  // Fetch properties from API
  const fetchProperties = React.useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      if (!token || !userId) {
        console.error('Missing auth data')
        Alert.alert('Error', 'Please login to view properties')
        return
      }

      setToken(token)
      setBrokerId(userId)

      // Fetch all properties (no pagination)
      const response = await propertiesAPI.getProperties(userId, token, selectedFilter)
      
      if (response.success && response.data) {
        const transformedData = transformPropertyData(response.data)
        
        setPropertiesData(transformedData)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      Alert.alert('Error', 'Failed to fetch properties. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedFilter])

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

  // Handle message press
  const handleMessagePress = () => {
    navigation.navigate('Notifications')
  }

  // Handle profile press
  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile')
  }

  // Handle edit property
  const handleEdit = (property) => {
    navigation.navigate('CreateProperty', { property })
  }

  // Handle delete property
  const handleDelete = async (property) => {
    if (!property) return
    
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await storage.getToken()
              if (!token) {
                Alert.alert('Error', 'Please login to delete properties')
                return
              }

              const propertyId = property.id || property._id
              const response = await propertiesAPI.deleteProperty(propertyId, token)
              
              if (response.success) {
                Alert.alert('Success', 'Property deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh properties after deletion
                      fetchProperties(false)
                    }
                  }
                ])
              } else {
                Alert.alert('Error', response.message || 'Failed to delete property')
              }
            } catch (error) {
              console.error('Error deleting property:', error)
              Alert.alert('Error', 'Failed to delete property. Please try again.')
            }
          }
        }
      ]
    )
  }

  // Track if this is the initial mount to avoid double-fetching on mount
  const isInitialMount = React.useRef(true)

  // Initial load
  useEffect(() => {
    setPropertiesData([])
    fetchProperties(false)
    fetchUserProfile()
    isInitialMount.current = false
  }, [])

  // Refresh when filter changes
  useEffect(() => {
    setPropertiesData([])
    fetchProperties(false)
  }, [selectedFilter, fetchProperties])

  // Refresh properties when screen comes into focus (e.g., returning from CreatePropertyScreen)
  useFocusEffect(
    React.useCallback(() => {
      // Skip refresh on initial mount (already handled by useEffect)
      if (isInitialMount.current) {
        return
      }
      
      // Refresh properties list when screen is focused
      // This ensures new properties appear immediately after creation
      console.log('PropertiesScreen focused - refreshing properties list')
      fetchProperties(true)
    }, [fetchProperties])
  )

  // Handle pull to refresh
  const onRefresh = async () => {
    await fetchProperties(true)
  }

  // Load sample data if API fails
  const [sampleData] = useState([
    {
      id: 1,
      title: 'Luxury Downtown Condo',
      address: '123 Main Street, Downtown',
      price: '$850,000',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      type: 'Condo',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'],
      features: ['Pool', 'Gym', 'Parking'],
      description: 'Modern luxury condo with stunning city views',
      agent: 'Sarah Johnson',
      listedDate: '2024-01-15',
      views: 245,
      favorites: 12
    },
    {
      id: 2,
      title: 'Suburban Family Home',
      address: '456 Oak Avenue, Suburbia',
      price: '$650,000',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2500,
      type: 'House',
      status: 'pending',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'],
      features: ['Garden', 'Garage', 'School District'],
      description: 'Perfect family home in quiet neighborhood',
      agent: 'Michael Chen',
      listedDate: '2024-01-12',
      views: 189,
      favorites: 8
    },
    {
      id: 3,
      title: 'Beachfront Villa',
      address: '789 Ocean Drive, Beachside',
      price: '$1,200,000',
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3500,
      type: 'Villa',
      status: 'sold',
      images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop'],
      features: ['Ocean View', 'Pool', 'Beach Access'],
      description: 'Stunning beachfront property with panoramic ocean views',
      agent: 'Emily Rodriguez',
      listedDate: '2024-01-10',
      views: 456,
      favorites: 23
    },
    {
      id: 4,
      title: 'Modern Townhouse',
      address: '321 Pine Street, Midtown',
      price: '$450,000',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      type: 'Townhouse',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'],
      features: ['Modern Design', 'Rooftop Deck', 'Smart Home'],
      description: 'Contemporary townhouse with modern amenities',
      agent: 'David Thompson',
      listedDate: '2024-01-08',
      views: 167,
      favorites: 5
    }
  ])

  const filterOptions = [
    { key: 'all', label: 'All Properties', count: propertiesData.length },
    { key: 'active', label: 'Active', count: propertiesData.filter(prop => prop.status === 'active' || prop.status === 'Active').length },
    { key: 'pending', label: 'Pending', count: propertiesData.filter(prop => prop.status === 'pending' || prop.status.includes('pending')).length },
    { key: 'sold', label: 'Sold', count: propertiesData.filter(prop => prop.status === 'sold' || prop.status === 'Sold').length }
  ]

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'active'
    if (statusLower.includes('active')) return '#10B981'
    if (statusLower.includes('pending')) return '#F59E0B'
    if (statusLower.includes('sold')) return '#6B7280'
    if (statusLower.includes('approved')) return '#10B981'
    return '#6B7280'
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Condo': return 'apartment'
      case 'House': return 'home'
      case 'Villa': return 'villa'
      case 'Townhouse': return 'business'
      default: return 'home'
    }
  }

  const filteredProperties = selectedFilter === 'all' 
    ? propertiesData 
    : propertiesData.filter(prop => {
        const propStatus = prop.status?.toLowerCase() || ''
        const filterStatus = selectedFilter.toLowerCase()
        
        if (filterStatus === 'active') {
          return propStatus.includes('active') && !propStatus.includes('pending')
        }
        if (filterStatus === 'pending') {
          return propStatus.includes('pending')
        }
        if (filterStatus === 'sold') {
          return propStatus.includes('sold')
        }
        return prop.status === selectedFilter
      })

  const getStatusBackgroundColor = (status) => {
    const statusLower = status?.toLowerCase() || 'active'
    if (statusLower.includes('approved') || statusLower.includes('active')) return '#D1FAE5' // Light Green
    if (statusLower.includes('pending')) return '#FEF3C7' // Soft Light Yellow
    if (statusLower.includes('rejected')) return '#FEE2E2' // Light Red
    if (statusLower.includes('sold')) return '#F3F4F6' // Light Gray
    return '#D1FAE5'
  }

  const getStatusTextColor = (status) => {
    const statusLower = status?.toLowerCase() || 'active'
    if (statusLower.includes('approved') || statusLower.includes('active')) return '#059669' // Dark Green
    if (statusLower.includes('pending')) return '#F59E0B' // Muted Orange/Yellow
    if (statusLower.includes('rejected')) return '#DC2626' // Dark Red
    if (statusLower.includes('sold')) return '#6B7280' // Gray
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

  const PropertyCard = ({ property }) => {
    const hasImages = property.images && property.images.length > 0
    const statusBgColor = getStatusBackgroundColor(property.status)
    const statusTextColor = getStatusTextColor(property.status)
    
    return (
      <View style={styles.propertyCard}>
        <TouchableOpacity 
          style={styles.cardContentWrapper}
          onPress={() => navigation.navigate('PropertyDetails', { property })}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopSection}>
            {/* Property Image - Left Side */}
            <View style={styles.propertyImageContainer}>
              {hasImages ? (
                <>
                  <Image 
                    source={{ uri: property.images[0] }} 
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  {/* Property Type Badge */}
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
                  {/* Property Type Badge on Placeholder */}
                  {property.type && (
                    <View style={styles.propertyTypeBadge}>
                      <Text style={styles.propertyTypeBadgeText}>{property.type}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Property Content - Right Side */}
            <View style={styles.propertyContent}>
              {/* Title with Icon */}
              <View style={styles.titleRow}>
                <MaterialIcons name="home" size={16} color="#1F2937" />
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {property.title}
                </Text>
              </View>
              
              {/* Address with Icon */}
              <View style={styles.addressRow}>
                <MaterialIcons name="location-on" size={14} color="#6B7280" />
                <Text style={styles.propertyAddressText} numberOfLines={1}>
                  {property.address}
                </Text>
              </View>
              
              {/* Price */}
              <Text style={styles.propertyPrice}>
                {property.price}
              </Text>
              
              {/* Status Row */}
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
          
          {/* Divider - Full Width */}
          <View style={styles.divider} />
          
          {/* Features Below - Starting from Image Position */}
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
      </View>
    )
  }

  // Show loading state
  if (loading && propertiesData.length === 0) {
    return (
      <SafeAreaView style={styles.wrapper} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D542BFF" />
            <Text style={styles.loadingText}>Loading properties...</Text>
          </View>
        </View>
      </SafeAreaView>
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
                <Text style={styles.welcomeGreeting}>Manage Your Properties</Text>
                <Text style={styles.welcomeName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.profileButton} onPress={handleMessagePress}>
                <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
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
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {/* Total Properties - Light Green */}
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="home" size={22} color="#0D542BFF" />
                  <Text style={styles.statCount}>{propertiesData.length}</Text>
                </View>
                <Text style={styles.statTitle}>Total Properties</Text>
              </View>
            </View>
            
            {/* Approved - White */}
            <View style={[styles.statCard, styles.statCardWhite]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="check-circle" size={22} color="#0D542BFF" />
                  <Text style={styles.statCount}>{propertiesData.filter(prop => {
                    const status = prop.status?.toLowerCase() || ''
                    return status.includes('approved') || status.includes('active')
                  }).length}</Text>
                </View>
                <Text style={styles.statTitle}>Approved</Text>
              </View>
            </View>
            
            {/* Pending - Light Yellow/Beige */}
            <View style={[styles.statCard, styles.statCardYellow]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="schedule" size={22} color="#F59E0B" />
                  <Text style={styles.statCount}>{propertiesData.filter(prop => {
                    const status = prop.status?.toLowerCase() || ''
                    return status.includes('pending')
                  }).length}</Text>
                </View>
                <Text style={styles.statTitle}>Pending</Text>
              </View>
            </View>
            
            {/* Rejected - Light Red/Pink with Red Text */}
            <View style={[styles.statCard, styles.statCardRed]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="cancel" size={22} color="#DC2626" />
                  <Text style={[styles.statCount, styles.statCountRed]}>
                    {propertiesData.filter(prop => {
                      const status = prop.status?.toLowerCase() || ''
                      return status.includes('rejected')
                    }).length}
                  </Text>
                </View>
                <Text style={[styles.statTitle, styles.statTitleRed]}>Rejected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Properties List */}
        <View style={styles.propertiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Property Listings</Text>
          </View>
          
          {/* Add Property Button */}
          <View style={styles.addPropertyButtonContainer}>
            <TouchableOpacity 
              style={styles.addPropertyButtonPlaceholder}
              onPress={() => navigation.navigate('CreateProperty')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={32} color="#9CA3AF" />
              <Text style={styles.addPropertyButtonPlaceholderText}>Add Property</Text>
            </TouchableOpacity>
          </View>
          
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="home-work" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Properties Found</Text>
              <Text style={styles.emptyText}>You don't have any properties yet.</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateProperty')}
              >
                <MaterialIcons name="add" size={32} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Your First Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <FlatList
            data={filteredProperties}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <PropertyCard property={item} />}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statCardGreen: {
    backgroundColor: '#D1FAE5', // Light green
  },
  statCardWhite: {
    backgroundColor: '#FFFFFF', // White
  },
  statCardYellow: {
    backgroundColor: '#FEF3C7', // Light yellow/beige
  },
  statCardRed: {
    backgroundColor: '#FEE2E2', // Light red/pink
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
    color: '#1F2937',
  },
  statCountRed: {
    color: '#DC2626', // Red color for rejected
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statTitleRed: {
    color: '#DC2626', // Red color for rejected
  },

  // Add Property Button
  addPropertyButtonContainer: {
    marginBottom: 16,
  },
  addPropertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  addPropertyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addPropertyButtonPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    width: '100%',
    minHeight: 100,
  },
  addPropertyButtonPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Properties Section
  propertiesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
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
    color: '#0D542BFF',
    marginLeft: 4,
  },

  // Property Card Styles
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
  cardContentWrapper: {
    padding: 12,
  },
  cardTopSection: {
    flexDirection: 'row',
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
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
  actionIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingLeft: 0,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default PropertiesScreen
