import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import OtpScreen from './OtpScreen'
import { authAPI } from '../services/api'

const PhoneLoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDialpad, setShowDialpad] = useState(true)
  const [dialpadAnimation] = useState(new Animated.Value(1))
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
      Alert.alert('Error', 'Please enter your phone number')
      return
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number')
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
      Alert.alert('Error', errorMessage)
    }
  }

  const handleOtpVerified = () => {
    // Navigate to main tabs after successful login
    navigation.navigate('MainTabs')
  }

  const handleResendOtp = async () => {
    try {
      const formattedPhone = `${selectedCountryCode}${phoneNumber}`
      await authAPI.sendOTP(formattedPhone)
      console.log('OTP resent successfully')
    } catch (error) {
      console.error('Resend OTP Error:', error)
      Alert.alert('Error', 'Failed to resend OTP. Please try again.')
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

  const handleDialpadPress = (number) => {
    if (phoneNumber.length < 10) {
      setPhoneNumber(prev => prev + number)
    }
  }

  const handleZeroPress = () => {
    if (phoneNumber.length < 10) {
      setPhoneNumber(prev => prev + '0')
    }
  }


  const handleDialpadPressIn = (number) => {
    // Add haptic feedback or visual feedback here if needed
  }

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1))
  }

  const openDialpad = () => {
    if (!isOtpSent && !showDialpad) {
      setShowDialpad(true)
      
      Animated.timing(dialpadAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }

  const hideDialpad = () => {
    if (showDialpad) {
      setShowDialpad(false)
      Animated.timing(dialpadAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }

  const renderDialpad = () => {
    const dialpadNumbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9']
    ]

    return (
      <View style={styles.dialpadContainer}>
        {dialpadNumbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.dialpadRow}>
            {row.map((number, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={styles.dialpadButton}
                onPress={() => handleDialpadPress(number)}
              >
                <Text style={styles.dialpadNumber}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        
        {/* Bottom row with 0 and backspace - aligned with grid */}
        <View style={styles.dialpadRow}>
          <TouchableOpacity style={[styles.dialpadButton, styles.emptyButton]} disabled>
            <Text style={styles.dialpadNumber}></Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dialpadButton, styles.zeroButton]} 
            onPress={handleZeroPress}
            activeOpacity={0.7}
          >
            <Text style={styles.dialpadNumber}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dialpadButton, styles.backspaceButton]} 
            onPress={handleBackspace}
            activeOpacity={0.7}
          >
            <Text style={styles.backspaceIcon}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
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
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phone Verification</Text>
          <View style={styles.headerBorder} />
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
            <View>
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={[
                    styles.countryCode,
                    { borderColor: phoneNumber.length > 0 ? '#2E7D32' : '#E5E5EA' }
                  ]}
                  onPress={toggleCountryDropdown}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryCodeText}>{selectedCountryCode}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
                
                <View style={styles.inputGap} />
                
                <TouchableOpacity 
                  style={[
                    styles.phoneInputWrapper,
                    { borderColor: phoneNumber.length > 0 ? '#2E7D32' : '#E5E5EA' }
                  ]}
                  onPress={openDialpad}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.phoneInputText,
                    { color: phoneNumber ? '#000000' : '#8E8E93' }
                  ]}>
                    {phoneNumber || 'Enter your phone number'}
                  </Text>
                </TouchableOpacity>
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
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Please wait...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dialpad - Only show for phone number entry */}
        <Animated.View 
          style={[
            styles.dialpadSection,
            {
              opacity: dialpadAnimation,
              transform: [{
                translateY: dialpadAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                })
              }]
            }
          ]}
        >          
          {renderDialpad()}
        </Animated.View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
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
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  dropdownIcon: {
    color: '#2E7D32',
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
    color: '#2E7D32',
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  phoneInputText: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    color: '#000000',
  },
  actionButtonContainer: {
    paddingHorizontal:30,
    paddingBottom: 15,
    paddingTop: 10,
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#2E7D32',
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
  dialpadSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: '#F2F2F7',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dialpadContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dialpadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  dialpadTitlePlaceholder: {
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  dialpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 0,
    minHeight: 60,
  },
  dialpadButton: {
    flex: 1,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  backspaceButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 0,
  },
  zeroButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 0,
  },
  dialpadNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  backspaceIcon: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '700',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -67,
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 3,
  },
})

export default PhoneLoginScreen
