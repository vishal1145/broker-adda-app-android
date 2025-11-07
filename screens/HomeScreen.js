import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import Svg, { Circle, G, Path, Text as SvgText, Rect, Line, Polygon } from 'react-native-svg'
import { authAPI, chatAPI, leadsAPI, notificationsAPI, propertiesAPI } from '../services/api'
import { storage } from '../services/storage'
const { width } = Dimensions.get('window')

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileImage, setProfileImage] = useState(null)
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

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
          const name = broker.name || broker.userId?.name || broker.userId?.firstName || 'User'
          if (name && name !== 'User') {
            setUserName(name)
          }
          
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
        } else {
          // No broker data found, keep default 'User'
          setUserName('User')
        }
      } else {
        // No token or broker ID, keep default 'User'
        setUserName('User')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Keep default name if API fails
      setUserName('User')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch chats/connections count
  const fetchConnectionsCount = async () => {
    try {
      const token = await storage.getToken()
      
      if (token) {
        const response = await chatAPI.getChats(token)
        
        if (response && response.success && response.data) {
          // Count the total number of chats/connections
          const connectionsCount = response.data.length || 0
          
          setDashboardCards(prev => ({
            ...prev,
            connections: connectionsCount
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching connections count:', error)
      // Keep default value if API fails
    }
  }

  // Fetch leads and properties metrics
  const fetchMetrics = async () => {
    try {
      const token = await storage.getToken()
      const userId = await storage.getUserId() 
      
      console.log('fetchMetrics called - userId:', userId, 'token:', token ? 'exists' : 'missing')
      
      if (token && userId) {
        console.log('Calling leadsAPI.getMetrics with userId:', userId)
        const response = await leadsAPI.getMetrics(userId, token)
        console.log('getMetrics response:', response)
        
        if (response && response.success && response.data) {
          const metrics = response.data
          
          setDashboardCards(prev => ({
            ...prev,
            totalLeads: metrics.totalLeads || 0,
            propertiesListed: metrics.totalProperties || 0
          }))
        }
      } else {
        console.warn('fetchMetrics: Missing token or userId', { token: !!token, userId: !!userId })
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
      // Keep default values if API fails
    }
  }

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
  }

  // Helper function to format budget as currency
  const formatBudget = (amount) => {
    if (!amount) return '₹0'
    // Convert to Indian currency format
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      const token = await storage.getToken()
      
      if (token) {
        const response = await notificationsAPI.getNotifications(token)
        
        if (response && response.success && response.data && response.data.notifications) {
          // Count unread notifications (where isRead is false)
          const unreadCount = response.data.notifications.filter(
            notification => !notification.isRead
          ).length
          
          setUnreadNotificationCount(unreadCount)
        }
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
      setUnreadNotificationCount(0)
    }
  }

  // Fetch recent notifications
  const fetchRecentNotifications = async () => {
    try {
      const token = await storage.getToken()
      
      if (token) {
        // Fetch more notifications to allow "Show More" functionality
        const response = await notificationsAPI.getRecentNotifications(token, 7)
        
        if (response && response.success && response.data && response.data.notifications) {
          const notifications = response.data.notifications.map((notification, index) => ({
            id: notification._id || index,
            title: notification.title || '',
            timeAgo: formatTimeAgo(notification.createdAt),
            icon: 'notifications'
          }))
          
          // Store all notifications (not limited to 5)
          setRecentActivities(notifications)
        }
      }
    } catch (error) {
      console.error('Error fetching recent notifications:', error)
      // Keep empty array if API fails
      setRecentActivities([])
    }
  }

  // Fetch recent leads
  const fetchRecentLeads = async () => {
    try {
      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      console.log('fetchRecentLeads called - userId:', userId, 'token:', token ? 'exists' : 'missing')
      
      if (token && userId) {
        console.log('Calling leadsAPI.getLeads with userId:', userId)
        const response = await leadsAPI.getLeads(token, userId)
        console.log('getLeads response:', response)
        
        if (response && response.success && response.data && response.data.items) {
          const leads = response.data.items.map((lead) => {
            // Create title from requirement and propertyType
            const title = `${lead.propertyType || 'Property'} for ${lead.requirement || 'Buy'}`
            
            // Get location names
            const preferredLocation = lead.primaryRegion?.name || lead.region?.name || 'N/A'
            const secondaryLocation = lead.secondaryRegion?.name || lead.primaryRegion?.name || 'N/A'
            
            return {
              id: lead._id,
              title: title,
              requirement: lead.requirement || 'Buy',
              propertyType: lead.propertyType || 'Residential',
              timeAgo: formatTimeAgo(lead.createdAt),
              preferredLocation: preferredLocation,
              secondaryLocation: secondaryLocation,
              budget: formatBudget(lead.budget),
              contactName: lead.customerName || 'N/A',
              avatar: null
            }
          })
          
          // Limit to first 5 leads for recent leads section
          setRecentLeads(leads.slice(0, 5))
        }
      } else {
        console.warn('fetchRecentLeads: Missing token or userId', { token: !!token, userId: !!userId })
      }
    } catch (error) {
      console.error('Error fetching recent leads:', error)
      // Keep empty array if API fails
      setRecentLeads([])
    }
  }

  // Fetch recent properties
  const fetchRecentProperties = async () => {
    try {
      const token = await storage.getToken()
      const userId = await storage.getUserId()
      
      console.log('fetchRecentProperties called - userId:', userId, 'token:', token ? 'exists' : 'missing')
      
      if (token && userId) {
        console.log('Calling propertiesAPI.getProperties with userId:', userId)
        // Fetch all properties (no status filter for recent properties)
        const response = await propertiesAPI.getProperties(userId, token, 'all')
        console.log('getProperties response:', response)
        
        if (response && response.success && response.data) {
          const transformedData = transformPropertyData(response.data)
          
          // Limit to first 5 properties for recent properties section
          setRecentProperties(transformedData.slice(0, 5))
        }
      } else {
        console.warn('fetchRecentProperties: Missing token or userId', { token: !!token, userId: !!userId })
      }
    } catch (error) {
      console.error('Error fetching recent properties:', error)
      // Keep empty array if API fails
      setRecentProperties([])
    }
  }

  // Load profile data, metrics, connections count, notifications, leads, and properties on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, fetch user profile to ensure userId is saved
        await fetchUserProfile()
        
        // Small delay to ensure userId is saved to storage
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Then fetch other data that may depend on userId
        console.log('Loading dashboard data...')
        fetchConnectionsCount()
        fetchMetrics()
        fetchUnreadNotificationCount()
        fetchRecentNotifications()
        fetchRecentLeads()
        fetchRecentProperties()
      } catch (error) {
        console.error('Error loading initial data:', error)
        // Still try to load other data even if profile fetch fails
        fetchConnectionsCount()
        fetchMetrics()
        fetchUnreadNotificationCount()
        fetchRecentNotifications()
        fetchRecentLeads()
        fetchRecentProperties()
      }
    }
    
    loadData()
  }, [])

  const handleLogout = () => {
    // Clear stored data and navigate back to login screen
    storage.clearAuthData()
    navigation.navigate('Login')
  }

  const handleMessagePress = () => {
    navigation.navigate('Notifications')
  }

  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile')
  }
  
  // Dashboard cards data matching the image
  const [dashboardCards, setDashboardCards] = useState({
    totalLeads: 0,
    totalLeadsChange: 12.5,
    propertiesListed: 0,
    propertiesListedChange: 8.2,
    inquiriesReceived: 743,
    inquiriesReceivedChange: 3.1,
    connections: 0,
    connectionsChange: 20
  })

  // Leads by status data
  const [leadsStatusData] = useState({
    closed: 45,
    inProgress: 25,
    new: 18,
    rejected: 12
  })

  // Charts data
  const [leadsByMonthData] = useState([
    { month: 'Jan', leads: 110 },
    { month: 'Feb', leads: 140 },
    { month: 'Mar', leads: 160 },
    { month: 'Apr', leads: 140 },
    { month: 'May', leads: 160 },
    { month: 'Jun', leads: 180 }
  ])

  const [leadSourcesData] = useState({
    website: 42,
    referral: 24,
    social: 18,
    other: 16
  })

  const [closedDealData] = useState([
    { period: 'Jan', deals: 5 },
    { period: 'Feb', deals: 7 },
    { period: 'Mar', deals: 6.5 },
    { period: 'Apr', deals: 8.5 },
    { period: 'May', deals: 9 }
  ])

  // Performance Summary data
  const [performanceSummary] = useState([
    {
      id: 1,
      title: 'Lead Conversion Rate',
      target: '80%',
      value: '75%',
      percentage: 75,
      color: '#2E7D32'
    },
    {
      id: 2,
      title: 'Average Response Time',
      target: '4 hours',
      value: '90 mins',
      percentage: 75, // Visual representation showing better performance
      color: '#1F2937'
    },
    {
      id: 3,
      title: 'Property Approval Ratio',
      target: '90%',
      value: '85%',
      percentage: 85,
      color: '#1F2937'
    }
  ])

  // Recent Leads data
  const [recentLeads, setRecentLeads] = useState([])

  // Properties data
  const [recentProperties, setRecentProperties] = useState([])

  // Transform API data to match screen expectations (same as PropertiesScreen)
  const transformPropertyData = (apiProperties) => {
    return apiProperties.map(prop => ({
      id: prop._id,
      title: prop.title,
      address: prop.address ? `${prop.address}, ${prop.city}` : prop.city,
      price: prop.priceUnit === 'INR' ? `₹${prop.price?.toLocaleString()}` : `$${prop.price?.toLocaleString()}`,
      priceRaw: prop.price || 0,
      priceUnit: prop.priceUnit || 'INR',
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      sqft: prop.propertySize || 0,
      furnishing: prop.furnishing || 'Not Specified',
      type: prop.propertyType || 'Property',
      subType: prop.subType || '',
      status: prop.status?.toLowerCase().replace(/ /g, '_') || 'active',
      images: prop.images?.filter(img => img && img !== '') || [],
      features: prop.features || [],
      description: prop.description || prop.propertyDescription || '',
      propertyDescription: prop.propertyDescription || prop.description || '',
      agent: prop.broker?.name || 'Agent',
      listedDate: prop.createdAt ? new Date(prop.createdAt).toISOString().split('T')[0] : '',
      views: prop.viewsCount || 0,
      favorites: 0,
      amenities: prop.amenities || [],
      nearbyAmenities: prop.nearbyAmenities || [],
      city: prop.city || '',
      state: prop.state || '',
      region: prop.region || null,
      createdAt: prop.createdAt || '',
      updatedAt: prop.updatedAt || ''
    }))
  }

  // Recent Activity data
  const [recentActivities, setRecentActivities] = useState([])

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

  // Dashboard Card Component - matching LeadsScreen style exactly
  const DashboardCard = ({ title, value, icon, colorClass }) => (
    <View style={[styles.statCard, styles[colorClass]]}>
      <View style={styles.statCardContent}>
        <View style={styles.statTopRow}>
          <MaterialIcons name={icon} size={22} color="#FFFFFF" />
          <Text 
            style={styles.statCount}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.6}
          >
            {value.toLocaleString()}
          </Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  )

  // Bar Chart Component - Leads by Month
  const BarChart = ({ data, width: chartWidth = width - 80, height = 220 }) => {
    const maxValue = 220 // Fixed max value to match Y-axis
    const chartHeight = height - 60
    const availableWidth = chartWidth - 60 // Leave space for Y-axis labels
    const gap = 8 // Gap between bars
    const totalGaps = (data.length - 1) * gap
    const barWidth = (availableWidth - totalGaps) / data.length
    const xAxisY = chartHeight + 20

    return (
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={height}>
          {/* Y-axis labels */}
          {[0, 55, 110, 165, 220].map((value) => {
            const y = chartHeight - (value / maxValue) * chartHeight + 20
            return (
              <G key={value}>
                <Line
                  x1={30}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={25}
                  y={y + 4}
                  fontSize="12"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </G>
            )
          })}

          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = (item.leads / maxValue) * chartHeight
            const x = 40 + index * (barWidth + gap)
            const y = chartHeight - barHeight + 20

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#3B82F6"
                  rx={4}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="11"
                  fill="#1F2937"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {item.leads}
                </SvgText>
              </G>
            )
          })}

          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = 40 + index * (barWidth + gap) + barWidth / 2
            return (
              <SvgText
                key={index}
                x={x}
                y={xAxisY + 15}
                fontSize="12"
                fill="#6B7280"
                textAnchor="middle"
              >
                {item.month}
              </SvgText>
            )
          })}
        </Svg>
      </View>
    )
  }

  // Lead Sources Donut Chart
  const LeadSourcesDonutChart = ({ data, size = 180 }) => {
    const colors = {
      website: '#3B82F6',
      referral: '#10B981',
      social: '#F59E0B',
      other: '#EF4444'
    }

    const segments = [
      { color: colors.website, percentage: data.website, label: 'Website' },
      { color: colors.referral, percentage: data.referral, label: 'Referral' },
      { color: colors.social, percentage: data.social, label: 'Social' },
      { color: colors.other, percentage: data.other, label: 'Other' }
    ]

    const radius = size / 2 - 20
    const innerRadius = radius - 30
    const centerX = size / 2
    const centerY = size / 2

    return (
      <View style={styles.donutChartWrapper}>
        <Svg width={size} height={size} style={styles.donutSvg}>
          <G transform={`translate(${centerX}, ${centerY})`}>
            <Circle
              r={radius}
              stroke="#F5F5F5"
              strokeWidth={30}
              fill="transparent"
            />
            
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
                  strokeWidth={30}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90)`}
                />
              )
            })}
            
            <Circle
              r={innerRadius}
              fill="#FFFFFF"
            />
          </G>
        </Svg>
        
        <View style={styles.sourcesLegendContainer}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.sourcesLegendItem}>
              <View style={[styles.sourcesLegendColor, { backgroundColor: segment.color }]} />
              <Text style={styles.sourcesLegendText}>{segment.label}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  // Recent Lead Card Component
  const RecentLeadCard = ({ lead }) => {
    const getRequirementColor = (req) => {
      return req === 'Buy' ? '#0D542BFF' : '#F59E0B'
    }

    const getRequirementTextColor = (req) => {
      return req === 'Buy' ? '#FFFFFF' : '#1F2937'
    }

    return (
      <TouchableOpacity 
        style={styles.recentLeadCard}
        onPress={() => navigation.navigate('LeadDetails', { leadId: lead.id, isTransferredLead: false })}
        activeOpacity={0.8}
      >
        {/* Header Section */}
        <View style={styles.recentLeadHeader}>
          <View style={styles.recentLeadHeaderLeft}>
            <Text style={styles.recentLeadTitle}>{lead.title}</Text>
            <View style={styles.recentLeadTags}>
              <View style={[styles.recentLeadTag, { backgroundColor: getRequirementColor(lead.requirement) }]}>
                <Text style={[styles.recentLeadTagText, { color: getRequirementTextColor(lead.requirement) }]}>
                  {lead.requirement}
                </Text>
              </View>
              <View style={[styles.recentLeadTag, { backgroundColor: '#FCD34D' }]}>
                <Text style={styles.recentLeadTagTextYellow}>{lead.propertyType}</Text>
              </View>
            </View>
          </View>
          <View style={styles.recentLeadTime}>
            <MaterialIcons name="schedule" size={14} color="#6B7280" />
            <Text style={styles.recentLeadTimeText}>{lead.timeAgo}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.recentLeadDivider} />

        {/* Details Section */}
        <View style={styles.recentLeadDetails}>
          <View style={styles.recentLeadDetailItem}>
            <MaterialIcons name="location-on" size={16} color="#6B7280" />
            <Text style={styles.recentLeadDetailText}>
              Preferred: {lead.preferredLocation}
            </Text>
          </View>
          <View style={styles.recentLeadDetailItem}>
            <MaterialIcons name="location-on" size={16} color="#6B7280" />
            <Text style={styles.recentLeadDetailText}>
              Secondary: {lead.secondaryLocation}
            </Text>
          </View>
          <View style={styles.recentLeadDetailItem}>
            <MaterialIcons name="business" size={16} color="#6B7280" />
            <Text style={styles.recentLeadDetailText}>
              Budget: {lead.budget}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Status functions matching PropertiesScreen exactly
  const getStatusBackgroundColor = (status) => {
    const statusLower = status?.toLowerCase() || 'active'
    if (statusLower.includes('approved') || statusLower.includes('active')) return '#D1FAE5' // Light Green
    if (statusLower.includes('pending')) return '#FEF3C7' // Soft Light Yellow
    if (statusLower.includes('rejected')) return '#FEE2E2' // Light Red
    if (statusLower.includes('sold')) return '#F3F4F6' // Light Gray
    return '#D1FAE5'
  }

  const getStatusTextColor = (status) => {
    const statusLower = status?.toLowerCase() || 'active'
    if (statusLower.includes('approved') || statusLower.includes('active')) return '#059669' // Dark Green
    if (statusLower.includes('pending')) return '#F59E0B' // Muted Orange/Yellow
    if (statusLower.includes('rejected')) return '#DC2626' // Dark Red
    if (statusLower.includes('sold')) return '#6B7280' // Gray
    return '#059669'
  }

  const getStatusDisplayText = (status) => {
    const statusLower = status?.toLowerCase() || 'active'
    if (statusLower.includes('approved')) return 'Approved'
    if (statusLower.includes('pending')) return 'Pending'
    if (statusLower.includes('rejected')) return 'Rejected'
    if (statusLower.includes('active')) return 'Active'
    if (statusLower.includes('sold')) return 'Sold'
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Active'
  }

  // Recent Property Card Component - Matching PropertiesScreen design
  const RecentPropertyCard = ({ property }) => {

    const hasImages = property.images && property.images.length > 0
    const statusBgColor = getStatusBackgroundColor(property.status)
    const statusTextColor = getStatusTextColor(property.status)

    return (
      <TouchableOpacity 
        style={styles.recentPropertyCard}
        onPress={() => navigation.navigate('PropertyDetails', { property })}
        activeOpacity={0.8}
      >
        <View style={styles.recentCardTopSection}>
          {/* Property Image - Left Side */}
          <View style={styles.recentPropertyImageContainer}>
            {hasImages ? (
              <>
                <SafeImage 
                  source={{ uri: getSecureImageUrl(property.images[0]) }} 
                  style={styles.recentPropertyImage}
                  imageType="propertyImage"
                  resizeMode="cover"
                />
                {/* Property Type Badge */}
                {property.type && (
                  <View style={styles.recentPropertyTypeBadge}>
                    <Text style={styles.recentPropertyTypeBadgeText}>{property.type}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.recentPropertyImagePlaceholder}>
                <MaterialIcons name="home" size={48} color="#D1D5DB" />
                <Text style={styles.recentPlaceholderText}>No Image</Text>
                {/* Property Type Badge on Placeholder */}
                {property.type && (
                  <View style={styles.recentPropertyTypeBadge}>
                    <Text style={styles.recentPropertyTypeBadgeText}>{property.type}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Property Content - Right Side */}
          <View style={styles.recentPropertyContent}>
            {/* Title with Icon */}
            <View style={styles.recentTitleRow}>
              <MaterialIcons name="home" size={16} color="#1F2937" />
              <Text style={styles.recentPropertyTitle} numberOfLines={1}>
                {property.title}
              </Text>
            </View>
            
            {/* Address with Icon */}
            <View style={styles.recentAddressRow}>
              <MaterialIcons name="location-on" size={14} color="#6B7280" />
              <Text style={styles.recentPropertyAddressText} numberOfLines={1}>
                {property.address}
              </Text>
            </View>
            
            {/* Price */}
            <Text style={styles.recentPropertyPrice}>
              {property.price}
            </Text>
            
            {/* Status Row */}
            <View style={styles.recentStatusRow}>
              <Text style={styles.recentStatusLabel}>Status</Text>
              <View style={[styles.recentStatusBadge, { backgroundColor: statusBgColor }]}>
                <Text style={[styles.recentStatusBadgeText, { color: statusTextColor }]}>
                  {getStatusDisplayText(property.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Divider - Full Width */}
        <View style={styles.recentDivider} />
        
        {/* Features Below - Starting from Image Position */}
        <View style={styles.recentPropertyFeatures}>
          <View style={styles.recentFeatureItem}>
            <MaterialIcons name="bed" size={16} color="#6B7280" />
            <Text style={styles.recentFeatureText}>{property.bedrooms} Bed</Text>
          </View>
          
          <View style={styles.recentFeatureItem}>
            <MaterialIcons name="bathtub" size={16} color="#6B7280" />
            <Text style={styles.recentFeatureText}>{property.bathrooms} Bath</Text>
          </View>
          
          <View style={styles.recentFeatureItem}>
            <MaterialIcons name="home" size={16} color="#6B7280" />
            <Text style={styles.recentFeatureText}>{property.furnishing || 'Not Specified'}</Text>
          </View>
          
          <View style={styles.recentFeatureItem}>
            <MaterialIcons name="square-foot" size={16} color="#6B7280" />
            <Text style={styles.recentFeatureText}>{property.sqft || 0} sq.ft</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Recent Activity Card Component
  const RecentActivityCard = ({ activity, isLast }) => {
    return (
      <View>
        <View style={styles.recentActivityItem}>
          <View style={styles.recentActivityIconContainer}>
            <MaterialIcons name={activity.icon || 'notifications'} size={18} color="#9CA3AF" />
          </View>
          <View style={styles.recentActivityContent}>
            <Text style={styles.recentActivityDescription}>{activity.title || activity.description}</Text>
            <Text style={styles.recentActivityTimeText}>{activity.timeAgo}</Text>
          </View>
        </View>
        {!isLast && <View style={styles.recentActivityDivider} />}
      </View>
    )
  }

  // Circular Progress Component
  const CircularProgress = ({ percentage, value, size = 120, color = '#1F2937' }) => {
    const radius = size / 2 - 12
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <View style={styles.circularProgressContainer}>
        <Svg width={size} height={size}>
          <G transform={`translate(${size / 2}, ${size / 2})`}>
            {/* Background circle */}
            <Circle
              r={radius}
              stroke="#F3F4F6"
              strokeWidth={12}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              r={radius}
              stroke={color}
              strokeWidth={12}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90)"
            />
          </G>
        </Svg>
        <View style={styles.circularProgressTextContainer}>
          <Text style={styles.circularProgressValue}>{value}</Text>
        </View>
      </View>
    )
  }

  // Performance Summary Card Component
  const PerformanceSummaryCard = ({ item }) => {
    return (
      <View style={styles.performanceCard}>
        <Text style={styles.performanceCardTitle}>{item.title}</Text>
        <Text style={styles.performanceCardTarget}>Target: {item.target}</Text>
        <View style={styles.performanceCardProgress}>
          <CircularProgress 
            percentage={item.percentage}
            value={item.value}
            color={item.color}
          />
        </View>
      </View>
    )
  }

  // Line Chart Component - Closed Deal
  const LineChart = ({ data, width: chartWidth = width - 80, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.deals))
    const minValue = Math.min(...data.map(d => d.deals))
    const range = maxValue - minValue || 1
    const chartHeight = height - 50
    const pointSpacing = (chartWidth - 60) / (data.length - 1)

    // Generate path for line
    let pathData = ''
    data.forEach((item, index) => {
      const x = 40 + index * pointSpacing
      const y = chartHeight - ((item.deals - minValue) / range) * chartHeight + 20
      if (index === 0) {
        pathData = `M ${x} ${y}`
      } else {
        pathData += ` L ${x} ${y}`
      }
    })

    // Generate points
    const points = data.map((item, index) => {
      const x = 40 + index * pointSpacing
      const y = chartHeight - ((item.deals - minValue) / range) * chartHeight + 20
      return { x, y, value: item.deals }
    })

    return (
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={height}>
          {/* Y-axis labels */}
          {[5, 7, 9, 11].map((value) => {
            if (value < minValue || value > maxValue) return null
            const y = chartHeight - ((value - minValue) / range) * chartHeight + 20
            return (
              <G key={value}>
                <Line
                  x1={30}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={25}
                  y={y + 4}
                  fontSize="12"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </G>
            )
          })}

          {/* Grid line */}
          <Line
            x1={30}
            y1={chartHeight + 20}
            x2={chartWidth - 10}
            y2={chartHeight + 20}
            stroke="#E5E7EB"
            strokeWidth="1"
          />

          {/* Line path */}
          <Path
            d={pathData}
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
          />

          {/* Points */}
          {points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#3B82F6"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#FFFFFF"
              />
            </G>
          ))}

          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = 40 + index * pointSpacing
            return (
              <SvgText
                key={index}
                x={x}
                y={chartHeight + 35}
                fontSize="12"
                fill="#6B7280"
                textAnchor="middle"
              >
                {item.period}
              </SvgText>
            )
          })}
        </Svg>
      </View>
    )
  }


  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
      <View style={styles.container}>
        {/* Modern Header - Fixed at top */}
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
                <Text style={styles.welcomeName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.profileButton} onPress={handleMessagePress}>
                <View style={styles.notificationIconContainer}>
                  <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                  {unreadNotificationCount > 0 && (
                    <View style={[
                      styles.notificationBadge,
                      unreadNotificationCount > 9 && styles.notificationBadgeWide
                    ]}>
                      <Text style={styles.notificationBadgeText} numberOfLines={1} ellipsizeMode="clip">
                        {unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.headerRight}>
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
                    <View style={styles.profileInitialsContainer}>
                      <Text style={styles.profileInitials}>
                        {(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Dashboard Cards - Matching LeadsScreen Style */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <DashboardCard
              title="Total Leads"
              value={dashboardCards.totalLeads}
              icon="people"
              colorClass="statCardGreen"
            />
            <DashboardCard
              title="Properties Listed"
              value={dashboardCards.propertiesListed}
              icon="home"
              colorClass="statCardBlue"
            />
            <DashboardCard
              title="Connections"
              value={dashboardCards.connections}
              icon="chat"
              colorClass="statCardPurple"
            />
            </View>
          </View>

        {/* Lead Performance Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lead Performance Overview</Text>
          </View>
          
          {/* Leads by Month Chart */}
          <View style={[styles.chartCardContainer, { marginTop: 0 }]}>
            <Text style={styles.chartCardTitle}>Leads by Month</Text>
            <BarChart data={leadsByMonthData} />
          </View>

          {/* Lead Sources Chart */}
          <View style={styles.chartCardContainer}>
            <Text style={styles.chartCardTitle}>Lead Sources</Text>
            <LeadSourcesDonutChart data={leadSourcesData} />
          </View>

          {/* Closed Deal Chart */}
          <View style={styles.chartCardContainer}>
            <Text style={styles.chartCardTitle}>Closed Deal</Text>
            <LineChart data={closedDealData} />
          </View>
        </View>

        {/* Recent Leads */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => navigation.navigate('Leads')}
            >
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          {/* Add Lead Card */}
          <TouchableOpacity 
            style={styles.addLeadCard}
            onPress={() => navigation.navigate('CreateLead')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={32} color="#9CA3AF" />
            <Text style={styles.addLeadText}>Add Lead</Text>
          </TouchableOpacity>
          
          {recentLeads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Recent Leads</Text>
              <Text style={styles.emptyMessage}>No leads available at the moment</Text>
            </View>
          ) : (
            <FlatList
              data={recentLeads}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <RecentLeadCard lead={item} />}
              contentContainerStyle={styles.recentLeadsList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              nestedScrollEnabled={true}
            />
          )}
        </View>

        {/* Recent Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Properties</Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => navigation.navigate('Properties')}
            >
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          {/* Add Property Card */}
          <TouchableOpacity 
            style={styles.addPropertyCard}
            onPress={() => navigation.navigate('CreateProperty')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={32} color="#9CA3AF" />
            <Text style={styles.addPropertyText}>Add Property</Text>
          </TouchableOpacity>
          
          {recentProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="home-work" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Recent Properties</Text>
              <Text style={styles.emptyMessage}>No properties available at the moment</Text>
            </View>
          ) : (
            <FlatList
              data={recentProperties}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <RecentPropertyCard property={item} />}
              contentContainerStyle={styles.recentPropertiesList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              nestedScrollEnabled={true}
            />
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.manageButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivities.length > 0 ? (
            <View style={styles.recentActivityCard}>
              {recentActivities.slice(0, 3).map((activity, index, array) => (
                  <RecentActivityCard 
                    key={activity.id} 
                    activity={activity} 
                    isLast={index === array.length - 1}
                  />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Recent Activity</Text>
              <Text style={styles.emptyMessage}>No notifications available at the moment</Text>
            </View>
          )}
        </View>

        {/* Performance Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance Summary</Text>
          </View>
          
          <View style={styles.performanceSummaryContainer}>
            {performanceSummary.map((item) => (
              <PerformanceSummaryCard key={item.id} item={item} />
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeContainer: {
    marginBottom: 0,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  notificationIconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  notificationBadgeWide: {
    width: 'auto',
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 11,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileInitialsContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
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

  // Stats Section Styles - Matching LeadsScreen exactly
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardGreen: {
    backgroundColor: '#34D399',
  },
  statCardBlue: {
    backgroundColor: '#3B82F6',
  },
  statCardYellow: {
    backgroundColor: '#FCD34D',
  },
  statCardPurple: {
    backgroundColor: '#A78BFA',
  },
  statCardContent: {
    padding: 16,
    minHeight: 88,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 0,
    textAlign: 'right',
    minWidth: 40,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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

  // New Chart Card Styles
  chartCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sourcesLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  sourcesLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourcesLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sourcesLegendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Recent Leads Styles
  recentLeadsList: {
    paddingVertical: 8,
  },
  recentLeadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recentLeadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentLeadHeaderLeft: {
    flex: 1,
  },
  recentLeadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  recentLeadTags: {
    flexDirection: 'row',
    gap: 8,
  },
  recentLeadTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentLeadTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentLeadTagTextYellow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  recentLeadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentLeadTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentLeadDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  recentLeadDetails: {
    gap: 10,
  },
  recentLeadDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentLeadDetailText: {
    fontSize: 14,
    color: '#1F2937',
  },
  recentLeadContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentLeadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentLeadAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  recentLeadContactInfo: {
    flex: 1,
  },
  recentLeadContactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  recentLeadActions: {
    flexDirection: 'row',
    gap: 16,
  },
  recentLeadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentLeadActionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Manage Button Styles - Matching badge style
  manageButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FCD34D',
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Properties Styles
  recentPropertiesList: {
    paddingVertical: 8,
  },
  recentPropertyCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width - 80,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  recentCardTopSection: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  recentPropertyImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  recentPropertyImage: {
    width: '100%',
    height: '100%',
  },
  recentPropertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recentPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  recentPropertyTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0D542BFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  recentPropertyTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentPropertyContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recentPropertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  recentAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  recentPropertyAddressText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  recentPropertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  recentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentStatusLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  recentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recentStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  recentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 0,
    marginRight: 0,
  },
  recentPropertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 4,
    paddingLeft: 0,
    alignItems: 'center',
  },
  recentFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentFeatureText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Add Property Card Styles
  addPropertyCard: {
    backgroundColor: '#FEFCE8',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EAB308',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 100,
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  addPropertyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },

  // Add Lead Card Styles
  addLeadCard: {
    backgroundColor: '#FEFCE8',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EAB308',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 100,
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  addLeadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },

  // Recent Activity Styles
  recentActivityCard: {
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
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  recentActivityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  recentActivityTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recentActivityDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  showMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D542BFF',
  },

  // Performance Summary Styles
  performanceSummaryContainer: {
    gap: 12,
  },
  performanceCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 180,
  },
  performanceCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  performanceCardTarget: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  performanceCardProgress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  // Empty State Styles
  emptyContainer: {
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
})

export default HomeScreen