import React from 'react'
import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'

const LoginScreen = ({ navigation }) => {
  const handlePhoneLogin = () => {
    navigation.navigate('PhoneLogin')
  }
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#009689" />
      
      {/* Background Image */}
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=800&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo and Tagline */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>Broker Adda</Text>
          <Text style={styles.tagline}>
            Connect with trusted brokers and find the perfect property for your needs.
          </Text>
        </View>
      </View>
      
      {/* Bottom Popup Container */}
      <View style={styles.popupContainer}>
        <View style={styles.popupContent}>
          {/* Mobile Number Button */}
          <TouchableOpacity style={styles.mobileButton} onPress={handlePhoneLogin}>
            <View style={styles.phoneIconContainer}>
              <MaterialIcons name="phone-android" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.mobileButtonText}>Continue with Mobile Number</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#009689',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(46, 125, 50, 0)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 50,
  },
  logoSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  popupContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  mobileButton: {
    backgroundColor: '#009689',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#009689',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  phoneIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default LoginScreen
