import React, { useState, useRef, useEffect } from 'react'
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
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
  ActionSheetIOS,
  PermissionsAndroid,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { Snackbar } from '../utils/snackbar'
import { authAPI, propertiesAPI } from '../services/api'
import storage from '../services/storage'

const { width } = Dimensions.get('window')

// Custom Price Slider Component
const PriceSlider = ({ value, onValueChange, min = 0, max = 100000000, step = 100000 }) => {
  const [sliderWidth, setSliderWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const currentValue = value ? parseFloat(value) : 0
  const clampedValue = Math.max(min, Math.min(max, currentValue))
  const percentage = ((clampedValue - min) / (max - min)) * 100
  const sliderPosition = ((sliderWidth) * percentage) / 100

  const handleSliderPress = (evt) => {
    if (sliderWidth === 0) return
    
    const newPosition = Math.max(0, Math.min(sliderWidth, evt.nativeEvent.locationX))
    const newPercentage = (newPosition / sliderWidth) * 100
    const newValue = Math.round((newPercentage / 100) * (max - min) + min)
    const steppedValue = Math.round(newValue / step) * step
    onValueChange(steppedValue.toString())
  }

  return (
    <View style={styles.sliderContainer}>
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

const CreatePropertyScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1) // Step 1: Basic Info, Step 2: Amenities & Features, Step 3: Media & Publishing
  const scrollViewRef = useRef(null)
  const [showRegionModal, setShowRegionModal] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false)
  const [showSubTypeModal, setShowSubTypeModal] = useState(false)
  const [showFurnishingModal, setShowFurnishingModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [regionOptions, setRegionOptions] = useState([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [brokerId, setBrokerId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  
  // Input refs for amenity fields
  const propertyAmenityInput = useRef(null)
  const nearbyAmenityInput = useRef(null)
  const featureInput = useRef(null)
  const locationBenefitInput = useRef(null)

  // Temp state for amenity inputs
  const [tempAmenityInputs, setTempAmenityInputs] = useState({
    propertyAmenities: '',
    nearbyAmenities: '',
    features: '',
    locationBenefits: ''
  })

  // Temp state for media inputs
  const [tempMediaInputs, setTempMediaInputs] = useState({
    images: '',
    videos: ''
  })
  
  const [formData, setFormData] = useState({
    // Basic Information (Step 1)
    propertyTitle: '',
    region: '',
    address: '',
    city: '',
    facingDirection: '',
    price: '',
    propertySize: '',
    possessionStatus: '',
    propertyAge: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    subType: '',
    furnishing: '',
    shortDescription: '',
    detailedDescription: '',
    // Additional fields (moved to other steps)
    currency: 'INR',
    propertyAmenities: [],
    nearbyAmenities: [],
    features: [],
    locationBenefits: [],
    // Images & Media (Step 4)
    images: [],
    videos: [],
    status: 'Pending Approval',
    notes: '',
  })

  const currencyOptions = [
    'INR',
    'USD',
    'EUR',
    'GBP',
    'AED'
  ]

  const propertyTypeOptions = [
    'Residential',
    'Commercial',
    'Industrial',
    'Land',
    'Rental'
  ]

  const subTypeOptions = [
    'Apartment',
    'Villa',
    'Independent House',
    'Studio',
    'Penthouse',
    'Farmhouse'
  ]

  const furnishingOptions = [
    'Furnished',
    'Semi-Furnished',
    'Unfurnished'
  ]

  const statusOptions = [
    'Pending Approval',
    'Active',
    'Sold',
    'Draft'
  ]

  const facingDirectionOptions = [
    'North',
    'East',
    'South',
    'West'
  ]

  const possessionStatusOptions = [
    'Ready to Move',
    'Under Construction',
    'Upcoming'
  ]

  const propertyAgeOptions = [
    'New',
    '<5 Years',
    '<10 Years',
    '>10 Years'
  ]

  const bedroomOptions = ['1', '2', '3', '4', '5+']
  const bathroomOptions = ['1', '2', '3', '4', '5+']

  // Pre-defined Property Amenities
  const predefinedAmenities = [
    'Parking',
    'Power Backup',
    'Lift',
    'Garden',
    'Security',
    'Gym',
    'Water Supply',
    'Swimming Pool'
  ]

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions()
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Get broker ID
      const brokerIdValue = await storage.getBrokerId()
      if (brokerIdValue) {
        setBrokerId(brokerIdValue)
      }
      
      // Get user ID (this is what we'll send to the API)
      const userIdValue = await storage.getUserId()
      if (userIdValue) {
        setUserId(userIdValue)
      }
      
      // Fallback: if no userId but brokerId exists, use brokerId as userId
      if (!userIdValue && brokerIdValue) {
        setUserId(brokerIdValue)
      }
      
      const token = await storage.getToken()
      if (token) {
        setAuthToken(token)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const fetchRegions = async () => {
    try {
      setLoadingRegions(true)
      const response = await authAPI.getAllRegions()
      
      // Extract regions from the response
      let regions = []
      if (response && response.data && response.data.regions) {
        // API returns { data: { regions: [...] } }
        regions = response.data.regions.map(region => region.name || region)
      } else if (response && Array.isArray(response)) {
        regions = response.map(region => region.name || region)
      }
      
      if (regions.length > 0) {
        setRegionOptions(regions)
      } else {
        // Fallback to default regions if API fails
        setRegionOptions([
          'Uttar Pradesh',
          'Maharashtra',
          'Delhi',
          'Karnataka',
          'Tamil Nadu',
          'Gujarat',
          'Rajasthan',
          'West Bengal'
        ])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
      // Fallback to default regions if API fails
      setRegionOptions([
        'Uttar Pradesh',
        'Maharashtra',
        'Delhi',
        'Karnataka',
        'Tamil Nadu',
        'Gujarat',
        'Rajasthan',
        'West Bengal'
      ])
    } finally {
      setLoadingRegions(false)
    }
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 500)
  }

  // Handle adding items to arrays (amenities, features, etc.)
  const handleAddItem = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
      // Clear the input
      setTempAmenityInputs(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Handle removing items from arrays
  const handleRemoveItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Handle toggling predefined amenities
  const handleTogglePredefinedAmenity = (amenity) => {
    setFormData(prev => {
      const currentAmenities = prev.propertyAmenities || []
      const isSelected = currentAmenities.includes(amenity)
      
      if (isSelected) {
        // Remove if already selected
        return {
          ...prev,
          propertyAmenities: currentAmenities.filter(a => a !== amenity)
        }
      } else {
        // Add if not selected
        return {
          ...prev,
          propertyAmenities: [...currentAmenities, amenity]
        }
      }
    })
  }

  // Handle adding media items (images and videos)
  const handleAddMedia = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
      // Clear the input
      setTempMediaInputs(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Handle removing media items
  const handleRemoveMedia = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if permission is already granted
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        )
        if (checkResult) {
          return true
        }
        
        // Request permission
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
        console.warn('Camera permission error:', err)
        Snackbar.showError('Error', 'Failed to request camera permission')
        return false
      }
    }
    // For iOS, permission is requested when camera is launched
    return true
  }

  // Show media picker options
  const showMediaPickerOptions = (field) => {
    if (Platform.OS === 'ios') {
      const options = ['Camera', 'Photo Library', 'Cancel']
      const cancelButtonIndex = 2

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: `Select ${field === 'images' ? 'Image' : 'Video'}`
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Camera
            handleMediaSelection(field, 'camera')
          } else if (buttonIndex === 1) {
            // Gallery
            handleMediaSelection(field, 'gallery')
          }
        }
      )
    } else {
      // For Android, show action sheet using Alert
      Alert.alert(
        `Select ${field === 'images' ? 'Image' : 'Video'}`,
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: () => handleMediaSelection(field, 'camera')
          },
          {
            text: 'Gallery',
            onPress: () => handleMediaSelection(field, 'gallery')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      )
    }
  }

  // Handle media selection
  const handleMediaSelection = async (field, source) => {
    try {
      if (source === 'camera') {
        const hasPermission = await requestCameraPermission()
        if (!hasPermission) {
          Snackbar.showError('Permission Denied', 'Camera permission is required to take photos')
          return
        }
      }

      const options = {
        mediaType: field === 'images' ? 'photo' : 'video',
        quality: 0.8,
        maxWidth: 2000,
        maxHeight: 2000,
        includeBase64: false,
        saveToPhotos: false,
      }

      const callback = (response) => {
        console.log('Media picker response:', response)
        if (response.didCancel) {
          console.log('User cancelled media picker')
        } else if (response.errorCode) {
          console.log('MediaPicker Error Code: ', response.errorCode)
          console.log('MediaPicker Error Message: ', response.errorMessage)
          
          let errorMsg = 'Failed to access media'
          if (response.errorCode === 'permission') {
            errorMsg = 'Camera/Gallery permission is required'
          } else if (response.errorCode === 'others') {
            errorMsg = response.errorMessage || 'Failed to access camera/gallery'
          }
          Snackbar.showError('Error', errorMsg)
        } else if (response.errorMessage) {
          console.log('MediaPicker Error: ', response.errorMessage)
          Snackbar.showError('Error', response.errorMessage)
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0]
          const fileUrl = asset.uri
          
          // Add to form data
          handleAddMedia(field, fileUrl)
          Snackbar.showSuccess('Success', `${field === 'images' ? 'Image' : 'Video'} added successfully!`)
        }
      }

      if (source === 'camera') {
        launchCamera(options, callback)
      } else {
        launchImageLibrary(options, callback)
      }
    } catch (error) {
      console.error('Error launching media picker:', error)
      Snackbar.showError('Error', 'Failed to open camera/gallery. Please try again.')
    }
  }

  // Step validation
  const isStep1Valid = () => {
    const sizeValid = formData.propertySize.trim() && !isNaN(formData.propertySize) && parseFloat(formData.propertySize) > 0
    const bedroomsValid = formData.bedrooms.trim() !== ''
    const bathroomsValid = formData.bathrooms.trim() !== ''
    
    return formData.propertyTitle.trim() && 
           formData.region.trim() &&
           formData.address.trim() &&
           formData.price.trim() &&
           !isNaN(formData.price) &&
           parseFloat(formData.price) > 0 &&
           formData.propertyType.trim() &&
           sizeValid &&
           bedroomsValid &&
           bathroomsValid
  }

  // Render radio button group
  const renderRadioGroup = (options, selectedValue, onSelect, fieldName) => (
    <View style={styles.radioGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.radioButton,
            selectedValue === option && styles.radioButtonActive
          ]}
          onPress={() => onSelect(option)}
        >
          <Text style={[
            styles.radioButtonText,
            selectedValue === option && styles.radioButtonTextActive
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const isStep2Valid = () => {
    // Step 2 (Amenities & Features) has no required fields, all optional
    return true
  }

  const isStep3Valid = () => {
    // Step 3 requires minimum 3 images
    return formData.images.length >= 3
  }

  const goToNextStep = () => {
    if (currentStep === 1 && isStep1Valid()) {
      setCurrentStep(2)
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      }, 100)
    } else if (currentStep === 2 && isStep2Valid()) {
      setCurrentStep(3)
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      }, 100)
    } else if (currentStep === 3 && isStep3Valid()) {
      handleCompleteProperty()
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      }, 100)
    } else {
      navigation.goBack()
    }
  }

  const handleCompleteProperty = async () => {
    try {
      setIsSubmitting(true)

      if (!authToken || !userId) {
        Snackbar.showError('Error', 'Please login again to create property')
        return
      }

      // Create FormData object
      const propertyFormData = new FormData()
      
      // Basic Information
      propertyFormData.append('title', formData.propertyTitle)
      propertyFormData.append('description', formData.shortDescription || '')
      propertyFormData.append('propertyDescription', formData.detailedDescription || '')
      
      // Property Details
      propertyFormData.append('propertySize', formData.propertySize)
      propertyFormData.append('propertyType', formData.propertyType)
      propertyFormData.append('subType', formData.subType)
      
      // Location & Pricing
      propertyFormData.append('price', formData.price)
      propertyFormData.append('priceUnit', formData.currency)
      propertyFormData.append('address', formData.address || '')
      propertyFormData.append('city', formData.city)
      propertyFormData.append('region', formData.region)
      
      // Coordinates (optional, can be set to default or user input)
      propertyFormData.append('coordinates[lat]', '0')
      propertyFormData.append('coordinates[lng]', '0')
      
      // Additional Details
      propertyFormData.append('bedrooms', formData.bedrooms)
      propertyFormData.append('bathrooms', formData.bathrooms)
      propertyFormData.append('furnishing', formData.furnishing)
      
      // Broker & Status
      propertyFormData.append('broker', userId)
      propertyFormData.append('status', formData.status)
      propertyFormData.append('isFeatured', 'false')
      
      // Amenities, Features, etc.
      formData.propertyAmenities.forEach(amenity => {
        propertyFormData.append('amenities[]', amenity)
      })
      
      formData.nearbyAmenities.forEach(amenity => {
        propertyFormData.append('nearbyAmenities[]', amenity)
      })
      
      formData.features.forEach(feature => {
        propertyFormData.append('features[]', feature)
      })
      
      formData.locationBenefits.forEach(benefit => {
        propertyFormData.append('locationBenefits[]', benefit)
      })
      
      // Images - handle file uploads
      formData.images.forEach((imageUri, index) => {
        if (imageUri && imageUri.startsWith('file://')) {
          // Local file URI
          propertyFormData.append('images[]', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `property_image_${index}.jpg`
          })
        } else if (imageUri && !imageUri.startsWith('http')) {
          // URL string
          propertyFormData.append('images', imageUri)
        }
      })
      
      // Videos
      formData.videos.forEach(video => {
        propertyFormData.append('videos[]', video)
      })
      
      // Notes
      if (formData.notes) {
        propertyFormData.append('notes', formData.notes)
      }

      console.log('Submitting property data...')
      const response = await propertiesAPI.createProperty(propertyFormData, authToken)
      
      Snackbar.showSuccess('Property Created', 'Your property has been created successfully')
      navigation.goBack()
    } catch (error) {
      console.error('Error creating property:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create property. Please try again.'
      Snackbar.showError('Error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid()
      case 2:
        return isStep2Valid()
      case 3:
        return isStep3Valid()
      default:
        return false
    }
  }

  const getButtonText = () => {
    switch (currentStep) {
      case 1:
        return 'Continue'
      case 2:
        return 'Continue'
      case 3:
        return 'Create Property'
      default:
        return 'Continue'
    }
  }

  const getButtonIcon = () => {
    if (currentStep < 3) {
      return <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
    } else {
      return <MaterialIcons name="check" size={20} color="#FFFFFF" />
    }
  }

  const getStepTitleDisplay = () => {
    switch (currentStep) {
      case 1:
        return 'Basic Information'
      case 2:
        return 'Amenities & Features'
      case 3:
        return 'Media & Publishing'
      default:
        return 'Add New Property'
    }
  }

  // Render Currency Modal
  const renderCurrencyModal = () => (
    <Modal
      visible={showCurrencyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCurrencyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
              <MaterialIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={currencyOptions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.currency === item && styles.modalItemSelected
                ]}
                onPress={() => {
                  updateFormData('currency', item)
                  setShowCurrencyModal(false)
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  formData.currency === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {formData.currency === item && (
                  <MaterialIcons name="check" size={20} color="#0D542BFF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )

  // Render Region Modal
  const renderRegionModal = () => (
    <Modal
      visible={showRegionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRegionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Region</Text>
            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
              <MaterialIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={regionOptions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.region === item && styles.modalItemSelected
                ]}
                onPress={() => {
                  updateFormData('region', item)
                  setShowRegionModal(false)
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  formData.region === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {formData.region === item && (
                  <MaterialIcons name="check" size={20} color="#0D542BFF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )

  // Step 1: Basic Information
  const renderStep1 = () => (
    <View>
      <View style={styles.sectionContainer}>
        {/* Property Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Title *</Text>
          <TextInput
            style={[
              styles.input,
              !formData.propertyTitle.trim() && styles.inputError
            ]}
            value={formData.propertyTitle}
            onChangeText={(text) => updateFormData('propertyTitle', text)}
            onFocus={handleInputFocus}
            placeholder="Enter property title"
            placeholderTextColor="#8E8E93"
          />
          {!formData.propertyTitle.trim() && (
            <Text style={styles.errorText}>Title is required.</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address *</Text>
          <TextInput
            style={[
              styles.input,
              !formData.address.trim() && styles.inputError
            ]}
            value={formData.address}
            onChangeText={(text) => updateFormData('address', text)}
            onFocus={handleInputFocus}
            placeholder="Search address..."
            placeholderTextColor="#8E8E93"
          />
          {!formData.address.trim() && (
            <Text style={styles.errorText}>Address is required.</Text>
          )}
        </View>

        {/* Region */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Region *</Text>
          <TouchableOpacity 
            style={[
              styles.input,
              !formData.region && styles.inputError
            ]}
            onPress={() => setShowRegionModal(true)}
          >
            <Text style={[styles.inputText, !formData.region && styles.placeholderText]}>
              {formData.region || 'Select a region...'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {!formData.region && (
            <Text style={styles.errorText}>Region is required.</Text>
          )}
        </View>

        {/* City (auto) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City (auto)</Text>
            <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.city || 'Agra'}
            editable={false}
              placeholderTextColor="#8E8E93"
            />
        </View>

        {/* Facing Direction */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Facing Direction</Text>
          {renderRadioGroup(
            facingDirectionOptions,
            formData.facingDirection,
            (value) => updateFormData('facingDirection', value),
            'facingDirection'
          )}
          </View>

        {/* Possession Status */}
          <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Possession Status</Text>
          {renderRadioGroup(
            possessionStatusOptions,
            formData.possessionStatus,
            (value) => updateFormData('possessionStatus', value),
            'possessionStatus'
          )}
        </View>

          {/* Price */}
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price *</Text>
          <View style={[
            styles.priceInputContainer,
            (!formData.price.trim() || isNaN(formData.price) || parseFloat(formData.price) <= 0) && styles.inputError
          ]}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.priceInput}
              value={formData.price}
              onChangeText={(text) => {
                updateFormData('price', text)
              }}
              onFocus={handleInputFocus}
              placeholder="Enter price"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
            />
          </View>
          <PriceSlider
            value={formData.price}
            onValueChange={(value) => updateFormData('price', value)}
            min={0}
            max={100000000}
            step={100000}
          />
          {(!formData.price.trim() || isNaN(formData.price) || parseFloat(formData.price) <= 0) && (
              <Text style={styles.errorText}>Enter a valid price.</Text>
            )}
          </View>

        {/* Property Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Age</Text>
          {renderRadioGroup(
            propertyAgeOptions,
            formData.propertyAge,
            (value) => updateFormData('propertyAge', value),
            'propertyAge'
          )}
        </View>

        {/* Property Size */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Size (sqft) *</Text>
          <TextInput
            style={[
              styles.input,
              (!formData.propertySize.trim() || isNaN(formData.propertySize) || parseFloat(formData.propertySize) <= 0) && styles.inputError
            ]}
            value={formData.propertySize}
            onChangeText={(text) => updateFormData('propertySize', text)}
            onFocus={handleInputFocus}
            placeholder="e.g. 1200"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          {(!formData.propertySize.trim() || isNaN(formData.propertySize) || parseFloat(formData.propertySize) <= 0) && (
            <Text style={styles.errorText}>Property size is required.</Text>
          )}
        </View>

        {/* Bedrooms (BHK) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bedrooms (BHK) *</Text>
          {renderRadioGroup(
            bedroomOptions,
            formData.bedrooms,
            (value) => updateFormData('bedrooms', value),
            'bedrooms'
          )}
          {!formData.bedrooms && (
            <Text style={styles.errorText}>Bedrooms is required.</Text>
          )}
        </View>

        {/* Bathrooms */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bathrooms *</Text>
          {renderRadioGroup(
            bathroomOptions,
            formData.bathrooms,
            (value) => updateFormData('bathrooms', value),
            'bathrooms'
          )}
          {!formData.bathrooms && (
            <Text style={styles.errorText}>Bathrooms is required.</Text>
          )}
        </View>

        {/* Property Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Type *</Text>
          <TouchableOpacity 
            style={[
              styles.input,
              !formData.propertyType && styles.inputError
            ]}
            onPress={() => setShowPropertyTypeModal(true)}
          >
            <Text style={[styles.inputText, !formData.propertyType && styles.placeholderText]}>
              {formData.propertyType || 'Select property type'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {!formData.propertyType && (
            <Text style={styles.errorText}>Property type is required.</Text>
          )}
        </View>

        {/* Sub Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sub Type</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowSubTypeModal(true)}
          >
            <Text style={[styles.inputText, !formData.subType && styles.placeholderText]}>
              {formData.subType || 'Select sub type'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Furnishing */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Furnishing</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowFurnishingModal(true)}
          >
            <Text style={[styles.inputText, !formData.furnishing && styles.placeholderText]}>
              {formData.furnishing || 'Select furnishing'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Short Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Short Description</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              value={formData.shortDescription}
              onChangeText={(text) => updateFormData('shortDescription', text)}
              onFocus={handleInputFocus}
              placeholder="Brief description of the property"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Detailed Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Detailed Description</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              value={formData.detailedDescription}
              onChangeText={(text) => updateFormData('detailedDescription', text)}
              onFocus={handleInputFocus}
              placeholder="Comprehensive description with all details"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>
    </View>
  )

  // Step 2: Amenities & Features
  const renderStep2 = () => (
    <View>
      <View style={styles.sectionContainer}>
        {/* Property Amenities */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Amenities</Text>
          
          {/* Pre-defined Amenities */}
          <View style={styles.predefinedAmenitiesContainer}>
            {predefinedAmenities.map((amenity) => {
              const isSelected = formData.propertyAmenities.includes(amenity)
              return (
          <TouchableOpacity 
                  key={amenity}
            style={[
                    styles.predefinedAmenityTag,
                    isSelected && styles.predefinedAmenityTagSelected
                  ]}
                  onPress={() => handleTogglePredefinedAmenity(amenity)}
                >
                  <Text style={[
                    styles.predefinedAmenityText,
                    isSelected && styles.predefinedAmenityTextSelected
                  ]}>
                    {amenity}
            </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" style={styles.checkmarkIcon} />
                  )}
                </TouchableOpacity>
              )
            })}
      </View>

          {/* Custom Amenity Input */}
            <TextInput
            style={styles.addItemInputFullWidth}
            placeholder="Type amenity and press Enter to add"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.propertyAmenities}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, propertyAmenities: text }))}
              onSubmitEditing={(e) => handleAddItem('propertyAmenities', e.nativeEvent.text)}
            />
          
          {/* All Selected Amenities (both predefined and custom) */}
          {formData.propertyAmenities.length > 0 && (
          <View style={styles.tagContainer}>
            {formData.propertyAmenities.map((item, index) => {
              const isPredefined = predefinedAmenities.includes(item)
              return (
                <View key={index} style={[
                  styles.tag,
                  isPredefined && styles.tagPredefined
                ]}>
                  <Text style={[
                    styles.tagText,
                    isPredefined && styles.tagTextPredefined
                  ]}>{item}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem('propertyAmenities', index)}>
                    <MaterialIcons 
                      name="close" 
                      size={16} 
                      color="#0D542BFF" 
                    />
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
          )}
        </View>

        {/* Nearby Amenities */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nearby Amenities</Text>
            <TextInput
            style={styles.addItemInputFullWidth}
            placeholder="Type nearby amenity and press Enter to add"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.nearbyAmenities}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, nearbyAmenities: text }))}
              onSubmitEditing={(e) => handleAddItem('nearbyAmenities', e.nativeEvent.text)}
            />
          {formData.nearbyAmenities.length > 0 && (
          <View style={styles.tagContainer}>
            {formData.nearbyAmenities.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('nearbyAmenities', index)}>
                  <MaterialIcons name="close" size={16} color="#0D542BFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          )}
        </View>

        {/* Features */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Features</Text>
            <TextInput
            style={styles.addItemInputFullWidth}
            placeholder="Type feature and press Enter to add"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.features}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, features: text }))}
              onSubmitEditing={(e) => handleAddItem('features', e.nativeEvent.text)}
            />
          {formData.features.length > 0 && (
          <View style={styles.tagContainer}>
            {formData.features.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('features', index)}>
                  <MaterialIcons name="close" size={16} color="#0D542BFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          )}
        </View>

        {/* Location Benefits */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location Benefits</Text>
            <TextInput
            style={styles.addItemInputFullWidth}
            placeholder="Type location benefit and press Enter to add"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.locationBenefits}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, locationBenefits: text }))}
              onSubmitEditing={(e) => handleAddItem('locationBenefits', e.nativeEvent.text)}
            />
          {formData.locationBenefits.length > 0 && (
          <View style={styles.tagContainer}>
            {formData.locationBenefits.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('locationBenefits', index)}>
                  <MaterialIcons name="close" size={16} color="#0D542BFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          )}
        </View>
      </View>
    </View>
  )


  // Step 3: Media & Publishing
  const renderStep3 = () => {
    const imageCount = formData.images.length
    const videoCount = formData.videos.length
    const minImages = 3
    
    return (
      <View>
        <View style={styles.sectionContainer}>
          {/* Add Images */}
          <View style={styles.inputGroup}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Add Images (min {minImages})</Text>
              <Text style={styles.stepCount}>
                {imageCount}/{minImages} minimum
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.mediaUploadArea,
                imageCount >= minImages && styles.mediaUploadAreaComplete
              ]}
              onPress={() => showMediaPickerOptions('images')}
            >
              <MaterialIcons name="add" size={48} color="#8E8E93" />
              <Text style={styles.mediaUploadText}>Add Images</Text>
              <Text style={styles.mediaUploadHint}>Click to upload or drag and drop</Text>
            </TouchableOpacity>
            {formData.images.length > 0 && (
              <View style={styles.tagContainer}>
                {formData.images.map((item, index) => {
                  const fileName = item.substring(item.lastIndexOf('/') + 1)
                  return (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>{fileName}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMedia('images', index)}>
                        <MaterialIcons name="close" size={16} color="#0D542BFF" />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* Add Videos */}
          <View style={styles.inputGroup}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Add Videos (optional)</Text>
              <Text style={styles.stepCount}>{videoCount} added</Text>
            </View>
            <TouchableOpacity 
              style={styles.mediaUploadArea}
              onPress={() => showMediaPickerOptions('videos')}
            >
              <MaterialIcons name="videocam" size={48} color="#8E8E93" />
              <Text style={styles.mediaUploadText}>Add Videos</Text>
              <Text style={styles.mediaUploadHint}>Click to upload video files</Text>
            </TouchableOpacity>
            {formData.videos.length > 0 && (
              <View style={styles.tagContainer}>
                {formData.videos.map((item, index) => {
                  const fileName = item.substring(item.lastIndexOf('/') + 1)
                  return (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>{fileName}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMedia('videos', index)}>
                        <MaterialIcons name="close" size={16} color="#0D542BFF" />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* Notes Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                onFocus={handleInputFocus}
                placeholder="Internal notes (optional)"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
      </View>
    </View>
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
      default:
        return null
    }
  }

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
          <TouchableOpacity style={styles.backButton} onPress={goToPreviousStep}>
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          ref={scrollViewRef} 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.singlePageForm}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{getStepTitleDisplay()}</Text>
            </View>
            
            {/* Step Content */}
            {renderStepContent()}

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  (!getCurrentStepValid() || isSubmitting) ? styles.actionButtonDisabled : null
                ]} 
                onPress={goToNextStep}
                disabled={isSubmitting || !getCurrentStepValid()}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.loadingText]}>
                      Creating Property...
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderRegionModal()}
      {renderCurrencyModal()}
      
      {/* Property Type Modal */}
      <Modal
        visible={showPropertyTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPropertyTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property Type</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={propertyTypeOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.propertyType === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    updateFormData('propertyType', item)
                    setShowPropertyTypeModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.propertyType === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.propertyType === item && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Sub Type Modal */}
      <Modal
        visible={showSubTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sub Type</Text>
              <TouchableOpacity onPress={() => setShowSubTypeModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={subTypeOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.subType === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    updateFormData('subType', item)
                    setShowSubTypeModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.subType === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.subType === item && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Furnishing Modal */}
      <Modal
        visible={showFurnishingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFurnishingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Furnishing</Text>
              <TouchableOpacity onPress={() => setShowFurnishingModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={furnishingOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.furnishing === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    updateFormData('furnishing', item)
                    setShowFurnishingModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.furnishing === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.furnishing === item && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={statusOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.status === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    updateFormData('status', item)
                    setShowStatusModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.status === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.status === item && (
                    <MaterialIcons name="check" size={20} color="#0D542BFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    flexGrow: 1,
    paddingBottom: 20,
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
  singlePageForm: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 0,
    flex: 1,
  },

  // Input Styles
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
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#8E8E93',
    borderColor: '#E0E0E0',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  radioButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#E5E5EA',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  radioButtonTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 0,
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

  // Add Item Styles
  addItemContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#000000',
  },
  addItemInputFullWidth: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#0D542BFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaPickerButton: {
    backgroundColor: '#0D542BFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  // Tag Styles
  predefinedAmenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  predefinedAmenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  predefinedAmenityTagSelected: {
    backgroundColor: '#0D542BFF',
    borderColor: '#0D542BFF',
  },
  predefinedAmenityText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  predefinedAmenityTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkmarkIcon: {
    marginLeft: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  tagPredefined: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  tagText: {
    fontSize: 14,
    color: '#0D542BFF',
    fontWeight: '500',
  },
  tagTextPredefined: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  mediaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    maxWidth: '90%',
  },
  mediaTagText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
    flex: 1,
  },

  // Action Button
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginLeft: 8,
  },

  // Media Upload Styles
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  stepCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  mediaUploadArea: {
    width: '100%',
    minHeight: 180,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mediaUploadAreaComplete: {
    borderColor: '#0D542BFF',
    backgroundColor: '#F0FDFA',
  },
  videoUploadArea: {
    width: '100%',
    minHeight: 180,
    backgroundColor: '#F0FDFA',
    borderWidth: 2,
    borderColor: '#0D542BFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mediaUploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 4,
  },
  videoUploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D542BFF',
    marginTop: 12,
    marginBottom: 4,
  },
  mediaUploadHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  videoUploadHint: {
    fontSize: 14,
    color: '#0D542BFF',
    marginTop: 4,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  mediaPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginHorizontal: 4,
    marginBottom: 8,
    maxWidth: '48%',
  },
  mediaPreviewText: {
    fontSize: 12,
    color: '#000000',
    flex: 1,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#000000',
  },

  // Modal Styles
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
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDFA',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalItemTextSelected: {
    color: '#0D542BFF',
    fontWeight: '600',
  },

  // Slider Styles
  sliderContainer: {
    marginTop: 12,
    marginBottom: 0,
  },
  sliderWrapper: {
    marginBottom: 0,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    paddingVertical: 12,
    marginHorizontal: 0,
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

export default CreatePropertyScreen

