import React, { useEffect, useState } from 'react'
import SplashScreen from './screens/SplashScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import PhoneLoginScreen from './screens/PhoneLoginScreen'

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [currentScreen, setCurrentScreen] = useState(1)
  const [showLogin, setShowLogin] = useState(false)
  const [showPhoneLogin, setShowPhoneLogin] = useState(false)

  useEffect(() => {
    // Show splash screen for 2 seconds, then show onboarding
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleNext = () => {
    if (currentScreen === 1) {
      setCurrentScreen(2)
    } else if (currentScreen === 2) {
      setCurrentScreen(3)
    }
  }

  const handleBack = () => {
    if (currentScreen === 2) {
      setCurrentScreen(1)
    } else if (currentScreen === 3) {
      setCurrentScreen(2)
    }
  }

  const handleGetStarted = () => {
    // Show login screen after onboarding completion
    setShowLogin(true)
  }

  const handleBackToOnboarding = () => {
    // Go back to onboarding from login
    setShowLogin(false)
  }


  const handlePhoneLogin = () => {
    setShowPhoneLogin(true)
  }

  const handleBackToMainLogin = () => {
    setShowPhoneLogin(false)
  }

  const handleLoginSuccess = () => {
    // Handle successful login - you can navigate to main app or dashboard
    setShowPhoneLogin(false)
    setShowLogin(false)
    // Add your main app navigation logic here
    console.log('Login successful!')
  }

  if (showSplash) {
    return <SplashScreen />
  }

  if (showPhoneLogin) {
    return <PhoneLoginScreen onBack={handleBackToMainLogin} onLoginSuccess={handleLoginSuccess} />
  }


  if (showLogin) {
    return <LoginScreen onBack={handleBackToOnboarding} onPhoneLogin={handlePhoneLogin} />
  }

  return (
    <OnboardingScreen 
      currentStep={currentScreen}
      onNext={handleNext}
      onBack={handleBack}
      onGetStarted={handleGetStarted}
    />
  )
}

export default App
