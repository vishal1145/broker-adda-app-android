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
  RefreshControl,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { propertiesAPI } from '../services/api'
import { storage } from '../services/storage'

const { width } = Dimensions.get('window')

const PropertiesScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [propertiesData, setPropertiesData] = useState([])
  const [brokerId, setBrokerId] = useState(null)
  const [token, setToken] = useState(null)
  const [selectedType, setSelectedType] = useState('All Types')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedDate, setSelectedDate] = useState('Date')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  const typeOptions = ['All Types', 'House', 'Condo', 'Apartment', 'Villa', 'Townhouse']
  const statusOptions = ['All Status', 'Approved', 'Pending', 'Rejected', 'Active', 'Sold']
  const dateOptions = ['Date', 'Newest First', 'Oldest First', 'Price: Low to High', 'Price: High to Low']
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Transform API data to match screen expectations
  const transformPropertyData = (apiProperties) => {
    return apiProperties.map(prop => ({
      id: prop._id,
      title: prop.title,
      address: prop.address ? `${prop.address}, ${prop.city}` : prop.city,
      price: prop.priceUnit === 'INR' ? `₹${prop.price?.toLocaleString()}` : `$${prop.price?.toLocaleString()}`,
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      sqft: prop.propertySize || 0,
      type: prop.propertyType || 'Property',
      status: prop.status?.toLowerCase().replace(' ', '_') || 'active',
      images: prop.images?.filter(img => img && img !== '') || [],
      features: prop.features || [],
      description: prop.description || prop.propertyDescription || '',
      agent: prop.broker?.name || 'Agent',
      listedDate: prop.createdAt ? new Date(prop.createdAt).toISOString().split('T')[0] : '',
      views: prop.viewsCount || 0,
      favorites: 0,
      amenities: prop.amenities || [],
      nearbyAmenities: prop.nearbyAmenities || [],
      locationBenefits: prop.locationBenefits || []
    }))
  }

  // Fetch properties from API
  const fetchProperties = async (page = 1, refresh = false) => {
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

      const response = await propertiesAPI.getProperties(userId, token, page, pagination.limit, selectedFilter)
      
      if (response.success && response.data) {
        const transformedData = transformPropertyData(response.data)
        
        setPropertiesData(transformedData)

        // Update pagination state
        setPagination({
          page: response.pagination?.page || page,
          limit: response.pagination?.limit || pagination.limit,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0,
          hasNextPage: response.pagination?.hasNextPage || false,
          hasPrevPage: response.pagination?.hasPrevPage || false
        })
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      Alert.alert('Error', 'Failed to fetch properties. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    setPropertiesData([])
    setPagination({
      page: 1,
      limit: 5,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    })
    fetchProperties(1, false)
  }, [])

  // Refresh when filter changes
  useEffect(() => {
    setPropertiesData([])
    setPagination({
      page: 1,
      limit: 5,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    })
    fetchProperties(1, false)
  }, [selectedFilter])

  // Handle pull to refresh
  const onRefresh = async () => {
    await fetchProperties(1, true)
  }

  // Load more properties
  const loadMoreProperties = async () => {
    if (pagination.hasNextPage && !loading) {
      await fetchProperties(pagination.page + 1, false)
    }
  }

  // Load previous properties
  const loadPrevProperties = async () => {
    if (pagination.hasPrevPage && !loading) {
      await fetchProperties(pagination.page - 1, false)
    }
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

  const hasParking = (property) => {
    // Check if property has parking in features, amenities, or other fields
    const parkingKeywords = ['parking', 'garage', 'driveway']
    const allText = [
      ...(property.features || []),
      ...(property.amenities || []),
      ...(property.description || '').toLowerCase()
    ].join(' ').toLowerCase()
    
    return parkingKeywords.some(keyword => allText.includes(keyword))
  }

  const PropertyCard = ({ property }) => {
    const hasImages = property.images && property.images.length > 0
    const statusBgColor = getStatusBackgroundColor(property.status)
    const statusTextColor = getStatusTextColor(property.status)
    const parkingAvailable = hasParking(property)
    
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
            <MaterialIcons 
              name={parkingAvailable ? "directions-car" : "block"} 
              size={16} 
              color="#6B7280" 
            />
            <Text style={styles.featureText}>
              {parkingAvailable ? "Parking" : "No Parking"}
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="visibility" size={16} color="#6B7280" />
            <Text style={styles.featureText}>{property.views || 0} Views</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Show loading state
  if (loading && propertiesData.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D542BFF" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
              <Text style={styles.headerTitle}>Properties</Text>
              <Text style={styles.headerSubtitle}>Manage your property listings</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.navigate('CreateProperty')}
              >
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {/* Total Properties - Light Green */}
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="home" size={22} color="#10B981" />
                  <Text style={styles.statCount}>{propertiesData.length}</Text>
                </View>
                <Text style={styles.statTitle}>Total Properties</Text>
              </View>
            </View>
            
            {/* Approved - White */}
            <View style={[styles.statCard, styles.statCardWhite]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="check-circle" size={22} color="#10B981" />
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

        {/* Filter Section Above Property Listings */}
        <View style={styles.newFilterSection}>
          <TouchableOpacity 
            style={styles.filterDropdown}
            onPress={() => setShowTypeDropdown(true)}
          >
            <Text style={styles.filterDropdownText}>{selectedType}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterDropdown}
            onPress={() => setShowStatusDropdown(true)}
          >
            <Text style={styles.filterDropdownText}>{selectedStatus}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterDropdown}
            onPress={() => setShowDateDropdown(true)}
          >
            <Text style={styles.filterDropdownText}>{selectedDate}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Type Dropdown Modal */}
        <Modal
          visible={showTypeDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTypeDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTypeDropdown(false)}
          >
            <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
              {typeOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownOption,
                    selectedType === option && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedType(option)
                    setShowTypeDropdown(false)
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedType === option && styles.dropdownOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedType === option && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Status Dropdown Modal */}
        <Modal
          visible={showStatusDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStatusDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStatusDropdown(false)}
          >
            <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
              {statusOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownOption,
                    selectedStatus === option && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedStatus(option)
                    setShowStatusDropdown(false)
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedStatus === option && styles.dropdownOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedStatus === option && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Date Dropdown Modal */}
        <Modal
          visible={showDateDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDateDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDateDropdown(false)}
          >
            <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
              {dateOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownOption,
                    selectedDate === option && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedDate(option)
                    setShowDateDropdown(false)
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedDate === option && styles.dropdownOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedDate === option && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Properties List */}
        <View style={styles.propertiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Property Listings</Text>
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
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
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

          {/* Pagination Controls */}
          {!loading && filteredProperties.length > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.paginationButton, !pagination.hasPrevPage && styles.paginationButtonDisabled]}
                onPress={() => {
                  if (pagination.hasPrevPage) {
                    loadPrevProperties()
                  }
                }}
                disabled={!pagination.hasPrevPage}
              >
                <MaterialIcons name="chevron-left" size={20} color={pagination.hasPrevPage ? "#0D542BFF" : "#9CA3AF"} />
                <Text style={[styles.paginationButtonText, !pagination.hasPrevPage && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  Page {pagination.page} of {pagination.totalPages}
                </Text>
                <Text style={styles.paginationCount}>
                  {filteredProperties.length} of {pagination.total} properties
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.paginationButton, !pagination.hasNextPage && styles.paginationButtonDisabled]}
                onPress={() => {
                  if (pagination.hasNextPage) {
                    loadMoreProperties()
                  }
                }}
                disabled={!pagination.hasNextPage}
              >
                <Text style={[styles.paginationButtonText, !pagination.hasNextPage && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={pagination.hasNextPage ? "#0D542BFF" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>
          )}
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

  // New Filter Section
  newFilterSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 0,
    gap: 12,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width - 80,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0FDFA',
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#0D542BFF',
  },

  // Properties Section
  propertiesSection: {
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
    color: '#0D542BFF',
    marginLeft: 4,
  },

  // Property Card Styles
  propertyCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
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

  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 0,
    marginTop: 16,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D542BFF',
    marginHorizontal: 4,
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paginationCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
})

export default PropertiesScreen
