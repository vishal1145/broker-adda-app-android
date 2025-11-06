import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { leadsAPI, authAPI } from '../services/api'
import { storage } from '../services/storage'
import { Snackbar } from '../utils/snackbar'

const ShareLeadScreen = ({ navigation, route }) => {
  const { lead } = route.params || {}
  
  // Share Modal state
  const [shareData, setShareData] = useState({
    shareType: 'all', // 'all', 'region', 'selected'
    selectedRegion: null,
    selectedRegionName: '',
    selectedBrokers: [],
    notes: ''
  })
  const [showShareRegionModal, setShowShareRegionModal] = useState(false)
  const [showShareBrokerModal, setShowShareBrokerModal] = useState(false)
  const [allBrokers, setAllBrokers] = useState([])
  const [filteredBrokers, setFilteredBrokers] = useState([])
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [regions, setRegions] = useState([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  // ScrollView refs for auto-scrolling
  const shareLeadScrollRef = useRef(null)
  
  // Search state for broker modal
  const [brokerSearchQuery, setBrokerSearchQuery] = useState('')

  // Fetch regions
  const fetchRegions = async () => {
    try {
      setIsLoadingRegions(true)
      const response = await authAPI.getAllRegions()
      if (response.success && response.data && response.data.regions) {
        const regionsData = Array.isArray(response.data.regions) ? response.data.regions : []
        setRegions(regionsData)
        console.log('Regions fetched successfully:', regionsData.length, 'regions')
      } else {
        console.log('No regions data found in response:', response)
        setRegions([])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
      setRegions([])
    } finally {
      setIsLoadingRegions(false)
    }
  }

  const handleShareTypeChange = (shareType) => {
    setShareData(prev => ({
      ...prev,
      shareType,
      selectedRegion: null,
      selectedRegionName: '',
      selectedBrokers: []
    }))
    setShowShareRegionModal(false)
    setShowShareBrokerModal(false)
  }

  const handleShareRegionSelect = (regionName) => {
    const selectedRegion = regions.find(region => region.name === regionName)
    if (selectedRegion) {
      setShareData(prev => ({
        ...prev,
        selectedRegion: selectedRegion._id,
        selectedRegionName: selectedRegion.name
      }))
      // Fetch brokers for this region
      fetchBrokersByRegion(selectedRegion._id)
    }
    setShowShareRegionModal(false)
  }

  const handleBrokerSelect = (broker) => {
    setShareData(prev => {
      const isSelected = prev.selectedBrokers.some(b => b._id === broker._id)
      if (isSelected) {
        return {
          ...prev,
          selectedBrokers: prev.selectedBrokers.filter(b => b._id !== broker._id)
        }
      } else {
        return {
          ...prev,
          selectedBrokers: [...prev.selectedBrokers, broker]
        }
      }
    })
  }

  const fetchAllBrokers = async () => {
    try {
      setIsLoadingBrokers(true)
      const token = await storage.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.getAllBrokers(token)
      if (response.success && response.data && response.data.brokers) {
        const brokers = response.data.brokers
        setAllBrokers(brokers)
        setFilteredBrokers(brokers)
        console.log('All brokers fetched:', brokers.length)
      }
    } catch (error) {
      console.error('Error fetching all brokers:', error)
      Snackbar.showError('Error', 'Failed to fetch brokers')
    } finally {
      setIsLoadingBrokers(false)
    }
  }

  const fetchBrokersByRegion = async (regionId) => {
    try {
      setIsLoadingBrokers(true)
      const token = await storage.getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await leadsAPI.getBrokersByRegion(regionId, token)
      if (response.success && response.data && response.data.brokers) {
        const brokers = response.data.brokers
        setFilteredBrokers(brokers)
        console.log('Brokers by region fetched:', brokers.length)
      }
    } catch (error) {
      console.error('Error fetching brokers by region:', error)
      Snackbar.showError('Error', 'Failed to fetch brokers for region')
    } finally {
      setIsLoadingBrokers(false)
    }
  }

  const handleShareSubmit = async () => {
    try {
      setIsSharing(true)
      
      if (!lead) {
        Snackbar.showError('Error', 'No lead selected for sharing')
        return
      }

      const token = await storage.getToken()
      if (!token) {
        Snackbar.showError('Error', 'Authentication token not found')
        return
      }

      // Get current user's broker ID to exclude from sharing
      const currentBrokerId = await storage.getBrokerId()
      
      let toBrokers = []
      
      if (shareData.shareType === 'all') {
        // Get all broker IDs from the dedicated brokers API
        const response = await leadsAPI.getAllBrokers(token)
        if (response.success && response.data && response.data.brokers) {
          toBrokers = response.data.brokers
            .map(broker => broker._id)
            .filter(id => id && id !== currentBrokerId) // Exclude current user
        }
      } else if (shareData.shareType === 'region') {
        if (!shareData.selectedRegion) {
          Snackbar.showError('Error', 'Please select a region')
          return
        }
        // Use the filtered brokers for the selected region
        toBrokers = filteredBrokers
          .map(broker => broker._id)
          .filter(id => id && id !== currentBrokerId) // Exclude current user
      } else if (shareData.shareType === 'selected') {
        if (shareData.selectedBrokers.length === 0) {
          Snackbar.showError('Error', 'Please select at least one broker')
          return
        }
        toBrokers = shareData.selectedBrokers.map(broker => broker._id)
      }

      if (toBrokers.length === 0) {
        Snackbar.showError('Error', 'No brokers available to share with')
        return
      }

      const sharePayload = {
        toBrokers,
        notes: shareData.notes
      }

      console.log('Sharing lead with payload:', sharePayload)

      const response = await leadsAPI.shareLead(lead.id, sharePayload, token)
      
      if (response.success) {
        Snackbar.showSuccess('Success', response.message || 'Lead shared successfully!')
        navigation.goBack()
      } else {
        Snackbar.showError('Error', response.message || 'Failed to share lead')
      }
      
    } catch (error) {
      console.error('Error sharing lead:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to share lead'
      Snackbar.showError('Error', errorMessage)
    } finally {
      setIsSharing(false)
    }
  }

  // Helper function to filter brokers based on search query
  const getFilteredBrokers = () => {
    if (!brokerSearchQuery.trim()) {
      return allBrokers
    }
    const query = brokerSearchQuery.toLowerCase().trim()
    return allBrokers.filter(broker => {
      const name = (broker.name || '').toLowerCase()
      const firmName = (broker.firmName || '').toLowerCase()
      const regionName = broker.region && broker.region.length > 0 
        ? (broker.region[0].name || '').toLowerCase()
        : ''
      return name.includes(query) || firmName.includes(query) || regionName.includes(query)
    })
  }

  // Fetch regions and brokers on mount
  useEffect(() => {
    fetchRegions()
    if (shareData.shareType === 'selected') {
      fetchAllBrokers()
    }
  }, [])

  // Fetch brokers when share type changes
  useEffect(() => {
    if (shareData.shareType === 'selected' && allBrokers.length === 0) {
      fetchAllBrokers()
    }
  }, [shareData.shareType])

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        setIsKeyboardVisible(true)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    )
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        setIsKeyboardVisible(true)
      }
    )
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    )

    return () => {
      keyboardDidHideListener?.remove()
      keyboardDidShowListener?.remove()
      keyboardWillShowListener?.remove()
      keyboardWillHideListener?.remove()
    }
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Keyboard.dismiss()
              navigation.goBack()
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          ref={shareLeadScrollRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.singlePageForm}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Share Lead</Text>
            </View>
            
            {/* Share Type Selection */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Share Type *</Text>
              <View style={styles.addLeadButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.addLeadFormButton,
                    shareData.shareType === 'all' && styles.addLeadFormButtonActive
                  ]}
                  onPress={() => handleShareTypeChange('all')}
                >
                  <Text style={[
                    styles.addLeadFormButtonText,
                    shareData.shareType === 'all' && styles.addLeadFormButtonTextActive
                  ]}>
                    All Brokers
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addLeadFormButton,
                    shareData.shareType === 'region' && styles.addLeadFormButtonActive
                  ]}
                  onPress={() => handleShareTypeChange('region')}
                >
                  <Text style={[
                    styles.addLeadFormButtonText,
                    shareData.shareType === 'region' && styles.addLeadFormButtonTextActive
                  ]}>
                    By Region
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addLeadFormButton,
                    shareData.shareType === 'selected' && styles.addLeadFormButtonActive
                  ]}
                  onPress={() => handleShareTypeChange('selected')}
                >
                  <Text style={[
                    styles.addLeadFormButtonText,
                    shareData.shareType === 'selected' && styles.addLeadFormButtonTextActive
                  ]}>
                    Selected
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Region Selection (only when region is selected) */}
            {shareData.shareType === 'region' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Region *</Text>
                <TouchableOpacity
                  style={[styles.input, isLoadingRegions && styles.disabledInput]}
                  onPress={() => {
                    if (!isLoadingRegions && regions.length > 0) {
                      setShowShareRegionModal(true)
                    }
                  }}
                  disabled={isLoadingRegions || regions.length === 0}
                >
                  <Text style={[styles.inputText, !shareData.selectedRegionName && styles.placeholderText]}>
                    {isLoadingRegions ? 'Loading regions...' : 
                     regions.length === 0 ? 'No regions available' :
                     shareData.selectedRegionName || 'Select region'}
                  </Text>
                  {isLoadingRegions ? (
                    <ActivityIndicator size="small" color="#0D542BFF" />
                  ) : (
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Broker Selection (only when selected brokers is chosen) */}
            {shareData.shareType === 'selected' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Broker(s) *</Text>
                <TouchableOpacity
                  style={[styles.input, isLoadingBrokers && styles.disabledInput]}
                  onPress={() => {
                    if (!isLoadingBrokers && allBrokers.length > 0) {
                      setShowShareBrokerModal(true)
                    }
                  }}
                  disabled={isLoadingBrokers || allBrokers.length === 0}
                >
                  <Text style={[styles.inputText, shareData.selectedBrokers.length === 0 && styles.placeholderText]}>
                    {isLoadingBrokers ? 'Loading brokers...' : 
                     allBrokers.length === 0 ? 'No brokers available' :
                     shareData.selectedBrokers.length === 0 
                       ? 'Choose brokers...' 
                       : `${shareData.selectedBrokers.length} broker(s) selected`
                    }
                  </Text>
                  {isLoadingBrokers ? (
                    <ActivityIndicator size="small" color="#0D542BFF" />
                  ) : (
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#8E8E93" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Share Notes */}
            <View style={styles.addLeadFieldContainer}>
              <Text style={styles.addLeadFieldLabel}>Share Notes (Optional)</Text>
              <TextInput
                style={styles.addLeadTextInput}
                placeholder="Add any specific instructions or context..."
                placeholderTextColor="#9CA3AF"
                value={shareData.notes}
                onChangeText={(text) => setShareData(prev => ({ ...prev, notes: text }))}
                onFocus={() => {
                  setTimeout(() => {
                    shareLeadScrollRef.current?.scrollToEnd({ animated: true })
                  }, 100)
                }}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  isSharing ? styles.actionButtonDisabled : null
                ]} 
                onPress={handleShareSubmit}
                disabled={isSharing}
              >
                {isSharing ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
                      Sharing...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.actionButtonText}>
                    Share with broker
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Region Selection Modal */}
      <Modal visible={showShareRegionModal} transparent animationType="fade" statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Region</Text>
              <TouchableOpacity onPress={() => setShowShareRegionModal(false)}>
                <MaterialIcons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {isLoadingRegions ? (
                <View style={styles.modalItem}>
                  <ActivityIndicator size="small" color="#0D542BFF" />
                  <Text style={[styles.modalItemText, { marginLeft: 12 }]}>Loading regions...</Text>
                </View>
              ) : regions && regions.length > 0 ? (
                regions.map((region) => (
                  <TouchableOpacity
                    key={region._id}
                    style={styles.modalItem}
                    onPress={() => handleShareRegionSelect(region.name)}
                  >
                    <Text style={styles.modalItemText}>{region.name}</Text>
                    {shareData.selectedRegionName === region.name && (
                      <MaterialIcons name="check" size={20} color="#0D542BFF" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemText}>No regions available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Broker Selection Modal */}
      <Modal visible={showShareBrokerModal} transparent animationType="fade" statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Broker(s)</Text>
              <TouchableOpacity onPress={() => {
                setShowShareBrokerModal(false)
                setBrokerSearchQuery('')
              }}>
                <MaterialIcons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <View style={styles.modalSearchInputWrapper}>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search brokers..."
                  placeholderTextColor="#9CA3AF"
                  value={brokerSearchQuery}
                  onChangeText={setBrokerSearchQuery}
                />
                <MaterialIcons name="search" size={20} color="#8E8E93" style={styles.modalSearchIcon} />
              </View>
            </View>

            {/* Select All Button */}
            {(() => {
              const filtered = getFilteredBrokers()
              const selectedCount = shareData.selectedBrokers.filter(b => 
                filtered.some(fb => fb._id === b._id)
              ).length
              const allSelected = selectedCount === filtered.length && filtered.length > 0
              
              return (
                <TouchableOpacity
                  style={styles.modalSelectAllButton}
                  onPress={() => {
                    if (allSelected) {
                      // Deselect all filtered brokers
                      const filteredIds = filtered.map(b => b._id)
                      setShareData(prev => ({
                        ...prev,
                        selectedBrokers: prev.selectedBrokers.filter(b => !filteredIds.includes(b._id))
                      }))
                    } else {
                      // Select all filtered brokers
                      const filteredIds = filtered.map(b => b._id)
                      const newSelected = [...shareData.selectedBrokers]
                      filtered.forEach(broker => {
                        if (!newSelected.some(b => b._id === broker._id)) {
                          newSelected.push(broker)
                        }
                      })
                      setShareData(prev => ({
                        ...prev,
                        selectedBrokers: newSelected
                      }))
                    }
                  }}
                >
                  <Text style={styles.modalSelectAllText}>
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              )
            })()}

            <ScrollView style={styles.modalList}>
              {isLoadingBrokers ? (
                <View style={styles.modalItem}>
                  <ActivityIndicator size="small" color="#0D542BFF" />
                  <Text style={[styles.modalItemText, { marginLeft: 12 }]}>Loading brokers...</Text>
                </View>
              ) : (() => {
                const filtered = getFilteredBrokers()
                return filtered && filtered.length > 0 ? (
                  filtered.map((broker) => {
                    const isSelected = shareData.selectedBrokers.some(b => b._id === broker._id)
                    return (
                      <TouchableOpacity
                        key={broker._id}
                        style={styles.modalItem}
                        onPress={() => handleBrokerSelect(broker)}
                      >
                        <View style={styles.modalBrokerInfo}>
                          <Text style={styles.modalBrokerName}>
                            {broker.name || 'Unknown Broker'}
                          </Text>
                          <Text style={styles.modalBrokerDetails}>
                            {broker.firmName ? `${broker.firmName} • ` : ''}
                            {broker.region && broker.region.length > 0 
                              ? broker.region[0].name || 'No region'
                              : 'No region'
                            }
                          </Text>
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check" size={20} color="#0D542BFF" />
                        )}
                      </TouchableOpacity>
                    )
                  })
                ) : (
                  <View style={styles.modalItem}>
                    <Text style={styles.modalItemText}>No brokers available</Text>
                  </View>
                )
              })()}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  singlePageForm: {
    flex: 1,
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 5,
    lineHeight: 30,
  },
  addLeadFieldContainer: {
    marginBottom: 20,
  },
  addLeadFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#8E8E93',
    borderColor: '#E0E0E0',
  },
  addLeadTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    maxHeight: 120,
  },
  addLeadButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addLeadFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
    marginBottom: 8,
  },
  addLeadFormButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#E5E5EA',
  },
  addLeadFormButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  addLeadFormButtonTextActive: {
    color: '#0D542BFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
    marginBottom: 0,
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
  },
  modalSearchIcon: {
    marginLeft: 8,
  },
  modalSelectAllButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#F0FDFA',
  },
  modalSelectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D542BFF',
  },
  modalList: {
    maxHeight: Dimensions.get('window').height * 0.5,
    paddingBottom: 0,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalBrokerInfo: {
    flex: 1,
  },
  modalBrokerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  modalBrokerDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionButtonContainer: {
    paddingBottom: 20,
    paddingTop: 20,
    marginTop: 20,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#0D542BFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#0D542BFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#0D542BFF',
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default ShareLeadScreen

