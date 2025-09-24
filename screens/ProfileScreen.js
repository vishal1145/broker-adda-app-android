import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

const ProfileScreen = ({ navigation }) => {
  const [profileData] = useState({
    name: 'Ethan Smith',
    brokerId: 'BRK-23579',
    role: 'Senior Broker',
    mobileNumber: '9876543456',
    whatsappNumber: '9876543456',
    email: 'agrabroker@gmail.com',
    officeAddress: 'Noida International University, Yamuna Expressway, Sector 17A, Uttar Pradesh, India',
    website: '-',
    firm: 'Algofolks Private Limited',
    gender: 'Male',
    status: 'Blocked',
    joinedDate: '19 Sept 2025',
    licenseNumber: '132456789',
    specializations: ['Residential Sales', 'Rental Properties', 'Property Management'],
    regions: ['North America', 'Europe', 'Asia Pacific'],
    yearsExperience: '8 Years',
    totalClients: '245',
    activeDeals: '12',
    commissionEarned: '$1.2M',
    documents: [
      {
        id: 1,
        name: 'Aadhar Card',
        fileType: 'JPEG',
        hasFile: true
      },
      {
        id: 2,
        name: 'PAN Card',
        fileType: 'JPEG',
        hasFile: true
      },
      {
        id: 3,
        name: 'GST Certificate',
        fileType: 'JPEG',
        hasFile: true
      },
      {
        id: 4,
        name: 'Broker License',
        fileType: 'N/A',
        hasFile: false
      },
      {
        id: 5,
        name: 'Company ID',
        fileType: 'N/A',
        hasFile: false
      }
    ]
  })


  const handleLogout = () => {
    // Navigate back to login screen
    navigation.navigate('Login')
  }

  const handlePreviewDocument = (documentId) => {
    // Handle document preview
    console.log('Preview document:', documentId)
  }

  const handleDownloadDocument = (documentId) => {
    // Handle document download
    console.log('Download document:', documentId)
  }

  const InfoCard = ({ title, items }) => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.infoItem}>
          <MaterialIcons name={item.icon} size={20} color="#666666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                style={styles.profileImage}
              />
            </View>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.firmName}>{profileData.firm}</Text>
            <TouchableOpacity style={styles.blockButton}>
              <MaterialIcons name="block" size={16} color="#FFFFFF" />
              <Text style={styles.blockButtonText}>Block</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brokerage Details */}
        <View style={[styles.brokerageCard, styles.firstCard]}>
          <Text style={styles.brokerageTitle}>Brokerage Details</Text>
          
          {/* Firm */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="business" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>Firm</Text>
              <Text style={styles.brokerageValue}>{profileData.firm}</Text>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="person" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>Gender</Text>
              <Text style={styles.brokerageValue}>{profileData.gender}</Text>
            </View>
          </View>

          {/* Status */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="schedule" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>Status</Text>
              <View style={styles.statusTag}>
                <Text style={styles.statusText}>{profileData.status}</Text>
              </View>
            </View>
          </View>

          {/* Joined Date */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="calendar-today" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>Joined Date</Text>
              <Text style={styles.brokerageValue}>{profileData.joinedDate}</Text>
            </View>
          </View>

          {/* License */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="description" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>License</Text>
              <Text style={styles.brokerageValue}>{profileData.licenseNumber}</Text>
            </View>
          </View>

          {/* Specializations */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="work" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>Specializations</Text>
              <View style={styles.specializationTags}>
                {profileData.specializations.map((spec, index) => (
                  <View key={index} style={styles.specializationTag}>
                    <Text style={styles.specializationText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Regions */}
          <View style={styles.brokerageItem}>
            <MaterialIcons name="public" size={20} color="#666666" />
            <View style={styles.brokerageContent}>
              <Text style={styles.brokerageLabel}>Regions</Text>
              <View style={styles.regionTags}>
                {profileData.regions.map((region, index) => (
                  <View key={index} style={styles.regionTag}>
                    <Text style={styles.regionText}>{region}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          
          {/* Mobile */}
          <View style={styles.contactItem}>
            <MaterialIcons name="phone" size={20} color="#666666" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Mobile</Text>
              <View style={styles.contactValueRow}>
                <Text style={styles.contactValueGreen}>{profileData.mobileNumber}</Text>
                <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              </View>
            </View>
          </View>

          {/* WhatsApp */}
          <View style={styles.contactItem}>
            <MaterialIcons name="chat" size={20} color="#666666" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValueGreen}>{profileData.whatsappNumber}</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.contactItem}>
            <MaterialIcons name="email" size={20} color="#666666" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Email</Text>
              <View style={styles.contactValueRow}>
                <Text style={styles.contactValueGreen}>{profileData.email}</Text>
                <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              </View>
            </View>
          </View>

          {/* Office Address */}
          <View style={styles.contactItem}>
            <MaterialIcons name="location-on" size={20} color="#666666" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Office Address</Text>
              <Text style={styles.contactValueBlack}>{profileData.officeAddress}</Text>
            </View>
          </View>

          {/* Website */}
          <View style={styles.contactItem}>
            <MaterialIcons name="language" size={20} color="#666666" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValueBlack}>{profileData.website}</Text>
            </View>
          </View>

          {/* Social Media */}
          <View style={styles.contactItem}>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Social Media</Text>
              <View style={styles.socialMediaIcons}>
                <View style={styles.socialIcon}>
                  <MaterialIcons name="linkedin" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.socialIcon}>
                  <MaterialIcons name="facebook" size={20} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.documentsCard}>
          <Text style={styles.documentsTitle}>Documents</Text>
          {profileData.documents.map((document, index) => (
            <View key={document.id} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <MaterialIcons name="description" size={20} color="#666666" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{document.name}</Text>
                <View style={styles.fileTypeTag}>
                  <Text style={styles.fileTypeText}>{document.fileType}</Text>
                </View>
              </View>
              <View style={styles.documentActions}>
                <TouchableOpacity 
                  style={styles.previewButton}
                  onPress={() => handlePreviewDocument(document.id)}
                >
                  <MaterialIcons name="visibility" size={18} color="#4CAF50" />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={() => handleDownloadDocument(document.id)}
                >
                  <MaterialIcons name="download" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#4A90E2',
    paddingBottom: height * 0.04,
    minHeight: height * 0.35,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.04,
    flex: 1,
    justifyContent: 'center',
  },
  profileImageContainer: {
    marginBottom: height * 0.02,
  },
  profileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    maxWidth: 120,
    maxHeight: 120,
  },
  profileName: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: height * 0.01,
    textAlign: 'center',
    maxWidth: width * 0.9,
  },
  firmName: {
    fontSize: width * 0.04,
    fontWeight: '400',
    color: '#E3F2FD',
    marginBottom: height * 0.02,
    textAlign: 'center',
    maxWidth: width * 0.9,
    lineHeight: width * 0.05,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: width * 0.05,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    gap: width * 0.015,
    minWidth: width * 0.3,
    justifyContent: 'center',
  },
  blockButtonText: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.02,
    borderRadius: width * 0.04,
    padding: width * 0.06,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#000000',
    marginBottom: height * 0.02,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: height * 0.022,
    minHeight: height * 0.06,
  },
  infoContent: {
    flex: 1,
    marginLeft: width * 0.03,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: width * 0.032,
    fontWeight: '500',
    color: '#666666',
    marginBottom: height * 0.007,
  },
  infoValue: {
    fontSize: width * 0.037,
    fontWeight: '600',
    color: '#000000',
    lineHeight: width * 0.05,
  },
  actionButtons: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.04,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: width * 0.02,
    paddingVertical: height * 0.02,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.02,
    borderRadius: width * 0.04,
    padding: width * 0.06,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#000000',
    marginBottom: height * 0.02,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: height * 0.022,
    minHeight: height * 0.06,
  },
  contactContent: {
    flex: 1,
    marginLeft: width * 0.03,
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: width * 0.032,
    fontWeight: '500',
    color: '#666666',
    marginBottom: height * 0.007,
  },
  contactValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.02,
  },
  contactValueGreen: {
    fontSize: width * 0.037,
    fontWeight: '600',
    color: '#4CAF50',
  },
  contactValueBlack: {
    fontSize: width * 0.037,
    fontWeight: '600',
    color: '#000000',
    lineHeight: width * 0.05,
  },
  socialMediaIcons: {
    flexDirection: 'row',
    gap: width * 0.03,
    marginTop: height * 0.005,
  },
  socialIcon: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.01,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokerageCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.02,
    borderRadius: width * 0.04,
    padding: width * 0.06,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  firstCard: {
    marginTop: height * 0.025,
  },
  brokerageTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#000000',
    marginBottom: height * 0.02,
  },
  brokerageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: height * 0.022,
    minHeight: height * 0.06,
  },
  brokerageContent: {
    flex: 1,
    marginLeft: width * 0.03,
    justifyContent: 'center',
  },
  brokerageLabel: {
    fontSize: width * 0.032,
    fontWeight: '500',
    color: '#666666',
    marginBottom: height * 0.007,
  },
  brokerageValue: {
    fontSize: width * 0.037,
    fontWeight: '600',
    color: '#000000',
    lineHeight: width * 0.05,
  },
  statusTag: {
    backgroundColor: '#FFEBEE',
    borderRadius: width * 0.04,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.007,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  statusText: {
    fontSize: width * 0.03,
    fontWeight: '600',
    color: '#D32F2F',
  },
  specializationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.02,
    marginTop: height * 0.002,
  },
  specializationTag: {
    backgroundColor: '#F8F9FA',
    borderRadius: width * 0.04,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.007,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  specializationText: {
    fontSize: width * 0.027,
    fontWeight: '500',
    color: '#495057',
  },
  regionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.02,
  },
  regionTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: width * 0.04,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.007,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  regionText: {
    fontSize: width * 0.027,
    fontWeight: '500',
    color: '#1565C0',
  },
  documentsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.02,
    borderRadius: width * 0.04,
    padding: width * 0.06,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  documentsTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#000000',
    marginBottom: height * 0.02,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: width * 0.02,
    padding: width * 0.04,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  documentIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.02,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: width * 0.03,
  },
  documentInfo: {
    flex: 1,
    marginRight: width * 0.03,
  },
  documentName: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#000000',
    marginBottom: height * 0.005,
  },
  fileTypeTag: {
    backgroundColor: '#F8F9FA',
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.005,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  fileTypeText: {
    fontSize: width * 0.03,
    fontWeight: '500',
    color: '#666666',
  },
  documentActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: width * 0.02,
    minWidth: width * 0.3,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    gap: width * 0.015,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    minWidth: width * 0.25,
    justifyContent: 'center',
  },
  previewButtonText: {
    fontSize: width * 0.032,
    fontWeight: '600',
    color: '#2E7D32',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    gap: width * 0.015,
    minWidth: width * 0.25,
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontSize: width * 0.032,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default ProfileScreen
