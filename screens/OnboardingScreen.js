import React, { useState, useRef, useEffect } from 'react'
import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler'
import { responsive } from '../utils/responsive'

const OnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1)
  
  const screenWidth = Dimensions.get('window').width
  const translateX = useRef(new Animated.Value(0)).current
  const panRef = useRef()
  const isAnimating = useRef(false)

  // Initialize translateX value when component mounts
  useEffect(() => {
    translateX.setValue(0)
  }, [])

  const animateToStep = (step, velocity = 0) => {
    if (isAnimating.current) return
    isAnimating.current = true
    
    const targetValue = -screenWidth * (step - 1)
    
    // Use spring animation for smooth transitions
    Animated.spring(translateX, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
      velocity: velocity * 0.1, // Scale down velocity for smoother animation
    }).start(() => {
      isAnimating.current = false
    })
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

  const onGestureEvent = (event) => {
    if (isAnimating.current) return
    
    const { translationX } = event.nativeEvent
    const currentPosition = -screenWidth * (currentStep - 1)
    const newTranslation = currentPosition + translationX
    
    // Clamp the translation to prevent over-scrolling
    const minTranslation = -screenWidth * 3 // Step 4
    const maxTranslation = 0 // Step 1
    const clampedTranslation = Math.max(minTranslation, Math.min(maxTranslation, newTranslation))
    
    translateX.setValue(clampedTranslation)
  }

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Reset animation flag when gesture starts
      isAnimating.current = false
    }
    
    if (event.nativeEvent.state === State.END) {
      if (isAnimating.current) return
      
      const { translationX, velocityX } = event.nativeEvent
      
      // Swipe thresholds - more sensitive
      const swipeThreshold = 30
      const velocityThreshold = 300
      
      console.log('Swipe detected:', { translationX, velocityX, currentStep })
      
      // Determine swipe direction based on translation and velocity
      if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        // Swipe right - go to previous step
        console.log('Swipe right detected')
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
        console.log('Swipe left detected')
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
        console.log('Snap back to current position')
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
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
              <View style={styles.featureItem}>
                <View style={styles.checkboxChecked}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.featureText}>Connect with verified brokers across regions.</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.checkboxChecked}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.featureText}>Share listings and find exclusive opportunities.</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.checkboxChecked}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.featureText}>Participate in local and national networking events.</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.checkboxChecked}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.featureText}>Track your connections and build your professional profile.</Text>
              </View>
              
              {/* Step Indicator for Step 4 - positioned below feature list */}
              <View style={styles.stepIndicatorInline}>
                <DottedLineIndicator activeStep={currentStep} />
              </View>
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Central Image for Steps 1, 2, and 3 */}
            <View style={styles.imageContainer}>
              <Image 
                source={typeof stepData.image === 'string' ? { uri: stepData.image } : stepData.image}
                style={styles.centralImage}
                resizeMode="contain"
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
      <SafeAreaView style={styles.onboardingContainer} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
        
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
          activeOffsetX={[-20, 20]}
          failOffsetY={[-50, 50]}
          minPointers={1}
          maxPointers={1}
          shouldCancelWhenOutside={true}
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
    width: Dimensions.get('window').width * 4, // 4 steps * screen width
  },
  stepContainer: {
    width: Dimensions.get('window').width, // Each step takes full screen width
    flex: 1,
    flexDirection: 'column',
    paddingBottom: responsive.verticalScale(20),
    minHeight: Dimensions.get('window').height - 100, // Ensure minimum height
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
    backgroundColor: '#0D542BFF',
    borderRadius: 2,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    zIndex: 1,
    paddingHorizontal: responsive.padding.md, // Added horizontal padding for image spacing
    paddingTop: responsive.verticalScale(20), // Increased padding to account for status bar and skip button
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: '#0D542BFF',
  },
  dottedLineInactive: {
    backgroundColor: '#E5E5EA',
  },
  featureList: {
    paddingHorizontal: responsive.padding.xl,
    paddingBottom: responsive.verticalScale(20),
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: responsive.verticalScale(20),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive.spacing.lg,
    width: '100%',
    paddingVertical: responsive.padding.md,
    paddingHorizontal: responsive.padding.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: responsive.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  checkboxChecked: {
    width: responsive.scale(24),
    height: responsive.scale(24),
    backgroundColor: '#0D542BFF',
    borderRadius: responsive.scale(12), // Circular checkbox
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#0D542BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    marginLeft: responsive.spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: responsive.padding.xl,
    paddingBottom: responsive.verticalScale(50), // Increased bottom padding to avoid navigation bar
    paddingTop: responsive.scale(10),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    // Add safe area bottom padding
    paddingBottom: Math.max(responsive.verticalScale(50), 34), // Ensure minimum safe area
  },
  getStartedButton: {
    backgroundColor: '#0D542BFF',
    paddingVertical: responsive.verticalScale(20),
    paddingHorizontal: responsive.padding.xl,
    borderRadius: responsive.borderRadius.xl,
    alignItems: 'center',
    marginTop: responsive.spacing.sm,
    shadowColor: '#0D542BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipButtonContainer: {
    position: 'absolute',
    top: responsive.verticalScale(50),
    right: responsive.scale(20),
    zIndex: 100, // Increased z-index to ensure it's always on top
  },
  skipButton: {
    paddingHorizontal: responsive.padding.lg,
    paddingVertical: responsive.padding.sm,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  skipButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
  step3HeadingContainer: {
    paddingHorizontal: responsive.padding.xl,
    paddingTop: responsive.verticalScale(20),
    paddingBottom: responsive.scale(20),
    alignItems: 'center',
    flexShrink: 0,
  },
  step3DescriptionContainer: {
    paddingHorizontal: responsive.padding.xl,
    paddingTop: 0,
    paddingBottom: responsive.verticalScale(20),
    alignItems: 'center',
    flexShrink: 0,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: responsive.verticalScale(100), // Extra padding for button space
  },
})

export default OnboardingScreen
