import React from 'react'
import { StyleSheet, Text, View, StatusBar, SafeAreaView, Image, TouchableOpacity } from 'react-native'

const LoginScreen = ({ onBack, onPhoneLogin }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
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
        
        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Mobile Number Button */}
          <TouchableOpacity style={styles.mobileButton} onPress={onPhoneLogin}>
            <View style={styles.phoneIconContainer}>
              <Text style={styles.phoneIcon}>📱</Text>
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
    backgroundColor: '#2E7D32',
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
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mobileButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  phoneIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  mobileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default LoginScreen
