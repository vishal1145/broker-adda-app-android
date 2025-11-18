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
    {/* Dashboard Cards - 2x2 Grid */}
    <View style={styles.statsSection}>
      <View style={[styles.statsGrid, styles.statsGridFirstRow]}>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <View style={styles.statBottomRow}>
              <SkeletonBox width={80} height={14} />
              <View style={styles.statChangeContainer}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width={30} height={11} />
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <View style={styles.statBottomRow}>
              <SkeletonBox width={80} height={14} />
              <View style={styles.statChangeContainer}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width={30} height={11} />
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <View style={styles.statBottomRow}>
              <SkeletonBox width={80} height={14} />
              <View style={styles.statChangeContainer}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width={30} height={11} />
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <View style={styles.statBottomRow}>
              <SkeletonBox width={80} height={14} />
              <View style={styles.statChangeContainer}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width={30} height={11} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>

    {/* Lead Performance Overview Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={200} height={18} />
      </View>
      
      {/* Leads by Month Chart */}
      <View style={[styles.chartCardContainer, { marginTop: 0 }]}>
        <SkeletonBox width={150} height={16} style={{ marginBottom: 20 }} />
        <SkeletonBox width="100%" height={220} borderRadius={12} />
        <View style={styles.barChartLegend}>
          <View style={styles.barChartLegendItem}>
            <SkeletonBox width={12} height={12} borderRadius={2} />
            <SkeletonBox width={80} height={12} style={{ marginLeft: 8 }} />
          </View>
          <View style={styles.barChartLegendItem}>
            <SkeletonBox width={12} height={12} borderRadius={2} />
            <SkeletonBox width={80} height={12} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>

      {/* Properties by Month Chart */}
      <View style={styles.chartCardContainer}>
        <SkeletonBox width={150} height={16} style={{ marginBottom: 20 }} />
        <SkeletonBox width="100%" height={200} borderRadius={12} />
      </View>
    </View>

    {/* Recent Leads Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={120} height={18} />
        <SkeletonBox width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.horizontalScroll}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.recentLeadCard, { backgroundColor: '#E5E7EB' }]}>
            <View style={styles.recentLeadHeader}>
              <View style={styles.recentLeadHeaderLeft}>
                <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
                <View style={styles.recentLeadTags}>
                  <SkeletonBox width={50} height={20} borderRadius={12} />
                  <SkeletonBox width={60} height={20} borderRadius={12} style={{ marginLeft: 8 }} />
                </View>
              </View>
              <View style={styles.recentLeadTime}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width={40} height={12} style={{ marginLeft: 4 }} />
              </View>
            </View>
            <View style={styles.recentLeadDivider} />
            <View style={styles.recentLeadDetails}>
              <View style={styles.recentLeadDetailItem}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width="80%" height={13} style={{ marginLeft: 8 }} />
              </View>
              <View style={styles.recentLeadDetailItem}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width="80%" height={13} style={{ marginLeft: 8 }} />
              </View>
              <View style={styles.recentLeadDetailItem}>
                <SkeletonBox width={14} height={14} borderRadius={0} />
                <SkeletonBox width="80%" height={13} style={{ marginLeft: 8 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* Recent Properties Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={150} height={18} />
        <SkeletonBox width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.horizontalScroll}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.recentPropertyCard, { backgroundColor: '#E5E7EB' }]}>
            <View style={styles.recentCardContentWrapper}>
              <View style={styles.recentCardTopSection}>
                <SkeletonBox width={130} height={130} borderRadius={8} />
                <View style={styles.recentPropertyContent}>
                  <View style={styles.recentTitleRow}>
                    <SkeletonBox width={16} height={16} borderRadius={0} />
                    <SkeletonBox width="70%" height={16} style={{ marginLeft: 6 }} />
                  </View>
                  <View style={styles.recentAddressRow}>
                    <SkeletonBox width={14} height={14} borderRadius={0} />
                    <SkeletonBox width="80%" height={13} style={{ marginLeft: 4 }} />
                  </View>
                  <SkeletonBox width={100} height={16} style={{ marginTop: 8 }} />
                  <View style={styles.recentStatusRow}>
                    <SkeletonBox width={50} height={14} />
                    <SkeletonBox width={60} height={20} borderRadius={10} />
                  </View>
                </View>
              </View>
              <View style={styles.recentDivider} />
              <View style={styles.recentPropertyFeatures}>
                <View style={styles.recentFeatureItem}>
                  <SkeletonBox width={18} height={18} borderRadius={0} />
                  <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
                </View>
                <View style={styles.recentFeatureItem}>
                  <SkeletonBox width={18} height={18} borderRadius={0} />
                  <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
                </View>
                <View style={styles.recentFeatureItem}>
                  <SkeletonBox width={18} height={18} borderRadius={0} />
                  <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
                </View>
                <View style={styles.recentFeatureItem}>
                  <SkeletonBox width={18} height={18} borderRadius={0} />
                  <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* Recent Activity Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={130} height={18} />
        <SkeletonBox width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.recentActivityCard}>
        {[1, 2, 3].map((i, index, array) => (
          <View key={i}>
            <View style={styles.recentActivityItem}>
              <SkeletonBox width={36} height={36} borderRadius={18} />
              <View style={styles.recentActivityContent}>
                <SkeletonBox width="80%" height={16} style={{ marginBottom: 4 }} />
                <SkeletonBox width="50%" height={13} />
              </View>
            </View>
            {index !== array.length - 1 && <View style={styles.recentActivityDivider} />}
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
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={100} height={14} />
          </View>
        </View>
      </View>
      <View style={styles.shareByMeCardContainer}>
        <View style={[styles.statCard, styles.statCardFullWidth, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
      </View>
    </View>

    {/* Search Bar */}
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <SkeletonBox width={20} height={20} borderRadius={0} />
        <SkeletonBox width="70%" height={16} style={{ marginLeft: 12 }} />
        <SkeletonBox width={20} height={20} borderRadius={0} style={{ marginLeft: 8 }} />
      </View>
    </View>

    {/* Filter Section */}
    <View style={styles.filterSection}>
      <View style={styles.dropdownContainerFullWidth}>
        <View style={styles.dropdownButton}>
          <SkeletonBox width={100} height={14} />
          <SkeletonBox width={24} height={24} borderRadius={0} />
        </View>
      </View>
      <View style={styles.filterButtonRow}>
        <View style={styles.advancedFilterButtonFullWidth}>
          <SkeletonBox width={18} height={18} borderRadius={0} />
          <SkeletonBox width={60} height={14} style={{ marginLeft: 6 }} />
        </View>
      </View>
    </View>

    {/* Leads Section */}
    <View style={styles.leadsSection}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={80} height={18} />
        <View style={styles.toggleContainer}>
          <SkeletonBox width={30} height={12} />
          <SkeletonBox width={44} height={22} borderRadius={11} />
          <SkeletonBox width={80} height={12} />
        </View>
      </View>
      
      {/* Add Lead Button */}
      <View style={styles.addLeadButtonContainer}>
        <View style={styles.addLeadButtonPlaceholder}>
          <SkeletonBox width={32} height={32} borderRadius={0} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Lead Cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.leadCard, { backgroundColor: '#E5E7EB' }]}>
          {/* Header Section */}
          <View style={styles.leadHeader}>
            <View style={styles.leadAvatarContainer}>
              <SkeletonBox width={40} height={40} borderRadius={20} />
            </View>
            <View style={styles.leadInfo}>
              <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonBox width="50%" height={14} />
            </View>
            <SkeletonBox width={60} height={24} borderRadius={10} />
          </View>

          {/* Lead Details Grid */}
          <View style={styles.leadDetailsGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <SkeletonBox width={20} height={20} borderRadius={0} />
                <View style={styles.detailContent}>
                  <SkeletonBox width={80} height={12} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="90%" height={16} />
                </View>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <SkeletonBox width={20} height={20} borderRadius={0} />
                <View style={styles.detailContent}>
                  <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="90%" height={16} />
                </View>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <SkeletonBox width={20} height={20} borderRadius={0} />
                <View style={styles.detailContent}>
                  <SkeletonBox width={60} height={12} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="90%" height={16} />
                </View>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <SkeletonBox width={20} height={20} borderRadius={0} />
                <View style={styles.detailContent}>
                  <SkeletonBox width={80} height={12} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="90%" height={16} />
                </View>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={styles.sharedWithSection}>
              <SkeletonBox width={80} height={12} style={{ marginBottom: 8 }} />
              <View style={styles.sharedAvatars}>
                <SkeletonBox width={32} height={32} borderRadius={16} />
                <SkeletonBox width={32} height={32} borderRadius={16} style={{ marginLeft: -8 }} />
                <SkeletonBox width={32} height={32} borderRadius={16} style={{ marginLeft: -8 }} />
              </View>
            </View>
            <View style={styles.actionButtons}>
              <SkeletonBox width={18} height={18} borderRadius={0} />
              <SkeletonBox width={18} height={18} borderRadius={0} style={{ marginLeft: 16 }} />
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
    {/* Stats Overview */}
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        {/* Total Properties - Green */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={100} height={14} />
          </View>
    </View>

        {/* Approved - Blue */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
        
        {/* Pending - Yellow */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
        
        {/* Rejected - Red */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
      </View>
    </View>

    {/* Properties List */}
    <View style={styles.propertiesSection}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={150} height={18} />
      </View>
      
      {/* Add Property Button */}
      <View style={styles.addPropertyButtonContainer}>
        <View style={styles.addPropertyButtonPlaceholder}>
          <SkeletonBox width={32} height={32} borderRadius={0} />
          <SkeletonBox width={80} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      
      {/* Property Cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.propertyCard}>
          <View style={styles.cardContentWrapper}>
            <View style={styles.cardTopSection}>
              {/* Property Image - Left Side */}
              <View style={styles.propertyImageContainer}>
                <SkeletonBox width={130} height={130} borderRadius={8} />
                {/* Property Type Badge */}
                <View style={[styles.propertyTypeBadge, { backgroundColor: 'transparent' }]}>
                  <SkeletonBox width={40} height={16} borderRadius={4} />
                </View>
              </View>

              {/* Property Content - Right Side */}
              <View style={styles.propertyContent}>
                {/* Title with Icon */}
                <View style={styles.titleRow}>
                  <SkeletonBox width={16} height={16} borderRadius={0} />
                  <SkeletonBox width="70%" height={16} style={{ marginLeft: 6 }} />
                </View>
                
                {/* Address with Icon */}
                <View style={styles.addressRow}>
                  <SkeletonBox width={14} height={14} borderRadius={0} />
                  <SkeletonBox width="80%" height={13} style={{ marginLeft: 4 }} />
                </View>
                
                {/* Price */}
                <SkeletonBox width={100} height={16} style={{ marginBottom: 8 }} />
                
                {/* Status Row */}
                <View style={styles.statusRow}>
                  <SkeletonBox width={50} height={14} />
                  <SkeletonBox width={60} height={20} borderRadius={10} />
                </View>
              </View>
            </View>
            
            {/* Divider - Full Width */}
            <View style={styles.divider} />
            
            {/* Features Below - Starting from Image Position */}
            <View style={styles.propertyFeatures}>
              <View style={styles.featureItem}>
                <SkeletonBox width={18} height={18} borderRadius={0} />
                <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
            </View>
              
              <View style={styles.featureItem}>
                <SkeletonBox width={18} height={18} borderRadius={0} />
                <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
              </View>
              
              <View style={styles.featureItem}>
                <SkeletonBox width={18} height={18} borderRadius={0} />
                <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
              </View>
              
              <View style={styles.featureItem}>
                <SkeletonBox width={18} height={18} borderRadius={0} />
                <SkeletonBox width={50} height={11} style={{ marginLeft: 4 }} />
              </View>
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
      <View key={i} style={styles.chatItem}>
        {/* Avatar Container */}
        <View style={styles.avatarContainer}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
          {/* Status Indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: '#E5E7EB' }]} />
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          {/* Chat Header with Name */}
          <View style={styles.chatHeader}>
            <SkeletonBox width="60%" height={16} />
          </View>

          {/* Firm Name */}
          <SkeletonBox width="50%" height={13} style={{ marginBottom: 4 }} />

          {/* Last Message */}
          <SkeletonBox width="80%" height={13} />
        </View>

        {/* Right Side - Time and Unread Badge */}
        <View style={{ flexDirection: 'column' }}>
          <SkeletonBox width={50} height={12} />
          {/* Show unread badge for some items */}
          {i % 3 === 0 && (
            <SkeletonBox width={20} height={20} borderRadius={10} style={{ marginTop: 8 }} />
          )}
        </View>
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
    {/* Specializations Section */}
    <View style={styles.section}>
      <SkeletonBox width={150} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.tagsContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.tag}>
            <SkeletonBox width={80} height={32} borderRadius={20} />
          </View>
        ))}
      </View>
    </View>

    {/* Regions Section */}
    <View style={styles.section}>
      <SkeletonBox width={100} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.tagsContainer}>
      {[1, 2, 3].map((i) => (
          <View key={i} style={styles.tag}>
            <SkeletonBox width={90} height={32} borderRadius={20} />
        </View>
      ))}
      </View>
    </View>

    {/* Contact Information Section */}
    <View style={styles.section}>
      <SkeletonBox width={180} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.infoContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.infoRow, i === 5 && styles.infoRowLast]}>
            <View style={styles.infoIconWrapper}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
            </View>
            <View style={styles.infoContent}>
              <SkeletonBox width={80} height={12} style={{ marginBottom: 6 }} />
              <View style={styles.valueWithIcon}>
                <SkeletonBox width="70%" height={16} />
                {i === 1 || i === 3 ? (
                  <SkeletonBox width={16} height={16} borderRadius={0} style={{ marginLeft: 8 }} />
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>

    {/* Social Media Section */}
    <View style={styles.section}>
      <SkeletonBox width={140} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.socialMediaContainer}>
        <View style={styles.socialMediaIconsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.socialMediaIconButton}>
              <SkeletonBox width={28} height={28} borderRadius={0} />
            </View>
          ))}
        </View>
      </View>
    </View>

    {/* Documents Section */}
    <View style={styles.section}>
      <SkeletonBox width={120} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.documentsGrid}>
    {[1, 2, 3].map((i) => (
          <View key={i} style={styles.documentCardWrapper}>
            <SkeletonBox width={200} height={14} style={{ marginBottom: 8 }} />
            <View style={styles.documentCard}>
              <SkeletonBox width="100%" height={120} borderRadius={12} />
            </View>
      </View>
    ))}
      </View>
    </View>

    {/* Action Section */}
    <View style={styles.actionSection}>
      <View style={styles.logoutButton}>
        <SkeletonBox width={20} height={20} borderRadius={0} />
        <SkeletonBox width={60} height={16} style={{ marginLeft: 8 }} />
      </View>
    </View>
  </View>
)

