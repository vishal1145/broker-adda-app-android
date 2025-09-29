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
import { Snackbar } from '../utils/snackbar'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { authAPI } from '../services/api'
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

  const genderOptions = ['Male', 'Female', 'Other']
  const specializations = ['Residential', 'Commercial', 'Industrial', 'Land', 'Rental', 'Investment']
  const states = ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat']
  const cities = ['Noida', 'Mumbai', 'Bangalore', 'Chennai', 'Ahmedabad']
  const regions = ['Electronic City', 'Whitefield', 'Koramangala', 'Indiranagar', 'JP Nagar']

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
          }))
          
          // Set existing profile image if available
          if (broker.brokerImage) {
            setProfileImage({
              uri: broker.brokerImage,
              type: 'image/jpeg',
              fileName: 'profile.jpg'
            })
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
            
            // Set existing document URLs for display
            setExistingDocs({
              aadharCard: broker.kycDocs.aadhar || null,
              panCard: broker.kycDocs.pan || null,
              gstCertificate: broker.kycDocs.gst || null,
              brokerLicense: broker.kycDocs.brokerLicense || null,
              companyId: broker.kycDocs.companyId || null
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
    Snackbar.showInfo('View Document', `View functionality for ${docType} will be implemented to open the uploaded file.`)
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
        if (!formData.regions) {
          Snackbar.showValidationError('Please select your regions')
          return false
        }

        return true
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
      if (formData.specializations.length > 0) {
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
      
      // Regions (using a placeholder region ID - you may need to map this to actual region IDs)
      if (formData.regions) {
        profileData.append('brokerDetails[region][]', '68c7a35bf238b8913058a5d4') // Placeholder region ID
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
    <View style={styles.formContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="person" size={20} color="#16BCC0" />
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
    <View style={styles.formContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="work" size={20} color="#16BCC0" />
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
            <MaterialIcons name="location-on" size={16} color="#16BCC0" />
            <Text style={styles.locationButtonText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => updateFormData('address', text)}
          placeholder="Enter your address"
          placeholderTextColor="#8E8E93"
          multiline
        />
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
        <MaterialIcons name="link" size={20} color="#16BCC0" />
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
          <MaterialIcons name="language" size={16} color="#16BCC0" />
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
    <View style={styles.formContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="location-on" size={20} color="#16BCC0" />
        <Text style={styles.sectionTitle}>Preferred Regions *</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Select the regions where you provide real estate services
      </Text>
      
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
          style={styles.input}
          onPress={() => setShowRegionModal(true)}
        >
          <Text style={[styles.inputText, !formData.regions && styles.placeholderText]}>
            {formData.regions || 'Select regions'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderDocuments = () => (
    <View style={styles.formContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="description" size={20} color="#16BCC0" />
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
            <TouchableOpacity 
              key={doc.key} 
              style={styles.documentCard}
              onPress={() => hasDocument ? handleViewDocument(doc.title) : handleDocumentUpload(doc.key)}
            >
              <View style={styles.documentIcon}>
                {selectedImage ? (
                  <Image 
                    source={{ uri: selectedImage.uri }} 
                    style={styles.documentPreview}
                    resizeMode="cover"
                  />
                ) : existingDoc ? (
                  <Image 
                    source={{ uri: existingDoc }} 
                    style={styles.documentPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons 
                    name={hasDocument ? "check-circle" : "cloud-upload"} 
                    size={32} 
                    color={hasDocument ? "#4CAF50" : "#16BCC0"} 
                  />
                )}
              </View>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              <Text style={[styles.documentStatus, hasDocument && styles.documentStatusUploaded]}>
                {hasDocument ? 'View uploaded file' : `Click to upload ${doc.title}`}
              </Text>
              <Text style={styles.documentFormat}>PDF, JPG, PNG up to 10MB</Text>
            </TouchableOpacity>
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
                      const currentSpecs = formData.specializations || []
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
                      <MaterialIcons name="check" size={20} color="#16BCC0" />
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
                    updateFormData(field, option)
                    onClose()
                  }}
                >
                  <Text style={styles.modalItemText}>{option}</Text>
                  {formData[field] === option && (
                    <MaterialIcons name="check" size={20} color="#16BCC0" />
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
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Title */}
        <View style={styles.headerWithTitle}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#16BCC0" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Broker Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16BCC0" />
              <Text style={styles.loadingText}>Loading profile data...</Text>
            </View>
          ) : (
            <View style={styles.singlePageForm}>
              {/* Profile Image Upload */}
              <View style={styles.profileImageContainer}>
                <TouchableOpacity style={styles.profileImageButton} onPress={handleProfileImageUpload}>
                  {profileImage ? (
                    <View style={styles.profileImageWrapper}>
                      <Image 
                        source={{ uri: profileImage.uri }} 
                        style={styles.profileImage}
                        resizeMode="cover"
                        onLoadStart={() => setProfileImageLoading(true)}
                        onLoadEnd={() => setProfileImageLoading(false)}
                      />
                      {profileImageLoading && (
                        <View style={styles.profileImageLoadingOverlay}>
                          <ActivityIndicator size="small" color="#16BCC0" />
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
                      <MaterialIcons name="camera-alt" size={32} color="#16BCC0" />
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
              style={styles.completeButton} 
              onPress={handleCompleteProfile}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.completeButtonText, styles.buttonLoadingText]}>
                    Creating Profile...
                  </Text>
                </View>
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Complete Profile</Text>
                </>
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
        {renderModal('Select Regions', regions, 'regions', showRegionModal, () => setShowRegionModal(false))}

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
  headerWithTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
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
    marginBottom: 16,
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
  profileImageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16BCC0',
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
    backgroundColor: 'rgba(22, 188, 192, 0.9)',
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    color: '#16BCC0',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  documentIcon: {
    marginBottom: 12,
  },
  documentPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    color: '#16BCC0',
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#16BCC0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16BCC0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonTextDisabled: {
    color: '#8E8E93',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalDoneButton: {
    backgroundColor: '#16BCC0',
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
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoadingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default CreateProfileScreen
