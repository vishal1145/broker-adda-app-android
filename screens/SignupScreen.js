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
  Linking,
  ScrollView,
  Image
} from 'react-native'
import { Snackbar } from '../utils/snackbar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import OtpScreen from './OtpScreen'
import { authAPI } from '../services/api'

const SignupScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Country code fixed to +91; dropdown removed
  const [isTermsHovered, setIsTermsHovered] = useState(false)
  const [isPrivacyHovered, setIsPrivacyHovered] = useState(false)
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  
  // Country codes list removed

  const handleSignup = async () => {
    if (!phoneNumber.trim()) {
      Snackbar.showValidationError('Please enter your phone number')
      return
    }

    if (phoneNumber.length < 10) {
      Snackbar.showValidationError('Please enter a valid 10-digit phone number')
      return
    }

    if (!isTermsAccepted) {
      Snackbar.showValidationError('Please accept the Terms & Conditions to continue')
      return
    }

    setIsLoading(true)
    
    try {
      // Send only phone number without country code
      const response = await authAPI.signup(phoneNumber)
      
      setIsLoading(false)
      setIsOtpSent(true)
      
      // Navigate to OTP screen directly
      console.log('Signup OTP sent successfully, navigating to OTP screen...')
      console.log('API Response:', response)
    } catch (error) {
      setIsLoading(false)
      
      // Handle different types of errors
      let errorMessage = 'Failed to create account. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const data = error.response.data
        
        if (status === 400) {
          errorMessage = data.message || 'Invalid phone number format'
        } else if (status === 409) {
          errorMessage = 'Phone number already exists. Please login instead.'
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
    // Navigate to create profile after successful signup
    navigation.navigate('CreateProfile')
  }

  const handleResendOtp = async () => {
    try {
      await authAPI.signup(phoneNumber)
      console.log('OTP resent successfully')
    } catch (error) {
      console.error('Resend OTP Error:', error)
      Snackbar.showApiError('Failed to resend OTP. Please try again.')
    }
  }

  const handleBackToPhone = () => {
    setIsOtpSent(false)
  }

  // Dropdown handlers removed

  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10)
    
    setPhoneNumber(limited)
  }

  const handleTermsPress = async () => {
    try {
      // Replace with your actual terms and conditions URL
      const termsUrl = 'https://broker-adda.algofolks.com/terms'
      const supported = await Linking.canOpenURL(termsUrl)
      
      if (supported) {
        await Linking.openURL(termsUrl)
      } else {
        // Fallback to navigation if URL opening fails
        navigation.navigate('TermsAndConditions')
      }
    } catch (error) {
      console.error('Error opening terms URL:', error)
      // Fallback to navigation
      navigation.navigate('TermsAndConditions')
    }
  }

  const handlePrivacyPress = async () => {
    try {
      // Replace with your actual privacy policy URL
      const privacyUrl = 'https://broker-adda.algofolks.com/privacy'
      const supported = await Linking.canOpenURL(privacyUrl)
      
      if (supported) {
        await Linking.openURL(privacyUrl)
      } else {
        // Fallback to navigation if URL opening fails
        navigation.navigate('PrivacyPolicy')
      }
    } catch (error) {
      console.error('Error opening privacy URL:', error)
      // Fallback to navigation
      navigation.navigate('PrivacyPolicy')
    }
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
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Decorative background circles */}
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Main Content Container */}
          <View style={styles.mainContent}>
            {/* Content */}
            <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <Text style={styles.illustrationTitle}>
                Sign Up with Number
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
                  
                  {/* Country code fixed to +91; dropdown removed */}
                </View>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              {/* Terms and Privacy Policy with Checkbox */}
              <View style={styles.termsContainer}>
                <View style={styles.termsWithCheckbox}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                  >
                    <View style={[
                      styles.checkboxBox,
                      isTermsAccepted && styles.checkboxBoxChecked
                    ]}>
                      {isTermsAccepted && (
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>
                      By continuing you agree to our{' '}
                    </Text>
                    <TouchableOpacity 
                      onPress={handleTermsPress}
                      onPressIn={() => setIsTermsHovered(true)}
                      onPressOut={() => setIsTermsHovered(false)}
                      activeOpacity={0.7}
                      style={styles.linkTouchable}
                    >
                      <Text style={[
                        styles.linkText, 
                        isTermsHovered && styles.linkTextHovered
                      ]}>
                        Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.termsText}>
                      {' '}and{' '}
                    </Text>
                    <TouchableOpacity 
                      onPress={handlePrivacyPress}
                      onPressIn={() => setIsPrivacyHovered(true)}
                      onPressOut={() => setIsPrivacyHovered(false)}
                      activeOpacity={0.7}
                      style={styles.linkTouchable}
                    >
                      <Text style={[
                        styles.linkText, 
                        isPrivacyHovered && styles.linkTextHovered
                      ]}>
                        Privacy Policy
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <View style={styles.actionButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    (phoneNumber.length < 10 || !isTermsAccepted) ? styles.actionButtonDisabled : null
                  ]} 
                  onPress={handleSignup}
                  disabled={isLoading || phoneNumber.length < 10 || !isTermsAccepted}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, styles.loadingText]}>
                        Please wait...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.actionButtonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('PhoneLogin')} activeOpacity={0.7}>
                  <Text style={styles.toggleButton}>
                    Login
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
  },
  safeArea: {
    flex: 1,
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
  illustrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 30,
    flexShrink: 1,
  },
  illustrationSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'left',
    lineHeight: 22,
    paddingHorizontal: 0,
    flexShrink: 1,
  },
  inputSection: {
    marginBottom: 20,
    flexShrink: 0,
  },
  phoneInputContainer: {
    marginBottom: 0,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 5,
    gap: 5,
    flexWrap: 'wrap',
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
  termsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 15,
    paddingTop: 5,
    flexShrink: 1,
  },
  termsWithCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0D542BFF',
    borderColor: '#0D542BFF',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  linkTouchable: {
    marginHorizontal: 0,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    textDecorationLine: 'none',
  },
  linkTextHovered: {
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
})

export default SignupScreen
