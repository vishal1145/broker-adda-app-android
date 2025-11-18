import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Share,
  Alert,
  ActivityIndicator,
  Linking,
  Modal
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { propertiesAPI, savedPropertiesAPI, propertyRatingsAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'
import { PropertyDetailsScreenLoader } from '../components/ContentLoader'

// Helper function to format price in K/M format
const formatPrice = (price, currency = 'INR') => {
  if (!price || price === 0) return currency === 'INR' ? '₹0' : '$0'
  
  const currencySymbol = currency === 'INR' ? '₹' : '$'
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price
  
  if (numPrice >= 1000000) {
    // Millions
    const millions = numPrice / 1000000
    return `${currencySymbol}${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  } else if (numPrice >= 1000) {
    // Thousands
    const thousands = numPrice / 1000
    return `${currencySymbol}${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
  } else {
    // Less than 1000, show as is
    return `${currencySymbol}${numPrice.toLocaleString()}`
  }
}

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

  // Update currentSource when source prop changes
  useEffect(() => {
    if (source?.uri) {
      setCurrentSource(source)
      setImageError(false) // Reset error state when source changes
    }
  }, [source?.uri])

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
          <MaterialIcons name="home" size={20} color="#065F46" />
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

const PropertyDetailsScreen = ({ navigation, route }) => {
  const { property: initialProperty } = route.params || {}
  const insets = useSafeAreaInsets()
  
  const [property, setProperty] = useState(initialProperty)
  const [isLoading, setIsLoading] = useState(!initialProperty)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [currentBrokerId, setCurrentBrokerId] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isCheckingSaved, setIsCheckingSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [ratingsData, setRatingsData] = useState(null)
  const [isLoadingRatings, setIsLoadingRatings] = useState(false)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null)
  const scrollViewRef = useRef(null)

  // Combine images and videos into a single media array
  const getMediaArray = () => {
    if (!property) return []
    // Filter out empty strings, null, undefined, and whitespace-only values
    const images = (property.images || [])
      .filter(img => img && typeof img === 'string' && img.trim() !== '')
      .map(img => ({ type: 'image', url: img }))
    const videos = (property.videos || [])
      .filter(vid => vid && typeof vid === 'string' && vid.trim() !== '')
      .map(vid => ({ type: 'video', url: vid }))
    return [...images, ...videos]
  }

  const mediaArray = getMediaArray()
  const currentMedia = mediaArray[currentImageIndex]
  const isCurrentVideo = currentMedia?.type === 'video'

  // Transform API data to match screen expectations
  const transformPropertyData = (apiProperty) => {
    if (!apiProperty) return null
    
    return {
      id: apiProperty._id,
      title: apiProperty.title,
      address: apiProperty.address ? `${apiProperty.address}, ${apiProperty.city}` : apiProperty.city,
      price: formatPrice(apiProperty.price, apiProperty.priceUnit || 'INR'),
      priceRaw: apiProperty.price || 0, // Raw numeric price for editing
      bedrooms: apiProperty.bedrooms || 0,
      bathrooms: apiProperty.bathrooms || 0,
      sqft: apiProperty.propertySize || 0,
      furnishing: apiProperty.furnishing || 'Not Specified',
      type: apiProperty.propertyType || 'Property',
      subType: apiProperty.subType || '',
      status: apiProperty.status || 'Pending Approval', // Original status for editing
      statusDisplay: apiProperty.status?.toLowerCase().replace(' ', '_') || 'active', // Normalized status for display
      images: apiProperty.images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [],
      features: apiProperty.features || [],
      description: apiProperty.description || apiProperty.propertyDescription || '',
      propertyDescription: apiProperty.propertyDescription || apiProperty.description || '',
      agent: apiProperty.broker?.name || 'Agent',
      agentCompany: apiProperty.broker?.firmName || '',
      agentRole: 'Expert Broker',
      agentLocation: apiProperty.city || '',
      brokerImage: apiProperty.broker?.brokerImage || null,
      brokerId: apiProperty.broker?._id || null, // Store broker ID for ownership check
      listedDate: apiProperty.createdAt || '',
      views: apiProperty.viewsCount || 0,
      favorites: 0,
      amenities: apiProperty.amenities || [],
      nearbyAmenities: apiProperty.nearbyAmenities || [],
      locationBenefits: apiProperty.locationBenefits || [],
      facingDirection: apiProperty.facingDirection || '',
      possessionStatus: apiProperty.possessionStatus || '',
      propertyAgeYears: apiProperty.propertyAgeYears || 0,
      region: apiProperty.region || {},
      videos: apiProperty.videos?.filter(vid => vid && typeof vid === 'string' && vid.trim() !== '') || [],
      notes: apiProperty.notes || '',
      priceUnit: apiProperty.priceUnit || 'INR' // Include priceUnit for editing
    }
  }

  // Fetch property details from API
  const fetchPropertyDetails = async () => {
    try {
      setIsLoading(true)
      
      // Get property from route params (updated when navigating)
      const currentProperty = route.params?.property || initialProperty
      const propertyId = currentProperty?.id || currentProperty?._id
      
      if (!propertyId) {
        Alert.alert('Error', 'Property ID not found')
        setIsLoading(false)
        return
      }

      const token = await storage.getToken()
      if (!token) {
        Alert.alert('Error', 'Please login to view property details')
        setIsLoading(false)
        return
      }

      const response = await propertiesAPI.getPropertyDetails(propertyId, token)
      
      if (response.success) {
        // API returns { success: true, data: { property object } }
        // getPropertyDetails returns response.data, so response.data is the API response object
        const propertyData = response.data?.data || response.data
        const transformedData = transformPropertyData(propertyData)
        if (transformedData) {
          setProperty(transformedData)
        } else {
          Alert.alert('Error', 'Invalid property data received')
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch property details')
      }
    } catch (error) {
      console.error('Error fetching property details:', error)
      Alert.alert('Error', 'Failed to fetch property details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get current broker ID on mount
  useEffect(() => {
    const getBrokerId = async () => {
      const userId = await storage.getUserId()
      setCurrentBrokerId(userId)
    }
    getBrokerId()
  }, [])

  // Fetch property details on mount and when route params change
  useEffect(() => {
    const propertyFromRoute = route.params?.property
    const propertyId = propertyFromRoute?.id || propertyFromRoute?._id
    
    if (propertyId) {
      // Reset state when navigating to a new property
      setCurrentImageIndex(0)
      setActiveTab('description')
      setVideoModalVisible(false)
      setSelectedVideoUrl(null)
      
      // Scroll to top when navigating to a new property
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false })
      }
      
      // Update property state
      setProperty(propertyFromRoute)
      
      // Fetch fresh property details
      fetchPropertyDetails()
    }
  }, [route.params?.property])

  // Check if property is saved
  const checkSavedProperty = async () => {
    if (!property) return
    
    try {
      setIsCheckingSaved(true)
      const propertyId = property.id || property._id
      if (!propertyId) {
        setIsCheckingSaved(false)
        return
      }

      const token = await storage.getToken()
      if (!token) {
        setIsCheckingSaved(false)
        return
      }

      const response = await savedPropertiesAPI.checkSavedProperty(propertyId, token)
      
      if (response.success && response.data) {
        setIsSaved(response.data.isSaved || false)
      }
    } catch (error) {
      console.error('Error checking saved property:', error)
      setIsSaved(false)
    } finally {
      setIsCheckingSaved(false)
    }
  }

  // Save or unsave property
  const handleToggleSave = async () => {
    if (!property || isSaving) return
    
    try {
      setIsSaving(true)
      const propertyId = property.id || property._id
      if (!propertyId) {
        Alert.alert('Error', 'Property ID not found')
        setIsSaving(false)
        return
      }

      const token = await storage.getToken()
      if (!token) {
        Alert.alert('Error', 'Please login to save properties')
        setIsSaving(false)
        return
      }

      if (isSaved) {
        // Unsave property
        const response = await savedPropertiesAPI.unsaveProperty(propertyId, token)
        if (response && response.success) {
          setIsSaved(false)
          Snackbar.showSuccess('Success', 'Property removed from saved list')
        } else {
          const errorMsg = response?.message || response?.error || 'Failed to unsave property'
          Alert.alert('Error', errorMsg)
        }
      } else {
        // Save property
        const response = await savedPropertiesAPI.saveProperty(propertyId, token)
        if (response && response.success) {
          setIsSaved(true)
          Snackbar.showSuccess('Success', 'Property saved successfully')
        } else {
          // Handle case where property is already saved
          const errorMsg = response?.message || response?.error || ''
          if (errorMsg && (errorMsg.includes('already saved') || errorMsg.includes('already exists'))) {
            setIsSaved(true)
            Snackbar.showInfo('Info', 'Property is already saved')
          } else {
            Alert.alert('Error', errorMsg || 'Failed to save property')
          }
        }
      }
    } catch (error) {
      console.error('Error toggling save property:', error)
      // Handle error response - check both axios error structure and direct response
      const errorResponse = error.response?.data
      const errorMessage = errorResponse?.message || errorResponse?.error || error.message
      
      // Check if error response indicates property is already saved
      if (errorResponse && !errorResponse.success) {
        const msg = errorResponse.message || errorResponse.error || ''
        if (msg && (msg.includes('already saved') || msg.includes('already exists'))) {
          setIsSaved(true)
          Snackbar.showInfo('Info', 'Property is already saved')
          setIsSaving(false)
          return
        }
      }
      
      if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('already saved')) {
        setIsSaved(true)
        Snackbar.showInfo('Info', 'Property is already saved')
      } else if (errorMessage) {
        Alert.alert('Error', errorMessage)
      } else {
        Alert.alert('Error', 'Failed to save property. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Check if property is saved when property is loaded
  useEffect(() => {
    if (property && (property.id || property._id)) {
      checkSavedProperty()
      fetchPropertyRatings()
    }
  }, [property])

  // Refresh data when screen comes into focus (e.g., returning from other screens)
  const isFirstMount = useRef(true)
  useFocusEffect(
    React.useCallback(() => {
      // Skip refresh on initial mount (already handled by useEffect)
      if (isFirstMount.current) {
        isFirstMount.current = false
        return
      }
      
      // Refresh property details when screen is focused
      const propertyFromRoute = route.params?.property
      const propertyId = propertyFromRoute?.id || propertyFromRoute?._id
      
      if (propertyId) {
        console.log('PropertyDetailsScreen focused - refreshing data')
        fetchPropertyDetails()
        if (property && (property.id || property._id)) {
          checkSavedProperty()
          fetchPropertyRatings()
        }
      }
    }, [route.params?.property])
  )

  // Fetch property ratings
  const fetchPropertyRatings = async () => {
    if (!property) return
    
    try {
      setIsLoadingRatings(true)
      const propertyId = property.id || property._id
      if (!propertyId) {
        setIsLoadingRatings(false)
        return
      }

      // Try to get token, but continue even if not available (endpoint might not require auth)
      const token = await storage.getToken()

      const response = await propertyRatingsAPI.getPropertyRatings(propertyId, token)
      
      if (response.success && response.data) {
        setRatingsData(response.data)
      }
    } catch (error) {
      console.error('Error fetching property ratings:', error)
      // Set default ratings if API fails
      setRatingsData(null)
    } finally {
      setIsLoadingRatings(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981'
      case 'pending': return '#F59E0B'
      case 'sold': return '#6B7280'
      default: return '#6B7280'
    }
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

  // Format date function to show relative dates (Today, Yesterday, X days ago, or actual date)
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Reset time to midnight for accurate day comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dateToCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      // Calculate difference in days
      const diffTime = today - dateToCompare
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return 'Today'
      } else if (diffDays === 1) {
        return 'Yesterday'
      } else if (diffDays > 1 && diffDays <= 30) {
        return `${diffDays} days ago`
      } else if (diffDays < 0) {
        // Future date - show actual date
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } else {
        // Show actual date for dates older than 30 days
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    } catch (error) {
      return 'Not specified'
    }
  }

  // Helper function to get time ago string (for reviews)
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${Math.floor(diffInSeconds / 60) === 1 ? 'minute' : 'minutes'} ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${Math.floor(diffInSeconds / 3600) === 1 ? 'hour' : 'hours'} ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ${Math.floor(diffInSeconds / 86400) === 1 ? 'day' : 'days'} ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} ${Math.floor(diffInSeconds / 604800) === 1 ? 'week' : 'weeks'} ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ${Math.floor(diffInSeconds / 2592000) === 1 ? 'month' : 'months'} ago`
    return `${Math.floor(diffInSeconds / 31536000)} ${Math.floor(diffInSeconds / 31536000) === 1 ? 'year' : 'years'} ago`
  }

  const handleShare = async () => {
    if (!property) return
    
    try {
      const result = await Share.share({
        message: `Check out this property: ${property.title} - ${property.address}\nPrice: ${property.price}`,
        title: property.title,
      })
    } catch (error) {
      Alert.alert('Error', 'Unable to share property')
    }
  }

  const handleThumbnailPress = (index) => {
    const media = mediaArray[index]
    setCurrentImageIndex(index) // Set as current media first
    if (media?.type === 'video') {
      // Open video in external player or show modal
      const videoUrl = getSecureImageUrl(media.url)
      setSelectedVideoUrl(videoUrl)
      setVideoModalVisible(true)
    }
  }

  const handlePlayVideo = (videoUrl) => {
    const secureUrl = getSecureImageUrl(videoUrl)
    setSelectedVideoUrl(secureUrl)
    setVideoModalVisible(true)
  }

  const handleOpenVideo = async () => {
    if (selectedVideoUrl) {
      try {
        const supported = await Linking.canOpenURL(selectedVideoUrl)
        if (supported) {
          await Linking.openURL(selectedVideoUrl)
        } else {
          Alert.alert('Error', 'Cannot open this video')
        }
      } catch (error) {
        console.error('Error opening video:', error)
        Alert.alert('Error', 'Failed to open video')
      }
    }
    setVideoModalVisible(false)
  }

  const handleEdit = () => {
    navigation.navigate('CreateProperty', { property })
  }

  const handleDelete = async () => {
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
                    onPress: () => navigation.goBack()
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

  const handleContact = () => {
    if (!property) return
    
    Alert.alert(
      'Contact Agent',
      `Would you like to contact ${property.agent}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Call agent') },
        { text: 'Email', onPress: () => console.log('Email agent') },
      ]
    )
  }

  // Check if the property belongs to the current broker
  const isPropertyOwner = () => {
    if (!property || !currentBrokerId) return false
    
    const propertyBrokerId = property.brokerId || property.broker?._id
    return propertyBrokerId?.toString() === currentBrokerId?.toString()
  }

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
            <Text style={styles.headerTitle}>Property Details</Text>
            <Text style={styles.headerSubtitle}>Complete property information</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleShare}
            >
              <MaterialIcons name="share" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoading || !property ? (
        <PropertyDetailsScreenLoader />
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Property Images & Videos */}
        <View style={styles.imageSection}>
          {/* Fixed Main Image/Video */}
          <View style={styles.mainImageContainer}>
            {mediaArray.length > 0 ? (
              <>
                {isCurrentVideo ? (
                  // Video Display
                  <TouchableOpacity 
                    style={styles.videoContainer}
                    onPress={() => handlePlayVideo(currentMedia.url)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.videoPlaceholder}>
                      <MaterialIcons name="videocam" size={64} color="#FFFFFF" />
                      <Text style={styles.videoPlaceholderText}>Video</Text>
                    </View>
                    <View style={styles.videoPlayButton}>
                      <MaterialIcons name="play-circle-filled" size={64} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  // Image Display
                  <SafeImage 
                    source={{ uri: getSecureImageUrl(currentMedia?.url || property.images?.[0]) }} 
                    style={styles.mainImage}
                    imageType="propertyMainImage"
                    resizeMode="cover"
                  />
                )}
                
                {/* Featured Badge */}
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>

                {/* Image Action Buttons */}
                <View style={styles.mainImageActions}>
                  <TouchableOpacity 
                    style={styles.mainImageActionButton}
                    onPress={handleToggleSave}
                    disabled={isSaving || isCheckingSaved}
                  >
                    {isCheckingSaved ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <MaterialIcons 
                        name={isSaved ? "favorite" : "favorite-border"} 
                        size={24} 
                        color={isSaved ? "#FF6B6B" : "#FFFFFF"} 
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.mainImagePlaceholder}>
                  <MaterialIcons name="home" size={48} color="#D1D5DB" />
                  <Text style={styles.placeholderText}>No Image</Text>
                  {/* Property Type Badge on Placeholder */}
                  {property.type && (
                    <View style={styles.propertyTypeBadge}>
                      <Text style={styles.propertyTypeBadgeText}>{property.type}</Text>
                    </View>
                  )}
                </View>

                {/* Image Action Buttons on Placeholder */}
                <View style={styles.mainImageActions}>
                  <TouchableOpacity 
                    style={styles.mainImageActionButton}
                    onPress={handleToggleSave}
                    disabled={isSaving || isCheckingSaved}
                  >
                    {isCheckingSaved ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <MaterialIcons 
                        name={isSaved ? "favorite" : "favorite-border"} 
                        size={24} 
                        color={isSaved ? "#FF6B6B" : "#FFFFFF"} 
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Scrollable Thumbnail Row - Images & Videos */}
          {mediaArray.length > 1 && (
            <View style={styles.thumbnailContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailScroll}
              >
                {mediaArray.map((media, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnailWrapper,
                      index === currentImageIndex && styles.thumbnailWrapperActive
                    ]}
                    onPress={() => handleThumbnailPress(index)}
                    activeOpacity={0.7}
                  >
                    {media.type === 'video' ? (
                      // Video Thumbnail
                      <View style={styles.videoThumbnail}>
                        <View style={styles.videoThumbnailIcon}>
                          <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
                        </View>
                        <View style={styles.videoThumbnailPlayIcon}>
                          <MaterialIcons name="play-circle-filled" size={32} color="#FFFFFF" />
                        </View>
                      </View>
                    ) : (
                      // Image Thumbnail
                      <SafeImage 
                        source={{ uri: getSecureImageUrl(media.url) }} 
                        style={styles.thumbnailImage}
                        imageType="propertyThumbnail"
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Property Details Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.propertyDetailsCard}>
            {/* Property Name and Address */}
            <View style={styles.propertyDetailsHeader}>
              <Text style={styles.propertyDetailsTitle}>{property.title}</Text>
              <View style={styles.propertyDetailsAddressRow}>
                <MaterialIcons name="location-on" size={16} color="#6B7280" />
                <Text style={styles.propertyDetailsAddress}>{property.address}</Text>
              </View>
            </View>

            {/* Property Details Grid */}
            <View style={styles.propertyDetailsRow}>
              {/* Left Column */}
              <View style={styles.propertyDetailColumn}>
                <View style={styles.propertyDetailItem}>
                  <MaterialIcons name="bed" size={20} color="#6B7280" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Bedrooms</Text>
                    <Text style={styles.propertyDetailValue}>{property.bedrooms} BHK</Text>
                  </View>
                </View>
                <View style={styles.propertyDetailItem}>
                  <MaterialIcons name="schedule" size={20} color="#6B7280" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Listed</Text>
                    <Text style={styles.propertyDetailValue}>{formatDate(property.listedDate)}</Text>
                  </View>
                </View>
              </View>

              {/* Right Column */}
              <View style={styles.propertyDetailColumn}>
                <View style={styles.propertyDetailItem}>
                  <MaterialIcons name="square-foot" size={20} color="#6B7280" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Property Size</Text>
                    <Text style={styles.propertyDetailValue}>
                      {property.sqft 
                        ? `${typeof property.sqft === 'number' ? property.sqft.toLocaleString() : property.sqft} sq.ft` 
                        : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.propertyDetailItem}>
                  <MaterialIcons name="attach-money" size={20} color="#6B7280" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Price</Text>
                    <Text style={styles.propertyDetailValue}>{property.price}</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Property Rating - Bottom */}
            {ratingsData?.stats?.averageRating !== null && ratingsData?.stats?.averageRating !== undefined && (
              <View style={styles.propertyRatingContainer}>
                <View style={styles.propertyRatingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons 
                      key={star} 
                      name="star" 
                      size={18} 
                      color={star <= Math.round(ratingsData.stats.averageRating) ? "#FFD700" : "#E5E7EB"} 
                    />
                  ))}
                </View>
                <Text style={styles.propertyRatingText}>
                  {ratingsData.stats.averageRating.toFixed(1)}
                </Text>
                {ratingsData.stats.totalRatings > 0 && (
                  <Text style={styles.propertyRatingCount}>
                    ({ratingsData.stats.totalRatings} {ratingsData.stats.totalRatings === 1 ? 'review' : 'reviews'})
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Property Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Amenities</Text>
            <View style={styles.chipsContainer}>
              {property.amenities && property.amenities.length > 0 ? (
                property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{amenity}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyText}>No property amenities listed</Text>
                </View>
              )}
            </View>
          </View>

          {/* Nearby Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Amenities</Text>
            <View style={styles.chipsContainer}>
              {property.nearbyAmenities && property.nearbyAmenities.length > 0 ? (
                property.nearbyAmenities.map((amenity, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{amenity}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyText}>No nearby amenities listed</Text>
                </View>
              )}
            </View>
          </View>

          {/* Key Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.chipsContainer}>
              {property.features && property.features.length > 0 ? (
                property.features.map((feature, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{feature}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyText}>No key features listed</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Benefits</Text>
            <View style={styles.chipsContainer}>
              {property.locationBenefits && property.locationBenefits.length > 0 ? (
                property.locationBenefits.map((benefit, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{benefit}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyText}>No location benefits listed</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description and Review Tabs */}
          <View style={styles.section}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'description' && styles.tabActive]}
                onPress={() => setActiveTab('description')}
              >
                <Text style={[styles.tabText, activeTab === 'description' && styles.tabTextActive]}>
                  Description
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'review' && styles.tabActive]}
                onPress={() => setActiveTab('review')}
              >
                <Text style={[styles.tabText, activeTab === 'review' && styles.tabTextActive]}>
                  Review
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'description' ? (
              <View style={styles.tabContentCard}>
                {property.description ? (
                  <Text style={styles.tabContentText}>
                    {property.description}
                  </Text>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyText}>No description available</Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Reviews & Ratings */}
                <View style={styles.reviewsRatingsCard}>
                  <View style={styles.reviewsRatingsHeader}>
                    <View style={styles.reviewsRatingsTitleLine} />
                    <Text style={styles.reviewsRatingsTitle}>Reviews & Ratings</Text>
                  </View>
                  
                  {isLoadingRatings ? (
                    <View style={styles.loadingRatingsContainer}>
                      <ActivityIndicator size="small" color="#F59E0B" />
                      <Text style={styles.loadingRatingsText}>Loading ratings...</Text>
                    </View>
                  ) : ratingsData?.stats ? (
                    <View style={styles.overallRatingSection}>
                      <View style={styles.overallRatingLeft}>
                        <Text style={styles.overallRatingNumber}>
                          {ratingsData.stats.averageRating?.toFixed(1) || '0.0'}
                        </Text>
                        <View style={styles.overallRatingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialIcons 
                              key={star} 
                              name="star" 
                              size={20} 
                              color={star <= Math.round(ratingsData.stats.averageRating || 0) ? "#FBBF24" : "#E5E7EB"} 
                            />
                          ))}
                        </View>
                        <Text style={styles.overallRatingText}>
                          {ratingsData.stats.averageRating >= 4.5 ? 'Excellent' :
                           ratingsData.stats.averageRating >= 4.0 ? 'Very Good' :
                           ratingsData.stats.averageRating >= 3.5 ? 'Good' :
                           ratingsData.stats.averageRating >= 3.0 ? 'Average' : 'Below Average'}
                        </Text>
                        <Text style={styles.reviewsCount}>
                          Based on {ratingsData.stats.totalRatings || 0} {ratingsData.stats.totalRatings === 1 ? 'review' : 'reviews'}
                        </Text>
                      </View>
                      
                      <View style={styles.starDistribution}>
                        {[5, 4, 3, 2, 1].map((starLevel) => {
                          const distribution = ratingsData.stats.distribution || {}
                          const count = distribution[starLevel.toString()] || 0
                          const total = ratingsData.stats.totalRatings || 1
                          const percentage = total > 0 ? Math.round((count / total) * 100) : 0
                          return (
                            <View key={starLevel} style={styles.starDistributionRow}>
                              <Text style={styles.starLevelText}>{starLevel} Star</Text>
                              <View style={styles.starDistributionBar}>
                                <View 
                                  style={[
                                    styles.starDistributionBarFill, 
                                    { width: `${percentage}%` }
                                  ]} 
                                />
                              </View>
                              <Text style={styles.starPercentageText}>{percentage}%</Text>
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noRatingsContainer}>
                      <Text style={styles.noRatingsText}>No ratings available yet</Text>
                    </View>
                  )}
                </View>

                {/* Recent Reviews */}
                <View style={styles.recentReviewsSection}>
                  <Text style={styles.recentReviewsTitle}>Recent Reviews</Text>
                  
                  {isLoadingRatings ? (
                    <View style={styles.loadingReviewsContainer}>
                      <ActivityIndicator size="small" color="#6B7280" />
                      <Text style={styles.loadingReviewsText}>Loading reviews...</Text>
                    </View>
                  ) : ratingsData?.ratings && ratingsData.ratings.length > 0 ? (
                    <>
                      {ratingsData.ratings.map((review) => {
                        const userName = review.userId?.name || 'Anonymous'
                        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AN'
                        const reviewDate = review.createdAt ? new Date(review.createdAt) : new Date()
                        const timeAgo = getTimeAgo(reviewDate)
                        
                        return (
                          <View key={review._id} style={styles.reviewCard}>
                            <View style={styles.reviewCardHeader}>
                              <View style={styles.reviewAvatar}>
                                <View style={styles.reviewAvatarContainer}>
                                  <Text style={styles.reviewAvatarText}>{initials}</Text>
                                </View>
                              </View>
                              <View style={styles.reviewCardInfo}>
                                <View style={styles.reviewNameRow}>
                                  <Text style={styles.reviewName}>{userName}</Text>
                                </View>
                                <View style={styles.reviewMetaRow}>
                                  <View style={styles.reviewStars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <MaterialIcons 
                                        key={star} 
                                        name="star" 
                                        size={14} 
                                        color={star <= review.rating ? "#FBBF24" : "#E5E7EB"} 
                                      />
                                    ))}
                                  </View>
                                  <Text style={styles.reviewTimeAgo}>{timeAgo}</Text>
                                </View>
                              </View>
                            </View>
                            {review.review && (
                              <Text style={styles.reviewText}>{review.review}</Text>
                            )}
                          </View>
                        )
                      })}
                      
                      {ratingsData.pagination && ratingsData.pagination.total > ratingsData.ratings.length && (
                        <TouchableOpacity style={styles.loadMoreButton}>
                          <Text style={styles.loadMoreButtonText}>Load More Reviews</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <View style={styles.noReviewsContainer}>
                      <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
        </ScrollView>
      )}

      {/* Floating Action Buttons - Only show for broker's own properties */}
      {!isLoading && property && isPropertyOwner() && (
        <View style={[styles.floatingActionButtons, { bottom: 20 + insets.bottom }]}>
          <TouchableOpacity 
            style={styles.floatingDeleteButton} 
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.floatingEditButton} 
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalContent}>
            <View style={styles.videoModalHeader}>
              <Text style={styles.videoModalTitle}>Property Video</Text>
              <TouchableOpacity 
                onPress={() => setVideoModalVisible(false)}
                style={styles.videoModalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoModalBody}>
              <MaterialIcons name="videocam" size={64} color="#0D542BFF" />
              <Text style={styles.videoModalText}>
                Video will open in your default video player
              </Text>
            </View>
            <View style={styles.videoModalActions}>
              <TouchableOpacity 
                style={styles.videoModalCancelButton}
                onPress={() => setVideoModalVisible(false)}
              >
                <Text style={styles.videoModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.videoModalPlayButton}
                onPress={handleOpenVideo}
              >
                <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                <Text style={styles.videoModalPlayText}>Play Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
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
  
  // Image Section
  imageSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  mainImageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  mainImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
  },
  propertyTypeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
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
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mainImageActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  mainImageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#0D542BFF',
  },
  statusBadgeBlocked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#0D542BFF',
  },
  statusTextBlocked: {
    color: '#EF4444',
  },
  thumbnailContainer: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  thumbnailScroll: {
    gap: 12,
    paddingRight: 0,
  },
  thumbnailWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailWrapperActive: {
    borderColor: '#0D542BFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 84, 43, 0.2)',
  },
  
  // Content Section
  contentSection: {
    padding: 20,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  propertyHeaderLeft: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  propertyAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  propertyPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D542BFF',
  },
  
  // Property Details
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailIcon: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  
  // Property Details Card
  propertyDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  propertyDetailsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  propertyDetailColumn: {
    flex: 1,
    gap: 20,
  },
  propertyDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  propertyDetailContent: {
    flex: 1,
  },
  propertyDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 22,
  },
  propertyDetailsHeader: {
    marginBottom: 20,
  },
  propertyDetailsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  propertyDetailsAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  propertyDetailsAddress: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    flex: 1,
  },
  propertyRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  propertyRatingStars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  propertyRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  propertyRatingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  
  // Nearby Amenities
  amenitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  amenityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  amenityText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#0D542BFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabContentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
  },
  
  // Reviews & Ratings
  reviewsRatingsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  reviewsRatingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewsRatingsTitleLine: {
    width: 4,
    height: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginRight: 8,
  },
  reviewsRatingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  overallRatingSection: {
    flexDirection: 'row',
    gap: 20,
  },
  overallRatingLeft: {
    alignItems: 'flex-start',
    minWidth: 100,
  },
  overallRatingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  overallRatingStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  overallRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reviewsCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  starDistribution: {
    flex: 1,
    gap: 8,
  },
  starDistributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starLevelText: {
    fontSize: 12,
    color: '#6B7280',
    width: 50,
  },
  starDistributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  starDistributionBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  starPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    width: 35,
    textAlign: 'right',
  },
  
  // Recent Reviews
  recentReviewsSection: {
    marginBottom: 24,
  },
  recentReviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  reviewCard: {
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
  reviewCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  reviewAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D542BFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  reviewAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewCardInfo: {
    flex: 1,
  },
  reviewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTimeAgo: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  loadMoreButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingRatingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingRatingsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  noRatingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noRatingsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  loadingReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingReviewsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Key Features and Location Benefits
  featuresRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  featureCardContent: {
    gap: 12,
  },
  featureCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureCardText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  
  // Chips Container
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  emptyStateContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Stats
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Agent Section
  agentSection: {
    marginBottom: 24,
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  agentAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D542BFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  agentAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  agentAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  agentCompany: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  agentRole: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  chatNowButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  chatNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Inspection Times
  inspectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inspectionSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  inspectionSlotLast: {
    borderBottomWidth: 0,
  },
  inspectionSlotInfo: {
    flex: 1,
  },
  inspectionDay: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  inspectionTime: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
  },
  inspectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  inspectionStatusPast: {
    backgroundColor: '#6B7280' + '20',
  },
  inspectionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  bookInspectionButton: {
    backgroundColor: '#0D542BFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  bookInspectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Floating Action Buttons
  floatingActionButtons: {
    position: 'absolute',
    right: 20,
    flexDirection: 'column-reverse',
    gap: 12,
    zIndex: 1000,
  },
  floatingEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D542BFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Video Styles
  videoContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  videoPlayButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoThumbnailIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  videoThumbnailPlayIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  videoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  videoModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalBody: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  videoModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  videoModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  videoModalPlayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0D542BFF',
    gap: 8,
  },
  videoModalPlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default PropertyDetailsScreen