// Settings Screen Loader
export const SettingsScreenLoader = () => (
  <View style={styles.container}>
    {/* Settings Sections */}
    <View style={styles.settingsContainer}>
      {/* Account Section */}
      <View style={styles.section}>
        <SkeletonBox width={100} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.sectionContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.settingItemCard}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <SkeletonBox width={22} height={22} borderRadius={0} />
                </View>
                <View style={styles.settingInfo}>
                  <SkeletonBox width="60%" height={16} style={{ marginBottom: 2 }} />
                  {i === 1 && <SkeletonBox width="80%" height={13} />}
                </View>
              </View>
              <View style={styles.settingRight}>
                {i === 3 ? null : <SkeletonBox width={22} height={22} borderRadius={0} />}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <SkeletonBox width={140} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.sectionContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.settingItemCard}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <SkeletonBox width={22} height={22} borderRadius={0} />
                </View>
                <View style={styles.settingInfo}>
                  <SkeletonBox width="70%" height={16} />
                </View>
              </View>
              <View style={styles.settingRight}>
                <SkeletonBox width={50} height={30} borderRadius={15} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <SkeletonBox width={180} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.sectionContent}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.settingItemCard}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <SkeletonBox width={22} height={22} borderRadius={0} />
                </View>
                <View style={styles.settingInfo}>
                  <SkeletonBox width="65%" height={16} />
                </View>
              </View>
              <View style={styles.settingRight}>
                <SkeletonBox width={22} height={22} borderRadius={0} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <SkeletonBox width={100} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.sectionContent}>
          <View style={styles.settingItemCard}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <SkeletonBox width={22} height={22} borderRadius={0} />
              </View>
              <View style={styles.settingInfo}>
                <SkeletonBox width="60%" height={16} style={{ marginBottom: 2 }} />
                <SkeletonBox width="90%" height={13} />
              </View>
            </View>
            <View style={styles.settingRight}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
            </View>
          </View>
        </View>
      </View>

      {/* Version Card */}
      <View style={styles.versionCard}>
        <View style={styles.versionInfo}>
          <View style={styles.versionIconWrap}>
            <SkeletonBox width={18} height={18} borderRadius={0} />
          </View>
          <View style={styles.versionTextWrap}>
            <SkeletonBox width={120} height={16} />
          </View>
        </View>
        <View style={styles.versionIndentedContent}>
          <SkeletonBox width="90%" height={13} style={{ marginTop: 2 }} />
          <SkeletonBox width={120} height={36} borderRadius={8} style={{ marginTop: 12 }} />
        </View>
      </View>
    </View>
  </View>
)

