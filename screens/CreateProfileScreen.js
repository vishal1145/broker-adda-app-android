import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  ActionSheetIOS,
  PermissionsAndroid,
  Alert,
  Dimensions
} from 'react-native'
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { Snackbar } from '../utils/snackbar'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { authAPI, placesAPI } from '../services/api'
import { storage } from '../services/storage'
import * as Location from 'expo-location'

const CreateProfileScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1) // 1: Personal Info, 2: Professional, 3: Regions, 4: Documents
  const scrollViewRef = useRef(null)
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    firmName: '',
    whatsappNumber: '',
    
    // Professional
    licenseNumber: '',
    address: '',
    specializations: [],
    
    // Social Media
    linkedin: '',
    instagram: '',
    website: '',
    twitter: '',
    facebook: '',
    
    // Regions
    state: '',
    city: '',
    regions: '',
    selectedRegionId: '',
    
    // Documents
    aadharCard: null,
    panCard: null,
    gstCertificate: null,
    brokerLicense: null,
    companyId: null
  })

  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showSpecializationModal, setShowSpecializationModal] = useState(false)
  const [showStateModal, setShowStateModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [showRegionModal, setShowRegionModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState({
    aadharCard: false,
    panCard: false,
    gstCertificate: false,
    brokerLicense: false,
    companyId: false
  })
  const [selectedImages, setSelectedImages] = useState({
    aadharCard: null,
    panCard: null,
    gstCertificate: null,
    brokerLicense: null,
    companyId: null
  })
  const [existingDocs, setExistingDocs] = useState({
    aadharCard: null,
    panCard: null,
    gstCertificate: null,
    brokerLicense: null,
    companyId: null
  })
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageLoading, setProfileImageLoading] = useState(false)
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  const [nearbyRegionsList, setNearbyRegionsList] = useState([])
  const [manualRegionsList, setManualRegionsList] = useState([])
  const [regionsLoading, setRegionsLoading] = useState(false)
  const [addressDetails, setAddressDetails] = useState({
    formattedAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: null,
    longitude: null
  })
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressDebounceTimer, setAddressDebounceTimer] = useState(null)
  const [showManualRegionSelection, setShowManualRegionSelection] = useState(false)
  const [selectedRegionId, setSelectedRegionId] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  const genderOptions = ['Male', 'Female', 'Other']
  const specializations = ['Residential', 'Commercial', 'Industrial', 'Land', 'Rental', 'Investment']
  const states = ['Uttar Pradesh']
  const cities = ['Noida', 'Agra']

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // WhatsApp number validation
  const validateWhatsAppNumber = (number) => {
    if (!number || number.trim() === '') {
      return { isValid: true, error: '' } // Optional field
    }
    
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, '')
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6,7,8,9)
    if (cleanNumber.length === 10) {
      const firstDigit = cleanNumber[0]
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        return { isValid: true, error: '' }
      }
    }
    
    // Check if it's a valid Indian mobile number with country code (11 digits starting with 91)
    if (cleanNumber.length === 11 && cleanNumber.startsWith('91')) {
      const mobilePart = cleanNumber.substring(2)
      const firstDigit = mobilePart[0]
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        return { isValid: true, error: '' }
      }
    }
    
    // Check if it's a valid Indian mobile number with +91 (12 digits starting with 91)
    if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      const mobilePart = cleanNumber.substring(2)
      const firstDigit = mobilePart[0]
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        return { isValid: true, error: '' }
      }
    }
    
    return { 
      isValid: false, 
      error: 'Please enter a valid 10-digit mobile number (e.g., 9876543210)' 
    }
  }

  // Handle WhatsApp number change with validation
  const handleWhatsAppNumberChange = (text) => {
    updateFormData('whatsappNumber', text)
  }

  // Use current phone number for WhatsApp
  const handleUseCurrentPhoneNumber = () => {
    if (formData.phone && formData.phone.trim()) {
      updateFormData('whatsappNumber', formData.phone)
      Snackbar.showSuccess('Phone Number Copied', 'Current phone number has been copied to WhatsApp field')
    } else {
      Snackbar.showError('No Phone Number', 'Please enter your phone number first')
    }
  }

  // Step validation functions
  const isStep1Valid = () => {
    // Step 1: Personal Information - validate required fields
    const basicValidation = formData.fullName.trim() && 
           formData.gender && 
           formData.email.trim() && 
           formData.phone.trim() && 
           formData.firmName.trim()
    
    // If WhatsApp number is provided, it must be valid
    if (formData.whatsappNumber && formData.whatsappNumber.trim()) {
      const whatsappValidation = validateWhatsAppNumber(formData.whatsappNumber)
      return basicValidation && whatsappValidation.isValid
    }
    
    return basicValidation
  }

  const isStep2Valid = () => {
    // Step 2: Professional Information - validate required fields
    return formData.licenseNumber.trim() && 
           formData.address.trim()
  }

  const isStep3Valid = () => {
    // Step 3: Regions - always require state, city, and region selection
    return formData.state && 
           formData.city && 
           formData.selectedRegionId
  }

  const isStep4Valid = () => {
    // Step 4: Documents - no validation required, all optional
    return true
  }

  // Navigation functions
  const goToNextStep = async () => {
    if (currentStep < 4) {
      // If moving from step 1 to step 2, verify email first
      if (currentStep === 1) {
        await verifyEmailAndProceed()
      } else {
        setCurrentStep(currentStep + 1)
        // Scroll to top when going to next step
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true })
        }, 100)
      }
    }
  }

  // Verify email before proceeding to next step
  const verifyEmailAndProceed = async () => {
    try {
      // Validate email format first
      if (!formData.email.trim()) {
        Snackbar.showValidationError('Please enter your email address')
        return
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        Snackbar.showValidationError('Please enter a valid email address')
        return
      }

      // Show loading state
      setIsLoading(true)

      // Get current user ID from storage (if available)
      const brokerId = await storage.getBrokerId()
      
      // Call checkEmail API
      const response = await authAPI.checkEmail(formData.email.trim(), brokerId || null)
      
      setIsLoading(false)

      if (response.success) {
        if (response.data.exists) {
          // Email already exists
          Snackbar.showError('Email Already in Use', response.data.message)
          return
        } else {
          // Email is available, proceed to next step
          setCurrentStep(currentStep + 1)
          // Scroll to top when going to next step
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true })
          }, 100)
          Snackbar.showSuccess('Email Verified', 'Email is available for use')
        }
      } else {
        Snackbar.showError('Verification Failed', 'Unable to verify email. Please try again.')
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Email verification error:', error)
      Snackbar.showApiError('Failed to verify email. Please try again.')
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      // Scroll to top when going to previous step
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      }, 100)
    }
  }

  const getStepTitle = () => {
    return 'Create Broker Profile'
  }

  const getStepDescription = () => {
    return ''
  }

  // Handle region selection from cards
  const handleRegionSelect = (region) => {
    // Set region data
    setSelectedRegionId(region._id)
    updateFormData('regions', region.name)
    updateFormData('selectedRegionId', region._id)
    
    // For nearby regions, extract state and city from the region data
    if (!showManualRegionSelection) {
      // Extract state and city from the selected region
      if (region.state) {
        updateFormData('state', region.state)
      }
      if (region.city) {
        updateFormData('city', region.city)
      }
    }
    
    Snackbar.showSuccess('Region Selected', `${region.name} has been selected`)
  }

  // Render region cards
  const renderRegionCards = () => {
    // Use nearby regions when in nearby mode, manual regions when in manual mode
    const currentRegionsList = showManualRegionSelection ? manualRegionsList : nearbyRegionsList
    
    if (!currentRegionsList || currentRegionsList.length === 0) {
      return (
        <View style={styles.noRegionsContainer}>
          <MaterialIcons name="location-off" size={48} color="#8E8E93" />
          <Text style={styles.noRegionsText}>No regions available</Text>
          <Text style={styles.noRegionsSubtext}>
            {showManualRegionSelection 
              ? 'Try selecting a different city' 
              : 'No nearby regions found for your location'}
          </Text>
        </View>
      )
    }

    // Debug logging
    console.log('Regions data:', currentRegionsList)
    currentRegionsList.forEach((region, index) => {
      console.log(`Region ${index}:`, {
        name: region.name,
        distanceKm: region.distanceKm,
        type: typeof region.distanceKm
      })
    })

    return (
      <View style={styles.regionCardsContainer}>
        <View style={styles.regionCardsList}>
          {currentRegionsList.map((region, index) => (
            <TouchableOpacity
              key={region._id}
              style={[
                styles.regionCard,
                selectedRegionId === region._id && styles.regionCardSelected
              ]}
              onPress={() => handleRegionSelect(region)}
            >
              <Text style={styles.regionCardName} numberOfLines={2}>
                {region.name}
              </Text>
              <Text style={styles.regionCardAddress} numberOfLines={2}>
                {region.centerLocation}
              </Text>
              <View style={styles.regionCardDetails}>
                <Text style={styles.regionCardDistance}>
                  {region.distanceKm !== null && region.distanceKm !== undefined ? 
                    `${Number(region.distanceKm).toFixed(1)} km away` : 
                    '0.0 km away'}
                </Text>
                <Text style={styles.regionCardBrokers}>
                  {region.brokerCount} Broker{region.brokerCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  // Fetch address suggestions from Google Places API
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 1) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }

    try {
      setAddressLoading(true)
      console.log('Fetching address suggestions for:', query)
      const result = await placesAPI.getAddressSuggestions(query)
      
      if (result.success && result.data.length > 0) {
        console.log('Address suggestions received:', result.data.length, 'suggestions')
        setAddressSuggestions(result.data)
        setShowAddressSuggestions(true)
      } else {
        console.log('No address suggestions found')
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
        if (result.error) {
          console.log('Address suggestions error:', result.error)
        }
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
    } finally {
      setAddressLoading(false)
    }
  }

  // Handle address selection from suggestions
  const handleAddressSelect = async (placeId, description) => {
    try {
      console.log('Address selection triggered:', { placeId, description })
      setAddressLoading(true)
      setShowAddressSuggestions(false)
      
      // Fetch place details using API
      const result = await placesAPI.getPlaceDetails(placeId)
      
      if (result.success && result.data) {
        const details = result.data
        console.log('Selected address details:', details)
        
        // Extract address components safely
        const addressComponents = Array.isArray(details.address_components) ? details.address_components : []
        let city = ''
        let state = ''
        let country = ''
        let postalCode = ''
        
        addressComponents.forEach(component => {
          if (component && component.types && Array.isArray(component.types)) {
            const types = component.types
            if (types.includes('locality')) {
              city = component.long_name || ''
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name || ''
            } else if (types.includes('country')) {
              country = component.long_name || ''
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name || ''
            }
          }
        })
        
        // Update address details
        setAddressDetails({
          formattedAddress: details.formatted_address || description || '',
          city: city,
          state: state,
          country: country,
          postalCode: postalCode,
          latitude: details.geometry?.location?.lat || null,
          longitude: details.geometry?.location?.lng || null
        })
        
        // Update form data with the formatted address
        updateFormData('address', details.formatted_address || description || '')
        
        // Auto-populate city and state if they match our available options
        if (state && states.includes(state)) {
          updateFormData('state', state)
        }
        if (city && cities.includes(city)) {
          updateFormData('city', city)
        }
        
        // Fetch nearest regions using address coordinates only
        const lat = details.geometry?.location?.lat
        const lng = details.geometry?.location?.lng
        if (lat && lng) {
          console.log('Address selected with coordinates, fetching nearby regions based on address:', { lat, lng })
          await fetchNearestRegions(lat, lng)
        } else if (city) {
          // Fallback to city-based regions if coordinates are not available
          console.log('Address selected without coordinates, fetching regions for city:', city)
          fetchRegions(city)
        }
        
        Snackbar.showSuccess('Address Selected', 'Address details have been populated')
      } else {
        console.error('Failed to get place details:', result.error)
        Snackbar.showError('Error', 'Failed to get address details')
      }
    } catch (error) {
      console.error('Error handling address selection:', error)
      Snackbar.showError('Error', 'Failed to process address selection')
    } finally {
      setAddressLoading(false)
    }
  }

  // Handle address input change with debouncing
  const handleAddressChange = (text) => {
    updateFormData('address', text)
    
    // Clear existing timer
    if (addressDebounceTimer) {
      clearTimeout(addressDebounceTimer)
    }
    
    if (text.length >= 1) {
      // Set new timer for debounced API call
      const timer = setTimeout(() => {
        fetchAddressSuggestions(text)
      }, 300) // 300ms debounce
      setAddressDebounceTimer(timer)
    } else {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
    }
  }

  // Fetch regions based on selected city
  const fetchRegions = async (city) => {
    if (!city) {
      setManualRegionsList([])
      return
    }

    try {
      setRegionsLoading(true)
      const response = await authAPI.getRegions(city)
      
      if (response.success && response.data && response.data.regions) {
        setManualRegionsList(response.data.regions)
        console.log('Manual regions fetched:', response.data.regions.length, 'regions')
      } else {
        console.error('Failed to fetch regions:', response.message)
        setManualRegionsList([])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
      setManualRegionsList([])
    } finally {
      setRegionsLoading(false)
    }
  }

  // Fetch nearest regions based on latitude and longitude
  const fetchNearestRegions = async (latitude, longitude, limit = 5) => {
    if (!latitude || !longitude) {
      setNearbyRegionsList([])
      return
    }

    try {
      setRegionsLoading(true)
      const response = await authAPI.getNearestRegions(latitude, longitude, limit)
      
      if (response.success && response.data && response.data.regions) {
        setNearbyRegionsList(response.data.regions)
        console.log('Nearest regions fetched:', response.data.regions.length, 'regions')
      } else {
        console.error('Failed to fetch nearest regions:', response.message)
        setNearbyRegionsList([])
      }
    } catch (error) {
      console.error('Error fetching nearest regions:', error)
      setNearbyRegionsList([])
    } finally {
      setRegionsLoading(false)
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

  // Helper function to check if a file is an image
  const isImageFile = (url) => {
    if (!url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext))
  }

  // Helper function to check if a file is a PDF
  const isPdfFile = (url) => {
    if (!url) return false
    const lowerUrl = url.toLowerCase()
    return lowerUrl.includes('.pdf')
  }

  // Helper function to get file type icon
  const getFileTypeIcon = (url) => {
    if (isPdfFile(url)) {
      return 'picture-as-pdf'
    } else if (isImageFile(url)) {
      return 'image'
    } else {
      return 'description'
    }
  }

  // Helper function to handle image loading errors
  const handleImageError = (imageType, error) => {
    console.log(`Image load error for ${imageType}:`, error)
    setImageLoadErrors(prev => ({
      ...prev,
      [imageType]: true
    }))
  }

  // Retry loading an image
  const retryImageLoad = (imageType) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [imageType]: false
    }))
  }

  // Enhanced image component with fallback
  const SafeImage = ({ source, style, imageType, ...props }) => {
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
        handleImageError(imageType, error)
      }
    }

    const retry = () => {
      setImageError(false)
      setCurrentSource(source)
    }

    if (imageError) {
      return (
        <View style={[style, { backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }]}>
          <MaterialIcons name="broken-image" size={24} color="#8E8E93" />
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retry}
          >
            <MaterialIcons name="refresh" size={12} color="#009689" />
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

  // Fetch existing profile data
  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      
      // Get token and broker ID from storage
      const token = await storage.getToken()
      const brokerId = await storage.getBrokerId()
      
      if (token && brokerId) {
        const response = await authAPI.getProfile(brokerId, token)
        
        // Map API response to form data based on actual response structure
        if (response && response.data && response.data.broker) {
          const broker = response.data.broker
          setFormData(prev => ({
            ...prev,
            // Personal Info
            fullName: broker.name || broker.userId?.name || '',
            email: broker.email || broker.userId?.email || '',
            phone: broker.phone || broker.userId?.phone || '',
            gender: broker.gender || '',
            firmName: broker.firmName || '',
            whatsappNumber: broker.whatsappNumber || '',
            
            // Professional
            licenseNumber: broker.licenseNumber || '',
            address: broker.address || '',
            specializations: broker.specializations || [],
            
            // Social Media (these might not be in the response yet)
            linkedin: broker.socialMedia?.linkedin || '',
            instagram: broker.socialMedia?.instagram || '',
            website: broker.website || '',
            twitter: broker.socialMedia?.twitter || '',
            facebook: broker.socialMedia?.facebook || '',
            
            // Regions
            state: broker.state || '',
            city: broker.city || '',
            regions: broker.region?.[0]?.name || '', // Using first region name
            selectedRegionId: broker.region?.[0]?._id || '', // Using first region ID
          }))
          
          // Set existing profile image if available
          if (broker.brokerImage) {
            const secureImageUrl = getSecureImageUrl(broker.brokerImage)
            // Only set as profile image if it's actually an image file
            if (isImageFile(secureImageUrl)) {
              setProfileImage({
                uri: secureImageUrl,
                type: 'image/jpeg',
                fileName: 'profile.jpg'
              })
            }
          }
          
          // Set selected region ID for highlighting
          if (broker.region?.[0]?._id) {
            setSelectedRegionId(broker.region[0]._id)
          }
          
          // Fetch regions based on stored profile data only
          if (broker.location?.coordinates && Array.isArray(broker.location.coordinates) && broker.location.coordinates.length >= 2) {
            const [latitude, longitude] = broker.location.coordinates
            console.log('Fetching nearby regions based on stored profile coordinates:', { latitude, longitude })
            await fetchNearestRegions(latitude, longitude)
          }
          
          if (broker.city) {
            console.log('Fetching manual regions based on stored city:', broker.city)
            await fetchRegions(broker.city)
          }
          
          // Check for uploaded documents
          if (broker.kycDocs) {
            setUploadedDocs({
              aadharCard: !!broker.kycDocs.aadhar,
              panCard: !!broker.kycDocs.pan,
              gstCertificate: !!broker.kycDocs.gst,
              brokerLicense: !!broker.kycDocs.brokerLicense,
              companyId: !!broker.kycDocs.companyId
            })
            
            // Set existing document URLs for display with secure URLs
            setExistingDocs({
              aadharCard: getSecureImageUrl(broker.kycDocs.aadhar) || null,
              panCard: getSecureImageUrl(broker.kycDocs.pan) || null,
              gstCertificate: getSecureImageUrl(broker.kycDocs.gst) || null,
              brokerLicense: getSecureImageUrl(broker.kycDocs.brokerLicense) || null,
              companyId: getSecureImageUrl(broker.kycDocs.companyId) || null
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Don't show error to user as this is optional data loading
    } finally {
      setIsLoading(false)
    }
  }

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData()
  }, [])

  // Debug effect to track document states
  useEffect(() => {
    console.log('Document states updated:', {
      uploadedDocs,
      selectedImages: Object.keys(selectedImages).reduce((acc, key) => {
        acc[key] = selectedImages[key] ? selectedImages[key].uri : null
        return acc
      }, {}),
      existingDocs
    })
  }, [uploadedDocs, selectedImages, existingDocs])

  // Load nearby regions when in nearby mode and no regions are loaded
  // Only fetch if we have address coordinates, not current location
  useEffect(() => {
    if (!showManualRegionSelection && nearbyRegionsList.length === 0 && !regionsLoading) {
      // Only fetch nearby regions if we have address coordinates from the profile
      // Don't automatically fetch current location
      console.log('Nearby mode enabled but no automatic location fetch - waiting for address selection')
    }
  }, [showManualRegionSelection, nearbyRegionsList.length, regionsLoading])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (addressDebounceTimer) {
        clearTimeout(addressDebounceTimer)
      }
    }
  }, [addressDebounceTimer])

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        )
        return granted === PermissionsAndroid.RESULTS.GRANTED
      } catch (err) {
        console.warn(err)
        return false
      }
    }
    return true
  }

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Snackbar.showError('Permission Denied', 'Location permission is required to use current location')
        return false
      }
      return true
    } catch (error) {
      console.error('Error requesting location permission:', error)
      Snackbar.showError('Error', 'Failed to request location permission')
      return false
    }
  }

  // Get current location coordinates
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true)
      
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync()
      if (!isLocationEnabled) {
        Snackbar.showError('Location Services Disabled', 'Please enable location services in your device settings')
        return null
      }

      // Request permission
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        return null
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000
      })

      console.log('Current location:', location.coords)
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      Snackbar.showError('Location Error', 'Failed to get current location. Please try again.')
      return null
    } finally {
      setLocationLoading(false)
    }
  }

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      console.log('Getting address for coordinates:', { latitude, longitude })
      
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      })

      if (result && result.length > 0) {
        const address = result[0]
        console.log('Reverse geocoding result:', address)
        
        // Format the address
        const addressParts = []
        if (address.street) addressParts.push(address.street)
        if (address.streetNumber) addressParts.push(address.streetNumber)
        if (address.district) addressParts.push(address.district)
        if (address.city) addressParts.push(address.city)
        if (address.region) addressParts.push(address.region)
        if (address.postalCode) addressParts.push(address.postalCode)
        if (address.country) addressParts.push(address.country)
        
        const formattedAddress = addressParts.join(', ')
        
        return {
          formattedAddress,
          city: address.city || '',
          state: address.region || '',
          country: address.country || '',
          postalCode: address.postalCode || '',
          latitude,
          longitude
        }
      } else {
        throw new Error('No address found for the given coordinates')
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error)
      throw error
    }
  }

  // Handle use current location button press
  const handleUseCurrentLocation = async () => {
    try {
      // Get current location
      const coordinates = await getCurrentLocation()
      if (!coordinates) {
        return
      }

      // Get address from coordinates
      const addressDetails = await getAddressFromCoordinates(
        coordinates.latitude, 
        coordinates.longitude
      )

      // Update address details state
      setAddressDetails(addressDetails)
      
      // Update form data with the formatted address
      updateFormData('address', addressDetails.formattedAddress)
      
      // Auto-populate city and state if they match our available options
      if (addressDetails.state && states.includes(addressDetails.state)) {
        updateFormData('state', addressDetails.state)
      }
      if (addressDetails.city && cities.includes(addressDetails.city)) {
        updateFormData('city', addressDetails.city)
      }
      
      // Fetch nearest regions using the address coordinates
      await fetchNearestRegions(coordinates.latitude, coordinates.longitude)
      
      Snackbar.showSuccess('Location Found', 'Current address has been filled automatically')
    } catch (error) {
      console.error('Error using current location:', error)
      Snackbar.showError('Error', 'Failed to get current address. Please try again.')
    }
  }

  // Show image picker options
  const showImagePickerOptions = (docType) => {
    if (Platform.OS === 'ios') {
    const options = ['Camera', 'Gallery', 'Documents', 'Cancel']
    const cancelButtonIndex = 3

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: `Select ${docType}`
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          // Camera
          handleImageSelection(docType, 'camera')
        } else if (buttonIndex === 1) {
          // Gallery
          handleImageSelection(docType, 'gallery')
        } else if (buttonIndex === 2) {
          // Documents
          handleImageSelection(docType, 'documents')
        }
      }
    )
    } else {
      // For Android, show action sheet using Alert
      Alert.alert(
        `Select ${docType}`,
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: () => handleImageSelection(docType, 'camera')
          },
          {
            text: 'Gallery',
            onPress: () => handleImageSelection(docType, 'gallery')
          },
          {
            text: 'Documents',
            onPress: () => handleImageSelection(docType, 'documents')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      )
    }
  }

  // Handle image selection
  const handleImageSelection = async (docType, source) => {
    if (source === 'camera') {
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) {
        Snackbar.showError('Permission Denied', 'Camera permission is required to take photos')
        return
      }
    }

    let options, callback

    if (source === 'documents') {
      // For document selection, use Expo document picker
      const documentOptions = {
        type: '*/*',
        copyToCacheDirectory: true,
      }

      try {
        DocumentPicker.getDocumentAsync(documentOptions).then((response) => {
          if (response && !response.canceled && response.assets && response.assets.length > 0) {
            const asset = response.assets[0]
            console.log('Selected document for', docType, ':', asset)
            
            // Ensure the asset has the correct structure for FormData
            const formattedAsset = {
              uri: asset.uri,
              type: asset.type || 'application/pdf',
              fileName: asset.name || `${docType}.pdf`,
              name: asset.name || `${docType}.pdf`
            }
            
            // Update all states properly
            setSelectedImages(prev => ({
              ...prev,
              [docType]: formattedAsset
            }))
            setUploadedDocs(prev => ({
              ...prev,
              [docType]: true
            }))
            // Clear existing document when new one is selected
            setExistingDocs(prev => ({
              ...prev,
              [docType]: null
            }))
            
            console.log('Document states updated for', docType, ':', {
              selectedImage: formattedAsset,
              uploaded: true,
              existing: null
            })
            
            Snackbar.showSuccess('Success', `${docType} document selected successfully!`)
          }
        }).catch((err) => {
          if (err.message && err.message.includes('cancelled')) {
            console.log('User cancelled document picker')
          } else {
            console.log('DocumentPicker Error: ', err)
            Snackbar.showError('Error', 'Failed to select document')
          }
        })
      } catch (error) {
        console.log('DocumentPicker Error: ', error)
        Snackbar.showError('Error', 'Failed to select document')
      }
    } else {
      // For camera and gallery, use image picker
      options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2000,
        maxHeight: 2000,
        includeBase64: false,
      }

      callback = (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker')
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage)
          Snackbar.showError('Error', 'Failed to select image')
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0]
          console.log('Selected asset for', docType, ':', asset)
          
          // Ensure the asset has the correct structure for FormData
          const formattedAsset = {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || asset.name || `${docType}.jpg`,
            name: asset.fileName || asset.name || `${docType}.jpg`
          }
          
          // Update all states properly
          setSelectedImages(prev => ({
            ...prev,
            [docType]: formattedAsset
          }))
          setUploadedDocs(prev => ({
            ...prev,
            [docType]: true
          }))
          // Clear existing document when new one is selected
          setExistingDocs(prev => ({
            ...prev,
            [docType]: null
          }))
          
          console.log('Image states updated for', docType, ':', {
            selectedImage: formattedAsset,
            uploaded: true,
            existing: null
          })
          
          Snackbar.showSuccess('Success', `${docType} image selected successfully!`)
        }
      }

      if (source === 'camera') {
        launchCamera(options, callback)
      } else {
        launchImageLibrary(options, callback)
      }
    }
  }

  // Handle document upload
  const handleDocumentUpload = (docType) => {
      showImagePickerOptions(docType)
  }

  // Handle view uploaded document - now opens gallery for editing
  const handleViewDocument = (docType) => {
    handleDocumentUpload(docType)
  }

  // Handle remove document
  const handleRemoveDocument = (docType) => {
    // Clear the selected image
    setSelectedImages(prev => ({
      ...prev,
      [docType]: null
    }))
    
    // Mark as not uploaded
    setUploadedDocs(prev => ({
      ...prev,
      [docType]: false
    }))
    
    // Clear existing document if it was from API
    setExistingDocs(prev => ({
      ...prev,
      [docType]: null
    }))
    
    console.log(`Document ${docType} removed - all states cleared`)
    
    Snackbar.showSuccess('Document Removed', `${docType} has been removed successfully`)
  }

  // Handle profile image upload
  const handleProfileImageUpload = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Camera', 'Photo Library', 'Cancel'],
          cancelButtonIndex: 2,
          title: 'Select Profile Image'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Camera
            handleProfileImageSelection('camera')
          } else if (buttonIndex === 1) {
            // Gallery
            handleProfileImageSelection('gallery')
          }
        }
      )
    } else {
      // For Android, show action sheet using Alert
      Alert.alert(
        'Select Profile Image',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: () => handleProfileImageSelection('camera')
          },
          {
            text: 'Gallery',
            onPress: () => handleProfileImageSelection('gallery')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      )
    }
  }

  // Handle profile image selection
  const handleProfileImageSelection = async (source) => {
    if (source === 'camera') {
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) {
        Snackbar.showError('Camera permission is required to take photos')
      return
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
    }

    const callback = (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker')
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage)
        Snackbar.showError('Error', 'Failed to select image')
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0]
        console.log('Selected profile image asset:', asset)
        
        // Ensure the asset has the correct structure for FormData
        const formattedAsset = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || asset.name || 'profile.jpg',
          name: asset.fileName || asset.name || 'profile.jpg'
        }
        
        setProfileImage(formattedAsset)
        Snackbar.showSuccess('Profile image selected successfully')
      }
    }

    if (source === 'camera') {
      launchCamera(options, callback)
    } else {
      launchImageLibrary(options, callback)
    }
  }

  const validateForm = () => {
    // Personal Info validation
        if (!formData.fullName.trim()) {
          Snackbar.showValidationError('Please enter your full name')
          return false
        }
        if (!formData.gender) {
          Snackbar.showValidationError('Please select your gender')
          return false
        }
        if (!formData.email.trim()) {
          Snackbar.showValidationError('Please enter your email address')
          return false
        }
        if (!formData.phone.trim()) {
          Snackbar.showValidationError('Please enter your phone number')
          return false
        }
        if (!formData.firmName.trim()) {
          Snackbar.showValidationError('Please enter your firm name')
          return false
        }
        
        // WhatsApp number validation (optional but must be valid if provided)
        if (formData.whatsappNumber && formData.whatsappNumber.trim()) {
          const whatsappValidation = validateWhatsAppNumber(formData.whatsappNumber)
          if (!whatsappValidation.isValid) {
            Snackbar.showValidationError(whatsappValidation.error)
            return false
          }
        }

    // Professional validation
        if (!formData.licenseNumber.trim()) {
          Snackbar.showValidationError('Please enter your license number')
          return false
        }
        if (!formData.address.trim()) {
          Snackbar.showValidationError('Please enter your address')
          return false
        }

    // Regions validation - always require state, city, and region selection
        if (!formData.state) {
          Snackbar.showValidationError('Please select your state')
          return false
        }
        if (!formData.city) {
          Snackbar.showValidationError('Please select your city')
          return false
        }
        if (!formData.selectedRegionId) {
          Snackbar.showValidationError('Please select your regions')
          return false
        }

        return true
  }

  // Check if all mandatory fields are filled
  const isFormValid = () => {
    return formData.fullName.trim() && 
           formData.gender && 
           formData.email.trim() && 
           formData.phone.trim() && 
           formData.firmName.trim() && 
           formData.licenseNumber.trim() && 
           formData.address.trim() && 
           formData.state && 
           formData.city && 
           formData.selectedRegionId
  }

  const handleCompleteProfile = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate all required fields
      if (!validateForm()) {
        setIsSubmitting(false)
        return
      }

      // Prepare form data for API
      const profileData = new FormData()
      
      // Basic info
      profileData.append('phone', formData.phone)
      profileData.append('name', formData.fullName)
      profileData.append('email', formData.email)
      
      // Broker details
      profileData.append('brokerDetails[gender]', formData.gender.toLowerCase())
      if (formData.firmName) {
        profileData.append('brokerDetails[firmName]', formData.firmName)
      }
      profileData.append('brokerDetails[licenseNumber]', formData.licenseNumber)
      profileData.append('brokerDetails[address]', formData.address)
      profileData.append('brokerDetails[state]', formData.state)
      profileData.append('brokerDetails[city]', formData.city)
      if (formData.whatsappNumber) {
        profileData.append('brokerDetails[whatsappNumber]', formData.whatsappNumber)
      }
      if (formData.website) {
        profileData.append('brokerDetails[website]', formData.website)
      }
      
      // Specializations
      if (Array.isArray(formData.specializations) && formData.specializations.length > 0) {
        formData.specializations.forEach(spec => {
          profileData.append('brokerDetails[specializations][]', spec)
        })
      }
      
      // Social media
      if (formData.linkedin) {
        profileData.append('brokerDetails[socialMedia][linkedin]', formData.linkedin)
      }
      if (formData.twitter) {
        profileData.append('brokerDetails[socialMedia][twitter]', formData.twitter)
      }
      if (formData.instagram) {
        profileData.append('brokerDetails[socialMedia][instagram]', formData.instagram)
      }
      if (formData.facebook) {
        profileData.append('brokerDetails[socialMedia][facebook]', formData.facebook)
      }
      
      // Regions (using the selected region ID)
      if (formData.selectedRegionId) {
        profileData.append('brokerDetails[region][]', formData.selectedRegionId)
      }
      
      // Add profile image if selected (only if it's a new image, not from API)
      if (profileImage && profileImage.uri && !profileImage.uri.startsWith('http')) {
        profileData.append('brokerImage', {
          uri: profileImage.uri,
          type: profileImage.type || 'image/jpeg',
          name: profileImage.fileName || 'profile.jpg'
        })
      }
      
      // Add document uploads if selected
      if (selectedImages.aadharCard && selectedImages.aadharCard.uri) {
        profileData.append('aadhar', {
          uri: selectedImages.aadharCard.uri,
          type: selectedImages.aadharCard.type || 'image/jpeg',
          name: selectedImages.aadharCard.fileName || 'aadhar.jpg'
        })
        console.log('Added Aadhar document to FormData')
      }
      
      if (selectedImages.panCard && selectedImages.panCard.uri) {
        profileData.append('pan', {
          uri: selectedImages.panCard.uri,
          type: selectedImages.panCard.type || 'image/jpeg',
          name: selectedImages.panCard.fileName || 'pan.jpg'
        })
        console.log('Added PAN document to FormData')
      }
      
      if (selectedImages.gstCertificate && selectedImages.gstCertificate.uri) {
        profileData.append('gst', {
          uri: selectedImages.gstCertificate.uri,
          type: selectedImages.gstCertificate.type || 'image/jpeg',
          name: selectedImages.gstCertificate.fileName || 'gst.jpg'
        })
        console.log('Added GST document to FormData')
      }
      
      if (selectedImages.brokerLicense && selectedImages.brokerLicense.uri) {
        profileData.append('brokerLicense', {
          uri: selectedImages.brokerLicense.uri,
          type: selectedImages.brokerLicense.type || 'image/jpeg',
          name: selectedImages.brokerLicense.fileName || 'broker_license.jpg'
        })
        console.log('Added Broker License document to FormData')
      }
      
      if (selectedImages.companyId && selectedImages.companyId.uri) {
        profileData.append('companyId', {
          uri: selectedImages.companyId.uri,
          type: selectedImages.companyId.type || 'image/jpeg',
          name: selectedImages.companyId.fileName || 'company_id.jpg'
        })
        console.log('Added Company ID document to FormData')
      }
      
      // Debug: Log the selected images being sent
      console.log('Selected images being sent:')
      console.log('selectedImages state:', selectedImages)
      Object.keys(selectedImages).forEach(key => {
        if (selectedImages[key]) {
          console.log(`${key}:`, selectedImages[key].uri)
        }
      })
      
      // Debug: Log the FormData contents
      console.log('FormData being sent:')
      console.log('FormData _parts:', profileData._parts)
      if (profileData._parts) {
        for (let [key, value] of profileData._parts) {
          console.log(`${key}:`, typeof value === 'object' ? `File: ${value.name}` : value)
        }
      }
      
      // Get token from storage
      const token = await storage.getToken()
      if (!token) {
        Snackbar.showApiError('Authentication token not found. Please login again.')
        setIsSubmitting(false)
        return
      }
      
      // Call the API
      const response = await authAPI.completeProfile(profileData, token)
      
      setIsSubmitting(false)
      
      // Navigate directly to home page without alert (like OTP verification)
      console.log('Profile created successfully, navigating to home...')
      navigation.navigate('MainTabs')
      
    } catch (error) {
      setIsSubmitting(false)
      console.error('Profile completion error:', error)
      console.error('Error details:', error.response?.data || error.message)
      Snackbar.showApiError('Failed to create profile. Please try again.')
    }
  }



  // Step 1: Personal Information
  const renderStep1 = () => (
    <View>
      {/* Profile Image Upload */}
      <View style={styles.sectionContainer}>
        <View style={styles.profileImageContainer}>
          <TouchableOpacity style={styles.profileImageButton} onPress={handleProfileImageUpload}>
            {profileImage ? (
              <View style={styles.profileImageWrapper}>
                {isImageFile(profileImage.uri) ? (
                  <SafeImage 
                    source={{ uri: profileImage.uri }} 
                    style={styles.profileImage}
                    imageType="profileImage"
                    resizeMode="cover"
                    onLoadStart={() => setProfileImageLoading(true)}
                    onLoadEnd={() => setProfileImageLoading(false)}
                  />
                ) : (
                  <View style={styles.profileImageFallback}>
                    <MaterialIcons 
                      name={getFileTypeIcon(profileImage.uri)} 
                      size={32} 
                      color="#009689" 
                    />
                    <Text style={styles.profileImageText}>Profile File</Text>
                  </View>
                )}
                {profileImageLoading && (
                  <View style={styles.profileImageLoadingOverlay}>
                    <ActivityIndicator size="small" color="#009689" />
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.editImageButton} 
                  onPress={handleProfileImageUpload}
                >
                  <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="camera-alt" size={32} color="#009689" />
                <Text style={styles.profileImageText}>Add Profile Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Information */}
      {renderPersonalInfo()}
    </View>
  )

  const renderPersonalInfo = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="person" size={20} color="#009689" />
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => updateFormData('fullName', text)}
          placeholder="Enter your full name"
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gender *</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowGenderModal(true)}
        >
          <Text style={[styles.inputText, !formData.gender && styles.placeholderText]}>
            {formData.gender || 'Select gender'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          placeholder="Enter your email"
          placeholderTextColor="#8E8E93"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formData.phone}
          placeholder="Enter your phone"
          placeholderTextColor="#8E8E93"
          keyboardType="numeric"
          editable={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Firm Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.firmName}
          onChangeText={(text) => updateFormData('firmName', text)}
          placeholder="Enter firm name"
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.whatsappHeader}>
          <Text style={styles.inputLabel}>WhatsApp Number</Text>
          <TouchableOpacity 
            style={[styles.phoneButton, !formData.phone && styles.phoneButtonDisabled]}
            onPress={handleUseCurrentPhoneNumber}
            disabled={!formData.phone}
          >
            <MaterialIcons name="phone" size={16} color={formData.phone ? "#009689" : "#8E8E93"} />
            <Text style={[styles.phoneButtonText, !formData.phone && styles.phoneButtonTextDisabled]}>
              Use Current Phone
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[
            styles.input,
            formData.whatsappNumber && !validateWhatsAppNumber(formData.whatsappNumber).isValid && styles.inputError
          ]}
          value={formData.whatsappNumber}
          onChangeText={handleWhatsAppNumberChange}
          placeholder="Enter WhatsApp number"
          placeholderTextColor="#8E8E93"
          keyboardType="numeric"
        />
        {formData.whatsappNumber && !validateWhatsAppNumber(formData.whatsappNumber).isValid && (
          <Text style={styles.errorText}>
            {validateWhatsAppNumber(formData.whatsappNumber).error}
          </Text>
        )}
      </View>
    </View>
  )

  // Step 2: Professional Information
  const renderStep2 = () => (
    <View>
      {renderProfessional()}
    </View>
  )

  const renderProfessional = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="work" size={20} color="#009689" />
        <Text style={styles.sectionTitle}>Professional Information</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>License Number *</Text>
        <View style={styles.inputWithIcon}>
          <MaterialIcons name="description" size={20} color="#8E8E93" style={styles.inputIcon} />
          <TextInput
            style={styles.inputText}
            value={formData.licenseNumber}
            onChangeText={(text) => updateFormData('licenseNumber', text)}
            placeholder="BRE #01234567"
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.addressHeader}>
          <Text style={styles.inputLabel}>Address *</Text>
          <TouchableOpacity 
            style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
            onPress={handleUseCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#009689" />
            ) : (
              <MaterialIcons name="location-on" size={16} color="#009689" />
            )}
            <Text style={styles.locationButtonText}>
              {locationLoading ? 'Getting Location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addressInputContainer}>
          <View style={styles.addressInputWrapper}>
            <MaterialIcons name="location-on" size={20} color="#8E8E93" style={styles.addressInputIcon} />
            <TextInput
              style={styles.addressInput}
              value={formData.address}
              onChangeText={handleAddressChange}
              placeholder="Enter your address"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={2}
            />
            {addressLoading && (
              <ActivityIndicator size="small" color="#009689" style={styles.addressLoadingIcon} />
            )}
            {formData.address && !addressLoading && (
              <TouchableOpacity onPress={() => {
                updateFormData('address', '')
                setAddressSuggestions([])
                setShowAddressSuggestions(false)
              }}>
                <MaterialIcons name="clear" size={20} color="#8E8E93" style={styles.addressInputIcon} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Address Suggestions Dropdown */}
          {showAddressSuggestions && addressSuggestions.length > 0 && (
            <View style={styles.addressSuggestionsContainer}>
              <ScrollView style={styles.addressSuggestionsList} nestedScrollEnabled>
                {addressSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={suggestion.place_id || index}
                    style={styles.addressSuggestionItem}
                    onPress={() => handleAddressSelect(suggestion.place_id, suggestion.description)}
                  >
                    <MaterialIcons name="location-on" size={16} color="#8E8E93" style={styles.suggestionIcon} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {suggestion.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Specializations</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowSpecializationModal(true)}
        >
          <Text style={[styles.inputText, (formData.specializations || []).length === 0 && styles.placeholderText]}>
            {(formData.specializations || []).length > 0 ? (formData.specializations || []).join(', ') : 'Select specializations...'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <MaterialIcons name="link" size={20} color="#009689" />
        <Text style={styles.sectionTitle}>Social Media & Online Presence</Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.socialLabel}>
          <FontAwesome name="linkedin" size={16} color="#0077B5" />
          <Text style={styles.socialLabelText}>LinkedIn</Text>
        </View>
        <TextInput
          style={styles.socialInput}
          value={formData.linkedin}
          onChangeText={(text) => updateFormData('linkedin', text)}
          placeholder="https://linkedin.com/in/yourprofile"
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.socialLabel}>
          <MaterialIcons name="camera-alt" size={16} color="#E4405F" />
          <Text style={styles.socialLabelText}>Instagram</Text>
        </View>
        <TextInput
          style={styles.socialInput}
          value={formData.instagram}
          onChangeText={(text) => updateFormData('instagram', text)}
          placeholder="https://instagram.com/yourprofile"
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.socialLabel}>
          <MaterialIcons name="language" size={16} color="#009689" />
          <Text style={styles.socialLabelText}>Website</Text>
        </View>
        <TextInput
          style={styles.socialInput}
          value={formData.website}
          onChangeText={(text) => updateFormData('website', text)}
          placeholder="https://yourwebsite.com"
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.socialLabel}>
          <MaterialIcons name="alternate-email" size={16} color="#1DA1F2" />
          <Text style={styles.socialLabelText}>Twitter</Text>
        </View>
        <TextInput
          style={styles.socialInput}
          value={formData.twitter}
          onChangeText={(text) => updateFormData('twitter', text)}
          placeholder="https://twitter.com/yourprofile"
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.socialLabel}>
          <FontAwesome name="facebook" size={16} color="#1877F2" />
          <Text style={styles.socialLabelText}>Facebook</Text>
        </View>
        <TextInput
          style={styles.socialInput}
          value={formData.facebook}
          onChangeText={(text) => updateFormData('facebook', text)}
          placeholder="https://facebook.com/yourprofile"
          placeholderTextColor="#8E8E93"
        />
      </View>
    </View>
  )

  // Step 3: Preferred Regions
  const renderStep3 = () => (
    <View>
      {renderRegions()}
    </View>
  )

  const renderRegions = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="location-on" size={20} color="#009689" />
        <Text style={styles.sectionTitle}>Preferred Regions *</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={async () => {
            const newMode = !showManualRegionSelection
            setShowManualRegionSelection(newMode)
            
            // When switching to nearby mode, nearby regions are already loaded
            // When switching to manual mode, manual regions are already loaded
            console.log('Switched to mode:', newMode ? 'Manual' : 'Nearby')
          }}
        >
          <MaterialIcons name={showManualRegionSelection ? "location-on" : "search"} size={16} color="#009689" />
          <Text style={styles.locationButtonText}>
            {showManualRegionSelection ? "Use Nearby" : "Choose Manually"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionDescription}>
        Select the regions where you provide real estate services
      </Text>
      
      {showManualRegionSelection ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>State *</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowStateModal(true)}
            >
              <Text style={[styles.inputText, !formData.state && styles.placeholderText]}>
                {formData.state || 'Select state'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City *</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowCityModal(true)}
            >
              <Text style={[styles.inputText, !formData.city && styles.placeholderText]}>
                {formData.city || 'Select city'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Regions *</Text>
            <TouchableOpacity 
              style={[styles.input, (regionsLoading || manualRegionsList.length === 0) && styles.disabledInput]}
              onPress={() => !regionsLoading && manualRegionsList.length > 0 && setShowRegionModal(true)}
              disabled={regionsLoading || manualRegionsList.length === 0}
            >
              <Text style={[styles.inputText, !formData.regions && styles.placeholderText]}>
                {regionsLoading ? 'Loading regions...' : 
                 manualRegionsList.length === 0 && formData.city ? 'No regions available' :
                 formData.regions || 'Select regions'}
              </Text>
              {regionsLoading ? (
                <ActivityIndicator size="small" color="#009689" />
              ) : (
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        renderRegionCards()
      )}
    </View>
  )

  // Step 4: Documents
  const renderStep4 = () => (
    <View>
      {renderDocuments()}
    </View>
  )

  const renderDocuments = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="description" size={20} color="#009689" />
        <Text style={styles.sectionTitle}>Documents (Optional)</Text>
      </View>
      
      <View style={styles.documentsGrid}>
        {[
          { key: 'aadharCard', title: 'Aadhar Card' },
          { key: 'panCard', title: 'PAN Card' },
          { key: 'gstCertificate', title: 'GST Certificate' },
          { key: 'brokerLicense', title: 'Broker License' },
          { key: 'companyId', title: 'Company Identification Details' }
        ].map((doc, index) => {
          const isUploaded = uploadedDocs[doc.key]
          const selectedImage = selectedImages[doc.key]
          const existingDoc = existingDocs[doc.key]
          const hasDocument = isUploaded || existingDoc
          const isExistingImage = existingDoc && isImageFile(existingDoc)
          const isExistingPdf = existingDoc && isPdfFile(existingDoc)
          const isSelectedImage = selectedImage && selectedImage.uri
          const isSelectedImageFile = selectedImage && isImageFile(selectedImage.uri)
          const isSelectedPdfFile = selectedImage && isPdfFile(selectedImage.uri)
          
          console.log(`Document ${doc.key} state:`, {
            isUploaded,
            selectedImage: selectedImage?.uri,
            existingDoc,
            hasDocument,
            isSelectedImage,
            isSelectedImageFile,
            isSelectedPdfFile
          })
          
          return (
            <View key={doc.key} style={styles.documentCardWrapper}>
              {/* Document Title Above Card */}
              <Text style={styles.documentTitleAbove}>{doc.title}</Text>
              
              <TouchableOpacity 
                style={styles.documentCard}
                onPress={() => handleDocumentUpload(doc.key)}
                activeOpacity={0.8}
              >
                {isSelectedImage ? (
                  <View style={styles.documentImageWrapper}>
                    {isSelectedImageFile ? (
                      <SafeImage 
                        source={{ uri: selectedImage.uri }} 
                        style={styles.documentFullImage}
                        imageType={doc.key}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.documentFilePreview}>
                        <MaterialIcons 
                          name={getFileTypeIcon(selectedImage.uri)} 
                          size={48} 
                          color="#009689" 
                        />
                        <Text style={styles.fileTypeText}>
                          {isSelectedPdfFile ? 'PDF Document' : 'Document'}
                        </Text>
                        <Text style={styles.fileNameText} numberOfLines={1}>
                          {selectedImage.fileName || selectedImage.name || 'Document'}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={(e) => {
                        e.stopPropagation?.()
                        handleViewDocument(doc.key)
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : existingDoc ? (
                  <View style={styles.documentImageWrapper}>
                    {isExistingImage ? (
                      <SafeImage 
                        source={{ uri: existingDoc }} 
                        style={styles.documentFullImage}
                        imageType={doc.key}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.documentFilePreview}>
                        <MaterialIcons 
                          name={getFileTypeIcon(existingDoc)} 
                          size={48} 
                          color="#009689" 
                        />
                        <Text style={styles.fileTypeText}>
                          {isExistingPdf ? 'PDF Document' : 'Document'}
                        </Text>
                        <Text style={styles.fileNameText} numberOfLines={1}>
                          {existingDoc.split('/').pop() || 'Document'}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={(e) => {
                        e.stopPropagation?.()
                        handleViewDocument(doc.key)
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.documentPlaceholder}>
                    <MaterialIcons 
                      name="cloud-upload" 
                      size={48} 
                      color="#009689" 
                    />
                    <Text style={styles.uploadText}>Upload {doc.title}</Text>
                    <Text style={styles.formatText}>PDF, JPG, PNG up to 10MB</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
    </View>
  )

  const renderModal = (title, options, field, isVisible, onClose) => {
    // Special handling for specializations (multi-select)
    if (field === 'specializations') {
      return (
        <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
          <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => {
                      const currentSpecs = Array.isArray(formData.specializations) ? formData.specializations : []
                      let newSpecs
                      if (currentSpecs.includes(option)) {
                        // Remove if already selected
                        newSpecs = currentSpecs.filter(spec => spec !== option)
                      } else {
                        // Add if not selected
                        newSpecs = [...currentSpecs, option]
                      }
                      updateFormData(field, newSpecs)
                    }}
                  >
                    <Text style={styles.modalItemText}>{option}</Text>
                    {(formData.specializations || []).includes(option) && (
                      <MaterialIcons name="check" size={20} color="#009689" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
                <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalDoneButton} onPress={onClose}>
                  <Text style={styles.modalDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )
    }

    // Regular single-select modal
    return (
      <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    // Clear nearby mode selections when making manual selections
                    if (showManualRegionSelection && (field === 'state' || field === 'city' || field === 'regions')) {
                      // Clear nearby region selection when making manual selections
                      if (formData.selectedRegionId) {
                        updateFormData('regions', '')
                        updateFormData('selectedRegionId', '')
                        setSelectedRegionId('')
                      }
                    }
                    
                    if (field === 'regions') {
                      // Find the region object to get the ID from manual regions list
                      const selectedRegion = manualRegionsList.find(region => region.name === option)
                      updateFormData('regions', option)
                      updateFormData('selectedRegionId', selectedRegion ? selectedRegion._id : '')
                      setSelectedRegionId(selectedRegion ? selectedRegion._id : '')
                    } else if (field === 'city') {
                      // Handle city selection - fetch regions and clear selected region
                      updateFormData(field, option)
                      updateFormData('regions', '') // Clear selected region
                      updateFormData('selectedRegionId', '') // Clear selected region ID
                      setSelectedRegionId('') // Clear selected region state
                      fetchRegions(option) // Fetch regions for the selected city
                    } else {
                      updateFormData(field, option)
                    }
                    onClose()
                  }}
                >
                  <Text style={styles.modalItemText}>{option}</Text>
                  {formData[field] === option && (
                    <MaterialIcons name="check" size={20} color="#009689" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    )
  }


  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return null
    }
  }

  // Get current step validation
  const getCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid()
      case 2:
        return isStep2Valid()
      case 3:
        return isStep3Valid()
      case 4:
        return isStep4Valid()
      default:
        return false
    }
  }

  // Get button text based on current step
  const getButtonText = () => {
    switch (currentStep) {
      case 1:
        return 'Continue to Professional'
      case 2:
        return 'Continue to Regions'
      case 3:
        return 'Continue to Documents'
      case 4:
        return 'Complete Profile'
      default:
        return 'Continue'
    }
  }

  // Get button icon based on current step
  const getButtonIcon = () => {
    if (currentStep < 4) {
      return <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
    } else if (currentStep === 4) {
      return <MaterialIcons name="check" size={20} color="#FFFFFF" />
    }
    return null
  }

  // Handle button press
  const handleStepButtonPress = async () => {
    if (currentStep === 4) {
      handleCompleteProfile()
    } else {
      await goToNextStep()
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Title */}
      <View style={styles.headerWithTitle}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (currentStep > 1) {
            goToPreviousStep()
          } else {
            navigation.goBack()
          }
        }}>
          <MaterialIcons name="arrow-back" size={24} color="#009689" />
        </TouchableOpacity>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Description - Only show if there's content */}
      {getStepDescription() && (
        <View style={styles.stepDescriptionContainer}>
          <Text style={styles.stepDescription}>{getStepDescription()}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#009689" />
            <Text style={styles.loadingText}>Loading profile data...</Text>
          </View>
        ) : (
          <View style={styles.singlePageForm}>
            {renderStepContent()}

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  (!getCurrentStepValid() || isSubmitting || isLoading) ? styles.actionButtonDisabled : null
                ]} 
                onPress={handleStepButtonPress}
                disabled={isSubmitting || isLoading || !getCurrentStepValid()}
              >
                {(isSubmitting || isLoading) ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.loadingText]}>
                      {currentStep === 4 ? 'Creating Profile...' : 
                       currentStep === 1 && isLoading ? 'Verifying Email...' : 'Processing...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.actionButtonText}>{getButtonText()}</Text>
                    <View style={styles.buttonIcon}>
                      {getButtonIcon()}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderModal('Select Gender', genderOptions, 'gender', showGenderModal, () => setShowGenderModal(false))}
      {renderModal('Select Specializations', specializations, 'specializations', showSpecializationModal, () => setShowSpecializationModal(false))}
      {renderModal('Select State', states, 'state', showStateModal, () => setShowStateModal(false))}
      {renderModal('Select City', cities, 'city', showCityModal, () => setShowCityModal(false))}
      {renderModal('Select Regions', manualRegionsList.length > 0 ? manualRegionsList.map(region => region.name) : ['No regions available'], 'regions', showRegionModal, () => setShowRegionModal(false))}
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
  headerWithTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  stepDescriptionContainer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 32,
  },
  profileImageButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileImageWrapper: {
    width: 116,
    height: 116,
    borderRadius: 58,
    position: 'relative',
  },
  profileImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  profileImageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageFallback: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  retryButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#009689',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#009689',
    marginTop: 8,
    textAlign: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#009689',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
    height: 2,
  },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  singlePageForm: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 4,
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
  inputWithIcon: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  phoneButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  phoneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#009689',
    marginLeft: 4,
  },
  phoneButtonTextDisabled: {
    color: '#8E8E93',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#009689',
    marginLeft: 4,
  },
  locationButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  socialInputGroup: {
    marginBottom: 16,
  },
  socialLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  socialInput: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#000000',
  },
  documentsGrid: {
    flexDirection: 'column',
  },
  documentCardWrapper: {
    marginBottom: 20,
  },
  documentTitleAbove: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  documentCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    minHeight: 120,
  },
  documentImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  documentFullImage: {
    width: '100%',
    height: '100%',
  },
  editButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#009689',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 120,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#009689',
    marginTop: 8,
    textAlign: 'center',
  },
  formatText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  documentFilePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 120,
    backgroundColor: '#F8F9FA',
  },
  fileTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#009689',
    marginTop: 8,
    textAlign: 'center',
  },
  fileNameText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '90%',
  },
  actionButtonContainer: {
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#009689',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#009689',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#C7C7CC',
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
    maxHeight: Dimensions.get('window').height * 0.5, // Reduced from 0.6 to leave more space
    marginBottom: 0,
    marginTop: 'auto', // Ensure it stays at bottom
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
    maxHeight: Dimensions.get('window').height * 0.3, // Reduced to ensure it fits above navigation
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
  modalFooter: {
    padding: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalDoneButton: {
    backgroundColor: '#009689',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  // Custom Address Input Styles
  addressInputContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  addressInputWrapper: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  addressInputIcon: {
    marginHorizontal: 8,
  },
  addressLoadingIcon: {
    marginHorizontal: 8,
  },
  addressSuggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: Dimensions.get('window').height * 0.2, // Reduced to ensure it fits above navigation
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  addressSuggestionsList: {
    maxHeight: Dimensions.get('window').height * 0.2, // Reduced to ensure it fits above navigation
  },
  addressSuggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  // Region Cards Styles
  regionCardsContainer: {
    marginTop: 16,
  },
  regionCardsList: {
    flexDirection: 'column',
  },
  regionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  regionCardSelected: {
    borderColor: '#009689',
    borderWidth: 2,
  },
  regionCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 20,
  },
  regionCardAddress: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 16,
  },
  regionCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionCardDistance: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  regionCardBrokers: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  noRegionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noRegionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  noRegionsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default CreateProfileScreen
