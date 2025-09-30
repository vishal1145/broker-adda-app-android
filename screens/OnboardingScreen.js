import React, { useState, useRef } from 'react'
import { StyleSheet, Text, View, StatusBar, Image, TouchableOpacity, Animated, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PanGestureHandler, State } from 'react-native-gesture-handler'

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

  const handleSwipe = (direction) => {
    if (direction === 'left') {
      // Swipe left to go to next step (only if not on final step)
      if (currentStep < 3) {
        const newStep = currentStep + 1
        setCurrentStep(newStep)
        Animated.timing(translateX, {
          toValue: -screenWidth * (newStep - 1),
          duration: 300,
          useNativeDriver: true,
        }).start()
      }
      // On final step, swipe left does nothing (stays on step 3)
    } else if (direction === 'right') {
      // Swipe right to go to previous step
      if (currentStep > 1) {
        const newStep = currentStep - 1
        setCurrentStep(newStep)
        Animated.timing(translateX, {
          toValue: -screenWidth * (newStep - 1),
          duration: 300,
          useNativeDriver: true,
        }).start()
      } else if (currentStep === 3) {
        // On final step, swipe right goes to step 2
        setCurrentStep(2)
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }
    }
  }

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  )

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent
      
      // Determine swipe direction based on translation and velocity
      if (translationX > 30 || velocityX > 300) {
        // Swipe right - go to previous step (allowed on all steps except first)
        if (currentStep > 1) {
          handleSwipe('right')
        } else {
          // Snap back to current position if on first step
          Animated.spring(translateX, {
            toValue: -screenWidth * (currentStep - 1),
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start()
        }
      } else if (translationX < -30 || velocityX < -300) {
        // Swipe left - go to next step (only if not on final step)
        if (currentStep < 3) {
          handleSwipe('left')
        } else {
          // Snap back to current position if on final step
          Animated.spring(translateX, {
            toValue: -screenWidth * (currentStep - 1),
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start()
        }
      } else {
        // Snap back to current position
        Animated.spring(translateX, {
          toValue: -screenWidth * (currentStep - 1),
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start()
      }
    }
  }

  const handleGetStarted = () => {
    // Navigate to phone login screen after onboarding completion
    navigation.navigate('PhoneLogin')
  }

  const handleSkip = () => {
    // Skip to final step (step 3)
    setCurrentStep(3)
    Animated.timing(translateX, {
      toValue: -screenWidth * 2, // Move to step 3 (index 2)
      duration: 300,
      useNativeDriver: true,
    }).start()
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
        {[1, 2, 3].map((step) => (
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
        {/* Central Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={typeof stepData.image === 'string' ? { uri: stepData.image } : stepData.image}
            style={styles.centralImage}
            resizeMode="cover"
            onError={(error) => console.log('Image load error:', error)}
            onLoad={() => console.log('Image loaded successfully')}
          />
        </View>

        {/* Main Content */}
        <View style={styles.contentSection}>
          <Text style={styles.mainHeading}>
            {stepData.mainHeading}
          </Text>
          <Text style={styles.description}>
            {stepData.description}
          </Text>
          
          {/* Step Indicator for steps 1 and 2 */}
          {!stepData.showFeatures && (
            <View style={styles.stepIndicatorInline}>
              <DottedLineIndicator activeStep={currentStep} />
            </View>
          )}
        </View>

        {/* Feature List for Step 3 */}
        {stepData.showFeatures && (
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
            
            {/* Step Indicator for Step 3 - positioned below feature list */}
            <View style={styles.stepIndicatorInline}>
              <DottedLineIndicator activeStep={currentStep} />
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.onboardingContainer} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Skip Button - Only on steps 1 and 2 */}
      {(currentStep === 1 || currentStep === 2) && (
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
        minDist={10}
      >
        <Animated.View style={[styles.sliderContainer, { transform: [{ translateX }] }]}>
          {renderStep(1)}
          {renderStep(2)}
          {renderStep(3)}
        </Animated.View>
      </PanGestureHandler>


      {/* Get Started Button - Only on final step */}
      {currentStep === 3 && (
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
  )
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '300%', // 3 steps * 100%
  },
  stepContainer: {
    width: '33.333%', // 100% / 3 steps
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  centralImage: {
    width: '100%',
    height: 250,
    borderRadius: 0,
  },
  contentSection: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  mainHeading: {
    fontSize:30,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 36,
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
    backgroundColor: '#009689',
  },
  dottedLineInactive: {
    backgroundColor: '#E5E5EA',
  },
  featureList: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    backgroundColor: '#009689',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxUnchecked: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    flexShrink: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 22,
    textAlign: 'left',
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 10,
  },
  getStartedButton: {
    backgroundColor: '#009689',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
})

export default OnboardingScreen
