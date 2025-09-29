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
  ActivityIndicator
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
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+62', country: 'Indonesia' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+86', country: 'China' }
  ]

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
      // Format phone number with selected country code
      const formattedPhone = `${selectedCountryCode}${phoneNumber}`
      
      // Call the API
      const response = await authAPI.sendOTP(formattedPhone)
      
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
    // Navigate to create profile screen after successful login
    navigation.navigate('CreateProfile')
  }

  const handleResendOtp = async () => {
    try {
      const formattedPhone = `${selectedCountryCode}${phoneNumber}`
      await authAPI.sendOTP(formattedPhone)
      console.log('OTP resent successfully')
    } catch (error) {
      console.error('Resend OTP Error:', error)
      Snackbar.showApiError('Failed to resend OTP. Please try again.')
    }
  }

  const handleBackToPhone = () => {
    setIsOtpSent(false)
  }

  const handleCountryCodeSelect = (countryCode) => {
    setSelectedCountryCode(countryCode)
    setShowCountryDropdown(false)
  }

  const toggleCountryDropdown = () => {
    setShowCountryDropdown(!showCountryDropdown)
  }

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
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#16BCC0" />
          </TouchableOpacity>
          {/* <Text style={styles.headerTitle}>Phone Verification</Text>
          <View style={styles.headerBorder} /> */}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.illustrationTitle}>
              Login with Phone Number
            </Text>
            <Text style={styles.illustrationSubtitle}>
              Please enter your phone number correctly
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            {/* Phone Number Input */}
            <View style={styles.phoneInputContainer}>
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={[
                    styles.countryCode,
                    { borderColor: phoneNumber.length > 0 ? '#16BCC0' : '#E5E5EA' }
                  ]}
                  onPress={toggleCountryDropdown}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryCodeText}>{selectedCountryCode}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
                
                <View style={styles.inputGap} />
                
                <TextInput
                  style={[
                    styles.phoneInput,
                    { borderColor: phoneNumber.length > 0 ? '#16BCC0' : '#E5E5EA' }
                  ]}
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChangeText={formatPhoneNumber}
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              
              {/* Country Code Dropdown */}
              {showCountryDropdown && (
                <View style={styles.dropdownContainer}>
                  {countryCodes.map((country, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleCountryCodeSelect(country.code)}
                    >
                      <Text style={styles.dropdownItemText}>{country.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

        </View>

        {/* Action Button - Above dialpad */}
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
              <Text style={styles.actionButtonText}>Login</Text>
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

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    flex: 0.5,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 34,
  },
  illustrationSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'left',
    lineHeight: 24,
    paddingHorizontal: 0,
  },
  inputSection: {
    marginBottom: 30,
  },
  phoneInputContainer: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputHelper: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCode: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 80,
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
    color: '#16BCC0',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  dropdownIcon: {
    color: '#16BCC0',
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
    color: '#16BCC0',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonContainer: {
    paddingHorizontal:30,
    paddingBottom: 15,
    paddingTop: 10,
  },
  actionButton: {
    backgroundColor: '#16BCC0',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#16BCC0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#C7C7CC',
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
    paddingHorizontal: 30,
    paddingBottom: 15,
    gap: 5,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
  },
  toggleButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16BCC0',
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default PhoneLoginScreen
