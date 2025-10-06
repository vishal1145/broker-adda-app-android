import React, { useEffect } from 'react'
import { StyleSheet, Text, View, StatusBar, Image, Animated, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { responsive } from '../utils/responsive'

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0)
  const scaleAnim = new Animated.Value(0.8)
  const slideAnim = new Animated.Value(50)

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start()

    // Show splash screen for 3 seconds, then navigate to onboarding
    const timer = setTimeout(() => {
      navigation.replace('Onboarding')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <View style={styles.gradient}>
        {/* Background Pattern */}
        <View style={styles.headerPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
          <View style={styles.patternCircle3} />
          <View style={styles.patternCircle4} />
        </View>

        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Broker Adda</Text>
            <Text style={styles.tagline}>Your Real Estate Success Partner</Text>
          </Animated.View>

        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Broker Adda. All rights reserved.</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#009689',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    width: responsive.scale(200),
    height: responsive.scale(200),
    borderRadius: responsive.scale(100),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: responsive.scale(-50),
    right: responsive.scale(-50),
  },
  patternCircle2: {
    position: 'absolute',
    width: responsive.scale(150),
    height: responsive.scale(150),
    borderRadius: responsive.scale(75),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: responsive.scale(100),
    left: responsive.scale(-30),
  },
  patternCircle3: {
    position: 'absolute',
    width: responsive.scale(100),
    height: responsive.scale(100),
    borderRadius: responsive.scale(50),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: responsive.scale(150),
    right: responsive.scale(80),
  },
  patternCircle4: {
    position: 'absolute',
    width: responsive.scale(80),
    height: responsive.scale(80),
    borderRadius: responsive.scale(40),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: responsive.scale(200),
    right: responsive.scale(20),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.padding.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: responsive.verticalScale(60),
  },
  logoWrapper: {
    width: responsive.scale(120),
    height: responsive.scale(120),
    borderRadius: responsive.scale(60),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsive.spacing.xxxl,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: responsive.scale(100),
    height: responsive.scale(100),
  },
  appName: {
    fontSize: responsive.fontSize.largeTitle,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: responsive.spacing.sm,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: responsive.fontSize.lg,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: responsive.verticalScale(40),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: responsive.fontSize.sm,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
})

export default SplashScreen
