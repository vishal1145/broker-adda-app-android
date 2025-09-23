import React, { useEffect } from 'react'
import { StyleSheet, Text, View, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Show splash screen for 2 seconds, then navigate to onboarding
    const timer = setTimeout(() => {
      navigation.replace('Onboarding')
    }, 2000)

    return () => clearTimeout(timer)
  }, [navigation])
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      <View style={styles.content}>
        <Text style={styles.logo}>Broker Adda</Text>
      </View>
      {/* <View style={styles.homeIndicator} /> */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16BCC0', 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 50,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
    letterSpacing: 1,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -67,
    width: 134,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
})

export default SplashScreen
