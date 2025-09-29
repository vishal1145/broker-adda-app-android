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

const TermsAndConditionsScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.sectionText}>
          By accessing and using Broker Adda, you accept and agree to be bound by these terms and conditions. This application is designed for real estate brokers, agents, and property professionals. If you do not agree to these terms, please do not use this service.
        </Text>

        <Text style={styles.sectionTitle}>2. Service Description</Text>
        <Text style={styles.sectionText}>
          Broker Adda is a professional networking and property management platform that enables real estate professionals to:
        </Text>
        <Text style={styles.bulletPoint}>• Connect with other brokers and real estate professionals</Text>
        <Text style={styles.bulletPoint}>• Manage property listings and leads</Text>
        <Text style={styles.bulletPoint}>• Access market insights and analytics</Text>
        <Text style={styles.bulletPoint}>• Share professional updates and network</Text>
        <Text style={styles.bulletPoint}>• Track business performance and metrics</Text>

        <Text style={styles.sectionTitle}>3. User Account and Professional Requirements</Text>
        <Text style={styles.sectionText}>
          To use Broker Adda, you must:
        </Text>
        <Text style={styles.bulletPoint}>• Be a licensed real estate professional or broker</Text>
        <Text style={styles.bulletPoint}>• Provide accurate and current professional information</Text>
        <Text style={styles.bulletPoint}>• Maintain the confidentiality of your account credentials</Text>
        <Text style={styles.bulletPoint}>• Comply with all applicable real estate laws and regulations</Text>
        <Text style={styles.bulletPoint}>• Verify your professional credentials when requested</Text>

        <Text style={styles.sectionTitle}>4. Prohibited Uses</Text>
        <Text style={styles.sectionText}>
          You may not use Broker Adda:
        </Text>
        <Text style={styles.bulletPoint}>• For any unlawful real estate practices or activities</Text>
        <Text style={styles.bulletPoint}>• To violate fair housing laws or discrimination policies</Text>
        <Text style={styles.bulletPoint}>• To share false or misleading property information</Text>
        <Text style={styles.bulletPoint}>• To engage in fraudulent or deceptive business practices</Text>
        <Text style={styles.bulletPoint}>• To harass, abuse, or discriminate against other users</Text>
        <Text style={styles.bulletPoint}>• To violate any applicable real estate licensing requirements</Text>

        <Text style={styles.sectionTitle}>5. Property Listings and Content</Text>
        <Text style={styles.sectionText}>
          When posting property listings or professional content on Broker Adda, you must:
        </Text>
        <Text style={styles.bulletPoint}>• Ensure all property information is accurate and current</Text>
        <Text style={styles.bulletPoint}>• Comply with fair housing laws and regulations</Text>
        <Text style={styles.bulletPoint}>• Respect intellectual property rights of others</Text>
        <Text style={styles.bulletPoint}>• Maintain professional standards in all communications</Text>
        <Text style={styles.bulletPoint}>• Obtain necessary permissions for all shared content</Text>

        <Text style={styles.sectionTitle}>6. Professional Standards and Compliance</Text>
        <Text style={styles.sectionText}>
          All users must maintain the highest professional standards and comply with:
        </Text>
        <Text style={styles.bulletPoint}>• Local, state, and federal real estate laws and regulations</Text>
        <Text style={styles.bulletPoint}>• Fair Housing Act and anti-discrimination laws</Text>
        <Text style={styles.bulletPoint}>• Professional ethics and code of conduct</Text>
        <Text style={styles.bulletPoint}>• Data protection and privacy regulations</Text>
        <Text style={styles.bulletPoint}>• Truth in advertising and marketing standards</Text>

        <Text style={styles.sectionTitle}>7. Privacy Policy</Text>
        <Text style={styles.sectionText}>
          Your privacy is important to us. Please review our Privacy Policy, which also governs your use of Broker Adda, to understand how we collect, use, and protect your professional and personal information.
        </Text>

        <Text style={styles.sectionTitle}>8. Account Termination</Text>
        <Text style={styles.sectionText}>
          We may terminate or suspend your account immediately if you violate these terms, engage in unprofessional conduct, or fail to maintain your real estate license. You may also terminate your account at any time through the app settings.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.sectionText}>
          Broker Adda is provided as a networking and management tool. We are not responsible for the accuracy of property listings, the outcome of real estate transactions, or disputes between users. All real estate transactions are subject to separate agreements between parties.
        </Text>

        <Text style={styles.sectionTitle}>10. Intellectual Property</Text>
        <Text style={styles.sectionText}>
          The Broker Adda platform, including its design, features, and content, is protected by intellectual property laws. You may not copy, modify, or distribute any part of the application without written permission.
        </Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.sectionText}>
          These Terms shall be interpreted and governed by the laws of the jurisdiction where Broker Adda operates, without regard to conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.sectionText}>
          We reserve the right to modify these Terms at any time. Material changes will be communicated to users at least 30 days in advance. Continued use of the application constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.contactText}>
          For questions about these Terms and Conditions, contact us at support@brokeradda.com
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

export default TermsAndConditionsScreen
