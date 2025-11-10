import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Dimensions } from 'react-native'

const { width } = Dimensions.get('window')

// Shimmer animation hook
const useShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    shimmer.start()
    return () => shimmer.stop()
  }, [])

  return shimmerAnim
}

// Skeleton Box Component
const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
  const shimmerAnim = useShimmer()

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      style={[
        {
          width: width || '100%',
          height: height || 20,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  )
}

// Content Loader Components for different screen types

// Home Screen Loader
export const HomeScreenLoader = () => (
  <View style={styles.container}>
    {/* Stats Cards */}
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={60} height={24} style={{ marginTop: 12 }} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={60} height={24} style={{ marginTop: 12 }} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={[styles.statCard, styles.statCardFullWidth, { backgroundColor: '#E5E7EB', marginTop: 12 }]}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={60} height={24} style={{ marginTop: 12 }} />
        <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
      </View>
    </View>

    {/* Chart Cards */}
    <View style={styles.section}>
      <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />
      <View style={[styles.chartCard, { backgroundColor: '#E5E7EB' }]}>
        <SkeletonBox width="100%" height={200} borderRadius={12} />
      </View>
    </View>

    {/* Recent Leads */}
    <View style={styles.section}>
      <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />
      <View style={styles.horizontalScroll}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.leadCard, { backgroundColor: '#E5E7EB' }]}>
            <SkeletonBox width="100%" height={120} borderRadius={8} />
            <SkeletonBox width="80%" height={16} style={{ marginTop: 12 }} />
            <SkeletonBox width="60%" height={14} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    </View>
  </View>
)

// Leads Screen Loader
export const LeadsScreenLoader = () => (
  <View style={styles.container}>
    {/* Stats Cards */}
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={60} height={24} style={{ marginTop: 12 }} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={60} height={24} style={{ marginTop: 12 }} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={[styles.statCard, styles.statCardFullWidth, { backgroundColor: '#E5E7EB', marginTop: 12 }]}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={60} height={24} style={{ marginTop: 12 }} />
        <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
      </View>
    </View>

    {/* Search Bar */}
    <View style={styles.searchContainer}>
      <SkeletonBox width="100%" height={48} borderRadius={12} />
    </View>

    {/* Filter Section */}
    <View style={styles.filterSection}>
      <SkeletonBox width="100%" height={48} borderRadius={12} style={{ marginBottom: 12 }} />
      <SkeletonBox width="100%" height={48} borderRadius={12} />
    </View>

    {/* Lead Cards */}
    <View style={styles.leadsSection}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.leadCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.leadHeader}>
            <SkeletonBox width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonBox width="70%" height={18} style={{ marginBottom: 8 }} />
              <SkeletonBox width="50%" height={14} />
            </View>
            <SkeletonBox width={60} height={24} borderRadius={12} />
          </View>
          <View style={styles.leadDetailsGrid}>
            <View style={styles.detailRow}>
              <SkeletonBox width="90%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonBox width="70%" height={16} />
            </View>
            <View style={styles.detailRow}>
              <SkeletonBox width="90%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonBox width="70%" height={16} />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
)

// Properties Screen Loader
export const PropertiesScreenLoader = () => (
  <View style={styles.container}>
    {/* Filter Section */}
    <View style={styles.filterSection}>
      <SkeletonBox width="100%" height={48} borderRadius={12} />
    </View>

    {/* Property Cards */}
    <View style={styles.propertiesSection}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.propertyCard, { backgroundColor: '#E5E7EB' }]}>
          <SkeletonBox width="100%" height={200} borderRadius={12} />
          <View style={{ padding: 16 }}>
            <SkeletonBox width="80%" height={20} style={{ marginBottom: 8 }} />
            <SkeletonBox width="60%" height={16} style={{ marginBottom: 12 }} />
            <SkeletonBox width="50%" height={18} style={{ marginBottom: 12 }} />
            <View style={styles.propertyFeatures}>
              <SkeletonBox width={60} height={16} />
              <SkeletonBox width={60} height={16} />
              <SkeletonBox width={60} height={16} />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
)

// Chat List Screen Loader
export const ChatListScreenLoader = () => (
  <View style={styles.container}>
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={[styles.chatItem, { backgroundColor: '#E5E7EB' }]}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonBox width="60%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonBox width="80%" height={14} />
        </View>
        <SkeletonBox width={50} height={14} />
      </View>
    ))}
  </View>
)

// Message Screen Loader
export const MessageScreenLoader = () => (
  <View style={styles.container}>
    {[1, 2, 3, 4, 5].map((i) => (
      <View
        key={i}
        style={[
          styles.messageBubble,
          { backgroundColor: '#E5E7EB', alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start' },
        ]}
      >
        <SkeletonBox width={200} height={60} borderRadius={16} />
      </View>
    ))}
  </View>
)

// Profile Screen Loader
export const ProfileScreenLoader = () => (
  <View style={styles.container}>
    {/* Profile Header */}
    <View style={styles.profileHeader}>
      <SkeletonBox width={120} height={120} borderRadius={60} />
      <SkeletonBox width={150} height={24} style={{ marginTop: 16 }} />
      <SkeletonBox width={100} height={16} style={{ marginTop: 8 }} />
    </View>

    {/* Stats */}
    <View style={styles.statsGrid}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={60} height={20} style={{ marginTop: 12 }} />
          <SkeletonBox width={40} height={16} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>

    {/* Info Sections */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.infoSection}>
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 12 }} />
        <SkeletonBox width="90%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonBox width="80%" height={14} />
      </View>
    ))}
  </View>
)

// Generic List Loader
export const ListLoader = ({ count = 3 }) => (
  <View style={styles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.listItem, { backgroundColor: '#E5E7EB' }]}>
        <SkeletonBox width={50} height={50} borderRadius={25} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonBox width="70%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonBox width="50%" height={14} />
        </View>
      </View>
    ))}
  </View>
)

// Generic Card Loader
export const CardLoader = ({ count = 3 }) => (
  <View style={styles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.card, { backgroundColor: '#E5E7EB' }]}>
        <SkeletonBox width="100%" height={150} borderRadius={12} />
        <View style={{ padding: 16 }}>
          <SkeletonBox width="80%" height={20} style={{ marginBottom: 8 }} />
          <SkeletonBox width="60%" height={16} />
        </View>
      </View>
    ))}
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 88,
  },
  statCardFullWidth: {
    width: width - 40,
  },
  section: {
    marginBottom: 30,
  },
  chartCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  leadCard: {
    width: width - 80,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  searchContainer: {
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  leadsSection: {
    marginBottom: 30,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailRow: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  propertiesSection: {
    marginBottom: 30,
  },
  propertyCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  propertyFeatures: {
    flexDirection: 'row',
    gap: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  messageBubble: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
})

export default {
  HomeScreenLoader,
  LeadsScreenLoader,
  PropertiesScreenLoader,
  ChatListScreenLoader,
  MessageScreenLoader,
  ProfileScreenLoader,
  ListLoader,
  CardLoader,
}
