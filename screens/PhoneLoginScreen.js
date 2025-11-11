import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native'
import { Snackbar } from '../utils/snackbar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import OtpScreen from './OtpScreen'
import { authAPI } from '../services/api'

const PhoneLoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Country code is fixed to +91
  
  // Country codes dropdown removed; using +91 only

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      Snackbar.showValidationError('Please enter your phone number')
      return
    }

    if (phoneNumber.length < 10) {
      Snackbar.showValidationError('Please enter a valid 10-digit phone number')
      return
    }

    setIsLoading(true)
    
    try {
      // Send only phone number without country code
      const response = await authAPI.sendOTP(phoneNumber)
      
      setIsLoading(false)
      setIsOtpSent(true)
      
      // Navigate to OTP screen directly
      console.log('OTP sent successfully, navigating to OTP screen...')
      console.log('API Response:', response)
    } catch (error) {
      setIsLoading(false)
      
      // Handle different types of errors
      let errorMessage = 'Failed to send OTP. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const data = error.response.data
        
        if (status === 400) {
          errorMessage = data.message || 'Invalid phone number format'
        } else if (status === 429) {
          errorMessage = 'Too many requests. Please wait before trying again.'
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = data.message || `Request failed with status ${status}`
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection.'
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      console.error('API Error:', error)
      Snackbar.showApiError(errorMessage)
    }
  }

  const handleOtpVerified = () => {
    // Reset navigation stack to main tabs after successful login
    // This prevents going back to OTP/login screens
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    })
  }

  const handleResendOtp = async () => {
    try {
      await authAPI.sendOTP(phoneNumber)
      console.log('OTP resent successfully')
    } catch (error) {
      console.error('Resend OTP Error:', error)
      Snackbar.showApiError('Failed to resend OTP. Please try again.')
    }
  }

  const handleBackToPhone = () => {
    setIsOtpSent(false)
  }

  // Dropdown logic removed

  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10)
    
    setPhoneNumber(limited)
  }



  // Show OTP screen when OTP is sent
  if (isOtpSent) {
    return (
      <OtpScreen
        phoneNumber={phoneNumber}
        onBack={handleBackToPhone}
        onOtpVerified={handleOtpVerified}
        onResendOtp={handleResendOtp}
      />
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
        {/* Decorative background circle - top right (wrapped for Android clipping) */}
        <View style={styles.decorativeTopRightWrapper} pointerEvents="none">
          <Image
            source={require('../assets/decorativeCircle.png')}
            style={styles.decorativeTopRight}
          />
        </View>
        <View style={styles.decorativeBottomLeftWrapper} pointerEvents="none">
          <Image
            source={require('../assets/decorativeCircle.png')}
            style={styles.decorativeBottomLeft}
          />
        </View>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                // Check if we can go back, if not, do nothing
                if (navigation.canGoBack()) {
                  navigation.goBack()
                }
                // If we can't go back (like after logout), do nothing
                // This prevents going back to the profile screen after logout
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            {/* <Text style={styles.headerTitle}>Phone Verification</Text>
            <View style={styles.headerBorder} /> */}
          </View>

          {/* Main Content Container */}
          <View style={styles.mainContent}>
            {/* Content */}
            <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <Text style={styles.illustrationTitle}>
                  Login with Number
                </Text>
                <Text style={styles.illustrationSubtitle}>
                  Please enter your phone number correctly to continue.
                </Text>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                {/* Phone Number Input */}
                <View style={styles.phoneInputContainer}>
                  <View style={styles.inputRow}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    
                    <View style={styles.inputGap} />
                    
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChangeText={formatPhoneNumber}
                      placeholderTextColor="#8E8E93"
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  
                  {/* Country code is fixed to +91; dropdown removed */}
                </View>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              {/* Action Button */}
              <View style={styles.actionButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    phoneNumber.length < 10 ? styles.actionButtonDisabled : null
                  ]} 
                  onPress={handleSendOtp}
                  disabled={isLoading || phoneNumber.length < 10}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, styles.loadingText]}>
                        Please wait...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[
                      styles.actionButtonText,
                      phoneNumber.length < 10 ? styles.actionButtonTextDisabled : null
                    ]}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Signup Link */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
                  <Text style={styles.toggleButton}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  },
  headerBorder: {
    height: 1,
    backgroundColor: '#E5E5EA',
    width: '100%',
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: 'flex-start',
    minHeight: 120,
  },
  bottomSection: {
    paddingBottom: 20,
    paddingTop: 5,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  phoneIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  illustrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 30,
  },
  illustrationSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'left',
    lineHeight: 22,
    paddingHorizontal: 0,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  phoneInputContainer: {
    marginBottom: 0,
  },
  inputHelper: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 50,
  },
  countryCode: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputGap: {
    width: 12,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCodeText: {
    color: '#000000',
    fontSize: 16,
    // fontWeight: '600',
    marginRight: 5,
  },
  dropdownIcon: {
    color: '#0D542BFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    width: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D542BFF',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#000000',
    minHeight: 50,
    textAlignVertical: 'center',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  actionButtonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 10,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#0D542BFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    width: '100%',
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
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 10,
    paddingTop: 5,
    gap: 5,
  },
  toggleText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  toggleButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D542BFF',
  },
  // Decorative background images
  decorativeTopRightWrapper: {
    position: 'absolute',
    right: -120,
    top: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    zIndex: -1,
  },
  decorativeTopRight: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    transform: [{ rotate: '90deg' }],
    opacity: 1,
  },
  decorativeBottomLeftWrapper: {
    position: 'absolute',
    left: -120,
    bottom: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    zIndex: -1,
  },
  decorativeBottomLeft: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    transform: [{ rotate: '90deg' }],
    opacity: 1,
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default PhoneLoginScreen
