import Toast from 'react-native-toast-message'

export const Snackbar = {
  // Show error message
  showError: (title = 'Error', message) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    })
  },

  // Show success message
  showSuccess: (title = 'Success', message) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    })
  },

  // Show info message
  showInfo: (title = 'Info', message) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    })
  },

  // Show warning message
  showWarning: (title = 'Warning', message) => {
    Toast.show({
      type: 'error', // Using error type for warning as toast-message doesn't have warning type
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    })
  },

  // Show validation error (commonly used for form validation)
  showValidationError: (message) => {
    Toast.show({
      type: 'error',
      text1: 'Required Field',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    })
  },

  // Show API error (commonly used for API responses)
  showApiError: (message) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 5000,
    })
  },

  // Show loading message
  showLoading: (message = 'Loading...') => {
    Toast.show({
      type: 'info',
      text1: 'Please wait',
      text2: message,
      position: 'top',
      visibilityTime: 2000,
    })
  },

  // Hide current toast
  hide: () => {
    Toast.hide()
  }
}

export default Snackbar
