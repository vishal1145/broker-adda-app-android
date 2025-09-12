import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native'
import { authAPI } from '../services/api'

const OtpScreen = ({ phoneNumber, onBack, onOtpVerified, onResendOtp }) => {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpDialpad, setShowOtpDialpad] = useState(true)
  const [otpDialpadAnimation] = useState(new Animated.Value(1))

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP')
      return
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    
    try {
      // Format phone number with country code
      const formattedPhone = `+91${phoneNumber}`
      
      // Call the OTP verification API
      const response = await authAPI.verifyOTP(formattedPhone, otp)
      
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
      await authAPI.sendOTP(formattedPhone)
      console.log('OTP resent successfully')
      if (onResendOtp) {
        onResendOtp()
      }
    } catch (error) {
      console.error('Resend OTP Error:', error)
      Alert.alert('Error', 'Failed to resend OTP. Please try again.')
    }
  }


  const handleOtpDialpadPress = (number) => {
    if (otp.length < 6) {
      setOtp(prev => prev + number)
    }
  }

  const handleOtpZeroPress = () => {
    if (otp.length < 6) {
      setOtp(prev => prev + '0')
    }
  }

  const handleOtpBackspace = () => {
    setOtp(prev => prev.slice(0, -1))
  }

  const renderOtpDialpad = () => {
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
                onPress={() => handleOtpDialpadPress(number)}
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
            onPress={handleOtpZeroPress}
            activeOpacity={0.7}
          >
            <Text style={styles.dialpadNumber}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dialpadButton, styles.backspaceButton]} 
            onPress={handleOtpBackspace}
            activeOpacity={0.7}
          >
            <Text style={styles.backspaceIcon}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Verification Code</Text>
          <View style={styles.headerBorder} />
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
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      { borderColor: otp.length > index ? '#2E7D32' : '#E5E5EA' }
                    ]}
                  >
                    <Text style={[
                      styles.otpBoxText,
                      { color: otp[index] ? '#000000' : '#8E8E93' }
                    ]}>
                      {otp[index] || '0'}
                    </Text>
                  </View>
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
              otp.length < 6 ? styles.actionButtonDisabled : null
            ]} 
            onPress={handleVerifyOtp}
            disabled={isLoading || otp.length < 6}
          >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Please wait...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* OTP Dialpad */}
        <Animated.View 
          style={[
            styles.dialpadSection,
            {
              opacity: otpDialpadAnimation,
              transform: [{
                translateY: otpDialpadAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                })
              }]
            }
          ]}
        >
          {renderOtpDialpad()}
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
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  otpBox: {
    width: 45,
    height: 55,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  otpBoxText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  actionButtonContainer: {
    paddingHorizontal: 30,
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

export default OtpScreen
