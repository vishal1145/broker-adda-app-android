import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'

const { width } = Dimensions.get('window')

const Footer = ({ state, descriptors, navigation }) => {
  const tabs = [
    { key: 'Home', label: 'Home', icon: 'Home' },
    { key: 'Network', label: 'Network', icon: 'Network' },
    { key: 'Jobs', label: 'Jobs', icon: 'Jobs' },
    { key: 'Notifications', label: 'Notifications', icon: 'Notifications' },
    { key: 'Settings', label: 'Setting', icon: 'Setting' }
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
    const iconColor = isActive ? '#2E7D32' : '#9E9E9E'
    
    switch (iconName) {
      case 'Home':
        return (
          <View style={[styles.iconShape, { borderColor: iconColor }]}>
            <View style={[styles.house, { borderColor: iconColor }]}>
              <View style={[styles.houseRoof, { borderColor: iconColor }]} />
              <View style={[styles.houseDoor, { borderColor: iconColor }]} />
            </View>
          </View>
        )
      case 'Network':
        return (
          <View style={[styles.iconShape, { borderColor: iconColor }]}>
            <View style={styles.networkIcon}>
              <View style={[styles.person, { borderColor: iconColor }]} />
              <View style={[styles.person, styles.person2, { borderColor: iconColor }]} />
              <View style={[styles.person, styles.person3, { borderColor: iconColor }]} />
              <View style={[styles.person, styles.person4, { borderColor: iconColor }]} />
            </View>
          </View>
        )
      case 'Jobs':
        return (
          <View style={[styles.iconShape, { borderColor: iconColor }]}>
            <View style={[styles.briefcase, { borderColor: iconColor }]}>
              <View style={[styles.briefcaseHandle, { borderColor: iconColor }]} />
              <View style={[styles.briefcaseClasp, { borderColor: iconColor }]} />
            </View>
          </View>
        )
      case 'Notifications':
        return (
          <View style={[styles.iconShape, { borderColor: iconColor }]}>
            <View style={[styles.bell, { borderColor: iconColor }]}>
              <View style={[styles.bellTop, { borderColor: iconColor }]} />
              <View style={[styles.bellBottom, { borderColor: iconColor }]} />
            </View>
          </View>
        )
      case 'Setting':
        return (
          <View style={[styles.iconShape, { borderColor: iconColor }]}>
            <View style={[styles.gear, { borderColor: iconColor }]}>
              <View style={[styles.gearCenter, { borderColor: iconColor }]} />
              <View style={[styles.gearTooth, { borderColor: iconColor }]} />
              <View style={[styles.gearTooth, styles.gearTooth2, { borderColor: iconColor }]} />
              <View style={[styles.gearTooth, styles.gearTooth3, { borderColor: iconColor }]} />
              <View style={[styles.gearTooth, styles.gearTooth4, { borderColor: iconColor }]} />
            </View>
          </View>
        )
      default:
        return null
    }
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
                { color: isFocused ? '#2E7D32' : '#9E9E9E' }
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
  iconShape: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Home icon styles
  house: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderStyle: 'solid',
    position: 'relative',
  },
  houseRoof: {
    position: 'absolute',
    top: -6,
    left: -2,
    width: 20,
    height: 8,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    borderStyle: 'solid',
    borderBottomWidth: 0,
    transform: [{ rotate: '45deg' }],
  },
  houseDoor: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 4,
    height: 6,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderTopWidth: 0,
  },
  // Network icon styles
  networkIcon: {
    width: 20,
    height: 16,
    position: 'relative',
  },
  person: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderStyle: 'solid',
    position: 'absolute',
  },
  person2: {
    bottom: 0,
    left: 7,
  },
  person3: {
    top: 5,
    left: 7,
  },
  person4: {
    top: 2,
    left: 2,
  },
  // Jobs icon styles
  briefcase: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderStyle: 'solid',
    position: 'relative',
  },
  briefcaseHandle: {
    position: 'absolute',
    top: -4,
    left: 2,
    width: 12,
    height: 4,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderBottomWidth: 0,
    borderRadius: 2,
  },
  briefcaseClasp: {
    position: 'absolute',
    top: 2,
    left: 6,
    width: 4,
    height: 2,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderTopWidth: 0,
  },
  // Notifications icon styles
  bell: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  bellTop: {
    position: 'absolute',
    top: 2,
    left: 6,
    width: 4,
    height: 6,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderBottomWidth: 0,
    borderRadius: 2,
  },
  bellBottom: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderRadius: 4,
  },
  // Setting icon styles
  gear: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  gearCenter: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 4,
    height: 4,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderRadius: 2,
  },
  gearTooth: {
    position: 'absolute',
    top: 2,
    left: 6,
    width: 4,
    height: 2,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderBottomWidth: 0,
  },
  gearTooth2: {
    top: 6,
    left: 2,
    width: 2,
    height: 4,
    borderBottomWidth: 1.5,
    borderRightWidth: 0,
  },
  gearTooth3: {
    top: 6,
    left: 12,
    width: 2,
    height: 4,
    borderBottomWidth: 1.5,
    borderLeftWidth: 0,
  },
  gearTooth4: {
    top: 10,
    left: 6,
    width: 4,
    height: 2,
    borderTopWidth: 0,
  },
})

export default Footer
