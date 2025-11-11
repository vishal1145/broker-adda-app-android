import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { leadsAPI, authAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'

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
      return '₹0'
    } else if (val >= 1000000) {
      return `₹${(val / 1000000).toFixed(1)}M`
    } else if (val >= 1000) {
      return `₹${(val / 1000).toFixed(0)}K`
    }
    return `₹${val.toLocaleString()}`
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

const CreateLeadScreen = ({ navigation, route }) => {
  const { isEdit = false, leadId = null, leadData: initialLeadData = null, isTransferredLead = false } = route.params || {}
  
  // Add Lead state
  const [addLeadData, setAddLeadData] = useState({
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
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [regions, setRegions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [isLoadingLeadData, setIsLoadingLeadData] = useState(false)
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  // ScrollView refs for auto-scrolling
  const addLeadScrollRef = useRef(null)

  // Fetch regions on mount
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

  // Fetch lead data for edit mode
  const fetchLeadData = async () => {
    if (!isEdit || !leadId) return
    
    try {
      setIsLoadingLeadData(true)
      const token = await storage.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.getLeadDetails(leadId, token)
      
      if (response.success && response.data && response.data.lead) {
        const lead = response.data.lead
        setAddLeadData({
          customerName: lead.customerName || '',
          customerPhone: lead.customerPhone || '',
          customerEmail: lead.customerEmail || '',
          requirement: lead.requirement || '',
          propertyType: lead.propertyType || '',
          budget: lead.budget || 0,
          status: lead.status || '',
          primaryRegionId: lead.primaryRegion?._id || lead.region?._id || null,
          primaryRegionName: lead.primaryRegion?.name || lead.region?.name || '',
          secondaryRegionId: lead.secondaryRegion?._id || null,
          secondaryRegionName: lead.secondaryRegion?.name || ''
        })
      }
    } catch (error) {
      console.error('Error fetching lead data:', error)
      Snackbar.showError('Error', 'Failed to load lead data')
    } finally {
      setIsLoadingLeadData(false)
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

  // Add Lead handlers
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
    // Clear validation error when requirement is selected
    if (validationErrors.requirement) {
      setValidationErrors(prev => ({
        ...prev,
        requirement: ''
      }))
    }
  }

  const handleAddLeadPropertyTypeSelect = (propertyType) => {
    setAddLeadData(prev => ({
      ...prev,
      propertyType: propertyType
    }))
    // Clear validation error when property type is selected
    if (validationErrors.propertyType) {
      setValidationErrors(prev => ({
        ...prev,
        propertyType: ''
      }))
    }
  }

  const handlePrimaryRegionSelect = (regionName) => {
    const selectedRegion = regions.find(region => region.name === regionName)
    if (selectedRegion) {
      // If clicking the same region, deselect it
      if (addLeadData.primaryRegionId === selectedRegion._id) {
        setAddLeadData(prev => ({
          ...prev,
          primaryRegionId: null,
          primaryRegionName: ''
        }))
      } else {
        setAddLeadData(prev => ({
          ...prev,
          primaryRegionId: selectedRegion._id,
          primaryRegionName: selectedRegion.name
        }))
        // Clear validation error when primary region is selected
        if (validationErrors.primaryRegion) {
          setValidationErrors(prev => ({
            ...prev,
            primaryRegion: ''
          }))
        }
      }
    }
  }

  const handleSecondaryRegionSelect = (regionName) => {
    const selectedRegion = regions.find(region => region.name === regionName)
    if (selectedRegion) {
      // If clicking the same region, deselect it
      if (addLeadData.secondaryRegionId === selectedRegion._id) {
        setAddLeadData(prev => ({
          ...prev,
          secondaryRegionId: null,
          secondaryRegionName: ''
        }))
      } else {
        setAddLeadData(prev => ({
          ...prev,
          secondaryRegionId: selectedRegion._id,
          secondaryRegionName: selectedRegion.name
        }))
      }
    }
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
    Keyboard.dismiss()
  }

  // Validation function to check if form is valid (similar to CreatePropertyScreen)
  const isFormValid = () => {
    if (isTransferredLead && isEdit) {
      // For transferred leads, only validate status
      return !!addLeadData.status
    } else {
      // For regular leads, validate all required fields
      const nameValid = !validateName(addLeadData.customerName)
      const phoneValid = !validatePhoneNumber(addLeadData.customerPhone)
      const emailValid = !validateEmail(addLeadData.customerEmail)
      const requirementValid = !validateRequirement(addLeadData.requirement)
      const propertyTypeValid = !!addLeadData.propertyType
      const primaryRegionValid = !!addLeadData.primaryRegionId
      
      return nameValid && phoneValid && emailValid && requirementValid && propertyTypeValid && primaryRegionValid
    }
  }

  const handleAddLeadSubmit = async () => {
    try {
      setIsSubmittingLead(true)
      
      if (isTransferredLead && isEdit) {
        // For transferred leads, only validate status
        if (!addLeadData.status) {
          Snackbar.showError('Error', 'Please select a status')
          return
        }
      } else {
        // For regular leads, validate all fields
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
      }

      // Get authentication token
      const token = await storage.getToken()
      if (!token) {
        Snackbar.showError('Error', 'Authentication token not found. Please login again.')
        return
      }

      if (isEdit && leadId) {
        // Update existing lead
        let updateData
        
        if (isTransferredLead) {
          // For transferred leads, only send status
          updateData = {
            status: addLeadData.status
          }
        } else {
          // For regular leads, send all fields
          updateData = {
            customerName: addLeadData.customerName.trim(),
            customerPhone: addLeadData.customerPhone.trim(),
            customerEmail: addLeadData.customerEmail.trim(),
            requirement: addLeadData.requirement,
            propertyType: addLeadData.propertyType,
            budget: addLeadData.budget,
            status: addLeadData.status,
            primaryRegionId: addLeadData.primaryRegionId
          }

          // Add secondary region if selected
          if (addLeadData.secondaryRegionId) {
            updateData.secondaryRegionId = addLeadData.secondaryRegionId
          }
        }

        console.log('Updating lead with data:', updateData)

        const response = await leadsAPI.updateLead(leadId, updateData, token)
        
        if (response.success) {
          Snackbar.showSuccess('Success', response.message || 'Lead updated successfully!')
          navigation.goBack()
        } else {
          Snackbar.showError('Error', response.message || 'Failed to update lead')
        }
      } else {
        // Create new lead
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

        const response = await leadsAPI.createLead(leadData, token)
        
        if (response.success) {
          Snackbar.showSuccess('Success', response.message || 'Lead created successfully!')
          
          // Get the created lead ID from response
          const createdLeadId = response.data?.lead?._id || response.data?._id
          
          if (createdLeadId) {
            // Fetch the created lead details to navigate to ShareLeadScreen
            try {
              const leadDetailsResponse = await leadsAPI.getLeadDetails(createdLeadId, token)
              if (leadDetailsResponse.success && leadDetailsResponse.data && leadDetailsResponse.data.lead) {
                resetAddLeadForm()
                navigation.navigate('ShareLead', { lead: leadDetailsResponse.data.lead })
              } else if (response.data?.lead) {
                // Use lead data from create response if available
                resetAddLeadForm()
                navigation.navigate('ShareLead', { lead: response.data.lead })
              } else {
                // Fallback: navigate with minimal lead data
                resetAddLeadForm()
                navigation.navigate('ShareLead', { lead: { _id: createdLeadId, id: createdLeadId } })
              }
            } catch (error) {
              console.error('Error fetching lead details:', error)
              // Fallback: use lead data from create response or minimal data
              resetAddLeadForm()
              if (response.data?.lead) {
                navigation.navigate('ShareLead', { lead: response.data.lead })
              } else {
                navigation.navigate('ShareLead', { lead: { _id: createdLeadId, id: createdLeadId } })
              }
            }
          } else {
            // If no lead ID in response, just go back
            resetAddLeadForm()
            navigation.goBack()
          }
        } else {
          Snackbar.showError('Error', response.message || 'Failed to create lead')
        }
      }
      
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'adding'} lead:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEdit ? 'update' : 'create'} lead`
      Snackbar.showError('Error', errorMessage)
    } finally {
      setIsSubmittingLead(false)
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

  // Fetch regions on mount and load lead data if in edit mode
  useEffect(() => {
    fetchRegions()
    if (isEdit && leadId) {
      // If initialLeadData is provided, use it, otherwise fetch
      if (initialLeadData) {
        setAddLeadData({
          customerName: initialLeadData.customerName || '',
          customerPhone: initialLeadData.customerPhone || '',
          customerEmail: initialLeadData.customerEmail || '',
          requirement: initialLeadData.requirement || '',
          propertyType: initialLeadData.propertyType || '',
          budget: initialLeadData.budget || 0,
          status: initialLeadData.status || '',
          primaryRegionId: initialLeadData.primaryRegion?._id || initialLeadData.region?._id || null,
          primaryRegionName: initialLeadData.primaryRegion?.name || initialLeadData.region?.name || '',
          secondaryRegionId: initialLeadData.secondaryRegion?._id || null,
          secondaryRegionName: initialLeadData.secondaryRegion?.name || ''
        })
      } else {
        fetchLeadData()
      }
    }
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Keyboard.dismiss()
              navigation.goBack()
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          ref={addLeadScrollRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.singlePageForm}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{isEdit ? 'Update Lead' : 'Create new Lead'}</Text>
            </View>
            
            {/* Only show form fields for regular leads or when creating new leads */}
            {(!isEdit || !isTransferredLead) && (
              <>
            {/* Customer Name */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Customer Name *</Text>
              <TextInput
                style={[
                  styles.addLeadTextInput,
                  (!addLeadData.customerName.trim() || validationErrors.customerName) && styles.addLeadTextInputError
                ]}
                placeholder="Enter customer's full name"
                placeholderTextColor="#8E8E93"
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
              {!addLeadData.customerName.trim() && (
                <Text style={styles.addLeadErrorText}>Customer name is required.</Text>
              )}
              {addLeadData.customerName.trim() && validationErrors.customerName && (
                <Text style={styles.addLeadErrorText}>{validationErrors.customerName}</Text>
              )}
            </View>

            {/* Contact Phone */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Contact Phone *</Text>
              <TextInput
                style={[
                  styles.addLeadTextInput,
                  (!addLeadData.customerPhone.trim() || validationErrors.customerPhone) && styles.addLeadTextInputError
                ]}
                placeholder="Enter 10-digit phone number"
                placeholderTextColor="#8E8E93"
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
              {!addLeadData.customerPhone.trim() && (
                <Text style={styles.addLeadErrorText}>Phone number is required.</Text>
              )}
              {addLeadData.customerPhone.trim() && validationErrors.customerPhone && (
                <Text style={styles.addLeadErrorText}>{validationErrors.customerPhone}</Text>
              )}
            </View>

            {/* Contact Email */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Contact Email *</Text>
              <TextInput
                style={[
                  styles.addLeadTextInput,
                  (!addLeadData.customerEmail.trim() || validationErrors.customerEmail) && styles.addLeadTextInputError
                ]}
                placeholder="e.g., john.doe@example.com"
                placeholderTextColor="#8E8E93"
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
              {!addLeadData.customerEmail.trim() && (
                <Text style={styles.addLeadErrorText}>Email is required.</Text>
              )}
              {addLeadData.customerEmail.trim() && validationErrors.customerEmail && (
                <Text style={styles.addLeadErrorText}>{validationErrors.customerEmail}</Text>
              )}
            </View>

            {/* Requirement */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Requirement *</Text>
              <View style={styles.addLeadButtonGroup}>
                {['Buy', 'Rent', 'Sell'].map((req) => (
                  <TouchableOpacity
                    key={req}
                    style={[
                      styles.addLeadFormButton,
                      addLeadData.requirement === req && styles.addLeadFormButtonActive
                    ]}
                    onPress={() => handleAddLeadRequirementSelect(req)}
                  >
                    <Text style={[
                      styles.addLeadFormButtonText,
                      addLeadData.requirement === req && styles.addLeadFormButtonTextActive
                    ]}>
                      {req}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!addLeadData.requirement && (
                <Text style={styles.addLeadErrorText}>Requirement is required.</Text>
              )}
            </View>

            {/* Property Type */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Property Type *</Text>
              <View style={styles.addLeadButtonGroup}>
                {['Residential', 'Commercial', 'Plot', 'Other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.addLeadFormButton,
                      addLeadData.propertyType === type && styles.addLeadFormButtonActive
                    ]}
                    onPress={() => handleAddLeadPropertyTypeSelect(type)}
                  >
                    <Text style={[
                      styles.addLeadFormButtonText,
                      addLeadData.propertyType === type && styles.addLeadFormButtonTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!addLeadData.propertyType && (
                <Text style={styles.addLeadErrorText}>Property type is required.</Text>
              )}
            </View>

            {/* Budget */}
            <View style={styles.addLeadFieldContainer}>
              <CustomSlider
                value={addLeadData.budget}
                onValueChange={(value) => handleAddLeadFieldChange('budget', value)}
                min={0}
                max={10000000}
                step={100000}
              />
            </View>

            {/* Primary Region Selection */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Primary Region *</Text>
              {isLoadingRegions ? (
                <View style={styles.addLeadButtonGroup}>
                  <ActivityIndicator size="small" color="#0D542BFF" />
                  <Text style={{ marginLeft: 8, color: '#8E8E93' }}>Loading regions...</Text>
                </View>
              ) : regions.length === 0 ? (
                <View style={styles.addLeadButtonGroup}>
                  <Text style={{ color: '#8E8E93' }}>No regions available</Text>
                </View>
              ) : (
                <>
                  <View style={styles.addLeadButtonGroup}>
                    {regions.map((region) => (
                      <TouchableOpacity
                        key={region._id}
                        style={[
                          styles.addLeadFormButton,
                          addLeadData.primaryRegionId === region._id && styles.addLeadFormButtonActive
                        ]}
                        onPress={() => handlePrimaryRegionSelect(region.name)}
                      >
                        <Text style={[
                          styles.addLeadFormButtonText,
                          addLeadData.primaryRegionId === region._id && styles.addLeadFormButtonTextActive
                        ]}>
                          {region.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {!addLeadData.primaryRegionId && (
                    <Text style={styles.addLeadErrorText}>Primary region is required.</Text>
                  )}
                </>
              )}
            </View>

            {/* Secondary Region Selection */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Secondary Region (Optional)</Text>
              {isLoadingRegions ? (
                <View style={styles.addLeadButtonGroup}>
                  <ActivityIndicator size="small" color="#0D542BFF" />
                  <Text style={{ marginLeft: 8, color: '#8E8E93' }}>Loading regions...</Text>
                </View>
              ) : regions.length === 0 ? (
                <View style={styles.addLeadButtonGroup}>
                  <Text style={{ color: '#8E8E93' }}>No regions available</Text>
                </View>
              ) : (
                <View style={styles.addLeadButtonGroup}>
                  {regions.map((region) => (
                    <TouchableOpacity
                      key={region._id}
                      style={[
                        styles.addLeadFormButton,
                        addLeadData.secondaryRegionId === region._id && styles.addLeadFormButtonActive
                      ]}
                      onPress={() => handleSecondaryRegionSelect(region.name)}
                    >
                      <Text style={[
                        styles.addLeadFormButtonText,
                        addLeadData.secondaryRegionId === region._id && styles.addLeadFormButtonTextActive
                      ]}>
                        {region.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
              </>
            )}

            {/* Status Field - Only show for transferred leads in edit mode */}
            {isTransferredLead && isEdit && (
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Status *</Text>
                <View style={styles.addLeadButtonGroup}>
                  {['New', 'Assigned', 'In Progress', 'Rejected', 'Closed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.addLeadFormButton,
                        addLeadData.status === status && styles.addLeadFormButtonActive
                      ]}
                      onPress={() => handleAddLeadFieldChange('status', status)}
                    >
                      <Text style={[
                        styles.addLeadFormButtonText,
                        addLeadData.status === status && styles.addLeadFormButtonTextActive
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {!addLeadData.status && (
                  <Text style={styles.addLeadErrorText}>Status is required.</Text>
                )}
              </View>
            )}

            {/* Status Field - Show for regular leads in edit mode */}
            {!isTransferredLead && isEdit && (
              <View style={styles.addLeadFieldContainer}>
                <Text style={styles.addLeadFieldLabel}>Status</Text>
                <View style={styles.addLeadButtonGroup}>
                  {['New', 'Assigned', 'In Progress', 'Rejected', 'Closed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.addLeadFormButton,
                        addLeadData.status === status && styles.addLeadFormButtonActive
                      ]}
                      onPress={() => handleAddLeadFieldChange('status', status)}
                    >
                      <Text style={[
                        styles.addLeadFormButtonText,
                        addLeadData.status === status && styles.addLeadFormButtonTextActive
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  (!isFormValid() || isSubmittingLead) ? styles.actionButtonDisabled : null
                ]} 
                onPress={handleAddLeadSubmit}
                disabled={isSubmittingLead || isLoadingLeadData || !isFormValid()}
              >
                {isSubmittingLead ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
                      {isEdit ? 'Updating Lead...' : 'Creating Lead...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.actionButtonText}>
                    {isEdit ? 'Update Lead' : 'Create Lead'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  singlePageForm: {
    flex: 1,
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 5,
    lineHeight: 30,
  },
  addLeadFieldContainer: {
    marginBottom: 16,
  },
  addLeadFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 16,
    color: '#000000',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#8E8E93',
    borderColor: '#E0E0E0',
  },
  addLeadTextInput: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#000000',
  },
  addLeadTextInputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  addLeadErrorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.5,
    marginBottom: 0,
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalList: {
    maxHeight: Dimensions.get('window').height * 0.3,
    paddingBottom: 0,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  actionButtonContainer: {
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#0D542BFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#0D542BFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#0D542BFF',
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: 8,
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

export default CreateLeadScreen

