import React, { useState, useEffect } from 'react'
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
  Alert
} from 'react-native'
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { Snackbar } from '../utils/snackbar'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { authAPI, placesAPI } from '../services/api'
import { storage } from '../services/storage'

const CreateProfileScreen = ({ navigation }) => {
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
  const [regionsList, setRegionsList] = useState([])
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

  const genderOptions = ['Male', 'Female', 'Other']
  const specializations = ['Residential', 'Commercial', 'Industrial', 'Land', 'Rental', 'Investment']
  const states = ['Uttar Pradesh']
  const cities = ['Noida', 'Agra']

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle region selection from cards
  const handleRegionSelect = (region) => {
    setSelectedRegionId(region._id)
    updateFormData('regions', region.name)
    updateFormData('selectedRegionId', region._id)
    Snackbar.showSuccess('Region Selected', `${region.name} has been selected`)
  }

  // Render region cards
  const renderRegionCards = () => {
    if (!regionsList || regionsList.length === 0) {
      return (
        <View style={styles.noRegionsContainer}>
          <MaterialIcons name="location-off" size={48} color="#8E8E93" />
          <Text style={styles.noRegionsText}>No regions available</Text>
          <Text style={styles.noRegionsSubtext}>Try selecting a different city or use manual selection</Text>
        </View>
      )
    }

    // Debug logging
    console.log('Regions data:', regionsList)
    regionsList.forEach((region, index) => {
      console.log(`Region ${index}:`, {
        name: region.name,
        distanceKm: region.distanceKm,
        type: typeof region.distanceKm
      })
    })

    return (
      <View style={styles.regionCardsContainer}>
        <View style={styles.regionCardsList}>
          {regionsList.map((region, index) => (
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
      const result = await placesAPI.getAddressSuggestions(query)
      
      if (result.success && result.data.length > 0) {
        setAddressSuggestions(result.data)
        setShowAddressSuggestions(true)
      } else {
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
        
        // Fetch nearest regions using latitude and longitude
        const lat = details.geometry?.location?.lat
        const lng = details.geometry?.location?.lng
        if (lat && lng) {
          await fetchNearestRegions(lat, lng)
        } else if (city) {
          // Fallback to city-based regions if coordinates are not available
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
      setRegionsList([])
      return
    }

    try {
      setRegionsLoading(true)
      const response = await authAPI.getRegions(city)
      
      if (response.success && response.data && response.data.regions) {
        setRegionsList(response.data.regions)
      } else {
        console.error('Failed to fetch regions:', response.message)
        setRegionsList([])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
      setRegionsList([])
    } finally {
      setRegionsLoading(false)
    }
  }

  // Fetch nearest regions based on latitude and longitude
  const fetchNearestRegions = async (latitude, longitude, limit = 5) => {
    if (!latitude || !longitude) {
      setRegionsList([])
      return
    }

    try {
      setRegionsLoading(true)
      const response = await authAPI.getNearestRegions(latitude, longitude, limit)
      
      if (response.success && response.data && response.data.regions) {
        setRegionsList(response.data.regions)
        console.log('Nearest regions fetched:', response.data.regions.length, 'regions')
      } else {
        console.error('Failed to fetch nearest regions:', response.message)
        setRegionsList([])
      }
    } catch (error) {
      console.error('Error fetching nearest regions:', error)
      setRegionsList([])
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
            setProfileImage({
              uri: secureImageUrl,
              type: 'image/jpeg',
              fileName: 'profile.jpg'
            })
          }
          
          // Set selected region ID for highlighting
          if (broker.region?.[0]?._id) {
            setSelectedRegionId(broker.region[0]._id)
          }
          
          // Fetch regions if city is already selected
          if (broker.city) {
            fetchRegions(broker.city)
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

  // Show image picker options
  const showImagePickerOptions = (docType) => {
    if (Platform.OS === 'ios') {
    const options = ['Camera', 'Gallery', 'Cancel']
    const cancelButtonIndex = 2

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: `Select ${docType} Image`
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          // Camera
          handleImageSelection(docType, 'camera')
        } else if (buttonIndex === 1) {
          // Gallery
          handleImageSelection(docType, 'gallery')
        }
      }
    )
    } else {
      // For Android, show action sheet using Alert
      Alert.alert(
        `Select ${docType} Image`,
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

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2000,
      maxHeight: 2000,
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
        console.log('Selected asset for', docType, ':', asset)
        
        // Ensure the asset has the correct structure for FormData
        const formattedAsset = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || asset.name || `${docType}.jpg`,
          name: asset.fileName || asset.name || `${docType}.jpg`
        }
        
        setSelectedImages(prev => ({
          ...prev,
          [docType]: formattedAsset
        }))
        setUploadedDocs(prev => ({
          ...prev,
          [docType]: true
        }))
        Snackbar.showSuccess('Success', `${docType} image selected successfully!`)
      }
    }

    if (source === 'camera') {
      launchCamera(options, callback)
    } else {
      launchImageLibrary(options, callback)
    }
  }

  // Handle document upload
  const handleDocumentUpload = (docType) => {
      showImagePickerOptions(docType)
  }

  // Handle view uploaded document
  const handleViewDocument = (docType) => {
    Snackbar.showInfo('View Document', `View functionality for ${docType} will be implemented to open the uploaded file. Tap the edit button to replace the document.`)
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

    // Professional validation
        if (!formData.licenseNumber.trim()) {
          Snackbar.showValidationError('Please enter your license number')
          return false
        }
        if (!formData.address.trim()) {
          Snackbar.showValidationError('Please enter your address')
          return false
        }

    // Regions validation
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
        <Text style={styles.inputLabel}>WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          value={formData.whatsappNumber}
          onChangeText={(text) => updateFormData('whatsappNumber', text)}
          placeholder="Enter WhatsApp number"
          placeholderTextColor="#8E8E93"
          keyboardType="numeric"
        />
      </View>
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
          <TouchableOpacity style={styles.locationButton}>
            <MaterialIcons name="location-on" size={16} color="#009689" />
            <Text style={styles.locationButtonText}>Use Current Location</Text>
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

  const renderRegions = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="location-on" size={20} color="#009689" />
        <Text style={styles.sectionTitle}>Preferred Regions *</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => setShowManualRegionSelection(!showManualRegionSelection)}
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
              style={[styles.input, (regionsLoading || regionsList.length === 0) && styles.disabledInput]}
              onPress={() => !regionsLoading && regionsList.length > 0 && setShowRegionModal(true)}
              disabled={regionsLoading || regionsList.length === 0}
            >
              <Text style={[styles.inputText, !formData.regions && styles.placeholderText]}>
                {regionsLoading ? 'Loading regions...' : 
                 regionsList.length === 0 && formData.city ? 'No regions available' :
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
          
          return (
            <View key={doc.key} style={styles.documentCard}>
              <TouchableOpacity 
                style={styles.documentCardContent}
                onPress={() => hasDocument ? handleViewDocument(doc.title) : handleDocumentUpload(doc.key)}
              >
                <View style={styles.documentIcon}>
                  {selectedImage ? (
                    <View style={styles.documentImageWrapper}>
                      <SafeImage 
                        source={{ uri: selectedImage.uri }} 
                        style={styles.documentPreview}
                        imageType={doc.key}
                        resizeMode="cover"
                      />
                      {hasDocument && (
                        <TouchableOpacity 
                          style={styles.editDocumentButton} 
                          onPress={() => handleDocumentUpload(doc.key)}
                        >
                          <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : existingDoc ? (
                    <View style={styles.documentImageWrapper}>
                      <SafeImage 
                        source={{ uri: existingDoc }} 
                        style={styles.documentPreview}
                        imageType={doc.key}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.editDocumentButton} 
                        onPress={() => handleDocumentUpload(doc.key)}
                      >
                        <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <MaterialIcons 
                      name={hasDocument ? "check-circle" : "cloud-upload"} 
                      size={32} 
                      color={hasDocument ? "#4CAF50" : "#009689"} 
                    />
                  )}
                </View>
                <Text style={styles.documentTitle}>{doc.title}</Text>
                <Text style={[styles.documentStatus, hasDocument && styles.documentStatusUploaded]}>
                  {hasDocument ? 'Tap to view or edit' : `Click to upload ${doc.title}`}
                </Text>
                <Text style={styles.documentFormat}>PDF, JPG, PNG up to 10MB</Text>
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
        <Modal visible={isVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
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
          </View>
        </Modal>
      )
    }

    // Regular single-select modal
    return (
      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
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
                    if (field === 'regions') {
                      // Find the region object to get the ID
                      const selectedRegion = regionsList.find(region => region.name === option)
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
        </View>
      </Modal>
    )
  }


  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      > */}
        {/* Header with Title */}
        <View style={styles.headerWithTitle}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#009689" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Broker Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#009689" />
              <Text style={styles.loadingText}>Loading profile data...</Text>
            </View>
          ) : (
            <View style={styles.singlePageForm}>
              {/* Profile Image Upload */}
              <View style={styles.profileImageContainer}>
                <TouchableOpacity style={styles.profileImageButton} onPress={handleProfileImageUpload}>
                  {profileImage ? (
                    <View style={styles.profileImageWrapper}>
                      <SafeImage 
                        source={{ uri: profileImage.uri }} 
                        style={styles.profileImage}
                        imageType="profileImage"
                        resizeMode="cover"
                        onLoadStart={() => setProfileImageLoading(true)}
                        onLoadEnd={() => setProfileImageLoading(false)}
                      />
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

              {renderPersonalInfo()}
              {renderProfessional()}
              {renderRegions()}
              {renderDocuments()}

              {/* Action Button */}
              <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                (!isFormValid() || isSubmitting) ? styles.actionButtonDisabled : null
              ]} 
              onPress={handleCompleteProfile}
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, styles.loadingText]}>
                    Creating Profile...
                  </Text>
                </View>
              ) : (
                <Text style={styles.actionButtonText}>Complete Profile</Text>
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
        {renderModal('Select Regions', regionsList.length > 0 ? regionsList.map(region => region.name) : ['No regions available'], 'regions', showRegionModal, () => setShowRegionModal(false))}

      {/* </KeyboardAvoidingView> */}
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
  documentCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  documentIcon: {
    marginBottom: 12,
    position: 'relative',
  },
  documentImageWrapper: {
    position: 'relative',
  },
  documentPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  editDocumentButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#009689',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  documentStatus: {
    fontSize: 12,
    color: '#009689',
    textAlign: 'center',
    marginBottom: 4,
  },
  documentStatusUploaded: {
    color: '#4CAF50',
  },
  documentFormat: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
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
    maxHeight: 300,
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
    paddingBottom: 40,
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
    maxHeight: 200,
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
    maxHeight: 200,
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
