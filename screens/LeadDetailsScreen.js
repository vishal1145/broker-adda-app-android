import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
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
    if (val >= 1000000) {
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

const LeadDetailsScreen = ({ navigation, route }) => {
  const { leadId, isTransferredLead = false } = route.params
  const [leadData, setLeadData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // Edit Lead Modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLeadData, setEditLeadData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    requirement: '',
    propertyType: '',
    budget: 0,
    status: '',
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
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  // ScrollView ref for auto-scrolling
  const editLeadScrollRef = useRef(null)

  const fetchLeadDetails = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const token = await storage.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.getLeadDetails(leadId, token)
      
      if (response.success && response.data && response.data.lead) {
        setLeadData(response.data.lead)
      } else {
        throw new Error(response.message || 'Failed to fetch lead details')
      }
    } catch (err) {
      console.error('Error fetching lead details:', err)
      setError(err.message || 'Failed to fetch lead details')
      Snackbar.showError('Error', err.message || 'Failed to fetch lead details')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

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

  useEffect(() => {
    fetchLeadDetails()
  }, [leadId])

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return '#3B82F6'
      case 'assigned': return '#F59E0B'
      case 'in progress': return '#8B5CF6'
      case 'rejected': return '#EF4444'
      case 'closed': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatBudget = (budget) => {
    if (!budget) return 'Not specified'
    if (budget >= 1000000) {
      return `$${(budget / 1000000).toFixed(1)}M`
    } else if (budget >= 1000) {
      return `$${(budget / 1000).toFixed(0)}K`
    }
    return `$${budget.toLocaleString()}`
  }

  // Fetch regions for edit modal dropdown
  const fetchRegions = async () => {
    try {
      setIsLoadingRegions(true)
      const response = await authAPI.getAllRegions()
      if (response.success && response.data && response.data.regions) {
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

  // Edit Lead Modal handlers
  const handleEditLeadFieldChange = (field, value) => {
    setEditLeadData(prev => ({
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

  const handleEditLeadRequirementSelect = (requirement) => {
    setEditLeadData(prev => ({
      ...prev,
      requirement: requirement
    }))
  }

  const handleEditLeadPropertyTypeSelect = (propertyType) => {
    setEditLeadData(prev => ({
      ...prev,
      propertyType: propertyType
    }))
  }

  const handleEditLeadStatusSelect = (status) => {
    setEditLeadData(prev => ({
      ...prev,
      status: status
    }))
  }

  const handlePrimaryRegionSelect = (region) => {
    setEditLeadData(prev => ({
      ...prev,
      primaryRegionId: region._id,
      primaryRegionName: region.name
    }))
    setShowPrimaryRegionDropdown(false)
  }

  const handleSecondaryRegionSelect = (region) => {
    setEditLeadData(prev => ({
      ...prev,
      secondaryRegionId: region._id,
      secondaryRegionName: region.name
    }))
    setShowSecondaryRegionDropdown(false)
  }

  const resetEditLeadForm = () => {
    if (leadData) {
      setEditLeadData({
        customerName: leadData.customerName || '',
        customerPhone: leadData.customerPhone || '',
        customerEmail: leadData.customerEmail || '',
        requirement: leadData.requirement || '',
        propertyType: leadData.propertyType || '',
        budget: leadData.budget || 0,
        status: leadData.status || '',
        primaryRegionId: leadData.primaryRegion?._id || leadData.region?._id || null,
        primaryRegionName: leadData.primaryRegion?.name || leadData.region?.name || '',
        secondaryRegionId: leadData.secondaryRegion?._id || null,
        secondaryRegionName: leadData.secondaryRegion?.name || ''
      })
    }
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

  const handleEditLeadSubmit = async () => {
    try {
      setIsSubmittingLead(true)
      
      // Validate fields based on lead type
      if (isTransferredLead) {
        // For transferred leads, only validate status
        if (!editLeadData.status) {
          Snackbar.showError('Error', 'Please select a status')
          return
        }
      } else {
        // For regular leads, validate all fields
        const nameError = validateName(editLeadData.customerName)
        const phoneError = validatePhoneNumber(editLeadData.customerPhone)
        const emailError = validateEmail(editLeadData.customerEmail)
        const requirementError = validateRequirement(editLeadData.requirement)
        
        // Set validation errors
        setValidationErrors({
          customerName: nameError,
          customerPhone: phoneError,
          customerEmail: emailError,
          propertyType: editLeadData.propertyType ? '' : 'Property type is required',
          primaryRegion: editLeadData.primaryRegionId ? '' : 'Primary region is required',
          requirement: requirementError
        })
        
        // Check if there are any validation errors
        if (nameError || phoneError || emailError || requirementError || !editLeadData.propertyType || !editLeadData.primaryRegionId) {
          Snackbar.showError('Error', 'Please fix all validation errors before submitting')
          return
        }
      }

      // Get authentication token
      const token = await storage.getToken()
      if (!token) {
        Snackbar.showError('Error', 'Authentication token not found. Please login again.')
        return
      }

      // Prepare lead data for API
      let updateData
      
      if (isTransferredLead) {
        // For transferred leads, only send status
        updateData = {
          status: editLeadData.status
        }
      } else {
        // For regular leads, send all fields
        updateData = {
          customerName: editLeadData.customerName.trim(),
          customerPhone: editLeadData.customerPhone.trim(),
          customerEmail: editLeadData.customerEmail.trim(),
          requirement: editLeadData.requirement,
          propertyType: editLeadData.propertyType,
          budget: editLeadData.budget,
          status: editLeadData.status,
          primaryRegionId: editLeadData.primaryRegionId
        }

        // Add secondary region if selected
        if (editLeadData.secondaryRegionId) {
          updateData.secondaryRegionId = editLeadData.secondaryRegionId
        }
      }

      console.log('Updating lead with data:', updateData)

      // Call the API to update the lead
      const response = await leadsAPI.updateLead(leadId, updateData, token)
      
      if (response.success) {
        Snackbar.showSuccess('Success', response.message || 'Lead updated successfully!')
        setShowEditModal(false)
        
        // Refresh lead details
        await fetchLeadDetails()
      } else {
        Snackbar.showError('Error', response.message || 'Failed to update lead')
      }
      
    } catch (error) {
      console.error('Error updating lead:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update lead'
      Snackbar.showError('Error', errorMessage)
    } finally {
      setIsSubmittingLead(false)
    }
  }

  const handleEditPress = () => {
    // Navigate to CreateLeadScreen with edit params
    navigation.navigate('CreateLead', {
      isEdit: true,
      leadId: leadId,
      leadData: leadData,
      isTransferredLead: isTransferredLead
    })
  }

  // Delete transfer function
  const handleDeleteTransfer = async (transfer) => {
    try {
      Alert.alert(
        'Delete Transfer',
        'Are you sure you want to delete this transfer? This action cannot be undone.',
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
                  Snackbar.showError('Error', 'Authentication token not found. Please login again.')
                  return
                }

                // Get current user ID to determine broker roles
                const currentUserId = await storage.getUserId()
                if (!currentUserId) {
                  Snackbar.showError('Error', 'User ID not found. Please login again.')
                  return
                }

                // Determine broker IDs based on current user
                let fromBrokerId, toBrokerId
                
                if (transfer.fromBroker?._id === currentUserId) {
                  // Current user is the sender
                  fromBrokerId = currentUserId
                  toBrokerId = transfer.toBroker?._id || null
                } else if (transfer.toBroker?._id === currentUserId) {
                  // Current user is the receiver
                  fromBrokerId = transfer.fromBroker?._id || null
                  toBrokerId = currentUserId
                } else {
                  // Fallback to original structure
                  fromBrokerId = transfer.fromBroker?._id || null
                  toBrokerId = transfer.toBroker?._id || null
                }

                console.log('Deleting transfer with broker IDs:', { fromBrokerId, toBrokerId })

                const response = await leadsAPI.deleteTransfer(leadId, transfer._id, fromBrokerId, toBrokerId, token)
                
                if (response.success) {
                  Snackbar.showSuccess('Success', response.message || 'Transfer deleted successfully')
                  // Refresh lead details to update the transfers list
                  await fetchLeadDetails()
                } else {
                  Snackbar.showError('Error', response.message || 'Failed to delete transfer')
                }
              } catch (error) {
                console.error('Error deleting transfer:', error)
                const errorMessage = error.response?.data?.message || error.message || 'Failed to delete transfer'
                Snackbar.showError('Error', errorMessage)
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error showing delete confirmation:', error)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D542BFF" />
          <Text style={styles.loadingText}>Loading lead details...</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Lead Details</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchLeadDetails()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (!leadData) {
    return (
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
        <View style={styles.container}>
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Lead Not Found</Text>
            <Text style={styles.emptyMessage}>The requested lead could not be found.</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
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
              <Text style={styles.headerTitle}>Lead Details</Text>
              <Text style={styles.headerSubtitle}>Complete lead information</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={handleEditPress}
              >
                <MaterialIcons name="edit" size={24} color="#FFFFFF" />
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
            onRefresh={() => fetchLeadDetails(true)}
            colors={['#0D542BFF']}
            tintColor="#0D542BFF"
          />
        }
      >
        {/* Lead Information Card - Matching LeadsScreen style */}
        <View style={styles.leadInfoCard}>
          <View style={styles.leadInfoHeader}>
            <View style={styles.leadInfoAvatarContainer}>
              <View style={styles.leadInfoAvatar}>
                <Text style={styles.leadInfoAvatarText}>
                  {leadData.customerName ? leadData.customerName.split(' ').map(n => n[0]).join('') : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.leadInfoContent}>
              <Text style={styles.leadInfoName}>{leadData.customerName || 'Unknown Lead'}</Text>
              <Text style={styles.leadInfoEmail}>{leadData.customerEmail || 'No email'}</Text>
              <Text style={styles.leadInfoPhone}>{leadData.customerPhone || 'No phone'}</Text>
            </View>
            <View style={[styles.leadInfoStatusBadge, { backgroundColor: getStatusColor(leadData.status) }]}>
              <Text style={styles.leadInfoStatusText}>
                {leadData.status?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
          </View>

          {/* Lead Details Grid */}
          <View style={styles.leadInfoDetailsGrid}>
            <View style={styles.leadInfoDetailRow}>
              <View style={styles.leadInfoDetailItem}>
                <MaterialIcons name="trending-up" size={16} color="#9CA3AF" />
                <View style={styles.leadInfoDetailContent}>
                  <Text style={styles.leadInfoDetailLabel}>REQUIREMENT</Text>
                  <Text style={styles.leadInfoDetailValue}>{leadData.requirement || 'Not specified'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.leadInfoDetailRow}>
              <View style={styles.leadInfoDetailItem}>
                <MaterialIcons name="home" size={16} color="#9CA3AF" />
                <View style={styles.leadInfoDetailContent}>
                  <Text style={styles.leadInfoDetailLabel}>PROPERTY TYPE</Text>
                  <Text style={styles.leadInfoDetailValue}>{leadData.propertyType || 'Not specified'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.leadInfoDetailRow}>
              <View style={styles.leadInfoDetailItem}>
                <MaterialIcons name="attach-money" size={16} color="#9CA3AF" />
                <View style={styles.leadInfoDetailContent}>
                  <Text style={styles.leadInfoDetailLabel}>BUDGET</Text>
                  <Text style={styles.leadInfoDetailValue}>{formatBudget(leadData.budget)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.leadInfoDetailRow}>
              <View style={styles.leadInfoDetailItem}>
                <MaterialIcons name="location-on" size={16} color="#9CA3AF" />
                <View style={styles.leadInfoDetailContent}>
                  <Text style={styles.leadInfoDetailLabel}>REGION(S)</Text>
                  <Text style={styles.leadInfoDetailValue}>
                    {leadData.primaryRegion?.name || leadData.region?.name || 'Not specified'}
                    {leadData.secondaryRegion ? `, ${leadData.secondaryRegion.name}` : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Created By Information */}
        <View style={styles.createdBySection}>
          <Text style={styles.sectionTitle}>Created By</Text>
          <View style={styles.createdByCard}>
            <View style={styles.createdByHeader}>
              <View style={styles.createdByAvatar}>
                {leadData.createdBy?.brokerImage ? (
                  <SafeImage
                    source={{ uri: getSecureImageUrl(leadData.createdBy.brokerImage) }}
                    style={styles.createdByAvatarImage}
                    imageType="created-by-avatar"
                    fallbackText={leadData.createdBy?.name ? leadData.createdBy.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                  />
                ) : (
                  <Text style={styles.createdByAvatarText}>
                    {leadData.createdBy?.name ? leadData.createdBy.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                  </Text>
                )}
              </View>
              <View style={styles.createdByInfo}>
                <Text style={styles.createdByName}>{leadData.createdBy?.name || 'Unknown Broker'}</Text>
                <Text style={styles.createdByFirm}>{leadData.createdBy?.firmName || 'No firm name'}</Text>
                <Text style={styles.createdByEmail}>{leadData.createdBy?.email || 'No email'}</Text>
                <Text style={styles.createdByPhone}>{leadData.createdBy?.phone || 'No phone'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline Information */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name="add" size={20} color="#0D542BFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Lead Created</Text>
                <Text style={styles.timelineDate}>{formatDate(leadData.createdAt)}</Text>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name="update" size={20} color="#6B7280" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Last Updated</Text>
                <Text style={styles.timelineDate}>{formatDate(leadData.updatedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Share History Section */}
        <View style={styles.shareHistorySection}>
          <View style={styles.shareHistoryCard}>
            <View style={styles.shareHistoryHeader}>
              <View style={styles.shareHistoryIcon}>
                <MaterialIcons name="share" size={20} color="#0D542BFF" />
              </View>
              <Text style={styles.shareHistoryTitle}>Share History</Text>
            </View>
            
            {leadData.transfers && leadData.transfers.length > 0 ? (
              <View style={styles.shareHistoryContent}>
                {leadData.transfers.map((transfer, index) => (
                  <View key={index} style={styles.shareHistoryItem}>
                    <View style={styles.shareHistoryAvatar}>
                      {transfer.toBroker?.brokerImage ? (
                        <SafeImage
                          source={{ uri: getSecureImageUrl(transfer.toBroker.brokerImage) }}
                          style={styles.shareHistoryAvatarImage}
                          imageType="share-avatar"
                          fallbackText={transfer.toBroker?.name ? transfer.toBroker.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                        />
                      ) : (
                        <Text style={styles.shareHistoryAvatarText}>
                          {transfer.toBroker?.name ? transfer.toBroker.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.shareHistoryInfo}>
                      <Text style={styles.shareHistoryNames}>
                        {transfer.fromBroker?.name || 'You'} → {transfer.toBroker?.name || 'Agra Broker'}
                      </Text>
                      <Text style={styles.shareHistoryLocation}>
                        {transfer.fromBroker?.primaryRegion?.name || transfer.fromBroker?.region?.[0]?.name || 'Unknown'} → {transfer.toBroker?.primaryRegion?.name || transfer.toBroker?.region?.[0]?.name || 'Unknown'}
                      </Text>
                    </View>
                    {!isTransferredLead && (
                      <TouchableOpacity 
                        style={styles.shareHistoryDeleteButton}
                        onPress={() => handleDeleteTransfer(transfer)}
                      >
                        <MaterialIcons name="delete" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.shareHistoryEmpty}>
                <Text style={styles.shareHistoryEmptyText}>Not shared yet.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
      </View>

      {/* Edit Lead Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss()
          setShowEditModal(false)
        }}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              Keyboard.dismiss()
              setShowEditModal(false)
            }}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            enabled={true}
          >
            <View style={[
              styles.editLeadModalContent,
              isKeyboardVisible && Platform.OS === 'android' && {
                marginBottom: keyboardHeight > 0 ? keyboardHeight - 50 : 0,
                maxHeight: keyboardHeight > 0 ? '85%' : '90%'
              }
            ]}>
            <View style={styles.editLeadModalHeader}>
              <Text style={styles.editLeadModalTitle}>
                {isTransferredLead ? 'Update Status' : 'Edit Lead'}
              </Text>
              <TouchableOpacity
                style={styles.editLeadModalCloseButton}
                onPress={() => {
                  Keyboard.dismiss()
                  setShowEditModal(false)
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={editLeadScrollRef}
              style={styles.editLeadModalBody} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editLeadModalBodyContent}
              bounces={false}
              scrollEventThrottle={16}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              keyboardDismissMode="interactive"
            >
              {isTransferredLead ? (
                // For transferred leads, only show status field
                <View style={[styles.editLeadFieldContainer, { marginBottom: 8 }]}>
                  <Text style={styles.editLeadFieldLabel}>Status *</Text>
                  <View style={styles.editLeadButtonGroup}>
                    {['New', 'Assigned', 'In Progress', 'Rejected', 'Closed'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.editLeadButton,
                          editLeadData.status === status && styles.editLeadButtonActive
                        ]}
                        onPress={() => handleEditLeadStatusSelect(status)}
                      >
                        <Text style={[
                          styles.editLeadButtonText,
                          editLeadData.status === status && styles.editLeadButtonTextActive
                        ]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                // For regular leads, show all fields
                <>
                  {/* Customer Name */}
                  <View style={styles.editLeadFieldContainer}>
                    <Text style={styles.editLeadFieldLabel}>Customer Name *</Text>
                    <TextInput
                      style={[
                        styles.editLeadTextInput,
                        validationErrors.customerName && styles.editLeadTextInputError
                      ]}
                      placeholder="Enter customer's full name"
                      placeholderTextColor="#9CA3AF"
                      value={editLeadData.customerName}
                      onChangeText={(text) => handleEditLeadFieldChange('customerName', text)}
                      onFocus={() => {
                        setTimeout(() => {
                          editLeadScrollRef.current?.scrollTo({ y: 0, animated: true })
                        }, 100)
                      }}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                    {validationErrors.customerName ? (
                      <Text style={styles.editLeadErrorText}>{validationErrors.customerName}</Text>
                    ) : null}
                  </View>

                  {/* Contact Phone */}
                  <View style={styles.editLeadFieldContainer}>
                    <Text style={styles.editLeadFieldLabel}>Contact Phone *</Text>
                    <TextInput
                      style={[
                        styles.editLeadTextInput,
                        validationErrors.customerPhone && styles.editLeadTextInputError
                      ]}
                      placeholder="Enter 10-digit phone number"
                      placeholderTextColor="#9CA3AF"
                      value={editLeadData.customerPhone}
                      onChangeText={(text) => handleEditLeadFieldChange('customerPhone', text)}
                      onFocus={() => {
                        setTimeout(() => {
                          editLeadScrollRef.current?.scrollTo({ y: 100, animated: true })
                        }, 100)
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                    {validationErrors.customerPhone ? (
                      <Text style={styles.editLeadErrorText}>{validationErrors.customerPhone}</Text>
                    ) : null}
                  </View>

                  {/* Contact Email */}
                  <View style={styles.editLeadFieldContainer}>
                    <Text style={styles.editLeadFieldLabel}>Contact Email *</Text>
                    <TextInput
                      style={[
                        styles.editLeadTextInput,
                        validationErrors.customerEmail && styles.editLeadTextInputError
                      ]}
                      placeholder="e.g., john.doe@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={editLeadData.customerEmail}
                      onChangeText={(text) => handleEditLeadFieldChange('customerEmail', text)}
                      onFocus={() => {
                        setTimeout(() => {
                          editLeadScrollRef.current?.scrollTo({ y: 200, animated: true })
                        }, 100)
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />
                    {validationErrors.customerEmail ? (
                      <Text style={styles.editLeadErrorText}>{validationErrors.customerEmail}</Text>
                    ) : null}
                  </View>

                  {/* Requirement */}
                  <View style={styles.editLeadFieldContainer}>
                    <Text style={styles.editLeadFieldLabel}>Requirement *</Text>
                    <View style={styles.editLeadButtonGroup}>
                      {['Buy', 'Rent', 'Sell'].map((req) => (
                        <TouchableOpacity
                          key={req}
                          style={[
                            styles.editLeadButton,
                            editLeadData.requirement === req && styles.editLeadButtonActive
                          ]}
                          onPress={() => handleEditLeadRequirementSelect(req)}
                        >
                          <Text style={[
                            styles.editLeadButtonText,
                            editLeadData.requirement === req && styles.editLeadButtonTextActive
                          ]}>
                            {req}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {validationErrors.requirement ? (
                      <Text style={styles.editLeadErrorText}>{validationErrors.requirement}</Text>
                    ) : null}
                  </View>

                  {/* Property Type */}
                  <View style={styles.editLeadFieldContainer}>
                    <Text style={styles.editLeadFieldLabel}>Property Type *</Text>
                    <View style={styles.editLeadButtonGroup}>
                      {['Residential', 'Commercial', 'Plot', 'Other'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.editLeadButton,
                            editLeadData.propertyType === type && styles.editLeadButtonActive
                          ]}
                          onPress={() => handleEditLeadPropertyTypeSelect(type)}
                        >
                          <Text style={[
                            styles.editLeadButtonText,
                            editLeadData.propertyType === type && styles.editLeadButtonTextActive
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Status */}
                  <View style={styles.editLeadFieldContainer}>
                    <Text style={styles.editLeadFieldLabel}>Status *</Text>
                    <View style={styles.editLeadButtonGroup}>
                      {['New', 'Assigned', 'In Progress', 'Rejected', 'Closed'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.editLeadButton,
                            editLeadData.status === status && styles.editLeadButtonActive
                          ]}
                          onPress={() => handleEditLeadStatusSelect(status)}
                        >
                          <Text style={[
                            styles.editLeadButtonText,
                            editLeadData.status === status && styles.editLeadButtonTextActive
                          ]}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Budget */}
                  <View style={styles.editLeadFieldContainer}>
                    <View style={styles.editLeadBudgetContainer}>
                      <CustomSlider
                        value={editLeadData.budget}
                        onValueChange={(value) => handleEditLeadFieldChange('budget', value)}
                        min={0}
                        max={10000000}
                        step={100000}
                      />
                    </View>
                  </View>

                  {/* Region Selection Row */}
                  <View style={styles.editLeadRow}>
                    <View style={[styles.editLeadFieldContainer, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.editLeadFieldLabel}>Primary Region *</Text>
                      <View style={styles.editLeadDropdownContainer}>
                        <TouchableOpacity
                          style={styles.editLeadDropdownButton}
                          onPress={() => {
                            setShowPrimaryRegionDropdown(!showPrimaryRegionDropdown)
                            setShowSecondaryRegionDropdown(false)
                          }}
                        >
                          <Text style={[
                            styles.editLeadDropdownText,
                            !editLeadData.primaryRegionName && styles.editLeadDropdownPlaceholder
                          ]}>
                            {editLeadData.primaryRegionName || 'Select...'}
                          </Text>
                          <MaterialIcons 
                            name={showPrimaryRegionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={20} 
                            color="#6B7280" 
                          />
                        </TouchableOpacity>
                        
                        {showPrimaryRegionDropdown && (
                          <View style={styles.editLeadDropdownMenu}>
                            <ScrollView 
                              showsVerticalScrollIndicator={true}
                              style={{ maxHeight: 200 }}
                              nestedScrollEnabled={true}
                            >
                              {isLoadingRegions ? (
                                <View style={styles.editLeadDropdownItem}>
                                  <ActivityIndicator size="small" color="#0D542BFF" />
                                  <Text style={styles.editLeadDropdownItemText}>Loading regions...</Text>
                                </View>
                              ) : (
                                regions && regions.length > 0 ? (
                                  regions.map((region) => (
                                    <TouchableOpacity
                                      key={region._id}
                                      style={styles.editLeadDropdownItem}
                                      onPress={() => handlePrimaryRegionSelect(region)}
                                    >
                                      <Text style={styles.editLeadDropdownItemText}>{region.name}</Text>
                                    </TouchableOpacity>
                                  ))
                                ) : (
                                  <View style={styles.editLeadDropdownItem}>
                                    <Text style={styles.editLeadDropdownItemText}>No regions available</Text>
                                  </View>
                                )
                              )}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={[styles.editLeadFieldContainer, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.editLeadFieldLabel}>Optional Region</Text>
                      <View style={styles.editLeadDropdownContainer}>
                        <TouchableOpacity
                          style={styles.editLeadDropdownButton}
                          onPress={() => {
                            setShowSecondaryRegionDropdown(!showSecondaryRegionDropdown)
                            setShowPrimaryRegionDropdown(false)
                          }}
                        >
                          <Text style={[
                            styles.editLeadDropdownText,
                            !editLeadData.secondaryRegionName && styles.editLeadDropdownPlaceholder
                          ]}>
                            {editLeadData.secondaryRegionName || 'Select...'}
                          </Text>
                          <MaterialIcons 
                            name={showSecondaryRegionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={20} 
                            color="#6B7280" 
                          />
                        </TouchableOpacity>
                        
                        {showSecondaryRegionDropdown && (
                          <View style={styles.editLeadDropdownMenu}>
                            <ScrollView 
                              showsVerticalScrollIndicator={true}
                              style={{ maxHeight: 200 }}
                              nestedScrollEnabled={true}
                            >
                              {isLoadingRegions ? (
                                <View style={styles.editLeadDropdownItem}>
                                  <ActivityIndicator size="small" color="#0D542BFF" />
                                  <Text style={styles.editLeadDropdownItemText}>Loading regions...</Text>
                                </View>
                              ) : (
                                regions && regions.length > 0 ? (
                                  regions.map((region) => (
                                    <TouchableOpacity
                                      key={region._id}
                                      style={styles.editLeadDropdownItem}
                                      onPress={() => handleSecondaryRegionSelect(region)}
                                    >
                                      <Text style={styles.editLeadDropdownItemText}>{region.name}</Text>
                                    </TouchableOpacity>
                                  ))
                                ) : (
                                  <View style={styles.editLeadDropdownItem}>
                                    <Text style={styles.editLeadDropdownItemText}>No regions available</Text>
                                  </View>
                                )
                              )}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </>
              )}

            </ScrollView>
            
            <View style={styles.editLeadModalFooter}>
              <TouchableOpacity
                style={styles.editLeadCancelButton}
                onPress={() => {
                  Keyboard.dismiss()
                  setShowEditModal(false)
                }}
              >
                <Text style={styles.editLeadCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editLeadSubmitButton, isSubmittingLead && styles.editLeadSubmitButtonDisabled]}
                onPress={handleEditLeadSubmit}
                disabled={isSubmittingLead}
              >
                {isSubmittingLead ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editLeadSubmitButtonText}>
                    {isTransferredLead ? 'Update Status' : 'Update Lead'}
                  </Text>
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
    paddingBottom: 20,
  },

  // Header Styles
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

  // Lead Information Card Styles - Matching LeadsScreen
  leadInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadInfoAvatarContainer: {
    marginRight: 12,
  },
  leadInfoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadInfoAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  leadInfoContent: {
    flex: 1,
  },
  leadInfoName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  leadInfoEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  leadInfoPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  leadInfoStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  leadInfoStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leadInfoDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  leadInfoDetailRow: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  leadInfoDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadInfoDetailContent: {
    flex: 1,
  },
  leadInfoDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  leadInfoDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  // Created By Section
  createdBySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createdByCard: {
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
  createdByHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createdByAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createdByAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  createdByAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  createdByInfo: {
    flex: 1,
  },
  createdByName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  createdByFirm: {
    fontSize: 14,
    color: '#0D542BFF',
    marginBottom: 2,
  },
  createdByEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  createdByPhone: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Timeline Section
  timelineSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timelineCard: {
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
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Share History Section
  shareHistorySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  shareHistoryCard: {
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
  shareHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareHistoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  shareHistoryContent: {
    gap: 12,
  },
  shareHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  shareHistoryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareHistoryAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  shareHistoryAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shareHistoryInfo: {
    flex: 1,
  },
  shareHistoryNames: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  shareHistoryLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  shareHistoryDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  shareHistoryEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  shareHistoryEmptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    minWidth: 200,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Loading, Error, and Empty States
  loadingContainer: {
    flex: 1,
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
    flex: 1,
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
    flex: 1,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },

  // Edit Lead Modal Styles
  editLeadModalContent: {
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
  editLeadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editLeadModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  editLeadModalCloseButton: {
    padding: 4,
  },
  editLeadModalBody: {
    flex: 1,
    paddingBottom: 20,
  },
  editLeadModalBodyContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 10,
    minHeight: '100%',
  },
  editLeadModalFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  editLeadFieldContainer: {
    marginBottom: 20,
  },
  editLeadFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  editLeadTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editLeadTextInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  editLeadErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  editLeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  editLeadButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  editLeadButton: {
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
  editLeadButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#E5E5EA',
  },
  editLeadButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  editLeadButtonTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  editLeadBudgetContainer: {
    marginTop: 8,
    backgroundColor: 'white',
  },
  editLeadDropdownContainer: {
    position: 'relative',
  },
  editLeadDropdownButton: {
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
  editLeadDropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  editLeadDropdownPlaceholder: {
    color: '#9CA3AF',
  },
  editLeadDropdownMenu: {
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
  editLeadDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  editLeadDropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  editLeadCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editLeadCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  editLeadSubmitButton: {
    flex: 1,
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editLeadSubmitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  editLeadSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
})

export default LeadDetailsScreen
