import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  PanGestureHandler,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { leadsAPI, authAPI } from '../services/api'
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
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedLeadForShare, setSelectedLeadForShare] = useState(null)
  
  // Advanced Filter state
  const [filterData, setFilterData] = useState({
    regionId: null,
    regionName: 'All Regions',
    requirement: 'All Requirements',
    propertyType: 'All Property Types',
    budgetMax: 0
  })

  // Add Lead Modal state
  const [addLeadData, setAddLeadData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    requirement: '',
    propertyType: '',
    budget: 0,
    primaryRegionId: null,
    primaryRegionName: '',
    secondaryRegionId: null,
    secondaryRegionName: ''
  })
  const [validationErrors, setValidationErrors] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    propertyType: '',
    primaryRegion: '',
    requirement: ''
  })
  const [showPrimaryRegionDropdown, setShowPrimaryRegionDropdown] = useState(false)
  const [showSecondaryRegionDropdown, setShowSecondaryRegionDropdown] = useState(false)
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [regions, setRegions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showRequirementDropdown, setShowRequirementDropdown] = useState(false)
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({})
  
  // Share Modal state
  const [shareData, setShareData] = useState({
    shareType: 'all', // 'all', 'region', 'selected'
    selectedRegion: null,
    selectedRegionName: '',
    selectedBrokers: [],
    notes: ''
  })
  const [showShareRegionDropdown, setShowShareRegionDropdown] = useState(false)
  const [showShareBrokerDropdown, setShowShareBrokerDropdown] = useState(false)
  const [allBrokers, setAllBrokers] = useState([])
  const [filteredBrokers, setFilteredBrokers] = useState([])
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef(null)
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  // ScrollView refs for auto-scrolling
  const addLeadScrollRef = useRef(null)
  const shareLeadScrollRef = useRef(null)
  
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

  const validateRequirement = (requirement) => {
    if (!requirement) {
      return 'Requirement is required'
    }
    return ''
  }

  // Add Lead Modal handlers
  const handleAddLeadFieldChange = (field, value) => {
    setAddLeadData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }

    // Real-time validation for specific fields
    if (field === 'customerPhone') {
      const error = validatePhoneNumber(value)
      setValidationErrors(prev => ({
        ...prev,
        customerPhone: error
      }))
    } else if (field === 'customerEmail') {
      const error = validateEmail(value)
      setValidationErrors(prev => ({
        ...prev,
        customerEmail: error
      }))
    } else if (field === 'customerName') {
      const error = validateName(value)
      setValidationErrors(prev => ({
        ...prev,
        customerName: error
      }))
    } else if (field === 'requirement') {
      const error = validateRequirement(value)
      setValidationErrors(prev => ({
        ...prev,
        requirement: error
      }))
    }
  }

  const handleAddLeadRequirementSelect = (requirement) => {
    setAddLeadData(prev => ({
      ...prev,
      requirement: requirement
    }))
  }

  const handleAddLeadPropertyTypeSelect = (propertyType) => {
    setAddLeadData(prev => ({
      ...prev,
      propertyType: propertyType
    }))
  }

  const handlePrimaryRegionSelect = (region) => {
    setAddLeadData(prev => ({
      ...prev,
      primaryRegionId: region._id,
      primaryRegionName: region.name
    }))
    setShowPrimaryRegionDropdown(false)
  }

  const handleSecondaryRegionSelect = (region) => {
    setAddLeadData(prev => ({
      ...prev,
      secondaryRegionId: region._id,
      secondaryRegionName: region.name
    }))
    setShowSecondaryRegionDropdown(false)
  }

  const resetAddLeadForm = () => {
    setAddLeadData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      requirement: '',
      propertyType: '',
      budget: 0,
      primaryRegionId: null,
      primaryRegionName: '',
      secondaryRegionId: null,
      secondaryRegionName: ''
    })
    setValidationErrors({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      propertyType: '',
      primaryRegion: '',
      requirement: ''
    })
    // Dismiss keyboard when form is reset
    Keyboard.dismiss()
  }

  const handleAddLeadSubmit = async () => {
    try {
      setIsSubmittingLead(true)
      
      // Validate all fields
      const nameError = validateName(addLeadData.customerName)
      const phoneError = validatePhoneNumber(addLeadData.customerPhone)
      const emailError = validateEmail(addLeadData.customerEmail)
      const requirementError = validateRequirement(addLeadData.requirement)
      
      // Set validation errors
      setValidationErrors({
        customerName: nameError,
        customerPhone: phoneError,
        customerEmail: emailError,
        propertyType: addLeadData.propertyType ? '' : 'Property type is required',
        primaryRegion: addLeadData.primaryRegionId ? '' : 'Primary region is required',
        requirement: requirementError
      })
      
      // Check if there are any validation errors
      if (nameError || phoneError || emailError || requirementError || !addLeadData.propertyType || !addLeadData.primaryRegionId) {
        Snackbar.showError('Error', 'Please fix all validation errors before submitting')
        return
      }

      // Get authentication token
      const token = await storage.getToken()
      if (!token) {
        Snackbar.showError('Error', 'Authentication token not found. Please login again.')
        return
      }

      // Prepare lead data for API
      const leadData = {
        customerName: addLeadData.customerName.trim(),
        customerPhone: addLeadData.customerPhone.trim(),
        customerEmail: addLeadData.customerEmail.trim(),
        requirement: addLeadData.requirement,
        propertyType: addLeadData.propertyType,
        budget: addLeadData.budget,
        primaryRegionId: addLeadData.primaryRegionId
      }

      // Add secondary region if selected
      if (addLeadData.secondaryRegionId) {
        leadData.secondaryRegionId = addLeadData.secondaryRegionId
      }

      console.log('Creating lead with data:', leadData)

      // Call the API to create the lead
      const response = await leadsAPI.createLead(leadData, token)
      
      if (response.success) {
        Snackbar.showSuccess('Success', response.message || 'Lead created successfully!')
        setShowAddLeadModal(false)
        resetAddLeadForm()
        
        // Refresh leads list
        const statusOption = statusOptions.find(option => option.key === selectedStatus)
        const apiStatus = statusOption ? statusOption.apiValue : 'all'
        await fetchLeads(false, searchQuery, apiStatus)
        
        // Also refresh metrics
        await fetchMetrics()
      } else {
        Snackbar.showError('Error', response.message || 'Failed to create lead')
      }
      
    } catch (error) {
      console.error('Error adding lead:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create lead'
      Snackbar.showError('Error', errorMessage)
    } finally {
      setIsSubmittingLead(false)
    }
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
          // Hide search bar when search is empty
          setIsSearchVisible(false)
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
    setIsSearchVisible(false) // Hide search bar when clearing
  }

  // Share Modal functions
  const handleSharePress = (lead) => {
    setSelectedLeadForShare(lead)
    setShareData({
      shareType: 'all',
      selectedRegion: null,
      selectedRegionName: '',
      selectedBrokers: [],
      notes: ''
    })
    setShowShareModal(true)
  }

  const handleShareTypeChange = (shareType) => {
    setShareData(prev => ({
      ...prev,
      shareType,
      selectedRegion: null,
      selectedRegionName: '',
      selectedBrokers: []
    }))
    setShowShareRegionDropdown(false)
    setShowShareBrokerDropdown(false)
  }

  const handleShareRegionSelect = (region) => {
    setShareData(prev => ({
      ...prev,
      selectedRegion: region._id,
      selectedRegionName: region.name
    }))
    setShowShareRegionDropdown(false)
    // Fetch brokers for this region
    fetchBrokersByRegion(region._id)
  }

  const handleBrokerSelect = (broker) => {
    setShareData(prev => {
      const isSelected = prev.selectedBrokers.some(b => b._id === broker._id)
      if (isSelected) {
        return {
          ...prev,
          selectedBrokers: prev.selectedBrokers.filter(b => b._id !== broker._id)
        }
      } else {
        return {
          ...prev,
          selectedBrokers: [...prev.selectedBrokers, broker]
        }
      }
    })
  }

  const fetchAllBrokers = async () => {
    try {
      setIsLoadingBrokers(true)
      const token = await storage.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.getAllBrokers(token)
      if (response.success && response.data && response.data.brokers) {
        // Use brokers directly from the dedicated API
        const brokers = response.data.brokers
        setAllBrokers(brokers)
        setFilteredBrokers(brokers)
        console.log('All brokers fetched:', brokers.length)
      }
    } catch (error) {
      console.error('Error fetching all brokers:', error)
      Snackbar.showError('Error', 'Failed to fetch brokers')
    } finally {
      setIsLoadingBrokers(false)
    }
  }

  const fetchBrokersByRegion = async (regionId) => {
    try {
      setIsLoadingBrokers(true)
      const token = await storage.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.getBrokersByRegion(regionId, token)
      if (response.success && response.data && response.data.brokers) {
        // Use brokers directly from the dedicated API
        const brokers = response.data.brokers
        setFilteredBrokers(brokers)
        console.log('Brokers by region fetched:', brokers.length)
      }
    } catch (error) {
      console.error('Error fetching brokers by region:', error)
      Snackbar.showError('Error', 'Failed to fetch brokers for region')
    } finally {
      setIsLoadingBrokers(false)
    }
  }

  const handleShareSubmit = async () => {
    try {
      setIsSharing(true)
      
      if (!selectedLeadForShare) {
        Snackbar.showError('Error', 'No lead selected for sharing')
        return
      }

      const token = await storage.getToken()
      if (!token) {
        Snackbar.showError('Error', 'Authentication token not found')
        return
      }

      let toBrokers = []
      
      if (shareData.shareType === 'all') {
        // Get all broker IDs from the dedicated brokers API
        const response = await leadsAPI.getAllBrokers(token)
        if (response.success && response.data && response.data.brokers) {
          toBrokers = response.data.brokers
            .map(broker => broker._id)
            .filter(id => id && id !== selectedLeadForShare.createdBy?._id) // Exclude current user
        }
      } else if (shareData.shareType === 'region') {
        if (!shareData.selectedRegion) {
          Snackbar.showError('Error', 'Please select a region')
          return
        }
        // Use the filtered brokers for the selected region
        toBrokers = filteredBrokers
          .map(broker => broker._id)
          .filter(id => id !== selectedLeadForShare.createdBy?._id) // Exclude current user
      } else if (shareData.shareType === 'selected') {
        if (shareData.selectedBrokers.length === 0) {
          Snackbar.showError('Error', 'Please select at least one broker')
          return
        }
        toBrokers = shareData.selectedBrokers.map(broker => broker._id)
      }

      if (toBrokers.length === 0) {
        Snackbar.showError('Error', 'No brokers available to share with')
        return
      }

      const sharePayload = {
        toBrokers,
        notes: shareData.notes
      }

      console.log('Sharing lead with payload:', sharePayload)

      const response = await leadsAPI.shareLead(selectedLeadForShare.id, sharePayload, token)
      
      if (response.success) {
        Snackbar.showSuccess('Success', response.message || 'Lead shared successfully!')
        setShowShareModal(false)
        setSelectedLeadForShare(null)
        
        // Refresh leads list
        const statusOption = statusOptions.find(option => option.key === selectedStatus)
        const apiStatus = statusOption ? statusOption.apiValue : 'all'
        await fetchLeads(false, searchQuery, apiStatus)
      } else {
        Snackbar.showError('Error', response.message || 'Failed to share lead')
      }
      
    } catch (error) {
      console.error('Error sharing lead:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to share lead'
      Snackbar.showError('Error', errorMessage)
    } finally {
      setIsSharing(false)
    }
  }

  const resetShareModal = () => {
    setShareData({
      shareType: 'all',
      selectedRegion: null,
      selectedRegionName: '',
      selectedBrokers: [],
      notes: ''
    })
    setShowShareRegionDropdown(false)
    setShowShareBrokerDropdown(false)
    setFilteredBrokers([])
    // Dismiss keyboard when modal is reset
    Keyboard.dismiss()
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
        fetchLeads(false, '', 'all')
      ])
    }
    loadData()
  }, [])

  // Fetch regions when advanced filter modal, add lead modal, or share modal opens
  useEffect(() => {
    if ((showAdvancedFilter || showAddLeadModal || showShareModal) && (!regions || regions.length === 0)) {
      fetchRegions()
    }
  }, [showAdvancedFilter, showAddLeadModal, showShareModal])

  // Fetch brokers when share modal opens
  useEffect(() => {
    if (showShareModal && shareData.shareType === 'selected' && allBrokers.length === 0) {
      fetchAllBrokers()
    }
  }, [showShareModal, shareData.shareType])

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
      return isPressed ? '#0D542BFF' : '#9E9E9E'
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
              <MaterialIcons name="trending-up" size={16} color="#0D542BFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>REQUIREMENT</Text>
                <Text style={styles.detailValue}>{lead.requirement || 'Not specified'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="home" size={16} color="#0D542BFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>PROPERTY TYPE</Text>
                <Text style={styles.detailValue}>{lead.propertyType || 'Not specified'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={16} color="#0D542BFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>BUDGET</Text>
                <Text style={styles.detailValue}>{lead.budget}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={16} color="#0D542BFF" />
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
              style={getActionButtonStyle('view')}
              onPressIn={() => setPressedButton('view')}
              onPressOut={() => setPressedButton(null)}
              onPress={() => navigation.navigate('LeadDetails', { 
                leadId: lead.id, 
                isTransferredLead: showTransferredLeads 
              })}
              activeOpacity={0.7}
            >
              <MaterialIcons name="visibility" size={18} color={getActionIconColor('view')} />
              <Text style={getActionButtonTextStyle('view')}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={getActionButtonStyle('share')}
              onPressIn={() => setPressedButton('share')}
              onPressOut={() => setPressedButton(null)}
              onPress={() => handleSharePress(lead)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="send" size={18} color={getActionIconColor('share')} />
              <Text style={getActionButtonTextStyle('share')}>Share</Text>
            </TouchableOpacity>
            {/* Only show delete button if lead is not shared with anyone */}
            {lead.sharedWith.length === 0 && (
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
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
      
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
              <Text style={styles.headerTitle}>Leads</Text>
              <Text style={styles.headerSubtitle}>Your leads</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowAddLeadModal(true)}
              >
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, isSearchVisible && styles.headerButtonActive]}
                onPress={handleSearchToggle}
              >
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search leads..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus={true}
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
        )}

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="people" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>
                    {isLoadingMetrics ? '...' : metrics.totalLeads}
                  </Text>
                </View>
                <Text style={styles.statTitle}>Total Leads</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.statCardBlue]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="share" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>
                    {isLoadingMetrics ? '...' : metrics.transfersToMe}
                  </Text>
                </View>
                <Text style={styles.statTitle}>Share with me</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.statCardYellow]}>
              <View style={styles.statCardContent}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name="send" size={22} color="#FFFFFF" />
                  <Text style={styles.statCount}>
                    {isLoadingMetrics ? '...' : metrics.transfersByMe}
                  </Text>
                </View>
                <Text style={styles.statTitle}>Share by me</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Filter Dropdown */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <View style={styles.dropdownContainer}>
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

            <TouchableOpacity
              style={styles.advancedFilterButton}
              onPress={() => setShowAdvancedFilter(true)}
            >
              <MaterialIcons name="tune" size={20} color="#0D542BFF" />
              <Text style={styles.advancedFilterText}>Advanced</Text>
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
              <MaterialIcons name="inbox" size={48} color="#9CA3AF" />
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
              renderItem={({ item }) => <LeadCard lead={item} />}
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

      {/* Add Lead Modal */}
      <Modal
        visible={showAddLeadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddLeadModal(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              Keyboard.dismiss()
              setShowAddLeadModal(false)
            }}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            enabled={true}
          >
            <View style={[
              styles.addLeadModalContent,
              isKeyboardVisible && Platform.OS === 'android' && {
                marginBottom: keyboardHeight > 0 ? keyboardHeight - 50 : 0,
                maxHeight: keyboardHeight > 0 ? '85%' : '90%'
              }
            ]}>
              <View style={styles.addLeadModalHeader}>
              <Text style={styles.addLeadModalTitle}>Add New Lead</Text>
              <TouchableOpacity
                style={styles.addLeadModalCloseButton}
                onPress={() => {
                  Keyboard.dismiss()
                  setShowAddLeadModal(false)
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={addLeadScrollRef}
              style={styles.addLeadModalBody} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.addLeadModalBodyContent}
              bounces={false}
              scrollEventThrottle={16}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              keyboardDismissMode="interactive"
            >
              {/* Customer Name */}
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Customer Name *</Text>
                <TextInput
                  style={[
                    styles.addLeadTextInput,
                    validationErrors.customerName && styles.addLeadTextInputError
                  ]}
                  placeholder="Enter customer's full name"
                  placeholderTextColor="#9CA3AF"
                  value={addLeadData.customerName}
                  onChangeText={(text) => handleAddLeadFieldChange('customerName', text)}
                  onFocus={() => {
                    setTimeout(() => {
                      addLeadScrollRef.current?.scrollTo({ y: 0, animated: true })
                    }, 100)
                  }}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                {validationErrors.customerName ? (
                  <Text style={styles.addLeadErrorText}>{validationErrors.customerName}</Text>
                ) : null}
              </View>

              {/* Contact Phone */}
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Contact Phone *</Text>
                <TextInput
                  style={[
                    styles.addLeadTextInput,
                    validationErrors.customerPhone && styles.addLeadTextInputError
                  ]}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor="#9CA3AF"
                  value={addLeadData.customerPhone}
                  onChangeText={(text) => handleAddLeadFieldChange('customerPhone', text)}
                  onFocus={() => {
                    setTimeout(() => {
                      addLeadScrollRef.current?.scrollTo({ y: 100, animated: true })
                    }, 100)
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                {validationErrors.customerPhone ? (
                  <Text style={styles.addLeadErrorText}>{validationErrors.customerPhone}</Text>
                ) : null}
              </View>

              {/* Contact Email */}
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Contact Email *</Text>
                <TextInput
                  style={[
                    styles.addLeadTextInput,
                    validationErrors.customerEmail && styles.addLeadTextInputError
                  ]}
                  placeholder="e.g., john.doe@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={addLeadData.customerEmail}
                  onChangeText={(text) => handleAddLeadFieldChange('customerEmail', text)}
                  onFocus={() => {
                    setTimeout(() => {
                      addLeadScrollRef.current?.scrollTo({ y: 200, animated: true })
                    }, 100)
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                {validationErrors.customerEmail ? (
                  <Text style={styles.addLeadErrorText}>{validationErrors.customerEmail}</Text>
                ) : null}
              </View>

              {/* Requirement */}
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Requirement *</Text>
                <View style={styles.addLeadButtonGroup}>
                  {['Buy', 'Rent', 'Sell'].map((req) => (
                    <TouchableOpacity
                      key={req}
                      style={[
                        styles.addLeadButton,
                        addLeadData.requirement === req && styles.addLeadButtonActive
                      ]}
                      onPress={() => handleAddLeadRequirementSelect(req)}
                    >
                      <Text style={[
                        styles.addLeadButtonText,
                        addLeadData.requirement === req && styles.addLeadButtonTextActive
                      ]}>
                        {req}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {validationErrors.requirement ? (
                  <Text style={styles.addLeadErrorText}>{validationErrors.requirement}</Text>
                ) : null}
              </View>

              {/* Property Type */}
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Property Type *</Text>
                <View style={styles.addLeadButtonGroup}>
                  {['Residential', 'Commercial', 'Plot', 'Other'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.addLeadButton,
                        addLeadData.propertyType === type && styles.addLeadButtonActive
                      ]}
                      onPress={() => handleAddLeadPropertyTypeSelect(type)}
                    >
                      <Text style={[
                        styles.addLeadButtonText,
                        addLeadData.propertyType === type && styles.addLeadButtonTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Budget */}
              <View style={styles.addLeadFieldContainer}>
                <View style={styles.addLeadBudgetContainer}>
                  <CustomSlider
                    value={addLeadData.budget}
                    onValueChange={(value) => handleAddLeadFieldChange('budget', value)}
                    min={0}
                    max={10000000}
                    step={100000}
                  />
                </View>
              </View>

              {/* Region Selection Row */}
              <View style={styles.addLeadRow}>
                <View style={[styles.addLeadFieldContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.addLeadFieldLabel}>Primary Region *</Text>
                  <View style={styles.addLeadDropdownContainer}>
                    <TouchableOpacity
                      style={styles.addLeadDropdownButton}
                      onPress={() => {
                        setShowPrimaryRegionDropdown(!showPrimaryRegionDropdown)
                        setShowSecondaryRegionDropdown(false)
                      }}
                    >
                      <Text style={[
                        styles.addLeadDropdownText,
                        !addLeadData.primaryRegionName && styles.addLeadDropdownPlaceholder
                      ]}>
                        {addLeadData.primaryRegionName || 'Select...'}
                      </Text>
                      <MaterialIcons 
                        name={showPrimaryRegionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                    
                    {showPrimaryRegionDropdown && (
                      <View style={styles.addLeadDropdownMenu}>
                        <ScrollView 
                          showsVerticalScrollIndicator={true}
                          style={{ maxHeight: 200 }}
                          nestedScrollEnabled={true}
                        >
                          {isLoadingRegions ? (
                            <View style={styles.addLeadDropdownItem}>
                              <ActivityIndicator size="small" color="#0D542BFF" />
                              <Text style={styles.addLeadDropdownItemText}>Loading regions...</Text>
                            </View>
                          ) : (
                            regions && regions.length > 0 ? (
                              regions.map((region) => (
                                <TouchableOpacity
                                  key={region._id}
                                  style={styles.addLeadDropdownItem}
                                  onPress={() => handlePrimaryRegionSelect(region)}
                                >
                                  <Text style={styles.addLeadDropdownItemText}>{region.name}</Text>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <View style={styles.addLeadDropdownItem}>
                                <Text style={styles.addLeadDropdownItemText}>No regions available</Text>
                              </View>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
                <View style={[styles.addLeadFieldContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.addLeadFieldLabel}>Optional Region</Text>
                  <View style={styles.addLeadDropdownContainer}>
                    <TouchableOpacity
                      style={styles.addLeadDropdownButton}
                      onPress={() => {
                        setShowSecondaryRegionDropdown(!showSecondaryRegionDropdown)
                        setShowPrimaryRegionDropdown(false)
                      }}
                    >
                      <Text style={[
                        styles.addLeadDropdownText,
                        !addLeadData.secondaryRegionName && styles.addLeadDropdownPlaceholder
                      ]}>
                        {addLeadData.secondaryRegionName || 'Select...'}
                      </Text>
                      <MaterialIcons 
                        name={showSecondaryRegionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                    
                    {showSecondaryRegionDropdown && (
                      <View style={styles.addLeadDropdownMenu}>
                        <ScrollView 
                          showsVerticalScrollIndicator={true}
                          style={{ maxHeight: 200 }}
                          nestedScrollEnabled={true}
                        >
                          {isLoadingRegions ? (
                            <View style={styles.addLeadDropdownItem}>
                              <ActivityIndicator size="small" color="#0D542BFF" />
                              <Text style={styles.addLeadDropdownItemText}>Loading regions...</Text>
                            </View>
                          ) : (
                            regions && regions.length > 0 ? (
                              regions.map((region) => (
                                <TouchableOpacity
                                  key={region._id}
                                  style={styles.addLeadDropdownItem}
                                  onPress={() => handleSecondaryRegionSelect(region)}
                                >
                                  <Text style={styles.addLeadDropdownItemText}>{region.name}</Text>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <View style={styles.addLeadDropdownItem}>
                                <Text style={styles.addLeadDropdownItemText}>No regions available</Text>
                              </View>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              </View>

            </ScrollView>
            
            <View style={styles.addLeadModalFooter}>
              <TouchableOpacity
                style={styles.addLeadCancelButton}
                onPress={() => {
                  Keyboard.dismiss()
                  setShowAddLeadModal(false)
                }}
              >
                <Text style={styles.addLeadCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addLeadSubmitButton, isSubmittingLead && styles.addLeadSubmitButtonDisabled]}
                onPress={handleAddLeadSubmit}
                disabled={isSubmittingLead}
              >
                {isSubmittingLead ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addLeadSubmitButtonText}>Add Lead</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Share Lead Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowShareModal(false)
          resetShareModal()
        }}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              Keyboard.dismiss()
              setShowShareModal(false)
              resetShareModal()
            }}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            enabled={true}
          >
            <View style={[
              styles.shareModalContent,
              isKeyboardVisible && Platform.OS === 'android' && {
                marginBottom: keyboardHeight > 0 ? keyboardHeight - 50 : 0,
                maxHeight: keyboardHeight > 0 ? '85%' : '90%'
              }
            ]}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Lead</Text>
              <TouchableOpacity
                style={styles.shareModalCloseButton}
                onPress={() => {
                  Keyboard.dismiss()
                  setShowShareModal(false)
                  resetShareModal()
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={shareLeadScrollRef}
              style={styles.shareModalBody} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.shareModalBodyContent}
              bounces={false}
              scrollEventThrottle={16}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              keyboardDismissMode="interactive"
            >
              {/* Share Type Selection */}
              <View style={styles.shareTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.shareTypeOption,
                    shareData.shareType === 'all' && styles.shareTypeOptionActive
                  ]}
                  onPress={() => handleShareTypeChange('all')}
                >
                  <View style={styles.radioButton}>
                    {shareData.shareType === 'all' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <Text style={[
                    styles.shareTypeText,
                    shareData.shareType === 'all' && styles.shareTypeTextActive
                  ]}>
                    Share with all brokers
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shareTypeOption,
                    shareData.shareType === 'region' && styles.shareTypeOptionActive
                  ]}
                  onPress={() => handleShareTypeChange('region')}
                >
                  <View style={styles.radioButton}>
                    {shareData.shareType === 'region' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <Text style={[
                    styles.shareTypeText,
                    shareData.shareType === 'region' && styles.shareTypeTextActive
                  ]}>
                    Share with brokers of a region
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shareTypeOption,
                    shareData.shareType === 'selected' && styles.shareTypeOptionActive
                  ]}
                  onPress={() => handleShareTypeChange('selected')}
                >
                  <View style={styles.radioButton}>
                    {shareData.shareType === 'selected' && <View style={styles.radioButtonSelected} />}
                  </View>
                  <Text style={[
                    styles.shareTypeText,
                    shareData.shareType === 'selected' && styles.shareTypeTextActive
                  ]}>
                    Share with selected brokers
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Region Selection (only when region is selected) */}
              {shareData.shareType === 'region' && (
                <View style={styles.shareFieldContainer}>
                  <Text style={styles.shareFieldLabel}>Select Region</Text>
                  <View style={styles.shareDropdownContainer}>
                    <TouchableOpacity
                      style={styles.shareDropdownButton}
                      onPress={() => {
                        setShowShareRegionDropdown(!showShareRegionDropdown)
                        setShowShareBrokerDropdown(false)
                      }}
                    >
                      <Text style={[
                        styles.shareDropdownText,
                        !shareData.selectedRegionName && styles.shareDropdownPlaceholder
                      ]}>
                        {shareData.selectedRegionName || 'Select region'}
                      </Text>
                      <MaterialIcons 
                        name={showShareRegionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                    
                    {showShareRegionDropdown && (
                      <View style={styles.shareDropdownMenu}>
                        <ScrollView 
                          showsVerticalScrollIndicator={true}
                          style={{ maxHeight: 200 }}
                          nestedScrollEnabled={true}
                        >
                          {isLoadingRegions ? (
                            <View style={styles.shareDropdownItem}>
                              <ActivityIndicator size="small" color="#0D542BFF" />
                              <Text style={styles.shareDropdownItemText}>Loading regions...</Text>
                            </View>
                          ) : (
                            regions && regions.length > 0 ? (
                              regions.map((region) => (
                                <TouchableOpacity
                                  key={region._id}
                                  style={styles.shareDropdownItem}
                                  onPress={() => handleShareRegionSelect(region)}
                                >
                                  <Text style={styles.shareDropdownItemText}>{region.name}</Text>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <View style={styles.shareDropdownItem}>
                                <Text style={styles.shareDropdownItemText}>No regions available</Text>
                              </View>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Broker Selection (only when selected brokers is chosen) */}
              {shareData.shareType === 'selected' && (
                <View style={styles.shareFieldContainer}>
                  <Text style={styles.shareFieldLabel}>Select Broker(s)</Text>
                  <View style={styles.shareDropdownContainer}>
                    <TouchableOpacity
                      style={styles.shareDropdownButton}
                      onPress={() => {
                        setShowShareBrokerDropdown(!showShareBrokerDropdown)
                        setShowShareRegionDropdown(false)
                      }}
                    >
                      <Text style={[
                        styles.shareDropdownText,
                        shareData.selectedBrokers.length === 0 && styles.shareDropdownPlaceholder
                      ]}>
                        {shareData.selectedBrokers.length === 0 
                          ? 'Choose brokers...' 
                          : `${shareData.selectedBrokers.length} broker(s) selected`
                        }
                      </Text>
                      <MaterialIcons 
                        name={showShareBrokerDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                    
                    {showShareBrokerDropdown && (
                      <View style={styles.shareDropdownMenuUpward}>
                        {/* Select All Button */}
                        <TouchableOpacity
                          style={[styles.shareDropdownItem, styles.selectAllButton]}
                          onPress={() => {
                            if (shareData.selectedBrokers.length === allBrokers.length) {
                              // Deselect all
                              setShareData(prev => ({
                                ...prev,
                                selectedBrokers: []
                              }))
                            } else {
                              // Select all
                              setShareData(prev => ({
                                ...prev,
                                selectedBrokers: allBrokers
                              }))
                            }
                          }}
                        >
                          <View style={styles.brokerItem}>
                            <View style={styles.brokerInfo}>
                              <Text style={[styles.brokerName, styles.selectAllText]}>
                                {shareData.selectedBrokers.length === allBrokers.length ? 'Deselect All' : 'Select All'}
                              </Text>
                              <Text style={styles.brokerRegion}>
                                {shareData.selectedBrokers.length} of {allBrokers.length} selected
                              </Text>
                            </View>
                            <MaterialIcons 
                              name={shareData.selectedBrokers.length === allBrokers.length ? "check-box" : "check-box-outline-blank"} 
                              size={20} 
                              color="#0D542BFF" 
                            />
                          </View>
                        </TouchableOpacity>
                        
                        {/* Divider */}
                        <View style={styles.dropdownDivider} />
                        
                        <ScrollView 
                          showsVerticalScrollIndicator={true}
                          style={{ maxHeight: 200 }}
                          nestedScrollEnabled={true}
                        >
                          {isLoadingBrokers ? (
                            <View style={styles.shareDropdownItem}>
                              <ActivityIndicator size="small" color="#0D542BFF" />
                              <Text style={styles.shareDropdownItemText}>Loading brokers...</Text>
                            </View>
                          ) : (
                            allBrokers && allBrokers.length > 0 ? (
                              allBrokers.map((broker) => {
                                const isSelected = shareData.selectedBrokers.some(b => b._id === broker._id)
                                return (
                                  <TouchableOpacity
                                    key={broker._id}
                                    style={[
                                      styles.shareDropdownItem,
                                      isSelected && styles.shareDropdownItemSelected
                                    ]}
                                    onPress={() => handleBrokerSelect(broker)}
                                  >
                                    <View style={styles.brokerItem}>
                                      <View style={styles.brokerInfo}>
                                        <Text style={styles.brokerName}>
                                          {broker.name || 'Unknown Broker'}
                                        </Text>
                                        <Text style={styles.brokerRegion}>
                                          {broker.firmName ? `${broker.firmName} • ` : ''}
                                          {broker.region && broker.region.length > 0 
                                            ? broker.region[0].name || 'No region'
                                            : 'No region'
                                          }
                                        </Text>
                                      </View>
                                      {isSelected && (
                                        <MaterialIcons name="check" size={20} color="#0D542BFF" />
                                      )}
                                    </View>
                                  </TouchableOpacity>
                                )
                              })
                            ) : (
                              <View style={styles.shareDropdownItem}>
                                <Text style={styles.shareDropdownItemText}>No brokers available</Text>
                              </View>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Share Notes */}
              <View style={styles.shareFieldContainer}>
                <Text style={styles.shareFieldLabel}>Share Notes (Optional)</Text>
                <TextInput
                  style={styles.shareNotesInput}
                  placeholder="Add any specific instructions or context..."
                  placeholderTextColor="#9CA3AF"
                  value={shareData.notes}
                  onChangeText={(text) => setShareData(prev => ({ ...prev, notes: text }))}
                  onFocus={() => {
                    setTimeout(() => {
                      shareLeadScrollRef.current?.scrollToEnd({ animated: true })
                    }, 100)
                  }}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>
            </ScrollView>
            
            <View style={styles.shareModalFooter}>
              <TouchableOpacity
                style={styles.shareCancelButton}
                onPress={() => {
                  Keyboard.dismiss()
                  setShowShareModal(false)
                  resetShareModal()
                }}
              >
                <Text style={styles.shareCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareSubmitButton, isSharing && styles.shareSubmitButtonDisabled]}
                onPress={handleShareSubmit}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.shareSubmitButtonText}>Share with broker</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </KeyboardAvoidingView>
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
  headerButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  advancedFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D542BFF',
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
  // Toggle Button Styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginHorizontal: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#0D542BFF',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    color: '#0D542BFF',
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
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#B3E5FC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: 16,
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
    gap: 8,
  },
  addLeadButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addLeadButtonActive: {
    backgroundColor: '#0D542BFF',
    borderColor: '#0D542BFF',
  },
  addLeadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  addLeadButtonTextActive: {
    color: '#FFFFFF',
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

  // Share Modal Styles
  shareModalContent: {
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
  shareModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  shareModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  shareModalCloseButton: {
    padding: 4,
  },
  shareModalBody: {
    flex: 1,
    paddingBottom: 20,
  },
  shareModalBodyContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 10,
    minHeight: '100%',
  },
  shareModalFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  shareTypeContainer: {
    marginBottom: 24,
  },
  shareTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shareTypeOptionActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#A7F3D0',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D542BFF',
  },
  shareTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  shareTypeTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  shareFieldContainer: {
    marginBottom: 20,
  },
  shareFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  shareDropdownContainer: {
    position: 'relative',
  },
  shareDropdownButton: {
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
  shareDropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  shareDropdownPlaceholder: {
    color: '#9CA3AF',
  },
  shareDropdownMenu: {
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
    maxHeight: 200,
  },
  shareDropdownMenuUpward: {
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
  shareDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  shareDropdownItemSelected: {
    backgroundColor: '#F0FDFA',
  },
  shareDropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  brokerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brokerInfo: {
    flex: 1,
  },
  brokerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  brokerRegion: {
    fontSize: 14,
    color: '#6B7280',
  },
  shareNotesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    maxHeight: 120,
  },
  shareCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shareCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  shareSubmitButton: {
    flex: 1,
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareSubmitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  shareSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Select All Button Styles
  selectAllButton: {
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  selectAllText: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
})

export default LeadsScreen
