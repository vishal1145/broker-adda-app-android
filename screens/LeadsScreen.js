import React, { useState } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const LeadsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  // Sample leads data
  const [leadsData] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 123-4567',
      property: 'Downtown Luxury Condo',
      budget: '$850,000',
      status: 'new',
      priority: 'high',
      source: 'Website',
      createdDate: '2024-01-15',
      lastContact: '2 hours ago',
      notes: 'Looking for 2BR condo in downtown area',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'm.chen@email.com',
      phone: '+1 (555) 987-6543',
      property: 'Suburban Family Home',
      budget: '$650,000',
      status: 'in-progress',
      priority: 'medium',
      source: 'Referral',
      createdDate: '2024-01-12',
      lastContact: '1 day ago',
      notes: 'Family with 2 kids, needs good school district',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      phone: '+1 (555) 456-7890',
      property: 'Beachfront Villa',
      budget: '$1,200,000',
      status: 'qualified',
      priority: 'high',
      source: 'Social Media',
      createdDate: '2024-01-10',
      lastContact: '3 days ago',
      notes: 'Investment property, cash buyer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 4,
      name: 'David Thompson',
      email: 'david.t@email.com',
      phone: '+1 (555) 321-0987',
      property: 'Modern Townhouse',
      budget: '$450,000',
      status: 'closed',
      priority: 'low',
      source: 'Cold Call',
      createdDate: '2024-01-08',
      lastContact: '1 week ago',
      notes: 'First-time buyer, pre-approved',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    }
  ])

  const filterOptions = [
    { key: 'all', label: 'All Leads', count: leadsData.length },
    { key: 'new', label: 'New', count: leadsData.filter(lead => lead.status === 'new').length },
    { key: 'in-progress', label: 'In Progress', count: leadsData.filter(lead => lead.status === 'in-progress').length },
    { key: 'qualified', label: 'Qualified', count: leadsData.filter(lead => lead.status === 'qualified').length },
    { key: 'closed', label: 'Closed', count: leadsData.filter(lead => lead.status === 'closed').length }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3B82F6'
      case 'in-progress': return '#F59E0B'
      case 'qualified': return '#10B981'
      case 'closed': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return 'fiber-new'
      case 'in-progress': return 'trending-up'
      case 'qualified': return 'check-circle'
      case 'closed': return 'done'
      default: return 'help'
    }
  }

  const filteredLeads = selectedFilter === 'all' 
    ? leadsData 
    : leadsData.filter(lead => lead.status === selectedFilter)

  const LeadCard = ({ lead }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadAvatarContainer}>
          <View style={styles.leadAvatar}>
            <Text style={styles.leadAvatarText}>{lead.name.charAt(0)}</Text>
          </View>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(lead.priority) }]} />
        </View>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{lead.name}</Text>
          <Text style={styles.leadProperty}>{lead.property}</Text>
          <Text style={styles.leadBudget}>{lead.budget}</Text>
        </View>
        <View style={styles.leadActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '20' }]}>
            <MaterialIcons name={getStatusIcon(lead.status)} size={16} color={getStatusColor(lead.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
              {lead.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.leadDetails}>
        <View style={styles.leadDetailRow}>
          <MaterialIcons name="email" size={16} color="#6B7280" />
          <Text style={styles.leadDetailText}>{lead.email}</Text>
        </View>
        <View style={styles.leadDetailRow}>
          <MaterialIcons name="phone" size={16} color="#6B7280" />
          <Text style={styles.leadDetailText}>{lead.phone}</Text>
        </View>
        <View style={styles.leadDetailRow}>
          <MaterialIcons name="source" size={16} color="#6B7280" />
          <Text style={styles.leadDetailText}>Source: {lead.source}</Text>
        </View>
        <View style={styles.leadDetailRow}>
          <MaterialIcons name="schedule" size={16} color="#6B7280" />
          <Text style={styles.leadDetailText}>Last contact: {lead.lastContact}</Text>
        </View>
      </View>

      <View style={styles.leadNotes}>
        <Text style={styles.notesText}>{lead.notes}</Text>
      </View>

      <View style={styles.leadFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="call" size={18} color="#16BCC0" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="email" size={18} color="#16BCC0" />
          <Text style={styles.actionButtonText}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="edit" size={18} color="#16BCC0" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.headerTitle}>Leads Management</Text>
              <Text style={styles.headerSubtitle}>Track and manage your leads</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{leadsData.length}</Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="fiber-new" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{leadsData.filter(lead => lead.status === 'new').length}</Text>
                <Text style={styles.statLabel}>New Leads</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{leadsData.filter(lead => lead.status === 'in-progress').length}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>{leadsData.filter(lead => lead.status === 'qualified').length}</Text>
                <Text style={styles.statLabel}>Qualified</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.key && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === filter.key && styles.filterTabTextActive
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterBadge,
                  selectedFilter === filter.key && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.key && styles.filterBadgeTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Leads List */}
        <View style={styles.leadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leads ({filteredLeads.length})</Text>
            <TouchableOpacity style={styles.sortButton}>
              <MaterialIcons name="sort" size={20} color="#16BCC0" />
              <Text style={styles.sortText}>Sort</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <LeadCard lead={item} />}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },

  // Header Styles
  modernHeader: {
    backgroundColor: '#16BCC0',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  patternCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 100,
    left: -20,
  },
  patternCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 20,
    right: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#16BCC0',
    borderColor: '#16BCC0',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Leads Section
  leadsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16BCC0',
    marginLeft: 4,
  },

  // Lead Card Styles
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leadAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16BCC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priorityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  leadProperty: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  leadBudget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16BCC0',
  },
  leadActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadDetails: {
    marginBottom: 12,
  },
  leadDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  leadDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  leadNotes: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  leadFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16BCC0',
  },
})

export default LeadsScreen
