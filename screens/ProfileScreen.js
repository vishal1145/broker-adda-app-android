import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5, FontAwesome, AntDesign } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { authAPI, brokerRatingsAPI } from '../services/api'
import { storage } from '../services/storage'

const { width, height } = Dimensions.get('window')

const ProfileScreen = ({ navigation }) => {
  // Debug navigation state
  useEffect(() => {
    console.log('ProfileScreen mounted');
    console.log('Navigation state:', navigation.getState());
    console.log('Can go back:', navigation.canGoBack());
  }, []);

  const [profileData, setProfileData] = useState({
    name: 'User',
    brokerId: '',
    role: 'Senior Broker',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    officeAddress: '',
    website: '-',
    firm: '',
    content: '',
    gender: '',
    status: 'Unblock',
    joinedDate: '',
    licenseNumber: '',
    specializations: [],
    regions: [],
    yearsExperience: '0',
    totalClients: '0',
    totalProperty: '0',
    commissionEarned: '$1.2M',
    rating: 4.8,
    socialMedia: {},
    documents: []
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [profileImage, setProfileImage] = useState(null)
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  const [brokerRating, setBrokerRating] = useState(null)

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

  // Helper functions for document file types
  const isImageFile = (url) => {
    if (!url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext))
  }

  const isPdfFile = (url) => {
    if (!url) return false
    const lowerUrl = url.toLowerCase()
    return lowerUrl.includes('.pdf')
  }

  const getFileTypeIcon = (url) => {
    if (isPdfFile(url)) {
      return 'picture-as-pdf'
    } else if (isImageFile(url)) {
      return 'image'
    } else {
      return 'description'
    }
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

  // Fetch user profile data
  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      
      // Get token and broker ID from storage
      const token = await storage.getToken()
      const brokerId = await storage.getBrokerId()
      
      if (token && brokerId) {
        const response = await authAPI.getProfile(brokerId, token)
        
        if (response && response.data && response.data.broker) {
          const broker = response.data.broker
          
          // Map API data to profile data
          const mappedData = {
            name: broker.name || broker.userId?.name || '-',
            brokerId: broker._id || '',
            role: 'Senior Broker', // Default role
            mobileNumber: broker.phone || broker.userId?.phone || '-',
            whatsappNumber: broker.whatsappNumber || broker.phone || broker.userId?.phone || '-',
            email: broker.email || broker.userId?.email || '-',
            officeAddress: broker.address || '-',
            website: broker.website || '-',
            firm: broker.firmName || '-',
            content: broker.content || '',
            gender: broker.gender ? broker.gender.charAt(0).toUpperCase() + broker.gender.slice(1).toLowerCase() : '-',
            status: broker.approvedByAdmin === 'unblocked' ? 'Unblock' : 'Block',
            joinedDate: broker.createdAt ? new Date(broker.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : '-',
            licenseNumber: broker.licenseNumber || '-',
            specializations: broker.specializations || [],
            regions: broker.region ? broker.region.map(r => r.name) : [],
            yearsExperience: broker.experience?.years ? broker.experience.years.toString() : '0',
            totalClients: broker.leadsCreated?.count ? broker.leadsCreated.count.toString() : '0',
            totalProperty: broker.propertyCount !== undefined ? broker.propertyCount.toString() : (broker.propertiesListed?.count ? broker.propertiesListed.count.toString() : '0'),
            commissionEarned: '$1.2M', // Default
            rating: 4.8, // Default
            socialMedia: broker.socialMedia || {},
            documents: [
              {
                id: 1,
                name: 'Aadhar Card',
                fileType: broker.kycDocs?.aadhar ? (broker.kycDocs.aadhar.includes('.pdf') ? 'PDF' : 'JPEG') : 'JPEG',
                hasFile: !!broker.kycDocs?.aadhar,
                url: getSecureImageUrl(broker.kycDocs?.aadhar) || ''
              },
              {
                id: 2,
                name: 'PAN Card',
                fileType: broker.kycDocs?.pan ? (broker.kycDocs.pan.includes('.pdf') ? 'PDF' : 'JPEG') : 'JPEG',
                hasFile: !!broker.kycDocs?.pan,
                url: getSecureImageUrl(broker.kycDocs?.pan) || ''
              },
              {
                id: 3,
                name: 'GST Certificate',
                fileType: broker.kycDocs?.gst ? (broker.kycDocs.gst.includes('.pdf') ? 'PDF' : 'JPEG') : 'JPEG',
                hasFile: !!broker.kycDocs?.gst,
                url: getSecureImageUrl(broker.kycDocs?.gst) || ''
              },
              {
                id: 4,
                name: 'Broker License',
                fileType: broker.kycDocs?.brokerLicense ? (broker.kycDocs.brokerLicense.includes('.pdf') ? 'PDF' : 'JPEG') : 'PDF',
                hasFile: !!broker.kycDocs?.brokerLicense,
                url: getSecureImageUrl(broker.kycDocs?.brokerLicense) || ''
              },
              {
                id: 5,
                name: 'Company Identification Details',
                fileType: broker.kycDocs?.companyId ? (broker.kycDocs.companyId.includes('.pdf') ? 'PDF' : 'JPEG') : 'JPEG',
                hasFile: !!broker.kycDocs?.companyId,
                url: getSecureImageUrl(broker.kycDocs?.companyId) || ''
              }
            ].filter(doc => {
              // Filter out documents with empty URLs or blank kycDocs values
              const kycKey = doc.id === 1 ? 'aadhar' : 
                           doc.id === 2 ? 'pan' :
                           doc.id === 3 ? 'gst' :
                           doc.id === 4 ? 'brokerLicense' :
                           'companyId'
              const kycValue = broker.kycDocs?.[kycKey]
              
              // Only show documents that have a non-empty kycDocs value
              return kycValue && kycValue.trim() !== '' && doc.url && doc.url.trim() !== ''
            })
          }
          
          setProfileData(mappedData)
          
          // Set profile image if available with secure URL
          if (broker.brokerImage) {
            const secureImageUrl = getSecureImageUrl(broker.brokerImage)
            setProfileImage(secureImageUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Keep default values if API fails
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch broker ratings
  const fetchBrokerRatings = async () => {
    try {
      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      if (token && userId) {
        const response = await brokerRatingsAPI.getBrokerRatings(userId, token)
        
        if (response && response.success && response.data && response.data.stats) {
          setBrokerRating(response.data.stats.averageRating)
        }
      }
    } catch (error) {
      console.error('Error fetching broker ratings:', error)
      // Keep rating as null if API fails
    }
  }

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData()
    fetchBrokerRatings()
  }, [])

  const handleLogout = async () => {
    try {
      // Clear all stored data from localStorage
      await storage.clearAuthData()
      console.log('All auth data cleared successfully')
      
      // Reset navigation stack and navigate to phone login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'PhoneLogin' }],
      })
    } catch (error) {
      console.error('Error clearing auth data:', error)
      // Still navigate to phone login even if clearing fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'PhoneLogin' }],
      })
    }
  }

  const handlePreviewDocument = async (documentUrl) => {
    try {
      console.log('Preview document:', documentUrl)
      if (!documentUrl) {
        Alert.alert('Error', 'Document URL not available')
        return
      }
      
      // Open document in default browser/app
      const supported = await Linking.canOpenURL(documentUrl)
      if (supported) {
        await Linking.openURL(documentUrl)
      } else {
        Alert.alert('Error', 'Cannot open this document type')
      }
    } catch (error) {
      console.error('Error opening document:', error)
      Alert.alert('Error', 'Failed to open document')
    }
  }


  const handleEditProfile = () => {
    // Navigate to CreateProfile screen for editing with edit mode flag
    console.log('Navigating to CreateProfile screen for editing')
    navigation.navigate('CreateProfile', { isEdit: true })
  }

  const StatCard = ({ icon, title, value, color, bgColor }) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  )

  const InfoCard = ({ title, items, icon }) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialIcons name={icon} size={24} color="#009689" />
      <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <MaterialIcons name={item.icon} size={20} color="#009689" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  )

  const statusBarHeight = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0)

  return (
    <SafeAreaView style={styles.wrapper} edges={['top','bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
        <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Profile Header */}
        <View style={styles.modernHeaderContainer}>
          <View style={styles.modernHeaderGradient}>
            {/* Background Pattern */}
            <View style={styles.headerPattern}>
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
              <View style={styles.patternCircle3} />
            </View>
            
            <View style={styles.modernHeaderContent}>
              <TouchableOpacity 
                style={[styles.backButton, { top: statusBarHeight + 10 }]} 
                onPress={() => {
                  console.log('Back button pressed');
                  try {
                    // Try to go back first
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      // If can't go back, navigate to MainTabs
                      navigation.navigate('MainTabs');
                    }
                  } catch (error) {
                    console.log('Navigation error:', error);
                    // Fallback: navigate to MainTabs
                    navigation.navigate('MainTabs');
                  }
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modernEditButton, { top: statusBarHeight + 10 }]} onPress={handleEditProfile}>
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.modernProfileSection}>
                <View style={styles.modernProfileImageContainer}>
                  <View style={styles.profileImageWrapper}>
                    {profileImage ? (
                      <SafeImage 
                        source={{ uri: profileImage }}
                        style={styles.modernProfileImage}
                        imageType="profileImage"
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.modernProfileImage, styles.profileImagePlaceholder]}>
                        <Text style={styles.profileImagePlaceholderText}>
                          {(profileData.name && profileData.name[0]) ? profileData.name[0].toUpperCase() : 'U'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.profileImageOverlay} />
                  </View>
                </View>
                
                <View style={styles.profileInfoContainer}>
                  <Text style={styles.modernProfileName}>{profileData.name || 'User'}</Text>
                  <View style={styles.companyContainer}>
                    <MaterialIcons name="business" size={16} color="#FFFFFF" />
                    <Text style={styles.modernFirmName}>{profileData.firm}</Text>
                  </View>
                  
                  {/* Broker Rating */}
                  {brokerRating !== null && (
                    <View style={styles.ratingContainer}>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialIcons 
                            key={star} 
                            name="star" 
                            size={18} 
                            color={star <= Math.round(brokerRating) ? "#FFD700" : "rgba(255, 255, 255, 0.3)"} 
                          />
                        ))}
                      </View>
                      <Text style={styles.ratingText}>{brokerRating.toFixed(1)}</Text>
                    </View>
                  )}
                  
                  {profileData.content && profileData.content.trim() && (
                    <View style={styles.contentContainer}>
                      <Text style={styles.modernContentText}>{profileData.content}</Text>
                    </View>
                  )}
                  
                  <View style={styles.profileStats}>
                    <View style={styles.profileStatItem}>
                      <Text style={styles.profileStatValue}>{profileData.yearsExperience}</Text>
                      <Text style={styles.profileStatLabel} numberOfLines={1}>Experience</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStatItem}>
                      <Text style={styles.profileStatValue}>{profileData.totalClients}</Text>
                      <Text style={styles.profileStatLabel} numberOfLines={1}>Total Leads</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStatItem}>
                      <Text style={styles.profileStatValue}>{profileData.totalProperty}</Text>
                      <Text style={styles.profileStatLabel} numberOfLines={1}>Total Property</Text>
                    </View>
                  </View>
                  
                  {/* Additional Info in Header */}
                  <View style={styles.headerAdditionalInfo}>
                    {profileData.gender && profileData.gender !== '-' && (
                      <View style={styles.headerInfoItem}>
                        <MaterialIcons name="person" size={12} color="rgba(255, 255, 255, 0.9)" />
                        <Text style={styles.headerInfoText}>{profileData.gender}</Text>
                      </View>
                    )}
                    {profileData.joinedDate && profileData.joinedDate !== '-' && (
                      <View style={styles.headerInfoItem}>
                        <MaterialIcons name="calendar-today" size={12} color="rgba(255, 255, 255, 0.9)" />
                        <Text style={styles.headerInfoText}>{profileData.joinedDate}</Text>
                      </View>
                    )}
                    {profileData.licenseNumber && profileData.licenseNumber !== '-' && (
                      <View style={styles.headerInfoItem}>
                        <MaterialIcons name="description" size={12} color="rgba(255, 255, 255, 0.9)" />
                        <Text style={styles.headerInfoText}>{profileData.licenseNumber}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>


        {/* Specializations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.tagsContainer}>
            {profileData.specializations && profileData.specializations.length > 0 ? (
              profileData.specializations.map((spec, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No specializations added yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Regions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regions</Text>
          <View style={styles.tagsContainer}>
            {profileData.regions && profileData.regions.length > 0 ? (
              profileData.regions.map((region, index) => (
                <View key={index} style={[styles.tag, styles.regionTag]}>
                  <Text style={[styles.tagText, styles.regionTagText]}>{region}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No regions added yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <MaterialIcons name="phone" size={22} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mobile</Text>
                <View style={styles.valueWithIcon}>
                  <Text style={styles.infoValue}>{profileData.mobileNumber}</Text>
                  {profileData.mobileNumber && profileData.mobileNumber !== '-' && String(profileData.mobileNumber).trim() !== '' ? (
                    <MaterialIcons style={styles.verifiedIcon} name="verified" size={16} color="#10B981" />
                  ) : null}
                </View>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <MaterialIcons name="chat" size={22} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>WhatsApp</Text>
                <Text style={styles.infoValue}>{profileData.whatsappNumber}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <MaterialIcons name="email" size={22} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <View style={styles.valueWithIcon}>
                  <Text style={styles.infoValue}>{profileData.email}</Text>
                  {profileData.email && profileData.email !== '-' && String(profileData.email).trim() !== '' ? (
                    <MaterialIcons style={styles.verifiedIcon} name="verified" size={16} color="#10B981" />
                  ) : null}
                </View>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <MaterialIcons name="location-on" size={22} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Office Address</Text>
                <Text style={styles.infoValue}>{profileData.officeAddress}</Text>
              </View>
            </View>
            
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoIconWrapper}>
                <MaterialIcons name="language" size={22} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={styles.infoValue}>{profileData.website}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <View style={styles.socialMediaContainer}>
            {profileData.socialMedia && Object.keys(profileData.socialMedia).length > 0 && 
             Object.values(profileData.socialMedia).some(url => url && url.trim() !== '') ? (
              <View style={styles.socialMediaIconsRow}>
                {Object.entries(profileData.socialMedia)
                  .filter(([platform, url]) => url && url.trim() !== '')
                  .map(([platform, url]) => {
                    const getSocialIcon = (platform) => {
                      switch (platform) {
                        case 'linkedin':
                          return <FontAwesome name="linkedin" size={28} color="#0077B5" />
                        case 'twitter':
                          return <FontAwesome name="twitter" size={28} color="#1DA1F2" />
                        case 'instagram':
                          return <FontAwesome name="instagram" size={28} color="#E4405F" />
                        case 'facebook':
                          return <FontAwesome name="facebook" size={28} color="#1877F2" />
                        default:
                          return <MaterialIcons name="link" size={28} color="#6B7280" />
                      }
                    }

                    const openSocialLink = async () => {
                      try {
                        let urlToOpen = url
                        // Ensure URL has protocol
                        if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
                          urlToOpen = `https://${urlToOpen}`
                        }
                        const supported = await Linking.canOpenURL(urlToOpen)
                        if (supported) {
                          await Linking.openURL(urlToOpen)
                        } else {
                          Alert.alert('Error', 'Cannot open this link')
                        }
                      } catch (error) {
                        console.error('Error opening social media link:', error)
                        Alert.alert('Error', 'Failed to open link')
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={platform}
                        style={styles.socialMediaIconButton}
                        onPress={openSocialLink}
                        activeOpacity={0.7}
                      >
                        {getSocialIcon(platform)}
                      </TouchableOpacity>
                    )
                  })}
              </View>
            ) : (
              <View style={styles.emptySocialMediaContainer}>
                <MaterialIcons name="share" size={48} color="#9CA3AF" />
                <Text style={styles.emptySocialMediaText}>No social media links added yet</Text>
                <Text style={styles.emptySocialMediaSubtext}>Social media links will appear here once added</Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents Section - CreateProfile Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          
          <View style={styles.documentsGrid}>
            {profileData.documents && profileData.documents.length > 0 ? (
              profileData.documents.map((document, index) => {
                const hasDocument = document.hasFile && document.url
                const isImage = hasDocument && isImageFile(document.url)
                const isPdf = hasDocument && isPdfFile(document.url)
                
                return (
                  <View key={document.id} style={styles.documentCardWrapper}>
                    {/* Document Title Above Card */}
                    <Text style={styles.documentTitleAbove}>{document.name}</Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.documentCard,
                        hasDocument && styles.documentCardUploaded
                      ]}
                      onPress={() => hasDocument ? handlePreviewDocument(document.url) : null}
                      activeOpacity={0.8}
                    >
                      {hasDocument ? (
                        <View style={styles.documentImageWrapper}>
                          {isImage ? (
                            <SafeImage 
                              source={{ uri: document.url }} 
                              style={styles.documentFullImage}
                              imageType={document.name}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.documentFilePreview, hasDocument && styles.documentFilePreviewUploaded]}>
                              <MaterialIcons 
                                name={getFileTypeIcon(document.url)} 
                                size={48} 
                                color="#0D542BFF" 
                              />
                              <Text style={[styles.fileTypeText, hasDocument && styles.fileTypeTextUploaded]}>
                                {isPdf ? 'PDF Document' : 'Document'}
                              </Text>
                              <Text style={[styles.fileNameText, hasDocument && styles.fileNameTextUploaded]} numberOfLines={1}>
                                {document.url.split('/').pop() || document.name}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={(e) => {
                              e.stopPropagation?.()
                              handlePreviewDocument(document.url)
                            }}
                          >
                            <MaterialIcons name="visibility" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.documentPlaceholder}>
                          <MaterialIcons 
                            name="cloud-upload" 
                            size={48} 
                            color="#8E8E93" 
                          />
                          <Text style={styles.uploadText}>Upload {document.name}</Text>
                          <Text style={styles.formatText}>PDF, JPG, PNG up to 10MB</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )
              })
            ) : (
              <View style={styles.emptyDocumentsContainer}>
                <MaterialIcons name="folder-open" size={48} color="#9CA3AF" />
                <Text style={styles.emptyDocumentsText}>No documents available</Text>
                <Text style={styles.emptyDocumentsSubtext}>Documents will appear here once uploaded</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
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
  
  // Modern Header Styles
  modernHeaderContainer: {
    marginBottom: 20,
  },
  modernHeaderGradient: {
    backgroundColor: '#0D542BFF',
    paddingBottom: 30,
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
  modernHeaderContent: {
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 2,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  modernEditButton: {
    position: 'absolute',
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  modernProfileSection: {
    alignItems: 'center',
    paddingTop: 12,
  },
  modernProfileImageContainer: {
    position: 'relative',
    marginBottom: 16,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    position: 'relative',
  },
  modernProfileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  modernStatusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  modernStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
  },
  statusPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    top: -3,
    left: -3,
  },
  profileBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  modernProfileName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nameLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholderText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  modernProfileRole: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modernFirmName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
    alignSelf: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  contentContainer: {
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  modernContentText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingStar: {
    marginRight: 1,
  },
  modernRatingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  modernRatingLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    flexShrink: 1,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  headerAdditionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  headerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfoText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Advanced Statistics Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statsSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsSubtitleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#009689',
  },
  advancedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  advancedStatCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    minHeight: 140,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  advancedStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  advancedStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  statProgressBar: {
      height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    borderRadius: 2,
  },


  // Section Styles
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Direct Info Styles (Professional and Contact Information)
  infoContainer: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoContent: {
    flex: 1,
    paddingTop: 2,
    justifyContent: 'flex-start',
  },
  infoContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoLabelInline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  infoValueInline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    textAlign: 'right',
  },
  infoStatusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D542BFF',
    marginLeft: 12,
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#0D542BFF',
  },
  statusBadgeBlocked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadgeTextActive: {
    color: '#0D542BFF',
  },
  statusBadgeTextBlocked: {
    color: '#EF4444',
  },

  // CreateProfile Style Document Styles
  documentsGrid: {
    flexDirection: 'column',
  },
  documentCardWrapper: {
    marginBottom: 20,
  },
  documentTitleAbove: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
  documentCardUploaded: {
    backgroundColor: '#E8F5E8',
    // borderColor: '#0D542BFF',
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
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#8E8E93',
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
  documentFilePreviewUploaded: {
    backgroundColor: '#E8F5E8',
  },
  fileTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D542BFF',
    marginTop: 8,
    textAlign: 'center',
  },
  fileTypeTextUploaded: {
    color: '#0D542BFF',
  },
  fileNameText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '90%',
  },
  fileNameTextUploaded: {
    color: '#0D542BFF',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  regionTag: {
    backgroundColor: '#F3F4F6',
  },
  regionTagText: {
    color: '#374151',
  },
  emptyStateContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyDocumentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyDocumentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDocumentsSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Social Media Styles
  socialMediaContainer: {
    marginTop: 8,
  },
  socialMediaIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  socialMediaIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: '#0D542BFF',
  },
  emptySocialMediaContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySocialMediaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySocialMediaSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Documents
  documentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  documentIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
    marginRight: 16,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  uploadDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
})

export default ProfileScreen
