import React, { useEffect, useState } from 'react'
import SplashScreen from './screens/SplashScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import PhoneLoginScreen from './screens/PhoneLoginScreen'
import HomeScreen from './screens/HomeScreen'
import NetworkScreen from './screens/NetworkScreen'
import JobsScreen from './screens/JobsScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import SettingsScreen from './screens/SettingsScreen'

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [currentScreen, setCurrentScreen] = useState(1)
  const [showLogin, setShowLogin] = useState(false)
  const [showPhoneLogin, setShowPhoneLogin] = useState(false)
  const [showHome, setShowHome] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

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
    // Navigate to home screen after successful login
    console.log('Login successful! Navigating to home screen...')
    setShowPhoneLogin(false)
    setShowLogin(false)
    setShowHome(true)
  }

  const handleLogout = () => {
    // Go back to login screen
    setShowHome(false)
    setShowLogin(true)
    setActiveTab('home')
  }

  const handleTabPress = (tabId) => {
    setActiveTab(tabId)
  }

  if (showSplash) {
    return <SplashScreen />
  }

  if (showHome) {
    // Render different screens based on active tab
    switch (activeTab) {
      case 'home':
        return <HomeScreen onLogout={handleLogout} activeTab={activeTab} onTabPress={handleTabPress} />
      case 'network':
        return <NetworkScreen activeTab={activeTab} onTabPress={handleTabPress} />
      case 'jobs':
        return <JobsScreen activeTab={activeTab} onTabPress={handleTabPress} />
      case 'notifications':
        return <NotificationsScreen activeTab={activeTab} onTabPress={handleTabPress} />
      case 'setting':
        return <SettingsScreen activeTab={activeTab} onTabPress={handleTabPress} />
      default:
        return <HomeScreen onLogout={handleLogout} activeTab={activeTab} onTabPress={handleTabPress} />
    }
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
