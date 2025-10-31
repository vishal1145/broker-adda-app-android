import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg'
import { authAPI } from '../services/api'
import { storage } from '../services/storage'
const { width } = Dimensions.get('window')

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('')
  const [userProfile, setUserProfile] = useState(null)
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
            <MaterialIcons name="refresh" size={12} color="#0D542BFF" />
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
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      
      // Get token and broker ID from storage
      const token = await storage.getToken()
      const brokerId = await storage.getBrokerId()
      
      if (token && brokerId) {
        const response = await authAPI.getProfile(brokerId, token)
        
        if (response && response.data && response.data.broker) {
          const broker = response.data.broker
          setUserProfile(broker)
          
          // Set user name from profile data
          const name = broker.name || broker.userId?.name || 'User'
          setUserName(name)
          
          // Save broker _id as userId
          if (broker._id) {
            await storage.saveUserId(broker._id)
            console.log('User ID saved:', broker._id)
          }
          
          // Set profile image if available with secure URL
          if (broker.brokerImage) {
            const secureImageUrl = getSecureImageUrl(broker.brokerImage)
            setProfileImage(secureImageUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Set default name if API fails
      setUserName('User')
    } finally {
      setIsLoading(false)
    }
  }

  // Load profile data on component mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleLogout = () => {
    // Clear stored data and navigate back to login screen
    storage.clearAuthData()
    navigation.navigate('Login')
  }

  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile')
  }
  
  // Performance data matching the screenshot
  const [performanceData] = useState({
    totalLeadsCreated: 1250,
    leadsReceived: 890,
    leadsClosed: 450,
    leadsInProgress: 210,
    leadsCreatedChange: 8.5,
    leadsReceivedChange: 12.3,
    leadsClosedChange: 5.1,
    leadsInProgressChange: 2.8
  })

  // Properties data
  const [propertiesData] = useState({
    activeProperties: 75,
    soldExpired: 15,
    pendingApproval: 8,
    activeChange: 4.5,
    soldChange: 4.5,
    pendingChange: 4.5
  })

  // Messages data
  const [messagesData] = useState({
    unreadMessages: 12,
    customerInquiries: 5
  })

  // Notifications data
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Announcement: Q3 Performance Review',
      description: 'Read the latest company-wide performance update.',
      time: '2 hours ago',
      type: 'announcement',
      icon: 'notifications',
      iconColor: '#FFD700'
    },
    {
      id: 2,
      title: 'Lead Transfer: John Doe from Sarah K.',
      description: 'New lead for \'123 Oak St\' transferred to you.',
      time: '5 hours ago',
      type: 'transfer',
      icon: 'flash-on',
      iconColor: '#FF9800'
    },
    {
      id: 3,
      title: 'Action Required: Incomplete Lead Profile',
      description: 'Update missing details for \'Jane Smith\'.',
      time: '1 day ago',
      type: 'action',
      icon: 'warning',
      iconColor: '#F44336'
    }
  ])

  // Leads by status data
  const [leadsStatusData] = useState({
    closed: 45,
    inProgress: 25,
    new: 18,
    rejected: 12
  })

  const DonutChart = ({ data, size = 200 }) => {
    const colors = {
      closed: '#2E7D32',
      inProgress: '#FFD700', 
      new: '#2196F3',
      rejected: '#F44336'
    }

    const segments = [
      { color: colors.closed, percentage: data.closed, label: 'Closed' },
      { color: colors.inProgress, percentage: data.inProgress, label: 'In Progress' },
      { color: colors.new, percentage: data.new, label: 'New' },
      { color: colors.rejected, percentage: data.rejected, label: 'Rejected' }
    ]

    const radius = size / 2 - 20
    const innerRadius = radius - 25
    const centerX = size / 2
    const centerY = size / 2

    // Create donut chart using stroke-based approach
    return (
      <View style={styles.donutContainer}>
        <Svg width={size} height={size} style={styles.donutSvg}>
          <G transform={`translate(${centerX}, ${centerY})`}>
            {/* Background circle */}
            <Circle
              r={radius}
              stroke="#F5F5F5"
              strokeWidth={25}
              fill="transparent"
            />
            
            {/* Segments using stroke */}
            {segments.map((segment, index) => {
              const circumference = 2 * Math.PI * radius
              const segmentLength = (segment.percentage / 100) * circumference
              const strokeDasharray = `${segmentLength} ${circumference}`
              const strokeDashoffset = -((segments.slice(0, index).reduce((sum, s) => sum + s.percentage, 0) / 100) * circumference)
              
              return (
                <Circle
                  key={index}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={25}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90)`}
                />
              )
            })}
            
            {/* Center hole */}
            <Circle
              r={innerRadius}
              fill="#FFFFFF"
            />
          </G>
        </Svg>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          {/* First row: Closed and In Progress */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.closed }]} />
              <Text style={styles.legendText}>Closed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.inProgress }]} />
              <Text style={styles.legendText}>In Progress</Text>
            </View>
          </View>
          
          {/* Second row: New and Rejected */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.new }]} />
              <Text style={styles.legendText}>New</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.rejected }]} />
              <Text style={styles.legendText}>Rejected</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const MetricCard = ({ title, value, change, icon, iconColor, isDownward = false }) => (
    <View style={styles.metricCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <MaterialIcons name={icon} size={16} color={iconColor === "#0D542BFF" ? "#FFFFFF" : "#0D542BFF"} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.changePill}>
          <MaterialIcons name={isDownward ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} size={12} color="#0D542BFF" />
          <Text style={styles.changeText}>{change}%</Text>
        </View>
      </View>
      <Text style={styles.cardValue}>{value.toLocaleString()}</Text>
    </View>
  )

  const NotificationItem = ({ notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <MaterialIcons name={notification.icon} size={20} color={notification.iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationDescription}>{notification.description}</Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
        <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
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
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeGreeting}>Welcome back,</Text>
                {isLoading ? (
                  <View style={styles.nameLoadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.welcomeName}>Loading...</Text>
                  </View>
                ) : (
                  <Text style={styles.welcomeName}>{userName}</Text>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeNumber}>3</Text>
                </View>
                <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                <View style={styles.profileImageContainer}>
                  {profileImage ? (
                    <SafeImage 
                      source={{ uri: profileImage }} 
                      style={styles.profileImage}
                      imageType="profileImage"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.profileInitials}>
                      {isLoading ? '?' : (userName[0] || 'U').toUpperCase()}
                    </Text>
                  )}
                  <View style={styles.profileOnlineIndicator} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>


        {/* Performance Summary - Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconWrapper}>
                <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Performance Summary</Text>
            </View>
          </View>
          
          <View style={styles.performanceGrid}>
            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.metricGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.metricCardHeader}>
                  <View style={styles.metricIconContainer}>
                    <MaterialIcons name="trending-up" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.changeIndicator}>
                    <MaterialIcons name="keyboard-arrow-up" size={16} color="#FFFFFF" />
                    <Text style={styles.changeTextWhite}>+{performanceData.leadsCreatedChange}%</Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{performanceData.totalLeadsCreated.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Leads Created</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.metricGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.metricCardHeader}>
                  <View style={styles.metricIconContainer}>
                    <MaterialIcons name="attach-money" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.changeIndicator}>
                    <MaterialIcons name="keyboard-arrow-up" size={16} color="#FFFFFF" />
                    <Text style={styles.changeTextWhite}>+{performanceData.leadsReceivedChange}%</Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{performanceData.leadsReceived.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Leads Received</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                style={styles.metricGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.metricCardHeader}>
                  <View style={styles.metricIconContainer}>
                    <MaterialIcons name="assignment-turned-in" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.changeIndicator}>
                    <MaterialIcons name="keyboard-arrow-up" size={16} color="#FFFFFF" />
                    <Text style={styles.changeTextWhite}>+{performanceData.leadsClosedChange}%</Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{performanceData.leadsClosed.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Leads Closed</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.metricGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.metricCardHeader}>
                  <View style={styles.metricIconContainer}>
                    <MaterialIcons name="group" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.changeIndicator}>
                    <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFFFFF" />
                    <Text style={styles.changeTextWhite}>-{performanceData.leadsInProgressChange}%</Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{performanceData.leadsInProgress.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Leads In Progress</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Properties Summary - Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconWrapper}>
                <MaterialIcons name="business" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Properties Summary</Text>
            </View>
          </View>
          
          <View style={styles.propertiesContainer}>
            <View style={styles.propertyCard}>
              <View style={styles.propertyCardHeader}>
                <View style={styles.propertyIconContainer}>
                  <MaterialIcons name="business" size={24} color="#0D542BFF" />
                </View>
                <View style={styles.propertyChangeContainer}>
                  <MaterialIcons name="keyboard-arrow-up" size={16} color="#10B981" />
                  <Text style={styles.propertyChangeText}>+{propertiesData.activeChange}%</Text>
                </View>
              </View>
              <Text style={styles.propertyValue}>{propertiesData.activeProperties}</Text>
              <Text style={styles.propertyLabel}>Active Properties</Text>
              <View style={styles.propertyProgressBar}>
                <View style={[styles.propertyProgressFill, { width: '75%' }]} />
              </View>
            </View>

            <View style={styles.propertyCard}>
              <View style={styles.propertyCardHeader}>
                <View style={styles.propertyIconContainer}>
                  <MaterialIcons name="home" size={24} color="#0D542BFF" />
                </View>
                <View style={styles.propertyChangeContainer}>
                  <MaterialIcons name="keyboard-arrow-up" size={16} color="#10B981" />
                  <Text style={styles.propertyChangeText}>+{propertiesData.soldChange}%</Text>
                </View>
              </View>
              <Text style={styles.propertyValue}>{propertiesData.soldExpired}</Text>
              <Text style={styles.propertyLabel}>Sold/Expired</Text>
              <View style={styles.propertyProgressBar}>
                <View style={[styles.propertyProgressFill, { width: '15%' }]} />
              </View>
            </View>

            <View style={styles.propertyCard}>
              <View style={styles.propertyCardHeader}>
                <View style={styles.propertyIconContainer}>
                  <MaterialIcons name="location-on" size={24} color="#0D542BFF" />
                </View>
                <View style={styles.propertyChangeContainer}>
                  <MaterialIcons name="keyboard-arrow-up" size={16} color="#10B981" />
                  <Text style={styles.propertyChangeText}>+{propertiesData.pendingChange}%</Text>
                </View>
              </View>
              <Text style={styles.propertyValue}>{propertiesData.pendingApproval}</Text>
              <Text style={styles.propertyLabel}>Pending Approval</Text>
              <View style={styles.propertyProgressBar}>
                <View style={[styles.propertyProgressFill, { width: '8%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Messages & Inquiries - Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconWrapper}>
                <MaterialIcons name="mail" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Messages & Inquiries</Text>
            </View>
          </View>
          
          <View style={styles.messagesContainer}>
            <View style={styles.messageCard}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.messageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.messageCardContent}>
                  <View style={styles.messageIconContainer}>
                    <MaterialIcons name="mail" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={styles.messageTitle}>Unread Messages</Text>
                    <Text style={styles.messageSubtitle}>New messages waiting</Text>
                  </View>
                  <View style={styles.messageBadgeContainer}>
                    <Text style={styles.messageBadgeText}>{messagesData.unreadMessages}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.messageCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.messageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.messageCardContent}>
                  <View style={styles.messageIconContainer}>
                    <MaterialIcons name="chat" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={styles.messageTitle}>Customer Inquiries</Text>
                    <Text style={styles.messageSubtitle}>Pending responses</Text>
                  </View>
                  <View style={styles.messageBadgeContainer}>
                    <Text style={styles.messageBadgeText}>{messagesData.customerInquiries}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Notifications - Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconWrapper}>
                <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#0D542BFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.notificationsContainer}>
            {notifications.map((notification, index) => (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationCardHeader}>
                  <View style={[styles.notificationIconContainer, { backgroundColor: notification.iconColor + '20' }]}>
                    <MaterialIcons name={notification.icon} size={20} color={notification.iconColor} />
                  </View>
                  <View style={styles.notificationTimeContainer}>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </View>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationDescription}>{notification.description}</Text>
                <View style={styles.notificationTypeContainer}>
                  <Text style={[styles.notificationType, { color: notification.iconColor }]}>
                    {notification.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Leads by Status - Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconWrapper}>
                <MaterialIcons name="pie-chart" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Leads by Status</Text>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartCard}>
              <DonutChart data={leadsStatusData} size={200} />
            </View>
            <View style={styles.chartStats}>
              <View style={styles.chartStatItem}>
                <View style={[styles.chartStatColor, { backgroundColor: '#2E7D32' }]} />
                <Text style={styles.chartStatLabel}>Closed</Text>
                <Text style={styles.chartStatValue}>{leadsStatusData.closed}%</Text>
              </View>
              <View style={styles.chartStatItem}>
                <View style={[styles.chartStatColor, { backgroundColor: '#FFD700' }]} />
                <Text style={styles.chartStatLabel}>In Progress</Text>
                <Text style={styles.chartStatValue}>{leadsStatusData.inProgress}%</Text>
              </View>
              <View style={styles.chartStatItem}>
                <View style={[styles.chartStatColor, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.chartStatLabel}>New</Text>
                <Text style={styles.chartStatValue}>{leadsStatusData.new}%</Text>
              </View>
              <View style={styles.chartStatItem}>
                <View style={[styles.chartStatColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.chartStatLabel}>Rejected</Text>
                <Text style={styles.chartStatValue}>{leadsStatusData.rejected}%</Text>
              </View>
            </View>
          </View>
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
    paddingBottom: 0,
  },

  // Modern Header Styles
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
  welcomeContainer: {
    marginBottom: 8,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    padding: 4,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
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
    backgroundColor: '#0D542BFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D542BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.5,
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

  // Performance Grid Styles
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  metricGradient: {
    padding: 20,
    minHeight: 140,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 2,
  },
  changeTextDown: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 2,
  },
  changeTextWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Properties Container Styles
  propertiesContainer: {
    gap: 16,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  propertyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  propertyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  propertyChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  propertyChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 2,
  },
  propertyValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  propertyProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  propertyProgressFill: {
    height: '100%',
    backgroundColor: '#0D542BFF',
    borderRadius: 3,
  },

  // Messages Container Styles
  messagesContainer: {
    gap: 16,
  },
  messageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  messageGradient: {
    padding: 20,
  },
  messageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  messageInfo: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageBadgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  messageBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Notifications Styles
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D542BFF',
  },
  notificationsContainer: {
    gap: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTimeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  notificationDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  notificationTypeContainer: {
    alignSelf: 'flex-start',
  },
  notificationType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Chart Styles
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  chartStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: (width - 100) / 2,
  },
  chartStatColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  chartStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Donut Chart Styles
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutSvg: {
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#333333',
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
    borderColor: '#0D542BFF',
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

export default HomeScreen