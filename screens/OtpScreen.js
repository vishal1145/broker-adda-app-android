import React, { useState, useRef, useEffect } from 'react'
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
import { authAPI } from '../services/api'
import { storage } from '../services/storage'

const OtpScreen = ({ phoneNumber, onBack, onOtpVerified, onResendOtp, onEditPhone }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRefs = useRef([])

  const handleVerifyOtp = async (otpArray = null) => {
    const currentOtp = otpArray || otp
    const otpString = currentOtp.join('')
    if (!otpString.trim()) {
      Snackbar.showValidationError('Please enter the OTP')
      return
    }

    if (otpString.length !== 6) {
      Snackbar.showValidationError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    
    try {
      // Send only phone number without country code
      const response = await authAPI.verifyOTP(phoneNumber, otpString)
      
      // Save token, phone, and broker ID from response
      if (response && response.data) {
        const { token, user } = response.data
        if (token && user && user.id) {
          await storage.saveAuthData(token, user.phone, user.id) // Using user.id as brokerId
          console.log('Auth data saved:', { token, phone: user.phone, brokerId: user.id })
        }
      }
      
      setIsLoading(false)
      
      // Navigate directly to main tabs after successful OTP verification
      console.log('OTP verified successfully, navigating to main tabs...')
      onOtpVerified()
      
      console.log('OTP Verification Response:', response)
    } catch (error) {
      setIsLoading(false)
      
      // Handle different types of errors
      let errorMessage = 'Failed to verify OTP. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const data = error.response.data
        
        if (status === 400) {
          errorMessage = data.message || 'Invalid OTP format'
        } else if (status === 401) {
          errorMessage = 'Invalid OTP. Please check and try again.'
        } else if (status === 404) {
          errorMessage = 'OTP expired. Please request a new one.'
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = data.message || `Verification failed with status ${status}`
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection.'
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      console.error('OTP Verification Error:', error)
      Snackbar.showApiError(errorMessage)
    }
  }

  const handleResendOtp = async () => {
    try {
      await authAPI.resendOTP(phoneNumber)
      console.log('OTP resent successfully')
      
      // Clear the OTP input fields
      setOtp(['', '', '', '', '', ''])
      setFocusedIndex(0)
      
      // Focus on the first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
      
      if (onResendOtp) {
        onResendOtp()
      }
    } catch (error) {
      console.error('Resend OTP Error:', error)
      Snackbar.showApiError('Failed to resend OTP. Please try again.')
    }
  }


  const handleOtpChange = (text, index) => {
    // Only allow single digit
    const digit = text.replace(/\D/g, '').slice(0, 1)
    
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    
    // Auto-focus next input if digit entered
    if (digit && index < 5) {
      setFocusedIndex(index + 1)
      // Focus the next input after a small delay
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus()
      }, 50)
    }
    
    // Check if all 6 digits are entered and auto-verify
    if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleVerifyOtp(newOtp)
      }, 200)
    }
  }

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace') {
      // If current box is empty, go to previous box
      if (!otp[index] && index > 0) {
        setFocusedIndex(index - 1)
        inputRefs.current[index - 1]?.focus()
      } else {
        // Clear current box
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
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
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            {/* <Text style={styles.headerTitle}>Enter Verification Code</Text>
            <View style={styles.headerBorder} /> */}
          </View>

          {/* Main Content Container */}
          <View style={styles.mainContent}>
            {/* Content */}
            <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <Text style={styles.illustrationTitle}>
                Enter OTP
                </Text>
                <View style={styles.subtitleContainer}>
                  <Text style={styles.illustrationSubtitle}>
                    We have sent a code to {phoneNumber}
                  </Text>
                  <TouchableOpacity 
                    onPress={onEditPhone}
                    style={styles.editIconContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="edit" size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.otpContainer}>
                  <View style={styles.otpBoxesContainer}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.otpBox,
                          { 
                            borderColor: otp[index] ? '#0D542BFF' : (focusedIndex === index ? '#0D542BFF' : '#E5E5EA'),
                            backgroundColor: 'transparent'
                          }
                        ]}
                        value={otp[index]}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        onFocus={() => setFocusedIndex(index)}
                        placeholder="0"
                        placeholderTextColor="#8E8E93"
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        autoFocus={index === 0}
                      />
                    ))}
                  </View>
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
                    otp.join('').length < 6 ? styles.actionButtonDisabled : null
                  ]} 
                  onPress={handleVerifyOtp}
                  disabled={isLoading || otp.join('').length < 6}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, styles.loadingText]}>
                        Please wait...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.actionButtonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Resend OTP Link */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  Didn't receive the code?
                </Text>
                <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                  <Text style={styles.toggleButton}>
                    Resend OTP
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
  illustrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 30,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  illustrationSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'left',
    lineHeight: 22,
    paddingHorizontal: 0,
  },
  editIconContainer: {
    marginLeft: 4,
    padding: 2,
  },
  inputSection: {
    marginBottom: 10,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 10,
    flexShrink: 0,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 0,            
  },
  otpBox: {
    flex: 1,                         
    marginHorizontal: 4,             
    minHeight: 50,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  placeholderText: {
    color: '#8E8E93',
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

export default OtpScreen
