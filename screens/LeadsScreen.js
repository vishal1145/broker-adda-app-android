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
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { leadsAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'

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
          style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#009689', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}
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

const LeadsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  // API state management
  const [leadsData, setLeadsData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [deletingLeadId, setDeletingLeadId] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  // API functions
  const fetchLeads = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      if (!userId) {
        throw new Error('No user ID found')
      }

      const response = await leadsAPI.getLeads(page, pagination.limit, token, userId)
      
      if (response.success && response.data) {
        const mappedLeads = response.data.items.map(lead => ({
          id: lead._id,
          name: lead.customerName,
          email: lead.customerEmail,
          phone: lead.customerPhone,
          requirement: lead.requirement,
          propertyType: lead.propertyType,
          budget: lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified',
          region: lead.primaryRegion?.name || lead.region?.name || 'Not specified',
          status: lead.status.toLowerCase().replace(' ', '-'),
          priority: 'medium', // Default priority as not in API
          source: 'API', // Default source as not in API
          createdDate: lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : 'Unknown',
          lastContact: lead.updatedAt ? new Date(lead.updatedAt).toISOString().split('T')[0] : 'Unknown',
          notes: lead.notes || '',
          avatar: lead.createdBy?.brokerImage || null,
          sharedWith: lead.transfers?.filter(t => t.toBroker).map(t => ({
            id: t.toBroker._id,
            name: t.toBroker.name,
            avatar: t.toBroker.brokerImage
          })) || [],
          additionalShared: Math.max(0, (lead.transfers?.length || 0) - 3)
        }))

        if (refresh) {
          setLeadsData(mappedLeads)
        } else {
          setLeadsData(mappedLeads)
        }

        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
          hasNextPage: response.data.hasNextPage,
          hasPrevPage: response.data.hasPrevPage
        })
      } else {
        throw new Error(response.message || 'Failed to fetch leads')
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
      setError(err.message || 'Failed to fetch leads')
      Snackbar.showError('Error', err.message || 'Failed to fetch leads')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Delete lead function
  const deleteLead = async (leadId, leadName) => {
    try {
      setDeletingLeadId(leadId)
      const token = await storage.getToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.deleteLead(leadId, token)
      
      if (response.success) {
        // Refresh the leads list from server
        await fetchLeads(pagination.page, false)
        
        Snackbar.showSuccess('Success', response.message || 'Lead deleted successfully')
      } else {
        throw new Error(response.message || 'Failed to delete lead')
      }
    } catch (err) {
      console.error('Error deleting lead:', err)
      Snackbar.showError('Error', err.message || 'Failed to delete lead')
    } finally {
      setDeletingLeadId(null)
    }
  }

  // Handle delete confirmation
  const handleDeletePress = (leadId, leadName) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete "${leadName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLead(leadId, leadName)
        }
      ]
    )
  }

  // Load leads on component mount
  useEffect(() => {
    fetchLeads(1)
  }, [])

  const filterOptions = [
    { key: 'all', label: 'All Leads', count: leadsData.length },
    { key: 'new', label: 'New', count: leadsData.filter(lead => lead.status === 'new').length },
    { key: 'assigned', label: 'Assigned', count: leadsData.filter(lead => lead.status === 'assigned').length },
    { key: 'qualified', label: 'Qualified', count: leadsData.filter(lead => lead.status === 'qualified').length },
    { key: 'closed', label: 'Closed', count: leadsData.filter(lead => lead.status === 'closed').length }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3B82F6'
      case 'assigned': return '#F59E0B'
      case 'in-progress': return '#F59E0B'
      case 'qualified': return '#10B981'
      case 'closed': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return 'fiber-new'
      case 'in-progress': return 'trending-up'
      case 'qualified': return 'check-circle'
      case 'closed': return 'done'
      default: return 'help'
    }
  }

  const filteredLeads = selectedFilter === 'all' 
    ? leadsData 
    : leadsData.filter(lead => lead.status === selectedFilter)

  const LeadCard = ({ lead }) => {
    const [pressedButton, setPressedButton] = useState(null)
    const isDeleting = deletingLeadId === lead.id

    const getActionButtonStyle = (buttonType) => {
      const isPressed = pressedButton === buttonType
      return [
        styles.actionButton,
        isPressed && styles.actionButtonPressed
      ]
    }

    const getActionButtonTextStyle = (buttonType) => {
      const isPressed = pressedButton === buttonType
      return [
        styles.actionButtonText,
        isPressed && styles.actionButtonTextPressed
      ]
    }

    const getActionIconColor = (buttonType) => {
      const isPressed = pressedButton === buttonType
      return isPressed ? '#009689' : '#9E9E9E'
    }

    return (
      <View style={styles.leadCard}>
        {/* Header Section */}
        <View style={styles.leadHeader}>
          <View style={styles.leadAvatarContainer}>
            <View style={styles.leadAvatar}>
              {lead.avatar ? (
                <SafeImage
                  source={{ uri: getSecureImageUrl(lead.avatar) }}
                  style={styles.leadAvatarImage}
                  imageType="lead-avatar"
                  fallbackText={lead.name.split(' ').map(n => n[0]).join('')}
                />
              ) : (
                <Text style={styles.leadAvatarText}>{lead.name.split(' ').map(n => n[0]).join('')}</Text>
              )}
            </View>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{lead.name}</Text>
            <Text style={styles.leadEmail}>{lead.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
            <Text style={styles.statusText}>
              {lead.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Lead Details Section */}
        <View style={styles.leadDetailsGrid}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="trending-up" size={16} color="#009689" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>REQUIREMENT</Text>
                <Text style={styles.detailValue}>{lead.requirement}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="home" size={16} color="#009689" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>PROPERTY TYPE</Text>
                <Text style={styles.detailValue}>{lead.propertyType}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={16} color="#009689" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>BUDGET</Text>
                <Text style={styles.detailValue}>{lead.budget}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={16} color="#009689" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>REGION(S)</Text>
                <Text style={styles.detailValue}>{lead.region}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Shared With and Actions Section */}
        <View style={styles.bottomSection}>
          <View style={styles.sharedWithSection}>
            <Text style={styles.sharedWithLabel}>SHARED WITH</Text>
            <View style={styles.sharedAvatars}>
              {lead.sharedWith.slice(0, 3).map((person, index) => (
                <View key={person.id} style={[styles.sharedAvatar, { marginLeft: index > 0 ? -8 : 0 }]}>
                  {person.avatar ? (
                    <SafeImage
                      source={{ uri: getSecureImageUrl(person.avatar) }}
                      style={styles.sharedAvatarImage}
                      imageType="shared-avatar"
                      fallbackText={person.name.split(' ').map(n => n[0]).join('')}
                    />
                  ) : (
                    <Text style={styles.sharedAvatarText}>{person.name.split(' ').map(n => n[0]).join('')}</Text>
                  )}
                </View>
              ))}
              {lead.additionalShared > 0 && (
                <View style={[styles.sharedAvatar, styles.additionalAvatar, { marginLeft: -8 }]}>
                  <Text style={styles.additionalText}>+{lead.additionalShared}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={getActionButtonStyle('view')}
              onPressIn={() => setPressedButton('view')}
              onPressOut={() => setPressedButton(null)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="visibility" size={18} color={getActionIconColor('view')} />
              <Text style={getActionButtonTextStyle('view')}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={getActionButtonStyle('share')}
              onPressIn={() => setPressedButton('share')}
              onPressOut={() => setPressedButton(null)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="send" size={18} color={getActionIconColor('share')} />
              <Text style={getActionButtonTextStyle('share')}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={getActionButtonStyle('delete')}
              onPressIn={() => setPressedButton('delete')}
              onPressOut={() => setPressedButton(null)}
              onPress={() => handleDeletePress(lead.id, lead.name)}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <MaterialIcons name="delete" size={18} color={getActionIconColor('delete')} />
              )}
              <Text style={getActionButtonTextStyle('delete')}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchLeads(1, true)}
            colors={['#009689']}
            tintColor="#009689"
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
              <Text style={styles.headerTitle}>Leads Management</Text>
              <Text style={styles.headerSubtitle}>Track and manage your leads</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
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
                <MaterialIcons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.statValue}>{leadsData.length}</Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.statValue}>8</Text>
                <Text style={styles.statLabel}>Share with me</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Share by me</Text>
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

        {/* Leads List */}
        <View style={styles.leadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leads ({filteredLeads.length})</Text>
            <TouchableOpacity style={styles.sortButton}>
              <MaterialIcons name="sort" size={20} color="#009689" />
              <Text style={styles.sortText}>Sort</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#009689" />
              <Text style={styles.loadingText}>Loading leads...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#EF4444" />
              <Text style={styles.errorTitle}>Failed to Load Leads</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchLeads(1)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredLeads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inbox" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptyMessage}>
                {selectedFilter === 'all' 
                  ? 'No leads available at the moment' 
                  : `No ${selectedFilter} leads found`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredLeads}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <LeadCard lead={item} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && filteredLeads.length > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.paginationButton, !pagination.hasPrevPage && styles.paginationButtonDisabled]}
                onPress={() => pagination.hasPrevPage && fetchLeads(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <MaterialIcons name="chevron-left" size={20} color={pagination.hasPrevPage ? "#009689" : "#9CA3AF"} />
                <Text style={[styles.paginationButtonText, !pagination.hasPrevPage && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  Page {pagination.page} of {pagination.totalPages}
                </Text>
                <Text style={styles.paginationCount}>
                  {filteredLeads.length} of {pagination.total} leads
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.paginationButton, !pagination.hasNextPage && styles.paginationButtonDisabled]}
                onPress={() => pagination.hasNextPage && fetchLeads(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                <Text style={[styles.paginationButtonText, !pagination.hasNextPage && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={pagination.hasNextPage ? "#009689" : "#9CA3AF"} />
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

  // Header Styles
  modernHeader: {
    backgroundColor: '#009689',
    paddingTop: 40,
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
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 90,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
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
    backgroundColor: '#009689',
    borderColor: '#009689',
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

  // Leads Section
  leadsSection: {
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
    color: '#009689',
    marginLeft: 4,
  },

  // Lead Card Styles
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadAvatarContainer: {
    marginRight: 12,
  },
  leadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  leadAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  leadEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leadDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailRow: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sharedWithSection: {
    flex: 1,
  },
  sharedWithLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  sharedAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sharedAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sharedAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  additionalAvatar: {
    backgroundColor: '#F59E0B',
  },
  additionalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionButtonPressed: {
    backgroundColor: '#F0FDFA',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  actionButtonTextPressed: {
    color: '#009689',
  },

  // Loading, Error, and Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#009689',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    color: '#009689',
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

export default LeadsScreen
