import React from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  SafeAreaView, 
  ScrollView
} from 'react-native'
import Footer from '../components/Footer'

const NetworkScreen = ({ activeTab, onTabPress }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Network</Text>
          <Text style={styles.subtitle}>Connect with other professionals</Text>
          <Text style={styles.description}>
            This is the Network screen where users can connect with other professionals, 
            view their network, and discover new opportunities.
          </Text>
        </View>
      </ScrollView>
      
      <Footer activeTab={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#CCCCCC',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 24,
  },
})

export default NetworkScreen
