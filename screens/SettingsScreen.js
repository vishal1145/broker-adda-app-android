import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import appJson from '../app.json'
import { storage } from '../services/storage'

const { width } = Dimensions.get('window')

const SettingsScreen = ({ navigation }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(true)
  const appVersion = (appJson?.expo?.version) || appJson?.version || '1.0.0'

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person', title: 'Profile Information', subtitle: 'Manage your personal details', action: 'navigate', route: 'Profile', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' },
        { icon: 'verified-user', title: 'Two-Factor Authentication', subtitle: 'Enhanced security for your account', action: 'toggle', value: twoFactorEnabled, onToggle: setTwoFactorEnabled, iconColor: '#9CA3AF', iconBg: '#F3F4F6', iconBorder: '#E5E7EB' },
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
        { icon: 'lock-outline', title: 'Privacy Policy', subtitle: '', action: 'navigate', url: 'https://broker-adda.algofolks.com/privacy', iconColor: '#3B82F6', iconBg: '#EFF6FF', iconBorder: '#BFDBFE' },
        { icon: 'description', title: 'Terms of Service', subtitle: '', action: 'navigate', url: 'https://broker-adda.algofolks.com/terms', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' },
        { icon: 'storage', title: 'Data Management', subtitle: 'Export or delete your data', action: 'navigate', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' }
      ]
    },
    {
      title: 'Appearance',
      items: [
        { icon: 'palette', title: 'App Theme', subtitle: 'Choose light or dark mode', action: 'navigate', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' }
      ]
    },
    {
      title: 'Support & Feedback',
      items: [
        { icon: 'help-outline', title: 'Help Center', subtitle: '', action: 'navigate', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' },
        { icon: 'chat-bubble-outline', title: 'Send Feedback', subtitle: '', action: 'navigate', iconColor: '#0D542BFF', iconBg: '#ECFDF5', iconBorder: '#A7F3D0' }
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
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>App settings</Text>
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
