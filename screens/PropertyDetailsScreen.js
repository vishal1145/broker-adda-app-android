import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Image,
  Share,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { propertiesAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'

const { width } = Dimensions.get('window')

const PropertyDetailsScreen = ({ navigation, route }) => {
  const { property: initialProperty } = route.params || {}
  
  const [property, setProperty] = useState(initialProperty)
  const [isLoading, setIsLoading] = useState(!initialProperty)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [relatedProperties, setRelatedProperties] = useState([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [currentBrokerId, setCurrentBrokerId] = useState(null)
  const scrollViewRef = useRef(null)

  // Transform API data to match screen expectations
  const transformPropertyData = (apiProperty) => {
    if (!apiProperty) return null
    
    return {
      id: apiProperty._id,
      title: apiProperty.title,
      address: apiProperty.address ? `${apiProperty.address}, ${apiProperty.city}` : apiProperty.city,
      price: apiProperty.priceUnit === 'INR' ? `₹${apiProperty.price?.toLocaleString()}` : `$${apiProperty.price?.toLocaleString()}`,
      priceRaw: apiProperty.price || 0, // Raw numeric price for editing
      bedrooms: apiProperty.bedrooms || 0,
      bathrooms: apiProperty.bathrooms || 0,
      sqft: apiProperty.propertySize || 0,
      furnishing: apiProperty.furnishing || 'Not Specified',
      type: apiProperty.propertyType || 'Property',
      subType: apiProperty.subType || '',
      status: apiProperty.status || 'Pending Approval', // Original status for editing
      statusDisplay: apiProperty.status?.toLowerCase().replace(' ', '_') || 'active', // Normalized status for display
      images: apiProperty.images?.filter(img => img && img !== '') || [],
      features: apiProperty.features || [],
      description: apiProperty.description || apiProperty.propertyDescription || '',
      propertyDescription: apiProperty.propertyDescription || apiProperty.description || '',
      agent: apiProperty.broker?.name || 'Agent',
      agentCompany: apiProperty.broker?.firmName || '',
      agentRole: 'Expert Broker',
      agentLocation: apiProperty.city || '',
      brokerImage: apiProperty.broker?.brokerImage || null,
      brokerId: apiProperty.broker?._id || null, // Store broker ID for ownership check
      listedDate: apiProperty.createdAt ? new Date(apiProperty.createdAt).toISOString().split('T')[0] : '',
      views: apiProperty.viewsCount || 0,
      favorites: 0,
      amenities: apiProperty.amenities || [],
      nearbyAmenities: apiProperty.nearbyAmenities || [],
      locationBenefits: apiProperty.locationBenefits || [],
      facingDirection: apiProperty.facingDirection || '',
      possessionStatus: apiProperty.possessionStatus || '',
      propertyAgeYears: apiProperty.propertyAgeYears || 0,
      region: apiProperty.region || {},
      videos: apiProperty.videos || [],
      notes: apiProperty.notes || '',
      priceUnit: apiProperty.priceUnit || 'INR' // Include priceUnit for editing
    }
  }

  // Transform array of properties (for related properties)
  const transformPropertiesArray = (apiProperties) => {
    if (!Array.isArray(apiProperties)) return []
    return apiProperties.map(prop => transformPropertyData(prop)).filter(prop => prop !== null)
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

  // Fetch related properties (all properties excluding current)
  const fetchRelatedProperties = async () => {
    try {
      setIsLoadingRelated(true)
      
      const token = await storage.getToken()
      
      if (!token) {
        setIsLoadingRelated(false)
        return
      }

      // Fetch all properties from the API endpoint
      const response = await propertiesAPI.getAllProperties(token)
      
      if (response.success && response.data && Array.isArray(response.data)) {
        // Transform the data array
        const transformedData = transformPropertiesArray(response.data)
        
        // Get current property ID (handle both _id and id formats)
        const currentPropertyId = property?.id || property?._id || initialProperty?.id || initialProperty?._id
        
        // Filter out current property
        const filtered = transformedData.filter(prop => {
          const propId = prop.id || prop._id
          const currentId = currentPropertyId?.toString()
          return propId?.toString() !== currentId
        })
        
        setRelatedProperties(filtered)
      }
    } catch (error) {
      console.error('Error fetching related properties:', error)
      // Set empty array on error to show empty state
      setRelatedProperties([])
    } finally {
      setIsLoadingRelated(false)
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

  // Fetch related properties when property is loaded
  useEffect(() => {
    if (property && (property.id || property._id)) {
      fetchRelatedProperties()
    }
  }, [property])

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
    setCurrentImageIndex(index)
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

  // Show loading state
  if (isLoading || !property) {
    return (
      <SafeAreaView style={styles.wrapper} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D542BFF" />
            <Text style={styles.loadingText}>Loading property details...</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Property Card Component - Matching PropertiesScreen design
  const PropertyCard = ({ property }) => {
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

    const hasImages = property.images && property.images.length > 0
    const statusBgColor = getStatusBackgroundColor(property.status)
    const statusTextColor = getStatusTextColor(property.status)

    return (
      <TouchableOpacity 
        style={styles.propertyCard}
        onPress={() => navigation.navigate('PropertyDetails', { property })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopSection}>
          {/* Property Image - Left Side */}
          <View style={styles.propertyImageContainer}>
            {hasImages ? (
              <Image 
                source={{ uri: property.images[0] }} 
                style={styles.propertyImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.propertyImagePlaceholder}>
                <MaterialIcons name="home" size={48} color="#D1D5DB" />
                <Text style={styles.placeholderText}>No Image</Text>
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
    )
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
        {/* Header */}
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

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Images */}
        <View style={styles.imageSection}>
          {/* Fixed Main Image */}
          <View style={styles.mainImageContainer}>
            <Image 
              source={{ uri: property.images?.[currentImageIndex] || property.images?.[0] }} 
              style={styles.mainImage}
              resizeMode="cover"
            />
            
            {/* Featured Badge */}
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>

          </View>

          {/* Scrollable Thumbnail Row */}
          {property.images?.length > 1 && (
            <View style={styles.thumbnailContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailScroll}
              >
                {property.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnailWrapper,
                      index === currentImageIndex && styles.thumbnailWrapperActive
                    ]}
                    onPress={() => handleThumbnailPress(index)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: image }} 
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
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
                  <MaterialIcons name="bed" size={20} color="#0D542BFF" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Bedrooms</Text>
                    <Text style={styles.propertyDetailValue}>{property.bedrooms} BHK</Text>
                  </View>
                </View>
                <View style={styles.propertyDetailItem}>
                  <MaterialIcons name="schedule" size={20} color="#0D542BFF" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Listed</Text>
                    <Text style={styles.propertyDetailValue}>{property.listedDate || '3 days ago'}</Text>
                  </View>
                </View>
              </View>

              {/* Right Column */}
              <View style={styles.propertyDetailColumn}>
                <View style={styles.propertyDetailItem}>
                  <MaterialIcons name="square-foot" size={20} color="#0D542BFF" />
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
                  <MaterialIcons name="attach-money" size={20} color="#0D542BFF" />
                  <View style={styles.propertyDetailContent}>
                    <Text style={styles.propertyDetailLabel}>Price</Text>
                    <Text style={styles.propertyDetailValue}>{property.price}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Inquiry Button */}
            <TouchableOpacity 
              style={styles.inquiryButton}
              onPress={() => console.log('Inquiry pressed')}
            >
              <Text style={styles.inquiryButtonText}>Inquiry</Text>
              <MaterialIcons name="chat-bubble-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
                <Text style={styles.emptyText}>No property amenities listed</Text>
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
                <Text style={styles.emptyText}>No nearby amenities listed</Text>
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
                <Text style={styles.emptyText}>No key features listed</Text>
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
                <Text style={styles.emptyText}>No location benefits listed</Text>
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
                <Text style={styles.tabContentText}>
                  {property.description || 'No description available'}
                </Text>
              </View>
            ) : (
              <>
                {/* Reviews & Ratings */}
                <View style={styles.reviewsRatingsCard}>
                  <View style={styles.reviewsRatingsHeader}>
                    <View style={styles.reviewsRatingsTitleLine} />
                    <Text style={styles.reviewsRatingsTitle}>Reviews & Ratings</Text>
                  </View>
                  
                  <View style={styles.overallRatingSection}>
                    <View style={styles.overallRatingLeft}>
                      <Text style={styles.overallRatingNumber}>4.7</Text>
                      <View style={styles.overallRatingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialIcons key={star} name="star" size={20} color="#FBBF24" />
                        ))}
                      </View>
                      <Text style={styles.overallRatingText}>Excellent</Text>
                      <Text style={styles.reviewsCount}>Based on 245 reviews</Text>
                    </View>
                    
                    <View style={styles.starDistribution}>
                      {[5, 4, 3, 2, 1].map((starLevel) => {
                        const percentages = { 5: 90, 4: 60, 3: 25, 2: 10, 1: 5 }
                        return (
                          <View key={starLevel} style={styles.starDistributionRow}>
                            <Text style={styles.starLevelText}>{starLevel} Star</Text>
                            <View style={styles.starDistributionBar}>
                              <View 
                                style={[
                                  styles.starDistributionBarFill, 
                                  { width: `${percentages[starLevel]}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.starPercentageText}>{percentages[starLevel]}%</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                </View>

                {/* Recent Reviews */}
                <View style={styles.recentReviewsSection}>
                  <Text style={styles.recentReviewsTitle}>Recent Reviews</Text>
                  
                  {[
                    {
                      id: 1,
                      name: 'Rajesh Kumar',
                      initials: 'RK',
                      verified: true,
                      rating: 5,
                      timeAgo: '2 days ago',
                      review: 'Excellent property with great amenities. The location is perfect with metro connectivity. Highly recommended!'
                    },
                    {
                      id: 2,
                      name: 'Priya Sharma',
                      initials: 'PS',
                      verified: true,
                      rating: 5,
                      timeAgo: '1 week ago',
                      review: 'Good property overall. The maintenance is well taken care of. Only minor issue is the parking space.'
                    },
                    {
                      id: 3,
                      name: 'Amit Singh',
                      initials: 'AS',
                      verified: false,
                      rating: 5,
                      timeAgo: '2 weeks ago',
                      review: 'Amazing property! The view from the balcony is breathtaking. The builder has maintained high quality standards.'
                    }
                  ].map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewCardHeader}>
                        <View style={styles.reviewAvatar}>
                          <View style={styles.reviewAvatarContainer}>
                            <Text style={styles.reviewAvatarText}>{review.initials}</Text>
                          </View>
                        </View>
                        <View style={styles.reviewCardInfo}>
                          <View style={styles.reviewNameRow}>
                            <Text style={styles.reviewName}>{review.name}</Text>
                            {review.verified && (
                              <View style={[styles.verifiedBadge, { backgroundColor: '#10B981' + '20' }]}>
                                <MaterialIcons name="circle" size={8} color="#10B981" />
                                <Text style={[styles.verifiedBadgeText, { color: '#10B981' }]}>Verified</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.reviewMetaRow}>
                            <View style={styles.reviewStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <MaterialIcons 
                                  key={star} 
                                  name="star" 
                                  size={14} 
                                  color="#FBBF24" 
                                />
                              ))}
                            </View>
                            <Text style={styles.reviewTimeAgo}>{review.timeAgo}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.review}</Text>
                    </View>
                  ))}
                  
                  <TouchableOpacity style={styles.loadMoreButton}>
                    <Text style={styles.loadMoreButtonText}>Load More Reviews</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Agent Details */}
          <View style={styles.agentSection}>
            <Text style={styles.sectionTitle}>Agent Details</Text>
            <View style={styles.agentCard}>
              <View style={styles.agentCardContent}>
                <View style={styles.agentAvatar}>
                  {property.brokerImage ? (
                    <Image 
                      source={{ uri: property.brokerImage }} 
                      style={styles.agentAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.agentAvatarContainer}>
                      <Text style={styles.agentAvatarText}>
                        {property.agent ? property.agent.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{property.agent || 'Rajesh Kumar'}</Text>
                  <Text style={styles.agentCompany}>{property.agentCompany || 'Rajesh Realty Solutions'}</Text>
                  <Text style={styles.agentRole}>
                    {property.agentRole || 'Expert Broker'} • {property.agentLocation || 'Noida'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.chatNowButton} onPress={() => console.log('Chat Now')}>
                <Text style={styles.chatNowButtonText}>Chat Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Inspection Times */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspection Times</Text>
            <View style={styles.inspectionCard}>
              {[
                { day: 'Saturday', time: '10:00 AM to 11:00 AM', status: 'Available' },
                { day: 'Sunday', time: '02:00 PM to 03:00 PM', status: 'Available' },
                { day: 'Monday', time: '09:00 AM to 10:00 AM', status: 'Past' },
              ].map((slot, index, array) => (
                <View 
                  key={index} 
                  style={[
                    styles.inspectionSlot,
                    index === array.length - 1 && styles.inspectionSlotLast
                  ]}
                >
                  <View style={styles.inspectionSlotInfo}>
                    <Text style={styles.inspectionDay}>{slot.day}</Text>
                    <Text style={styles.inspectionTime}>{slot.time}</Text>
                  </View>
                  <View style={[
                    styles.inspectionStatus,
                    slot.status === 'Past' && styles.inspectionStatusPast
                  ]}>
                    <Text style={[
                      styles.inspectionStatusText,
                      slot.status === 'Past' && { color: getStatusColor('sold') }
                    ]}>
                      {slot.status}
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.bookInspectionButton}>
                <Text style={styles.bookInspectionButtonText}>Book Inspection</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Related Properties */}
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>Related Properties</Text>
            {isLoadingRelated ? (
              <View style={styles.loadingRelatedContainer}>
                <ActivityIndicator size="small" color="#0D542BFF" />
                <Text style={styles.loadingRelatedText}>Loading properties...</Text>
              </View>
            ) : relatedProperties.length === 0 ? (
              <View style={styles.emptyRelatedContainer}>
                <Text style={styles.emptyRelatedText}>No other properties available</Text>
              </View>
            ) : (
              <FlatList
                data={relatedProperties}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => (item.id || item._id).toString()}
                renderItem={({ item }) => (
                  <View style={styles.propertyCardWrapper}>
                    <PropertyCard property={item} />
                  </View>
                )}
                contentContainerStyle={styles.relatedPropertiesList}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              />
            )}
          </View>

          {/* Action Buttons - Only show for broker's own properties */}
          {isPropertyOwner() && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Property</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <MaterialIcons name="delete" size={20} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  header: {
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
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  propertyDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  propertyDetailsHeader: {
    marginBottom: 20,
  },
  propertyDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  propertyDetailsAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  propertyDetailsAddress: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  inquiryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  inquiryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#0D542BFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  inspectionTime: {
    fontSize: 14,
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
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  
  // Related Properties - Matching PropertiesScreen style
  relatedSection: {
    marginBottom: 24,
  },
  relatedPropertiesList: {
    paddingVertical: 8,
  },
  propertyCardWrapper: {
    width: width - 80,
  },
  loadingRelatedContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRelatedText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyRelatedContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRelatedText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Property Card Styles - Matching PropertiesScreen
  propertyCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
    marginBottom: 0,
  },
  propertyImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
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
})

export default PropertyDetailsScreen
