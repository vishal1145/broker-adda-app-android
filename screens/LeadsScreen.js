import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
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
  Alert,
  TextInput,
  Modal,
  Platform,
  Keyboard
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { leadsAPI, authAPI, notificationsAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'

const { width } = Dimensions.get('window')

// Custom Slider Component
const CustomSlider = ({ value, onValueChange, min = 0, max = 10000000, step = 100000 }) => {
  const [sliderWidth, setSliderWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100
  const sliderPosition = ((sliderWidth) * percentage) / 100

  const handleSliderPress = (evt) => {
    if (sliderWidth === 0) return
    
    const newPosition = Math.max(0, Math.min(sliderWidth, evt.nativeEvent.locationX))
    const newPercentage = (newPosition / sliderWidth) * 100
    const newValue = Math.round((newPercentage / 100) * (max - min) + min)
    const steppedValue = Math.round(newValue / step) * step
    onValueChange(steppedValue)
  }

  const formatValue = (val) => {
    if (val === 0) {
      return '$0'
    } else if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`
    } else if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}K`
    }
    return `$${val.toLocaleString()}`
  }

  return (
    <View style={styles.sliderContainer}>
      {/* Header with label and value display */}
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderFieldLabel}>Budget</Text>
        <View style={styles.sliderValueContainer}>
          <Text style={styles.sliderValueText}>{formatValue(value)}</Text>
        </View>
      </View>
      
      {/* Slider track */}
      <View style={styles.sliderWrapper}>
        <TouchableOpacity
          style={styles.sliderTrack}
          onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
          onPress={handleSliderPress}
          activeOpacity={1}
        >
          {/* Unselected range - shows the full track */}
          <View style={styles.sliderTrackBackground} />
          {/* Selected range - shows the progress */}
          <View style={[styles.sliderProgress, { width: `${Math.min(100, percentage)}%` }]} />
          {/* Thumb */}
          <View
            style={[
              styles.sliderThumb,
              { left: Math.max(0, Math.min(sliderWidth - 20, sliderPosition - 10)) },
              isDragging && styles.sliderThumbActive
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
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

const LeadsScreen = ({ navigation }) => {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showTransferredLeads, setShowTransferredLeads] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  
  // Advanced Filter state
  const [filterData, setFilterData] = useState({
    regionId: null,
    regionName: 'All Regions',
    requirement: 'All Requirements',
    propertyType: 'All Property Types',
    budgetMax: 0
  })

  // Filter dropdown state
  const [regions, setRegions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showRequirementDropdown, setShowRequirementDropdown] = useState(false)
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({})
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef(null)
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  // API state management
  const [leadsData, setLeadsData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [deletingLeadId, setDeletingLeadId] = useState(null)
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newLeadsToday: 0,
    convertedLeads: 0,
    averageDealSize: 0,
    transfersToMe: 0,
    transfersByMe: 0
  })
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)

  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = (dropdownKey, event) => {
    const { pageY } = event.nativeEvent
    const screenHeight = Dimensions.get('window').height
    const dropdownHeight = 200 // Approximate dropdown height
    const spaceBelow = screenHeight - pageY
    const spaceAbove = pageY
    
    const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
    
    setDropdownPosition(prev => ({
      ...prev,
      [dropdownKey]: shouldOpenUpward ? 'upward' : 'downward'
    }))
  }

  // Fetch regions for filter dropdown
  const fetchRegions = async () => {
    try {
      setIsLoadingRegions(true)
      const response = await authAPI.getAllRegions()
      if (response.success && response.data && response.data.regions) {
        // Extract regions from the nested structure
        const regionsData = Array.isArray(response.data.regions) ? response.data.regions : []
        setRegions(regionsData)
        console.log('Regions fetched successfully:', regionsData.length, 'regions')
      } else {
        console.log('No regions data found in response:', response)
        setRegions([])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
      setRegions([])
    } finally {
      setIsLoadingRegions(false)
    }
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

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      const token = await storage.getToken()
      const brokerId = await storage.getUserId()
      const userId = await storage.getBrokerId()
      
      if (token) {
        const response = await notificationsAPI.getNotifications(token, brokerId, userId)
        
        if (response && response.success && response.data && response.data.notifications) {
          // Count unread notifications (where isRead is false)
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

  // Handle message press
  const handleMessagePress = () => {
    navigation.navigate('Notifications')
  }

  // Handle profile press
  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile')
  }

  // Filter functions
  const handleFilterChange = (key, value) => {
    setFilterData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleRegionSelect = (region) => {
    setFilterData(prev => ({
      ...prev,
      regionId: region._id,
      regionName: region.name
    }))
    setShowRegionDropdown(false)
    // Close other dropdowns
    setShowRequirementDropdown(false)
    setShowPropertyTypeDropdown(false)
    console.log('Region selected:', region.name, 'ID:', region._id)
  }

  const handleFilterRequirementSelect = (requirement) => {
    setFilterData(prev => ({
      ...prev,
      requirement: requirement.value
    }))
    setShowRequirementDropdown(false)
    // Close other dropdowns
    setShowRegionDropdown(false)
    setShowPropertyTypeDropdown(false)
  }

  const handleFilterPropertyTypeSelect = (propertyType) => {
    setFilterData(prev => ({
      ...prev,
      propertyType: propertyType.value
    }))
    setShowPropertyTypeDropdown(false)
    // Close other dropdowns
    setShowRegionDropdown(false)
    setShowRequirementDropdown(false)
  }

  const clearFilters = () => {
    setFilterData({
      regionId: null,
      regionName: 'All Regions',
      requirement: 'All Requirements',
      propertyType: 'All Property Types',
      budgetMax: 0
    })
  }

  // Validation functions
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phone.trim()) {
      return 'Phone number is required'
    }
    if (!phoneRegex.test(phone.trim())) {
      return 'Phone number must be 10 digits and start with 6-9'
    }
    return ''
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      return 'Email is required'
    }
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validateName = (name) => {
    if (!name.trim()) {
      return 'Customer name is required'
    }
    return ''
  }


  const applyFilters = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      if (!userId) {
        throw new Error('No user ID found')
      }

      const statusOption = statusOptions.find(option => option.key === selectedStatus)
      const apiStatus = statusOption ? statusOption.apiValue : 'all'

      const filters = {
        regionId: filterData.regionName === 'All Regions' ? null : filterData.regionId,
        propertyType: filterData.propertyType === 'All Property Types' ? null : filterData.propertyType,
        requirement: filterData.requirement === 'All Requirements' ? null : filterData.requirement,
        budgetMax: filterData.budgetMax,
        search: searchQuery,
        status: apiStatus
      }

      // For transferred leads, we need to use the transferred leads API with filters
      // For regular leads, use the filtered leads API
      const response = showTransferredLeads 
        ? await leadsAPI.getTransferredLeads(token, userId, searchQuery, apiStatus, filters)
        : await leadsAPI.getLeadsWithFilters(token, userId, filters)
      
      if (response.success && response.data) {
        const leadsArray = Array.isArray(response.data.items) ? response.data.items : (Array.isArray(response.data) ? response.data : [])
        const mappedLeads = leadsArray.map(lead => {
          // Build region string with both primary and secondary regions
          let regionString = 'Not specified'
          if (lead.primaryRegion?.name) {
            regionString = lead.primaryRegion.name
            if (lead.secondaryRegion?.name) {
              regionString += `, ${lead.secondaryRegion.name}`
            }
          } else if (lead.region?.name) {
            regionString = lead.region.name
          }

          return {
            id: lead._id,
            name: lead.customerName,
            email: lead.customerEmail,
            phone: lead.customerPhone,
            requirement: lead.requirement,
            propertyType: lead.propertyType,
            budget: lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified',
            region: regionString,
            status: lead.status.toLowerCase().replace(' ', '-'),
            priority: 'medium',
            source: 'API',
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
          }
        })

        setLeadsData(mappedLeads)
      } else {
        throw new Error(response.message || 'Failed to fetch filtered leads')
      }
    } catch (err) {
      console.error('Error applying filters:', err)
      setError(err.message || 'Failed to apply filters')
      Snackbar.showError('Error', err.message || 'Failed to apply filters')
    } finally {
      setIsLoading(false)
      setShowAdvancedFilter(false)
    }
  }

  // Apply filters with specific status (used when status changes but advanced filters are active)
  const applyFiltersWithStatus = async (apiStatus) => {
    try {
      setIsLoading(true)
      setError(null)

      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      if (!userId) {
        throw new Error('No user ID found')
      }

      const filters = {
        regionId: filterData.regionName === 'All Regions' ? null : filterData.regionId,
        propertyType: filterData.propertyType === 'All Property Types' ? null : filterData.propertyType,
        requirement: filterData.requirement === 'All Requirements' ? null : filterData.requirement,
        budgetMax: filterData.budgetMax,
        search: searchQuery,
        status: apiStatus
      }

      // For transferred leads, we need to use the transferred leads API with filters
      // For regular leads, use the filtered leads API
      const response = showTransferredLeads 
        ? await leadsAPI.getTransferredLeads(token, userId, searchQuery, apiStatus, filters)
        : await leadsAPI.getLeadsWithFilters(token, userId, filters)
      
      if (response.success && response.data) {
        const leadsArray = Array.isArray(response.data.items) ? response.data.items : (Array.isArray(response.data) ? response.data : [])
        const mappedLeads = leadsArray.map(lead => {
          // Build region string with both primary and secondary regions
          let regionString = 'Not specified'
          if (lead.primaryRegion?.name) {
            regionString = lead.primaryRegion.name
            if (lead.secondaryRegion?.name) {
              regionString += `, ${lead.secondaryRegion.name}`
            }
          } else if (lead.region?.name) {
            regionString = lead.region.name
          }

          return {
            id: lead._id,
            name: lead.customerName,
            email: lead.customerEmail,
            phone: lead.customerPhone,
            requirement: lead.requirement,
            propertyType: lead.propertyType,
            budget: lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified',
            region: regionString,
            status: lead.status.toLowerCase().replace(' ', '-'),
            priority: 'medium',
            source: 'API',
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
          }
        })

        setLeadsData(mappedLeads)
      } else {
        throw new Error(response.message || 'Failed to fetch filtered leads')
      }
    } catch (err) {
      console.error('Error applying filters with status:', err)
      setError(err.message || 'Failed to apply filters')
      Snackbar.showError('Error', err.message || 'Failed to apply filters')
    } finally {
      setIsLoading(false)
    }
  }

  // API functions
  const fetchMetrics = async () => {
    try {
      setIsLoadingMetrics(true)
      setError(null)

      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      if (!userId) {
        throw new Error('No user ID found')
      }

      const response = await leadsAPI.getMetrics(userId, token)
      
      if (response.success && response.data) {
        setMetrics({
          totalLeads: response.data.totalLeads || 0,
          newLeadsToday: response.data.newLeadsToday || 0,
          convertedLeads: response.data.convertedLeads || 0,
          averageDealSize: response.data.averageDealSize || 0,
          transfersToMe: response.data.transfersToMe || 0,
          transfersByMe: response.data.transfersByMe || 0
        })
      } else {
        throw new Error(response.message || 'Failed to fetch metrics')
      }
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err.message || 'Failed to fetch metrics')
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  const fetchLeads = async (refresh = false, searchTerm = '', status = 'all') => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else if (searchTerm) {
        setIsSearching(true)
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

      const response = showTransferredLeads 
        ? await leadsAPI.getTransferredLeads(token, userId, searchTerm, status)
        : await leadsAPI.getLeads(token, userId, searchTerm, status)
      
      if (response.success && response.data) {
        const leadsArray = Array.isArray(response.data.items) ? response.data.items : (Array.isArray(response.data) ? response.data : [])
        const mappedLeads = leadsArray.map(lead => {
          // Build region string with both primary and secondary regions
          let regionString = 'Not specified'
          if (lead.primaryRegion?.name) {
            regionString = lead.primaryRegion.name
            if (lead.secondaryRegion?.name) {
              regionString += `, ${lead.secondaryRegion.name}`
            }
          } else if (lead.region?.name) {
            regionString = lead.region.name
          }

          return {
            id: lead._id,
            name: lead.customerName,
            email: lead.customerEmail,
            phone: lead.customerPhone,
            requirement: lead.requirement,
            propertyType: lead.propertyType,
            budget: lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified',
            region: regionString,
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
          }
        })

        setLeadsData(mappedLeads)
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
      setIsSearching(false)
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
        const statusOption = statusOptions.find(option => option.key === selectedStatus)
        const apiStatus = statusOption ? statusOption.apiValue : 'all'
        await fetchLeads(false, searchQuery, apiStatus)
        
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

  // Handle toggle between all leads and transferred leads
  const handleToggleChange = async (value) => {
    setShowTransferredLeads(value)
    setSelectedStatus('all') // Reset status when switching data source
    setLeadsData([]) // Clear current data to show loading state
    setSearchQuery('') // Clear search when switching
    // Don't call fetchLeads here as useEffect will handle it
  }

  // Handle search input change with debouncing
  const handleSearchChange = (text) => {
    setSearchQuery(text)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      const statusOption = statusOptions.find(option => option.key === selectedStatus)
      const apiStatus = statusOption ? statusOption.apiValue : 'all'
      
      // Check if advanced filters are applied and use them
      const hasAdvancedFilters = filterData.regionName !== 'All Regions' || 
                                filterData.requirement !== 'All Requirements' || 
                                filterData.propertyType !== 'All Property Types' || 
                                filterData.budgetMax !== 0
      
      if (hasAdvancedFilters) {
        // Apply both search and advanced filters
        applyFiltersWithStatus(apiStatus)
      } else {
        // Apply only search filter
        if (text.trim()) {
          fetchLeads(false, text.trim(), apiStatus)
        } else {
          fetchLeads(false, '', apiStatus)
        }
      }
    }, 500) // 500ms delay
  }

  // Handle search toggle
  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible)
    if (isSearchVisible) {
      // Clear search when hiding search bar
      setSearchQuery('')
      const statusOption = statusOptions.find(option => option.key === selectedStatus)
      const apiStatus = statusOption ? statusOption.apiValue : 'all'
      fetchLeads(false, '', apiStatus)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    const statusOption = statusOptions.find(option => option.key === selectedStatus)
    const apiStatus = statusOption ? statusOption.apiValue : 'all'
    
    // Check if advanced filters are applied and use them
    const hasAdvancedFilters = filterData.regionName !== 'All Regions' || 
                              filterData.requirement !== 'All Requirements' || 
                              filterData.propertyType !== 'All Property Types' || 
                              filterData.budgetMax !== 0
    
    if (hasAdvancedFilters) {
      // Apply advanced filters without search
      applyFiltersWithStatus(apiStatus)
    } else {
      // Apply only status filter
      fetchLeads(false, '', apiStatus)
    }
  }

  // Share Lead function
  const handleSharePress = (lead) => {
    navigation.navigate('ShareLead', { lead })
  }

  // Handle status change
  const handleStatusChange = (statusKey) => {
    setSelectedStatus(statusKey)
    setShowStatusDropdown(false)
    setLeadsData([]) // Clear current data to show loading state
    const statusOption = statusOptions.find(option => option.key === statusKey)
    const apiStatus = statusOption ? statusOption.apiValue : 'all'
    
    // Check if advanced filters are applied and use them
    const hasAdvancedFilters = filterData.regionName !== 'All Regions' || 
                              filterData.requirement !== 'All Requirements' || 
                              filterData.propertyType !== 'All Property Types' || 
                              filterData.budgetMax !== 0
    
    if (hasAdvancedFilters) {
      // Apply both status and advanced filters
      applyFiltersWithStatus(apiStatus)
    } else {
      // Apply only status filter
      fetchLeads(false, searchQuery, apiStatus)
    }
  }

  // Load leads and metrics on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchMetrics(),
        fetchUnreadNotificationCount(),
        fetchLeads(false, '', 'all'),
        fetchUserProfile()
      ])
    }
    loadData()
  }, [])

  // Refresh leads when screen comes into focus (e.g., returning from CreateLeadScreen)
  const isFirstMount = useRef(true)
  useFocusEffect(
    React.useCallback(() => {
      // Skip refresh on initial mount (already handled by useEffect)
      if (isFirstMount.current) {
        isFirstMount.current = false
        return
      }
      
      const refreshData = async () => {
        const statusOption = statusOptions.find(option => option.key === selectedStatus)
        const apiStatus = statusOption ? statusOption.apiValue : 'all'
        
        // Check if advanced filters are applied and use them
        const hasAdvancedFilters = filterData.regionName !== 'All Regions' || 
                                  filterData.requirement !== 'All Requirements' || 
                                  filterData.propertyType !== 'All Property Types' || 
                                  filterData.budgetMax !== 0
        
        if (hasAdvancedFilters) {
          await applyFiltersWithStatus(apiStatus)
        } else {
          await fetchLeads(false, searchQuery, apiStatus)
        }
        await fetchMetrics()
      }
      refreshData()
    }, [selectedStatus, searchQuery, filterData])
  )

  // Fetch regions when advanced filter modal opens
  useEffect(() => {
    if (showAdvancedFilter && (!regions || regions.length === 0)) {
      fetchRegions()
    }
  }, [showAdvancedFilter])

  // Refetch leads when toggle state changes
  useEffect(() => {
    // Always refetch when toggle state changes, regardless of current data
    const statusOption = statusOptions.find(option => option.key === selectedStatus)
    const apiStatus = statusOption ? statusOption.apiValue : 'all'
    fetchLeads(false, searchQuery, apiStatus)
  }, [showTransferredLeads])

  // Status options for dropdown
  const statusOptions = [
    { key: 'all', label: 'All Leads', apiValue: 'all' },
    { key: 'new', label: 'New', apiValue: 'New' },
    { key: 'assigned', label: 'Assigned', apiValue: 'Assigned' },
    { key: 'in-progress', label: 'In Progress', apiValue: 'In Progress' },
    { key: 'rejected', label: 'Rejected', apiValue: 'Rejected' },
    { key: 'closed', label: 'Closed', apiValue: 'Closed' }
  ]

  // Filter options
  const requirementOptions = [
    { key: 'All Requirements', value: 'All Requirements' },
    { key: 'buy', value: 'Buy' },
    { key: 'rent', value: 'Rent' },
    { key: 'sell', value: 'Sell' }
  ]

  const propertyTypeOptions = [
    { key: 'All Property Types', value: 'All Property Types' },
    { key: 'Residential', value: 'Residential' },
    { key: 'Commercial', value: 'Commercial' },
    { key: 'Plot', value: 'Plot' },
    { key: 'Other', value: 'Other' }
  ]

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        setIsKeyboardVisible(true)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    )
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        setIsKeyboardVisible(true)
      }
    )
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    )

    return () => {
      keyboardDidHideListener?.remove()
      keyboardDidShowListener?.remove()
      keyboardWillShowListener?.remove()
      keyboardWillHideListener?.remove()
    }
  }, [])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3B82F6'
      case 'assigned': return '#F59E0B'
      case 'in-progress': return '#8B5CF6'
      case 'rejected': return '#EF4444'
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
      case 'assigned': return 'assignment'
      case 'in-progress': return 'trending-up'
      case 'rejected': return 'cancel'
      case 'closed': return 'done'
      default: return 'help'
    }
  }

  const filteredLeads = leadsData

  const LeadCard = ({ lead, navigation, isTransferredLead }) => {
    const isDeleting = deletingLeadId === lead.id

    const getActionIconColor = (buttonType) => {
      return '#9E9E9E'
    }

    return (
      <TouchableOpacity 
        style={styles.leadCard}
        onPress={() => navigation.navigate('LeadDetails', { leadId: lead.id, isTransferredLead: isTransferredLead })}
        activeOpacity={0.7}
      >
        {/* Header Section */}
        <View style={styles.leadHeader}>
          <View style={styles.leadAvatarContainer}>
            <View style={styles.leadAvatar}>
              {lead.avatar ? (
                <SafeImage
                  source={{ uri: getSecureImageUrl(lead.avatar) }}
                  style={styles.leadAvatarImage}
                  imageType="lead-avatar"
                  fallbackText={lead.name ? lead.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                />
              ) : (
                <Text style={styles.leadAvatarText}>{lead.name ? lead.name.split(' ').map(n => n[0]).join('') : 'N/A'}</Text>
              )}
            </View>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{lead.name || 'Unknown Lead'}</Text>
            <Text style={styles.leadEmail}>{lead.email || 'No email'}</Text>
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
              <MaterialIcons name="trending-up" size={16} color="#9CA3AF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>REQUIREMENT</Text>
                <Text style={styles.detailValue}>{lead.requirement || 'Not specified'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="home" size={16} color="#9CA3AF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>PROPERTY TYPE</Text>
                <Text style={styles.detailValue}>{lead.propertyType || 'Not specified'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={16} color="#9CA3AF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>BUDGET</Text>
                <Text style={styles.detailValue}>{lead.budget}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={16} color="#9CA3AF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>REGION(S)</Text>
                <Text style={styles.detailValue}>{lead.region || 'Not specified'}</Text>
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
                      fallbackText={person.name ? person.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                    />
                  ) : (
                    <Text style={styles.sharedAvatarText}>{person.name ? person.name.split(' ').map(n => n[0]).join('') : 'N/A'}</Text>
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
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation()
                handleSharePress(lead)
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="send" size={18} color={getActionIconColor('share')} />
            </TouchableOpacity>
            {/* Only show delete button if lead is not shared with anyone */}
            {lead.sharedWith.length === 0 && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation()
                  handleDeletePress(lead.id, lead.name)
                }}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <MaterialIcons name="delete" size={18} color={getActionIconColor('delete')} />
                )}
              </TouchableOpacity>
            )}
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
                <Text style={styles.welcomeGreeting}>Manage Your Leads</Text>
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
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              const statusOption = statusOptions.find(option => option.key === selectedStatus)
              const apiStatus = statusOption ? statusOption.apiValue : 'all'
              
              // Check if advanced filters are applied and use them
              const hasAdvancedFilters = filterData.regionName !== 'All Regions' || 
                                        filterData.requirement !== 'All Requirements' || 
                                        filterData.propertyType !== 'All Property Types' || 
                                        filterData.budgetMax !== 0
              
              await Promise.all([
                fetchMetrics(),
                hasAdvancedFilters ? applyFiltersWithStatus(apiStatus) : fetchLeads(true, searchQuery, apiStatus)
              ])
            }}
            colors={['#0D542BFF']}
            tintColor="#0D542BFF"
          />
        }
      >

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="people" size={22} color="#FFFFFF" />
                  <Text 
                    style={styles.statCount}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.6}
                  >
                    {isLoadingMetrics ? '...' : (metrics.totalLeads || 0).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.statTitle}>Total Leads</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.statCardBlue]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="share" size={22} color="#FFFFFF" />
                  <Text 
                    style={styles.statCount}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.6}
                  >
                    {isLoadingMetrics ? '...' : (metrics.transfersToMe || 0).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.statTitle}>Share with me</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.statCardYellow]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="send" size={22} color="#FFFFFF" />
                  <Text 
                    style={styles.statCount}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.6}
                  >
                    {isLoadingMetrics ? '...' : (metrics.transfersByMe || 0).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.statTitle}>Share by me</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search leads..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <MaterialIcons name="clear" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          {isSearching && (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="small" color="#0D542BFF" />
              <Text style={styles.searchLoadingText}>Searching...</Text>
            </View>
          )}
        </View>

        {/* Status Filter Dropdown */}
        <View style={styles.filterSection}>
          {/* All Leads Dropdown - Full Width */}
          <View style={styles.dropdownContainerFullWidth}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <Text style={styles.dropdownButtonText}>
                {statusOptions.find(option => option.key === selectedStatus)?.label || 'All Leads'}
              </Text>
              <MaterialIcons 
                name={showStatusDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {showStatusDropdown && (
              <View style={styles.dropdownMenu}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownItem,
                      selectedStatus === option.key && styles.dropdownItemActive
                    ]}
                    onPress={() => handleStatusChange(option.key)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedStatus === option.key && styles.dropdownItemTextActive
                    ]}>
                      {option.label}
                    </Text>
                    {selectedStatus === option.key && (
                      <MaterialIcons name="check" size={20} color="#0D542BFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Advanced Filter Button - Full Width */}
          <View style={styles.filterButtonRow}>
            <TouchableOpacity
              style={styles.advancedFilterButtonFullWidth}
              onPress={() => setShowAdvancedFilter(true)}
            >
              <MaterialIcons name="tune" size={18} color="#6B7280" />
              <Text style={styles.advancedFilterText} numberOfLines={1} ellipsizeMode="tail">Advanced</Text>
            </TouchableOpacity>
          </View>
          
        </View>

        {/* Leads List */}
        <View style={styles.leadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {showTransferredLeads ? 'Transferred Leads' : 'Leads'}
            </Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>All</Text>
              <TouchableOpacity 
                style={[styles.toggleButton, showTransferredLeads && styles.toggleButtonActive]}
                onPress={() => handleToggleChange(!showTransferredLeads)}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleThumb, showTransferredLeads && styles.toggleThumbActive]} />
              </TouchableOpacity>
              <Text style={styles.toggleLabel}>Transferred Me</Text>
            </View>
          </View>
          
          {/* Add Lead Button */}
          <View style={styles.addLeadButtonContainer}>
            <TouchableOpacity 
              style={styles.addLeadButtonPlaceholder}
              onPress={() => navigation.navigate('CreateLead')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={32} color="#9CA3AF" />
              <Text style={styles.addLeadButtonPlaceholderText}>Add Lead</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0D542BFF" />
              <Text style={styles.loadingText}>Loading leads...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#EF4444" />
              <Text style={styles.errorTitle}>Failed to Load Leads</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  const statusOption = statusOptions.find(option => option.key === selectedStatus)
                  const apiStatus = statusOption ? statusOption.apiValue : 'all'
                  
                  // Check if advanced filters are applied and use them
                  const hasAdvancedFilters = filterData.regionName !== 'All Regions' || 
                                            filterData.requirement !== 'All Requirements' || 
                                            filterData.propertyType !== 'All Property Types' || 
                                            filterData.budgetMax !== 0
                  
                  if (hasAdvancedFilters) {
                    applyFiltersWithStatus(apiStatus)
                  } else {
                    fetchLeads(false, searchQuery, apiStatus)
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredLeads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptyMessage}>
                {selectedStatus === 'all' 
                  ? (showTransferredLeads 
                      ? 'No transferred leads available at the moment' 
                      : 'No leads available at the moment')
                  : `No ${statusOptions.find(option => option.key === selectedStatus)?.label.toLowerCase() || 'leads'} found`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredLeads}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <LeadCard lead={item} navigation={navigation} isTransferredLead={showTransferredLeads} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}

        </View>
      </ScrollView>
      </View>

      {/* Advanced Filter Modal */}
      <Modal
        visible={showAdvancedFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAdvancedFilter(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowAdvancedFilter(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filters</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAdvancedFilter(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
            >
              {/* Region Filter */}
              <View style={styles.filterFieldContainer}>
                <Text style={styles.filterFieldLabel}>Region</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.filterDropdownButton}
                    onPress={() => {
                      setShowRegionDropdown(!showRegionDropdown)
                      setShowRequirementDropdown(false)
                      setShowPropertyTypeDropdown(false)
                    }}
                  >
                    <Text style={styles.filterDropdownText}>
                      {filterData.regionName}
                    </Text>
                    <MaterialIcons 
                      name={showRegionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  
                  {showRegionDropdown && (
                    <View style={styles.filterDropdownMenuDownward}>
                      <ScrollView 
                        showsVerticalScrollIndicator={true}
                        style={{ maxHeight: 280 }}
                        nestedScrollEnabled={true}
                      >
                        <TouchableOpacity
                          style={[styles.filterDropdownItem, { backgroundColor: '#F0FDFA' }]}
                          onPress={() => handleRegionSelect({ _id: null, name: 'All Regions' })}
                        >
                          <Text style={[styles.filterDropdownItemText, { color: '#0D542BFF', fontWeight: '600' }]}>All Regions</Text>
                        </TouchableOpacity>
                        {isLoadingRegions ? (
                          <View style={styles.filterDropdownItem}>
                            <ActivityIndicator size="small" color="#0D542BFF" />
                            <Text style={styles.filterDropdownItemText}>Loading regions...</Text>
                          </View>
                        ) : (
                          regions && regions.length > 0 ? (
                            regions.map((region) => (
                              <TouchableOpacity
                                key={region._id}
                                style={styles.filterDropdownItem}
                                onPress={() => handleRegionSelect(region)}
                              >
                                <Text style={styles.filterDropdownItemText}>{region.name}</Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.filterDropdownItem}>
                              <Text style={styles.filterDropdownItemText}>
                                {regions ? 'No regions available' : 'Failed to load regions'}
                              </Text>
                            </View>
                          )
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Requirement Filter */}
              <View style={styles.filterFieldContainer}>
                <Text style={styles.filterFieldLabel}>Requirement</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.filterDropdownButton}
                    onPress={() => {
                      setShowRequirementDropdown(!showRequirementDropdown)
                      setShowRegionDropdown(false)
                      setShowPropertyTypeDropdown(false)
                    }}
                  >
                    <Text style={styles.filterDropdownText}>
                      {filterData.requirement}
                    </Text>
                    <MaterialIcons 
                      name={showRequirementDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  
                  {showRequirementDropdown && (
                    <View style={styles.filterDropdownMenuDownward}>
                      <ScrollView 
                        showsVerticalScrollIndicator={true}
                        style={{ maxHeight: 280 }}
                        nestedScrollEnabled={true}
                      >
                        <TouchableOpacity
                          style={[styles.filterDropdownItem, { backgroundColor: '#F0FDFA' }]}
                          onPress={() => handleFilterRequirementSelect({ key: 'All Requirements', value: 'All Requirements' })}
                        >
                          <Text style={[styles.filterDropdownItemText, { color: '#0D542BFF', fontWeight: '600' }]}>All Requirements</Text>
                        </TouchableOpacity>
                        {requirementOptions.slice(1).map((option) => (
                          <TouchableOpacity
                            key={option.key}
                            style={[
                              styles.filterDropdownItem,
                              filterData.requirement === option.value && { backgroundColor: '#F0FDFA' }
                            ]}
                            onPress={() => handleFilterRequirementSelect(option)}
                          >
                            <Text style={[
                              styles.filterDropdownItemText,
                              filterData.requirement === option.value && { color: '#0D542BFF', fontWeight: '600' }
                            ]}>{option.value}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Property Type Filter */}
              <View style={styles.filterFieldContainer}>
                <Text style={styles.filterFieldLabel}>Property Type</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.filterDropdownButton}
                    onPress={() => {
                      setShowPropertyTypeDropdown(!showPropertyTypeDropdown)
                      setShowRegionDropdown(false)
                      setShowRequirementDropdown(false)
                    }}
                  >
                    <Text style={styles.filterDropdownText}>
                      {filterData.propertyType}
                    </Text>
                    <MaterialIcons 
                      name={showPropertyTypeDropdown ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
                      size={24} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  
                  {showPropertyTypeDropdown && (
                    <View style={styles.filterDropdownMenuUpward}>
                      <ScrollView 
                        showsVerticalScrollIndicator={true}
                        style={{ maxHeight: 280 }}
                        nestedScrollEnabled={true}
                      >
                        <TouchableOpacity
                          style={[styles.filterDropdownItem, { backgroundColor: '#F0FDFA' }]}
                          onPress={() => handleFilterPropertyTypeSelect({ key: 'All Property Types', value: 'All Property Types' })}
                        >
                          <Text style={[styles.filterDropdownItemText, { color: '#0D542BFF', fontWeight: '600' }]}>All Property Types</Text>
                        </TouchableOpacity>
                        {propertyTypeOptions.slice(1).map((option) => (
                          <TouchableOpacity
                            key={option.key}
                            style={[
                              styles.filterDropdownItem,
                              filterData.propertyType === option.value && { backgroundColor: '#F0FDFA' }
                            ]}
                            onPress={() => handleFilterPropertyTypeSelect(option)}
                          >
                            <Text style={[
                              styles.filterDropdownItemText,
                              filterData.propertyType === option.value && { color: '#0D542BFF', fontWeight: '600' }
                            ]}>{option.value}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Budget Slider */}
              <View style={styles.filterFieldContainer}>
                <CustomSlider
                  value={filterData.budgetMax}
                  onValueChange={(value) => handleFilterChange('budgetMax', value)}
                  min={0}
                  max={10000000}
                  step={100000}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
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
    paddingBottom: 0,
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
  headerButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    marginBottom: 0,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#34D399',
  },
  statCardBlue: {
    backgroundColor: '#3B82F6',
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
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
    color: '#1F2937',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#F0FDFA',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dropdownItemTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    flex: 1,
    minWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  advancedFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flexShrink: 1,
  },
  advancedFilterButtonFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  filterButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  // Add New Lead Button
  addLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
    flex: 1,
    minWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  addLeadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  // Add Lead Button
  addLeadButtonContainer: {
    marginBottom: 16,
  },
  addLeadButtonPlaceholder: {
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
  addLeadButtonPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Leads Section
  leadsSection: {
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
  // Toggle Button Styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  toggleButton: {
    width: 44,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginHorizontal: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#0D542BFF',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Lead Card Styles
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    borderRadius: 10,
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
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
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
    backgroundColor: '#0D542BFF',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
    maxHeight: '90%',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%', // Increased height for more content
    minHeight: 400, // Minimum height for content
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  modalBody: {
    flex: 1,
    paddingVertical: 20,
    paddingTop: 20, // Add extra padding at top for upward dropdowns
    paddingBottom: 40, // Add extra padding at bottom
    backgroundColor: 'transparent', // Ensure no background color
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Advanced Filter Styles
  filterFieldContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent', // Ensure no background
  },
  filterFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  filterDropdownButton: {
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterDropdownText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  filterDropdownMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 200,
    paddingVertical: 8,
  },
  filterDropdownMenuDownward: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 200,
    paddingVertical: 8,
    marginTop: 8,
  },
  filterDropdownMenuUpward: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 200,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 40,
  },
  filterDropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Slider Styles
  sliderContainer: {
    marginVertical: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sliderValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
  },
  sliderValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D542BFF',
  },
  sliderWrapper: {
    marginBottom: 8,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    paddingVertical: 12,
    marginHorizontal: 0,
    marginBottom: 8,
  },
  sliderTrackBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
  },
  sliderProgress: {
    height: 8,
    backgroundColor: '#0D542BFF',
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    left: 0,
    zIndex: 1,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#0D542BFF',
    borderRadius: 10,
    top: 8,
    shadowColor: '#0D542BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 2,
  },
  sliderThumbActive: {
    transform: [{ scale: 1.15 }],
    backgroundColor: '#007A6B',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },

  // Modal Footer Button Styles
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Add Lead Modal Styles
  addLeadModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '90%',
    minHeight: 400,
    flex: 1,
    flexGrow: 1,
  },
  addLeadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addLeadModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addLeadModalCloseButton: {
    padding: 4,
  },
  addLeadModalBody: {
    flex: 1,
    paddingBottom: 20,
  },
  addLeadModalBodyContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 10,
    minHeight: '100%',
  },
  addLeadModalFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  addLeadFieldContainer: {
    marginBottom: 20,
  },
  addLeadFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  addLeadTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addLeadTextInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  addLeadErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  addLeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addLeadButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addLeadFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
    marginBottom: 8,
  },
  addLeadFormButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#E5E5EA',
  },
  addLeadFormButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  addLeadFormButtonTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  addLeadBudgetContainer: {
    marginTop: 8,
    backgroundColor: 'white',
  },
  addLeadDropdownContainer: {
    position: 'relative',
  },
  addLeadDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addLeadDropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  addLeadDropdownPlaceholder: {
    color: '#9CA3AF',
  },
  addLeadDropdownMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    marginBottom: 4,
    maxHeight: 200,
  },
  addLeadDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addLeadDropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  addLeadCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addLeadCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addLeadSubmitButton: {
    flex: 1,
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addLeadSubmitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addLeadSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default LeadsScreen
