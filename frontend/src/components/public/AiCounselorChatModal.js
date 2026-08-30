import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { sendChatMessage } from '../../services/endpoints';
import { theme } from '../../theme';

const INITIAL_GREETING = {
  id: 'greeting-0',
  sender: 'ai',
  text: "Hi! 👋 I'm Morph Academy's AI Counselor. I can help you choose the right 3D/VFX course, check fees & 0% EMI options, understand batch timings, or connect you with our studio faculty!",
  timestamp: 'Just now',
};

const QUICK_ACTIONS = [
  '🎬 3D Animation & VFX Courses',
  '💰 Course Fees & 0% EMI',
  '🎮 Unreal Engine 5 Game Art',
  '💼 100% Placement & Showreels',
];

export function AiCounselorChatModal({ visible, onClose, onOpenEnquiry }) {
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, messages]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loading) return;

    // Auto-detect 10-digit Indian phone number from chat message
    const phoneMatch = textToSend.match(/(?:\+91|0)?[6-9]\d{9}/);
    let currentPhone = visitorPhone;
    if (phoneMatch && !visitorPhone) {
      currentPhone = phoneMatch[0];
      setVisitorPhone(currentPhone);
    }

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: textToSend,
        name: visitorName.trim() || undefined,
        phone: currentPhone || undefined,
      });

      const responseData = response.data || response;
      const aiReply = responseData.reply || "Thank you for your question. How else can I assist your creative career journey?";
      const leadCaptured = Boolean(responseData.lead_captured);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        leadCaptured,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // Smart Instant Studio Knowledge Fallback
      const lower = textToSend.toLowerCase();
      let fallbackText = "Morph Academy is Chandigarh's premier creative technology & animation institute offering masterclasses in 3D Animation, Cinematic VFX, Unreal Engine 5 Game Design, and Graphic Design. We offer 100% placement assistance and 0% interest EMI plans!";

      if (lower.includes('fee') || lower.includes('cost') || lower.includes('emi') || lower.includes('price')) {
        fallbackText = "💰 Morph Academy course fees range from ₹45,000 to ₹1,20,000 depending on the program (Certificate, Diploma, or Masterclass). We offer 3, 6, and 12-month 0% interest EMI installment plans with zero hidden charges. Would you like our counselor to share the exact fee brochure on WhatsApp?";
      } else if (lower.includes('3d') || lower.includes('animation') || lower.includes('maya') || lower.includes('blender')) {
        fallbackText = "🎬 Our 3D Character Animation program covers Autodesk Maya, Blender, ZBrush, character rigging, facial lip-sync, and photorealistic rendering. Graduates build studio-ready showreels for gaming and film studios.";
      } else if (lower.includes('vfx') || lower.includes('compositing') || lower.includes('nuke') || lower.includes('houdini')) {
        fallbackText = "💥 The Cinematic VFX & Compositing Masterclass trains you in Foundry Nuke, Houdini pyro/fluid simulations, green-screen chroma keying, and multi-pass CGI integration. We have an on-campus chroma studio for live shoots!";
      } else if (lower.includes('game') || lower.includes('unreal') || lower.includes('unity')) {
        fallbackText = "🎮 The Unreal Engine 5 Game Art program trains you in real-time environment creation, Blueprint visual scripting, Nanite, Lumen lighting, and interactive VR development.";
      } else if (lower.includes('placement') || lower.includes('job') || lower.includes('salary') || lower.includes('hiring')) {
        fallbackText = "💼 Morph Academy provides 100% Placement Assistance! Our students are hired at top studios including Ubisoft, Rockstar Games, DNEG, Red Chillies VFX, Technicolor, and MPC Film with dedicated portfolio mentorship.";
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        leadCaptured: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.chatCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>🤖</Text>
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Morph AI Counselor</Text>
                <Text style={styles.headerSubtitle}>24/7 Studio & Admissions Guide</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubbleWrapper,
                  msg.sender === 'user' ? styles.userBubbleWrapper : styles.aiBubbleWrapper,
                ]}
              >
                {msg.sender === 'ai' && (
                  <View style={styles.miniAiAvatar}>
                    <Text style={styles.miniAvatarText}>✨</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                    msg.isError && styles.errorBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.sender === 'user' ? styles.userBubbleText : styles.aiBubbleText,
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {msg.leadCaptured && (
                    <View style={styles.leadCapturedBadge}>
                      <Text style={styles.leadCapturedText}>✓ Enquiry saved! Senior counselor will call you.</Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.timestampText,
                      msg.sender === 'user' ? styles.userTimestamp : styles.aiTimestamp,
                    ]}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View style={styles.loadingWrapper}>
                <View style={styles.miniAiAvatar}>
                  <Text style={styles.miniAvatarText}>✨</Text>
                </View>
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#F5A623" />
                  <Text style={styles.loadingText}>AI Counselor is typing…</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Action Suggestion Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_ACTIONS.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => handleSendMessage(action)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about courses, fees, admissions..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
              multiline={false}
            />

            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.7}
            >
              <Text style={styles.sendBtnIcon}>➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 23, 0.75)',
    zIndex: 9999,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 480,
    height: '85%',
    maxHeight: 620,
    paddingHorizontal: 12,
  },
  chatCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 1,
    borderColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#F5A623',
    fontSize: 10,
    fontWeight: '600',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 14,
  },
  messagesContent: {
    paddingVertical: 14,
    gap: 12,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  userBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  aiBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  miniAiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  miniAvatarText: {
    fontSize: 11,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#F5A623',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorBubble: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userBubbleText: {
    color: '#0A0E17',
    fontWeight: '600',
  },
  aiBubbleText: {
    color: '#F1F5F9',
    fontWeight: '400',
  },
  leadCapturedBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  leadCapturedText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(10, 14, 23, 0.6)',
  },
  aiTimestamp: {
    color: '#64748B',
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  chipsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.25)',
  },
  chipText: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnIcon: {
    color: '#0A0E17',
    fontSize: 15,
    fontWeight: '900',
  },
});
