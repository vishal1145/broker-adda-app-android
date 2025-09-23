import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const Footer = ({ state, descriptors, navigation }) => {
  const tabs = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Network', label: 'Network', icon: 'people' },
    { key: 'Jobs', label: 'Jobs', icon: 'work' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { key: 'Settings', label: 'Setting', icon: 'settings' }
  ]

  const handleTabPress = (routeName, isFocused) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderIcon = (iconName, isActive) => {
    const iconColor = isActive ? '#16BCC0' : '#9E9E9E'
    return (
      <MaterialIcons name={iconName} size={24} color={iconColor} />
    )
  }

  return (
    <View style={styles.footer}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const route = state.routes.find(route => route.name === tab.key);
          const isFocused = state.index === state.routes.findIndex(route => route.name === tab.key);
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => handleTabPress(tab.key, isFocused)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {renderIcon(tab.icon, isFocused)}
              </View>
              <Text style={[
                styles.label,
                { color: isFocused ? '#16BCC0' : '#9E9E9E' }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  iconContainer: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
})

export default Footer
