import React, { useState, useRef } from 'react'
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

const { width } = Dimensions.get('window')

const CreatePropertyScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1) // Step 1: Basic Info, Step 2: Location & Pricing, Step 3: Property Details
  const scrollViewRef = useRef(null)
  const [showRegionModal, setShowRegionModal] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false)
  const [showSubTypeModal, setShowSubTypeModal] = useState(false)
  const [showFurnishingModal, setShowFurnishingModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
    shortDescription: '',
    detailedDescription: '',
    // Location & Pricing (Step 2)
    address: '',
    city: '',
    price: '',
    currency: 'INR',
    // Property Details (Step 3)
    propertySize: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    subType: '',
    furnishing: '',
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

  const regionOptions = [
    'Uttar Pradesh',
    'Maharashtra',
    'Delhi',
    'Karnataka',
    'Tamil Nadu',
    'Gujarat',
    'Rajasthan',
    'West Bengal'
  ]

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
    return formData.propertyTitle.trim() && 
           formData.region.trim()
  }

  const isStep2Valid = () => {
    const priceValid = formData.price.trim() && !isNaN(formData.price) && parseFloat(formData.price) > 0
    return formData.city.trim() && priceValid
  }

  const isStep3Valid = () => {
    const sizeValid = formData.propertySize.trim() && !isNaN(formData.propertySize) && parseFloat(formData.propertySize) > 0
    const bedroomsValid = formData.bedrooms.trim() && !isNaN(formData.bedrooms) && parseFloat(formData.bedrooms) > 0
    const bathroomsValid = formData.bathrooms.trim() && !isNaN(formData.bathrooms) && parseFloat(formData.bathrooms) > 0
    return formData.propertyType.trim() !== '' &&
           formData.subType.trim() !== '' &&
           formData.furnishing.trim() !== '' &&
           sizeValid &&
           bedroomsValid &&
           bathroomsValid
  }

  const isStep4Valid = () => {
    // Step 4 has no required fields, all optional
    return true
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
      setCurrentStep(4)
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      }, 100)
    } else if (currentStep === 4 && isStep4Valid()) {
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
      // TODO: Implement API call to create property
      console.log('Form Data:', formData)
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      Snackbar.showSuccess('Property Created', 'Your property has been created successfully')
      navigation.goBack()
    } catch (error) {
      console.error('Error creating property:', error)
      Snackbar.showError('Error', 'Failed to create property. Please try again.')
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
      case 4:
        return isStep4Valid()
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
        return 'Continue'
      case 4:
        return 'Create Property'
      default:
        return 'Continue'
    }
  }

  const getButtonIcon = () => {
    if (currentStep < 4) {
      return <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
    } else {
      return <MaterialIcons name="check" size={20} color="#FFFFFF" />
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
                  <MaterialIcons name="check" size={20} color="#009689" />
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
                  <MaterialIcons name="check" size={20} color="#009689" />
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
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info" size={20} color="#009689" />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>

        {/* Property Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.propertyTitle}
            onChangeText={(text) => updateFormData('propertyTitle', text)}
            onFocus={handleInputFocus}
            placeholder="Enter property title"
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Region */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Region *</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowRegionModal(true)}
          >
            <Text style={[styles.inputText, !formData.region && styles.placeholderText]}>
              {formData.region || 'Select region'}
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
              placeholder="Enter short description"
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
              placeholder="Enter detailed description"
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

  // Step 2: Location & Pricing
  const renderStep2 = () => (
    <View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="location-on" size={20} color="#009689" />
          <Text style={styles.sectionTitle}>Location & Pricing</Text>
        </View>

        {/* Address */}
          <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => updateFormData('address', text)}
            onFocus={handleInputFocus}
            placeholder="Street address"
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={[
              styles.input,
              !formData.city.trim() && styles.inputError
            ]}
            value={formData.city}
            onChangeText={(text) => updateFormData('city', text)}
            onFocus={handleInputFocus}
            placeholder="City"
            placeholderTextColor="#8E8E93"
          />
          {!formData.city.trim() && (
            <Text style={styles.errorText}>City is required.</Text>
          )}
        </View>

        {/* Two-column layout for Price and Currency */}
        <View style={styles.formRow}>
          {/* Price */}
          <View style={[styles.formColumn, { flex: 2 }]}>
            <Text style={styles.inputLabel}>Price *</Text>
            <TextInput
              style={[
                styles.input,
                (!formData.price.trim() || (formData.price && isNaN(formData.price))) && styles.inputError
              ]}
              value={formData.price}
              onChangeText={(text) => updateFormData('price', text)}
              onFocus={handleInputFocus}
              placeholder="e.g. 42000000"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
            />
            {(!formData.price.trim() || (formData.price && isNaN(formData.price))) && (
              <Text style={styles.errorText}>Enter a valid price.</Text>
            )}
          </View>

          {/* Currency */}
          <View style={styles.formColumn}>
            <Text style={styles.inputLabel}>Currency</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowCurrencyModal(true)}
            >
              <Text style={styles.inputText}>{formData.currency}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  // Step 3: Property Details
  const renderStep3 = () => (
    <View>
      {/* Property Details Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="apartment" size={20} color="#009689" />
          <Text style={styles.sectionTitle}>Property Details</Text>
        </View>

        {/* Property Size */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Size (sqft) *</Text>
          <TextInput
            style={[
              styles.input,
              (!formData.propertySize.trim() || (formData.propertySize && isNaN(formData.propertySize))) && styles.inputError
            ]}
            value={formData.propertySize}
            onChangeText={(text) => updateFormData('propertySize', text)}
            onFocus={handleInputFocus}
            placeholder="Enter property size"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          {(!formData.propertySize.trim() || (formData.propertySize && isNaN(formData.propertySize))) && (
            <Text style={styles.errorText}>Property size is required.</Text>
          )}
        </View>

        {/* Bedrooms */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bedrooms *</Text>
          <TextInput
            style={[
              styles.input,
              (!formData.bedrooms.trim() || (formData.bedrooms && isNaN(formData.bedrooms))) && styles.inputError
            ]}
            value={formData.bedrooms}
            onChangeText={(text) => updateFormData('bedrooms', text)}
            onFocus={handleInputFocus}
            placeholder="Enter number of bedrooms"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          {(!formData.bedrooms.trim() || (formData.bedrooms && isNaN(formData.bedrooms))) && (
            <Text style={styles.errorText}>Bedrooms is required.</Text>
          )}
        </View>

        {/* Bathrooms */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bathrooms *</Text>
          <TextInput
            style={[
              styles.input,
              (!formData.bathrooms.trim() || (formData.bathrooms && isNaN(formData.bathrooms))) && styles.inputError
            ]}
            value={formData.bathrooms}
            onChangeText={(text) => updateFormData('bathrooms', text)}
            onFocus={handleInputFocus}
            placeholder="Enter number of bathrooms"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          {(!formData.bathrooms.trim() || (formData.bathrooms && isNaN(formData.bathrooms))) && (
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
          <Text style={styles.inputLabel}>Sub Type *</Text>
          <TouchableOpacity 
            style={[
              styles.input,
              !formData.subType && styles.inputError
            ]}
            onPress={() => setShowSubTypeModal(true)}
          >
            <Text style={[styles.inputText, !formData.subType && styles.placeholderText]}>
              {formData.subType || 'Select sub type'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {!formData.subType && (
            <Text style={styles.errorText}>Sub type is required.</Text>
          )}
        </View>

        {/* Furnishing */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Furnishing *</Text>
          <TouchableOpacity 
            style={[
              styles.input,
              !formData.furnishing && styles.inputError
            ]}
            onPress={() => setShowFurnishingModal(true)}
          >
            <Text style={[styles.inputText, !formData.furnishing && styles.placeholderText]}>
              {formData.furnishing || 'Select furnishing'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {!formData.furnishing && (
            <Text style={styles.errorText}>Furnishing is required.</Text>
          )}
        </View>
      </View>

      {/* Amenities & Features Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="wb-sunny" size={20} color="#009689" />
          <Text style={styles.sectionTitle}>Amenities & Features</Text>
        </View>

        {/* Property Amenities */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Amenities</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Type amenity "
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.propertyAmenities}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, propertyAmenities: text }))}
              onSubmitEditing={(e) => handleAddItem('propertyAmenities', e.nativeEvent.text)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddItem('propertyAmenities', tempAmenityInputs.propertyAmenities)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {formData.propertyAmenities.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('propertyAmenities', index)}>
                  <MaterialIcons name="close" size={16} color="#009689" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Nearby Amenities */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nearby Amenities</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Add nearby amenity"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.nearbyAmenities}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, nearbyAmenities: text }))}
              onSubmitEditing={(e) => handleAddItem('nearbyAmenities', e.nativeEvent.text)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddItem('nearbyAmenities', tempAmenityInputs.nearbyAmenities)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {formData.nearbyAmenities.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('nearbyAmenities', index)}>
                  <MaterialIcons name="close" size={16} color="#009689" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Features</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Add feature"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.features}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, features: text }))}
              onSubmitEditing={(e) => handleAddItem('features', e.nativeEvent.text)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddItem('features', tempAmenityInputs.features)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {formData.features.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('features', index)}>
                  <MaterialIcons name="close" size={16} color="#009689" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Location Benefits */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location Benefits</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Add location benefit"
              placeholderTextColor="#8E8E93"
              value={tempAmenityInputs.locationBenefits}
              onChangeText={(text) => setTempAmenityInputs(prev => ({ ...prev, locationBenefits: text }))}
              onSubmitEditing={(e) => handleAddItem('locationBenefits', e.nativeEvent.text)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddItem('locationBenefits', tempAmenityInputs.locationBenefits)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {formData.locationBenefits.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('locationBenefits', index)}>
                  <MaterialIcons name="close" size={16} color="#009689" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )

  // Step 4: Images, Videos, Status & Notes
  const renderStep4 = () => (
    <View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="photo-library" size={20} color="#009689" />
          <Text style={styles.sectionTitle}>Media & Status</Text>
        </View>

        {/* Images Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Images</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Paste image URL or tap icon to choose files"
              placeholderTextColor="#8E8E93"
              value={tempMediaInputs.images}
              onChangeText={(text) => setTempMediaInputs(prev => ({ ...prev, images: text }))}
              onSubmitEditing={(e) => handleAddMedia('images', e.nativeEvent.text)}
            />
            <TouchableOpacity 
              style={styles.mediaPickerButton}
              onPress={() => showMediaPickerOptions('images')}
            >
              <MaterialIcons name="photo-library" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddMedia('images', tempMediaInputs.images)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {formData.images.map((item, index) => (
              <View key={index} style={styles.mediaTag}>
                <Text style={styles.mediaTagText} numberOfLines={1}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveMedia('images', index)}>
                  <MaterialIcons name="close" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Videos Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Videos</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Paste video URL or tap icon to choose files"
              placeholderTextColor="#8E8E93"
              value={tempMediaInputs.videos}
              onChangeText={(text) => setTempMediaInputs(prev => ({ ...prev, videos: text }))}
              onSubmitEditing={(e) => handleAddMedia('videos', e.nativeEvent.text)}
            />
            <TouchableOpacity 
              style={styles.mediaPickerButton}
              onPress={() => showMediaPickerOptions('videos')}
            >
              <MaterialIcons name="videocam" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddMedia('videos', tempMediaInputs.videos)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {formData.videos.map((item, index) => (
              <View key={index} style={styles.mediaTag}>
                <Text style={styles.mediaTagText} numberOfLines={1}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveMedia('videos', index)}>
                  <MaterialIcons name="close" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Status</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.inputText}>{formData.status}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
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
              placeholder="Internal notes"
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
            <MaterialIcons name="arrow-back" size={24} color="#009689" />
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
              <Text style={styles.title} numberOfLines={1}>Add New Property</Text>
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
                    <MaterialIcons name="check" size={20} color="#009689" />
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
                    <MaterialIcons name="check" size={20} color="#009689" />
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
                    <MaterialIcons name="check" size={20} color="#009689" />
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
                    <MaterialIcons name="check" size={20} color="#009689" />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    minHeight: 48,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formColumn: {
    flex: 1,
  },
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
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
  addButton: {
    backgroundColor: '#009689',
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
    backgroundColor: '#009689',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  // Tag Styles
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#009689',
    fontWeight: '500',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDFA',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalItemTextSelected: {
    color: '#009689',
    fontWeight: '600',
  },
})

export default CreatePropertyScreen

