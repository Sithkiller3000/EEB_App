import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeightWebSocket from '../services/WeightWebSocket';

export default function MotivationScreen() {
  const [isExercising, setIsExercising] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Getrennt');
  const [motivationMessage, setMotivationMessage] = useState('Bereit für deine Rehabilitation!');
  const [weightHistory, setWeightHistory] = useState([]);
  const [sensorType, setSensorType] = useState('foot'); // 'hand' or 'foot'
  const [leftFootWeight, setLeftFootWeight] = useState(0);
  const [rightFootWeight, setRightFootWeight] = useState(0);
  const [handWeight, setHandWeight] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Motivational messages for hand exercises (should be low weight)
  const handMotivationalMessages = [
    "Entspanne deine Hand! Weniger Druck ist besser!",
    "Perfekt! Halte deine Hand locker und entspannt!",
    "Sanfte Berührung - genau richtig für die Heilung!",
    "Großartig! Minimaler Druck fördert die Durchblutung!",
    "Leichte Berührung - deine Hand erholt sich optimal!",
    "Entspannt bleiben! Zu viel Druck kann schaden!",
    "Wunderbar! Diese sanfte Haltung unterstützt die Heilung!"
  ];

  // Motivational messages for foot exercises (should be equal weight distribution)
  const footMotivationalMessages = [
    "Perfekte Balance! Beide Füße tragen gleichmäßig!",
    "Ausgezeichnet! Deine Gewichtsverteilung ist optimal!",
    "Großartig! Du stehst stabil und ausgeglichen!",
    "Fantastisch! Beide Beine arbeiten gleichmäßig zusammen!",
    "Perfekte Haltung! Das Gewicht ist ideal verteilt!",
    "Wunderbar! Deine Balance wird immer besser!",
    "Exzellent! Du trägst dein Gewicht gleichmäßig auf beiden Füßen!"
  ];

  // Warning messages for incorrect posture
  const warningMessages = {
    hand: [
      "Vorsicht! Zu viel Druck auf die verletzte Hand!",
      "Entspanne deine Hand - weniger Belastung ist besser!",
      "Achtung! Reduziere den Druck für optimale Heilung!"
    ],
    foot: [
      "Ungleiche Gewichtsverteilung! Versuche beide Füße gleichmäßig zu belasten!",
      "Zu wenig Gewicht! Versuche mehr auf beide Füße zu stützen!",
      "Einseitige Belastung erkannt! Verteile dein Gewicht gleichmäßiger!"
    ]
  };

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
          // Motivationsnachricht alle 15 Sekunden ändern basierend auf Sensortyp
          if (newTimer % 15 === 0) {
            updateMotivationMessage();
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
  }, [isExercising, sensorType, leftFootWeight, rightFootWeight, handWeight]);

  const updateMotivationMessage = () => {
    if (sensorType === 'hand') {
      // Hand exercises: lower weight is better
      if (handWeight < 2) {
        const randomMessage = handMotivationalMessages[
          Math.floor(Math.random() * handMotivationalMessages.length)
        ];
        setMotivationMessage(randomMessage);
      } else {
        const randomWarning = warningMessages.hand[
          Math.floor(Math.random() * warningMessages.hand.length)
        ];
        setMotivationMessage(randomWarning);
      }
    } else {
      // Foot exercises: equal weight distribution is better
      const totalWeight = leftFootWeight + rightFootWeight;
      const weightDifference = Math.abs(leftFootWeight - rightFootWeight);
      
      if (totalWeight > 30 && weightDifference < 5) {
        // Good weight distribution
        const randomMessage = footMotivationalMessages[
          Math.floor(Math.random() * footMotivationalMessages.length)
        ];
        setMotivationMessage(randomMessage);
      } else {
        // Poor weight distribution or too little weight
        const randomWarning = warningMessages.foot[
          Math.floor(Math.random() * warningMessages.foot.length)
        ];
        setMotivationMessage(randomWarning);
      }
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
    setMotivationMessage('Gewichtssensor erfolgreich verbunden!');
  };

  const handleWebSocketDisconnected = () => {
    setIsConnected(false);
    setConnectionStatus('Getrennt');
    setMotivationMessage('Verbindung zum Gewichtssensor verloren...');
  };

  const handleWeightData = (data) => {
    setCurrentWeight(data.weight);
    
    // Simulate different sensor inputs based on sensor type
    // In real implementation, you would receive data for different sensors
    if (sensorType === 'hand') {
      setHandWeight(data.weight);
    } else {
      // For foot sensors, simulate left and right foot weights
      // In real implementation, you would receive separate sensor data
      setLeftFootWeight(data.weight * 0.5 + (Math.random() - 0.5) * 5);
      setRightFootWeight(data.weight * 0.5 + (Math.random() - 0.5) * 5);
    }
    
    setWeightHistory(prev => {
      const newHistory = [...prev, data];
      return newHistory.slice(-100);
    });
    
    // Real-time feedback during exercise
    if (isExercising) {
      updateMotivationMessage();
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
      Alert.alert('Verbindungsfehler', 'Kann nicht mit dem Gewichtssensor verbinden. Bitte überprüfe deine Raspberry Pi Verbindung.');
      return;
    }

    try {
      await WeightWebSocket.startMeasuring();
      setIsExercising(true);
      setTimer(0);
      
      if (sensorType === 'hand') {
        setMotivationMessage("Hand-Übung gestartet! Halte deine Hand entspannt und locker!");
      } else {
        setMotivationMessage("Fuß-Übung gestartet! Stelle dich auf beide Sensoren und verteile dein Gewicht gleichmäßig!");
      }
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
      Alert.alert('Erfolg', 'Waage wurde genullt');
    } catch (error) {
      Alert.alert('Fehler', `Waage konnte nicht genullt werden: ${error.message}`);
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

  const getSensorStatusColor = () => {
    if (sensorType === 'hand') {
      return handWeight < 2 ? '#4CAF50' : '#E74C3C';
    } else {
      const weightDifference = Math.abs(leftFootWeight - rightFootWeight);
      const totalWeight = leftFootWeight + rightFootWeight;
      return (totalWeight > 30 && weightDifference < 5) ? '#4CAF50' : '#FF9800';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Sensor Type Selection */}
        <View style={styles.sensorTypeCard}>
          <Text style={styles.sensorTypeTitle}>Sensor-Typ auswählen</Text>
          <View style={styles.sensorTypeButtons}>
            <TouchableOpacity 
              style={[styles.sensorTypeButton, sensorType === 'hand' && styles.activeSensorType]}
              onPress={() => setSensorType('hand')}
            >
              <Ionicons name="hand-left" size={20} color={sensorType === 'hand' ? 'white' : '#4A90E2'} />
              <Text style={[styles.sensorTypeText, sensorType === 'hand' && styles.activeSensorTypeText]}>
                Hand
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sensorTypeButton, sensorType === 'foot' && styles.activeSensorType]}
              onPress={() => setSensorType('foot')}
            >
              <Ionicons name="footsteps" size={20} color={sensorType === 'foot' ? 'white' : '#4A90E2'} />
              <Text style={[styles.sensorTypeText, sensorType === 'foot' && styles.activeSensorTypeText]}>
                Fuß
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Status */}
        <View style={[styles.statusCard, { backgroundColor: `${getConnectionColor()}20` }]}>
          <Ionicons 
            name={getConnectionIcon()} 
            size={20} 
            color={getConnectionColor()} 
          />
          <Text style={[styles.statusText, { color: getConnectionColor() }]}>
            Gewichtssensor: {connectionStatus}
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

        {/* Weight Display */}
        {sensorType === 'hand' ? (
          <View style={styles.weightCard}>
            <Text style={styles.weightTitle}>Hand-Sensor</Text>
            <Text style={[styles.weightValue, { color: getSensorStatusColor() }]}>
              {handWeight.toFixed(1)} kg
            </Text>
            <Text style={styles.weightSubtitle}>
              {handWeight < 2 ? '✓ Optimal entspannt' : '⚠ Zu viel Druck'}
            </Text>
          </View>
        ) : (
          <View style={styles.weightCard}>
            <Text style={styles.weightTitle}>Fuß-Sensoren</Text>
            <View style={styles.footWeightContainer}>
              <View style={styles.footWeight}>
                <Text style={styles.footLabel}>Linker Fuß</Text>
                <Text style={[styles.weightValue, { fontSize: 24 }]}>
                  {leftFootWeight.toFixed(1)} kg
                </Text>
              </View>
              <View style={styles.footWeight}>
                <Text style={styles.footLabel}>Rechter Fuß</Text>
                <Text style={[styles.weightValue, { fontSize: 24 }]}>
                  {rightFootWeight.toFixed(1)} kg
                </Text>
              </View>
            </View>
            <Text style={[styles.weightSubtitle, { color: getSensorStatusColor() }]}>
              Differenz: {Math.abs(leftFootWeight - rightFootWeight).toFixed(1)} kg
            </Text>
          </View>
        )}

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
              <Text style={styles.buttonText}>
                {sensorType === 'hand' ? 'Hand-Übung starten' : 'Fuß-Übung starten'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
              <Ionicons name="stop" size={24} color="white" />
              <Text style={styles.buttonText}>Session beenden</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Exercise Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>
            💡 {sensorType === 'hand' ? 'Hand-Übungstipps' : 'Fuß-Übungstipps'}
          </Text>
          {sensorType === 'hand' ? (
            <>
              <Text style={styles.tipText}>• Halte deine Hand entspannt und locker</Text>
              <Text style={styles.tipText}>• Minimaler Druck fördert die Heilung</Text>
              <Text style={styles.tipText}>• Vermeide starke Belastung der verletzten Hand</Text>
              <Text style={styles.tipText}>• Sanfte Berührung ist optimal</Text>
            </>
          ) : (
            <>
              <Text style={styles.tipText}>• Verteile dein Gewicht gleichmäßig auf beide Füße</Text>
              <Text style={styles.tipText}>• Halte eine stabile, aufrechte Haltung</Text>
              <Text style={styles.tipText}>• Nutze beide Beine gleichmäßig</Text>
              <Text style={styles.tipText}>• Achte auf eine ausgewogene Balance</Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sensorTypeCard: {
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
  sensorTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sensorTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sensorTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: 'white',
  },
  activeSensorType: {
    backgroundColor: '#4A90E2',
  },
  sensorTypeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  activeSensorTypeText: {
    color: 'white',
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
  weightCard: {
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
  weightTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  weightSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footWeightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  footWeight: {
    alignItems: 'center',
  },
  footLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  },
  stopButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
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
  tipsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
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
