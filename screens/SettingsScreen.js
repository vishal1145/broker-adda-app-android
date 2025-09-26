import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person', title: 'Profile Information', subtitle: 'Manage your personal details', action: 'navigate' },
        { icon: 'security', title: 'Security & Privacy', subtitle: 'Password, 2FA, and privacy settings', action: 'navigate' },
        { icon: 'payment', title: 'Payment Methods', subtitle: 'Manage your payment options', action: 'navigate' },
        { icon: 'receipt', title: 'Billing & Invoices', subtitle: 'View your billing history', action: 'navigate' }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications', title: 'Push Notifications', subtitle: 'Get notified about important updates', action: 'toggle', value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'dark-mode', title: 'Dark Mode', subtitle: 'Switch between light and dark themes', action: 'toggle', value: darkModeEnabled, onToggle: setDarkModeEnabled },
        { icon: 'location-on', title: 'Location Services', subtitle: 'Allow location access for better experience', action: 'toggle', value: locationEnabled, onToggle: setLocationEnabled },
        { icon: 'fingerprint', title: 'Biometric Login', subtitle: 'Use fingerprint or face ID to login', action: 'toggle', value: biometricEnabled, onToggle: setBiometricEnabled }
      ]
    },
    {
      title: 'App Settings',
      items: [
        { icon: 'language', title: 'Language', subtitle: 'English (US)', action: 'navigate' },
        { icon: 'schedule', title: 'Working Hours', subtitle: 'Set your availability', action: 'navigate' },
        { icon: 'storage', title: 'Storage & Cache', subtitle: 'Manage app storage', action: 'navigate' },
        { icon: 'update', title: 'App Updates', subtitle: 'Check for updates', action: 'navigate' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help', title: 'Help Center', subtitle: 'Get help and support', action: 'navigate' },
        { icon: 'contact-support', title: 'Contact Us', subtitle: 'Reach out to our support team', action: 'navigate' },
        { icon: 'rate-review', title: 'Rate App', subtitle: 'Rate us on the app store', action: 'navigate' },
        { icon: 'info', title: 'About', subtitle: 'App version and information', action: 'navigate' }
      ]
    }
  ]

  const SettingItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <MaterialIcons name={item.icon} size={24} color="#16BCC0" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        {item.action === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E5E7EB', true: '#16BCC0' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>Customize your experience</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
                        console.log(`Navigate to ${item.title}`)
                      }
                    }}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton}>
              <MaterialIcons name="logout" size={24} color="#FFFFFF" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
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

  // Header Styles
  modernHeader: {
    backgroundColor: '#16BCC0',
    paddingTop: 50,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Settings Container
  settingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
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

  // Logout Section
  logoutSection: {
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
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
})

export default SettingsScreen