// Notifications Screen Loader
export const NotificationsScreenLoader = () => (
  <View style={styles.container}>
    {/* Stats Overview - four cards */}
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        {/* Lead Updates */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={120} height={14} />
          </View>
        </View>

        {/* Property Updates */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={140} height={14} />
          </View>
        </View>

        {/* Approval Updates */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={140} height={14} />
          </View>
        </View>

        {/* Transfer Updates */}
        <View style={[styles.statCard, { backgroundColor: '#E5E7EB' }]}>
          <View style={styles.statCardContent}>
            <View style={styles.statTopRow}>
              <SkeletonBox width={22} height={22} borderRadius={0} />
              <SkeletonBox width={50} height={22} />
            </View>
            <SkeletonBox width={140} height={14} />
          </View>
        </View>
      </View>
    </View>

    {/* Filter Section */}
    <View style={styles.filterSection}>
      <View style={styles.dropdownContainerFullWidth}>
        <View style={styles.dropdownButton}>
          <SkeletonBox width={150} height={14} />
          <SkeletonBox width={24} height={24} borderRadius={0} />
        </View>
      </View>
    </View>

    {/* Notifications Section */}
    <View style={styles.notificationsSection}>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={120} height={18} />
        <View style={styles.countContainer}>
          <SkeletonBox width={20} height={14} />
          <SkeletonBox width={10} height={14} style={{ marginLeft: 4 }} />
          <SkeletonBox width={60} height={14} style={{ marginLeft: 4 }} />
        </View>
      </View>
      
      {/* Notification Cards */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.notificationCard}>
          {/* Header with Icon and Info */}
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIcon}>
              <SkeletonBox width={18} height={18} borderRadius={0} />
            </View>
            <View style={styles.notificationInfo}>
              <SkeletonBox width="70%" height={16} style={{ marginBottom: 2 }} />
              <SkeletonBox width={60} height={13} />
            </View>
          </View>

          {/* Description - can be multiple lines */}
          {i % 3 === 0 ? (
            <>
              <SkeletonBox width="95%" height={13} style={{ marginBottom: 4 }} />
              <SkeletonBox width="80%" height={13} style={{ marginBottom: 10 }} />
            </>
          ) : (
            <SkeletonBox width="95%" height={13} style={{ marginBottom: 10 }} />
          )}

          {/* Footer Divider */}
          <View style={styles.footerDivider} />

          {/* Footer with Type Badge */}
          <View style={styles.notificationFooter}>
            <View style={styles.typeBadge}>
              <SkeletonBox width={60} height={11} />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
)

// Lead Details Screen Loader
export const LeadDetailsScreenLoader = () => (
  <View style={styles.container}>
    {/* Lead Information Card */}
    <View style={styles.leadDetailsCard}>
      <View style={styles.leadDetailsCardHeader}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={styles.leadDetailsCardContent}>
          <SkeletonBox width={150} height={16} style={{ marginBottom: 2 }} />
          <SkeletonBox width={200} height={14} style={{ marginBottom: 2 }} />
          <SkeletonBox width={120} height={14} />
        </View>
        <SkeletonBox width={70} height={22} borderRadius={10} />
      </View>

      {/* Details Grid */}
      <View style={styles.leadDetailsGrid}>
        <View style={styles.leadDetailsGridItem}>
          <View style={styles.leadDetailsDetailItem}>
            <SkeletonBox width={20} height={20} borderRadius={0} />
            <View style={styles.leadDetailsDetailContent}>
              <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox width={120} height={16} />
            </View>
          </View>
        </View>
        <View style={styles.leadDetailsGridItem}>
          <View style={styles.leadDetailsDetailItem}>
            <SkeletonBox width={20} height={20} borderRadius={0} />
            <View style={styles.leadDetailsDetailContent}>
              <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox width={120} height={16} />
            </View>
          </View>
        </View>
        <View style={styles.leadDetailsGridItem}>
          <View style={styles.leadDetailsDetailItem}>
            <SkeletonBox width={20} height={20} borderRadius={0} />
            <View style={styles.leadDetailsDetailContent}>
              <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox width={120} height={16} />
            </View>
          </View>
        </View>
        <View style={styles.leadDetailsGridItem}>
          <View style={styles.leadDetailsDetailItem}>
            <SkeletonBox width={20} height={20} borderRadius={0} />
            <View style={styles.leadDetailsDetailContent}>
              <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox width={120} height={16} />
            </View>
          </View>
        </View>
      </View>
    </View>

    {/* Created By Section */}
    <View style={styles.leadDetailsSection}>
      <SkeletonBox width={120} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.leadDetailsCreatedByCard}>
        <View style={styles.leadDetailsCreatedByHeader}>
          <SkeletonBox width={52} height={52} borderRadius={26} />
          <View style={styles.leadDetailsCreatedByInfo}>
            <SkeletonBox width={150} height={16} style={{ marginBottom: 2 }} />
            <SkeletonBox width={120} height={14} style={{ marginBottom: 2 }} />
            <SkeletonBox width={180} height={14} style={{ marginBottom: 2 }} />
            <SkeletonBox width={100} height={14} />
          </View>
        </View>
      </View>
    </View>

    {/* Timeline Section */}
    <View style={styles.leadDetailsSection}>
      <SkeletonBox width={100} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.leadDetailsTimelineCard}>
        <View style={styles.leadDetailsTimelineItem}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={styles.leadDetailsTimelineContent}>
            <SkeletonBox width={120} height={16} style={{ marginBottom: 2 }} />
            <SkeletonBox width={100} height={14} />
          </View>
        </View>
        <View style={styles.leadDetailsTimelineItem}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={styles.leadDetailsTimelineContent}>
            <SkeletonBox width={120} height={16} style={{ marginBottom: 2 }} />
            <SkeletonBox width={100} height={14} />
          </View>
        </View>
      </View>
    </View>

    {/* Share History Section */}
    <View style={styles.leadDetailsSection}>
      <SkeletonBox width={140} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.leadDetailsShareHistoryCard}>
        <View style={styles.leadDetailsShareHistoryItem}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={styles.leadDetailsShareHistoryInfo}>
            <SkeletonBox width={200} height={16} style={{ marginBottom: 2 }} />
            <SkeletonBox width={180} height={14} />
          </View>
        </View>
      </View>
    </View>
  </View>
)

