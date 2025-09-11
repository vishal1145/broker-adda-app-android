import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native'
import OtpScreen from './OtpScreen'

const PhoneLoginScreen = ({ onBack, onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDialpad, setShowDialpad] = useState(true)
  const [dialpadAnimation] = useState(new Animated.Value(1))

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
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsOtpSent(true)
      Alert.alert('OTP Sent', `Verification code sent to +91 ${phoneNumber}`)
    }, 1500)
  }

  const handleOtpVerified = () => {
    onLoginSuccess()
  }

  const handleResendOtp = () => {
    Alert.alert('OTP Resent', 'New verification code sent to your phone')
  }

  const handleBackToPhone = () => {
    setIsOtpSent(false)
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
              <TouchableOpacity 
                style={[
                  styles.phoneInputContainer,
                  { borderColor: phoneNumber.length > 0 ? '#2E7D32' : '#E5E5EA' }
                ]}
                onPress={openDialpad}
                activeOpacity={0.7}
              >
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={styles.phoneInputWrapper}>
                  <Text style={[
                    styles.phoneInputText,
                    { color: phoneNumber ? '#000000' : '#8E8E93' }
                  ]}>
                    {phoneNumber || 'Enter your phone number'}
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.inputHelper}>
                {phoneNumber.length > 0 ? `${phoneNumber.length}/10 digits` : 'Use the dialpad below to enter your number'}
              </Text>
            </View>

            {/* Action Button */}
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

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    overflow: 'hidden',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCode: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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

export default PhoneLoginScreen
