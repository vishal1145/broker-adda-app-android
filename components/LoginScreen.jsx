import React from 'react'
import { StyleSheet, Text, View, StatusBar, SafeAreaView, Image, TouchableOpacity } from 'react-native'

const LoginScreen = ({ onBack, onPhoneLogin }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* Background Image */}
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=800&fit=crop' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Overlay */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo and Tagline */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>Broker Adda</Text>
          <Text style={styles.tagline}>
            Connect with trusted brokers and find the perfect property for your needs.
          </Text>
        </View>
        
        {/* Login Card */}
        <View style={styles.loginCard}>
          {/* Mobile Number Button */}
          <TouchableOpacity style={styles.mobileButton} onPress={onPhoneLogin}>
            <Text style={styles.phoneIcon}>📱</Text>
            <Text style={styles.mobileButtonText}>Continue with Mobile Number</Text>
          </TouchableOpacity>
          
        </View>
      </View>
      
      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(46, 125, 50, 0.7)',
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
  loginCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mobileButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  phoneIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#FFFFFF',
  },
  mobileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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

export default LoginScreen
