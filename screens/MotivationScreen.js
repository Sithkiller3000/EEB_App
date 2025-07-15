import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Alert,
  ScrollView  // Added ScrollView import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeightWebSocket from '../services/WeightWebSocket';

export default function MotivationScreen() {
  const [isExercising, setIsExercising] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Getrennt');
  const [motivationMessage, setMotivationMessage] = useState('Bereit für deine Rehabilitation!');
  const [weightHistory, setWeightHistory] = useState([]);
  
  // Sensor states based on your data structure
  const [waage1, setWaage1] = useState(0);
  const [waage2, setWaage2] = useState(0);
  const [handTopWeight, setHandTopWeight] = useState(0);    // drucksensoren.sensor1
  const [handFrontWeight, setHandFrontWeight] = useState(0); // drucksensoren.sensor2
  const [handBackWeight, setHandBackWeight] = useState(0);   // drucksensoren.sensor3
  
  // Thresholds - changed increment to 0.1
  const [weightThreshold, setWeightThreshold] = useState(0.05); // Grenzwert für Drucksensoren
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Motivational messages for correct hand positioning
  const correctPositionMessages = [
    "Perfekt! Arbeite aus den Beinen, nicht mit der Hand!",
    "Großartig! Deine Hand ist entspannt - genau richtig!",
    "Exzellent! Du nutzt die richtige Technik!",
    "Wunderbar! Halte diese entspannte Handhaltung!",
    "Fantastisch! Die Kraft kommt aus den Beinen!",
    "Optimal! Deine Hand führt nur, die Beine arbeiten!"
  ];

  // Warning messages for incorrect positioning
  const pullUpWarningMessages = [
    "Nicht hochziehen, aus den Beinen arbeiten!",
    "Entspanne deine Hand! Die Kraft soll aus den Beinen kommen!",
    "Weniger Zug mit der Hand - mehr Druck mit den Beinen!",
    "Achtung! Zu viel Kraft in der Hand - arbeite aus den Beinen!"
  ];

  // Encouragement messages when all sensors are above threshold
  const encouragementMessages = [
    "Du schaffst das! Versuch, deine Hand zu entspannen.",
    "Komm, noch {seconds} Sekunden! Du packst das!",
    "Stark! Aber entspanne deine Hand dabei!",
    "Durchhalten! Weniger Hand, mehr Beine!",
    "Fast geschafft! Hand locker lassen!"
  ];

  useEffect(() => {
    initializeWebSocket();
    startPulseAnimation();
    
    return () => {
      WeightWebSocket.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isExercising) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const newTimer = prev + 1;
          // Update motivation message every 3 seconds during exercise
          if (newTimer % 3 === 0) {
            updateMotivationMessage(newTimer);
          }
          return newTimer;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isExercising, handTopWeight, handFrontWeight, handBackWeight]);

  const updateMotivationMessage = (currentTimer) => {
    // Logic: Hand_oben > Hand_vorne && Hand_hinten -> warning about pulling up
    if (handTopWeight > handFrontWeight && handTopWeight > handBackWeight) {
      const randomWarning = pullUpWarningMessages[
        Math.floor(Math.random() * pullUpWarningMessages.length)
      ];
      setMotivationMessage(randomWarning);
    }
    // Logic: All sensors above threshold -> encouragement with time remaining
    else if (handTopWeight > weightThreshold && handFrontWeight > weightThreshold && handBackWeight > weightThreshold) {
      const remainingSeconds = Math.max(0, 60 - (currentTimer % 60)); // Example: 60 second intervals
      const randomEncouragement = encouragementMessages[
        Math.floor(Math.random() * encouragementMessages.length)
      ].replace('{seconds}', remainingSeconds.toString());
      setMotivationMessage(randomEncouragement);
    }
    // Correct positioning - low hand forces
    else {
      const randomCorrect = correctPositionMessages[
        Math.floor(Math.random() * correctPositionMessages.length)
      ];
      setMotivationMessage(randomCorrect);
    }
  };

  const initializeWebSocket = async () => {
    try {
      WeightWebSocket.on('connected', handleWebSocketConnected);
      WeightWebSocket.on('disconnected', handleWebSocketDisconnected);
      WeightWebSocket.on('weightData', handleWeightData);
      WeightWebSocket.on('serverError', handleServerError);
      
      await WeightWebSocket.connect();
      
    } catch (error) {
      console.error('WebSocket Initialisierung fehlgeschlagen:', error);
      setConnectionStatus('Verbindungsfehler');
    }
  };

  const handleWebSocketConnected = () => {
    setIsConnected(true);
    setConnectionStatus('Verbunden');
    setMotivationMessage('Sensoren erfolgreich verbunden!');
  };

  const handleWebSocketDisconnected = () => {
    setIsConnected(false);
    setConnectionStatus('Getrennt');
    setMotivationMessage('Verbindung zu den Sensoren verloren...');
  };

  const handleWeightData = (data) => {
    // Update sensor values based on your data structure
    setWaage1(data.waage1 || 0);
    setWaage2(data.waage2 || 0);
    setHandTopWeight(data.drucksensoren?.sensor1 || 0);
    setHandFrontWeight(data.drucksensoren?.sensor2 || 0);
    setHandBackWeight(data.drucksensoren?.sensor3 || 0);
    
    setWeightHistory(prev => {
      const newHistory = [...prev, data];
      return newHistory.slice(-100);
    });
    
    // Real-time feedback during exercise
    if (isExercising) {
      updateMotivationMessage(timer);
    }
  };

  const handleServerError = (error) => {
    console.error('Server Fehler:', error);
    Alert.alert('Server Fehler', error.message);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startExercise = async () => {
    if (!isConnected) {
      Alert.alert('Verbindungsfehler', 'Kann nicht mit den Sensoren verbinden. Bitte überprüfe deine Raspberry Pi Verbindung.');
      return;
    }

    try {
      await WeightWebSocket.startMeasuring();
      setIsExercising(true);
      setTimer(0);
      setMotivationMessage("Übung gestartet! Greife den Griff und arbeite aus den Beinen!");
    } catch (error) {
      Alert.alert('Fehler', `Messung konnte nicht gestartet werden: ${error.message}`);
    }
  };

  const stopExercise = async () => {
    try {
      await WeightWebSocket.stopMeasuring();
      setIsExercising(false);
      setMotivationMessage("Großartig! Du hast deine Session abgeschlossen!");
    } catch (error) {
      Alert.alert('Fehler', `Messung konnte nicht gestoppt werden: ${error.message}`);
    }
  };

  const tareScale = async () => {
    try {
      await WeightWebSocket.tareScale();
      Alert.alert('Erfolg', 'Sensoren wurden genullt');
    } catch (error) {
      Alert.alert('Fehler', `Sensoren konnten nicht genullt werden: ${error.message}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionColor = () => {
    if (isConnected) return '#4CAF50';
    if (connectionStatus === 'Verbindungsfehler') return '#E74C3C';
    return '#FF9800';
  };

  const getConnectionIcon = () => {
    if (isConnected) return 'checkmark-circle';
    if (connectionStatus === 'Verbindungsfehler') return 'alert-circle';
    return 'time';
  };

  const getSensorColor = (weight) => {
    if (weight > weightThreshold) return '#E74C3C'; // Red for high force
    if (weight > weightThreshold * 0.5) return '#FF9800'; // Orange for medium force
    return '#4CAF50'; // Green for low force
  };

  const getOverallStatus = () => {
    if (handTopWeight > handFrontWeight && handTopWeight > handBackWeight) {
      return { color: '#E74C3C', text: '⚠ Zu viel Zug nach oben!' };
    }
    if (handTopWeight > weightThreshold && handFrontWeight > weightThreshold && handBackWeight > weightThreshold) {
      return { color: '#FF9800', text: '💪 Hohe Belastung - entspannen!' };
    }
    return { color: '#4CAF50', text: '✓ Optimale Handhaltung' };
  };

  const overallStatus = getOverallStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Connection Status */}
          <View style={[styles.statusCard, { backgroundColor: `${getConnectionColor()}20` }]}>
            <Ionicons 
              name={getConnectionIcon()} 
              size={20} 
              color={getConnectionColor()} 
            />
            <Text style={[styles.statusText, { color: getConnectionColor() }]}>
              Sensoren: {connectionStatus}
            </Text>
            {!isConnected && (
              <TouchableOpacity 
                style={styles.reconnectButton}
                onPress={initializeWebSocket}
              >
                <Text style={styles.reconnectText}>Neu verbinden</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Weight Scales Display */}
          <View style={styles.scalesCard}>
            <Text style={styles.scalesTitle}>Gewichts-Waagen</Text>
            <View style={styles.scalesRow}>
              <View style={styles.scaleItem}>
                <Text style={styles.scaleLabel}>Waage 1</Text>
                <Text style={styles.scaleValue}>{waage1.toFixed(1)} kg</Text>
              </View>
              <View style={styles.scaleItem}>
                <Text style={styles.scaleLabel}>Waage 2</Text>
                <Text style={styles.scaleValue}>{waage2.toFixed(1)} kg</Text>
              </View>
            </View>
          </View>

          {/* Hand Pressure Sensors Display */}
          <View style={styles.sensorsCard}>
            <Text style={styles.sensorsTitle}>Hand-Drucksensoren</Text>
            <View style={styles.sensorsGrid}>
              <View style={styles.sensorItem}>
                <Text style={styles.sensorLabel}>Oben</Text>
                <Text style={[styles.sensorValue, { color: getSensorColor(handTopWeight) }]}>
                  {handTopWeight.toFixed(3)}
                </Text>
              </View>
              <View style={styles.sensorItem}>
                <Text style={styles.sensorLabel}>Vorne</Text>
                <Text style={[styles.sensorValue, { color: getSensorColor(handFrontWeight) }]}>
                  {handFrontWeight.toFixed(3)}
                </Text>
              </View>
              <View style={styles.sensorItem}>
                <Text style={styles.sensorLabel}>Hinten</Text>
                <Text style={[styles.sensorValue, { color: getSensorColor(handBackWeight) }]}>
                  {handBackWeight.toFixed(3)}
                </Text>
              </View>
            </View>
            <Text style={[styles.overallStatus, { color: overallStatus.color }]}>
              {overallStatus.text}
            </Text>
          </View>

          {/* Threshold Setting - Changed to 0.1 increments */}
          <View style={styles.thresholdCard}>
            <Text style={styles.thresholdTitle}>Druckgrenzwert</Text>
            <View style={styles.thresholdControls}>
              <TouchableOpacity 
                style={styles.thresholdButton}
                onPress={() => setWeightThreshold(Math.max(0.1, weightThreshold - 0.1))}
              >
                <Ionicons name="remove" size={20} color="#4A90E2" />
              </TouchableOpacity>
              <Text style={styles.thresholdValue}>{weightThreshold.toFixed(1)}</Text>
              <TouchableOpacity 
                style={styles.thresholdButton}
                onPress={() => setWeightThreshold(weightThreshold + 0.1)}
              >
                <Ionicons name="add" size={20} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Exercise Timer */}
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>Übungszeit</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time" size={24} color="#4A90E2" />
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </View>
          </View>

          {/* Motivation Area */}
          <Animated.View style={[styles.motivationCard, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="heart" size={32} color="#E74C3C" />
            <Text style={styles.motivationText}>{motivationMessage}</Text>
          </Animated.View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            {!isExercising ? (
              <TouchableOpacity 
                style={[styles.startButton, !isConnected && styles.disabledButton]} 
                onPress={startExercise}
                disabled={!isConnected}
              >
                <Ionicons name="play" size={24} color="white" />
                <Text style={styles.buttonText}>Übung starten</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
                <Ionicons name="stop" size={24} color="white" />
                <Text style={styles.buttonText}>Session beenden</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.tareButton} onPress={tareScale}>
              <Ionicons name="refresh" size={20} color="#666" />
              <Text style={styles.tareButtonText}>Sensoren nullen</Text>
            </TouchableOpacity>
          </View>

          {/* Exercise Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Übungstipps</Text>
            <Text style={styles.tipText}>• Greife den Griff locker, nicht verkrampft</Text>
            <Text style={styles.tipText}>• Die Kraft soll aus den Beinen kommen</Text>
            <Text style={styles.tipText}>• Vermeide das Hochziehen mit der Hand</Text>
            <Text style={styles.tipText}>• Hand nur zur Führung nutzen</Text>
            <Text style={styles.tipText}>• Bei Schmerzen sofort aufhören</Text>
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
  },
  content: {
    padding: 16,
    paddingBottom: 32, // Extra padding at bottom for better scrolling
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  reconnectButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  reconnectText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  scalesCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scalesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  scalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scaleItem: {
    alignItems: 'center',
  },
  scaleLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  scaleValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  sensorsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  sensorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  sensorItem: {
    alignItems: 'center',
  },
  sensorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overallStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  thresholdCard: {
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
  thresholdTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  thresholdControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 12,
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    minWidth: 60,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginLeft: 8,
  },
  motivationCard: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  motivationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
    marginTop: 8,
  },
  controlsContainer: {
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  stopButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tareButton: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  tareButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tipsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16, // Added margin for better spacing at bottom
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
