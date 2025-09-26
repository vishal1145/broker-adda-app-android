import React, { useState, useRef, useEffect } from 'react'
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
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { authAPI } from '../services/api'
import { storage } from '../services/storage'

const OtpScreen = ({ phoneNumber, onBack, onOtpVerified, onResendOtp }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRefs = useRef([])

  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    if (!otpString.trim()) {
      Alert.alert('Error', 'Please enter the OTP')
      return
    }

    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    
    try {
      // Format phone number with country code
      const formattedPhone = `+91${phoneNumber}`
      
      // Call the OTP verification API
      const response = await authAPI.verifyOTP(formattedPhone, otpString)
      
      // Save token, phone, and broker ID from response
      if (response && response.data) {
        const { token, user } = response.data
        if (token && user && user.id) {
          await storage.saveAuthData(token, user.phone, user.id) // Using user.id as brokerId
          console.log('Auth data saved:', { token, phone: user.phone, brokerId: user.id })
        }
      }
      
      setIsLoading(false)
      
      // Navigate directly to home page without alert
      console.log('OTP verified successfully, navigating to home...')
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
      Alert.alert('Error', errorMessage)
    }
  }

  const handleResendOtp = async () => {
    try {
      const formattedPhone = `+91${phoneNumber}`
      await authAPI.resendOTP(formattedPhone)
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
      Alert.alert('Error', 'Failed to resend OTP. Please try again.')
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
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="#16BCC0" />
          </TouchableOpacity>
          {/* <Text style={styles.headerTitle}>Enter Verification Code</Text>
          <View style={styles.headerBorder} /> */}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.illustrationTitle}>
              Enter Verification Code
            </Text>
            <Text style={styles.illustrationSubtitle}>
              We've sent a 6-digit code to +91 {phoneNumber}
            </Text>
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
                        borderColor: otp[index] ? '#16BCC0' : (focusedIndex === index ? '#16BCC0' : '#E5E5EA'),
                        backgroundColor: focusedIndex === index ? '#F0FDFF' : '#FFFFFF'
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
              <TouchableOpacity onPress={handleResendOtp} style={styles.resendButton}>
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Action Button - Above dialpad */}
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
  otpContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 0,            
  },
  otpBox: {
    flex: 1,                         
    marginHorizontal: 4,             
    height: 55,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16BCC0',
  },
  actionButtonContainer: {
    paddingHorizontal: 30,
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
})

export default OtpScreen
