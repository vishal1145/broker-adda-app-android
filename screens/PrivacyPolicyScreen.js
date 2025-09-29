import React from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#16BCC0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.sectionText}>
          Broker Adda collects information necessary to provide professional real estate networking services. This includes:
        </Text>
        <Text style={styles.bulletPoint}>• Professional credentials and license information</Text>
        <Text style={styles.bulletPoint}>• Contact information (phone, email, office address)</Text>
        <Text style={styles.bulletPoint}>• Property listings and client information (with consent)</Text>
        <Text style={styles.bulletPoint}>• Professional networking data and connections</Text>
        <Text style={styles.bulletPoint}>• Business performance metrics and analytics</Text>
        <Text style={styles.bulletPoint}>• Communication preferences and app usage data</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.sectionText}>
          We use your information to provide and improve Broker Adda's services:
        </Text>
        <Text style={styles.bulletPoint}>• Facilitate professional networking and connections</Text>
        <Text style={styles.bulletPoint}>• Manage property listings and lead generation</Text>
        <Text style={styles.bulletPoint}>• Provide market insights and business analytics</Text>
        <Text style={styles.bulletPoint}>• Send relevant industry updates and notifications</Text>
        <Text style={styles.bulletPoint}>• Verify professional credentials and compliance</Text>
        <Text style={styles.bulletPoint}>• Improve platform features and user experience</Text>

        <Text style={styles.sectionTitle}>3. Information Sharing and Disclosure</Text>
        <Text style={styles.sectionText}>
          Broker Adda respects your professional privacy. We may share information in these limited circumstances:
        </Text>
        <Text style={styles.bulletPoint}>• With other verified real estate professionals for networking purposes</Text>
        <Text style={styles.bulletPoint}>• To comply with real estate licensing and regulatory requirements</Text>
        <Text style={styles.bulletPoint}>• To prevent fraud and ensure platform integrity</Text>
        <Text style={styles.bulletPoint}>• With your explicit consent for specific business purposes</Text>
        <Text style={styles.bulletPoint}>• As required by law or legal process</Text>

        <Text style={styles.sectionTitle}>4. Professional Data Security</Text>
        <Text style={styles.sectionText}>
          We implement industry-standard security measures to protect your professional and client data:
        </Text>
        <Text style={styles.bulletPoint}>• End-to-end encryption for sensitive communications</Text>
        <Text style={styles.bulletPoint}>• Secure cloud storage with regular backups</Text>
        <Text style={styles.bulletPoint}>• Multi-factor authentication for account access</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
        <Text style={styles.bulletPoint}>• Compliance with real estate data protection standards</Text>

        <Text style={styles.sectionTitle}>5. Data Retention for Real Estate Professionals</Text>
        <Text style={styles.sectionText}>
          We retain your information as required by real estate industry standards:
        </Text>
        <Text style={styles.bulletPoint}>• Professional credentials: Duration of your account plus 7 years</Text>
        <Text style={styles.bulletPoint}>• Property listings: Until removed or account closure</Text>
        <Text style={styles.bulletPoint}>• Client communications: As required by state regulations</Text>
        <Text style={styles.bulletPoint}>• Business analytics: Aggregated data for 3 years</Text>

        <Text style={styles.sectionTitle}>6. Your Professional Rights</Text>
        <Text style={styles.sectionText}>
          As a real estate professional using Broker Adda, you have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access and update your professional profile</Text>
        <Text style={styles.bulletPoint}>• Control visibility of your listings and information</Text>
        <Text style={styles.bulletPoint}>• Export your business data and contacts</Text>
        <Text style={styles.bulletPoint}>• Opt out of marketing communications</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your account and data</Text>
        <Text style={styles.bulletPoint}>• Report privacy concerns or violations</Text>

        <Text style={styles.sectionTitle}>7. Real Estate Industry Compliance</Text>
        <Text style={styles.sectionText}>
          Broker Adda complies with real estate industry privacy standards:
        </Text>
        <Text style={styles.bulletPoint}>• Fair Housing Act and anti-discrimination laws</Text>
        <Text style={styles.bulletPoint}>• State real estate licensing requirements</Text>
        <Text style={styles.bulletPoint}>• MLS (Multiple Listing Service) data protection rules</Text>
        <Text style={styles.bulletPoint}>• Client confidentiality and fiduciary duty standards</Text>
        <Text style={styles.bulletPoint}>• Professional ethics and code of conduct</Text>

        <Text style={styles.sectionTitle}>8. Third-Party Real Estate Services</Text>
        <Text style={styles.sectionText}>
          Broker Adda may integrate with trusted real estate services:
        </Text>
        <Text style={styles.bulletPoint}>• MLS systems and property databases</Text>
        <Text style={styles.bulletPoint}>• Real estate marketing platforms</Text>
        <Text style={styles.bulletPoint}>• Professional networking services</Text>
        <Text style={styles.bulletPoint}>• Industry analytics and reporting tools</Text>
        <Text style={styles.bulletPoint}>• All integrations maintain strict privacy standards</Text>

        <Text style={styles.sectionTitle}>9. Professional Age Requirements</Text>
        <Text style={styles.sectionText}>
          Broker Adda is designed for licensed real estate professionals. Users must be at least 18 years old and hold a valid real estate license. We verify professional credentials during account creation.
        </Text>

        <Text style={styles.sectionTitle}>10. Data Transfers and International Use</Text>
        <Text style={styles.sectionText}>
          As a global real estate platform, your information may be processed in different jurisdictions. We ensure all transfers comply with applicable real estate and data protection laws, including GDPR and local real estate regulations.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to This Privacy Policy</Text>
        <Text style={styles.sectionText}>
          We may update this privacy policy to reflect changes in real estate regulations or our services. We will notify all users of material changes at least 30 days in advance through the app and email notifications.
        </Text>

        <Text style={styles.contactText}>
          For privacy questions or concerns, contact our support team at support@brokeradda.com or call our professional support line.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333333',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333333',
    lineHeight: 22,
    marginLeft: 10,
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#16BCC0',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 40,
    lineHeight: 22,
  },
})

export default PrivacyPolicyScreen
