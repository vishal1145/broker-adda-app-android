import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    FlatList,
    Image
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { styles } from '../styles/ChatListScreenStyles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { chatAPI, authAPI, notificationsAPI } from '../services/api'
import { storage } from '../services/storage'


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

    const retry = () => {
        setImageError(false)
        setCurrentSource(source)
    }

    if (imageError) {
        return (
            <View style={[style, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                {fallbackText ? (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280' }}>
                        {fallbackText}
                    </Text>
                ) : (
                    <MaterialIcons name="person" size={24} color="#6B7280" />
                )}
                <TouchableOpacity
                    style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#0D542BFF', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}
                    onPress={retry}
                >
                    <MaterialIcons name="refresh" size={10} color="#FFFFFF" />
                </TouchableOpacity>
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
const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    // Format date
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
}

const ChatListScreen = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [chats, setChats] = useState([])

    // Profile state
    const [userName, setUserName] = useState('User')
    const [userProfile, setUserProfile] = useState(null)
    const [profileImage, setProfileImage] = useState(null)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

    // Fetch user profile data
    const fetchUserProfile = async () => {
        try {
            setIsLoadingProfile(true)
            
            // Get token and broker ID from storage
            const token = await storage.getToken()
            const brokerId = await storage.getBrokerId()
            
            if (token && brokerId) {
                const response = await authAPI.getProfile(brokerId, token)
                
                if (response && response.data && response.data.broker) {
                    const broker = response.data.broker
                    setUserProfile(broker)
                    
                    // Set user name from profile data
                    const name = broker.name || broker.userId?.name || broker.userId?.firstName || 'User'
                    if (name && name !== 'User') {
                        setUserName(name)
                    }
                    
                    // Set profile image if available with secure URL
                    if (broker.brokerImage) {
                        const secureImageUrl = getSecureImageUrl(broker.brokerImage)
                        setProfileImage(secureImageUrl)
                    }
                } else {
                    // No broker data found, keep default 'User'
                    setUserName('User')
                }
            } else {
                // No token or broker ID, keep default 'User'
                setUserName('User')
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            // Keep default name if API fails
            setUserName('User')
        } finally {
            setIsLoadingProfile(false)
        }
    }

    // Fetch unread notification count
    const fetchUnreadNotificationCount = async () => {
        try {
            const token = await storage.getToken()
            
            if (token) {
                const response = await notificationsAPI.getNotifications(token)
                
                if (response && response.success && response.data && response.data.notifications) {
                    // Count unread notifications (where isRead is false)
                    const unreadCount = response.data.notifications.filter(
                        notification => !notification.isRead
                    ).length
                    
                    setUnreadNotificationCount(unreadCount)
                }
            }
        } catch (error) {
            console.error('Error fetching unread notification count:', error)
            setUnreadNotificationCount(0)
        }
    }

    // Handle message press
    const handleMessagePress = () => {
        navigation.navigate('Notifications')
    }

    // Handle profile press
    const handleProfilePress = () => {
        // Navigate to profile screen
        navigation.navigate('Profile')
    }

    const fetchChats = async () => {
        setIsLoading(true)
        try {
            const token = await storage.getToken()

            const response = await chatAPI.getChats(token)
            if (response.success && response.data) {
                setChats(response.data)
            }
        } catch (error) {
            console.error('Error fetching chats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchChats()
        fetchUserProfile()
        fetchUnreadNotificationCount()
    }, [])

    const renderChatItem = ({ item }) => {
        const participant = item.participants[0]
        const brokerImage = participant?.brokerImage
        const imageUrl = brokerImage ? getSecureImageUrl(brokerImage) : null
        const initials = participant?.name ? participant.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
        const isActive = participant?.status === 'active'
        const hasUnread = item.unreadCount > 0
        const lastMessageText = item.lastMessage?.text || item?.lastMessage?.leadCards?.length > 0 ? 'Lead Shared' : 'No messages yet'
        const lastMessageTime = formatTime(item.lastMessage?.createdAt || item.updatedAt)

        return (
            <TouchableOpacity
                style={[styles.chatItem, hasUnread && styles.chatItemActive]}
                onPress={() => {
                        navigation.navigate('MessageScreen', { chatId: item.chatId, participant: participant })
                }}
                activeOpacity={0.7}
            >

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {imageUrl ? (
                        <SafeImage
                            source={{ uri: imageUrl }}
                            style={styles.avatar}
                            resizeMode="cover"
                            fallbackText={initials}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitials}>{initials}</Text>
                        </View>
                    )}
                    {/* Status Indicator */}
                    <View style={[
                        styles.statusIndicator,
                        isActive ? styles.statusActive : styles.statusInactive
                    ]} />
                </View>

                {/* Chat Info */}
                <View style={styles.chatInfo}>
                    {/* Header with name and time */}
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName} numberOfLines={1}>
                            {participant?.name || 'Unknown'}
                        </Text>

                    </View>

                    {/* Firm Name */}
                    <Text style={styles.firmName} numberOfLines={1}>
                        {participant?.firmName || ''}
                    </Text>

                    {/* Last Message */}
                    <Text
                        style={hasUnread ? styles.lastMessageUnread : styles.lastMessage}
                        numberOfLines={1}
                    >
                        {lastMessageText}
                    </Text>

                </View>

                <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Text style={styles.chatTime}>{lastMessageTime}</Text>
                    {hasUnread && (
                        <View style={styles.chatRight}>
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>
                                    {item.unreadCount > 99 ? '99+' : item.unreadCount} 
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        )
    }

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="chat-bubble-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Chats Yet</Text>
            <Text style={styles.emptyMessage}>
                Start a conversation with your contacts
            </Text>
        </View>
    )

    return (
        <SafeAreaView style={styles.wrapper} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0D542BFF" />
            <View style={styles.container}>
                {/* Modern Header */}
                <View style={styles.modernHeader}>
                    {/* Background Pattern */}
                    <View style={styles.headerPattern}>
                        <View style={styles.patternCircle1} />
                        <View style={styles.patternCircle2} />
                        <View style={styles.patternCircle3} />
                    </View>
                    
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={styles.welcomeContainer}>
                                <Text style={styles.welcomeGreeting}>Manage Your Chats</Text>
                                <Text style={styles.welcomeName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.profileButton} onPress={handleMessagePress}>
                                <View style={styles.notificationIconContainer}>
                                    <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                                    {unreadNotificationCount > 0 && (
                                        <View style={[
                                            styles.notificationBadge,
                                            unreadNotificationCount > 9 && styles.notificationBadgeWide
                                        ]}>
                                            <Text style={styles.notificationBadgeText} numberOfLines={1} ellipsizeMode="clip">
                                                {unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                                <View style={styles.profileImageContainer}>
                                    {profileImage ? (
                                        <SafeImage 
                                            source={{ uri: profileImage }} 
                                            style={styles.profileImage}
                                            imageType="profileImage"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.profileInitialsContainer}>
                                            <Text style={styles.profileInitials}>
                                                {(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Chat List */}
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.chatId}
                    renderItem={renderChatItem}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={chats.length === 0 ? { flex: 1 } : {}}
                />
            </View>
        </SafeAreaView>
    )
}

export default ChatListScreen