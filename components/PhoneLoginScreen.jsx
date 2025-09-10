import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native'

const PhoneLoginScreen = ({ onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('87859676647')
  const [countryCode, setCountryCode] = useState('+62')

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setPhoneNumber(prev => prev.slice(0, -1))
    } else if (key !== '') {
      setPhoneNumber(prev => prev + key)
    }
  }

  const handleLogin = () => {
    // Handle login logic here
    console.log('Login with phone:', countryCode + phoneNumber)
  }

  const KeypadButton = ({ value, letters = '', onPress, style = {} }) => (
    <TouchableOpacity
      style={[styles.keypadButton, style]}
      onPress={() => onPress(value)}
    >
      <Text style={styles.keypadNumber}>{value}</Text>
      {letters && <Text style={styles.keypadLetters}>{letters}</Text>}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleLine1}>Login with</Text>
          <Text style={styles.titleLine2}>Phone Number</Text>
          <Text style={styles.subtitle}>Please enter your phone number correctly</Text>
        </View>

        {/* Phone Input Section */}
        <View style={styles.phoneInputSection}>
          <View style={styles.phoneInputContainer}>
            {/* Country Code */}
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </View>
            
            {/* Phone Number Input */}
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        {/* Login Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Numeric Keypad */}
      <View style={styles.keypadContainer}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          <KeypadButton value="1" onPress={handleKeyPress} />
          <KeypadButton value="2" letters="ABC" onPress={handleKeyPress} />
          <KeypadButton value="3" letters="DEF" onPress={handleKeyPress} />
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          <KeypadButton value="4" letters="GHI" onPress={handleKeyPress} />
          <KeypadButton value="5" letters="JKL" onPress={handleKeyPress} />
          <KeypadButton value="6" letters="MNO" onPress={handleKeyPress} />
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          <KeypadButton value="7" letters="PQRS" onPress={handleKeyPress} />
          <KeypadButton value="8" letters="TUV" onPress={handleKeyPress} />
          <KeypadButton value="9" letters="WXYZ" onPress={handleKeyPress} />
        </View>

        {/* Row 4 */}
        <View style={styles.keypadRow}>
          <View style={styles.keypadButton} />
          <KeypadButton value="0" onPress={handleKeyPress} />
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleKeyPress('backspace')}
          >
            <Text style={styles.backspaceIcon}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default PhoneLoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  backArrow: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '300',
  },
  titleLine1: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 0,
  },
  titleLine2: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    lineHeight: 22,
  },
  phoneInputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    marginRight: 16,
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#8E8E93',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    paddingVertical: 0,
  },
  buttonSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  keypadContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  keypadButton: {
    width: 75,
    height: 55,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keypadNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  keypadLetters: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 1,
  },
  backspaceIcon: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
})
