import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import PhoneLoginScreen from '../screens/PhoneLoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HomeScreen from '../screens/HomeScreen';
import LeadsScreen from '../screens/LeadsScreen';
import LeadDetailsScreen from '../screens/LeadDetailsScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import CreatePropertyScreen from '../screens/CreatePropertyScreen';
import CreateLeadScreen from '../screens/CreateLeadScreen';
import ShareLeadScreen from '../screens/ShareLeadScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';
import MessageScreen from '../screens/MessageScreen';
import SearchScreen from '../screens/SearchScreen';

// Import Footer component
import Footer from '../components/Footer';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator for authenticated screens
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <Footer {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadsScreen}
        options={{ tabBarLabel: 'Leads' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen 
        name="Properties" 
        component={PropertiesScreen}
        options={{ tabBarLabel: 'Properties' }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ChatListScreen}
        options={{ tabBarLabel: 'Contacts' }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen 
          name="LeadDetails" 
          component={LeadDetailsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="PropertyDetails" 
          component={PropertyDetailsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="CreateProperty" 
          component={CreatePropertyScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="CreateLead" 
          component={CreateLeadScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ShareLead" 
          component={ShareLeadScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ChatListScreen" 
          component={ChatListScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="MessageScreen" 
          component={MessageScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="SettingsScreen" 
          component={SettingsScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
