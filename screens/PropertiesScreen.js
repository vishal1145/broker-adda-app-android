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
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
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

  const PropertyCard = ({ property }) => {
    const hasImages = property.images && property.images.length > 0
    
    return (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetails', { property })}
      activeOpacity={0.8}
    >
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
        <View style={styles.propertyOverlay}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) + '20' }]}>
            <MaterialIcons name="circle" size={8} color={getStatusColor(property.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
              {property.status.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton}>
            <MaterialIcons name="favorite-border" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.propertyContent}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.propertyPrice}>{property.price}</Text>
        </View>
        
        <View style={styles.propertyAddress}>
          <MaterialIcons name="location-on" size={16} color="#6B7280" />
          <Text style={styles.addressText}>{property.address}</Text>
        </View>

        <View style={styles.propertyDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="bed" size={16} color="#0D542BFF" />
            <Text style={styles.detailText}>{property.bedrooms} beds</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="bathtub" size={16} color="#0D542BFF" />
            <Text style={styles.detailText}>{property.bathrooms} baths</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="square-foot" size={16} color="#0D542BFF" />
            <Text style={styles.detailText}>{property.sqft} sqft</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name={getTypeIcon(property.type)} size={16} color="#0D542BFF" />
            <Text style={styles.detailText}>{property.type}</Text>
          </View>
        </View>

        <View style={styles.propertyFeatures}>
          {property.features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.propertyStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={16} color="#6B7280" />
            <Text style={styles.statText}>{property.views} views</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="favorite" size={16} color="#6B7280" />
            <Text style={styles.statText}>{property.favorites} favorites</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.statText}>{property.listedDate}</Text>
          </View>
        </View>

        <View style={styles.propertyFooter}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation()
              navigation.navigate('PropertyDetails', { property })
            }}
          >
            <MaterialIcons name="visibility" size={18} color="#0D542BFF" />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation()
              navigation.navigate('CreateProperty', { property })
            }}
          >
            <MaterialIcons name="edit" size={18} color="#0D542BFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="share" size={18} color="#0D542BFF" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
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
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="home" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{propertiesData.length}</Text>
                <Text style={styles.statLabel}>Total Properties</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="visibility" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{propertiesData.reduce((sum, prop) => sum + prop.views, 0)}</Text>
                <Text style={styles.statLabel}>Total Views</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="favorite" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{propertiesData.reduce((sum, prop) => sum + prop.favorites, 0)}</Text>
                <Text style={styles.statLabel}>Total Favorites</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{propertiesData.filter(prop => prop.status === 'active').length}</Text>
                <Text style={styles.statLabel}>Active Listings</Text>
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

        {/* Properties List */}
        <View style={styles.propertiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Properties ({filteredProperties.length})</Text>
            <TouchableOpacity style={styles.sortButton}>
              <MaterialIcons name="sort" size={20} color="#0D542BFF" />
              <Text style={styles.sortText}>Sort</Text>
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  propertyImageContainer: {
    position: 'relative',
    height: 200,
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
    fontSize: 14,
    color: '#9CA3AF',
  },
  propertyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyContent: {
    padding: 20,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D542BFF',
  },
  propertyAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  propertyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  propertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  featureTag: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  propertyFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D542BFF',
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
