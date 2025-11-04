import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { io } from 'socket.io-client'
import { styles } from '../styles/MessageScreenStyles'
import { chatAPI } from '../services/api'
import { storage } from '../services/storage'
import { SafeAreaView } from 'react-native-safe-area-context'


// Helper function to handle image URLs
const getSecureImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  return url
}

// Enhanced image component with fallback
const SafeImage = ({ source, style, fallbackText, ...props }) => {
  const [imageError, setImageError] = useState(false)
  const [currentSource, setCurrentSource] = useState(source)

  const handleError = () => {
    if (currentSource?.uri?.startsWith('https://')) {
      const httpUrl = currentSource.uri.replace('https://', 'http://')
      setCurrentSource({ uri: httpUrl })
      setImageError(false)
    } else {
      setImageError(true)
    }
  }

  if (imageError) {
    return (
      <View style={[style, { backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }]}>
        {fallbackText ? (
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#065F46' }}>
            {fallbackText}
          </Text>
        ) : (
          <MaterialIcons name="person" size={20} color="#065F46" />
        )}
      </View>
    )
  }

  return (
    <Image
      source={currentSource}
      style={style}
      onError={handleError}
      {...props}
    />
  )
}

// Format time helper
const formatMessageTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${month} ${day}, ${time}`
}

// Format budget helper
const formatBudget = (amount) => {
  if (!amount) return '$0'
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

// Lead Card Component
const LeadCard = ({ lead }) => {
  return (
    <View style={styles.leadCard}>
      <View style={styles.leadCardHeader}>
        <View style={styles.leadCardIcon}>
          <MaterialIcons name="person" size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.leadCardTitle}>Lead Information</Text>
      </View>
      <View style={styles.leadCardContent}>
        <View style={styles.leadCardRow}>
          <Text style={styles.leadCardLabel}>Name:</Text>
          <Text style={styles.leadCardValue}>{lead.customerName || 'N/A'}</Text>
        </View>
        <View style={styles.leadCardRow}>
          <Text style={styles.leadCardLabel}>Phone:</Text>
          <Text style={styles.leadCardValue}>{lead.customerPhone || 'N/A'}</Text>
        </View>
        {lead.budget && (
          <View style={styles.leadCardRow}>
            <Text style={styles.leadCardLabel}>Budget:</Text>
            <Text style={styles.leadCardValue}>{formatBudget(lead.budget)}</Text>
          </View>
        )}
        {lead.status && (
          <View style={styles.leadCardRow}>
            <Text style={styles.leadCardLabel}>Status:</Text>
            <View style={styles.leadCardStatus}>
              <Text style={styles.leadCardStatusText}>{lead.status}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

// Message Component
const MessageItem = ({ message, isMyMessage }) => {
  const hasLeadCard = message.leadCards && message.leadCards.length > 0
  const hasText = message.text && message.text.trim().length > 0

  return (
    <View style={[styles.messageWrapper, isMyMessage ? styles.messageWrapperMy : styles.messageWrapperOther]}>
      <View style={[styles.messageContent, isMyMessage ? styles.messageContentMy : styles.messageContentOther]}>
        {hasText && (
          <Text style={[styles.messageText, isMyMessage && styles.messageTextMy]}>
            {message.text}
          </Text>
        )}
        
        {hasLeadCard && message.leadCards.map((lead, index) => (
          <LeadCard key={index} lead={lead} />
        ))}

        <View style={styles.messageTime}>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.messageTimeMy : styles.messageTimeOther
          ]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  )
}

const MessageScreen = ({ navigation, route }) => {
  const { chatId, participant } = route.params
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const flatListRef = useRef(null)
  const socketRef = useRef(null)
  const [typing, setTyping] = useState(false)
  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = await storage.getToken()
        const userId = await storage.getUserId() || await storage.getBrokerId()

        if (!token || !userId) {
          console.error('Token or User ID not found')
          return
        }

        setCurrentUserId(userId)

        const socketUrl = 'https://broker-adda-be.algofolks.com'//config.API_BASE_URL.replace(/^https?:\/\//, '').replace(/^http:\/\//, '')
        
        socketRef.current = io(socketUrl, {
          auth: {
            token: token,
            userId: userId
          },
        })

        console.log('socketRef.current running')

        socketRef.current.on('typing', ({ userId, isTyping }) => {
          console.log('typing event received')
          setTyping(isTyping ? userId : false);
          setTimeout(() => {
            setTyping(false);
          }, 5000);
        });

        socketRef.current.on('message', (message) => {
          setMessages(prev => [...prev, message].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          ))
        })
      } catch (error) {
        console.error('Error initializing socket:', error)
      }
    }

    initializeSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [chatId])

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        // Scroll to bottom when keyboard opens
        setTimeout(() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true })
          }
        }, 100)
      }
    )

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      }
    )

    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, [messages.length])

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const token = await storage.getToken()
      if (token && chatId) {
        const response = await chatAPI.getMessages(chatId, token)
        if (response && response.success && response.messages) {
          // Sort messages by createdAt (oldest first)
          const sortedMessages = [...response.messages].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          )
          setMessages(sortedMessages)
          
          // Scroll to bottom after messages load
          setTimeout(() => {
            if (flatListRef.current && sortedMessages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false })
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [chatId])

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !socketRef.current) return

    const message = messageText.trim()
    setMessageText('')

    const messageData = {
      chatId,
      to: participant._id,
      text: message,
      attachments: [],
      leadCards: []
    }

    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', messageData)
        // Add message optimistically to UI
        const optimisticMessage = {
          _id: `temp_${Date.now()}`,
          chatId,
          from: currentUserId,
          to: participant._id,
          text: message,
          attachments: [],
          leadCards: [],
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, optimisticMessage].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        ))
        
        // Scroll to bottom
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true })
          }
        }, 100)
      } else {
        console.error('Socket not connected')
        setMessageText(message)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessageText(message)
    }
  }

  const renderMessage = ({ item }) => {
    const isMyMessage = item.from === currentUserId
    return <MessageItem message={item} isMyMessage={isMyMessage} />
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>
        Start the conversation by sending a message
      </Text>
    </View>
  )

  // Get participant info
  const participantName = participant?.name || 'Unknown'
  const participantFirm = participant?.firmName || ''
  const participantImage = participant?.brokerImage
  const participantStatus = participant?.status || 'inactive'
  const initials = participantName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const imageUrl = participantImage ? getSecureImageUrl(participantImage) : null

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#009689" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          {imageUrl ? (
            <SafeImage 
              source={{ uri: imageUrl }}
              style={styles.headerAvatar}
              resizeMode="cover"
              fallbackText={initials}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>{initials}</Text>
            </View>
          )}
          
          <View style={styles.headerText}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerName} numberOfLines={1}>
                {participantName}
              </Text>
              <View style={[styles.statusIndicator, participantStatus === 'active' ? styles.statusActive : styles.statusInactive]} />
            </View>
            {participantFirm ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {participantFirm}
              </Text>
            ) : null}
            {typing && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                typing...
              </Text>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages List */}
        <View style={styles.messagesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0D542BFF" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderMessage}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                if (flatListRef.current && messages.length > 0) {
                  flatListRef.current.scrollToEnd({ animated: true })
                }
              }}
            />
          )}
        </View>

        {/* Input Container */}
        <View style={[
          styles.inputContainer,
          Platform.OS === 'android' && keyboardHeight > 0 && { 
            paddingBottom: keyboardHeight + 12 
          }
        ]}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={() => {
              console.log('Attachment pressed')
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="attach-file" size={28} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              onChange={(e) => { setMessageText(e.target.value); socketRef.current.emit('typing', { chatId, isTyping: true }); }}
              onFocus={() => {
                setTimeout(() => {
                  if (flatListRef.current && messages.length > 0) {
                    flatListRef.current.scrollToEnd({ animated: true })
                  }
                }, 300)
              }}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim()) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            activeOpacity={0.7}
          >
              <MaterialIcons name="send" size={24} color="#FFFFFF" />
            
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default MessageScreen
