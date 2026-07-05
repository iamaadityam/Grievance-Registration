import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Activity,
  Info,
  Server
} from "lucide-react";

interface SmsLog {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: "delivered" | "failed" | "logged_locally" | "forwarded_via_telemetry" | "simulated";
  gateway: "textbelt" | "telemetry_proxy" | "local_console" | "none";
  details?: string;
}

interface SmsDiagnostics {
  telemetryConfigured: boolean;
  telemetryPrefix: string;
  isGoogleApiKey: boolean;
  appUrl: string;
}

interface SmsHubProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "hi";
}

export default function SmsHub({ isOpen, onClose, lang }: SmsHubProps) {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [diagnostics, setDiagnostics] = useState<SmsDiagnostics | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch logs and diagnostics
  const fetchData = async (showLoader = false) => {
    if (showLoader) setIsFetching(true);
    try {
      const logsRes = await fetch("/api/sms-logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      const diagRes = await fetch("/api/sms-diagnostics");
      if (diagRes.ok) {
        const diagData = await diagRes.json();
        setDiagnostics(diagData);
      }
    } catch (err) {
      console.error("Failed to fetch SMS Hub data:", err);
    } finally {
      if (showLoader) setIsFetching(false);
    }
  };

  // Poll for new logs when open
  useEffect(() => {
    if (isOpen) {
      fetchData(true);
      const interval = setInterval(() => {
        fetchData(false);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger test SMS
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) return;

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: "sms_notification",
          properties: {
            to: testPhone,
            message: testMessage,
            source: "Municipal-Governance-Portal-Test"
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        if (result.textbeltSent) {
          setTestResult({
            success: true,
            message: lang === "hi"
              ? "टेस्ट एसएमएस आपके मोबाइल नंबर पर सफलतापूर्वक भेज दिया गया है!"
              : "Test SMS successfully sent to your mobile number via Textbelt gateway!"
          });
        } else {
          setTestResult({
            success: true,
            message: diagnostics?.isGoogleApiKey
              ? (lang === "hi"
                  ? "एसएमएस सिम्युलेटर में दर्ज हो गया है! ध्यान दें: आपका टेलीमेट्री लिंक एक गूगल कुंजी है, इसलिए एसएमएस इन-ऐप कंसोल में सिम्युलेट किया गया है।"
                  : "SMS registered in simulation console! Note: Since your TELEMETRY_API_LINK is configured with a Google API Key, standard webhook forwarding was bypassed and logged to the console below.")
              : (lang === "hi"
                  ? "एसएमएस सिम्युलेटर में दर्ज हो गया है। बाहरी गेटवे कोटा समाप्त हो सकता है।"
                  : "SMS logged in local simulator successfully. Best-effort delivery completed (see logs below).")
          });
        }
        setTestMessage("");
        fetchData(false);
      } else {
        setTestResult({
          success: false,
          message: result.error || "Failed to send test SMS. Checking server status."
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "An error occurred while sending test SMS."
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/65 backdrop-blur-xs">
        <motion.div
          initial={{ x: "100%", opacity: 0.9 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.9 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight uppercase">
                  {lang === "hi" ? "एसएमएस नोटिफिकेशन और लाइव ट्रैकर" : "SMS Hub & Live Delivery Logs"}
                </h3>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                  {lang === "hi" ? "नागरिक संचार केंद्र" : "Citizen Communication Core"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                disabled={isFetching}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-blue-400" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. CONFIGURATION WARNING & FALLBACK INFO */}
            {diagnostics && (
              <div className="space-y-3">
                {diagnostics.isGoogleApiKey ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex gap-2 text-amber-800">
                      <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          {lang === "hi" ? "गूगल एपीआई की विसंगति का पता चला" : "Google API Key Detected in Telemetry Field"}
                        </h4>
                        <p className="text-[11px] leading-relaxed mt-0.5">
                          {lang === "hi"
                            ? `आपके TELEMETRY_API_LINK को Google API Key (${diagnostics.telemetryPrefix}) के साथ कॉन्फ़िगर किया गया है। चूंकि यह कोई वैध वेबहुक URL नहीं है, मानक वेबहुक अग्रेषण विफल हो जाएगा।`
                            : `Your TELEMETRY_API_LINK is configured with a Google Cloud API Key (${diagnostics.telemetryPrefix}) instead of an HTTP/HTTPS webhook URL. Standard telemetry forwarding is safely bypassed.`}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[10px] text-amber-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {lang === "hi"
                          ? "हल: हमने आपके वास्तविक नंबर पर संदेश भेजने के लिए 'Textbelt API' लाइव कैरियर लागू किया है!"
                          : "Auto-Fix Active: Real SMS messages are securely routed using our integrated Textbelt API Carrier!"}
                      </span>
                    </div>
                  </div>
                ) : !diagnostics.telemetryConfigured ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex gap-2 text-blue-800">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          {lang === "hi" ? "डिफ़ॉल्ट सिमुलेशन मोड" : "Simulation Mode Active"}
                        </h4>
                        <p className="text-[11px] leading-relaxed mt-0.5">
                          {lang === "hi"
                            ? "TELEMETRY_API_LINK पर्यावरण चर खाली है। शिकायत दर्ज होने पर एसएमएस नोटिफिकेशन इस लाइव कंसोल में तुरंत दिखाई देंगे।"
                            : "TELEMETRY_API_LINK is not set. All SMS notifications triggered by filing grievances will immediately stream to this live hub below in real time."}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[10px] text-blue-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {lang === "hi"
                          ? "वास्तविक एसएमएस भेजने के लिए हमने मुफ्त 'Textbelt' गेटवे सक्रिय कर दिया है!"
                          : "Carrier Fallback: Direct SMS delivery to mobile numbers via Textbelt Gateway is active!"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex gap-2 text-emerald-800">
                      <Server className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          {lang === "hi" ? "टेलीमेट्री वेबहुक सक्रिय" : "External Telemetry Webhook Connected"}
                        </h4>
                        <p className="text-[11px] leading-relaxed mt-0.5">
                          {lang === "hi"
                            ? `प्रविष्टि को आपके सर्वर वेबहुक (${diagnostics.telemetryPrefix}) पर अग्रेषित किया जा रहा है।`
                            : `Dispatched SMS payloads are successfully mirrored to your external webhook destination (${diagnostics.telemetryPrefix}).`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. SEND TEST SMS FORM */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  {lang === "hi" ? "एसएमएस डिलीवरी का परीक्षण करें" : "Direct SMS Delivery Test"}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {lang === "hi"
                    ? "अपने वास्तविक मोबाइल नंबर पर एसएमएस भेजने का तुरंत परीक्षण करें।"
                    : "Instantly test live carrier delivery to your personal mobile number."}
                </p>
              </div>

              <form onSubmit={handleSendTest} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "hi" ? "मोबाइल नंबर" : "Recipient Mobile Number"}
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder={lang === "hi" ? "उदा. 9876543210" : "e.g. 9876543210"}
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "hi" ? "एसएमएस संदेश" : "Message Content"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === "hi" ? "शिकायत प्रणाली से परीक्षण संदेश..." : "Test notification from Municipal Portal..."}
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSendingTest || !testPhone || !testMessage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSendingTest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{lang === "hi" ? "एसएमएस भेज रहे हैं..." : "Dispatching..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === "hi" ? "टेस्ट एसएमएस भेजें" : "Send Test SMS"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-[11px] leading-relaxed flex gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* 3. SMS OUTBOX LOGS LIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    {lang === "hi" ? "आउटगोइंग एसएमएस लॉग" : "Transmission Outbox & Deliveries"}
                  </h4>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {logs.length} Total
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 space-y-1">
                  <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-500">
                    {lang === "hi" ? "अभी तक कोई एसएमएस नहीं भेजा गया है" : "No transmission logs in history"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {lang === "hi"
                      ? "जब आप कोई नई शिकायत दर्ज करेंगे, तो एसएमएस तुरंत यहाँ दिखाई देगा!"
                      : "File a grievance or use the test form above to see live outbox delivery logs."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const isSuccess = log.status === "delivered" || log.status === "forwarded_via_telemetry" || log.status === "simulated";
                    return (
                      <div
                        key={log.id}
                        className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-4 transition-all shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              {log.to}
                            </span>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {new Date(log.timestamp).toLocaleTimeString()} - {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {/* Status Badge */}
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 border ${
                                log.status === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : log.status === "forwarded_via_telemetry"
                                  ? "bg-purple-50 text-purple-700 border-purple-100"
                                  : log.status === "simulated"
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                log.status === "delivered" ? "bg-emerald-500 animate-pulse" :
                                log.status === "forwarded_via_telemetry" ? "bg-purple-500 animate-pulse" :
                                log.status === "simulated" ? "bg-blue-500" : "bg-red-500"
                              }`} />
                              <span>
                                {log.status === "delivered" ? (lang === "hi" ? "सक्रिय संदेश भेजा गया" : "Real SMS Dispatched") :
                                 log.status === "forwarded_via_telemetry" ? (lang === "hi" ? "टेलीमेट्री प्रेषित" : "Telemetry Forwarded") :
                                 log.status === "simulated" ? (lang === "hi" ? "सिम्युलेटेड" : "Simulated Local") :
                                 (lang === "hi" ? "विफल" : "Failed")}
                              </span>
                            </span>

                            {/* Gateway Details */}
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                              via {log.gateway}
                            </span>
                          </div>
                        </div>

                        {/* Speech Bubble Message */}
                        <div className="p-3 bg-slate-50/80 rounded-lg text-xs text-slate-700 border border-slate-100 relative leading-relaxed font-sans">
                          "{log.message}"
                          <button
                            onClick={() => handleCopy(log.message, log.id)}
                            className="absolute right-2 bottom-2 p-1 bg-white hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-md border border-slate-200/60 shadow-xs cursor-pointer transition-all"
                            title="Copy SMS text"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Technical diagnostics logs */}
                        {log.details && (
                          <div className="p-2 bg-slate-900 text-slate-300 font-mono text-[9px] rounded-lg border border-slate-950 flex items-start gap-1.5 leading-normal">
                            <span className="text-blue-400 font-bold">INFO:</span>
                            <span className="break-all">{log.details}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Inline fallback for AlertTriangle to avoid missing import
function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
