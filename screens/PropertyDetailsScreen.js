import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Image,
  Share,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const PropertyDetailsScreen = ({ navigation, route }) => {
  const { property } = route.params
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Sample related properties (in a real app, this would be fetched from an API)
  const relatedProperties = [
    {
      id: 2,
      title: 'Suburban Family Home',
      address: '456 Oak Avenue',
      price: '$650,000',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2500,
      type: 'House',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'],
    },
    {
      id: 3,
      title: 'Beachfront Villa',
      address: '789 Ocean Drive',
      price: '$1,200,000',
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3500,
      type: 'Villa',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop'],
    },
    {
      id: 4,
      title: 'Modern Townhouse',
      address: '321 Pine Street',
      price: '$450,000',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      type: 'Townhouse',
      status: 'active',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'],
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981'
      case 'pending': return '#F59E0B'
      case 'sold': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Condo': return 'apartment'
      case 'House': return 'home'
      case 'Villa': return 'villa'
      case 'Townhouse': return 'business'
      default: return 'home'
    }
  }

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this property: ${property.title} - ${property.address}\nPrice: ${property.price}`,
        title: property.title,
      })
    } catch (error) {
      Alert.alert('Error', 'Unable to share property')
    }
  }

  const handleEdit = () => {
    navigation.navigate('CreateProperty', { property })
  }

  const handleContact = () => {
    Alert.alert(
      'Contact Agent',
      `Would you like to contact ${property.agent}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Call agent') },
        { text: 'Email', onPress: () => console.log('Email agent') },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Property Details</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <MaterialIcons 
              name={isFavorite ? "favorite" : "favorite-border"} 
              size={24} 
              color={isFavorite ? "#EF4444" : "#FFFFFF"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Images */}
        <View style={styles.imageSection}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const contentOffsetX = event.nativeEvent.contentOffset.x
              const currentIndex = Math.round(contentOffsetX / width)
              setCurrentImageIndex(currentIndex)
            }}
            scrollEventThrottle={16}
          >
            {property.images?.map((image, index) => (
              <Image 
                key={index}
                source={{ uri: image }} 
                style={styles.propertyImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {property.images?.length > 1 && (
            <View style={styles.imageIndicators}>
              {property.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) + '20' }]}>
            <MaterialIcons name="circle" size={8} color={getStatusColor(property.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
              {property.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.contentSection}>
          <View style={styles.propertyHeader}>
            <View style={styles.propertyHeaderLeft}>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <View style={styles.propertyAddress}>
                <MaterialIcons name="location-on" size={18} color="#0D542BFF" />
                <Text style={styles.addressText}>{property.address}</Text>
              </View>
            </View>
            <Text style={styles.propertyPrice}>{property.price}</Text>
          </View>

          {/* Property Details */}
          <View style={styles.propertyDetails}>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="bed" size={24} color="#0D542BFF" />
              </View>
              <Text style={styles.detailLabel}>Bedrooms</Text>
              <Text style={styles.detailValue}>{property.bedrooms}</Text>
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="bathtub" size={24} color="#0D542BFF" />
              </View>
              <Text style={styles.detailLabel}>Bathrooms</Text>
              <Text style={styles.detailValue}>{property.bathrooms}</Text>
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="square-foot" size={24} color="#0D542BFF" />
              </View>
              <Text style={styles.detailLabel}>Square Feet</Text>
              <Text style={styles.detailValue}>{property.sqft}</Text>
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <MaterialIcons name={getTypeIcon(property.type)} size={24} color="#0D542BFF" />
              </View>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{property.type}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionContent}>{property.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {property.features?.map((feature, index) => (
                <View key={index} style={styles.featureTag}>
                  <MaterialIcons name="check-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Property Statistics */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <MaterialIcons name="visibility" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{property.views || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="favorite" size={20} color="#EF4444" />
              <Text style={styles.statValue}>{property.favorites || 0}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="schedule" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{property.listedDate}</Text>
              <Text style={styles.statLabel}>Listed</Text>
            </View>
          </View>

          {/* Agent Info */}
          <View style={styles.agentSection}>
            <Text style={styles.sectionTitle}>Listing Agent</Text>
            <View style={styles.agentCard}>
              <View style={styles.agentAvatar}>
                <MaterialIcons name="account-circle" size={50} color="#0D542BFF" />
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{property.agent}</Text>
                <Text style={styles.agentLabel}>Real Estate Agent</Text>
              </View>
              <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                <MaterialIcons name="phone" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Related Properties */}
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>Similar Properties</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {relatedProperties.map((relatedProperty) => (
                <TouchableOpacity 
                  key={relatedProperty.id}
                  style={styles.relatedCard}
                  onPress={() => navigation.navigate('PropertyDetails', { property: relatedProperty })}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ uri: relatedProperty.images[0] }} 
                    style={styles.relatedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.relatedBadge}>
                    <MaterialIcons name="circle" size={6} color={getStatusColor(relatedProperty.status)} />
                    <Text style={[styles.relatedBadgeText, { color: getStatusColor(relatedProperty.status) }]}>
                      {relatedProperty.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedTitle} numberOfLines={1}>{relatedProperty.title}</Text>
                    <View style={styles.relatedAddress}>
                      <MaterialIcons name="location-on" size={12} color="#6B7280" />
                      <Text style={styles.relatedAddressText} numberOfLines={1}>{relatedProperty.address}</Text>
                    </View>
                    <Text style={styles.relatedPrice}>{relatedProperty.price}</Text>
                    <View style={styles.relatedDetails}>
                      <View style={styles.relatedDetail}>
                        <MaterialIcons name="bed" size={12} color="#0D542BFF" />
                        <Text style={styles.relatedDetailText}>{relatedProperty.bedrooms}</Text>
                      </View>
                      <View style={styles.relatedDetail}>
                        <MaterialIcons name="bathtub" size={12} color="#0D542BFF" />
                        <Text style={styles.relatedDetailText}>{relatedProperty.bathrooms}</Text>
                      </View>
                      <View style={styles.relatedDetail}>
                        <MaterialIcons name="square-foot" size={12} color="#0D542BFF" />
                        <Text style={styles.relatedDetailText}>{relatedProperty.sqft}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <MaterialIcons name="edit" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Property</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton}>
              <MaterialIcons name="delete" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0D542BFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  
  // Image Section
  imageSection: {
    position: 'relative',
    height: 300,
  },
  propertyImage: {
    width: width,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Content Section
  contentSection: {
    padding: 20,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  propertyHeaderLeft: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  propertyAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  propertyPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D542BFF',
  },
  
  // Property Details
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailIcon: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  
  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  
  // Stats
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Agent Section
  agentSection: {
    marginBottom: 24,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  agentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  agentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D542BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D542BFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  
  // Related Properties
  relatedSection: {
    marginBottom: 24,
  },
  relatedScroll: {
    gap: 16,
  },
  relatedCard: {
    width: width * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  relatedImage: {
    width: '100%',
    height: 180,
  },
  relatedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  relatedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  relatedContent: {
    padding: 16,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  relatedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  relatedAddressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  relatedPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D542BFF',
    marginBottom: 12,
  },
  relatedDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  relatedDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
})

export default PropertyDetailsScreen
