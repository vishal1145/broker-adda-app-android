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
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5, FontAwesome, AntDesign } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { authAPI } from '../services/api'
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
    name: '',
    brokerId: '',
    role: 'Senior Broker',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    officeAddress: '',
    website: '-',
    firm: '',
    gender: '',
    status: 'Unblock',
    joinedDate: '',
    licenseNumber: '',
    specializations: [],
    regions: [],
    yearsExperience: '8 Years',
    totalClients: '245',
    activeDeals: '12',
    commissionEarned: '$1.2M',
    rating: 4.8,
    socialMedia: {},
    documents: []
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [profileImage, setProfileImage] = useState(null)
  const [imageLoadErrors, setImageLoadErrors] = useState({})

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
            gender: broker.gender || '-',
            status: broker.approvedByAdmin === 'unblocked' ? 'Unblock' : 'Block',
            joinedDate: broker.createdAt ? new Date(broker.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : '-',
            licenseNumber: broker.licenseNumber || '-',
            specializations: broker.specializations || [],
            regions: broker.region ? broker.region.map(r => r.name) : [],
            yearsExperience: broker.experience?.years ? broker.experience.years.toString() : '8',
            totalClients: broker.leadsCreated?.count ? broker.leadsCreated.count.toString() : '245',
            activeDeals: broker.leadsCreated?.count ? broker.leadsCreated.count.toString() : '12',
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
                name: 'Company ID',
                fileType: broker.kycDocs?.companyId ? (broker.kycDocs.companyId.includes('.pdf') ? 'PDF' : 'JPEG') : 'JPEG',
                hasFile: !!broker.kycDocs?.companyId,
                url: getSecureImageUrl(broker.kycDocs?.companyId) || ''
              }
            ]
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

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData()
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
    // Navigate to CreateProfile screen for editing
    console.log('Navigating to CreateProfile screen')
    navigation.navigate('CreateProfile')
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
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
                style={styles.backButton} 
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
              <TouchableOpacity style={styles.modernEditButton} onPress={handleEditProfile}>
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
                          {isLoading ? '?' : (profileData.name[0] || 'U').toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.profileImageOverlay} />
                  </View>
                  <View style={styles.modernStatusIndicator}>
                    <View style={styles.modernStatusDot} />
                    <View style={styles.statusPulse} />
                  </View>
                  <View style={styles.profileBadge}>
                    <MaterialIcons name="verified" size={16} color="#FFFFFF" />
                  </View>
                </View>
                
                <View style={styles.profileInfoContainer}>
                  {isLoading ? (
                    <View style={styles.nameLoadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.modernProfileName}>Loading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.modernProfileName}>{profileData.name}</Text>
                  )}
                  <View style={styles.companyContainer}>
                    <MaterialIcons name="business" size={16} color="#FFFFFF" />
                    <Text style={styles.modernFirmName}>{profileData.firm}</Text>
                  </View>
                  
                  <View style={styles.modernRatingContainer}>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome5 
                          key={star} 
                          name="star" 
                          size={14} 
                          color={star <= Math.floor(profileData.rating) ? "#FFD700" : "#FFFFFF"} 
                          style={styles.ratingStar}
                        />
                      ))}
                    </View>
                    <Text style={styles.modernRatingText}>{profileData.rating}</Text>
                    <Text style={styles.modernRatingLabel}>(245 reviews)</Text>
                  </View>
                  
                  <View style={styles.profileStats}>
                    <View style={styles.profileStatItem}>
                      <Text style={styles.profileStatValue}>{profileData.yearsExperience}</Text>
                      <Text style={styles.profileStatLabel}>Experience</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStatItem}>
                      <Text style={styles.profileStatValue}>{profileData.totalClients}</Text>
                      <Text style={styles.profileStatLabel}>Total Leads</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStatItem}>
                      <Text style={styles.profileStatValue}>{profileData.activeDeals}</Text>
                      <Text style={styles.profileStatLabel}>Deals</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Advanced Statistics Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.statsSubtitle}>
              <MaterialIcons name="analytics" size={16} color="#009689" />
              <Text style={styles.statsSubtitleText}>Real-time metrics</Text>
            </View>
          </View>
          
          <View style={styles.advancedStatsGrid}>
            {/* Commission Card */}
            <View style={styles.advancedStatCard}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statCardHeader}>
                  <View style={styles.statCardIcon}>
                    <MaterialIcons name="trending-up" size={28} color="#FFFFFF" />
            </View>
                  <View style={styles.statCardTrend}>
                    <MaterialIcons name="arrow-upward" size={16} color="#FFFFFF" />
                    <Text style={styles.statTrendText}>+12%</Text>
                  </View>
                </View>
                <Text style={styles.advancedStatValue}>{profileData.commissionEarned}</Text>
                <Text style={styles.advancedStatLabel}>Commission Earned</Text>
                <View style={styles.statProgressBar}>
                  <View style={[styles.statProgressFill, { width: '85%', backgroundColor: '#FFFFFF' }]} />
                </View>
              </LinearGradient>
          </View>

            {/* Clients Card */}
            <View style={styles.advancedStatCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statCardHeader}>
                  <View style={styles.statCardIcon}>
                    <MaterialIcons name="people" size={28} color="#FFFFFF" />
            </View>
                  <View style={styles.statCardTrend}>
                    <MaterialIcons name="arrow-upward" size={16} color="#FFFFFF" />
                    <Text style={styles.statTrendText}>+8%</Text>
                  </View>
                </View>
                <Text style={styles.advancedStatValue}>{profileData.totalClients}</Text>
                <Text style={styles.advancedStatLabel}>Total Clients</Text>
                <View style={styles.statProgressBar}>
                  <View style={[styles.statProgressFill, { width: '92%', backgroundColor: '#FFFFFF' }]} />
                </View>
              </LinearGradient>
          </View>

            {/* Active Deals Card */}
            <View style={styles.advancedStatCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statCardHeader}>
                  <View style={styles.statCardIcon}>
                    <MaterialIcons name="work" size={28} color="#FFFFFF" />
              </View>
                  <View style={styles.statCardTrend}>
                    <MaterialIcons name="arrow-upward" size={16} color="#FFFFFF" />
                    <Text style={styles.statTrendText}>+5%</Text>
            </View>
                </View>
                <Text style={styles.advancedStatValue}>{profileData.activeDeals}</Text>
                <Text style={styles.advancedStatLabel}>Active Deals</Text>
                <View style={styles.statProgressBar}>
                  <View style={[styles.statProgressFill, { width: '68%', backgroundColor: '#FFFFFF' }]} />
                </View>
              </LinearGradient>
          </View>

            {/* Experience Card */}
            <View style={styles.advancedStatCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statCardHeader}>
                  <View style={styles.statCardIcon}>
                    <MaterialIcons name="schedule" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.statCardTrend}>
                    <MaterialIcons name="star" size={16} color="#FFFFFF" />
                    <Text style={styles.statTrendText}>Expert</Text>
                  </View>
                </View>
                <Text style={styles.advancedStatValue}>{profileData.yearsExperience}</Text>
                <Text style={styles.advancedStatLabel}>Experience</Text>
                <View style={styles.statProgressBar}>
                  <View style={[styles.statProgressFill, { width: '100%', backgroundColor: '#FFFFFF' }]} />
                </View>
              </LinearGradient>
            </View>
          </View>

          </View>

        {/* Broker Information - Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconWrapper}>
                <MaterialIcons name="business" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Broker Information</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Professional</Text>
            </View>
          </View>
          
          <View style={styles.brokerInfoContainer}>
            <View style={styles.brokerInfoCard}>
              <View style={styles.brokerInfoHeader}>
                <View style={styles.brokerInfoIconContainer}>
                  <MaterialIcons name="account-circle" size={32} color="#009689" />
                </View>
                <View style={styles.brokerInfoTitleContainer}>
                  <Text style={styles.brokerInfoTitle}>Professional Details</Text>
                  <Text style={styles.brokerInfoSubtitle}>Company & Personal Information</Text>
                </View>
              </View>
              
              <View style={styles.brokerInfoList}>
                <View style={styles.brokerInfoRow}>
                  <View style={styles.brokerInfoLeft}>
                    <View style={styles.brokerInfoIcon}>
                      <MaterialIcons name="business" size={20} color="#009689" />
                    </View>
                    <Text style={styles.brokerInfoLabel}>Firm</Text>
                  </View>
                  <Text style={styles.brokerInfoValue}>{profileData.firm}</Text>
                </View>
                
                <View style={styles.brokerInfoDivider} />
                
                <View style={styles.brokerInfoRow}>
                  <View style={styles.brokerInfoLeft}>
                    <View style={styles.brokerInfoIcon}>
                      <MaterialIcons name="person" size={20} color="#009689" />
                    </View>
                    <Text style={styles.brokerInfoLabel}>Gender</Text>
                  </View>
                  <Text style={styles.brokerInfoValue}>{profileData.gender}</Text>
                </View>
                
                <View style={styles.brokerInfoDivider} />
                
                <View style={styles.brokerInfoRow}>
                  <View style={styles.brokerInfoLeft}>
                    <View style={styles.brokerInfoIcon}>
                      <MaterialIcons name="schedule" size={20} color="#009689" />
                    </View>
                    <Text style={styles.brokerInfoLabel}>Status</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusIndicator}>
                      <View style={styles.statusDot} />
                    </View>
                    <Text style={styles.statusText}>{profileData.status}</Text>
                  </View>
                </View>
                
                <View style={styles.brokerInfoDivider} />
                
                <View style={styles.brokerInfoRow}>
                  <View style={styles.brokerInfoLeft}>
                    <View style={styles.brokerInfoIcon}>
                      <MaterialIcons name="calendar-today" size={20} color="#009689" />
                    </View>
                    <Text style={styles.brokerInfoLabel}>Joined Date</Text>
                  </View>
                  <Text style={styles.brokerInfoValue}>{profileData.joinedDate}</Text>
                </View>
                
                <View style={styles.brokerInfoDivider} />
                
                <View style={styles.brokerInfoRow}>
                  <View style={styles.brokerInfoLeft}>
                    <View style={styles.brokerInfoIcon}>
                      <MaterialIcons name="description" size={20} color="#009689" />
                    </View>
                    <Text style={styles.brokerInfoLabel}>License Number</Text>
                  </View>
                  <Text style={styles.brokerInfoValue}>{profileData.licenseNumber}</Text>
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
              <Text style={styles.emptyStateText}>No specializations added yet</Text>
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
              <Text style={styles.emptyStateText}>No regions added yet</Text>
            )}
          </View>
        </View>

        {/* Contact Information - Floating Design */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.floatingContainer}>
            <View style={styles.floatingHeader}>
              <View style={styles.floatingIconWrapper}>
                <MaterialIcons name="contact-phone" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.floatingHeaderText}>
                <Text style={styles.floatingTitle}>Get In Touch</Text>
                <Text style={styles.floatingSubtitle}>Reach out anytime</Text>
          </View>
        </View>

            <View style={styles.contactFloatingGrid}>
              <View style={styles.contactFloatingItem}>
                <View style={styles.contactFloatingIcon}>
                  <MaterialIcons name="phone" size={22} color="#FFFFFF" />
              </View>
                <View style={styles.contactFloatingContent}>
                  <Text style={styles.contactFloatingLabel}>Mobile</Text>
                  <View style={styles.contactFloatingValueRow}>
                    <Text style={styles.contactFloatingValue}>{profileData.mobileNumber}</Text>
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="check" size={12} color="#FFFFFF" />
            </View>
          </View>
            </View>
          </View>

              <View style={styles.contactFloatingItem}>
                <View style={styles.contactFloatingIcon}>
                  <MaterialIcons name="chat" size={22} color="#FFFFFF" />
              </View>
                <View style={styles.contactFloatingContent}>
                  <Text style={styles.contactFloatingLabel}>WhatsApp</Text>
                  <Text style={styles.contactFloatingValue}>{profileData.whatsappNumber}</Text>
            </View>
          </View>

              <View style={styles.contactFloatingItem}>
                <View style={styles.contactFloatingIcon}>
                  <MaterialIcons name="email" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.contactFloatingContent}>
                  <Text style={styles.contactFloatingLabel}>Email</Text>
                  <View style={styles.contactFloatingValueRow}>
                    <Text style={styles.contactFloatingValue}>{profileData.email}</Text>
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="check" size={12} color="#FFFFFF" />
                    </View>
                  </View>
            </View>
          </View>

              <View style={styles.contactFloatingItem}>
                <View style={styles.contactFloatingIcon}>
                  <MaterialIcons name="location-on" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.contactFloatingContent}>
                  <Text style={styles.contactFloatingLabel}>Office Address</Text>
                  <Text style={styles.contactFloatingValue}>{profileData.officeAddress}</Text>
            </View>
          </View>

              <View style={styles.contactFloatingItem}>
                <View style={styles.contactFloatingIcon}>
                  <MaterialIcons name="language" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.contactFloatingContent}>
                  <Text style={styles.contactFloatingLabel}>Website</Text>
                  <Text style={styles.contactFloatingValue}>{profileData.website}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <View style={styles.socialMediaContainer}>
            {profileData.socialMedia && Object.keys(profileData.socialMedia).length > 0 ? (
              Object.entries(profileData.socialMedia).map(([platform, url]) => {
                const getSocialIcon = (platform) => {
                  switch (platform) {
                    case 'linkedin':
                      return <FontAwesome name="linkedin" size={24} color="#0077B5" />
                    case 'twitter':
                      return <FontAwesome name="twitter" size={24} color="#1DA1F2" />
                    case 'instagram':
                      return <FontAwesome name="instagram" size={24} color="#E4405F" />
                    case 'facebook':
                      return <FontAwesome name="facebook" size={24} color="#1877F2" />
                    default:
                      return <MaterialIcons name="link" size={24} color="#009689" />
                  }
                }

                return (
                  <View key={platform} style={styles.socialMediaItem}>
                    <View style={styles.socialMediaIcon}>
                      {getSocialIcon(platform)}
                    </View>
                    <View style={styles.socialMediaContent}>
                      <Text style={styles.socialMediaPlatform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Text>
                      <Text style={styles.socialMediaUrl}>{url}</Text>
                    </View>
                  </View>
                )
              })
            ) : (
              <Text style={styles.emptyStateText}>No social media links added yet</Text>
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
                const isImageFile = (url) => {
                  if (!url) return false
                  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
                  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
                }
                const isPdfFile = (url) => {
                  if (!url) return false
                  return url.toLowerCase().includes('.pdf')
                }
                const isImage = hasDocument && isImageFile(document.url)
                const isPdf = hasDocument && isPdfFile(document.url)
                
                return (
                  <View key={document.id} style={styles.documentCardWrapper}>
                    {/* Document Title Above Card */}
                    <Text style={styles.documentTitleAbove}>{document.name}</Text>
                    
                    <TouchableOpacity 
                      style={styles.documentCard}
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
                            <View style={styles.documentFilePreview}>
                              <MaterialIcons 
                                name={isPdf ? 'picture-as-pdf' : 'description'} 
                                size={48} 
                                color="#009689" 
                              />
                              <Text style={styles.fileTypeText}>
                                {isPdf ? 'PDF Document' : 'Document'}
                              </Text>
                              <Text style={styles.fileNameText} numberOfLines={1}>
                                {document.name}
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
                            color="#009689" 
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
    marginBottom: 32,
  },
  modernHeaderGradient: {
    backgroundColor: '#009689',
    paddingTop: 20,
    paddingBottom: 50,
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
    top: 20,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modernEditButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modernProfileSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  modernProfileImageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  modernProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  modernStatusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    top: 8,
    left: 8,
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
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
    gap: 8,
  },
  modernFirmName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Modern Broker Information Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#009689',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009689',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionBadge: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  brokerInfoContainer: {
    marginBottom: 8,
  },
  brokerInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brokerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  brokerInfoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  brokerInfoTitleContainer: {
    flex: 1,
  },
  brokerInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  brokerInfoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  brokerInfoList: {
    gap: 0,
  },
  brokerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  brokerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brokerInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  brokerInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  brokerInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  brokerInfoDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 48,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },

  // Floating Design Styles
  floatingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.1)',
  },
  floatingIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingHeaderText: {
    flex: 1,
  },
  floatingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  floatingSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  contactFloatingGrid: {
    gap: 16,
  },
  contactFloatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  contactFloatingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#009689',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactFloatingContent: {
    flex: 1,
  },
  contactFloatingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  contactFloatingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactFloatingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CreateProfile Style Document Styles
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0FDFA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  regionTag: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  regionTagText: {
    color: '#2563EB',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
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
    gap: 16,
  },
  socialMediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialMediaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialMediaContent: {
    flex: 1,
  },
  socialMediaPlatform: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  socialMediaUrl: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
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
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})

export default ProfileScreen
