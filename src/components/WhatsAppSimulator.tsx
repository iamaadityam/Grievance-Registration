import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Shield,
  Trash2,
  HelpCircle,
  Sparkles,
  Smartphone,
  ChevronRight,
  Info,
  ArrowLeft,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "citizen" | "system" | "bot";
  text?: string;
  voiceTranscript?: string;
  imageUrl?: string;
  timestamp: string;
  status?: "sending" | "sent" | "delivered" | "read";
  isError?: boolean;
  metadata?: {
    trackingId?: string;
    category?: string;
    priority?: string;
    department?: string;
    summary?: string;
  };
}

export default function WhatsAppSimulator() {
  // Mobile sub-tab switcher for presets vs live chat view
  const [activeSimTab, setActiveSimTab] = useState<"controls" | "chat">("chat");

  // Input fields state
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [complaintText, setComplaintText] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // Statuses
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Chat conversation state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "👋 Welcome to CivicPulse AI Citizen Portal on WhatsApp!\n\nYou can report public grievances like potholes, waterlogging, or garbage directly here. Simply send a description of the issue. You can optionally attach a photo or a voice note.",
      timestamp: formatTime(new Date(Date.now() - 3600000))
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Handle file select & base64 conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert("Image file size should be less than 2.5MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Preset quick complainers
  const applyPreset = (presetText: string, options?: { image?: string; voice?: string }) => {
    setComplaintText(presetText);
    if (options?.voice) {
      setIsVoiceMode(true);
      setVoiceTranscript(options.voice);
    } else {
      setIsVoiceMode(false);
      setVoiceTranscript("");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate we have something to send
    const resolvedMessage = isVoiceMode ? "" : complaintText.trim();
    const resolvedTranscript = isVoiceMode ? voiceTranscript.trim() : "";
    
    if (!resolvedMessage && !resolvedTranscript && !imagePreview) {
      return;
    }

    setApiError(null);
    setIsSending(true);

    const userMessageId = "msg-" + Date.now();
    const currentTimeStr = formatTime(new Date());

    // 1. Add User's message to the chat
    const newUserMsg: Message = {
      id: userMessageId,
      sender: "citizen",
      text: resolvedMessage || undefined,
      voiceTranscript: resolvedTranscript || undefined,
      imageUrl: imagePreview || undefined,
      timestamp: currentTimeStr,
      status: "sending"
    };

    setMessages((prev) => [...prev, newUserMsg]);

    // Clear inputs immediately for smooth conversational UX
    setComplaintText("");
    setVoiceTranscript("");
    const sentImagePreview = imagePreview; // Keep a local reference
    clearImage();

    try {
      // 2. Call our simulated WhatsApp API endpoint
      const response = await fetch("/api/whatsapp/mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: resolvedMessage || null,
          imageUrl: sentImagePreview || null,
          voiceTranscript: resolvedTranscript || null
        })
      });

      const data = await response.json();

      // Update user message status to read
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessageId ? { ...m, status: "read" } : m))
      );

      if (response.ok && data.success) {
        // 3. Add bot success response
        const botSuccessMsg: Message = {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: `🤖 *CivicPulse AI Dispatch Bot*\n\n✅ *Grievance Registered Successfully!*\n\n• *Tracking ID:* \`#G-${data.trackingId?.substring(0, 6).toUpperCase()}\`\n• *Category:* ${data.category}\n• *Priority:* ${data.priority}\n• *Department:* ${data.department}\n\n*AI Summary:* \n"${data.summary}"\n\n_Your report has been geocoded and assigned instantly using our AI dispatch coordinator. Tracking is now active!_`,
          timestamp: formatTime(new Date()),
          metadata: {
            trackingId: data.trackingId,
            category: data.category,
            priority: data.priority,
            department: data.department,
            summary: data.summary
          }
        };
        setMessages((prev) => [...prev, botSuccessMsg]);
      } else {
        // 4. Add bot failure / rejection response
        const errorMessage = data.error || "Grievance rejected or failed to process.";
        const botFailMsg: Message = {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: `🤖 *CivicPulse AI Dispatch Bot*\n\n❌ *Failed to Register Complaint*\n\n*Reason:* ${errorMessage}\n\n_Please make sure your description is descriptive and specifies a valid public issue._`,
          timestamp: formatTime(new Date()),
          isError: true
        };
        setMessages((prev) => [...prev, botFailMsg]);
      }
    } catch (err: any) {
      console.error("WhatsApp simulation send failed:", err);
      // Fallback UI error message
      const botNetworkErrorMsg: Message = {
        id: "bot-err-" + Date.now(),
        sender: "bot",
        text: `🤖 *CivicPulse AI Bot*\n\n⚠️ *Connection Error*\n\nUnable to reach the server. Please ensure the backend dev server is active and try again.`,
        timestamp: formatTime(new Date()),
        isError: true
      };
      setMessages((prev) => [...prev, botNetworkErrorMsg]);
      setApiError(err.message || "Network Error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-130px)] md:h-[calc(100vh-100px)] overflow-hidden">
      {/* Mobile-first Tab Switcher for Controls vs Chat */}
      <div className="xl:hidden flex bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl max-w-md mx-auto w-full flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveSimTab("controls")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSimTab === "controls"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Presets & Inputs</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSimTab("chat")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSimTab === "chat"
              ? "bg-white dark:bg-slate-900 text-emerald-850 dark:text-emerald-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 -top-0.5 -right-0.5"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </div>
          <span>Live WhatsApp Chat</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden select-none">
      
      {/* LEFT COLUMN: CONTROL & PRESET DRAWER */}
      <div className={`w-full xl:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm overflow-y-auto ${activeSimTab === "controls" ? "flex" : "hidden xl:flex"}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 text-[10px] font-black uppercase rounded tracking-wider">
              WhatsApp Simulator
            </span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
          <h3 className="text-base font-black text-slate-800 tracking-tight">
            Simulation Control Panel
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Configure metadata exactly as if a citizen messaged the CivicPulse WhatsApp line.
          </p>
        </div>

        {/* Input: Phone Number */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Sender Phone Number</span>
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-green-500 dark:focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Upload simulated Image Attachment */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Attach Simulated Image (Optional)</span>
          </label>
          
          {imagePreview ? (
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                />
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[150px]">
                    {imageFile?.name || "image.png"}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Simulated payload"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all group"
            >
              <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto group-hover:text-slate-400 dark:group-hover:text-slate-500 mb-1" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block group-hover:text-slate-700 dark:group-hover:text-slate-200">
                Click to attach image
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                Supports PNG/JPEG (Max 2.5MB)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Mode: Toggle Text or Simulated Voice Note */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Input Mode
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-lg p-0.5">
              <button
                onClick={() => setIsVoiceMode(false)}
                className={`px-2 py-1 text-[10px] font-black rounded-md uppercase tracking-tight transition-all cursor-pointer ${
                  !isVoiceMode ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                Text Msg
              </button>
              <button
                onClick={() => setIsVoiceMode(true)}
                className={`px-2 py-1 text-[10px] font-black rounded-md uppercase tracking-tight transition-all cursor-pointer ${
                  isVoiceMode ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                Voice Note
              </button>
            </div>
          </div>

          {isVoiceMode ? (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-green-500" />
                <span>Simulated Voice Transcript</span>
              </label>
              <textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="Enter the voice note transcription as decrypted by WhatsApp Cloud API..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-green-500 dark:focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Message Content
              </label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Type the message description..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-green-500 dark:focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* Demo Preset Buttons */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
            Click to Load Demo Presets
          </span>
          
          <div className="space-y-1.5">
            <button
              onClick={() =>
                applyPreset(
                  "There is huge water logging on the MG Road near Central Mall. Traffic is completely stopped.",
                  { voice: "" }
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-start gap-2 cursor-pointer"
            >
              <span className="text-sm">💧</span>
              <div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Water Logging Complaint</span>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-1">"There is huge water logging on MG Road..."</p>
              </div>
            </button>

            <button
              onClick={() =>
                applyPreset(
                  "An open garbage dump with intense foul smell right in front of block B community gate.",
                  { voice: "" }
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-start gap-2 cursor-pointer"
            >
              <span className="text-sm">🗑️</span>
              <div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Garbage Dump Complaint</span>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-1">"An open garbage dump with intense foul smell..."</p>
              </div>
            </button>

            <button
              onClick={() =>
                applyPreset("", {
                  voice: "Hello, I am calling to report a deep dangerous pothole outside Green Park metro station, gate 3. Please get this repaired immediately."
                })
              }
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-start gap-2 cursor-pointer"
            >
              <span className="text-sm">🎤</span>
              <div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Voice Note Preset (Pothole)</span>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-1">"Hello, I am calling to report a deep dangerous..."</p>
              </div>
            </button>

            <button
              onClick={() =>
                applyPreset(
                  "The weather is very nice today in New Delhi.",
                  { voice: "" }
                )
              }
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-100 dark:hover:border-red-900 transition-all flex items-start gap-2 border border-slate-100 dark:border-slate-800 cursor-pointer"
            >
              <span className="text-sm">❌</span>
              <div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block text-red-700 dark:text-red-400">Invalid Complaint (Rejection Test)</span>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-1">"The weather is very nice today..."</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: WHATSAPP INTERFACE */}
      <div className={`flex-1 bg-[#efeae2] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-sm relative overflow-hidden h-full ${activeSimTab === "chat" ? "flex" : "hidden xl:flex"}`}>
        
        {/* WhatsApp Chat Wallpaper Vector Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: "400px"
          }}
        />

        {/* WHATSAPP HEADER */}
        <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between z-10 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700/60 rounded-full flex items-center justify-center border border-white/20 relative">
              <Shield className="w-5 h-5 text-emerald-100" />
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full absolute bottom-0.5 right-0.5 border border-[#008069]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight">CivicPulse AI Assistant</span>
                <span className="text-[8px] bg-emerald-500 font-extrabold px-1 py-0.2 rounded uppercase">
                  Bot
                </span>
              </div>
              <span className="text-[11px] text-emerald-100/90 block">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-emerald-100/80">
            <Video className="w-4.5 h-4.5 opacity-60 cursor-not-allowed" />
            <Phone className="w-4 h-4 opacity-60 cursor-not-allowed" />
            <MoreVertical className="w-4.5 h-4.5 opacity-70" />
          </div>
        </div>

        {/* WEBHOOK SIMULATOR DISCLAIMER CHIP */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 px-4 py-2 flex items-center gap-2 z-10 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex-shrink-0">
          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="leading-tight">
            SIMULATOR MODE: Simulated WhatsApp backend payload routing in effect. Active API endpoints are fully testable.
          </span>
        </div>

        {/* CHAT MESSAGES CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 scrollbar-thin scrollbar-thumb-emerald-800/10">
          
          {/* Encryption/Security Indicator Box */}
          <div className="flex justify-center my-2">
            <div className="bg-[#ffeecd] dark:bg-amber-950/40 border border-[#f7e0b5] dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-[10px] px-3 py-1.5 rounded-lg max-w-sm text-center leading-relaxed font-sans shadow-sm">
              🔒 Messages are secured via simulated Cloud Run secure tunnels. CivicPulse AI parses information locally for privacy.
            </div>
          </div>

          {messages.map((msg) => {
            const isMe = msg.sender === "citizen";
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-3 py-2 text-[12.5px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative leading-relaxed whitespace-pre-line ${
                    isMe
                      ? "bg-[#d9fdd3] dark:bg-emerald-950/80 text-[#111b21] dark:text-emerald-100 rounded-tr-none border dark:border-emerald-900/40"
                      : msg.isError
                      ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200/80 dark:border-red-900/60 rounded-tl-none"
                      : "bg-white dark:bg-slate-900 text-[#111b21] dark:text-slate-100 border dark:border-slate-800/80 rounded-tl-none"
                  }`}
                >
                  {/* Attached Image inside WhatsApp bubbles */}
                  {msg.imageUrl && (
                    <div className="mb-1.5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-w-xs">
                      <img
                        src={msg.imageUrl}
                        alt="Citizen uploaded item"
                        className="w-full max-h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Message content */}
                  {msg.text && (
                    <div className="font-sans pr-10">{msg.text}</div>
                  )}

                  {/* Rendered simulated voice attachment */}
                  {msg.voiceTranscript && (
                    <div className="space-y-1.5 pr-10">
                      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 max-w-xs">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                          <Mic className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block">Voice Note</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block leading-tight">0:12 duration</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        🎤 <strong className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 not-italic block mb-0.5">Automated Transcript</strong>
                        "{msg.voiceTranscript}"
                      </div>
                    </div>
                  )}

                  {/* Timing & read receipts */}
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 select-none">
                    <span>{msg.timestamp}</span>
                    {isMe && (
                      <span>
                        {msg.status === "sending" && (
                          <div className="w-2.5 h-2.5 rounded-full border border-slate-400 border-t-transparent animate-spin inline-block" />
                        )}
                        {msg.status === "sent" && <Check className="w-3.5 h-3.5 text-slate-400 inline" />}
                        {msg.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />}
                        {msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Simulated Typing State Indicator */}
          {isSending && (
            <div className="flex w-full justify-start">
              <div className="bg-white text-slate-400 text-xs rounded-xl px-4 py-2.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] rounded-tl-none flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span>CivicPulse is analyzing complaint...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT TRAY PANEL (WHATSAPP BAR) */}
        <form 
          onSubmit={handleSendMessage}
          className="bg-[#f0f2f5] dark:bg-slate-900 p-2.5 flex items-center gap-2.5 z-10 flex-shrink-0 border-t border-slate-200 dark:border-slate-800"
        >
          {/* Quick Upload clip */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            title="Attach mock media"
          >
            <ImageIcon className="w-5.5 h-5.5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Quick Voice Mode indicator */}
          <button
            type="button"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
              isVoiceMode ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
            title={isVoiceMode ? "Switch to Text message" : "Switch to Simulated Voice Note"}
          >
            <Mic className="w-5.5 h-5.5" />
          </button>

          {/* Chat input textbox (syncs text based on current active simulated mode) */}
          <div className="flex-1 relative">
            {isVoiceMode ? (
              <input
                type="text"
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="Transcribe your simulated voice note here..."
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none shadow-sm pr-16"
              />
            ) : (
              <input
                type="text"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Type your simulated message..."
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none shadow-sm pr-16"
              />
            )}
            
            {/* Base64 Attachment Indicator Overlay */}
            {imagePreview && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                <span>Media Attached</span>
                <button type="button" onClick={clearImage} className="hover:text-red-600 font-bold ml-1">×</button>
              </div>
            )}
          </div>

          {/* Big Green Round WhatsApp Send Button */}
          <button
            type="submit"
            disabled={isSending || (!complaintText.trim() && !voiceTranscript.trim() && !imagePreview)}
            className="w-11 h-11 bg-[#00a884] hover:bg-[#008f72] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0 cursor-pointer"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
