import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Welcome section with greeting and motivational message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Willkommen zurück!</Text>
          <Text style={styles.subtitleText}>Bereit für deine heutige Reha-Einheit?</Text>
        </View>

        {/* Daily progress tracker showing completed exercises and active time */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Heutiger Fortschritt</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.progressText}>3/5 Übungen</Text>
            </View>
            <View style={styles.progressItem}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <Text style={styles.progressText}>25 Min aktiv</Text>
            </View>
          </View>
        </View>

        {/* Quick action buttons for common tasks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schnellaktionen</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Motivation')}
            >
              <Ionicons name="play-circle" size={32} color="#4A90E2" />
              <Text style={styles.actionText}>Übung starten</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="calendar" size={32} color="#4A90E2" />
              <Text style={styles.actionText}>Planen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="stats-chart" size={32} color="#4A90E2" />
              <Text style={styles.actionText}>Fortschritt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="medical" size={32} color="#4A90E2" />
              <Text style={styles.actionText}>Gesundheitslog</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent activity history */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Letzte Aktivitäten</Text>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.activityText}>Armdehnungen abgeschlossen – vor 2 Std.</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.activityText}>Balance-Übungen beendet – gestern</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#4A90E2',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
});
