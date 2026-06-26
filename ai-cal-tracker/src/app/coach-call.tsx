import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { saveCoachCheckIn } from '../services/userService';
import { colors } from '../constants/Colors';

type Message = { role: 'user' | 'model'; parts: { text: string }[] };

export default function CoachCallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const shortfall = Number(params.shortfall) || 0;
  const calories = Number(params.calories) || 0;
  const target = Number(params.target) || 0;
  
  const [callState, setCallState] = useState<'connecting' | 'active' | 'summarizing' | 'ended'>('connecting');
  const [history, setHistory] = useState<Message[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [transcriptDisplay, setTranscriptDisplay] = useState<string>("Connecting to Coach AI...");
  
  const recognitionRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initialize speech recognition for web
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setInputText(finalTranscript);
            sendMessage(finalTranscript);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (e: any) => {
          console.error("Speech recognition error", e);
          setIsListening(false);
        };
      }
    }

    // Start initial conversation
    startCall();
    
    return () => {
      stopTTS();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startCall = async () => {
    setCallState('active');
    await sendMessage("Hello coach, I'm ready for my check-in.", true);
  };

  const speakText = (text: string) => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      window.speechSynthesis.cancel(); // cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopTTS = () => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      Alert.alert("Voice Not Supported", "Voice recognition is only supported on Web in this prototype. Please use text input.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopTTS();
      setInputText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async (text: string, isInitial: boolean = false) => {
    if (!text.trim()) return;
    
    stopTTS();
    const currentHistory = [...history];
    
    if (!isInitial) {
      currentHistory.push({ role: 'user', parts: [{ text }] });
      setHistory(currentHistory);
      setInputText("");
    }
    
    setTranscriptDisplay("Coach is thinking...");
    
    try {
      const response = await fetch('/api/check-in/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          history: currentHistory,
          shortfall,
          calories,
          target,
          message: text
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');
      
      const aiText = data.response;
      setTranscriptDisplay(aiText);
      speakText(aiText);
      
      setHistory([...currentHistory, { role: 'model', parts: [{ text: aiText }] }]);
    } catch (err: any) {
      console.error(err);
      setTranscriptDisplay("Connection issue. Let's try again.");
    }
  };

  const endCallAndSummarize = async () => {
    setCallState('summarizing');
    stopTTS();
    
    if (!userId) {
      setCallState('ended');
      return;
    }

    try {
      const response = await fetch('/api/check-in/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          history,
        })
      });
      
      const data = await response.json();
      const summary = data.summary || "Conversation summarized successfully.";

      // Save to Firebase
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const dateString = localToday.toISOString().split("T")[0];

      await saveCoachCheckIn({
        userId,
        date: dateString,
        caloriesShortfall: shortfall,
        transcriptSummary: summary,
        userFeedbackNotes: "User ended call.",
        status: "Needs Attention" // Default for manual review by admin
      });
      
    } catch (err) {
      console.error("Summary failed", err);
    } finally {
      setCallState('ended');
    }
  };

  if (callState === 'ended') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.endedTitle}>Check-in Complete</Text>
          <Text style={styles.endedSubtitle}>Your session log has been saved securely.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Health Coach</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.callVisualizer}>
        <View style={[styles.avatarRing, isAiSpeaking && styles.avatarRingActive]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
        </View>
        <Text style={styles.callStatus}>
          {callState === 'connecting' ? 'Connecting...' : callState === 'summarizing' ? 'Saving Log...' : 'Connected'}
        </Text>
        <Text style={styles.shortfallBadge}>{shortfall} kcal off target</Text>
      </View>

      <ScrollView 
        style={styles.transcriptContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={styles.transcriptText}>{transcriptDisplay}</Text>
      </ScrollView>

      {callState === 'active' && (
        <View style={styles.controlsContainer}>
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.textInput}
              placeholder="Type your reply..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <TouchableOpacity 
              style={styles.sendBtn}
              onPress={() => sendMessage(inputText)}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.micBtn, isListening && styles.micBtnActive]} 
              onPress={toggleListening}
            >
              <Ionicons name={isListening ? "mic" : "mic-outline"} size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.endBtn]} onPress={endCallAndSummarize}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {callState === 'summarizing' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Generating session summary...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // slate-900
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  callVisualizer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarRingActive: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#059669', // emerald-600
    alignItems: 'center',
    justifyContent: 'center',
  },
  callStatus: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 24,
  },
  shortfallBadge: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transcriptContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  transcriptText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 34,
  },
  controlsContainer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    backgroundColor: '#334155',
  },
  micBtnActive: {
    backgroundColor: '#3b82f6',
  },
  endBtn: {
    backgroundColor: '#ef4444',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  endedTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  endedSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#10b981',
    marginTop: 16,
    fontSize: 16,
  }
});
