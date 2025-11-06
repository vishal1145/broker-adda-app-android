import React, { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Linking,
  Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import appJson from '../app.json'
import { storage } from '../services/storage'
import { authAPI } from '../services/api'

const { width } = Dimensions.get('window')

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

// Enhanced image component with fallback
const SafeImage = ({ source, style, imageType, fallbackText, ...props }) => {
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
    }
  }

  const retry = () => {
    setImageError(false)
    setCurrentSource(source)
  }

  if (imageError) {
    return (
      <View style={[style, { backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }]}>
        {fallbackText ? (
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#065F46' }}>
            {fallbackText}
          </Text>
        ) : (
          <MaterialIcons name="person" size={20} color="#065F46" />
        )}
        <TouchableOpacity 
          style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#0D542BFF', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}
          onPress={retry}
        >
          <MaterialIcons name="refresh" size={10} color="#FFFFFF" />
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

const SettingsScreen = ({ navigation }) => {
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(true)
  const appVersion = (appJson?.expo?.version) || appJson?.version || '1.0.0'

  // Profile state
  const [userName, setUserName] = useState('User')
  const [userProfile, setUserProfile] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      
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
      setIsLoadingProfile(false)
    }
  }

  // Handle message press
  const handleMessagePress = () => {
    navigation.navigate('Notifications')
  }

  // Handle profile press
  const handleProfilePress = () => {
    // Navigate to profile screen
    navigation.navigate('Profile')
  }

  // Load profile on component mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person', title: 'Profile Information', subtitle: 'Manage your personal details', action: 'navigate', route: 'Profile', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' },
        { icon: 'logout', title: 'Logout', subtitle: '', action: 'logout', isEmphasis: true, iconColor: '#F59E0B', iconBg: '#FFF7ED', iconBorder: '#FED7AA' },
        { icon: 'delete', title: 'Delete Account', subtitle: '', action: 'navigate', destructive: true }
      ]
    },
    {
      title: 'Notifications',
      items: [
        { icon: 'notifications-none', title: 'Push Notifications', subtitle: '', action: 'toggle', value: pushEnabled, onToggle: setPushEnabled, iconColor: '#2563EB', iconBg: '#EFF6FF', iconBorder: '#BFDBFE' },
        { icon: 'mail-outline', title: 'Email Notifications', subtitle: '', action: 'toggle', value: emailEnabled, onToggle: setEmailEnabled, iconColor: '#EF4444', iconBg: '#FEF2F2', iconBorder: '#FECACA' },
        { icon: 'sms', title: 'SMS Alerts', subtitle: '', action: 'toggle', value: smsEnabled, onToggle: setSmsEnabled, iconColor: '#F59E0B', iconBg: '#FFFBEB', iconBorder: '#FDE68A' }
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: 'lock-outline', title: 'Privacy Policy', subtitle: '', action: 'navigate', url: 'https://brokergully.com/privacy', iconColor: '#3B82F6', iconBg: '#EFF6FF', iconBorder: '#BFDBFE' },
        { icon: 'description', title: 'Terms of Service', subtitle: '', action: 'navigate', url: 'https://brokergully.com/terms', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-outline', title: 'Help Center', subtitle: 'Get help and find answers to common questions', action: 'navigate', url: 'https://brokergully.com/contact', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' }
      ]
    }
  ]

  const SettingItem = ({ item, onPress }) => (
    <TouchableOpacity
      style={[styles.settingItemCard, item.destructive && styles.settingItemCardDestructive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <MaterialIcons
            name={item.icon}
            size={22}
            color={item.destructive ? '#EF4444' : (item.iconColor || '#0D542BFF')}
          />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, item.destructive && styles.destructiveTitle, item.isEmphasis && styles.emphasisTitle]}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.settingRight}>
        {item.action === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#D1D5DB', true: '#0D542BFF' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : item.destructive ? null : (
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  )

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
                <Text style={styles.welcomeGreeting}>Manage Your Settings</Text>
                <Text style={styles.welcomeName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.profileButton} onPress={handleMessagePress}>
                <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
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
      >

        {/* Settings Sections */}
        <View style={styles.settingsContainer}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <SettingItem
                    key={itemIndex}
                    item={item}
                    onPress={() => {
                      if (item.action === 'navigate') {
                        if (item.url) {
                          Linking.openURL(item.url)
                        } else if (item.route) {
                          navigation.navigate(item.route)
                        } else {
                          console.log(`Navigate to ${item.title}`)
                        }
                      } else if (item.action === 'logout') {
                        (async () => {
                          try {
                            await storage.clearAuthData()
                          } catch (e) {
                            // ignore and continue
                          } finally {
                            navigation.reset({ index: 0, routes: [{ name: 'PhoneLogin' }] })
                          }
                        })()
                      }
                    }}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* App Version Card */}
          <View style={styles.versionCard}>
            <View style={styles.versionInfo}>
              <View style={styles.versionIconWrap}>
                <MaterialIcons name="info-outline" size={18} color="#EAB308" />
              </View>
              <View style={styles.versionTextWrap}>
                <Text style={styles.versionTitle}>App Version {appVersion}</Text>
              </View>
            </View>
              <View style={styles.versionIndentedContent}>
              <Text style={styles.versionSubtitle}>You are running the latest version of the app.
Updates are automatic.</Text>
              <TouchableOpacity style={styles.updateButton}>
                <Text style={styles.updateButtonText}>Check for Updates</Text>
              </TouchableOpacity>
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

  // Header Styles
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

  // Settings Container
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionContent: {
    // container now holds individual card rows
  },
  settingItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 12,
  },
  settingItemCardDestructive: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // All icons use the same neutral gray container
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingRight: {
    marginLeft: 12,
  },

  destructiveTitle: {
    color: '#EF4444',
  },
  emphasisTitle: {
    color: '#111827',
    fontWeight: '700',
  },

  // Version Card
  versionCard: {
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  versionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 2,
  },
  versionTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  versionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  versionIndentedContent: {
    // Align block with the title start (icon 24 + gap ~12)
    // marginLeft: 34,
  },
  updateButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4B400',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  updateButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
})

export default SettingsScreen
