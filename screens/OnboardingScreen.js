import React, { useState, useRef } from 'react'
import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, Animated, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler'

const OnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [checkboxes, setCheckboxes] = useState({
    connectBrokers: true,
    shareListings: true,
    networkingEvents: true,
    trackConnections: true
  })
  
  const screenWidth = Dimensions.get('window').width
  const translateX = useRef(new Animated.Value(0)).current
  const panRef = useRef()
  const isAnimating = useRef(false)

  const animateToStep = (step, velocity = 0) => {
    if (isAnimating.current) return
    isAnimating.current = true
    
    const targetValue = -screenWidth * (step - 1)
    
    // Use different animation based on velocity for more natural feel
    if (Math.abs(velocity) > 1000) {
      // High velocity - use timing animation for snappy feel
      Animated.timing(translateX, {
        toValue: targetValue,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false
      })
    } else {
      // Normal velocity - use spring animation
      Animated.spring(translateX, {
        toValue: targetValue,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
        velocity: velocity,
      }).start(() => {
        isAnimating.current = false
      })
    }
  }

  const handleSwipe = (direction) => {
    if (isAnimating.current) return
    
    if (direction === 'left') {
      // Swipe left to go to next step (only if not on final step)
      if (currentStep < 4) {
        const newStep = currentStep + 1
        setCurrentStep(newStep)
        animateToStep(newStep)
      }
    } else if (direction === 'right') {
      // Swipe right to go to previous step
      if (currentStep > 1) {
        const newStep = currentStep - 1
        setCurrentStep(newStep)
        animateToStep(newStep)
      } else if (currentStep === 4) {
        // On final step, swipe right goes to step 3
        setCurrentStep(3)
        animateToStep(3)
      }
    }
  }

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        // Prevent gesture when animating
        if (isAnimating.current) {
          return
        }
      }
    }
  )

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Reset animation flag when gesture starts
      isAnimating.current = false
    }
    
    if (event.nativeEvent.state === State.END) {
      if (isAnimating.current) return
      
      const { translationX, velocityX } = event.nativeEvent
      const currentPosition = -screenWidth * (currentStep - 1)
      
      // More sensitive thresholds for better responsiveness
      const swipeThreshold = 30
      const velocityThreshold = 300
      
      // Determine swipe direction based on translation and velocity
      if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        // Swipe right - go to previous step
        if (currentStep > 1) {
          const newStep = currentStep - 1
          setCurrentStep(newStep)
          animateToStep(newStep, velocityX)
        } else {
          // Snap back to current position if on first step
          animateToStep(currentStep, 0)
        }
      } else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
        // Swipe left - go to next step
        if (currentStep < 4) {
          const newStep = currentStep + 1
          setCurrentStep(newStep)
          animateToStep(newStep, velocityX)
        } else {
          // Snap back to current position if on final step
          animateToStep(currentStep, 0)
        }
      } else {
        // Snap back to current position
        animateToStep(currentStep, 0)
      }
    }
  }

  const handleGetStarted = () => {
    // Navigate to phone login screen after onboarding completion
    navigation.navigate('PhoneLogin')
  }

  const handleSkip = () => {
    // Skip to final step (step 4)
    setCurrentStep(4)
    animateToStep(4)
  }

  const toggleCheckbox = (checkboxKey) => {
    setCheckboxes(prev => ({
      ...prev,
      [checkboxKey]: !prev[checkboxKey]
    }))
  }
  // Dotted line indicator component
  const DottedLineIndicator = ({ activeStep }) => {
    return (
      <View style={styles.dottedLineContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.dottedLine,
              step <= activeStep ? styles.dottedLineActive : styles.dottedLineInactive
            ]}
          />
        ))}
      </View>
    )
  }

  const getStepData = (step) => {
    switch (step) {
      case 1:
        return {
          headerTitle: 'Welcome to BrokerLink',
          image: require('../assets/onbording1.png'),
          mainHeading: 'Connect with Brokers\nAcross Agra',
          description: 'Expand your reach by linking with trusted brokers in every region.',
          showProgressBar: false,
          showFeatures: false
        }
      case 2:
        return {
          headerTitle: 'Onboarding',
          image: require('../assets/onbording2.png'),
          mainHeading: 'Discover New Opportunities',
          description: 'Access a wider network of professionals and properties, unlocking new collaborations.',
          showProgressBar: false,
          showFeatures: false
        }
      case 3:
        return {
          headerTitle: 'Build Your Network',
          image: require('../assets/onbording3.png'),
          mainHeading: 'Grow Your Business\nTogether',
          description: 'Join a community of successful brokers and unlock unlimited growth potential.',
          showProgressBar: false,
          showFeatures: false
        }
      case 4:
        return {
          headerTitle: 'Final Step',
          image: require('../assets/onbording3.png'),
          mainHeading: 'Unlock Your BrokerLink Potential',
          description: 'Access powerful features designed to expand your network and grow your business today.',
          showProgressBar: false,
          showFeatures: true
        }
      default:
        return null
    }
  }

  const renderStep = (step) => {
    const stepData = getStepData(step)
    if (!stepData) return null

    return (
      <View key={step} style={styles.stepContainer}>
        {/* For Step 4: Show heading first, then description, then checkboxes (no image) */}
        {step === 4 ? (
          <>
            {/* Main Heading for Step 4 */}
            <View style={styles.step3HeadingContainer}>
              <Text style={styles.mainHeading}>
                {stepData.mainHeading}
              </Text>
            </View>

            {/* Description for Step 4 */}
            <View style={styles.step3DescriptionContainer}>
              <Text style={styles.description}>
                {stepData.description}
              </Text>
            </View>

            {/* Feature List for Step 4 */}
            <View style={styles.featureList}>
              <TouchableOpacity 
                style={styles.featureItem} 
                onPress={() => toggleCheckbox('connectBrokers')}
                activeOpacity={0.7}
              >
                <View style={checkboxes.connectBrokers ? styles.checkboxChecked : styles.checkboxUnchecked}>
                  {checkboxes.connectBrokers && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.featureText}>Connect with verified brokers across regions.</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureItem} 
                onPress={() => toggleCheckbox('shareListings')}
                activeOpacity={0.7}
              >
                <View style={checkboxes.shareListings ? styles.checkboxChecked : styles.checkboxUnchecked}>
                  {checkboxes.shareListings && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.featureText}>Share listings and find exclusive opportunities.</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureItem} 
                onPress={() => toggleCheckbox('networkingEvents')}
                activeOpacity={0.7}
              >
                <View style={checkboxes.networkingEvents ? styles.checkboxChecked : styles.checkboxUnchecked}>
                  {checkboxes.networkingEvents && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.featureText}>Participate in local and national networking events.</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureItem} 
                onPress={() => toggleCheckbox('trackConnections')}
                activeOpacity={0.7}
              >
                <View style={checkboxes.trackConnections ? styles.checkboxChecked : styles.checkboxUnchecked}>
                  {checkboxes.trackConnections && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.featureText}>Track your connections and build your professional profile.</Text>
              </TouchableOpacity>
              
              {/* Step Indicator for Step 4 - positioned below feature list */}
              <View style={styles.stepIndicatorInline}>
                <DottedLineIndicator activeStep={currentStep} />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Central Image for Steps 1, 2, and 3 */}
            <View style={styles.imageContainer}>
              <Image 
                source={typeof stepData.image === 'string' ? { uri: stepData.image } : stepData.image}
                style={styles.centralImage}
                resizeMode="cover"
                onError={(error) => console.log('Image load error:', error)}
                onLoad={() => console.log('Image loaded successfully')}
              />
            </View>

            {/* Main Content for Steps 1, 2, and 3 */}
            <View style={styles.contentSection}>
              <Text style={styles.mainHeading}>
                {stepData.mainHeading}
              </Text>
              <Text style={styles.description}>
                {stepData.description}
              </Text>
              
              {/* Step Indicator for steps 1, 2, and 3 */}
              <View style={styles.stepIndicatorInline}>
                <DottedLineIndicator activeStep={currentStep} />
              </View>
            </View>
          </>
        )}
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.onboardingContainer} edges={[]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Skip Button - Only on steps 1, 2, and 3 */}
        {(currentStep === 1 || currentStep === 2 || currentStep === 3) && (
          <View style={styles.skipButtonContainer}>
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-5, 5]}
          failOffsetY={[-10, 10]}
          minPointers={1}
          maxPointers={1}
        >
          <Animated.View style={[styles.sliderContainer, { transform: [{ translateX }] }]}>
            {renderStep(1)}
            {renderStep(2)}
            {renderStep(3)}
            {renderStep(4)}
          </Animated.View>
        </PanGestureHandler>

        {/* Get Started Button - Only on final step */}
        {currentStep === 4 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.getStartedButton} 
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '400%', // 4 steps * 100%
  },
  stepContainer: {
    width: '25%', // 100% / 4 steps
    flex: 1,
    flexDirection: 'column',
    paddingBottom: 40,
  },
  mainContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
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
  progressContainer: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#009689',
    borderRadius: 2,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  centralImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  contentSection: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
  },
  stepIndicator: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 20,
  },
  stepIndicatorInline: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  dottedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dottedLine: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dottedLineActive: {
    backgroundColor: '#009689',
  },
  dottedLineInactive: {
    backgroundColor: '#E5E5EA',
  },
  featureList: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    backgroundColor: '#009689',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#009689',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    flexShrink: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    textAlign: 'left',
    marginLeft: 16,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
    paddingTop: 20,
  },
  getStartedButton: {
    backgroundColor: '#009689',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#009689',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  skipButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  step3HeadingContainer: {
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  step3DescriptionContainer: {
    paddingHorizontal: 40,
    paddingTop: 0,
    paddingBottom: 60,
    alignItems: 'center',
    flexShrink: 0,
  },
})

export default OnboardingScreen
