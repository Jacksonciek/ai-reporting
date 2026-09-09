import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Bot,
  RefreshCw,
  Loader2,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { Room } from "@/types";
import { apiService } from "@/services/api";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onNewChat: () => void;
  onGoToWelcome: () => void;
  rooms: Room[];
  onRefreshRooms?: () => void;
}

const ITEMS_PER_PAGE = 8;
const SCROLL_THRESHOLD = 100; // pixels from bottom to trigger loading

const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  onToggle,
  selectedRoomId,
  onRoomSelect,
  onNewChat,
  onGoToWelcome,
  rooms: initialRooms,
  onRefreshRooms,
}) => {
  const [allRooms, setAllRooms] = useState<Room[]>(initialRooms);
  const [displayedRooms, setDisplayedRooms] = useState<Room[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreRooms, setHasMoreRooms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [totalRooms, setTotalRooms] = useState(initialRooms.length);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const roomRefs = useRef<{ [key: string]: HTMLDivElement }>({});


  // GSAP Animations
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (isExpanded) {
      gsap.to(sidebarRef.current, {
        width: "320px",
        duration: 0.4,
        ease: "power2.inOut",
      });
    } else {
      gsap.to(sidebarRef.current, {
        width: "64px",
        duration: 0.4,
        ease: "power2.inOut",
      });
    }
  }, [isExpanded]);

  // Animate rooms when they load - FROM TOP
  useEffect(() => {
    if (displayedRooms.length > 0) {
      Object.values(roomRefs.current).forEach((ref, index) => {
        if (ref) {
          gsap.fromTo(
            ref,
            { y: -50, opacity: 0 }, // Changed from x: -50 to y: -50 (from top)
            {
              y: 0, // Changed from x: 0 to y: 0
              opacity: 1,
              duration: 0.4,
              delay: index * 0.05,
              ease: "power2.out",
            }
          );
        }
      });
    }
  }, [displayedRooms.length]);


  // Update rooms when prop changes
  useEffect(() => {
    if (initialRooms && initialRooms.length > 0) {
      console.log("Setting rooms from props:", initialRooms);
      setAllRooms(initialRooms);
      setDisplayedRooms(initialRooms);
      setHasMoreRooms(true);
      setCurrentPage(1);
      setTotalRooms(initialRooms.length);
      setError(null);
    }
  }, [initialRooms]);

  // Test API connection and load rooms when component mounts
  useEffect(() => {
    if (isExpanded && !connectionTested) {
      loadInitialRooms();
    }
  }, [isExpanded, connectionTested]);

  const getDisplayName = useCallback((room: Room) => {
    return room.room_name;
  }, []);



  // Alternative scroll-based loading (as failsafe)
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loadingMore || !hasMoreRooms) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrolledPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Trigger loading when scrolled 80% of the way
    if (scrolledPercentage > 0.8) {
      loadMoreRooms();
    }
  }, [loadingMore, hasMoreRooms]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isExpanded) return;

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isExpanded]);

  const loadInitialRooms = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Loading initial rooms...");
      const response = await apiService.getRooms({ page: 1, limit: ITEMS_PER_PAGE });

      console.log("API Response:", response);

      if (response.data && response.data.length > 0) {
        const sortedRooms = response.data.sort((a, b) => {
          const dateA = new Date(a.created_at || "").getTime();
          const dateB = new Date(b.created_at || "").getTime();
          return dateB - dateA;
        });

        setAllRooms(sortedRooms);
        setDisplayedRooms(sortedRooms);
        setCurrentPage(1);
        setHasMoreRooms(response.hasMore ?? false);
        setTotalRooms(response.total ?? sortedRooms.length);
        setError(null);
        setConnectionTested(true);
        console.log(`Loaded ${sortedRooms.length} rooms:`, sortedRooms);
      } else {
        setAllRooms([]);
        setDisplayedRooms([]);
        setHasMoreRooms(false);
        setCurrentPage(1);
        setTotalRooms(0);
        setConnectionTested(true);
        console.log("No rooms found");
      }
    } catch (error) {
      console.error("Failed to load rooms:", error);
      setError(
        `Failed to load conversations: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setAllRooms([]);
      setDisplayedRooms([]);
      setHasMoreRooms(false);
      setCurrentPage(1);
      setTotalRooms(0);
      setConnectionTested(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const loadMoreRooms = useCallback(async () => {
    if (loadingMore || !hasMoreRooms) return;

    console.log("Loading more rooms...");
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const response = await apiService.getRooms({ page: nextPage, limit: ITEMS_PER_PAGE });
      if (response.data && response.data.length > 0) {
        const sortedRooms = response.data.sort((a, b) => {
          const dateA = new Date(a.created_at || "").getTime();
          const dateB = new Date(b.created_at || "").getTime();
          return dateB - dateA;
        });
        setAllRooms(prev => {
          const ids = new Set(prev.map(r => r.room_id));
          const uniqueNew = sortedRooms.filter(r => !ids.has(r.room_id));
          return [...prev, ...uniqueNew];
        });
        setDisplayedRooms(prev => {
          const ids = new Set(prev.map(r => r.room_id));
          const uniqueNew = sortedRooms.filter(r => !ids.has(r.room_id));
          return [...prev, ...uniqueNew];
        });
        setCurrentPage(nextPage);
        setHasMoreRooms(response.hasMore ?? false);
        setTotalRooms(response.total ?? totalRooms);
      } else {
        setHasMoreRooms(false);
      }
    } catch (error) {
      console.error("Failed to load more rooms:", error);
      setHasMoreRooms(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreRooms, currentPage]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Just now";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Just now";

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      return date.toLocaleDateString();
    } catch {
      return "Just now";
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return "New Chat";
    return text.length <= maxLength
      ? text
      : `${text.substring(0, maxLength)}...`;
  };

  const refresh = async () => {
    console.log("Refreshing rooms...");
    setError(null);
    setConnectionTested(false);
    setCurrentPage(1);
    setDisplayedRooms([]);
    setHasMoreRooms(true);
    setTotalRooms(0);
    await loadInitialRooms();

    if (onRefreshRooms) {
      onRefreshRooms();
    }
  };

  const handleNewChat = () => {
    onNewChat();
  };

  const handleEditRoom = (roomId: string, currentName: string) => {
    setEditingRoom(roomId);
    setEditingName(currentName);
  };

  const handleSaveEdit = async (roomId: string) => {
    // Add your save logic here
    setEditingRoom(null);
    setEditingName("");
  };

  // Handle click on AI Reporting title - go to Welcome
  const handleTitleClick = () => {
    onGoToWelcome();
  };

  const sidebarVariants = {
    expanded: {
      width: 320,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    collapsed: {
      width: 64,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const roomVariants = {
    hidden: {
      y: -20, // Changed from x: -20 to y: -20 (from top)
      opacity: 0,
      scale: 0.95,
    },
    visible: (index: number) => ({
      y: 0, // Changed from x: 0 to y: 0
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.03,
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };


  return (
    <motion.div
      ref={sidebarRef}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      style={{
        background: "rgba(15, 15, 15, 0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 0 40px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header - Fixed */}
      <motion.div
        className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="flex items-center space-x-3 cursor-pointer"
              initial={{ opacity: 0, y: -20 }} // Changed from x: -20 to y: -20
              animate={{ opacity: 1, y: 0 }} // Changed from x: 0 to y: 0
              exit={{ opacity: 0, y: -20 }} // Changed from x: -20 to y: -20
              transition={{ duration: 0.3 }}
              onClick={handleTitleClick}
            >
              <motion.div
                className="relative"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Bot className="w-8 h-8 text-blue-400" />
                <motion.div
                  className="absolute inset-0 bg-blue-400/20 rounded-full blur-md"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              <motion.span
                className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent hover:from-blue-300 hover:via-purple-300 hover:to-cyan-300 transition-all duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                AI Reporting
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={onToggle}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? (
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-300" />
          )}
        </motion.button>
      </motion.div>

      {/* New Chat Button - Fixed */}
      <motion.div
        className="p-4 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }} // Changed from y: 20 to y: -20 (from top)
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <motion.button
          onClick={handleNewChat}
          className={`
            w-full flex items-center space-x-3 p-3 rounded-xl
            bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20
            hover:from-blue-600/30 hover:via-purple-600/30 hover:to-cyan-600/30
            border border-white/10 hover:border-white/20
            backdrop-blur-md transition-all duration-300
            ${!isExpanded ? "justify-center" : ""}
          `}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
          }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: 0 }}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <Plus className="w-5 h-5 text-blue-400" />
          </motion.div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                className="text-gray-200 font-medium"
                initial={{ opacity: 0, y: -10 }} // Changed from x: -10 to y: -10
                animate={{ opacity: 1, y: 0 }} // Changed from x: 0 to y: 0
                exit={{ opacity: 0, y: -10 }} // Changed from x: -10 to y: -10
                transition={{ duration: 0.2 }}
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Scrollable Chat List Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Chat List Header - Fixed within scroll container */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="px-4 pb-2 flex-shrink-0 flex items-center justify-between"
              initial={{ opacity: 0, y: -10 }} // Changed from y: 10 to y: -10
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} // Changed from y: 10 to y: -10
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <span className="text-sm text-gray-500 font-medium">
                {allRooms.length} of {totalRooms} conversation{totalRooms !== 1 ? "s" : ""}
              </span>
              <motion.button
                onClick={refresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300"
                title="Refresh conversations"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: loading ? 360 : 0 }}
                  transition={{
                    duration: 1,
                    repeat: loading ? Infinity : 0,
                    ease: "linear",
                  }}
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </motion.div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 pb-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
          }}
        >
          {/* Custom scrollbar styles */}
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>

          <div className="space-y-2">
            {/* Error State */}
            <AnimatePresence>
              {error && isExpanded && (
                <motion.div
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-md"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center">
                    <span className="flex-1 text-red-300 text-sm">{error}</span>
                    <motion.button
                      onClick={refresh}
                      className="ml-2 p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Retry"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RefreshCw className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initial Loading State */}
            <AnimatePresence>
              {loading && isExpanded && (
                <motion.div
                  className="p-4 text-center text-gray-500"
                  initial={{ opacity: 0, y: -10 }} // Changed from y: 10 to y: -10
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} // Changed from y: 10 to y: -10
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full mx-auto mb-2"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span className="text-sm">Loading conversations...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            <AnimatePresence>
              {!loading &&
                displayedRooms.length === 0 &&
                !error &&
                connectionTested &&
                isExpanded && (
                  <motion.div
                    className="p-6 text-center"
                    initial={{ opacity: 0, y: -20 }} // Changed from y: 20 to y: -20
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }} // Changed from y: 20 to y: -20
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <MessageSquare className="w-6 h-6 text-gray-600" />
                    </motion.div>
                    <p className="text-gray-500 text-sm">
                      No conversations yet.
                      <br />
                      <span className="text-gray-400">
                        Start a new chat to begin!
                      </span>
                    </p>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Room List */}
            <AnimatePresence>
              {displayedRooms.map((room, index) => (
                <motion.div
                  key={room.room_id}
                  ref={(el) => {
                    if (el) roomRefs.current[room.room_id] = el;
                  }}
                  className="relative group"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  custom={index}
                  whileHover="hover"
                  onHoverStart={() => setHoveredRoom(room.room_id.toString())}
                  onHoverEnd={() => setHoveredRoom(null)}
                >
                  <motion.div
                    className={`
                      rounded-xl transition-all duration-300 overflow-hidden
                      ${selectedRoomId === room.room_id.toString()
                        ? "bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 border border-white/20 shadow-lg"
                        : "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                      }
                    `}
                    style={{
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <button
                      onClick={() => onRoomSelect(room.room_id.toString())}
                      className={`
                        w-full flex items-center space-x-3 p-3 transition-all duration-200
                        ${!isExpanded ? "justify-center" : ""}
                      `}
                      title={isExpanded ? room.room_name : undefined}
                    >
                      <motion.div
                        animate={{
                          scale:
                            selectedRoomId === room.room_id.toString() ? 1.1 : 1,
                          color:
                            selectedRoomId === room.room_id.toString()
                              ? "#60a5fa"
                              : "#9ca3af",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <MessageSquare className="w-5 h-5 flex-shrink-0" />
                      </motion.div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="flex-1 text-left min-w-0"
                            initial={{ opacity: 0, y: -10 }} // Changed from x: -10 to y: -10
                            animate={{ opacity: 1, y: 0 }} // Changed from x: 0 to y: 0
                            exit={{ opacity: 0, y: -10 }} // Changed from x: -10 to y: -10
                            transition={{ duration: 0.2 }}
                          >
                            {editingRoom === room.room_id.toString() ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() =>
                                  handleSaveEdit(room.room_id.toString())
                                }
                                onKeyPress={(e) =>
                                  e.key === "Enter" &&
                                  handleSaveEdit(room.room_id.toString())
                                }
                                className="w-full bg-transparent text-sm font-medium text-gray-200 border-b border-blue-400 outline-none"
                                autoFocus
                              />
                            ) : (
                              <>
                                <div className="truncate text-sm font-medium text-gray-200">
                                  {getDisplayName(room)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(room.created_at)}
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Load More Indicator */}
            <AnimatePresence>
              {isExpanded && hasMoreRooms && !loading && (
                <motion.div
                  className="flex justify-center items-center py-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {loadingMore ? (
                    <motion.div
                      className="flex items-center space-x-2 text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                      <span className="text-sm">Loading more...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition-colors"
                      onClick={loadMoreRooms}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Load more conversations
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* End of List Indicator */}
            <AnimatePresence>
              {isExpanded && !hasMoreRooms && displayedRooms.length > ITEMS_PER_PAGE && !loading && (
                <motion.div
                  className="flex justify-center items-center py-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="w-8 h-px bg-gray-600"></div>
                    <span className="text-xs">End of conversations</span>
                    <div className="w-8 h-px bg-gray-600"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.div
        className="p-4 flex-shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Link href="/admin" className="w-full">
          <motion.div
            className={`group relative flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur transition-all duration-300 hover:border-blue-400/40 hover:bg-blue-500/10 ${
              isExpanded ? "justify-start" : "justify-center"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-cyan-500/30 text-blue-200">
              <Shield className="h-5 w-5" />
              <motion.div
                className="absolute inset-0 rounded-lg bg-blue-400/20 blur-lg"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="flex min-w-0 flex-col"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="text-sm font-semibold text-white">Admin portal</span>
                  <span className="text-xs text-gray-400">Manage access & workflows</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </motion.div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </motion.div>
  );
};

Sidebar.displayName = "Sidebar";

export default Sidebar;