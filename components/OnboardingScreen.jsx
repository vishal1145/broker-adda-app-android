import React from 'react'
import { StyleSheet, Text, View, StatusBar, SafeAreaView, Image, TouchableOpacity } from 'react-native'

const OnboardingScreen = ({ currentStep, onNext, onBack, onGetStarted }) => {
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

  const getStepData = () => {
    switch (currentStep) {
      case 1:
        return {
          headerTitle: 'Welcome to BrokerLink',
          image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
          mainHeading: 'Connect with Brokers\nAcross Agra',
          description: 'Expand your reach by linking with trusted brokers in every region.',
          showProgressBar: false,
          buttons: [
            { text: 'Next', style: 'next', onPress: onNext },
            { text: 'Skip', style: 'skip', onPress: onNext }
          ]
        }
      case 2:
        return {
          headerTitle: 'Onboarding',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
          mainHeading: 'Discover New Opportunities',
          description: 'Access a wider network of professionals and properties, unlocking new collaborations.',
          showProgressBar: true,
          progressFill: '66%',
          buttons: [
            { text: '← Back', style: 'back', onPress: onBack },
            { text: 'Next →', style: 'next', onPress: onNext }
          ]
        }
      case 3:
        return {
          headerTitle: 'Final Step',
          image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop',
          mainHeading: 'Unlock Your BrokerLink Potential',
          description: 'Access powerful features designed to expand your network and grow your business today.',
          showProgressBar: true,
          progressFill: '100%',
          showFeatures: true,
          buttons: [
            { text: 'Get Started', style: 'getStarted', onPress: onGetStarted }
          ]
        }
      default:
        return null
    }
  }

  const stepData = getStepData()
  if (!stepData) return null

  return (
    <SafeAreaView style={styles.onboardingContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{stepData.headerTitle}</Text>
        <View style={styles.headerBorder} />
      </View>


      {/* Central Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: stepData.image }}
          style={styles.centralImage}
          resizeMode="cover"
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
      </View>

      {/* Progress Section for Step 2 only */}
      {stepData.showProgressBar && currentStep === 2 && (
        <View style={styles.progressContainer}>
          <DottedLineIndicator activeStep={2} />
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: stepData.progressFill }]} />
          </View>
        </View>
      )}
      {/* Bottom Content Container */}
      <View style={styles.bottomContent}>
        

        {/* Feature List for Step 3 */}
        {stepData.showFeatures && (
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
              <View style={styles.checkboxUnchecked}>
              </View>
              <Text style={styles.featureText}>Track your connections and build your professional profile.</Text>
            </View>
          </View>
        )}

        {/* Step Indicator for Step 1 */}
        {!stepData.showProgressBar && (
          <View style={styles.stepIndicator}>
            <DottedLineIndicator activeStep={1} />
          </View>
        )}

        {/* Progress Section for Step 3 only - above Get Started button */}
        {stepData.showProgressBar && currentStep === 3 && (
          <View style={styles.progressContainer}>
            <DottedLineIndicator activeStep={3} />
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: stepData.progressFill }]} />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {stepData.buttons.map((button, index) => (
            <TouchableOpacity 
              key={index}
              style={styles[`${button.style}Button`]} 
              onPress={button.onPress}
            >
              <Text style={styles[`${button.style}ButtonText`]}>{button.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
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
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
  imageContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  centralImage: {
    width: '100%',
    height: 250,
    borderRadius: 0,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  contentSection: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
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
    paddingBottom: 30,
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
    backgroundColor: '#2E7D32',
  },
  dottedLineInactive: {
    backgroundColor: '#E5E5EA',
  },
  featureList: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 12,
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
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    gap: 15,
  },
  nextButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  getStartedButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
})

export default OnboardingScreen
