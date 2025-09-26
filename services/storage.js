import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  BROKER_ID: 'broker_id',
  PHONE: 'phone'
}

export const storage = {
  // Save authentication data
  saveAuthData: async (token, phone, brokerId) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        [STORAGE_KEYS.PHONE, phone],
        [STORAGE_KEYS.BROKER_ID, brokerId]
      ])
      console.log('Auth data saved successfully')
    } catch (error) {
      console.error('Error saving auth data:', error)
      throw error
    }
  },

  // Get authentication token
  getToken: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      return token
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },


  // Get broker ID
  getBrokerId: async () => {
    try {
      const brokerId = await AsyncStorage.getItem(STORAGE_KEYS.BROKER_ID)
      return brokerId
    } catch (error) {
      console.error('Error getting broker ID:', error)
      return null
    }
  },

  // Get phone number
  getPhone: async () => {
    try {
      const phone = await AsyncStorage.getItem(STORAGE_KEYS.PHONE)
      return phone
    } catch (error) {
      console.error('Error getting phone:', error)
      return null
    }
  },

  // Clear all authentication data
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.BROKER_ID,
        STORAGE_KEYS.PHONE
      ])
      console.log('Auth data cleared successfully')
    } catch (error) {
      console.error('Error clearing auth data:', error)
      throw error
    }
  }
}

export default storage