// Property Details Screen Loader
export const PropertyDetailsScreenLoader = () => (
  <View style={styles.container}>
    {/* Image Section */}
    <View style={styles.propertyDetailsImageSection}>
      <SkeletonBox width="100%" height={300} borderRadius={12} />
      {/* Thumbnails */}
      <View style={styles.propertyDetailsThumbnailContainer}>
        <View style={styles.propertyDetailsThumbnailScroll}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width={100} height={100} borderRadius={8} style={{ marginRight: 12 }} />
          ))}
        </View>
      </View>
    </View>

    {/* Property Details Card */}
    <View style={styles.propertyDetailsContentSection}>
      <SkeletonBox width={140} height={18} style={{ marginBottom: 12 }} />
      <View style={styles.propertyDetailsCard}>
        <View style={styles.propertyDetailsCardHeader}>
          <SkeletonBox width="80%" height={20} style={{ marginBottom: 8 }} />
          <View style={styles.propertyDetailsAddressRow}>
            <SkeletonBox width={16} height={16} borderRadius={0} />
            <SkeletonBox width="70%" height={14} style={{ marginLeft: 6 }} />
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.propertyDetailsDetailsRow}>
          <View style={styles.propertyDetailsDetailColumn}>
            <View style={styles.propertyDetailsDetailItem}>
              <SkeletonBox width={20} height={20} borderRadius={0} />
              <View style={styles.propertyDetailsDetailContent}>
                <SkeletonBox width={80} height={12} style={{ marginBottom: 6 }} />
                <SkeletonBox width={100} height={16} />
              </View>
            </View>
            <View style={styles.propertyDetailsDetailItem}>
              <SkeletonBox width={20} height={20} borderRadius={0} />
              <View style={styles.propertyDetailsDetailContent}>
                <SkeletonBox width={60} height={12} style={{ marginBottom: 6 }} />
                <SkeletonBox width={100} height={16} />
              </View>
            </View>
          </View>
          <View style={styles.propertyDetailsDetailColumn}>
            <View style={styles.propertyDetailsDetailItem}>
              <SkeletonBox width={20} height={20} borderRadius={0} />
              <View style={styles.propertyDetailsDetailContent}>
                <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
                <SkeletonBox width={100} height={16} />
              </View>
            </View>
            <View style={styles.propertyDetailsDetailItem}>
              <SkeletonBox width={20} height={20} borderRadius={0} />
              <View style={styles.propertyDetailsDetailContent}>
                <SkeletonBox width={50} height={12} style={{ marginBottom: 6 }} />
                <SkeletonBox width={100} height={16} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Property Amenities */}
      <View style={styles.propertyDetailsSection}>
        <SkeletonBox width={160} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.propertyDetailsChipsContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBox key={i} width={80} height={32} borderRadius={20} style={{ marginRight: 8, marginBottom: 8 }} />
          ))}
        </View>
      </View>

      {/* Nearby Amenities */}
      <View style={styles.propertyDetailsSection}>
        <SkeletonBox width={150} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.propertyDetailsChipsContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} width={90} height={32} borderRadius={20} style={{ marginRight: 8, marginBottom: 8 }} />
          ))}
        </View>
      </View>

      {/* Key Features */}
      <View style={styles.propertyDetailsSection}>
        <SkeletonBox width={120} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.propertyDetailsChipsContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width={100} height={32} borderRadius={20} style={{ marginRight: 8, marginBottom: 8 }} />
          ))}
        </View>
      </View>

      {/* Location Benefits */}
      <View style={styles.propertyDetailsSection}>
        <SkeletonBox width={150} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.propertyDetailsChipsContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width={110} height={32} borderRadius={20} style={{ marginRight: 8, marginBottom: 8 }} />
          ))}
        </View>
      </View>

      {/* Description/Review Tabs */}
      <View style={styles.propertyDetailsSection}>
        <View style={styles.propertyDetailsTabsContainer}>
          <SkeletonBox width="45%" height={44} borderRadius={8} />
          <SkeletonBox width="45%" height={44} borderRadius={8} />
        </View>
        <View style={styles.propertyDetailsTabContentCard}>
          <SkeletonBox width="100%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBox width="95%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBox width="90%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBox width="85%" height={14} />
        </View>
      </View>
    </View>
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
    padding: 0,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridFirstRow: {
    marginBottom: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardFullWidth: {
    width: width - 40,
  },
  statCardContent: {
    padding: 16,
    minHeight: 88,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  chartCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  barChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 20,
  },
  barChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recentLeadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  recentLeadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentLeadHeaderLeft: {
    flex: 1,
  },
  recentLeadTags: {
    flexDirection: 'row',
    gap: 8,
  },
  recentLeadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentLeadDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  recentLeadDetails: {
    gap: 10,
  },
  recentLeadDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentPropertyCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    width: width - 40,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginRight: 12,
  },
  recentCardContentWrapper: {
    padding: 12,
  },
  recentCardTopSection: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  recentPropertyContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recentAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  recentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 0,
    marginRight: 0,
  },
  recentPropertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    alignItems: 'center',
  },
  recentFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  recentActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  recentActivityContent: {
    flex: 1,
    marginLeft: 12,
  },
  recentActivityDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    marginBottom: 0,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dropdownContainerFullWidth: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  filterButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  advancedFilterButtonFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  shareByMeCardContainer: {
    marginTop: 12,
  },
  leadsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  addLeadButtonContainer: {
    marginBottom: 16,
  },
  addLeadButtonPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    width: '100%',
    minHeight: 100,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadAvatarContainer: {
    marginRight: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailRow: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sharedWithSection: {
    flex: 1,
  },
  sharedAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  propertiesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  addPropertyButtonContainer: {
    marginBottom: 16,
  },
  addPropertyButtonPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    width: '100%',
    minHeight: 100,
  },
  propertyCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardContentWrapper: {
    padding: 12,
  },
  cardTopSection: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  propertyImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  propertyTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0D542BFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  propertyContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 0,
    marginRight: 0,
  },
  propertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingLeft: 0,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  // Settings Screen Styles
  settingsContainer: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    // container now holds individual card rows
  },
  settingItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingInfo: {
    flex: 1,
  },
  settingRight: {
    marginLeft: 12,
  },
  versionCard: {
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  versionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 2,
  },
  versionTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  versionIndentedContent: {
    // Align block with the title start
  },
  // Profile Screen Styles
  modernHeaderContainer: {
    marginBottom: 20,
  },
  modernHeaderGradient: {
    backgroundColor: '#E5E7EB',
    paddingBottom: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  modernHeaderContent: {
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 2,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  modernEditButton: {
    position: 'absolute',
    right: 24,
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  modernProfileSection: {
    alignItems: 'center',
    paddingTop: 12,
  },
  modernProfileImageContainer: {
    position: 'relative',
    marginBottom: 16,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
    alignSelf: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  profileStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 16,
  },
  headerAdditionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  headerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0,
  },
  infoContainer: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialMediaContainer: {
    marginTop: 8,
  },
  socialMediaIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  socialMediaIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsGrid: {
    flexDirection: 'column',
  },
  documentCardWrapper: {
    marginBottom: 20,
  },
  documentCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    minHeight: 120,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    justifyContent: 'center',
  },
  // Notifications Screen Styles
  notificationsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  typeBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Lead Details Screen Styles
  leadDetailsHeader: {
    backgroundColor: '#E5E7EB',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  leadDetailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadDetailsHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  leadDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadDetailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadDetailsCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  leadDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  leadDetailsGridItem: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  leadDetailsDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leadDetailsDetailContent: {
    flex: 1,
    marginLeft: 12,
  },
  leadDetailsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  leadDetailsCreatedByCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadDetailsCreatedByHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadDetailsCreatedByInfo: {
    flex: 1,
    marginLeft: 16,
  },
  leadDetailsTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadDetailsTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadDetailsTimelineContent: {
    flex: 1,
    marginLeft: 16,
  },
  leadDetailsShareHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadDetailsShareHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  leadDetailsShareHistoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  // Property Details Screen Styles
  propertyDetailsHeader: {
    backgroundColor: '#E5E7EB',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  propertyDetailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyDetailsHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  propertyDetailsImageSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  propertyDetailsThumbnailContainer: {
    paddingVertical: 12,
  },
  propertyDetailsThumbnailScroll: {
    flexDirection: 'row',
  },
  propertyDetailsContentSection: {
    padding: 20,
  },
  propertyDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  propertyDetailsCardHeader: {
    marginBottom: 20,
  },
  propertyDetailsAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  propertyDetailsDetailsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  propertyDetailsDetailColumn: {
    flex: 1,
    gap: 20,
  },
  propertyDetailsDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyDetailsDetailContent: {
    flex: 1,
    marginLeft: 12,
  },
  propertyDetailsSection: {
    marginBottom: 24,
  },
  propertyDetailsChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  propertyDetailsTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  propertyDetailsTabContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
})

export default {
  HomeScreenLoader,
  LeadsScreenLoader,
  PropertiesScreenLoader,
  ChatListScreenLoader,
  MessageScreenLoader,
  ProfileScreenLoader,
  SettingsScreenLoader,
  NotificationsScreenLoader,
  LeadDetailsScreenLoader,
  PropertyDetailsScreenLoader,
  ListLoader,
  CardLoader,
}
