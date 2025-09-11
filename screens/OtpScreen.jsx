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

const OtpScreen = ({ phoneNumber, onBack, onOtpVerified, onResendOtp }) => {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpDialpad, setShowOtpDialpad] = useState(false)
  const [otpDialpadAnimation] = useState(new Animated.Value(0))

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
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      Alert.alert('Success', 'Phone number verified successfully!', [
        { text: 'OK', onPress: onOtpVerified }
      ])
    }, 1500)
  }

  const handleResendOtp = () => {
    Alert.alert('OTP Resent', 'New verification code sent to your phone')
    if (onResendOtp) {
      onResendOtp()
    }
  }

  const toggleOtpDialpad = () => {
    const newShowOtpDialpad = !showOtpDialpad
    setShowOtpDialpad(newShowOtpDialpad)
    
    Animated.timing(otpDialpadAnimation, {
      toValue: newShowOtpDialpad ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
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
                {number === '2' && <Text style={styles.dialpadLetters}>ABC</Text>}
                {number === '3' && <Text style={styles.dialpadLetters}>DEF</Text>}
                {number === '4' && <Text style={styles.dialpadLetters}>GHI</Text>}
                {number === '5' && <Text style={styles.dialpadLetters}>JKL</Text>}
                {number === '6' && <Text style={styles.dialpadLetters}>MNO</Text>}
                {number === '7' && <Text style={styles.dialpadLetters}>PQRS</Text>}
                {number === '8' && <Text style={styles.dialpadLetters}>TUV</Text>}
                {number === '9' && <Text style={styles.dialpadLetters}>WXYZ</Text>}
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
              <TouchableOpacity 
                style={styles.otpInput}
                onPress={toggleOtpDialpad}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.otpInputText,
                  { color: otp ? '#000000' : '#8E8E93' }
                ]}>
                  {otp || '000000'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResendOtp} style={styles.resendButton}>
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>

            {/* Action Button */}
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

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
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
          {/* Home Indicator */}
          <View style={styles.homeIndicator} />
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
    alignItems: 'center',
    marginBottom: 25,
  },
  illustrationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 34,
  },
  illustrationSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  inputSection: {
    marginBottom: 30,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  otpInput: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInputText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
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
  actionButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
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
    backgroundColor: '#E5E5EA',
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
    height: 450,
    backgroundColor: '#F5F5F5',
    paddingTop: 20,
    paddingBottom: 30,
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dialpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    minHeight: 70,
  },
  dialpadButton: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  backspaceButton: {
    backgroundColor: '#F8F9FA',
    borderColor: '#2E7D32',
  },
  zeroButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  dialpadNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  dialpadLetters: {
    fontSize: 10,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: 0.3,
  },
  backspaceIcon: {
    fontSize: 24,
    color: '#2E7D32',
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
