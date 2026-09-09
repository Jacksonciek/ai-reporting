import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  BarChart3,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface WelcomeProps {
  onSendMessage: (message: string) => Promise<void>;
  isBotTyping: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ onSendMessage, isBotTyping }) => {
  const [inputValue, setInputValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const promptsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    // Simulate GSAP animations with CSS transitions
    const animateElements = () => {
      setTimeout(() => {
        if (headerRef.current) {
          headerRef.current.style.transform = "translateY(0)";
          headerRef.current.style.opacity = "1";
        }
      }, 100);

      setTimeout(() => {
        if (promptsRef.current) {
          promptsRef.current.style.transform = "translateY(0)";
          promptsRef.current.style.opacity = "1";
        }
      }, 300);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.transform = "translateY(0)";
          inputRef.current.style.opacity = "1";
        }
      }, 500);
    };

    animateElements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isBotTyping) return;

    const message = inputValue.trim();
    setInputValue("");
    await onSendMessage(message);
  };

  const handleSamplePrompt = async (prompt: string) => {
    if (isBotTyping) return;
    await onSendMessage(prompt);
  };

  const samplePrompts = [
    {
      icon: <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />,
      title: "Top Sales Categories",
      prompt: "Show me the top 3 selling categories",
      gradient: "from-emerald-400 to-cyan-400",
    },
    {
      icon: <FileText className="w-3 h-3 sm:w-4 sm:h-4" />,
      title: "Export Data",
      prompt: "Export an Excel file containing electronics category sales",
      gradient: "from-purple-400 to-pink-400",
    },
    {
      icon: <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />,
      title: "City Performance",
      prompt: "Show me the highest sales by city",
      gradient: "from-orange-400 to-red-400",
    },
    {
      icon: <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />,
      title: "General Inquiry",
      prompt: "Hello, good evening",
      gradient: "from-blue-400 to-indigo-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements - Smaller */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/10 rounded-full blur-xl sm:blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-purple-500/10 rounded-full blur-xl sm:blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 bg-cyan-500/5 rounded-full blur-xl sm:blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-3 sm:p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Header - Smaller */}
        <div
          ref={headerRef}
          className="text-center mb-6 sm:mb-8 lg:mb-10 transform translate-y-8 opacity-0 transition-all duration-1000 ease-out px-2"
          style={{ transitionDelay: "100ms" }}
        >
          <div className="mb-4 sm:mb-6">
            <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-lg sm:rounded-xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 mb-3 sm:mb-4 group hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm lg:blur-md group-hover:blur-md lg:group-hover:blur-lg transition-all duration-300"></div>
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white relative z-10" />
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-400 absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2 sm:mb-3 p-1 tracking-tight leading-tight">
              AI Reporting Assistant
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-2 sm:mb-3 font-medium">
              Analyze your data with the help of AI
            </p>

            <p className="text-xs sm:text-sm lg:text-base text-gray-400 max-w-xs sm:max-w-lg lg:max-w-xl mx-auto leading-relaxed px-2">
              Gain valuable insights from your data. Ask about product performance, city-based analysis, data exports, and much more.
            </p>
          </div>
        </div>

        {/* Sample Prompts - Smaller */}
        <div
          ref={promptsRef}
          className="w-full max-w-4xl mb-6 sm:mb-8 lg:mb-10 transform translate-y-8 opacity-0 transition-all duration-1000 ease-out px-2"
          style={{ transitionDelay: "300ms" }}
        >
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-200 mb-4 sm:mb-5 text-center">
            Start from these questions:
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {samplePrompts.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSamplePrompt(sample.prompt)}
                disabled={isBotTyping}
                className={`group p-3 sm:p-4 bg-gray-800/30 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-800/50 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 ${index % 2 === 0
                    ? "animate-slide-in-left"
                    : "animate-slide-in-right"
                  }`}
                style={{
                  animationDelay: `${600 + index * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div
                    className={`flex-shrink-0 p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r ${sample.gradient} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 group-hover:scale-110`}
                  >
                    <div className="text-white">{sample.icon}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-100 mb-1 text-xs sm:text-sm lg:text-base group-hover:text-white transition-colors">
                      {sample.title}
                    </h3>
                    <p className="text-xs sm:text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed overflow-hidden">
                      &quot;{sample.prompt}&quot;
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form - Smaller */}
        <div
          ref={inputRef}
          className="w-full max-w-4xl transform translate-y-8 opacity-0 transition-all duration-1000 ease-out px-2"
          style={{ transitionDelay: "500ms" }}
        >
          <div className="relative mb-4 sm:mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl blur-sm lg:blur-md group-hover:blur-md lg:group-hover:blur-lg transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Ask anything..."
                className="relative w-full p-3 sm:p-4 pr-10 sm:pr-12 bg-gray-800/40 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white placeholder-gray-400 text-sm sm:text-base hover:bg-gray-800/60 focus:bg-gray-800/60"
                disabled={isBotTyping}
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isBotTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md sm:rounded-lg bg-gray-700/50 hover:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                {isBotTyping ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out;
        }

        @media (max-width: 640px) {
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
};

export default Welcome;