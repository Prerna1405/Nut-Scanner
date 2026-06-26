import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { getAllCoachCheckIns, updateCoachCheckInStatus, CoachCheckIn } from '../services/userService';

export default function AdminCoachLogsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [logs, setLogs] = useState<CoachCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCoachCheckIns();
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Needs Attention' ? 'Reviewed' : 'Needs Attention';
    try {
      await updateCoachCheckInStatus(id, newStatus);
      Alert.alert('Status Updated', `Log marked as ${newStatus}.`);
      fetchLogs(); // refresh
    } catch (error) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Coach Check-ins</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          {logs.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No check-in logs found.</Text>
            </View>
          ) : (
            logs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View>
                    <Text style={styles.logDate}>{new Date(log.createdAt).toLocaleString()}</Text>
                    <Text style={styles.logUserId}>User: {log.userId.slice(0, 10)}...</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.statusBadge, log.status === 'Needs Attention' ? styles.statusWarning : styles.statusSuccess]}
                    onPress={() => log.id && handleUpdateStatus(log.id, log.status)}
                  >
                    <Text style={[styles.statusText, log.status === 'Needs Attention' ? styles.statusWarningText : styles.statusSuccessText]}>
                      {log.status}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.shortfallBox}>
                  <Ionicons name="warning" size={16} color="#ef4444" />
                  <Text style={styles.shortfallText}>Missed Target by {log.caloriesShortfall} kcal</Text>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.sectionTitle}>AI Summary</Text>
                  <Text style={styles.summaryText}>{log.transcriptSummary}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  logUserId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusWarning: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusWarningText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  statusSuccess: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusSuccessText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  shortfallBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  shortfallText: {
    marginLeft: 8,
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  }
});
