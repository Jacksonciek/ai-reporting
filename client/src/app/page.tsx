'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import Welcome from '@/components/Welcome';
import { apiService } from '@/services/api';
import { chatHistoryService } from '@/services/chatHistoryService';
import { Message, Room } from '@/types';

export default function Home() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isCreatingNewRoom, setIsCreatingNewRoom] = useState(false);
  const sidebarRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // GSAP animations for background elements
  useEffect(() => {
    if (containerRef.current && backgroundRef.current) {
      // Animated background gradients
      gsap.set(backgroundRef.current, {
        background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.4), transparent 50%)'
      });

      // Continuous background animation
      gsap.to(backgroundRef.current, {
        duration: 20,
        ease: "none",
        repeat: -1,
        yoyo: true,
        background: 'radial-gradient(circle at 80% 50%, rgba(120, 119, 198, 0.4), transparent 50%), radial-gradient(circle at 20% 80%, rgba(255, 119, 198, 0.4), transparent 50%), radial-gradient(circle at 60% 20%, rgba(120, 219, 255, 0.5), transparent 50%)'
      });

      // Floating particles animation
      const particles = Array.from({ length: 15 }, (_, i) => {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 bg-white/10 rounded-full pointer-events-none';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        backgroundRef.current?.appendChild(particle);

        gsap.to(particle, {
          duration: 10 + Math.random() * 20,
          y: -100 - Math.random() * 100,
          x: -50 + Math.random() * 100,
          opacity: 0,
          repeat: -1,
          ease: "none",
          delay: Math.random() * 10
        });

        return particle;
      });

      return () => {
        particles.forEach(particle => particle.remove());
      };
    }
  }, []);

  // Load initial rooms
  useEffect(() => {
    loadRooms();
  }, []);

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoomId && !isCreatingNewRoom) {
      loadMessages(selectedRoomId);
      setShowWelcome(false);
    }
  }, [selectedRoomId, isCreatingNewRoom]);

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getRooms({ page: 1, limit: 10 });
      setRooms(response.data || []);

      // Only show welcome if no rooms AND no selected room AND not creating new room
      if (!response.data?.length && !selectedRoomId && !isCreatingNewRoom) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      // Only show welcome if there's no active chat and not creating new room
      if (!selectedRoomId && !isCreatingNewRoom) {
        setShowWelcome(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await apiService.getMessages(roomId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    setSelectedRoomId(null);
    setMessages([]);
    setShowWelcome(true);
    setIsCreatingNewRoom(false);
    setSidebarExpanded(true);
  };

  // New function to handle going to Welcome from sidebar
  const handleGoToWelcome = () => {
    setSelectedRoomId(null);
    setMessages([]);
    setShowWelcome(true);
    setIsCreatingNewRoom(false);
    // Optionally expand sidebar when going to welcome
    setSidebarExpanded(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Immediately hide welcome screen when sending first message
    setShowWelcome(false);

    // Collapse sidebar when chat starts
    setSidebarExpanded(false);

    if (!selectedRoomId) {
      await handleFirstMessage(message);
      return;
    }

    await sendMessageToExistingRoom(message);
  };

  const handleFirstMessage = async (message: string) => {
    try {
      setIsCreatingNewRoom(true);
      setIsBotTyping(true);

      // Create temporary user message to show immediately
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        room_id: 'temp',
        content: message,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      // Show user message immediately and ensure we're not in welcome mode
      setMessages([tempUserMessage]);
      setShowWelcome(false);

      // 1. Create new room first using a smart name from the first message
      const smartName = chatHistoryService.generateSmartRoomName(message, 25);
      const newRoom = await apiService.createRoom(smartName);
      const roomId = newRoom.room_id?.toString() || `room-${Date.now()}`;

      // Set room ID but don't trigger message loading yet
      setSelectedRoomId(roomId);

      // 2. Send message to bot
      await apiService.sendMessageToBot(roomId, message);

      // 3. Load all messages from API to get the complete conversation
      const messagesResponse = await apiService.getMessages(roomId);
      setMessages(messagesResponse.messages || []);

      // 4. Refresh sidebar to show new chat
      await loadRooms();

      // Ensure we stay in chat interface
      setShowWelcome(false);
    } catch (error) {
      console.error('Failed to create new chat:', error);

      // Add error message on failure
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        room_id: selectedRoomId || 'temp',
        content: 'Sorry, there was an error creating the chat. Please try again.',
        role: 'assistant',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);

      // Don't go back to welcome on error
      setShowWelcome(false);
    } finally {
      setIsBotTyping(false);
      setIsCreatingNewRoom(false);
    }
  };

  const sendMessageToExistingRoom = async (message: string) => {
    try {
      // Create temporary user message to show immediately
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        room_id: selectedRoomId!,
        content: message,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      // Add user message immediately to local state
      setMessages(prev => [...prev, tempUserMessage]);
      setIsBotTyping(true);

      // 1. Send message to bot
      await apiService.sendMessageToBot(selectedRoomId!, message);

      // 2. Load all messages from API to get the updated conversation
      const messagesResponse = await apiService.getMessages(selectedRoomId!);
      setMessages(messagesResponse.messages || []);
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove the temporary message and add error message
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.id.startsWith('temp-user-'));
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          room_id: selectedRoomId!,
          content: 'Sorry, there was an error sending your message. Please try again.',
          role: 'assistant',
          created_at: new Date().toISOString(),
        };
        return [...filteredMessages, errorMessage];
      });
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleRoomSelect = (id: string) => {
    setSelectedRoomId(id);
    setMessages([]);
    setShowWelcome(false);
    setIsCreatingNewRoom(false);
    setSidebarExpanded(false);
  };

  const refreshRooms = async () => {
    await loadRooms();
  };

  // Determine what to show
  const shouldShowWelcome = showWelcome && !selectedRoomId && !isCreatingNewRoom;
  const shouldShowChat = !shouldShowWelcome || isCreatingNewRoom;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const loadingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const mainContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="h-screen overflow-hidden relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Background with Glassmorphism */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950"
      />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-gray-800/10 to-slate-900/20 backdrop-blur-3xl" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Show loading state while determining initial state */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center h-full relative z-10"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="text-center">
              {/* Simplified loading indicator - just 3 dots */}
              <div className="flex justify-center space-x-2 mb-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-4 h-4 bg-blue-400 rounded-full"
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              <motion.p
                className="text-slate-300 text-lg font-medium"
                animate={{
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Loading your conversations...
              </motion.p>

              {/* Loading dots */}
              <div className="flex justify-center space-x-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="h-full relative z-10"
            initial="hidden"
            animate="visible"
          >
            <Sidebar
              isExpanded={sidebarExpanded}
              onToggle={() => setSidebarExpanded(!sidebarExpanded)}
              selectedRoomId={selectedRoomId}
              onRoomSelect={handleRoomSelect}
              onNewChat={handleNewChat}
              onGoToWelcome={handleGoToWelcome}
              rooms={rooms}
              onRefreshRooms={refreshRooms}
            />

            <AnimatePresence mode="wait">
              {shouldShowWelcome ? (
                <motion.div
                  className={`
                    flex flex-col h-screen transition-all duration-500 ease-out
                    ${sidebarExpanded ? 'ml-80' : 'ml-16'}
                  `}
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Welcome
                    onSendMessage={handleSendMessage}
                    isBotTyping={isBotTyping}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`chat-${selectedRoomId || 'new'}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <ChatInterface
                    key={selectedRoomId || 'new'}
                    roomId={selectedRoomId}
                    sidebarExpanded={sidebarExpanded}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isBotTyping={isBotTyping}
                    onNewChat={handleNewChat}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}