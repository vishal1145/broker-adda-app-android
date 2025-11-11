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
import { useFocusEffect } from '@react-navigation/native'
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
    setShowShareBrokerModal(false)
    // Clear filtered brokers when switching away from region
    if (shareType !== 'region') {
      setFilteredBrokers([])
    }
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
  }

  // Render chip group (matching CreatePropertyScreen pattern)
  const renderChipGroup = (options, selectedValue, onSelect, fieldName) => (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : (option.name || option)
        const isSelected = selectedValue === optionValue
        return (
          <TouchableOpacity
            key={optionValue}
            style={[
              styles.chip,
              isSelected && styles.chipSelected
            ]}
            onPress={() => onSelect(optionValue)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.chipText,
              isSelected && styles.chipTextSelected
            ]}>
              {optionValue}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  // Validation function
  const isFormValid = () => {
    if (shareData.shareType === 'region') {
      return shareData.selectedRegion && shareData.selectedRegionName.trim() !== ''
    } else if (shareData.shareType === 'selected') {
      return shareData.selectedBrokers.length > 0
    } else if (shareData.shareType === 'all') {
      return true
    }
    return false
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
        setIsSharing(false)
        return
      }

      const token = await storage.getToken()
      if (!token) {
        Snackbar.showError('Error', 'Authentication token not found')
        setIsSharing(false)
        return
      }

      let transfers = []
      
      if (shareData.shareType === 'all') {
        // Share with all brokers
        transfers = [{
          shareType: 'all'
        }]
      } else if (shareData.shareType === 'region') {
        if (!shareData.selectedRegion) {
          Snackbar.showError('Error', 'Please select a region')
          setIsSharing(false)
          return
        }
        // Share with region
        transfers = [{
          shareType: 'region',
          region: shareData.selectedRegion
        }]
      } else if (shareData.shareType === 'selected') {
        if (shareData.selectedBrokers.length === 0) {
          Snackbar.showError('Error', 'Please select at least one broker')
          setIsSharing(false)
          return
        }
        // Share with individual brokers - create one transfer per broker
        transfers = shareData.selectedBrokers.map(broker => ({
          shareType: 'individual',
          toBroker: broker._id
        }))
      }

      if (transfers.length === 0) {
        Snackbar.showError('Error', 'Invalid share configuration')
        setIsSharing(false)
        return
      }

      const sharePayload = {
        transfers,
        notes: shareData.notes || ''
      }

      console.log('Sharing lead with payload:', sharePayload)

      const leadId = lead.id || lead._id
      if (!leadId) {
        Snackbar.showError('Error', 'Invalid lead ID')
        setIsSharing(false)
        return
      }

      const response = await leadsAPI.shareLead(leadId, sharePayload, token)
      
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

  // Refresh data when screen comes into focus (e.g., returning from other screens)
  const isFirstMount = useRef(true)
  useFocusEffect(
    React.useCallback(() => {
      // Skip refresh on initial mount (already handled by useEffect)
      if (isFirstMount.current) {
        isFirstMount.current = false
        return
      }
      
      // Refresh regions and brokers when screen is focused
      console.log('ShareLeadScreen focused - refreshing data')
      fetchRegions()
      if (shareData.shareType === 'selected') {
        fetchAllBrokers()
      } else if (shareData.shareType === 'region' && shareData.selectedRegion) {
        fetchBrokersByRegion(shareData.selectedRegion._id)
      }
    }, [shareData.shareType, shareData.selectedRegion])
  )

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
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Share Type *</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    shareData.shareType === 'all' && styles.chipSelected
                  ]}
                  onPress={() => handleShareTypeChange('all')}
                >
                  <Text style={[
                    styles.chipText,
                    shareData.shareType === 'all' && styles.chipTextSelected
                  ]}>
                    All Brokers
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    shareData.shareType === 'region' && styles.chipSelected
                  ]}
                  onPress={() => handleShareTypeChange('region')}
                >
                  <Text style={[
                    styles.chipText,
                    shareData.shareType === 'region' && styles.chipTextSelected
                  ]}>
                    By Region
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    shareData.shareType === 'selected' && styles.chipSelected
                  ]}
                  onPress={() => handleShareTypeChange('selected')}
                >
                  <Text style={[
                    styles.chipText,
                    shareData.shareType === 'selected' && styles.chipTextSelected
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
                {isLoadingRegions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#0D542BFF" />
                    <Text style={styles.loadingText}>Loading regions...</Text>
                  </View>
                ) : regions && regions.length > 0 ? (
                  <>
                    {renderChipGroup(
                      regions.map(r => r.name || r),
                      shareData.selectedRegionName,
                      (value) => handleShareRegionSelect(value),
                      'region'
                    )}
                    {!shareData.selectedRegionName && (
                      <Text style={styles.errorText}>Region is required.</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.errorText}>No regions available.</Text>
                )}
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
                {shareData.selectedBrokers.length === 0 && !isLoadingBrokers && allBrokers.length > 0 && (
                  <Text style={styles.errorText}>Please select at least one broker.</Text>
                )}
              </View>
            )}

            {/* Share Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Share Notes (Optional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Add any specific instructions or context..."
                  placeholderTextColor="#8E8E93"
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
            </View>

            {/* Action Button */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  (!isFormValid() || isSharing) ? styles.actionButtonDisabled : null
                ]} 
                onPress={handleShareSubmit}
                disabled={isSharing || !isFormValid()}
              >
                {isSharing ? (
                  <View style={styles.buttonLoadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.buttonLoadingText]}>
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
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <View style={styles.modalSearchInputWrapper}>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search brokers..."
                  placeholderTextColor="#8E8E93"
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
    flexGrow: 1,
    paddingBottom: 20,
  },
  singlePageForm: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 0,
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
  inputGroup: {
    marginBottom: 16,
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
    fontSize: 16,
    color: '#000000',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#8E8E93',
    borderColor: '#E0E0E0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
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
  chipSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#E5E5EA',
  },
  chipText: {
    fontSize: 14,
    color: '#000000',
  },
  chipTextSelected: {
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
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoadingText: {
    marginLeft: 8,
  },
})

export default ShareLeadScreen

