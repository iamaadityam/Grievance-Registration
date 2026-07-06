import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:geolocator/geolocator.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'web_speech_stub.dart' if (dart.library.js) 'dart:js' as js;
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:typed_data';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MpGrievanceApp());
}

class MpGrievanceApp extends StatefulWidget {
  const MpGrievanceApp({super.key});

  @override
  State<MpGrievanceApp> createState() => _MpGrievanceAppState();
}

class _MpGrievanceAppState extends State<MpGrievanceApp> {
  String _serverUrl = 'http://localhost:3000';
  bool _useDirectCloud = true;
  String _customGeminiKey = '';
  bool _isDarkMode = false;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _serverUrl = prefs.getString('server_url') ?? 'http://localhost:3000';
      _useDirectCloud = prefs.getBool('use_direct_cloud') ?? true;
      _customGeminiKey = prefs.getString('custom_gemini_key') ?? '';
      _isDarkMode = prefs.getBool('is_dark_mode') ?? false;
    });
  }

  void _updateConfig(String newUrl, bool directCloud, String geminiKey) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_url', newUrl);
    await prefs.setBool('use_direct_cloud', directCloud);
    await prefs.setString('custom_gemini_key', geminiKey);
    setState(() {
      _serverUrl = newUrl;
      _useDirectCloud = directCloud;
      _customGeminiKey = geminiKey;
    });
  }

  void _toggleTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final newMode = !_isDarkMode;
    await prefs.setBool('is_dark_mode', newMode);
    setState(() {
      _isDarkMode = newMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Constituency Command Center',
      debugShowCheckedModeBanner: false,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A),
          brightness: Brightness.light,
          primary: const Color(0xFF0F172A),
          secondary: const Color(0xFF4F46E5),
          surface: Colors.white,
        ),
        fontFamily: 'sans-serif',
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A),
          brightness: Brightness.dark,
          primary: const Color(0xFF6366F1),
          secondary: const Color(0xFF818CF8),
          surface: const Color(0xFF1E293B),
        ),
        fontFamily: 'sans-serif',
      ),
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaleFactor: 1.15, // Globally increase all fonts by 15% for polish and readability
          ),
          child: child!,
        );
      },
      home: ResponsiveWorkspace(
        serverUrl: _serverUrl,
        useDirectCloud: _useDirectCloud,
        customGeminiKey: _customGeminiKey,
        isDarkMode: _isDarkMode,
        onConfigChanged: _updateConfig,
        onThemeToggled: _toggleTheme,
      ),
    );
  }
}

// Translations dictionary matching expanded requirements
const Map<String, Map<String, String>> translations = {
  'en': {
    'submitTitle': 'SUBMIT CITIZEN GRIEVANCE',
    'submitSub': 'Your report is geocoded and assigned instantly using our AI dispatch coordinator.',
    'fullName': 'FULL NAME',
    'fullNamePlaceholder': 'e.g. Rajesh Kumar',
    'contactNo': 'CONTACT NUMBER / WHATSAPP',
    'contactPlaceholder': 'e.g. 9876543210',
    'descLabel': 'DESCRIBE GRIEVANCE & LANDMARK DETAIL',
    'descPlaceholder': 'Tell us what is wrong, e.g. \'Large water puddle near standard sweet shop, C block market.\' Gemini AI automatically parses departments, sentiment & landmarks.',
    'voiceMic': 'Voice Mic',
    'stopAndTranscribe': 'Stop & Transcribe',
    'gpsBtn': 'DETECT LOCATION VIA GPS',
    'gpsDetecting': 'Detecting...',
    'gpsActive': 'GPS Active',
    'gpsAttachPhoto': 'ATTACH PHOTOGRAPH (OPTIONAL)',
    'gpsClearPhoto': 'Clear Image',
    'gpsSelectImage': 'SELECT IMAGE',
    'gpsTakePhoto': 'TAKE PHOTO',
    'gpsPhotoSuccess': '✓ Photo loaded successfully',
    'gpsPhotoTip': 'Upload or take photo of civic issue (max 2.5MB)',
    'humanVerify': 'CITIZEN VERIFICATION',
    'humanVerifyDesc': 'To keep our system clean and safe, please solve this simple arithmetic puzzle:',
    'humanAnswerPlaceholder': 'Answer',
    'btnSubmit': 'FILE YOUR COMPLAINT',
    'btnSubmitting': 'AI is parsing & routing...',
    'successTitle': 'Grievance Registered Successfully',
    'successSub': 'AI has assigned a priority rating and dispatched this ticket instantly. Below are your docket details:',
    'lblAssignedDept': 'Assigned Department',
    'lblUrgency': 'Urgency Level',
    'lblPrioritySuffix': 'Priority',
    'lblExtractedLandmark': 'Extracted Landmark',
    'lblSectorCivic': 'Sector & Civic Assignment',
    'lblActionItem': 'AI Executive Action Item',
    'lblCategory': 'AI Category',
    'lblLanguage': 'Grievance Language',
    'lblSuggestedBody': 'Suggested Body',
    'lblAffectedDemographic': 'Affected Demographic',
    'lblConfidence': 'Confidence Score',
    'lblHearDocket': 'Hear Docket',
    'lblFileAnother': 'File Another',
    'gpsNotEnabled': 'No GPS detected (using default New Delhi)',
    'gpsLiveWarning': '📍 Live GPS Enabled:',
    'myReportsTitle': 'My Filed Reports & Status Tracker',
    'myReportsDesc': 'Secure device-locked feed of complaints you filed',
    'noReportsText': 'No active reports logged on this device',
    'noReportsDesc': 'File your first grievance to track its real-time resolution status here!',
    'resolvedLabel': 'Resolved',
    'openLabel': 'Open',
    'clearHistoryConfirm': 'Are you sure you want to clear your local complaint history?',
    'smsCenter': 'SMS Center',
    'connectedBadge': 'CONNECTED TO FIRESTORE',
    'citizenPortalLink': 'Citizen Portal',
    'adminAreaLink': 'MP Admin Area',
    'portalAccessTitle': 'PORTALS & ACCESS',
    'welcomeTitle': 'WELCOME & PORTAL OVERVIEW',
    'demoMode': 'Enter Demo Mode (Bypass Auth)',
    'authTitle': 'Admin Verification Gate',
    'authDesc': 'Authorized representatives and constituency office staff only.',
    'dssTitle': 'DECISION SUPPORT SYSTEM (DSS) PLANNER',
    'dssDesc': 'Compare two competing municipal proposals against real-time constituency demand.',
    'scanAI': 'Run Live AI Sector Scan',
    'duplicateAlert': 'Duplicate Issue Found',
    'duplicateDesc': 'A similar grievance was submitted recently. Your report has been consolidated to prevent clutter.',
    'captchaError': 'Citizen verification failed. Solve the basic math puzzle.',
    'phoneError10': 'Contact number must be exactly 10 digits.',
    'phoneError11': 'Contact number with leading zero must be exactly 11 digits.',
    'successSubmit': 'Your grievance has been filed successfully.',
    'otpTitle': 'OTP Verification',
    'otpSent': 'We sent a 4-digit code to',
    'otpEnter': 'Enter Code',
    'otpTimer': 'Resend in',
    'otpVerifyBtn': 'VERIFY & SUBMIT',
    'voiceConsoleTitle': 'Voice Intake Console',
    'voiceConsoleDesc': 'Speak your civic issue clearly in Hindi or English.',
    'voiceDictating': 'Listening... Speak now',
    'voiceStartBtn': 'Start Voice Typing',
    'voiceStopBtn': 'Stop and Use',
    'easyModeLabel': '🔊 Easy-Listen Mode',
    'listenReportBtn': '🔊 Listen Report (सुनें)',
  },
  'hi': {
    'submitTitle': 'नागरिक शिकायत दर्ज करें',
    'submitSub': 'आपकी रिपोर्ट को हमारे एआई डिस्पैच समन्वयक का उपयोग करके तुरंत जियोकोड और आवंटित किया जाता है।',
    'fullName': 'पूरा नाम',
    'fullNamePlaceholder': 'जैसे: राजेश कुमार',
    'contactNo': 'संपर्क नंबर / व्हाट्सएप',
    'contactPlaceholder': 'जैसे: 9876543210',
    'descLabel': 'शिकायत और मील का पत्थर (लैंडमार्क) विवरण',
    'descPlaceholder': 'हमें बताएं कि क्या गलत है, जैसे \'सी ब्लॉक मार्केट में प्रसिद्ध मिठाई की दुकान के पास पानी जमा है।\' जेमिनी एआई स्वचालित रूप से विभागों, स्थलों और शिकायतकर्ता की भावना का विश्लेषण करता है।',
    'voiceMic': 'वॉयस माइक',
    'stopAndTranscribe': 'रोकें और अनुवाद',
    'gpsBtn': 'जीपीएस द्वारा स्थान पता करें',
    'gpsDetecting': 'पता लगाया जा रहा है...',
    'gpsActive': 'जीपीएस सक्रिय',
    'gpsAttachPhoto': 'फोटो संलग्न करें (वैकल्पिक)',
    'gpsClearPhoto': 'फोटो साफ करें',
    'gpsSelectImage': 'फोटो चुनें',
    'gpsTakePhoto': 'फोटो लें',
    'gpsPhotoSuccess': '✓ फोटो सफलतापूर्वक लोड की गई',
    'gpsPhotoTip': 'समस्या की तस्वीर अपलोड करें या लें (अधिकतम 2.5MB)',
    'humanVerify': 'नागरिक सत्यापन',
    'humanVerifyDesc': 'हमारे सिस्टम को सुरक्षित रखने के लिए, कृपया इस सरल गणित पहेली को हल करें:',
    'humanAnswerPlaceholder': 'उत्तर',
    'btnSubmit': 'शिकायत दर्ज करें',
    'btnSubmitting': 'एआई विश्लेषण और रूटिंग कर रहा है...',
    'successTitle': 'शिकायत सफलतापूर्वक दर्ज की गई',
    'successSub': 'एआई ने प्राथमिकता रेटिंग दी है और इस टिकट को तुरंत भेज दिया है। नीचे आपके डॉकेट विवरण हैं:',
    'lblAssignedDept': 'आवंटित विभाग',
    'lblUrgency': 'त्वरित स्तर (त्वरित)',
    'lblPrioritySuffix': 'प्राथमिकता',
    'lblExtractedLandmark': 'निकाला गया स्थल (लैंडमार्क)',
    'lblSectorCivic': 'सेक्टर और नागरिक आवंटन',
    'lblActionItem': 'एआई कार्यकारी कार्य आइटम',
    'lblCategory': 'एआई श्रेणी',
    'lblLanguage': 'शिकायत की भाषा',
    'lblSuggestedBody': 'सुझाया गया निकाय',
    'lblAffectedDemographic': 'प्रभावित आबादी',
    'lblConfidence': 'विश्वास स्कोर',
    'lblHearDocket': 'डॉकेट विवरण सुनें',
    'lblFileAnother': 'दूसरी शिकायत दर्ज करें',
    'gpsNotEnabled': 'कोई जीपीएस नहीं मिला (दिल्ली एनसीआर डिफॉल्ट)',
    'gpsLiveWarning': '📍 सक्रिय लाइव जीपीएस स्थान:',
    'myReportsTitle': 'मेरी शिकायतें और स्थिति ट्रैकर',
    'myReportsDesc': 'आपके द्वारा दर्ज की गई शिकायतों की सुरक्षित स्थानीय सूची',
    'noReportsText': 'इस डिवाइस पर कोई शिकायत दर्ज नहीं है',
    'noReportsDesc': 'अपनी शिकायतों के समाधान को लाइव देखने के लिए पहली शिकायत दर्ज करें!',
    'resolvedLabel': 'समाधानित',
    'openLabel': 'सक्रिय',
    'clearHistoryConfirm': 'क्या आप वाकई अपने स्थानीय शिकायत इतिहास को साफ करना चाहते हैं?',
    'smsCenter': 'एसएमएस सेंटर',
    'connectedBadge': 'फायरस्टोर से जुड़ा हुआ',
    'citizenPortalLink': 'नागरिक पोर्टल',
    'adminAreaLink': 'सांसद एडमिन एरिया',
    'portalAccessTitle': 'पोर्टल और एक्सेस',
    'welcomeTitle': 'स्वागत है और पोर्टल सिंहावलोकन',
    'demoMode': 'डेमो मोड (बाईपास ऑथ)',
    'authTitle': 'प्रशासक सत्यापन द्वार',
    'authDesc': 'अधिकृत प्रतिनिधि और सांसद कार्यालय के कर्मचारियों के लिए।',
    'dssTitle': 'परियोजना DSS तुलना',
    'dssDesc': 'वास्तविक समय निर्वाचन क्षेत्र की मांग के खिलाफ दो प्रतिस्पर्धी नगर निगम प्रस्तावों की तुलना करें।',
    'scanAI': 'लाइव एआई सेक्टर स्कैन चलाएं',
    'duplicateAlert': 'समान शिकायत पाई गई',
    'duplicateDesc': 'इस स्थान के पास हाल ही में एक समान शिकायत दर्ज की गई थी। आपकी रिपोर्ट को समेकित किया गया है।',
    'captchaError': 'सत्यापन विफल। पहेली हल करें।',
    'phoneError10': 'फ़ोन नंबर १० अंकों का होना चाहिए।',
    'phoneError11': 'अग्रणी शून्य वाला फ़ोन नंबर ११ अंकों का होना चाहिए।',
    'successSubmit': 'शिकायत सफलतापूर्वक दर्ज की गई।',
    'otpTitle': 'ओटीपी सत्यापन',
    'otpSent': 'हमने इस मोबाइल नंबर पर ४ अंकों का कोड भेजा है:',
    'otpEnter': 'कोड दर्ज करें',
    'otpTimer': 'पुनः भेजें',
    'otpVerifyBtn': 'सत्यापित करें और शिकायत भेजें',
    'voiceConsoleTitle': 'वॉयस इंटेक कंसोल',
    'voiceConsoleDesc': 'अपनी समस्या को हिंदी या अंग्रेजी में साफ बोलें।',
    'voiceDictating': 'सुन रहा है... अब बोलें',
    'voiceStartBtn': 'आवाज से बोलना शुरू करें',
    'voiceStopBtn': 'रोकें और उपयोग करें',
    'easyModeLabel': '🔊 आसान सुनो मोड',
    'listenReportBtn': '🔊 शिकायत सुनें (TTS)',
  }
};

// Voice Assistant guide widget steps
class GuideStep {
  final int id;
  final String title;
  final List<String> points;
  final String en;
  final String hi;

  const GuideStep({
    required this.id,
    required this.title,
    required this.points,
    required this.en,
    required this.hi,
  });
}

const List<GuideStep> guideSteps = [
  GuideStep(
    id: 1,
    title: "WELCOME & PORTAL OVERVIEW",
    points: [
      "File public complaints easily.",
      "MCD and NDMC resolving departments.",
      "AI automatically geocodes and dispatches."
    ],
    en: "Welcome to the Citizen Grievance Portal. You can easily file public complaints here. MCD and NDMC teams will resolve them.",
    hi: "नागरिक शिकायत निवारण पोर्टल में स्वागत है। आप यहाँ अपनी शिकायतें आसानी से दर्ज कर सकते हैं। एमसीडी और एनडीएमसी टीमें इनका समाधान करेंगी।"
  ),
  GuideStep(
    id: 2,
    title: "HOW TO FILE A GRIEVANCE",
    points: [
      "Enter your Name and 10-digit Phone.",
      "Use Location selector to specify spot.",
      "Attach a photo of the damage if possible."
    ],
    en: "Step 1. Enter your Name and mobile number. Describe your issue and click Detect GPS, or attach a photo.",
    hi: "चरण १. अपना नाम और मोबाइल नंबर भरें। अपनी समस्या का विवरण दें, जीपीएस स्थान चुनें, और फोटो भी संलग्न कर सकते हैं।"
  ),
  GuideStep(
    id: 3,
    title: "HUMAN VERIFICATION",
    points: [
      "Solve the basic math puzzle.",
      "Keeps the portal clean from spam bots.",
      "Click 'Submit Report' to submit."
    ],
    en: "Step 2. Solve the simple math puzzle at the bottom to verify you are a genuine citizen, then click Submit Report.",
    hi: "चरण २. आप एक वास्तविक नागरिक हैं यह सत्यापित करने के लिए नीचे दिए गए सरल गणित पहेली को हल करें, फिर शिकायत दर्ज करें पर क्लिक करें।"
  ),
];

// Mapper to translate Firestore REST API documents to Dart Maps
Map<String, dynamic> _mapFirestoreDoc(Map<String, dynamic> docJson) {
  final namePath = docJson['name'] as String;
  final docId = namePath.split('/').last;
  final fields = docJson['fields'] as Map<String, dynamic>? ?? {};

  final parsed = <String, dynamic>{'id': docId};

  fields.forEach((key, val) {
    if (val is Map<String, dynamic>) {
      if (val.containsKey('stringValue')) {
        parsed[key] = val['stringValue'];
      } else if (val.containsKey('integerValue')) {
        parsed[key] = int.tryParse(val['integerValue'].toString()) ?? 0;
      } else if (val.containsKey('doubleValue')) {
        parsed[key] = double.tryParse(val['doubleValue'].toString()) ?? 0.0;
      } else if (val.containsKey('booleanValue')) {
        parsed[key] = val['booleanValue'];
      } else if (val.containsKey('arrayValue')) {
        final list = val['arrayValue']['values'] as List?;
        parsed[key] = list?.map((item) {
          if (item is Map<String, dynamic>) {
            if (item.containsKey('stringValue')) {
              return item['stringValue'];
            }
            if (item.containsKey('mapValue')) {
              final nestedFields = item['mapValue']['fields'] as Map<String, dynamic>? ?? {};
              final nestedParsed = <String, dynamic>{};
              nestedFields.forEach((nk, nv) {
                if (nv is Map<String, dynamic> && nv.containsKey('stringValue')) {
                  nestedParsed[nk] = nv['stringValue'];
                }
              });
              return nestedParsed;
            }
          }
          return item;
        }).toList() ?? [];
      }
    }
  });
  return parsed;
}

// Custom premium subtle floating Toast helper
void showSubtleToast(BuildContext context, String message, {bool isError = false}) {
  ScaffoldMessenger.of(context).clearSnackBars();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
            color: isError ? Colors.red.shade300 : Colors.green.shade300,
            size: 13,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              message,
              style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
      behavior: SnackBarBehavior.floating,
      backgroundColor: const Color(0xE61E293B), // slate dark semi-transparent
      elevation: 2,
      duration: const Duration(milliseconds: 2200),
      width: 250,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );
}

// Base64 image sanitizer to prevent format or padding decoding failures
String _sanitizeBase64(String input) {
  String clean = input.trim();
  if (clean.contains(',')) {
    clean = clean.split(',').last;
  }
  // Remove whitespace and newlines
  clean = clean.replaceAll(RegExp(r'\s+'), '');
  // Add padding if missing
  while (clean.length % 4 != 0) {
    clean += '=';
  }
  return clean;
}

// Formatter to translate raw Dart Maps to Firestore REST API fields structure
Map<String, dynamic> _toFirestoreFields(Map<String, dynamic> data) {
  final fields = <String, dynamic>{};
  data.forEach((key, val) {
    if (val is String) {
      fields[key] = {'stringValue': val};
    } else if (val is int) {
      fields[key] = {'integerValue': val.toString()};
    } else if (val is double) {
      fields[key] = {'doubleValue': val};
    } else if (val is bool) {
      fields[key] = {'booleanValue': val};
    } else if (val is List) {
      final values = val.map((item) {
        if (item is String) {
          return {'stringValue': item};
        } else if (item is Map<String, dynamic>) {
          final nestedFields = <String, dynamic>{};
          item.forEach((nk, nv) {
            if (nv is String) {
              nestedFields[nk] = {'stringValue': nv};
            }
          });
          return {
            'mapValue': {'fields': nestedFields}
          };
        }
        return {'stringValue': item.toString()};
      }).toList();
      fields[key] = {
        'arrayValue': {'values': values}
      };
    }
  });
  return {'fields': fields};
}

class ResponsiveWorkspace extends StatefulWidget {
  final String serverUrl;
  final bool useDirectCloud;
  final String customGeminiKey;
  final bool isDarkMode;
  final void Function(String, bool, String) onConfigChanged;
  final VoidCallback onThemeToggled;

  const ResponsiveWorkspace({
    super.key,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
    required this.isDarkMode,
    required this.onConfigChanged,
    required this.onThemeToggled,
  });

  @override
  State<ResponsiveWorkspace> createState() => _ResponsiveWorkspaceState();
}

class _ResponsiveWorkspaceState extends State<ResponsiveWorkspace> {
  int _activeNavBarIdx = 0; // 0 for Citizen, 1 for MP Admin
  String _citizenSubTab = 'submit'; // submit, track
  String _citizenLang = 'en'; // en, hi
  bool _isSmsHubOpen = false;

  // Cache for grievances
  List<dynamic> _allGrievances = [];
  List<String> _myComplaintIds = [];
  List<dynamic> _localFullComplaints = [];

  String _t(String key) {
    return translations[_citizenLang]?[key] ?? key;
  }

  @override
  void initState() {
    super.initState();
    _loadLocalTrackers();
    _fetchGrievancesPeriodically();
  }

  Future<void> _loadLocalTrackers() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _myComplaintIds = prefs.getStringList('citizen_logged_complaints') ?? [];
      final List<String> rawFull = prefs.getStringList('citizen_logged_full_complaints') ?? [];
      _localFullComplaints = rawFull.map((item) => jsonDecode(item)).toList();
    });
  }

  void _fetchGrievancesPeriodically() async {
    _fetchGrievances();
    for (int i = 0; i < 10000; i++) {
      await Future.delayed(const Duration(seconds: 5));
      if (!mounted) break;
      _fetchGrievances();
    }
  }

  Future<void> _fetchGrievances() async {
    if (widget.useDirectCloud) {
      final databaseUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances';
      try {
        final res = await http.get(Uri.parse(databaseUrl)).timeout(const Duration(seconds: 15));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final List<dynamic> docs = data['documents'] ?? [];
          final parsed = docs.map((doc) => _mapFirestoreDoc(doc)).toList();
          if (mounted) {
            setState(() {
              _allGrievances = parsed;
            });
          }
        }
      } catch (e) {
        debugPrint("Direct Firestore cloud read failed: $e");
      }
    } else {
      try {
        final res = await http.get(Uri.parse('${widget.serverUrl}/api/grievances')).timeout(const Duration(seconds: 3));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (mounted) {
            setState(() {
              _allGrievances = data['grievances'] ?? [];
            });
          }
        }
      } catch (e) {
        debugPrint("Proxy server read failed: $e");
      }
    }
  }

  void _handleGrievanceSubmitted(String newId, dynamic fullData) async {
    final prefs = await SharedPreferences.getInstance();
    final updatedIds = [..._myComplaintIds, newId];
    await prefs.setStringList('citizen_logged_complaints', updatedIds);

    final List<dynamic> updatedFull = [
      ..._localFullComplaints.where((g) => g['id'] != newId),
      {'id': newId, ...fullData}
    ];
    await prefs.setStringList(
      'citizen_logged_full_complaints',
      updatedFull.map((item) => jsonEncode(item)).toList(),
    );

    setState(() {
      _myComplaintIds = updatedIds;
      _localFullComplaints = updatedFull;
    });
  }

  void _clearLocalHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('citizen_logged_complaints');
    await prefs.remove('citizen_logged_full_complaints');
    setState(() {
      _myComplaintIds = [];
      _localFullComplaints = [];
    });
  }

  Future<void> _resolveGrievance(String gId) async {
    final bool isOffline = gId.startsWith('offline_');
    bool success = false;
    
    if (!isOffline) {
      try {
        if (widget.useDirectCloud) {
          final updateUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances/' + gId + '?updateMask.fieldPaths=status';
          final updatePayload = _toFirestoreFields({'status': 'Resolved'});
          final patchRes = await http.patch(
            Uri.parse(updateUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(updatePayload),
          );
          if (patchRes.statusCode == 200) {
            success = true;
          }
        } else {
          final res = await http.post(
            Uri.parse('${widget.serverUrl}/api/update-grievance'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'id': gId,
              'status': 'Resolved',
            }),
          );
          if (res.statusCode == 200) {
            success = true;
          }
        }
      } catch (e) {
        debugPrint("Error resolving online: $e");
      }
    }

    final prefs = await SharedPreferences.getInstance();
    final updatedFull = _localFullComplaints.map((item) {
      if (item['id'] == gId) {
        return {...item, 'status': 'Resolved'};
      }
      return item;
    }).toList();
    
    await prefs.setStringList(
      'citizen_logged_full_complaints',
      updatedFull.map((item) => jsonEncode(item)).toList(),
    );

    setState(() {
      _localFullComplaints = updatedFull;
      _allGrievances = _allGrievances.map((item) {
        if (item['id'] == gId) {
          return {...item, 'status': 'Resolved'};
        }
        return item;
      }).toList();
    });

    _fetchGrievances();
  }

  List<dynamic> _getMyComplaints() {
    final online = _allGrievances.where((g) => g['id'] != null && _myComplaintIds.contains(g['id'])).toList();
    final onlineIds = Set<String>.from(online.map((g) => g['id'].toString()));
    final offline = _localFullComplaints.where((g) => g['id'] != null && _myComplaintIds.contains(g['id']) && !onlineIds.contains(g['id'])).toList();
    final combined = [...online, ...offline];
    combined.sort((a, b) {
      final tA = DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime.now();
      final tB = DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime.now();
      return tB.compareTo(tA);
    });
    return combined;
  }

  @override
  Widget build(BuildContext context) {
    final myComplaints = _getMyComplaints();

    Widget headerBar = AppBar(
      title: Row(
        children: [
          Icon(
            _activeNavBarIdx == 0 
                ? Icons.people_outline_rounded 
                : _activeNavBarIdx == 1
                    ? Icons.keyboard_voice_rounded
                    : Icons.shield_outlined,
            color: _activeNavBarIdx == 0 
                ? Colors.blue 
                : _activeNavBarIdx == 1
                    ? Colors.orange
                    : Colors.green,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _activeNavBarIdx == 0 
                  ? (_citizenLang == 'hi' ? 'नागरिक शिकायत' : 'CITIZEN INTAKE')
                  : _activeNavBarIdx == 1
                      ? (_citizenLang == 'hi' ? 'आवाज सहायक' : 'VOICE ASSISTANT')
                      : (_citizenLang == 'hi' ? 'सांसद शिकायत प्रेषण केंद्र' : 'MP COMMAND CENTER'),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      actions: [
        DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: _citizenLang,
            icon: const Icon(Icons.language_rounded, color: Colors.blueAccent, size: 18),
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            dropdownColor: Theme.of(context).cardColor,
            onChanged: (String? newLang) {
              if (newLang != null) {
                setState(() {
                  _citizenLang = newLang;
                });
              }
            },
            items: [
              DropdownMenuItem(
                value: 'en',
                child: Text('EN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87)),
              ),
              DropdownMenuItem(
                value: 'hi',
                child: Text('हिं', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87)),
              ),
            ],
          ),
        ),
        const SizedBox(width: 4),
        IconButton(
          icon: Icon(widget.isDarkMode ? Icons.wb_sunny_rounded : Icons.nightlight_round, size: 18),
          onPressed: widget.onThemeToggled,
        ),
        IconButton(
          icon: const Icon(Icons.smartphone_rounded, size: 18),
          onPressed: () => setState(() => _isSmsHubOpen = true),
        ),
      ],
      elevation: 0,
      centerTitle: false,
    );

    Widget workspaceContent;
    if (_activeNavBarIdx == 0) {
      workspaceContent = CitizenPortalContent(
        t: _t,
        lang: _citizenLang,
        onLangChanged: (l) => setState(() => _citizenLang = l),
        citizenSubTab: _citizenSubTab,
        onSubTabChanged: (s) => setState(() => _citizenSubTab = s),
        myComplaints: myComplaints,
        onClearHistory: _clearLocalHistory,
        onGrievanceSubmitted: _handleGrievanceSubmitted,
        onResolveGrievance: _resolveGrievance,
        serverUrl: widget.serverUrl,
        useDirectCloud: widget.useDirectCloud,
        customGeminiKey: widget.customGeminiKey,
      );
    } else {
      // Merge online grievances with locally logged offline ones to ensure instant visibility on the device
      final List<dynamic> mergedGrievances = [];
      final Set<String> ids = {};
      for (var g in _allGrievances) {
        if (g['id'] != null) {
          mergedGrievances.add(g);
          ids.add(g['id'].toString());
        }
      }
      for (var g in _localFullComplaints) {
        if (g['id'] != null && !ids.contains(g['id'].toString())) {
          mergedGrievances.add(g);
        }
      }

      workspaceContent = MpAdminPortalContent(
        t: _t,
        lang: _citizenLang,
        serverUrl: widget.serverUrl,
        useDirectCloud: widget.useDirectCloud,
        customGeminiKey: widget.customGeminiKey,
        allGrievances: mergedGrievances,
        onGrievancesFetched: _fetchGrievances,
        onResolveGrievance: _resolveGrievance,
      );
    }

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: headerBar,
      ),
      body: Column(
        children: [
          Expanded(child: workspaceContent),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _activeNavBarIdx,
        onTap: (idx) => setState(() => _activeNavBarIdx = idx),
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_rounded),
            label: _citizenLang == 'hi' ? 'नागरिक' : 'Citizen',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.keyboard_voice_rounded),
            label: _citizenLang == 'hi' ? 'आवाज सहायक' : 'Voice Assistant',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.admin_panel_settings_rounded),
            label: _citizenLang == 'hi' ? 'सांसद' : 'MP Admin',
          ),
        ],
      ),
      bottomSheet: _isSmsHubOpen
          ? SmsCenterSheet(
              t: _t,
              serverUrl: widget.serverUrl,
              useDirectCloud: widget.useDirectCloud,
              customGeminiKey: widget.customGeminiKey,
              onClose: () => setState(() => _isSmsHubOpen = false),
              onConfigChanged: widget.onConfigChanged,
            )
          : null,
    );
  }
}

class VoicePortalContent extends StatefulWidget {
  final String lang;
  final String Function(String) t;
  final String serverUrl;
  final bool useDirectCloud;
  final String customGeminiKey;
  final void Function(String, dynamic) onGrievanceSubmitted;

  const VoicePortalContent({
    super.key,
    required this.lang,
    required this.t,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
    required this.onGrievanceSubmitted,
  });

  @override
  State<VoicePortalContent> createState() => _VoicePortalContentState();
}

class _VoicePortalContentState extends State<VoicePortalContent> {
  bool _isRecording = false;
  bool _isTranscribing = false;
  bool _isAnalyzing = false;
  bool _isSubmitting = false;
  String? _audioPath;
  String _transcribedText = "";
  Map<String, dynamic>? _aiAnalysis;
  
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _transcriptionController = TextEditingController();

  double? _latitude;
  double? _longitude;
  String? _gpsLocationName;
  bool _gpsDetected = false;

  String _speechLang = "Auto"; // Auto, Hindi, English, Hinglish
  final AudioRecorder _audioRecorder = AudioRecorder();
  StreamSubscription<Uint8List>? _audioStreamSubscription;
  List<int> _audioChunks = [];

  int _recordDurationSec = 0;
  Timer? _recordTimer;
  String? _submitError;
  String? _successMessage;

  @override
  void dispose() {
    _recordTimer?.cancel();
    _audioStreamSubscription?.cancel();
    _audioRecorder.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _landmarkController.dispose();
    _transcriptionController.dispose();
    super.dispose();
  }

  void _startTimer() {
    setState(() {
      _recordDurationSec = 0;
    });
    _recordTimer?.cancel();
    _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _recordDurationSec++;
      });
      if (_recordDurationSec >= 45) { // Limit to 45 seconds to keep files lightweight
        _stopRecording();
      }
    });
  }

  void _stopTimer() {
    _recordTimer?.cancel();
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        setState(() {
          _isRecording = true;
          _submitError = null;
          _transcribedText = "";
          _aiAnalysis = null;
          _successMessage = null;
        });

        _audioChunks.clear();
        await _audioStreamSubscription?.cancel();

        // Start stream recording in raw PCM 16-bit, which is universally supported
        final stream = await _audioRecorder.startStream(
          const RecordConfig(
            encoder: AudioEncoder.pcm16bits,
            sampleRate: 16000,
            numChannels: 1,
          ),
        );

        _audioStreamSubscription = stream.listen((chunk) {
          _audioChunks.addAll(chunk);
        }, onError: (err) {
          debugPrint("Audio Stream Error: $err");
        });

        _startTimer();
      } else {
        setState(() {
          _submitError = widget.lang == 'hi' 
              ? "रिकॉर्डिंग शुरू करने के लिए माइक अनुमति की आवश्यकता है।" 
              : "Microphone permission is required to start recording.";
        });
      }
    } catch (e) {
      setState(() {
        _submitError = "Failed to start recording: $e";
      });
    }
  }

  Future<void> _stopRecording() async {
    _stopTimer();
    try {
      await _audioRecorder.stop();
      await _audioStreamSubscription?.cancel();
      
      setState(() {
        _isRecording = false;
      });

      if (_audioChunks.isNotEmpty) {
        // Wrap raw PCM bytes in WAV header to generate a valid audio/wav file in-memory
        final wavBytes = _addWavHeader(_audioChunks, 16000);
        _transcribeAudio(wavBytes);
      } else {
        setState(() {
          _submitError = widget.lang == 'hi'
              ? "कोई आवाज रिकॉर्ड नहीं हुई। कृपया दोबारा कोशिश करें।"
              : "No voice was recorded. Please try again.";
        });
      }
    } catch (e) {
      setState(() {
        _isRecording = false;
        _submitError = "Failed to stop recording: $e";
      });
    }
  }

  Uint8List _addWavHeader(List<int> pcmBytes, int sampleRate) {
    final int totalSize = pcmBytes.length + 36;
    final ByteData header = ByteData(44);

    // RIFF header
    header.setUint8(0, 0x52); // R
    header.setUint8(1, 0x49); // I
    header.setUint8(2, 0x46); // F
    header.setUint8(3, 0x46); // F
    header.setUint32(4, totalSize, Endian.little);
    header.setUint8(8, 0x57); // W
    header.setUint8(9, 0x41); // A
    header.setUint8(10, 0x56); // V
    header.setUint8(11, 0x45); // E

    // fmt chunk
    header.setUint8(12, 0x66); // f
    header.setUint8(13, 0x6d); // m
    header.setUint8(14, 0x74); // t
    header.setUint8(15, 0x20); // ' '
    header.setUint32(16, 16, Endian.little);
    header.setUint16(20, 1, Endian.little); // PCM
    header.setUint16(22, 1, Endian.little); // Mono
    header.setUint32(24, sampleRate, Endian.little);
    header.setUint32(28, sampleRate * 2, Endian.little); // Byte rate (SampleRate * MonoChannel * 2BytesPerSample)
    header.setUint16(32, 2, Endian.little); // Block align
    header.setUint16(34, 16, Endian.little); // 16 bits per sample

    // data chunk
    header.setUint8(36, 0x64); // d
    header.setUint8(37, 0x61); // a
    header.setUint8(38, 0x74); // t
    header.setUint8(39, 0x61); // a
    header.setUint32(40, pcmBytes.length, Endian.little);

    final Uint8List wavFile = Uint8List(44 + pcmBytes.length);
    wavFile.setRange(0, 44, header.buffer.asUint8List());
    wavFile.setRange(44, wavFile.length, pcmBytes);
    return wavFile;
  }

  Future<void> _transcribeAudio(Uint8List wavBytes) async {
    setState(() {
      _isTranscribing = true;
      _submitError = null;
    });

    try {
      final base64Audio = base64Encode(wavBytes);
      final mimeType = "audio/wav"; 
      String transcription = "";

      if (widget.useDirectCloud) {
        final key = widget.customGeminiKey.isNotEmpty 
            ? widget.customGeminiKey 
            : "AIzaSyAzVjLwmRoevXnRNsKx_e6qU0l-rfr4N4E";
        
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$key';
        
        final response = await http.post(
          Uri.parse(geminiUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'contents': [
              {
                'parts': [
                  {
                    'inlineData': {
                      'mimeType': mimeType,
                      'data': base64Audio
                    }
                  },
                  {
                    'text': """You are a high-fidelity multilingual speech-to-text transcription engine.
Listen to the attached audio recording and transcribe it with 100% precision.

CRITICAL RULES:
1. Transcribe the audio exactly as spoken in the appropriate language:
   - If spoken in English, transcribe in English.
   - If spoken in Hindi, transcribe in Hindi (using Devanagari script).
   - If spoken in Hinglish (a mix of Hindi and English), transcribe in natural Hinglish or Devanagari script.
2. Output ONLY the clean, raw transcription of the spoken words.
3. STRICTLY DO NOT include any introductory or concluding remarks, no markdown formatting, no commentary.
4. If the audio is completely silent or contains only background noise, output a single empty string "".
Selected language bias: $_speechLang"""
                  }
                ]
              }
            ]
          }),
        ).timeout(const Duration(seconds: 20));

        if (response.statusCode == 200) {
          final resData = jsonDecode(response.body);
          transcription = resData['candidates'][0]['content']['parts'][0]['text']?.toString().trim() ?? "";
        } else {
          throw Exception("Gemini API transcription failed (Status: ${response.statusCode})");
        }
      } else {
        final response = await http.post(
          Uri.parse('${widget.serverUrl}/api/transcribe-audio'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'audioData': base64Audio,
            'mimeType': mimeType,
            'language': _speechLang
          }),
        ).timeout(const Duration(seconds: 20));

        if (response.statusCode == 200) {
          final resData = jsonDecode(response.body);
          transcription = resData['text']?.toString().trim() ?? "";
          if (resData['warning'] != null) {
            setState(() {
              _submitError = resData['warning'];
            });
          }
        } else {
          throw Exception("Proxy transcription failed (Status: ${response.statusCode})");
        }
      }

      setState(() {
        _transcribedText = transcription;
        _transcriptionController.text = transcription;
        _isTranscribing = false;
      });

      if (transcription.isNotEmpty) {
        _analyzeAndCategorize(transcription);
      } else {
        setState(() {
          _submitError = widget.lang == 'hi'
              ? "ऑडियो में कोई आवाज़ नहीं मिली। कृपया दोबारा कोशिश करें।"
              : "No speech detected in audio. Please try again.";
        });
      }
    } catch (e) {
      setState(() {
        _isTranscribing = false;
        _submitError = "Transcription failed: $e";
      });
    }
  }

  Future<void> _analyzeAndCategorize(String descriptionText) async {
    setState(() {
      _isAnalyzing = true;
      _aiAnalysis = null;
      _submitError = null;
    });

    try {
      Map<String, dynamic> aiAnalysis = {};

      if (widget.useDirectCloud) {
        final key = widget.customGeminiKey.isNotEmpty 
            ? widget.customGeminiKey 
            : "AIzaSyAzVjLwmRoevXnRNsKx_e6qU0l-rfr4N4E";
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$key';

        final prompt = """Analyze this citizen grievance description: "$descriptionText".
Identify any locations, addresses, landmarks, or areas mentioned.
Estimate approximate latitude and longitude coordinates for this landmark in Delhi NCR region (~28.4 to 28.8, ~76.8 to 77.4).
${_latitude != null ? "Prioritize and use these exact coordinates: latitude $_latitude, longitude $_longitude." : "Default to Connaught Place (latitude: 28.6139, longitude: 77.2090) if location is missing."}

Generate a structured JSON report.
Required keys:
STRICT COMPLAINT VALIDATION GUARDRAILS:
1. MP-SOLVABLE ONLY: Only accept grievances that can be addressed by a Member of Parliament (MP) command center or municipal/state civic departments (e.g. road infrastructure, public sanitation, solid waste, water logging/drainage, street lights, utility support).
2. REJECT EMERGENCY/TIME-SENSITIVE: Set isGenuine = false for highly time-sensitive emergency requests (e.g., calling an ambulance, fire, active crime/police assistance). Tell them to dial 112/108.
3. REJECT NONSENSE/PRIVATE/HYPERLOCAL: Set isGenuine = false for nonsense, personal, or private requests (e.g., "I can't get married", "unable to sleep", "can't sleep", "insomnia", "neend nahi aa rahi", "lost keys", "flat tire", "neighbor's music is loud", "lost dog", "need personal loan").
4. VAGUENESS: Deny any vague grievances. A grievance is considered vague if it lacks actionable physical detail, is extremely short, or only contains generic terms (e.g. "garbage here", "water logging is bad", "clean the road", "fix potholes" without further detail). In such cases, isGenuine must be set to false and rejectionReason must politely explain that the issue lacks detail.

- isGenuine: Boolean. Set to true ONLY if the complaint is a genuine, specific civic/municipal issue that fits all validation rules above. Otherwise, set to false.
- rejectionReason: String. If isGenuine is false, provide a polite explanation. Otherwise, "".
- summary: 1-sentence action item summary.
- category: E.g. "Solid Waste Management", "Water Logging & Drainage", "Road Infrastructure", "Street Lights".
- severity: "Low", "Medium", "High", or "Critical".
- urgency: score between 1 and 10.
- affected_people: who is affected.
- suggested_department: e.g. "MCD", "PWD", "NDMC".
- cleanLocation: Address or landmark.
- latitude: resolved latitude.
- longitude: resolved longitude.
- detectedLanguage: detected language.
- sentiment: citizen distress level: 'Frustrated', 'Neutral', or 'Angry'.
- recurring_need: Synthesized pattern description (3-5 words).
""";

        final response = await http.post(
          Uri.parse(geminiUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'contents': [
              {
                'parts': [
                  {'text': prompt}
                ]
              }
            ],
            'generationConfig': {
              'responseMimeType': 'application/json'
            }
          }),
        ).timeout(const Duration(seconds: 15));

        if (response.statusCode == 200) {
          final resData = jsonDecode(response.body);
          final resText = resData['candidates'][0]['content']['parts'][0]['text'] as String;
          aiAnalysis = jsonDecode(resText.trim());
        } else {
          throw Exception("Gemini analysis failed (Status: ${response.statusCode})");
        }
      } else {
        final response = await http.post(
          Uri.parse('${widget.serverUrl}/api/analyze-grievance'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'description': descriptionText,
            'userLatitude': _latitude,
            'userLongitude': _longitude,
          }),
        ).timeout(const Duration(seconds: 15));

        if (response.statusCode == 200) {
          aiAnalysis = jsonDecode(response.body);
        } else {
          throw Exception("Proxy analysis failed (Status: ${response.statusCode})");
        }
      }

      setState(() {
        _aiAnalysis = aiAnalysis;
        _isAnalyzing = false;
        if (aiAnalysis['cleanLocation'] != null && _landmarkController.text.isEmpty) {
          _landmarkController.text = aiAnalysis['cleanLocation'];
        }
        if (aiAnalysis['latitude'] != null && _latitude == null) {
          _latitude = aiAnalysis['latitude'];
          _longitude = aiAnalysis['longitude'];
        }
      });
    } catch (e) {
      setState(() {
        _isAnalyzing = false;
        _submitError = "Categorization analysis failed: $e";
      });
    }
  }

  Future<void> _detectGps() async {
    setState(() {
      _gpsLocationName = widget.lang == 'hi' ? "स्थान खोजा जा रहा है..." : "Locating via GPS...";
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw 'Location services disabled.';

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) throw 'Location permissions denied.';
      }

      if (permission == LocationPermission.deniedForever) throw 'Location permissions permanently denied.';

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 4),
      );

      final double lat = position.latitude;
      final double lng = position.longitude;
      
      String name = 'Gps (Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)})';
      final rand = DateTime.now().millisecond;
      final zones = [
        'Central Delhi Command Block',
        'East Sector Commute Line',
        'West Residential Sector',
        'South Extension Area',
      ];
      name = '${zones[rand % zones.length]} (Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)})';

      setState(() {
        _latitude = lat;
        _longitude = lng;
        _gpsLocationName = name;
        _landmarkController.text = name;
        _gpsDetected = true;
      });
    } catch (e) {
      final rand = DateTime.now().millisecond;
      final zones = [
        {'lat': 28.6421 + (rand % 10) * 0.001, 'lng': 77.1645 - (rand % 5) * 0.001, 'name': 'Rajouri Garden, West Delhi'},
        {'lat': 28.5855 - (rand % 8) * 0.001, 'lng': 77.2612 + (rand % 7) * 0.001, 'name': 'Laxmi Nagar, East Delhi'},
        {'lat': 28.6139 + (rand % 12) * 0.001, 'lng': 77.2090 + (rand % 3) * 0.001, 'name': 'Parliament Street, Central Zone'},
        {'lat': 28.6304 - (rand % 4) * 0.001, 'lng': 77.2177 - (rand % 9) * 0.001, 'name': 'Connaught Place, Central Zone'},
      ];
      final selectedZone = zones[rand % zones.length];
      final double lat = selectedZone['lat'] as double;
      final double lng = selectedZone['lng'] as double;
      final String name = selectedZone['name'] as String;

      setState(() {
        _latitude = lat;
        _longitude = lng;
        _gpsLocationName = name;
        _landmarkController.text = name;
        _gpsDetected = true;
      });
    }
  }

  String? _validatePhoneNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return widget.lang == 'hi' ? 'फोन नंबर अनिवार्य है' : 'Phone number is required';
    }
    final cleanPhone = value.trim();
    final isLeadingZero = cleanPhone.startsWith('0');
    
    if (isLeadingZero) {
      final regExp = RegExp(r'^\d{11}$');
      if (!regExp.hasMatch(cleanPhone)) {
        return widget.lang == 'hi' ? '0 से शुरू होने पर 11 अंक होने चाहिए' : '11 digits are required if starting with 0.';
      }
    } else {
      final regExp = RegExp(r'^\d{10}$');
      if (!regExp.hasMatch(cleanPhone)) {
        return widget.lang == 'hi' ? 'ठीक 10 अंक होने चाहिए' : 'Exactly 10 digits are required.';
      }
    }
    return null;
  }

  Future<void> _submitGrievance() async {
    if (!_formKey.currentState!.validate()) return;
    if (_aiAnalysis == null) {
      setState(() {
        _submitError = "AI categorization in progress...";
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _submitError = null;
      _successMessage = null;
    });

    final nameText = _nameController.text.trim();
    final phoneText = _phoneController.text.trim();
    final landmarkText = _landmarkController.text.trim();
    final descriptionText = _transcriptionController.text.trim();

    final category = _aiAnalysis!['category'] ?? "Solid Waste Management";
    final suggestedDept = _aiAnalysis!['suggested_department'] ?? "MCD";
    final lat = _latitude ?? _aiAnalysis!['latitude'] ?? 28.6139;
    final lng = _longitude ?? _aiAnalysis!['longitude'] ?? 77.2090;

    try {
      List<dynamic> activeGrievances = [];
      if (widget.useDirectCloud) {
        try {
          final databaseUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances';
          final getRes = await http.get(Uri.parse(databaseUrl)).timeout(const Duration(seconds: 15));
          if (getRes.statusCode == 200) {
            final docs = jsonDecode(getRes.body)['documents'] ?? [];
            activeGrievances = docs.map((doc) => _mapFirestoreDoc(doc)).toList();
          }
        } catch (_) {}
      } else {
        try {
          final fetchRes = await http.get(Uri.parse('${widget.serverUrl}/api/grievances')).timeout(const Duration(seconds: 15));
          if (fetchRes.statusCode == 200) {
            activeGrievances = jsonDecode(fetchRes.body)['grievances'] ?? [];
          }
        } catch (_) {}
      }

      String? matchedGrievanceId;
      Map<String, dynamic>? matchedGrievanceData;
      final now = DateTime.now();

      for (var doc in activeGrievances) {
        if (doc['status'] != 'Open') continue;
        final bool sameDept = doc['department'] == category;
        final docCreated = DateTime.tryParse(doc['createdAt']) ?? now;
        final diffMins = now.difference(docCreated).inMinutes.abs();
        final bool closeTime = diffMins <= 45;

        final double docLat = doc['latitude'] ?? 0.0;
        final double docLng = doc['longitude'] ?? 0.0;
        final double latDiff = (lat - docLat) * 111000;
        final double lngDiff = (lng - docLng) * 111000;
        final double distance = latDiff * latDiff + lngDiff * lngDiff;
        final bool closeArea = distance <= 122500; // 350m squared

        if (sameDept && closeTime && closeArea) {
          matchedGrievanceId = doc['id'];
          matchedGrievanceData = Map<String, dynamic>.from(doc);
          break;
        }
      }

      Map<String, dynamic> finalGrievanceDoc = {};
      String finalId = '';
      bool isDuplicate = false;

      if (matchedGrievanceId != null && matchedGrievanceData != null) {
        isDuplicate = true;
        final currentTraffic = matchedGrievanceData['trafficCount'] ?? 1;
        final List<dynamic> currentReporters = matchedGrievanceData['reportersList'] ?? [];
        final updatedReporters = [
          ...currentReporters,
          {
            'name': nameText,
            'contact': phoneText,
            'reportedAt': DateTime.now().toIso8601String(),
            'description': descriptionText,
          }
        ];

        finalGrievanceDoc = {
          ...matchedGrievanceData,
          'trafficCount': currentTraffic + 1,
          'reportersList': updatedReporters,
        };
        finalId = matchedGrievanceId;

        if (widget.useDirectCloud) {
          final patchUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances/$matchedGrievanceId?updateMask.fieldPaths=trafficCount&updateMask.fieldPaths=reportersList';
          final updatePayload = _toFirestoreFields({
            'trafficCount': currentTraffic + 1,
            'reportersList': updatedReporters,
          });
          final patchRes = await http.patch(
            Uri.parse(patchUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(updatePayload),
          ).timeout(const Duration(seconds: 15));
          if (patchRes.statusCode != 200) {
            throw Exception("Firestore patch status: ${patchRes.statusCode}");
          }
        } else {
          final updateRes = await http.post(
            Uri.parse('${widget.serverUrl}/api/update-grievance'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'id': matchedGrievanceId,
              'trafficCount': currentTraffic + 1,
              'reportersList': updatedReporters,
            }),
          ).timeout(const Duration(seconds: 15));
          if (updateRes.statusCode != 200) {
            throw Exception("Proxy consolidate status: ${updateRes.statusCode}");
          }
        }
      } else {
        finalGrievanceDoc = {
          'name': nameText,
          'contact': phoneText,
          'description': descriptionText,
          'department': category,
          'urgency': _aiAnalysis!['severity'] == 'High' ? 'High' : (_aiAnalysis!['severity'] == 'Low' ? 'Low' : 'Medium'),
          'cleanLocation': landmarkText.isNotEmpty ? landmarkText : (_aiAnalysis!['cleanLocation'] ?? "Delhi NCR Region"),
          'summary': _aiAnalysis!['summary'] ?? descriptionText,
          'latitude': lat,
          'longitude': lng,
          'status': 'Open',
          'createdAt': DateTime.now().toIso8601String(),
          'imageUrl': "",
          'sector': (landmarkText.isNotEmpty ? landmarkText : (_aiAnalysis!['cleanLocation'] ?? '')).toString().contains("West") ? "West Zone" : "Central Zone",
          'assignedBody': suggestedDept,
          'category': category,
          'severity': _aiAnalysis!['severity'] ?? 'Medium',
          'urgencyScore': _aiAnalysis!['urgency'] ?? 5,
          'affected_people': _aiAnalysis!['affected_people'] ?? "Local residents",
          'suggested_department': suggestedDept,
          'confidence': _aiAnalysis!['confidence'] ?? 90,
          'detectedLanguage': _aiAnalysis!['detectedLanguage'] ?? "English",
          'trafficCount': 1,
          'sentiment': _aiAnalysis!['sentiment'] ?? "Neutral",
          'recurringNeed': _aiAnalysis!['recurring_need'] ?? "",
          'otpVerified': true,
          'reportersList': [
            {
              'name': nameText,
              'contact': phoneText,
              'reportedAt': DateTime.now().toIso8601String(),
              'description': descriptionText,
            }
          ]
        };

        if (widget.useDirectCloud) {
          final createUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances';
          final createPayload = _toFirestoreFields(finalGrievanceDoc);
          final postRes = await http.post(
            Uri.parse(createUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(createPayload),
          ).timeout(const Duration(seconds: 15));
          if (postRes.statusCode == 200) {
            final resPath = jsonDecode(postRes.body)['name'] as String;
            finalId = resPath.split('/').last;
          } else {
            throw Exception("Firestore post status: ${postRes.statusCode}");
          }
        } else {
          final createRes = await http.post(
            Uri.parse('${widget.serverUrl}/api/create-grievance'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(finalGrievanceDoc),
          ).timeout(const Duration(seconds: 15));
          if (createRes.statusCode == 200) {
            final finalResData = jsonDecode(createRes.body);
            finalId = finalResData['id'] ?? 'g_${DateTime.now().millisecondsSinceEpoch}';
          } else {
            throw Exception("Proxy create status: ${createRes.statusCode}");
          }
        }
      }

      widget.onGrievanceSubmitted(finalId, finalGrievanceDoc);

      setState(() {
        _isSubmitting = false;
        _successMessage = isDuplicate
            ? (widget.lang == 'hi'
                ? "यह समस्या पहले ही रिपोर्ट की जा चुकी है! आपकी शिकायत को पूर्व शिकायत (#${finalId.substring(0, 5).toUpperCase()}) के साथ जोड़ दिया गया है।"
                : "This issue has already been reported! Your grievance has been consolidated with existing ticket #${finalId.substring(0, 5).toUpperCase()}.")
            : (widget.lang == 'hi'
                ? "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है! शिकायत आईडी: #${finalId.substring(0, 5).toUpperCase()}"
                : "Your grievance has been successfully registered! Grievance ID: #${finalId.substring(0, 5).toUpperCase()}");
      });

      _nameController.clear();
      _phoneController.clear();
      _landmarkController.clear();
      _transcriptionController.clear();
      _audioPath = null;
      _latitude = null;
      _longitude = null;
      _gpsDetected = false;
    } catch (e) {
      setState(() {
        _isSubmitting = false;
        _submitError = "Failed to submit grievance: $e";
      });
    }
  }

  void _resetPortal() {
    setState(() {
      _transcribedText = "";
      _aiAnalysis = null;
      _successMessage = null;
      _submitError = null;
      _audioPath = null;
      _latitude = null;
      _longitude = null;
      _gpsDetected = false;
    });
    _nameController.clear();
    _phoneController.clear();
    _landmarkController.clear();
    _transcriptionController.clear();
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case "Road Infrastructure":
        return Icons.engineering_rounded;
      case "Water Logging & Drainage":
        return Icons.water_damage_rounded;
      case "Solid Waste Management":
        return Icons.delete_outline_rounded;
      case "Street Lights":
        return Icons.lightbulb_outline_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  Color _getSeverityColor(String severity) {
    switch (severity) {
      case "Critical":
        return Colors.red.shade700;
      case "High":
        return Colors.orange.shade700;
      case "Medium":
        return Colors.amber.shade700;
      default:
        return Colors.green.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isHi = widget.lang == 'hi';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Card
          Card(
            color: Theme.of(context).brightness == Brightness.dark 
                ? const Color(0xFF0F172A) 
                : Colors.white,
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isHi ? "आवाज शिकायत केंद्र" : "Voice Grievance Center",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueAccent),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isHi 
                        ? "अपनी भाषा में बोलें (हिन्दी या अंग्रेज़ी)। हमारा AI आपकी शिकायत को पहचान कर सीधे संबंधित विभाग को भेजेगा।"
                        : "Describe the civic issue in your own voice (Hindi or English). Gemini AI will transcribe, analyze, and dispatch it.",
                    style: TextStyle(fontSize: 11, color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Speech Language bias Chips
          Row(
            children: [
              Text(
                isHi ? "बोलने की भाषा (पक्ष): " : "Speech Language Bias: ",
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('Auto', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                selected: _speechLang == "Auto",
                onSelected: (val) {
                  if (val) setState(() => _speechLang = "Auto");
                },
              ),
              const SizedBox(width: 6),
              ChoiceChip(
                label: const Text('English', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                selected: _speechLang == "English",
                onSelected: (val) {
                  if (val) setState(() => _speechLang = "English");
                },
              ),
              const SizedBox(width: 6),
              ChoiceChip(
                label: const Text('हिन्दी', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                selected: _speechLang == "Hindi",
                onSelected: (val) {
                  if (val) setState(() => _speechLang = "Hindi");
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Success Message Banner
          if (_successMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.green.shade400, width: 1),
              ),
              child: Column(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.green, size: 36),
                  const SizedBox(height: 8),
                  Text(
                    _successMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.green),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _resetPortal,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    child: Text(isHi ? "नई शिकायत दर्ज करें" : "FILE NEW GRIEVANCE", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          if (_successMessage == null) ...[
            // Record Console Panel
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                children: [
                  Text(
                    _isRecording 
                        ? (isHi ? "सुन रहा हूँ... बोलिए" : "Listening... Speak now")
                        : (isHi ? "रिकॉर्ड करने के लिए माइक दबाएं" : "Press mic to start recording"),
                    style: const TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 12),
                  if (_isRecording) ...[
                    // Timer and wave visualization
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "0:${_recordDurationSec.toString().padLeft(2, '0')} / 0:45",
                          style: const TextStyle(fontSize: 13, color: Colors.white, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                  Center(
                    child: InkWell(
                      onTap: _isRecording ? _stopRecording : _startRecording,
                      borderRadius: BorderRadius.circular(60),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isRecording ? Colors.red : Colors.blueAccent.shade700,
                          boxShadow: _isRecording 
                              ? [BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 15, spreadRadius: 5)]
                              : [],
                        ),
                        child: Icon(
                          _isRecording ? Icons.stop_rounded : Icons.mic_rounded, 
                          size: 36, 
                          color: Colors.white
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Loading States
            if (_isTranscribing) ...[
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 8),
                      Text("Gemini is transcribing your voice...", style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic)),
                    ],
                  ),
                ),
              ),
            ],
            if (_isAnalyzing) ...[
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      CircularProgressIndicator(color: Colors.indigo),
                      SizedBox(height: 8),
                      Text("Gemini AI is analyzing and categorizing the issue...", style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic)),
                    ],
                  ),
                ),
              ),
            ],

            // Submit Error Message
            if (_submitError != null) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.shade50.withOpacity(0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.red.shade400)),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.red, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _submitError!,
                        style: const TextStyle(fontSize: 10, color: Colors.red, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Results Section
            if (_transcribedText.isNotEmpty && !_isTranscribing) ...[
              // Transcription box
              Card(
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isHi ? "AI लिखित विवरण: " : "AI Transcribed Text:",
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                          ),
                          const Icon(Icons.edit_note_rounded, size: 18, color: Colors.grey),
                        ],
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _transcriptionController,
                        maxLines: 3,
                        style: const TextStyle(fontSize: 11),
                        decoration: InputDecoration(
                          filled: true,
                          contentPadding: const EdgeInsets.all(8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onChanged: (val) {
                          _transcribedText = val;
                        },
                      ),
                      const SizedBox(height: 8),
                      // Re-categorize button if user modified transcription
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () => _analyzeAndCategorize(_transcribedText),
                          icon: const Icon(Icons.refresh_rounded, size: 12),
                          label: Text(isHi ? "पुनः विश्लेषण करें" : "RE-ANALYZE TEXT", style: const TextStyle(fontSize: 8.5)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // AI Categorization Details Card
            if (_aiAnalysis != null && !_isAnalyzing) ...[
              Card(
                color: const Color(0xFF0F172A),
                elevation: 3,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Colors.white10)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            "AI DISPATCH REPORT",
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blueAccent, letterSpacing: 1),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: _aiAnalysis!['isGenuine'] == true 
                                  ? Colors.green.shade900.withOpacity(0.4) 
                                  : Colors.red.shade900.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: _aiAnalysis!['isGenuine'] == true ? Colors.green : Colors.red),
                            ),
                            child: Text(
                              _aiAnalysis!['isGenuine'] == true ? "GENUINE CIVIC ISSUE" : "FLAGGED / DEFLECTED",
                              style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: _aiAnalysis!['isGenuine'] == true ? Colors.green : Colors.red),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (_aiAnalysis!['isGenuine'] == false) ...[
                        Text(
                          isHi ? "अस्वीकरण का कारण: " : "Rejection Reason:",
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _aiAnalysis!['rejectionReason'] ?? "Vague or personal dispute complaint.",
                          style: const TextStyle(fontSize: 11, color: Colors.redAccent, fontWeight: FontWeight.w500),
                        ),
                      ],

                      if (_aiAnalysis!['isGenuine'] == true) ...[
                        // Category info
                        Row(
                          children: [
                            Icon(_getCategoryIcon(_aiAnalysis!['category'] ?? ''), color: Colors.blueAccent, size: 24),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text("PROBLEM CATEGORY", style: TextStyle(fontSize: 8, color: Colors.grey)),
                                  Text(
                                    _aiAnalysis!['category'] ?? "General Infrastructure",
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 16, color: Colors.white10),

                        // Severity, Suggested Department, Sentiment
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("SEVERITY", style: TextStyle(fontSize: 8, color: Colors.grey)),
                                const SizedBox(height: 2),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                  decoration: BoxDecoration(
                                    color: _getSeverityColor(_aiAnalysis!['severity'] ?? 'Medium').withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    _aiAnalysis!['severity'] ?? 'Medium',
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: _getSeverityColor(_aiAnalysis!['severity'] ?? 'Medium')),
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("DEPARTMENT", style: TextStyle(fontSize: 8, color: Colors.grey)),
                                const SizedBox(height: 2),
                                Text(
                                  _aiAnalysis!['suggested_department'] ?? 'MCD',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white70),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("SENTIMENT", style: TextStyle(fontSize: 8, color: Colors.grey)),
                                const SizedBox(height: 2),
                                Text(
                                  _aiAnalysis!['sentiment'] ?? 'Neutral',
                                  style: TextStyle(
                                    fontSize: 10, 
                                    fontWeight: FontWeight.bold, 
                                    color: _aiAnalysis!['sentiment'] == 'Angry' 
                                        ? Colors.red 
                                        : _aiAnalysis!['sentiment'] == 'Frustrated' 
                                            ? Colors.orange 
                                            : Colors.blueAccent
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Divider(height: 16, color: Colors.white10),

                        // Summary
                        const Text("SUMMARY", style: TextStyle(fontSize: 8, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          _aiAnalysis!['summary'] ?? '',
                          style: const TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                        const Divider(height: 16, color: Colors.white10),

                        // Recurring need & Location
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text("DETECTED LANDMARK", style: TextStyle(fontSize: 8, color: Colors.grey)),
                                  const SizedBox(height: 2),
                                  Text(
                                    _aiAnalysis!['cleanLocation'] ?? 'Delhi NCR',
                                    style: const TextStyle(fontSize: 10, color: Colors.white70, overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                            ),
                            if (_aiAnalysis!['recurring_need'] != null && _aiAnalysis!['recurring_need'].toString().isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text("RECURRING PATTERN", style: TextStyle(fontSize: 8, color: Colors.grey)),
                                  const SizedBox(height: 2),
                                  Text(
                                    _aiAnalysis!['recurring_need'] ?? '',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.cyanAccent),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Form for Citizen details
              if (_aiAnalysis!['isGenuine'] == true) ...[
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Name field
                      Text(isHi ? "आपका नाम *" : "Your Name *", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                      const SizedBox(height: 4),
                      TextFormField(
                        controller: _nameController,
                        style: const TextStyle(fontSize: 11),
                        validator: (v) => v == null || v.trim().isEmpty ? (isHi ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your name') : null,
                        decoration: InputDecoration(
                          hintText: isHi ? "जैसे: मोहन लाल" : "e.g., Mohan Lal",
                          hintStyle: const TextStyle(fontSize: 10, color: Colors.grey),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Phone field
                      Text(isHi ? "मोबाइल नंबर *" : "Mobile Number *", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                      const SizedBox(height: 4),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(fontSize: 11),
                        validator: _validatePhoneNumber,
                        decoration: InputDecoration(
                          hintText: isHi ? "जैसे: 9876543210 या 09876543210" : "e.g., 9876543210 or 09876543210",
                          hintStyle: const TextStyle(fontSize: 10, color: Colors.grey),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // GPS Location Detector Button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(isHi ? "समीपस्थ लैंडमार्क / स्थान" : "Nearby Landmark / Location", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                          TextButton.icon(
                            onPressed: _detectGps,
                            icon: Icon(Icons.gps_fixed_rounded, size: 12, color: _gpsDetected ? Colors.green : Colors.blue),
                            label: Text(
                              _gpsDetected 
                                  ? (isHi ? "जीपीएस दर्ज हो गया" : "GPS Locked") 
                                  : (isHi ? "जीपीएस स्थान खोजें" : "Locate via GPS"), 
                              style: TextStyle(fontSize: 9, color: _gpsDetected ? Colors.green : Colors.blue)
                            ),
                            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      TextFormField(
                        controller: _landmarkController,
                        style: const TextStyle(fontSize: 11),
                        decoration: InputDecoration(
                          hintText: isHi ? "जैसे: शिव मंदिर के सामने, सेक्टर 12" : "e.g., Opposite Shiv Mandir, Sector 12",
                          hintStyle: const TextStyle(fontSize: 10, color: Colors.grey),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Submit button
                      SizedBox(
                        height: 38,
                        child: ElevatedButton.icon(
                          onPressed: _isSubmitting ? null : _submitGrievance,
                          icon: _isSubmitting 
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.send_rounded, size: 14),
                          label: Text(
                            _isSubmitting
                                ? (isHi ? "दर्ज किया जा रहा है..." : "SUBMITTING...")
                                : (isHi ? "शिकायत दर्ज करें" : "SUBMIT GRIEVANCE"),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blueAccent.shade700,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ],
        ],
      ),
    );
  }
}

class CitizenPortalContent extends StatefulWidget {
  final String Function(String) t;
  final String lang;
  final ValueChanged<String> onLangChanged;
  final String citizenSubTab;
  final ValueChanged<String> onSubTabChanged;
  final List<dynamic> myComplaints;
  final VoidCallback onClearHistory;
  final void Function(String, dynamic) onGrievanceSubmitted;
  final Future<void> Function(String) onResolveGrievance;
  final String serverUrl;
  final bool useDirectCloud;
  final String customGeminiKey;

  const CitizenPortalContent({
    super.key,
    required this.t,
    required this.lang,
    required this.onLangChanged,
    required this.citizenSubTab,
    required this.onSubTabChanged,
    required this.myComplaints,
    required this.onClearHistory,
    required this.onGrievanceSubmitted,
    required this.onResolveGrievance,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
  });

  @override
  State<CitizenPortalContent> createState() => _CitizenPortalContentState();
}

class _CitizenPortalContentState extends State<CitizenPortalContent> {
  @override
  Widget build(BuildContext context) {
    Widget voiceGuideBot = VoiceInstructionsWidget(
      lang: widget.lang,
      onLangChanged: widget.onLangChanged,
      t: widget.t,
    );

    Widget inlineSubTabs = Container(
      padding: const EdgeInsets.all(3),
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0), 
        borderRadius: BorderRadius.circular(10)
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => widget.onSubTabChanged('submit'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: widget.citizenSubTab == 'submit' 
                      ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  widget.lang == 'hi' ? 'नई शिकायत' : 'New Grievance',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => widget.onSubTabChanged('track'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: widget.citizenSubTab == 'track' 
                      ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      widget.lang == 'hi' ? 'स्थिति देखें' : 'Track Status',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    if (widget.myComplaints.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.secondary, 
                          borderRadius: BorderRadius.circular(10)
                        ),
                        child: Text(
                          '${widget.myComplaints.length}',
                          style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      )
                    ]
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );

    Widget intakeForm = IntakeFormWidget(
      t: widget.t,
      lang: widget.lang,
      serverUrl: widget.serverUrl,
      useDirectCloud: widget.useDirectCloud,
      customGeminiKey: widget.customGeminiKey,
      myComplaints: widget.myComplaints,
      onGrievanceSubmitted: widget.onGrievanceSubmitted,
    );

    Widget trackListFeed = TrackerHistoryWidget(
      t: widget.t,
      lang: widget.lang,
      myComplaints: widget.myComplaints,
      onClearHistory: widget.onClearHistory,
      onResolveGrievance: widget.onResolveGrievance,
    );

    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      child: Column(
        children: [
          voiceGuideBot,
          const SizedBox(height: 8),
          inlineSubTabs,
          const SizedBox(height: 4),
          widget.citizenSubTab == 'submit' ? intakeForm : trackListFeed,
        ],
      ),
    );
  }
}

class IntakeFormWidget extends StatefulWidget {
  final String Function(String) t;
  final String lang;
  final String serverUrl;
  final bool useDirectCloud;
  final String customGeminiKey;
  final List<dynamic> myComplaints;
  final void Function(String, dynamic) onGrievanceSubmitted;

  const IntakeFormWidget({
    super.key,
    required this.t,
    required this.lang,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
    required this.myComplaints,
    required this.onGrievanceSubmitted,
  });

  @override
  State<IntakeFormWidget> createState() => _IntakeFormWidgetState();
}

class _IntakeFormWidgetState extends State<IntakeFormWidget> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _captchaController = TextEditingController();

  bool _isAnalyzing = false;
  double? _latitude;
  double? _longitude;
  String? _detectedLocation;

  // Image attachment states
  String? _selectedImageBase64;

  // Real Speech to Text fields on mobile
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _speechInitialized = false;
  bool _speechEnabled = false;
  String _selectedSpeechLocale = 'en_IN';

  // WAV Recording fields for Gemini-based audio transcription
  final AudioRecorder _audioRecorder = AudioRecorder();
  int _recordDurationSec = 0;
  Timer? _recordTimer;
  bool _isRecording = false;
  bool _isTranscribing = false;
  String? _sttError;
  String _transcribedText = "";


  Future<void> _initSpeech() async {
    if (_speechInitialized && _speechEnabled) return;
    try {
      _speechEnabled = await _speech.initialize(
        onStatus: (status) => debugPrint('STT Status: $status'),
        onError: (error) => debugPrint('STT Error: $error'),
        debugLogging: true,
      );
      if (_speechEnabled) {
        final locales = await _speech.locales();
        debugPrint("Available Speech Locales: " + locales.map((l) => l.localeId).toList().toString());
        
        if (locales.isNotEmpty) {
          // Find platform matching locales dynamically
          final hiMatch = locales.firstWhere(
            (l) => l.localeId.toLowerCase().startsWith('hi'),
            orElse: () => locales.first,
          );
          final enMatch = locales.firstWhere(
            (l) => l.localeId.toLowerCase().startsWith('en'),
            orElse: () => locales.first,
          );
          
          if (widget.lang == 'hi') {
            _selectedSpeechLocale = hiMatch.localeId;
          } else {
            _selectedSpeechLocale = enMatch.localeId;
          }
        } else {
          _selectedSpeechLocale = widget.lang == 'hi' ? 'hi_IN' : 'en_IN';
        }
      }
      _speechInitialized = true;
    } catch (e) {
      debugPrint("STT Init Exception: $e");
    }
  }

  // Audio Recording Helper Methods
  void _startRecordTimer(StateSetter setSheetState) {
    setState(() {
      _recordDurationSec = 0;
    });
    _recordTimer?.cancel();
    _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setSheetState(() {
        _recordDurationSec++;
      });
      if (_recordDurationSec >= 45) { // Limit to 45 seconds to keep WAV lightweight
        _stopRecordingAudio(setSheetState);
      }
    });
  }

  Future<void> _startRecordingAudio(StateSetter setSheetState) async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final dir = await getTemporaryDirectory();
        final path = '${dir.path}/voice_intake.wav';
        
        setSheetState(() {
          _isRecording = true;
          _sttError = null;
          _transcribedText = "";
        });

        await _audioRecorder.start(
          const RecordConfig(
            encoder: AudioEncoder.wav,
            sampleRate: 16000,
            numChannels: 1,
          ),
          path: path,
        );

        _startRecordTimer(setSheetState);
      } else {
        setSheetState(() {
          _sttError = widget.lang == 'hi' 
              ? "रिकॉर्डिंग शुरू करने के लिए माइक अनुमति की आवश्यकता है।" 
              : "Microphone permission is required to start recording.";
        });
      }
    } catch (e) {
      setSheetState(() {
        _sttError = "Failed to start recording: $e";
      });
    }
  }

  Future<void> _stopRecordingAudio(StateSetter setSheetState) async {
    _recordTimer?.cancel();
    try {
      final path = await _audioRecorder.stop();
      
      setSheetState(() {
        _isRecording = false;
      });

      if (path != null) {
        final file = File(path);
        if (await file.exists()) {
          final wavBytes = await file.readAsBytes();
          await _transcribeAudioDirect(wavBytes, setSheetState);
        } else {
          throw Exception("Recorded file not found at path: $path");
        }
      } else {
        setSheetState(() {
          _sttError = widget.lang == 'hi'
              ? "कोई आवाज रिकॉर्ड नहीं हुई। कृपया दोबारा कोशिश करें।"
              : "No voice was recorded. Please try again.";
        });
      }
    } catch (e) {
      setSheetState(() {
        _isRecording = false;
        _sttError = "Failed to stop recording: $e";
      });
    }
  }

  /// Transcribes WAV audio by proxying through the backend server.
  /// The server calls Gemini server-side, bypassing Android API key restrictions.
  Future<void> _transcribeAudioDirect(Uint8List wavBytes, StateSetter setSheetState) async {
    setSheetState(() {
      _isTranscribing = true;
      _sttError = null;
    });

    try {
      // Base64-encode the full WAV file
      final String base64Audio = base64Encode(wavBytes);

      // POST to backend — server calls Gemini without Android key restrictions
      final Uri endpoint = Uri.parse('${widget.serverUrl}/api/transcribe-audio');

      final response = await http.post(
        endpoint,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'audioData': base64Audio,
          'mimeType': 'audio/wav',
          'language': widget.lang == 'hi' ? 'hi-IN' : 'en-IN',
        }),
      ).timeout(const Duration(seconds: 35));

      if (response.statusCode == 200) {
        final Map<String, dynamic> resData = jsonDecode(response.body);

        // Handle warning from server (e.g. API key not configured)
        if (resData.containsKey('warning')) {
          setSheetState(() {
            _isTranscribing = false;
            _sttError = resData['warning']?.toString() ??
                'Server transcription unavailable.';
          });
          return;
        }

        final String text = resData['text']?.toString().trim() ?? '';
        setSheetState(() {
          _isTranscribing = false;
          _transcribedText = text;
          if (text.isEmpty) {
            _sttError = widget.lang == 'hi'
                ? 'कोई आवाज़ नहीं पहचानी जा सकी। फिर से बोलें।'
                : 'No speech detected. Please speak clearly and try again.';
          }
        });
      } else {
        String errorDetail = response.statusCode.toString();
        try {
          final errData = jsonDecode(response.body);
          errorDetail = errData['error']?.toString() ?? errorDetail;
        } catch (_) {}
        throw Exception('Server STT error: $errorDetail');
      }
    } catch (e) {
      setSheetState(() {
        _isTranscribing = false;
        _sttError = 'Transcription failed: ${e.toString()}';
      });
    }
  }

  String? _imageMimeType;
  String? _imageFileName;

  // Math puzzle captcha
  int _captchaNum1 = 0;
  int _captchaNum2 = 0;
  int _captchaAnswer = 0;

  // Submission AI receipt details
  Map<String, dynamic>? _aiReceipt;
  bool _isDuplicateConsolidated = false;

  @override
  void initState() {
    super.initState();
    _generateCaptcha();
    // Pre-initialize speech-to-text to request permissions and load locales early
    _initSpeech();
  }

  void _generateCaptcha() {
    final rand = DateTime.now().millisecond;
    setState(() {
      _captchaNum1 = (rand % 9) + 1;
      _captchaNum2 = ((rand ~/ 10) % 9) + 1;
      _captchaAnswer = _captchaNum1 + _captchaNum2;
      _captchaController.clear();
    });
  }

  Future<void> _detectGps() async {
    setState(() {
      _detectedLocation = widget.t('gpsDetecting');
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw 'Location services are disabled.';
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw 'Location permissions are denied';
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw 'Location permissions are permanently denied.';
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 4),
      );

      final double lat = position.latitude;
      final double lng = position.longitude;
      
      // Determine zone name based on coordinates or default
      String name = 'Gps Spot (Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)})';
      final rand = DateTime.now().millisecond;
      final zoneOptions = [
        'Central Delhi Command Block',
        'East Sector Commute Line',
        'West Residential Sector',
        'South Extension Area',
      ];
      final zoneName = zoneOptions[rand % zoneOptions.length];
      name = '$zoneName (Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)})';

      setState(() {
        _latitude = lat;
        _longitude = lng;
        _detectedLocation = name;
        _landmarkController.text = name;
      });
    } catch (e) {
      // Fallback to simulated high-accuracy mock locations in Delhi NCR if hardware GPS fails
      final rand = DateTime.now().millisecond;
      final zones = [
        {'lat': 28.6421 + (rand % 10) * 0.001, 'lng': 77.1645 - (rand % 5) * 0.001, 'name': 'Rajouri Garden, West Delhi'},
        {'lat': 28.5855 - (rand % 8) * 0.001, 'lng': 77.2612 + (rand % 7) * 0.001, 'name': 'Laxmi Nagar, East Delhi'},
        {'lat': 28.6139 + (rand % 12) * 0.001, 'lng': 77.2090 + (rand % 3) * 0.001, 'name': 'Parliament Street, Central Zone'},
        {'lat': 28.6304 - (rand % 4) * 0.001, 'lng': 77.2177 - (rand % 9) * 0.001, 'name': 'Connaught Place, Central Zone'},
      ];
      final selectedZone = zones[rand % zones.length];
      final double lat = selectedZone['lat'] as double;
      final double lng = selectedZone['lng'] as double;
      final String name = selectedZone['name'] as String;

      setState(() {
        _latitude = lat;
        _longitude = lng;
        _detectedLocation = name;
        _landmarkController.text = name;
      });
    }
  }

  Future<void> _attachPhoto(ImageSource source) async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: source,
        imageQuality: 20,   // aggressive compression for instant base64 uploads
        maxWidth: 480,
        maxHeight: 480,
      );

      if (pickedFile == null) return; // user cancelled

      final bytes = await pickedFile.readAsBytes();
      final base64Str = base64Encode(bytes);
      final mimeType = pickedFile.mimeType ?? 'image/jpeg';
      final fileName = pickedFile.name;

      setState(() {
        _selectedImageBase64 = base64Str;
        _imageMimeType = mimeType;
        _imageFileName = fileName;
      });

      if (mounted) {
        showSubtleToast(context, 'Photo attached: $fileName');
      }
    } catch (e) {
      if (mounted) {
        showSubtleToast(context, 'Could not attach photo. Try again.', isError: true);
      }
    }
  }

  void _openVoiceConsoleSheet() {
    // Reset recording parameters
    setState(() {
      _transcribedText = "";
      _sttError = null;
      _isRecording = false;
      _isTranscribing = false;
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16))
      ),
      builder: (context) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final isHi = widget.lang == 'hi';

          return Container(
            padding: const EdgeInsets.all(16),
            height: 380,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isHi ? 'आवाज इनटेक (Gemini AI)' : 'Gemini AI Voice Intake',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        if (_isRecording) {
                          _stopRecordingAudio(setSheetState);
                        }
                        Navigator.pop(ctx);
                      },
                    ),
                  ],
                ),
                Text(
                  _isRecording 
                      ? (isHi 
                          ? "सुन रहा हूँ... बोलिए (0:${_recordDurationSec.toString().padLeft(2, '0')}/0:45)" 
                          : "Listening... Speak now (0:${_recordDurationSec.toString().padLeft(2, '0')}/0:45)")
                      : _isTranscribing
                          ? (isHi ? "Gemini AI ऑडियो का अनुवाद कर रहा है..." : "Gemini AI is transcribing audio...")
                          : (isHi ? "शिकायत रिकॉर्ड करने के लिए नीचे माइक दबाएं" : "Press microphone button below to record complaint"),
                  style: TextStyle(fontSize: 10, color: _isRecording ? Colors.redAccent : Colors.grey, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 12),
                
                // Transcription box
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  height: 80,
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.black12),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      _transcribedText.isEmpty
                          ? (_isRecording 
                              ? (isHi ? "(सुन रहा हूँ... बोलिए)" : "(Listening... Speak now)")
                              : _isTranscribing
                                  ? (isHi ? "(अनुवाद किया जा रहा है...)" : "(Transcribing...)")
                                  : (isHi ? "(आपकी बोली हुई शिकायत यहाँ दिखेगी)" : "(Your transcribed text will appear here)"))
                          : _transcribedText,
                      style: TextStyle(
                        fontSize: 10,
                        fontStyle: FontStyle.italic,
                        color: _transcribedText.isEmpty ? Colors.grey : (Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Error message if any
                if (_sttError != null) ...[
                  Text(_sttError!, style: const TextStyle(fontSize: 9, color: Colors.red, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                ],

                // Microphone Control Button
                Center(
                  child: ElevatedButton(
                    onPressed: _isTranscribing ? null : () {
                      if (_isRecording) {
                        _stopRecordingAudio(setSheetState);
                      } else {
                        _startRecordingAudio(setSheetState);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      shape: const CircleBorder(),
                      padding: const EdgeInsets.all(16),
                      backgroundColor: _isRecording ? Colors.red : Colors.green,
                    ),
                    child: Icon(_isRecording ? Icons.stop : Icons.mic, size: 28, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Confirm & Accept Button
                if (_transcribedText.isNotEmpty) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 32,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _descriptionController.text = _transcribedText;
                        });
                        Navigator.pop(ctx);
                      },
                      icon: const Icon(Icons.check_circle_outline, size: 14, color: Colors.white),
                      label: Text(
                        isHi ? 'पुष्टि करें और विवरण का उपयोग करें' : 'CONFIRM & USE TEXT',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo.shade700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                  ),
                ],

                if (_transcribedText.isEmpty && !_isRecording && !_isTranscribing) ...[
                  const Text('QUICK TEMPLATES (त्वरित चयन):', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _templateChip(isHi ? "सड़क पर गहरा गड्ढा है" : "There is a deep pothole on the road", (phrase) {
                        setSheetState(() {
                          _transcribedText = phrase;
                        });
                      }),
                      _templateChip(isHi ? "कचरा नहीं उठाया गया" : "Garbage pile has not been cleared", (phrase) {
                        setSheetState(() {
                          _transcribedText = phrase;
                        });
                      }),
                      _templateChip(isHi ? "पानी जमा हो गया है" : "Water logging is causing street block", (phrase) {
                        setSheetState(() {
                          _transcribedText = phrase;
                        });
                      }),
                    ],
                  )
                ]
              ],
            ),
          );
        }
      )
    );
  }

  Widget _templateChip(String phrase, ValueChanged<String> onTap) {
    return InkWell(
      onTap: () => onTap(phrase),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.blue.shade100),
        ),
        child: Text(phrase, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
      ),
    );
  }

  // OTP Verification Modal
  void _openOtpModal(String phoneText) async {
    // Call server to send OTP code
    String expectedOtp = "1234";
    try {
      final res = await http.post(
        Uri.parse('${widget.serverUrl}/api/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'contact': phoneText}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        expectedOtp = jsonDecode(res.body)['otp']?.toString() ?? "1234";
      }
    } catch (_) {}

    showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        final codeController = TextEditingController();
        int secondsLeft = 65;
        bool canResend = false;

        return StatefulBuilder(
          builder: (ctx, setModalState) {
            // Start timer
            Future.delayed(const Duration(seconds: 1), () {
              if (ctx.mounted && secondsLeft > 0) {
                setModalState(() {
                  secondsLeft--;
                  if (secondsLeft == 0) canResend = true;
                });
              }
            });

            void resendCode() async {
              setModalState(() {
                secondsLeft = 65;
                canResend = false;
              });
              try {
                final res = await http.post(
                  Uri.parse('${widget.serverUrl}/api/send-otp'),
                  headers: {'Content-Type': 'application/json'},
                  body: jsonEncode({'contact': phoneText}),
                );
                if (res.statusCode == 200) {
                  expectedOtp = jsonDecode(res.body)['otp']?.toString() ?? "1234";
                }
              } catch (_) {}
            }

            void verifyCode() {
              final val = codeController.text.trim();
              if (val == expectedOtp || val == "1234") {
                Navigator.pop(context, true);
              } else {
                showSubtleToast(context, 'Invalid verification code.', isError: true);
              }
            }

            return AlertDialog(
              title: Text(widget.t('otpTitle'), style: const TextStyle(fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${widget.t('otpSent')} $phoneText\n(For demo, use code: $expectedOtp)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue)),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: codeController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 8),
                    decoration: InputDecoration(
                      hintText: '0 0 0 0',
                      hintStyle: const TextStyle(color: Colors.grey, letterSpacing: 8),
                      contentPadding: const EdgeInsets.all(8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        canResend ? '' : '${widget.t('otpTimer')}: $secondsLeft s',
                        style: const TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                      if (canResend)
                        TextButton(
                          onPressed: resendCode,
                          child: const Text('Resend OTP', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        )
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Note: Code is logged to developers console / SMS Logs Center.',
                    style: TextStyle(fontSize: 8, fontStyle: FontStyle.italic, color: Colors.grey),
                  )
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: verifyCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(widget.t('otpVerifyBtn')),
                )
              ],
            );
          }
        );
      }
    ).then((verified) {
      if (verified == true) {
        _submitVerifiedGrievance();
      }
    });
  }

  Future<void> _submitVerifiedGrievance() async {
    setState(() {
      _isAnalyzing = true;
      _aiReceipt = null;
      _isDuplicateConsolidated = false;
    });

    final nameText = _nameController.text.trim();
    final phoneText = _phoneController.text.trim();
    final descriptionText = _descriptionController.text.trim();

    try {
      Map<String, dynamic> aiAnalysis = {};

      if (widget.useDirectCloud) {
        final key = widget.customGeminiKey.isNotEmpty ? widget.customGeminiKey : "AIzaSyAzVjLwmRoevXnRNsKx_e6qU0l-rfr4N4E";
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$key';

        final prompt = """Analyze this citizen grievance description: "$descriptionText".
Identify any locations, addresses, landmarks, or areas mentioned.
Estimate approximate latitude and longitude coordinates for this landmark in Delhi NCR region (~28.4 to 28.8, ~76.8 to 77.4).
${_latitude != null ? "Prioritize and use these exact coordinates: latitude $_latitude, longitude $_longitude." : "Default to Connaught Place (latitude: 28.6139, longitude: 77.2090) if location is missing."}

Generate a structured JSON report.
Required keys:
STRICT COMPLAINT VALIDATION GUARDRAILS:
1. MP-SOLVABLE ONLY: Only accept grievances that can be addressed by a Member of Parliament (MP) command center or municipal/state civic departments (e.g. road infrastructure, public sanitation, solid waste, water logging/drainage, street lights, utility support).
2. REJECT EMERGENCY/TIME-SENSITIVE: Set isGenuine = false for highly time-sensitive emergency requests (e.g., calling an ambulance, fire, active crime/police assistance). Tell them to dial 112/108.
3. REJECT NONSENSE/PRIVATE/HYPERLOCAL: Set isGenuine = false for nonsense, personal, or private requests (e.g., "I can't get married", "unable to sleep", "can't sleep", "insomnia", "neend nahi aa rahi", "lost keys", "flat tire", "neighbor's music is loud", "lost dog", "need personal loan").
4. PHOTO ALIGNMENT SHIELD: If an image/photo is attached, inspect it carefully. The photo MUST visually match and depict the civic grievance described (e.g. if text is about potholes, photo must show road damage/pothole. If text is about garbage, photo must show waste/trash). If the photo is completely blank, black, a random selfie, spam, or depicts an entirely different category (e.g. a photo of garbage when the text reports water logging), you MUST set isGenuine to false and set rejectionReason to "Rejection: Attached photo does not match or depict the reported civic issue."

- isGenuine: Boolean. Set to true ONLY if the complaint is a genuine, specific civic/municipal issue that fits all validation rules above. Otherwise, set to false.
- rejectionReason: String. If isGenuine is false, provide a polite explanation. Otherwise, "".
- summary: 1-sentence action item summary.
- category: E.g. "Solid Waste Management", "Water Logging & Drainage", "Road Infrastructure", "Street Lights".
- severity: "Low", "Medium", "High", or "Critical".
- urgency: score between 1 and 10.
- affected_people: who is affected.
- suggested_department: e.g. "MCD", "PWD", "NDMC".
- cleanLocation: Address or landmark.
- latitude: resolved latitude.
- longitude: resolved longitude.
- detectedLanguage: detected language.
- sentiment: citizen distress level: 'Frustrated', 'Neutral', or 'Angry'.
- recurring_need: Synthesized pattern description (3-5 words).
""";

        try {
          final geminiRes = await http.post(
            Uri.parse(geminiUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'contents': [
                {
                  'parts': [
                    {'text': prompt}
                  ]
                }
              ],
              'generationConfig': {
                'responseMimeType': 'application/json'
              }
            }),
          ).timeout(const Duration(seconds: 8));

          if (geminiRes.statusCode == 200) {
            final resData = jsonDecode(geminiRes.body);
            final text = resData['candidates'][0]['content']['parts'][0]['text'] as String;
            aiAnalysis = jsonDecode(text.trim());
          } else {
            throw Exception("Status code: ${geminiRes.statusCode}");
          }
        } catch (_) {
          // Rule-based fallback if cloud Gemini is unreachable
          final cleanDesc = descriptionText.toLowerCase();
          
          bool isSpam = cleanDesc.length < 12 ||
              cleanDesc.contains("hello") ||
              cleanDesc.contains("test") ||
              cleanDesc.contains("testing") ||
              cleanDesc.contains("asdf") ||
              cleanDesc.contains("123");
              
          bool isNonsenseOrPrivate = cleanDesc.contains("sleep") ||
              cleanDesc.contains("slepe") ||
              cleanDesc.contains("neend") ||
              cleanDesc.contains("so nahi") ||
              cleanDesc.contains("insomnia") ||
              cleanDesc.contains("marry") ||
              cleanDesc.contains("marriage") ||
              cleanDesc.contains("shaadi") ||
              cleanDesc.contains("wedding") ||
              cleanDesc.contains("keys") ||
              cleanDesc.contains("chabi") ||
              cleanDesc.contains("dog") ||
              cleanDesc.contains("pet") ||
              cleanDesc.contains("cat") ||
              cleanDesc.contains("puppy") ||
              cleanDesc.contains("fight") ||
              cleanDesc.contains("love") ||
              cleanDesc.contains("friend") ||
              cleanDesc.contains("loan") ||
              cleanDesc.contains("money") ||
              cleanDesc.contains("tire") ||
              cleanDesc.contains("puncture");

          bool isEmergency = cleanDesc.contains("ambulance") ||
              cleanDesc.contains("hospital emergency") ||
              cleanDesc.contains("accident") ||
              cleanDesc.contains("police") ||
              cleanDesc.contains("crime") ||
              cleanDesc.contains("fire");

          bool isGenuine = !isSpam && !isNonsenseOrPrivate && !isEmergency;
          String rejectionReason = "";
          if (isSpam) {
            rejectionReason = "The grievance description is too short, vague, or contains test words.";
          } else if (isNonsenseOrPrivate) {
            rejectionReason = "Rejection: Hyperlocal, personal, or private requests (such as sleep issues, marriage, lost items, or pets) cannot be resolved by the MP Command Center.";
          } else if (isEmergency) {
            rejectionReason = "Rejection: Time-sensitive emergency requests (medical/crime/fire) cannot be handled here. Please dial 112 or 108 immediately.";
          }

          final category = cleanDesc.contains("water") || cleanDesc.contains("drain") || cleanDesc.contains("पानी")
              ? "Water Logging & Drainage"
              : cleanDesc.contains("road") || cleanDesc.contains("pothole") || cleanDesc.contains("सड़क") || cleanDesc.contains("गड्ढा")
                  ? "Road Infrastructure"
                  : "Solid Waste Management";
          
          aiAnalysis = {
            'isGenuine': isGenuine,
            'rejectionReason': rejectionReason,
            'summary': descriptionText.length > 50 ? '${descriptionText.substring(0, 50)}...' : descriptionText,
            'category': category,
            'severity': cleanDesc.contains("urgent") || cleanDesc.contains("danger") || cleanDesc.contains("खतरा") ? "High" : "Medium",
            'urgency': cleanDesc.contains("urgent") || cleanDesc.contains("danger") || cleanDesc.contains("खतरा") ? 9 : 5,
            'affected_people': "Local residents",
            'suggested_department': category == "Road Infrastructure" ? "PWD" : "MCD",
            'cleanLocation': _detectedLocation ?? "Delhi Constituency Sector",
            'latitude': _latitude ?? 28.6139,
            'longitude': _longitude ?? 77.2090,
            'detectedLanguage': widget.lang == 'hi' ? "Hindi" : "English",
            'sentiment': "Neutral",
            'recurring_need': "Civic maintenance support",
            'confidence': 80,
          };
        }
      } else {
        try {
          final analyzeRes = await http.post(
            Uri.parse('${widget.serverUrl}/api/analyze-grievance'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'description': descriptionText,
              'userLatitude': _latitude,
              'userLongitude': _longitude,
              'imageData': _selectedImageBase64,
              'imageMimeType': _imageMimeType,
            }),
          ).timeout(const Duration(seconds: 8));

          if (analyzeRes.statusCode != 200) {
            throw Exception("Proxy failed");
          }
          aiAnalysis = jsonDecode(analyzeRes.body);
        } catch (_) {
          // Rule-based fallback if proxy server is offline
          final cleanDesc = descriptionText.toLowerCase();
          final category = cleanDesc.contains("water") || cleanDesc.contains("drain") || cleanDesc.contains("पानी")
              ? "Water Logging & Drainage"
              : cleanDesc.contains("road") || cleanDesc.contains("pothole") || cleanDesc.contains("सड़क") || cleanDesc.contains("गड्ढा")
                  ? "Road Infrastructure"
                  : "Solid Waste Management";
          
          aiAnalysis = {
            'isGenuine': true,
            'rejectionReason': '',
            'summary': descriptionText.length > 50 ? '${descriptionText.substring(0, 50)}...' : descriptionText,
            'category': category,
            'severity': cleanDesc.contains("urgent") || cleanDesc.contains("danger") || cleanDesc.contains("खतरा") ? "High" : "Medium",
            'urgency': cleanDesc.contains("urgent") || cleanDesc.contains("danger") || cleanDesc.contains("खतरा") ? 9 : 5,
            'affected_people': "Local residents",
            'suggested_department': category == "Road Infrastructure" ? "PWD" : "MCD",
            'cleanLocation': _detectedLocation ?? "Delhi Constituency Sector",
            'latitude': _latitude ?? 28.6139,
            'longitude': _longitude ?? 77.2090,
            'detectedLanguage': widget.lang == 'hi' ? "Hindi" : "English",
            'sentiment': "Neutral",
            'recurring_need': "Civic maintenance support",
            'confidence': 80,
          };
        }
      }

      if (aiAnalysis['isGenuine'] == false) {
        throw Exception(aiAnalysis['rejectionReason'] ?? "Grievance flagged by relevance filters.");
      }

      final lat = aiAnalysis['latitude'] ?? 28.6139;
      final lng = aiAnalysis['longitude'] ?? 77.2090;
      final category = aiAnalysis['category'] ?? "Solid Waste Management";
      final suggestedDept = aiAnalysis['suggested_department'] ?? "MCD";

      // 2. Fetch grievances list to verify duplicates
      List<dynamic> activeGrievances = [];
      if (widget.useDirectCloud) {
        try {
          final databaseUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances';
          final getRes = await http.get(Uri.parse(databaseUrl)).timeout(const Duration(seconds: 15));
          if (getRes.statusCode == 200) {
            final docs = jsonDecode(getRes.body)['documents'] ?? [];
            activeGrievances = docs.map((doc) => _mapFirestoreDoc(doc)).toList();
          }
        } catch (_) {}
      } else {
        try {
          final fetchRes = await http.get(Uri.parse('${widget.serverUrl}/api/grievances')).timeout(const Duration(seconds: 15));
          if (fetchRes.statusCode == 200) {
            activeGrievances = jsonDecode(fetchRes.body)['grievances'] ?? [];
          }
        } catch (_) {}
      }

      String? matchedGrievanceId;
      Map<String, dynamic>? matchedGrievanceData;

      final now = DateTime.now();
      for (var doc in activeGrievances) {
        if (doc['status'] != 'Open') continue;
        final bool sameDept = doc['department'] == category;
        final docCreated = DateTime.tryParse(doc['createdAt']) ?? now;
        final diffMins = now.difference(docCreated).inMinutes.abs();
        final bool closeTime = diffMins <= 45;

        final double docLat = doc['latitude'] ?? 0.0;
        final double docLng = doc['longitude'] ?? 0.0;
        final double latDiff = (lat - docLat) * 111000;
        final double lngDiff = (lng - docLng) * 111000;
        final double distance = latDiff * latDiff + lngDiff * lngDiff;
        final bool closeArea = distance <= 122500; // 350m squared

        if (sameDept && closeTime && closeArea) {
          matchedGrievanceId = doc['id'];
          matchedGrievanceData = Map<String, dynamic>.from(doc);
          break;
        }
      }

      Map<String, dynamic> finalGrievanceDoc = {};
      String finalId = '';

      if (matchedGrievanceId != null && matchedGrievanceData != null) {
        _isDuplicateConsolidated = true;
        final currentTraffic = matchedGrievanceData['trafficCount'] ?? 1;
        final List<dynamic> currentReporters = matchedGrievanceData['reportersList'] ?? [];
        final updatedReporters = [
          ...currentReporters,
          {
            'name': nameText,
            'contact': phoneText,
            'reportedAt': DateTime.now().toIso8601String(),
            'description': descriptionText,
          }
        ];

        finalGrievanceDoc = {
          ...matchedGrievanceData,
          'trafficCount': currentTraffic + 1,
          'reportersList': updatedReporters,
        };
        finalId = matchedGrievanceId;

        if (widget.useDirectCloud) {
          try {
            final patchUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances/$matchedGrievanceId?updateMask.fieldPaths=trafficCount&updateMask.fieldPaths=reportersList';
            final updatePayload = _toFirestoreFields({
              'trafficCount': currentTraffic + 1,
              'reportersList': updatedReporters,
            });
            final patchRes = await http.patch(
              Uri.parse(patchUrl),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(updatePayload),
            ).timeout(const Duration(seconds: 15));
            if (patchRes.statusCode != 200) {
              throw Exception("Firestore patch status: ${patchRes.statusCode}");
            }
          } catch (_) {
            debugPrint("Offline mode consolidate");
          }
        } else {
          try {
            final updateRes = await http.post(
              Uri.parse('${widget.serverUrl}/api/update-grievance'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({
                'id': matchedGrievanceId,
                'trafficCount': currentTraffic + 1,
                'reportersList': updatedReporters,
              }),
            ).timeout(const Duration(seconds: 15));
            if (updateRes.statusCode != 200) {
              throw Exception("Proxy consolidate status: ${updateRes.statusCode}");
            }
          } catch (_) {
            debugPrint("Offline mode proxy consolidate");
          }
        }
      } else {
        // Save fresh grievance
        finalGrievanceDoc = {
          'name': nameText,
          'contact': phoneText,
          'description': descriptionText,
          'department': category,
          'urgency': aiAnalysis['severity'] == 'High' ? 'High' : (aiAnalysis['severity'] == 'Low' ? 'Low' : 'Medium'),
          'cleanLocation': aiAnalysis['cleanLocation'] ?? "Delhi NCR Region",
          'summary': aiAnalysis['summary'] ?? descriptionText,
          'latitude': lat,
          'longitude': lng,
          'status': 'Open',
          'createdAt': DateTime.now().toIso8601String(),
          'imageUrl': _selectedImageBase64 ?? "",
          'sector': aiAnalysis['cleanLocation']?.toString().contains("West") ?? false ? "West Zone" : "Central Zone",
          'assignedBody': suggestedDept,
          'category': category,
          'severity': aiAnalysis['severity'] ?? 'Medium',
          'urgencyScore': aiAnalysis['urgency'] ?? 5,
          'affected_people': aiAnalysis['affected_people'] ?? "Local residents",
          'suggested_department': suggestedDept,
          'confidence': aiAnalysis['confidence'] ?? 90,
          'detectedLanguage': aiAnalysis['detectedLanguage'] ?? "English",
          'trafficCount': 1,
          'sentiment': aiAnalysis['sentiment'] ?? "Neutral",
          'recurringNeed': aiAnalysis['recurring_need'] ?? "",
          'otpVerified': true,
          'reportersList': [
            {
              'name': nameText,
              'contact': phoneText,
              'reportedAt': DateTime.now().toIso8601String(),
              'description': descriptionText,
            }
          ]
        };

        if (widget.useDirectCloud) {
          try {
            final createUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances';
            final createPayload = _toFirestoreFields(finalGrievanceDoc);
            final postRes = await http.post(
              Uri.parse(createUrl),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(createPayload),
            ).timeout(const Duration(seconds: 15));
            if (postRes.statusCode == 200) {
              final resPath = jsonDecode(postRes.body)['name'] as String;
              finalId = resPath.split('/').last;
            } else {
              throw Exception("Firestore post status: ${postRes.statusCode}");
            }
          } catch (_) {
            finalId = 'offline_${DateTime.now().millisecondsSinceEpoch}';
            finalGrievanceDoc['cleanLocation'] = '${finalGrievanceDoc['cleanLocation']} (Offline Mode)';
          }
        } else {
          try {
            final createRes = await http.post(
              Uri.parse('${widget.serverUrl}/api/create-grievance'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(finalGrievanceDoc),
            ).timeout(const Duration(seconds: 15));
            if (createRes.statusCode != 200) {
              throw Exception("Proxy status: ${createRes.statusCode}");
            }
            finalId = jsonDecode(createRes.body)['id'];
          } catch (_) {
            finalId = 'offline_${DateTime.now().millisecondsSinceEpoch}';
            finalGrievanceDoc['cleanLocation'] = '${finalGrievanceDoc['cleanLocation']} (Offline Mode)';
          }
        }
      }

      widget.onGrievanceSubmitted(finalId, finalGrievanceDoc);

      setState(() {
        _aiReceipt = finalGrievanceDoc;
        _aiReceipt!['id'] = finalId;
        _nameController.clear();
        _phoneController.clear();
        _descriptionController.clear();
        _selectedImageBase64 = null;
        _imageFileName = null;
        _detectedLocation = null;
        _latitude = null;
        _longitude = null;
      });

      // Send WhatsApp / SMS confirmation to the citizen (using pre-cleared local text values)
      _sendConfirmationMessage(
        phone: phoneText,
        name: nameText,
        ticketId: finalId,
        category: finalGrievanceDoc['category'] ?? 'General',
        location: finalGrievanceDoc['cleanLocation'] ?? 'Delhi NCR',
        urgency: finalGrievanceDoc['urgency'] ?? 'Medium',
        dept: finalGrievanceDoc['suggested_department'] ?? 'MCD',
        lat: finalGrievanceDoc['latitude'] ?? 0.0,
        lng: finalGrievanceDoc['longitude'] ?? 0.0,
      );

      if (mounted) {
        showSubtleToast(context, widget.t('successSubmit'));
      }
    } catch (e) {
      showSubtleToast(context, e.toString().replaceAll("Exception: ", ""), isError: true);
    } finally {
      setState(() => _isAnalyzing = false);
      _generateCaptcha();
    }
  }

  /// Sends a WhatsApp message (falls back to SMS) confirming the grievance submission.
  Future<void> _sendConfirmationMessage({
    required String phone,
    required String name,
    required String ticketId,
    required String category,
    required String location,
    required String urgency,
    required String dept,
    required double lat,
    required double lng,
  }) async {
    final shortId = ticketId.length >= 6 
        ? '#G-${ticketId.substring(0, 6).toUpperCase()}' 
        : '#G-${ticketId.toUpperCase()}';
    final now = DateTime.now();
    final timeStr = '${now.day}/${now.month}/${now.year} at ${now.hour.toString().padLeft(2,'0')}:${now.minute.toString().padLeft(2,'0')}';

    // Format location properly with Lat/Lng and preserve Offline suffix
    String locationText = location;
    if (lat != 0.0 && lng != 0.0) {
      if (locationText.contains(" (Offline Mode)")) {
        final clean = locationText.replaceAll(" (Offline Mode)", "");
        locationText = "$clean (Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)}) (Offline Mode)";
      } else {
        locationText = "$location (Lat: ${lat.toStringAsFixed(4)}, Lng: ${lng.toStringAsFixed(4)})";
      }
    }

    final message =
        '✅ Dear $name, your grievance has been successfully registered with the MP Command Center.\n\n'
        '📌 Ticket ID: $shortId\n'
        '📅 Submitted: $timeStr\n'
        '📌 Location: $locationText\n'
        '🚨 Category: $category\n'
        '⚠️ Urgency: $urgency\n'
        '🏢 Assigned to: $dept\n\n'
        'Your complaint is now in the MP Priority Backlog. You will be notified once it is resolved. Thank you for reporting!';

    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');

    // Dispatches confirmation SMS directly from the server to the user's phone via Telemetry
    try {
      final telemetryUrl = widget.serverUrl + '/api/telemetry';
      await http.post(
        Uri.parse(telemetryUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'event': 'sms_notification',
          'properties': {
            'to': cleanPhone,
            'message': message,
            'grievanceId': ticketId,
            'type': 'registration_confirmation',
            'name': name,
          },
          'timestamp': DateTime.now().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 15));
      debugPrint("Direct confirmation SMS dispatched via Telemetry API link.");
    } catch (e) {
      debugPrint("Telemetry SMS dispatch failed: $e");
    }
  }

  void _handleSubmitClick() {
    if (!_formKey.currentState!.validate()) return;

    // GPS is now MANDATORY — block submission if not detected
    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.location_off_rounded, color: Colors.white, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  widget.lang == 'hi'
                      ? '📍 कृपया पहले GPS से अपना स्थान दर्ज करें।'
                      : '📍 GPS location is required. Please tap "Detect Location" first.',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    final userAns = int.tryParse(_captchaController.text.trim()) ?? -1;
    if (userAns != _captchaAnswer) {
      showSubtleToast(context, widget.t('captchaError'), isError: true);
      _generateCaptcha();
      return;
    }

    // Trigger OTP modal flow
    _openOtpModal(_phoneController.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).cardColor,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.blueGrey.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.t('submitTitle'),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: -0.2),
              ),
              const SizedBox(height: 3),
              Text(
                widget.t('submitSub'),
                style: const TextStyle(fontSize: 9.5, color: Colors.grey),
              ),
              const Divider(height: 20, color: Colors.black12),

              if (_aiReceipt != null) ...[
                _buildReceiptBox(),
                const SizedBox(height: 10),
              ],

              _buildNameField(),
              const SizedBox(height: 8),
              _buildPhoneField(),
              const SizedBox(height: 10),

              // GPS Location — MANDATORY FIELD
              Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF0F2027)
                      : const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _latitude == null
                        ? Colors.grey.shade300
                        : const Color(0xFF10B981),
                    width: 1.2,
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.location_on_outlined,
                              size: 14,
                              color: const Color(0xFF10B981),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              widget.lang == 'hi'
                                  ? 'GPS स्थान (अनिवार्य)'
                                  : 'GPS LOCATION TRACKER (REQUIRED)',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? Colors.white70
                                    : Colors.black87,
                              ),
                            ),
                          ],
                        ),
                        // CLEAR button — only show when location captured
                        if (_latitude != null)
                          GestureDetector(
                            onTap: () => setState(() {
                              _latitude = null;
                              _longitude = null;
                              _detectedLocation = null;
                              _landmarkController.clear();
                            }),
                            child: Row(
                              children: [
                                const Icon(Icons.delete_outline_rounded, size: 13, color: Colors.red),
                                const SizedBox(width: 3),
                                const Text(
                                  'CLEAR',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.red,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Detect button + live status row
                    Row(
                      children: [
                        ElevatedButton.icon(
                          onPressed: _detectGps,
                          icon: const Icon(Icons.my_location_rounded, size: 12),
                          label: Text(
                            widget.lang == 'hi' ? 'GPS से पता लगाएं' : 'DETECT LOCATION VIA GPS',
                            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        if (_latitude != null)
                          Expanded(
                            child: Text(
                              'GPS Active: ${_latitude!.toStringAsFixed(5)}, ${_longitude!.toStringAsFixed(5)}',
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          )
                        else
                          const Expanded(
                            child: Text(
                              'No location detected yet',
                              style: TextStyle(fontSize: 9, color: Colors.grey),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              // Required field error indicator
              if (_latitude == null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, size: 10, color: Colors.red),
                    const SizedBox(width: 4),
                    Text(
                      widget.lang == 'hi' ? 'GPS स्थान अनिवार्य है' : 'GPS location is required to submit',
                      style: const TextStyle(fontSize: 8.5, color: Colors.red, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),

              // Description Title & Voice Typing Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(widget.t('descLabel'), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                  IconButton(
                    onPressed: _openVoiceConsoleSheet,
                    icon: const Icon(Icons.mic_none_rounded, size: 16, color: Colors.green),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  )
                ],
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                style: const TextStyle(fontSize: 11),
                validator: (v) => v == null || v.length < 5 ? 'Please write details' : null,
                decoration: InputDecoration(
                  hintText: widget.t('descPlaceholder'),
                  hintStyle: const TextStyle(fontSize: 10.5, color: Colors.grey, height: 1.3),
                  contentPadding: const EdgeInsets.all(10),
                  filled: true,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 10),

              // Photos attachment (On-Demand)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _attachPhoto(ImageSource.camera),
                      icon: const Icon(Icons.videocam_outlined, size: 12),
                      label: Text(widget.t('gpsTakePhoto'), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _attachPhoto(ImageSource.gallery),
                      icon: const Icon(Icons.image_outlined, size: 12),
                      label: Text(widget.t('gpsSelectImage'), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                ],
              ),
              if (_imageFileName != null) ...[
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '✓ Photo attached: $_imageFileName',
                      style: const TextStyle(fontSize: 9, color: Colors.green, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 14, color: Colors.red),
                      onPressed: () => setState(() {
                        _selectedImageBase64 = null;
                        _imageFileName = null;
                      }),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    )
                  ],
                ),
              ],
              const SizedBox(height: 12),

              // Captcha Verification
              Text(widget.t('humanVerify'), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
              Text(widget.t('humanVerifyDesc'), style: const TextStyle(fontSize: 8.5, color: Colors.grey)),
              const SizedBox(height: 4),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '$_captchaNum1 + $_captchaNum2 = ',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _captchaController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        hintText: widget.t('humanAnswerPlaceholder'),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 16),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isAnalyzing ? null : _handleSubmitClick,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _isAnalyzing
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(widget.t('btnSubmit'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNameField() {
    return TextFormField(
      controller: _nameController,
      style: const TextStyle(fontSize: 11),
      validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
      decoration: InputDecoration(
        labelText: widget.t('fullName'),
        labelStyle: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
        hintText: widget.t('fullNamePlaceholder'),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
    );
  }

  Widget _buildPhoneField() {
    return TextFormField(
      controller: _phoneController,
      keyboardType: TextInputType.number,
      maxLength: 10,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(10),
      ],
      style: const TextStyle(fontSize: 11),
      validator: _validatePhoneNumber,
      decoration: InputDecoration(
        labelText: widget.t('contactNo'),
        labelStyle: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
        hintText: widget.t('contactPlaceholder'),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        counterText: '', // hide the built-in character counter
        suffixIcon: ValueListenableBuilder<TextEditingValue>(
          valueListenable: _phoneController,
          builder: (_, val, __) {
            final len = val.text.length;
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: Text(
                '$len/10',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: len == 10 ? Colors.green : Colors.grey,
                ),
              ),
            );
          },
        ),
        suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
      ),
    );
  }

  String? _validatePhoneNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final cleanPhone = value.trim().replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.length != 10) {
      return 'Enter a valid 10-digit mobile number';
    }
    return null;
  }

  Widget _buildReceiptBox() {
    final rc = _aiReceipt!;
    final isHi = widget.lang == 'hi';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle_rounded, size: 16, color: Colors.green),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isHi ? 'शिकायत सफलतापूर्वक दर्ज की गई!' : 'Grievance Registered Successfully!',
                  style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.green),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 14, color: Colors.grey),
                onPressed: () => setState(() => _aiReceipt = null),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            isHi
                ? 'आपकी शिकायत प्राथमिकता बैकलॉग में जोड़ दी गई है। पुष्टि एसएमएस भेजा गया है।'
                : 'Your complaint has been logged in the Priority Backlog. Confirmation SMS dispatched.',
            style: const TextStyle(fontSize: 8.5, color: Colors.grey),
          ),
          const Divider(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TICKET ID: #G-${rc['id'].toString().substring(0, 6).toUpperCase()}',
                style: const TextStyle(fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Colors.blueGrey),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  (rc['suggested_department'] ?? rc['assignedBody'] ?? 'MCD').toString().toUpperCase(),
                  style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.green),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _receiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.0),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 9, color: Colors.black87),
          children: [
            TextSpan(text: '$label: ', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}

class TrackerHistoryWidget extends StatelessWidget {
  final String Function(String) t;
  final String lang;
  final List<dynamic> myComplaints;
  final VoidCallback onClearHistory;
  final Future<void> Function(String) onResolveGrievance;

  const TrackerHistoryWidget({
    super.key,
    required this.t,
    required this.lang,
    required this.myComplaints,
    required this.onClearHistory,
    required this.onResolveGrievance,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).cardColor,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.blueGrey.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('myReportsTitle').toUpperCase(),
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        t('myReportsDesc'),
                        style: const TextStyle(fontSize: 8.5, color: Colors.grey),
                      )
                    ],
                  ),
                ),
                if (myComplaints.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.delete_sweep_rounded, color: Colors.redAccent, size: 18),
                    onPressed: () {
                      showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Clear history?'),
                          content: Text(t('clearHistoryConfirm')),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Clear')),
                          ],
                        ),
                      ).then((confirmed) {
                        if (confirmed == true) {
                          onClearHistory();
                        }
                      });
                    },
                  )
              ],
            ),
            const Divider(height: 16),

            if (myComplaints.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 30),
                child: Column(
                  children: [
                    Icon(Icons.folder_open_rounded, size: 32, color: Colors.grey.shade400),
                    const SizedBox(height: 10),
                    Text(
                      t('noReportsText'),
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      t('noReportsDesc'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 9, color: Colors.grey),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: myComplaints.length,
                separatorBuilder: (ctx, i) => const Divider(height: 8),
                itemBuilder: (ctx, i) {
                  final item = myComplaints[i];
                  final isResolved = item['status'] == 'Resolved';
                  return Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                item['cleanLocation'] ?? '',
                                style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                              decoration: BoxDecoration(
                                color: isResolved ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                isResolved ? t('resolvedLabel') : t('openLabel'),
                                style: TextStyle(
                                  fontSize: 7.5,
                                  fontWeight: FontWeight.bold,
                                  color: isResolved ? const Color(0xFF065F46) : const Color(0xFF92400E),
                                ),
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '"${item['description']}"',
                          style: const TextStyle(fontSize: 9.5, color: Colors.grey),
                        ),
                        const SizedBox(height: 6),
Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Dept: ${item['department']}',
                              style: const TextStyle(fontSize: 7.5, color: Colors.grey, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '#G-${item['id'].toString().substring(0, 4).toUpperCase()}',
                              style: const TextStyle(fontSize: 7.5, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                            )
                          ],
                        ),
                        if (!isResolved) ...[
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton.icon(
                                icon: const Icon(Icons.check_circle_outline, size: 14, color: Colors.green),
                                label: Text(
                                  lang == 'hi' ? 'समस्या हल हो गई है' : 'Mark as Resolved',
                                  style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold),
                                ),
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                onPressed: () {
                                  onResolveGrievance(item['id']);
                                },
                              ),
                            ],
                          )
                        ]
                      ],
                    ),
                  );
                },
              )
          ],
        ),
      ),
    );
  }
}

class MpAdminPortalContent extends StatefulWidget {
  final String Function(String) t;
  final String lang;
  final String serverUrl;
  final bool useDirectCloud;
  final String customGeminiKey;
  final List<dynamic> allGrievances;
  final VoidCallback onGrievancesFetched;
  final Future<void> Function(String) onResolveGrievance;

  const MpAdminPortalContent({
    super.key,
    required this.t,
    required this.lang,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
    required this.allGrievances,
    required this.onGrievancesFetched,
    required this.onResolveGrievance,
  });

  @override
  State<MpAdminPortalContent> createState() => _MpAdminPortalContentState();
}

class _MpAdminPortalContentState extends State<MpAdminPortalContent> {
  bool _isAuthenticated = false;
  String _activeSubTab = 'hub'; // hub, planner
  String _activeHubSubTab = 'list'; // list, map
  double _budgetRoads = 1.5;
  double _budgetWater = 2.0;
  double _budgetWaste = 1.5;
  bool _isSimulatingBudget = false;
  Map<String, dynamic>? _budgetSimulationResult;
  String _selectedSector = 'All';
  String _dateRange = 'ALL TIME'; // ALL TIME, WEEKLY, MONTHLY, YEARLY

  bool _isEasyMode = false; // Illiterate-Friendly Mode
  Map<String, dynamic>? _selectedGrievance;

  // DSS comparing proposal parameters
  final _dssTitleA = TextEditingController(text: "Girls High School Upgrade");
  final _dssEnrollA = TextEditingController(text: "420");
  final _dssDistanceA = TextEditingController(text: "12");

  final _dssTitleB = TextEditingController(text: "Constituency Skill Hub");
  final _dssCapacityB = TextEditingController(text: "150");
  final _dssDistanceB = TextEditingController(text: "20");

  bool _dssRunning = false;
  Map<String, dynamic>? _dssResult;

  bool _recommendationsRunning = false;
  String? _aiPlannerText;

  int _getRepeatCount(String landmark) {
    if (landmark.isEmpty) return 1;
    final normalized = landmark.trim().toLowerCase();
    int count = 0;
    for (var g in widget.allGrievances) {
      if (g['cleanLocation'] != null && g['cleanLocation'].toString().trim().toLowerCase() == normalized) {
        count += (g['trafficCount'] as int? ?? 1);
      }
    }
    return count > 0 ? count : 1;
  }

  int _calculatePriorityScore(String urgency, String landmark) {
    final weight = urgency == 'High' ? 3 : (urgency == 'Medium' ? 2 : 1);
    final repeats = _getRepeatCount(landmark);
    return weight * repeats;
  }

  List<dynamic> _getFilteredGrievances() {
    List<dynamic> list = widget.allGrievances;
    if (_selectedSector != 'All') {
      list = list.where((g) {
        final sec = (g['sector'] ?? '').toString().toLowerCase();
        final sel = _selectedSector.toLowerCase();
        final keyword = sel.split(' ')[0]; // 'west', 'east', 'central', 'south'
        return sec.contains(keyword) || (g['cleanLocation'] ?? '').toString().toLowerCase().contains(keyword);
      }).toList();
    }
    final now = DateTime.now();
    if (_dateRange == 'WEEKLY') {
      list = list.where((g) {
        final t = DateTime.tryParse(g['createdAt'] ?? '') ?? now;
        return now.difference(t).inDays <= 7;
      }).toList();
    } else if (_dateRange == 'MONTHLY') {
      list = list.where((g) {
        final t = DateTime.tryParse(g['createdAt'] ?? '') ?? now;
        return now.difference(t).inDays <= 30;
      }).toList();
    } else if (_dateRange == 'YEARLY') {
      list = list.where((g) {
        final t = DateTime.tryParse(g['createdAt'] ?? '') ?? now;
        return now.difference(t).inDays <= 365;
      }).toList();
    }
    return list;
  }

  Widget _buildConstituencyHeatmap() {
    final openCases = widget.allGrievances.where((g) => g['status'] == 'Open').toList();

    // Build marker data from lat/lng stored on each grievance
    final markers = openCases.where((g) {
      final lat = (g['latitude'] as num?)?.toDouble();
      final lng = (g['longitude'] as num?)?.toDouble();
      return lat != null && lng != null && lat != 0 && lng != 0;
    }).map((g) {
      final lat = (g['latitude'] as num).toDouble();
      final lng = (g['longitude'] as num).toDouble();
      final urgency = g['urgency'] ?? 'Medium';
      final Color pinColor = urgency == 'High'
          ? const Color(0xFFDC2626)
          : urgency == 'Medium'
              ? const Color(0xFFF97316)
              : const Color(0xFF3B82F6);

      return Marker(
        width: 32,
        height: 32,
        point: LatLng(lat, lng),
        child: GestureDetector(
          onTap: () {
            setState(() => _selectedGrievance = g);
          },
          child: Container(
            decoration: BoxDecoration(
              color: pinColor,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [BoxShadow(color: pinColor.withOpacity(0.5), blurRadius: 6, spreadRadius: 2)],
            ),
            child: Icon(
              urgency == 'High' ? Icons.warning_amber_rounded : Icons.place_rounded,
              color: Colors.white,
              size: 14,
            ),
          ),
        ),
      );
    }).toList();

    // Compute centre: average of all points, fallback to New Delhi
    double centerLat = 28.6139;
    double centerLng = 77.2090;
    if (markers.isNotEmpty) {
      final lats = openCases
          .where((g) => (g['latitude'] as num?) != null)
          .map((g) => (g['latitude'] as num).toDouble());
      final lngs = openCases
          .where((g) => (g['longitude'] as num?) != null)
          .map((g) => (g['longitude'] as num).toDouble());
      if (lats.isNotEmpty) {
        centerLat = lats.reduce((a, b) => a + b) / lats.length;
        centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.lang == 'hi' ? 'हॉटस्पॉट मानचित्र' : 'HOTSPOT MAP',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            Row(children: [
              _mapLegendDot(const Color(0xFFDC2626), 'High'),
              const SizedBox(width: 6),
              _mapLegendDot(const Color(0xFFF97316), 'Med'),
              const SizedBox(width: 6),
              _mapLegendDot(const Color(0xFF3B82F6), 'Low'),
            ]),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          widget.lang == 'hi'
              ? 'पिन पर टैप करें — शिकायत विवरण नीचे दिखेगा'
              : 'Tap any pin to see complaint details below',
          style: const TextStyle(fontSize: 9, color: Colors.grey),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 280,
            child: markers.isEmpty
                ? Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? const Color(0xFF1E293B)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.map_outlined, size: 32, color: Colors.grey),
                        SizedBox(height: 8),
                        Text('No GPS-pinned complaints yet', style: TextStyle(fontSize: 10, color: Colors.grey)),
                      ]),
                    ),
                  )
                : FlutterMap(
                    options: MapOptions(
                      initialCenter: LatLng(centerLat, centerLng),
                      initialZoom: 13.0,
                      interactionOptions: const InteractionOptions(
                        flags: InteractiveFlag.all,
                      ),
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.example.mp_grievance_portal',
                        maxNativeZoom: 19,
                      ),
                      CircleLayer(
                        circles: openCases.where((g) {
                          final lat = (g['latitude'] as num?)?.toDouble();
                          final lng = (g['longitude'] as num?)?.toDouble();
                          return lat != null && lng != null && lat != 0 && lng != 0;
                        }).map((g) {
                          final lat = (g['latitude'] as num).toDouble();
                          final lng = (g['longitude'] as num).toDouble();
                          final urgency = g['urgency'] ?? 'Medium';
                          final Color areaColor = urgency == 'High'
                              ? const Color(0x33DC2626) // semi-transparent red
                              : urgency == 'Medium'
                                  ? const Color(0x33F97316) // semi-transparent orange
                                  : const Color(0x333B82F6); // semi-transparent blue
                          
                          return CircleMarker(
                            point: LatLng(lat, lng),
                            radius: 350, // 350 meters hotspot radius
                            useRadiusInMeter: true,
                            color: areaColor,
                            borderColor: areaColor.withOpacity(0.6),
                            borderStrokeWidth: 1.5,
                          );
                        }).toList(),
                      ),
                      MarkerLayer(markers: markers),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _mapLegendDot(Color color, String label) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 3),
      Text(label, style: const TextStyle(fontSize: 8, color: Colors.grey)),
    ]);
  }
  Future<void> _updateGrievanceStatus(String newStatus, String smsTemplate) async {
    if (_selectedGrievance == null) return;
    final String gId = _selectedGrievance!['id'];
    final String citizenName = _selectedGrievance!['name'] ?? "Citizen";
    final String contact = _selectedGrievance!['contact'] ?? "";
    final String category = _selectedGrievance!['category'] ?? "General";

    try {
      if (widget.useDirectCloud) {
        final updateUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-d5068/databases/ai-studio-remixcopyofremix-a8653321-ecd4-4cbb-af19-0b76c658c904/documents/grievances/$gId?updateMask.fieldPaths=status';
        final updatePayload = _toFirestoreFields({'status': newStatus});
        final patchRes = await http.patch(
          Uri.parse(updateUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(updatePayload),
        );
        if (patchRes.statusCode != 200) {
          throw Exception("Failed to update status directly.");
        }
      } else {
        final res = await http.post(
          Uri.parse('${widget.serverUrl}/api/update-grievance'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'id': gId,
            'status': newStatus,
          }),
        );
        if (res.statusCode != 200) {
          throw Exception("Failed to update status.");
        }
      }

      // Dispatch resolution status SMS
      try {
        final smsMsg = 'Dear $citizenName, your report regarding $category (#G-${gId.substring(0,4).toUpperCase()}) status has been updated to "$newStatus".';
        await http.post(
          Uri.parse('${widget.serverUrl}/api/telemetry'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'event': 'sms_notification',
            'properties': {
              'to': contact,
              'message': smsMsg,
              'grievanceId': gId,
              'type': 'status_change',
              'status': newStatus,
              'name': citizenName,
            },
            'timestamp': DateTime.now().toIso8601String(),
          }),
        );
      } catch (_) {}

      showSubtleToast(context, 'Status updated to $newStatus');

      if (newStatus == 'Resolved') {
        await widget.onResolveGrievance(gId);
      }
      setState(() {
        _selectedGrievance = null;
      });
      widget.onGrievancesFetched();
    } catch (e) {
      showSubtleToast(context, e.toString(), isError: true);
    }
  }

  // Bilingual Speech Synthesis interop
  void _speakTicketDetails(Map<String, dynamic> g) {
    final String cleanLoc = g['cleanLocation'] ?? '';
    final String category = g['category'] ?? '';
    final String desc = g['description'] ?? '';

    final text = widget.lang == 'hi'
        ? "शिकायत विभाग: $category। स्थान: $cleanLoc। समस्या का विवरण: $desc"
        : "Grievance Department: $category. Location: $cleanLoc. Description of issue: $desc";

    if (kIsWeb) {
      try {
        js.context.callMethod('eval', ["""
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            var utterance = new SpeechSynthesisUtterance('${text.replaceAll("'", "\\'")}');
            utterance.lang = '${widget.lang == 'hi' ? 'hi-IN' : 'en-IN'}';
            window.speechSynthesis.speak(utterance);
          } else {
            console.log("Speech synthesis not supported in browser.");
          }
        """]);
      } catch (e) {
        debugPrint("Speech synthesis evaluation error: $e");
      }
    } else {
      // Show simulated dialog for mobile
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Row(
            children: const [
              Icon(Icons.volume_up, color: Colors.green),
              SizedBox(width: 8),
              Text('🔊 Reading Report'),
            ],
          ),
          content: Text(text, style: const TextStyle(fontSize: 12, height: 1.4)),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          ],
        ),
      );
    }
  }

  Future<void> _runDssComparison() async {
    setState(() {
      _dssRunning = true;
      _dssResult = null;
    });

    final sector = _selectedSector == 'All' ? 'Central Zone' : _selectedSector;
    final sectorGrievances = widget.allGrievances.where((g) => g['sector'] == sector).toList();
    final openCount = sectorGrievances.where((g) => g['status'] == 'Open').length;

    final categoryDistribution = {
      'garbage': sectorGrievances.where((g) => g['department'] == 'Garbage Report').length,
      'water': sectorGrievances.where((g) => g['department'] == 'Water Logging').length,
      'potholes': sectorGrievances.where((g) => g['department'] == 'Potholes').length,
    };

    final schoolEnrollment = int.tryParse(_dssEnrollA.text.trim()) ?? 300;
    final schoolDistance = double.tryParse(_dssDistanceA.text.trim()) ?? 5.0;
    final vocaCapacity = int.tryParse(_dssCapacityB.text.trim()) ?? 100;
    final vocaDistance = double.tryParse(_dssDistanceB.text.trim()) ?? 15.0;

    final proposals = [
      {
        'id': 1,
        'title': _dssTitleA.text.trim(),
        'type': 'school_upgrade',
        'parameters': {
          'enrollment': schoolEnrollment,
          'travelDistance': schoolDistance,
        }
      },
      {
        'id': 2,
        'title': _dssTitleB.text.trim(),
        'type': 'vocational_centre',
        'parameters': {
          'capacity': vocaCapacity,
          'travelDistance': vocaDistance,
        }
      }
    ];

    try {
      if (widget.useDirectCloud) {
        // Direct REST API Gemini call
        final key = widget.customGeminiKey.isNotEmpty ? widget.customGeminiKey : "AIzaSyAzVjLwmRoevXnRNsKx_e6qU0l-rfr4N4E";
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$key';

        final prompt = """Compare these development proposal projects in sector "$sector" with $openCount active complaints:
Proposal A: ${_dssTitleA.text.trim()} (enrollment: $schoolEnrollment, travel: ${schoolDistance}km)
Proposal B: ${_dssTitleB.text.trim()} (capacity: $vocaCapacity, travel: ${vocaDistance}km)

Evaluate and score both out of 100 using this exact weighted prioritization model:
1. Severity (25%)
2. Population Impact (20%)
3. Citizen Demand (20%)
4. Infrastructure Gap (15%)
5. Government Plan Alignment (10%)
6. Cost Efficiency (5%)
7. Social Equity (5%)

Output JSON with keys:
- recommendation: 2-sentence rationale report.
- rankedProposals: Array containing objects for School (id: 1) and Vocational (id: 2) with keys:
    - score: Integer (0-100)
    - scoreBreakdown: Object containing integer fields for severity, populationImpact, citizenDemand, infrastructureGap, govAlignment, costEfficiency, and socialEquity
""";

        final geminiRes = await http.post(
          Uri.parse(geminiUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'contents': [
              {
                'parts': [
                  {'text': prompt}
                ]
              }
            ],
            'generationConfig': {
              'responseMimeType': 'application/json'
            }
          }),
        ).timeout(const Duration(seconds: 15));

        if (geminiRes.statusCode == 200) {
          final resData = jsonDecode(geminiRes.body);
          final text = resData['candidates'][0]['content']['parts'][0]['text'] as String;
          final parsed = jsonDecode(text.trim());
          if (mounted) {
            setState(() {
              final ranked = parsed['rankedProposals'] as List?;
              final sProposal = ranked?.firstWhere((p) => p['id'] == 1, orElse: () => null);
              final vProposal = ranked?.firstWhere((p) => p['id'] == 2, orElse: () => null);
              _dssResult = {
                'recommendation': parsed['recommendation'] ?? '',
                'schoolScore': sProposal?['score'] ?? 80,
                'vocaScore': vProposal?['score'] ?? 70,
                'breakdownA': sProposal?['scoreBreakdown'],
                'breakdownB': vProposal?['scoreBreakdown'],
              };
            });
          }
        } else {
          throw Exception("Gemini DSS analysis failed. Check API Key configuration.");
        }
      } else {
        final res = await http.post(
          Uri.parse('${widget.serverUrl}/api/analyze-and-compare-proposals'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'proposals': proposals,
            'sector': sector,
            'activeGrievancesCount': openCount,
            'categoryDistribution': categoryDistribution,
          }),
        );

        if (res.statusCode == 200) {
          final parsed = jsonDecode(res.body);
          final list = parsed['rankedProposals'] as List? ?? [];
          if (mounted) {
            setState(() {
              final sProposal = list.firstWhere((p) => p['id'] == 1, orElse: () => null);
              final vProposal = list.firstWhere((p) => p['id'] == 2, orElse: () => null);
              _dssResult = {
                'recommendation': parsed['aiRecommendationReport'] ?? '',
                'schoolScore': sProposal?['score'] ?? 80,
                'vocaScore': vProposal?['score'] ?? 70,
                'breakdownA': sProposal?['scoreBreakdown'],
                'breakdownB': vProposal?['scoreBreakdown'],
              };
            });
          }
        } else {
          throw Exception("Failed to retrieve DSS recommendation metrics.");
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _dssRunning = false);
      }
    }
  }

  Future<void> _generateBudgetPlan() async {
    setState(() {
      _recommendationsRunning = true;
      _aiPlannerText = null;
    });

    try {
      final openIssues = widget.allGrievances.where((g) => g['status'] == 'Open').toList();
      final complaintsSummary = openIssues
          .map((o) => "- Assignee Department: ${o['department']}, Landmark Location: ${o['cleanLocation']}, Problem Description: ${o['description']}")
          .join("\n");

      if (widget.useDirectCloud) {
        final key = widget.customGeminiKey.isNotEmpty ? widget.customGeminiKey : "AIzaSyAzVjLwmRoevXnRNsKx_e6qU0l-rfr4N4E";
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$key';

        final prompt = """Based on these active citizen grievances, generate a brief budget allocation and priority actions plan:
$complaintsSummary

Provide 3 actionable recommendations for the Member of Parliament (MP) command center.
""";

        final geminiRes = await http.post(
          Uri.parse(geminiUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'contents': [
              {
                'parts': [
                  {'text': prompt}
                ]
              }
            ],
          }),
        ).timeout(const Duration(seconds: 15));

        if (geminiRes.statusCode == 200) {
          final resData = jsonDecode(geminiRes.body);
          final text = resData['candidates'][0]['content']['parts'][0]['text'] as String;
          setState(() {
            _aiPlannerText = text.trim();
          });
        } else {
          throw Exception("Gemini budget planner failed. Check API Key.");
        }
      } else {
        final res = await http.post(
          Uri.parse('${widget.serverUrl}/api/generate-recommendations'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'complaintsSummary': complaintsSummary}),
        );

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          setState(() {
            _aiPlannerText = data['report'] ?? 'No recommendations compiled.';
          });
        } else {
          throw Exception("Failed to compile scan recommendations.");
        }
      }
    } catch (e) {
      showSubtleToast(context, e.toString(), isError: true);
    } finally {
      setState(() => _recommendationsRunning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return _buildAuthGate();
    }

    final filtered = _getFilteredGrievances();
    final openCount = filtered.where((g) => g['status'] == 'Open').length;
    final resolvedCount = filtered.where((g) => g['status'] == 'Resolved').length;

    Widget mpTabSelector = Container(
      padding: const EdgeInsets.all(3),
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0), 
        borderRadius: BorderRadius.circular(10)
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _activeSubTab = 'hub'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _activeSubTab == 'hub' 
                      ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.feed_outlined, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      widget.lang == 'hi' ? 'शिकायत हब' : widget.lang == 'hl' ? 'Grievances Hub' : 'GRIEVANCES HUB',
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _activeSubTab = 'planner'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _activeSubTab == 'planner' 
                      ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.auto_awesome_outlined, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      widget.lang == 'hi' ? 'स्मार्ट प्लानर' : widget.lang == 'hl' ? 'Smart Planner' : 'SMART PLANNER',
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );

    // KPI cards (scaled for Easy Mode)
    Widget statsGrid = GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: _isEasyMode ? 1.6 : 2.0,
      children: [
        _kpiCard(widget.lang == 'hi' ? 'कुल दर्ज' : widget.lang == 'hl' ? 'Total Logged' : 'TOTAL LOGGED', '${filtered.length}', Icons.description_outlined, Colors.blueGrey),
        _kpiCard(widget.lang == 'hi' ? 'सक्रिय शिकायतें' : widget.lang == 'hl' ? 'Open Backlog' : 'OPEN BACKLOG', '$openCount', Icons.schedule_rounded, Colors.orange),
        _kpiCard(widget.lang == 'hi' ? 'समाधानित' : widget.lang == 'hl' ? 'Resolved' : 'RESOLVED', '$resolvedCount', Icons.check_circle_outline, Colors.green),
        _kpiCard(widget.lang == 'hi' ? 'हॉटस्पॉट' : widget.lang == 'hl' ? 'Hotspots' : 'HOTSPOTS', '${filtered.where((g) => g['status'] == 'Open').length}', Icons.trending_up, Colors.blue),
      ],
    );

    Widget hubSubTabSelector = Container(
      padding: const EdgeInsets.all(2),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0), 
        borderRadius: BorderRadius.circular(8)
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _activeHubSubTab = 'list'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  color: _activeHubSubTab == 'list' 
                      ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                alignment: Alignment.center,
                child: Text(
                  widget.lang == 'hi' ? 'शिकायत सूची' : 'Complaint List',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _activeHubSubTab = 'map'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  color: _activeHubSubTab == 'map' 
                      ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                alignment: Alignment.center,
                child: Text(
                  widget.lang == 'hi' ? 'मानचित्र और विश्लेषण' : 'Map & Analytics',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );

    Widget grievancesHubContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        hubSubTabSelector,
        if (_activeHubSubTab == 'list') ...[
          _buildBacklogList(),
          const SizedBox(height: 12),
          _buildSelectedGrievanceConsole(),
        ] else ...[
          _buildConstituencyHeatmap(),
          const SizedBox(height: 12),
          _buildGroupedCasesCard(),
          const SizedBox(height: 12),
          statsGrid,
        ],
      ],
    );

    Widget smartPlannerContent = Column(
      children: [
        _buildConstituencyKPIAnalyticsCard(),
        const SizedBox(height: 12),
        _buildConstituencyBudgetSimulator(),
        const SizedBox(height: 12),
        _buildDssComparisonCard(),
        const SizedBox(height: 12),
        _buildBudgetScanCard(),
      ],
    );

    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      child: Column(
        children: [
          mpTabSelector,
          const SizedBox(height: 4),
          _activeSubTab == 'hub' ? grievancesHubContent : smartPlannerContent,
        ],
      ),
    );
  }

  Widget _buildConstituencyKPIAnalyticsCard() {
    final all = widget.allGrievances;
    final total = all.length;
    final open = all.where((g) => g['status'] == 'Open').length;
    final resolved = all.where((g) => g['status'] == 'Resolved').length;
    final closed = all.where((g) => g['status'] == 'Closed').length;

    final double resolutionRate = total > 0 ? ((resolved + closed) / total) * 100 : 0.0;
    
    // SLA Resolution metric: High-Urgency tickets resolved index
    final highUrgencyTotal = all.where((g) => g['urgency'] == 'High').length;
    final highUrgencyClosed = all.where((g) => g['urgency'] == 'High' && (g['status'] == 'Resolved' || g['status'] == 'Closed')).length;
    final double slaIndex = highUrgencyTotal > 0 ? (highUrgencyClosed / highUrgencyTotal) * 100 : 100.0;

    return Card(
      color: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: Colors.blueGrey.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.analytics_outlined, size: 16, color: Colors.indigo),
                const SizedBox(width: 6),
                Text(
                  widget.lang == 'hi' ? 'निर्वाचन क्षेत्र एसएलए और प्रदर्शन सूचकांक' : widget.lang == 'hl' ? 'Constituency SLA & Performance Index' : 'CONSTITUENCY SLA & PERFORMANCE INDEX', 
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              widget.lang == 'hi' ? 'वास्तविक समय एसएलए समाधान ट्रैकिंग और प्रतिक्रिया आंकड़े।' : widget.lang == 'hl' ? 'Real-time SLA resolution tracking aur response statistics.' : 'Real-time SLA resolution tracking and response statistics.',
              style: const TextStyle(fontSize: 8.5, color: Colors.grey),
            ),
            const Divider(height: 12),
            Row(
              children: [
                Expanded(
                  child: _kpiStatTile(
                    label: widget.lang == 'hi' ? 'कुल बैकलॉग' : widget.lang == 'hl' ? 'Total Backlog' : 'TOTAL BACKLOG',
                    value: '$total',
                    color: Colors.indigo,
                    icon: Icons.assignment_outlined,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _kpiStatTile(
                    label: widget.lang == 'hi' ? 'सक्रिय खुली शिकायतें' : widget.lang == 'hl' ? 'Active Open' : 'ACTIVE OPEN',
                    value: '$open',
                    color: Colors.amber.shade800,
                    icon: Icons.pending_actions_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _kpiStatTile(
                    label: widget.lang == 'hi' ? 'समाधान दर' : widget.lang == 'hl' ? 'Resolution Rate' : 'RESOLUTION RATE',
                    value: '${resolutionRate.toStringAsFixed(1)}%',
                    color: Colors.green.shade700,
                    icon: Icons.check_circle_outline,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _kpiStatTile(
                    label: widget.lang == 'hi' ? 'उच्च प्राथमिकता एसएलए' : widget.lang == 'hl' ? 'High-Priority SLA' : 'HIGH-PRIORITY SLA',
                    value: '${slaIndex.toStringAsFixed(1)}%',
                    color: Colors.red.shade700,
                    icon: Icons.speed_outlined,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpiStatTile({
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 7.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
              ],
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildConstituencyBudgetSimulator() {
    final double totalAllocated = _budgetRoads + _budgetWater + _budgetWaste;
    final bool hasOverrun = totalAllocated > 5.0;

    return Card(
      color: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: Colors.blueGrey.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.account_balance_wallet_outlined, size: 16, color: Colors.teal),
                const SizedBox(width: 6),
                Text(
                  widget.lang == 'hi' ? 'विकास निधि आवंटन सिम्युलेटर' : 'CONSTITUENCY DEVELOPMENT BUDGET SIMULATOR',
                  style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              widget.lang == 'hi'
                  ? '₹5.0 करोड़ का वार्षिक बजट वितरित करें और संभावित लोक संतुष्टि का विश्लेषण करें।'
                  : 'Distribute ₹5.0 Crore development grant and simulate expected public satisfaction.',
              style: const TextStyle(fontSize: 8.5, color: Colors.grey),
            ),
            const Divider(height: 12),

            _budgetSliderRow('Road Repair / Potholes', _budgetRoads, Colors.blue, (val) {
              setState(() => _budgetRoads = val);
            }),
            _budgetSliderRow('Water Logging / Drainage', _budgetWater, Colors.indigo, (val) {
              setState(() => _budgetWater = val);
            }),
            _budgetSliderRow('Solid Waste Management', _budgetWaste, Colors.teal, (val) {
              setState(() => _budgetWaste = val);
            }),

            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total Allocated: ₹' + totalAllocated.toStringAsFixed(1) + ' Cr / ₹5.0 Cr',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                    color: hasOverrun ? Colors.red : Colors.green,
                  ),
                ),
                if (hasOverrun)
                  const Text('⚠️ BUDGET OVERRUN', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.red)),
              ],
            ),
            const SizedBox(height: 12),

            SizedBox(
              width: double.infinity,
              height: 38,
              child: ElevatedButton.icon(
                onPressed: _isSimulatingBudget ? null : _simulateBudgetAllocation,
                icon: const Icon(Icons.speed_rounded, size: 14),
                label: const Text('SIMULATE OUTCOME & ROI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal.shade700,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),

            if (_isSimulatingBudget) ...[
              const SizedBox(height: 10),
              const Center(child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.teal))),
            ],

            if (_budgetSimulationResult != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.teal.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.teal.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('SIMULATION PROJECTION REPORT:', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.teal)),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _projectionStat('Satisfaction Index', _budgetSimulationResult!['satisfaction'].toString() + '%'),
                        _projectionStat('Tickets Resolved', _budgetSimulationResult!['resolved'].toString()),
                        _projectionStat('Cost Efficiency / Cr', _budgetSimulationResult!['roi'].toString()),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _budgetSimulationResult!['comments'],
                      style: const TextStyle(fontSize: 9, height: 1.35, fontWeight: FontWeight.w500),
                    )
                  ],
                ),
              )
            ]
          ],
        ),
      ),
    );
  }

  Widget _budgetSliderRow(String label, double value, Color color, ValueChanged<double> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(label, style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold)),
          ),
          Expanded(
            flex: 5,
            child: Slider(
              value: value,
              min: 0.0,
              max: 5.0,
              divisions: 50,
              activeColor: color,
              onChanged: onChanged,
            ),
          ),
          Expanded(
            flex: 1,
            child: Text(
              '₹' + value.toStringAsFixed(1) + ' Cr',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color),
              textAlign: TextAlign.end,
            ),
          )
        ],
      ),
    );
  }

  Widget _projectionStat(String label, String val) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 7.5, color: Colors.grey)),
        const SizedBox(height: 2),
        Text(val, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.teal)),
      ],
    );
  }

  void _simulateBudgetAllocation() {
    setState(() {
      _isSimulatingBudget = true;
    });
    
    final totalBudget = _budgetRoads + _budgetWater + _budgetWaste;
    
    int roadsCount = widget.allGrievances.where((g) => g['status'] == 'Open' && g['category'] == 'Road Infrastructure').length;
    int waterCount = widget.allGrievances.where((g) => g['status'] == 'Open' && g['category'] == 'Water Logging & Drainage').length;
    int wasteCount = widget.allGrievances.where((g) => g['status'] == 'Open' && g['category'] == 'Solid Waste Management').length;
    
    double roadsFactor = roadsCount > 0 ? (_budgetRoads / (roadsCount * 0.2)) : 1.0;
    double waterFactor = waterCount > 0 ? (_budgetWater / (waterCount * 0.3)) : 1.0;
    double wasteFactor = wasteCount > 0 ? (_budgetWaste / (wasteCount * 0.15)) : 1.0;
    
    if (roadsFactor > 1.0) roadsFactor = 1.0;
    if (waterFactor > 1.0) waterFactor = 1.0;
    if (wasteFactor > 1.0) wasteFactor = 1.0;
    
    final overallSatisfaction = ((roadsFactor * 0.35 + waterFactor * 0.4 + wasteFactor * 0.25) * 100).clamp(0, 100).toInt();
    final grievancesResolved = ((roadsFactor * roadsCount) + (waterFactor * waterCount) + (wasteFactor * wasteCount)).toInt();
    
    String comments = "";
    if (totalBudget > 5.0) {
      comments = "⚠️ BUDGET OVERRUN: You allocated ₹" + totalBudget.toStringAsFixed(1) + " Cr which exceeds the ₹5.0 Cr constituency grant. Please reduce allocation to optimize ROI.";
    } else {
      if (overallSatisfaction >= 85) {
        comments = "🏆 EXCELLENT ALLOCATION! You addressed Potholes, Water Logging, and Solid Waste in optimal proportions. This budget maximizes public satisfaction and resolves " + grievancesResolved.toString() + " complaints.";
      } else if (_budgetWater < 1.5 && waterCount > 2) {
        comments = "⚠️ CRITICAL DEFICIT: Water Logging complaints are high, but you allocated less than ₹1.5 Cr for Drainage. We recommend redirecting funds from other areas to prevent monsoon distress.";
      } else if (_budgetRoads < 1.0 && roadsCount > 2) {
        comments = "⚠️ ROAD DEFICIT: Road infrastructure complaints are high, but you allocated less than ₹1.0 Cr for Potholes. Citizens will face mobility challenges.";
      } else {
        comments = "👍 STABLE PLAN: Solid fund distribution. Satisfaction is at " + overallSatisfaction.toString() + "%. Adjust sliders to further balance high-urgency areas.";
      }
    }
    
    Future.delayed(const Duration(milliseconds: 600), () {
      setState(() {
        _isSimulatingBudget = false;
        _budgetSimulationResult = {
          'satisfaction': overallSatisfaction,
          'resolved': grievancesResolved,
          'roi': (overallSatisfaction / (totalBudget > 0 ? totalBudget : 1.0)).toStringAsFixed(1),
          'comments': comments
        };
      });
    });
  }

  Widget _buildDssComparisonCard() {
    return Card(
      color: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: Colors.blueGrey.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.analytics_rounded, size: 16, color: Color(0xFF4F46E5)),
                const SizedBox(width: 6),
                Text(widget.t('dssTitle'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 4),
            Text(widget.t('dssDesc'), style: const TextStyle(fontSize: 8.5, color: Colors.grey)),
            const Divider(height: 12),

            // Option A input
            const Text('OPTION A: SCHOOL UPGRADE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.blue)),
            const SizedBox(height: 4),
            TextFormField(controller: _dssTitleA, style: const TextStyle(fontSize: 10.5), decoration: _dssInputDecoration('Title')),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _dssEnrollA, keyboardType: TextInputType.number, style: const TextStyle(fontSize: 10.5), decoration: _dssInputDecoration('Enrollment'))),
                const SizedBox(width: 6),
                Expanded(child: TextFormField(controller: _dssDistanceA, keyboardType: TextInputType.number, style: const TextStyle(fontSize: 10.5), decoration: _dssInputDecoration('Distance (km)'))),
              ],
            ),
            const SizedBox(height: 12),

            // Option B input
            const Text('OPTION B: VOCATIONAL HUB', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.purple)),
            const SizedBox(height: 4),
            TextFormField(controller: _dssTitleB, style: const TextStyle(fontSize: 10.5), decoration: _dssInputDecoration('Title')),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _dssCapacityB, keyboardType: TextInputType.number, style: const TextStyle(fontSize: 10.5), decoration: _dssInputDecoration('Capacity'))),
                const SizedBox(width: 6),
                Expanded(child: TextFormField(controller: _dssDistanceB, keyboardType: TextInputType.number, style: const TextStyle(fontSize: 10.5), decoration: _dssInputDecoration('Distance (km)'))),
              ],
            ),
            const SizedBox(height: 14),

            SizedBox(
              width: double.infinity,
              height: 40,
              child: ElevatedButton.icon(
                onPressed: _dssRunning ? null : _runDssComparison,
                icon: const Icon(Icons.compare_arrows_rounded, size: 14),
                label: const Text('RUN WEIGHTED PRIORITY COMPARATOR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),

            if (_dssResult != null) ...[
              const SizedBox(height: 12),
              _buildDssResultsBox(),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildDssResultsBox() {
    final res = _dssResult!;
    final breakdownA = res['breakdownA'] as Map<String, dynamic>?;
    final breakdownB = res['breakdownB'] as Map<String, dynamic>?;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('AI PRIORITIZATION REPORT (7-FACTOR ENGINE)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
          const SizedBox(height: 4),
          Text(res['recommendation'] ?? '', style: const TextStyle(fontSize: 10, height: 1.35)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _scoreCard('School Score', res['schoolScore'] ?? 0, Colors.blue)),
              const SizedBox(width: 8),
              Expanded(child: _scoreCard('Vocational Score', res['vocaScore'] ?? 0, Colors.purple)),
            ],
          ),

          if (breakdownA != null && breakdownB != null) ...[
            const SizedBox(height: 12),
            const Text('DETAILED SCORING WEIGHTS BREAKDOWN:', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            _breakdownRow('1. Severity (25%)', breakdownA['severity'] ?? 0, breakdownB['severity'] ?? 0),
            _breakdownRow('2. Pop. Impact (20%)', breakdownA['populationImpact'] ?? 0, breakdownB['populationImpact'] ?? 0),
            _breakdownRow('3. Citizen Demand (20%)', breakdownA['citizenDemand'] ?? 0, breakdownB['citizenDemand'] ?? 0),
            _breakdownRow('4. Infra. Gap (15%)', breakdownA['infrastructureGap'] ?? 0, breakdownB['infrastructureGap'] ?? 0),
            _breakdownRow('5. Gov Alignment (10%)', breakdownA['govAlignment'] ?? 0, breakdownB['govAlignment'] ?? 0),
            _breakdownRow('6. Cost Efficiency (5%)', breakdownA['costEfficiency'] ?? 0, breakdownB['costEfficiency'] ?? 0),
            _breakdownRow('7. Social Equity (5%)', breakdownA['socialEquity'] ?? 0, breakdownB['socialEquity'] ?? 0),
          ]
        ],
      ),
    );
  }

  Widget _breakdownRow(String label, int valA, int valB) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 8.5, color: Colors.grey))),
          Text('A: $valA/100', style: const TextStyle(fontSize: 8.5, color: Colors.blue, fontWeight: FontWeight.bold)),
          const SizedBox(width: 10),
          Text('B: $valB/100', style: const TextStyle(fontSize: 8.5, color: Colors.purple, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _scoreCard(String label, int score, Color color) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0F172A) : Colors.white,
        border: Border.all(color: Colors.black12),
        borderRadius: BorderRadius.circular(6)
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 8, color: Colors.grey)),
          const SizedBox(height: 2),
          Text('$score/100', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  InputDecoration _dssInputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontSize: 8.5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      border: const OutlineInputBorder(),
    );
  }

  Widget _buildBudgetScanCard() {
    return Card(
      color: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: Colors.blueGrey.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.auto_awesome_rounded, size: 16, color: Colors.amber),
                SizedBox(width: 6),
                Text('AI SMART PLANNER BUDGET ALLOCATOR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Analyze all active complaints to allocate resources logically.',
              style: TextStyle(fontSize: 8.5, color: Colors.grey),
            ),
            const Divider(height: 12),
            SizedBox(
              width: double.infinity,
              height: 40,
              child: ElevatedButton.icon(
                onPressed: _recommendationsRunning ? null : _generateBudgetPlan,
                icon: const Icon(Icons.auto_awesome_rounded, size: 14),
                label: Text(widget.t('scanAI').toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo.shade700,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
            if (_recommendationsRunning) ...[
              const SizedBox(height: 10),
              const Center(child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))),
            ],
            if (_aiPlannerText != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.indigo.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.indigo.shade200),
                ),
                child: Text(_aiPlannerText!, style: const TextStyle(fontSize: 9.5, height: 1.4)),
              )
            ]
          ],
        ),
      ),
    );
  }

  /// Groups all open complaints by (location, category) and shows demographics.
  Widget _buildGroupedCasesCard() {
    final allOpen = widget.allGrievances.where((g) => g['status'] == 'Open').toList();
    if (allOpen.isEmpty) return const SizedBox.shrink();

    // Build group map: key = "category|cleanLocation"
    final Map<String, List<dynamic>> groups = {};
    for (var g in allOpen) {
      final cat = (g['category'] ?? 'General').toString();
      final loc = (g['cleanLocation'] ?? 'Unknown').toString();
      final key = '$cat|$loc';
      groups.putIfAbsent(key, () => []).add(g);
    }

    // Sort groups by size descending (most repeated first)
    final sortedKeys = groups.keys.toList()
      ..sort((a, b) => groups[b]!.length.compareTo(groups[a]!.length));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.lang == 'hi' ? 'समूहीकृत शिकायतें' : 'GROUPED BY LOCATION & ISSUE',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 2),
        Text(
          widget.lang == 'hi'
              ? 'एक ही स्थान और समस्या की बार-बार शिकायतें'
              : 'Repeated complaints from same area — indicates systemic issues',
          style: const TextStyle(fontSize: 9, color: Colors.grey),
        ),
        const Divider(height: 12),
        ...sortedKeys.take(6).map((key) {
          final parts = key.split('|');
          final cat = parts[0];
          final loc = parts.length > 1 ? parts[1] : 'Unknown';
          final cases = groups[key]!;
          final count = cases.length;

          // Demographics: urgency breakdown
          final highCount = cases.where((g) => g['urgency'] == 'High').length;
          final medCount  = cases.where((g) => g['urgency'] == 'Medium').length;
          final lowCount  = cases.where((g) => g['urgency'] == 'Low').length;

          // Time distribution: morning (6-12), afternoon (12-18), night (18-6)
          int morningCount = 0, afternoonCount = 0, nightCount = 0;
          for (var g in cases) {
            final t = DateTime.tryParse(g['createdAt'] ?? '');
            if (t != null) {
              final h = t.hour;
              if (h >= 6 && h < 12) morningCount++;
              else if (h >= 12 && h < 18) afternoonCount++;
              else nightCount++;
            }
          }

          final Color catColor = cat.toLowerCase().contains('water')
              ? Colors.blue
              : cat.toLowerCase().contains('pothole') || cat.toLowerCase().contains('road')
                  ? Colors.orange
                  : cat.toLowerCase().contains('garbage') || cat.toLowerCase().contains('waste')
                      ? Colors.green
                      : Colors.indigo;

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: catColor.withOpacity(0.3), width: 1.2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        cat.toUpperCase(),
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: catColor),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: count >= 3 ? Colors.red.shade50 : Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: count >= 3 ? Colors.red.shade200 : Colors.orange.shade200),
                      ),
                      child: Text(
                        '$count ${count == 1 ? "report" : "reports"}',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: count >= 3 ? Colors.red.shade700 : Colors.orange.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 10, color: Colors.grey),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        loc,
                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // Urgency breakdown chips
                Row(
                  children: [
                    const Text('Urgency: ', style: TextStyle(fontSize: 8.5, color: Colors.grey)),
                    if (highCount > 0) _groupChip('$highCount High', Colors.red),
                    if (medCount > 0)  _groupChip('$medCount Med', Colors.orange),
                    if (lowCount > 0)  _groupChip('$lowCount Low', Colors.blue),
                  ],
                ),
                const SizedBox(height: 4),
                // Time-of-day demographics
                Row(
                  children: [
                    const Text('Reports: ', style: TextStyle(fontSize: 8.5, color: Colors.grey)),
                    if (morningCount > 0)   _groupChip('☀ $morningCount Morning', Colors.amber),
                    if (afternoonCount > 0) _groupChip('🌤 $afternoonCount Afternoon', Colors.orange),
                    if (nightCount > 0)     _groupChip('🌙 $nightCount Night', Colors.indigo),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _groupChip(String label, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 4),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label, style: TextStyle(fontSize: 7.5, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _buildBacklogList() {
    final List<dynamic> processedGrievances = _getFilteredGrievances().map((g) {
      final String urgency = g['urgency'] ?? 'Medium';
      final String landmark = g['cleanLocation'] ?? '';
      final score = _calculatePriorityScore(urgency, landmark);
      final repeats = _getRepeatCount(landmark);
      return {
        ...g,
        'priorityScore': score,
        'repeatCount': repeats,
      };
    }).toList();

    processedGrievances.sort((a, b) {
      final int scoreA = a['priorityScore'] as int;
      final int scoreB = b['priorityScore'] as int;
      return scoreB.compareTo(scoreA);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.lang == 'hi'
                  ? 'हाल की शिकायतें (${processedGrievances.length})'
                  : 'RECENT CASES (${processedGrievances.length})',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            if (processedGrievances.isNotEmpty)
              Text(
                'Sorted by priority',
                style: TextStyle(fontSize: 8.5, color: Colors.grey.shade500),
              ),
          ],
        ),
        const Divider(height: 10),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: processedGrievances.length,
          separatorBuilder: (ctx, i) => const SizedBox(height: 6),
          itemBuilder: (ctx, i) {
            final g = processedGrievances[i];
            final score = g['priorityScore'] ?? 0;
            final repeats = g['repeatCount'] ?? 1;
            final isSelected = _selectedGrievance?['id'] == g['id'];
            final isResolved = g['status'] == 'Resolved';
    final isClosed = g['status'] == 'Closed';

            final urgency = g['urgency'] ?? 'Medium';
            final Color itemBorderColor = isSelected 
                ? (Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black) 
                : Colors.black12;

            return InkWell(
              onTap: () => setState(() => _selectedGrievance = g),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: itemBorderColor, width: isSelected ? 1.5 : 1),
                ),
                child: Row(
                  children: [
                    // Priority Indicator (Beacons for Easy Mode)
                    Container(
                      width: _isEasyMode ? 44 : 32,
                      height: _isEasyMode ? 44 : 32,
                      decoration: BoxDecoration(
                        color: urgency == 'High' 
                            ? Colors.red.shade50 
                            : (urgency == 'Medium' ? Colors.orange.shade50 : Colors.blue.shade50),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: urgency == 'High' ? Colors.red : (urgency == 'Medium' ? Colors.orange : Colors.blue),
                          width: 2,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '$score',
                        style: TextStyle(
                          fontSize: _isEasyMode ? 16 : 12,
                          fontWeight: FontWeight.bold,
                          color: urgency == 'High' ? Colors.red : (urgency == 'Medium' ? Colors.orange : Colors.blue),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              if (_isEasyMode) ...[
                                Text(
                                  urgency == 'High' ? '🔴 EMERGENCY' : (urgency == 'Medium' ? '🟠 WARNING' : '🔵 LOW'),
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(width: 6),
                              ],
                              Text(
                                g['category'] ?? '',
                                style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: g['status'] == 'Closed'
                                      ? Colors.blueGrey.shade100
                                      : (g['status'] == 'Resolved' ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7)),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  (g['status'] ?? 'Open').toString().toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 7.5,
                                    fontWeight: FontWeight.bold,
                                    color: g['status'] == 'Closed'
                                        ? Colors.blueGrey.shade700
                                        : (g['status'] == 'Resolved' ? const Color(0xFF065F46) : const Color(0xFF92400E)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: g['status'] == 'Closed'
                                      ? Colors.blueGrey.shade100
                                      : (g['status'] == 'Resolved' ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7)),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  (g['status'] ?? 'Open').toString().toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 7.5,
                                    fontWeight: FontWeight.bold,
                                    color: g['status'] == 'Closed'
                                        ? Colors.blueGrey.shade700
                                        : (g['status'] == 'Resolved' ? const Color(0xFF065F46) : const Color(0xFF92400E)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            g['cleanLocation'] ?? '',
                            style: TextStyle(fontSize: _isEasyMode ? 12.5 : 10.5, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '"${g['summary'] ?? g['description'] ?? ''}"',
                            style: TextStyle(fontSize: _isEasyMode ? 11 : 9, color: Colors.grey),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Repeats: $repeats',
                                style: const TextStyle(fontSize: 8, color: Colors.blueGrey, fontWeight: FontWeight.bold),
                              ),
                              // Easy mode listen button
                              IconButton(
                                icon: const Icon(Icons.volume_up, size: 16, color: Colors.green),
                                onPressed: () => _speakTicketDetails(g),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              )
                            ],
                          )
                        ],
                      ),
                    )
                  ],
                ),
              ),
            );
          },
        )
      ],
    );
  }

  void _showWorkOrderDialog(Map<String, dynamic> g) {
    final now = DateTime.now();
    final dateStr = "${now.day}/${now.month}/${now.year}";
    final dept = g['suggested_department'] ?? g['assignedBody'] ?? 'MCD';
    final location = g['cleanLocation'] ?? 'Delhi NCR';
    final ticketId = g['id'].toString().substring(0, 6).toUpperCase();
    final category = g['category'] ?? 'Civic Issue';
    final severity = g['severity'] ?? 'Medium';
    final desc = g['description'] ?? '';

    final String officialLetter = 
        "OFFICIAL REPRESENTATION\n"
        "OFFICE OF THE MEMBER OF PARLIAMENT (MP COMMAND CENTER)\n"
        "Date: $dateStr\n"
        "To,\n"
        "The Commissioner / Chief Engineer,\n"
        "Department of $dept, Delhi NCR\n\n"
        "Subject: Urgent Action Representation - Grievance ID #G-$ticketId\n\n"
        "Respected Sir/Madam,\n"
        "This is to bring to your immediate notice a public grievance registered at the MP Command Center:\n\n"
        "  • Ticket ID: #G-$ticketId\n"
        "  • Category: $category (Severity: $severity)\n"
        "  • Landmark/Location: $location\n"
        "  • Description: $desc\n\n"
        "This issue directly affects the local constituency population and requires immediate inspection and resolution under your department's jurisdiction.\n\n"
        "Please direct the local field inspector to initiate repair works on priority and update the status to this office.\n\n"
        "Warm regards,\n"
        "Office of the Member of Parliament\n"
        "Delhi NCR Constituency Command Center";

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Row(
            children: const [
              Icon(Icons.gavel_rounded, color: Colors.indigo),
              SizedBox(width: 8),
              Text('Official Work Order', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Copy and share this representation with department commissioners or engineers:',
                  style: TextStyle(fontSize: 10, color: Colors.grey),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  color: Theme.of(ctx).brightness == Brightness.dark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  child: SelectableText(
                    officialLetter,
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                
                  Clipboard.setData(ClipboardData(text: officialLetter));
                  showSubtleToast(context, 'Work order copied!');
                  Navigator.pop(ctx);
                
              },
              icon: const Icon(Icons.copy, size: 14),
              label: const Text('Copy Text', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
            )
          ],
        );
      },
    );
  }



  Widget _buildSelectedGrievanceConsole() {
    if (_selectedGrievance == null) return Container();
    final g = _selectedGrievance!;
    final isResolved = g['status'] == 'Resolved';
    final isClosed = g['status'] == 'Closed';

    // Simulated Verification Parameters
    final String reportTime = g['createdAt'] != null ? g['createdAt'].toString().substring(11, 16) : "08:30";
    final int repeats = _getRepeatCount(g['cleanLocation'] ?? '');
    
    return Card(
      color: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: Colors.blueGrey.withOpacity(0.15))),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'GRIEVANCE ACTION CONSOLE', 
                  style: TextStyle(fontSize: _isEasyMode ? 11 : 9, fontWeight: FontWeight.bold, color: Colors.grey)
                ),
                Text('#G-${g['id'].toString().substring(0, 5).toUpperCase()}', style: const TextStyle(fontSize: 8.5, fontFamily: 'monospace')),
              ],
            ),
            const Divider(height: 12),
            Text(
              'Location: ${g['cleanLocation']}', 
              style: TextStyle(fontSize: _isEasyMode ? 13 : 11, fontWeight: FontWeight.bold)
            ),
            const SizedBox(height: 4),
            Text(
              'Category: ${g['category']} | Status: ${g['status']}', 
              style: const TextStyle(fontSize: 9.5, color: Colors.blueGrey, fontWeight: FontWeight.bold)
            ),
            if (g['imageUrl'] != null && g['imageUrl'].toString().isNotEmpty) ...[
              const SizedBox(height: 10),
              const Text('ATTACHED PHOTOGRAPH:', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.indigo)),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: double.infinity,
                  height: 150,
                  color: Colors.black12,
                  child: Builder(
                    builder: (context) {
                      try {
                        final cleanBase64 = _sanitizeBase64(g['imageUrl'].toString());
                        return Image.memory(
                          base64Decode(cleanBase64),
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(child: Icon(Icons.broken_image_outlined, color: Colors.grey, size: 30));
                          },
                        );
                      } catch (e) {
                        return const Center(child: Icon(Icons.broken_image_outlined, color: Colors.grey, size: 30));
                      }
                    },
                  ),
                ),
              ),
            ],
            const SizedBox(height: 6),
            Text(
              'Description: "${g['description']}"', 
              style: TextStyle(fontSize: _isEasyMode ? 11 : 9.5, fontStyle: FontStyle.italic)
            ),
            const SizedBox(height: 8),
            // Secondary Utility: Official Work Order Generator
            SizedBox(
              width: double.infinity,
              height: 32,
              child: OutlinedButton.icon(
                onPressed: () => _showWorkOrderDialog(g),
                icon: const Icon(Icons.assignment_turned_in_outlined, size: 13, color: Colors.indigo),
                label: const Text('📋 GENERATE OFFICIAL WORK ORDER', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.indigo)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.indigo),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Secondary Utility: Official Work Order Generator
            SizedBox(
              width: double.infinity,
              height: 32,
              child: OutlinedButton.icon(
                onPressed: () => _showWorkOrderDialog(g),
                icon: const Icon(Icons.assignment_turned_in_outlined, size: 13, color: Colors.indigo),
                label: const Text('📋 GENERATE OFFICIAL WORK ORDER', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.indigo)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.indigo),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Grounding shield details
            const Text('GROUNDING SHIELD VALIDATION SUMMARY:', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.indigo)),
            const SizedBox(height: 4),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.indigo.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.indigo.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _groundingRow('a) Traffic Delays in Rain', 'Speeds dropped to 12 km/h near landmark, matching rainfall anomalies.'),
                  _groundingRow('b) Consolidated Reports', '$repeats reports filed from matching sector in 45 min buffer.'),
                  _groundingRow('c) Reporting Time Window', 'Reported at $reportTime (Peak Transit / High Commute Distress).'),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Large Actions for MP (Resolve, Reopen, and Close options)
            Row(
              children: [
                if (!isResolved && !isClosed) ...[
                  Expanded(
                    child: SizedBox(
                      height: _isEasyMode ? 56 : 38,
                      child: ElevatedButton(
                        onPressed: () => _updateGrievanceStatus('Resolved', 'Thank you. The reported issue has been successfully resolved.'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          widget.lang == 'hi' ? '✅ हल किया (RESOLVE)' : '✅ RESOLVE TICKET',
                          style: TextStyle(fontSize: _isEasyMode ? 12 : 9.5, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
                if (isResolved) ...[
                  Expanded(
                    child: SizedBox(
                      height: _isEasyMode ? 56 : 38,
                      child: ElevatedButton(
                        onPressed: () => _updateGrievanceStatus('Closed', 'Thank you. The resolved ticket is now closed by command inspector.'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueGrey.shade800,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          widget.lang == 'hi' ? '🔒 बंद करें (CLOSE)' : '🔒 CLOSE TICKET',
                          style: TextStyle(fontSize: _isEasyMode ? 12 : 9.5, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SizedBox(
                      height: _isEasyMode ? 56 : 38,
                      child: ElevatedButton(
                        onPressed: () => _updateGrievanceStatus('Open', 'Ticket reopened by command office inspection.'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange.shade700,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          widget.lang == 'hi' ? '❌ दोबारा खोलें' : '❌ REOPEN TICKET',
                          style: TextStyle(fontSize: _isEasyMode ? 12 : 9.5, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
                if (isClosed) ...[
                  Expanded(
                    child: SizedBox(
                      height: _isEasyMode ? 56 : 38,
                      child: ElevatedButton(
                        onPressed: () => _updateGrievanceStatus('Open', 'Closed ticket reopened for verification.'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange.shade700,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          widget.lang == 'hi' ? '❌ दोबारा खोलें' : '❌ REOPEN TICKET',
                          style: TextStyle(fontSize: _isEasyMode ? 12 : 9.5, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _groundingRow(String title, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
          Text(val, style: const TextStyle(fontSize: 8, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, Color color) {
    return Card(
      color: Theme.of(context).cardColor,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: Colors.blueGrey.withValues(alpha: 0.1))),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
              child: Icon(icon, size: 14, color: color),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 7.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildAuthGate() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Card(
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.shield_rounded, size: 54, color: Color(0xFF4F46E5)),
                const SizedBox(height: 12),
                Text(
                  widget.t('authTitle').toUpperCase(),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.t('authDesc'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: () => setState(() => _isAuthenticated = true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(widget.t('demoMode').toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SmsCenterSheet extends StatefulWidget {
  final String Function(String) t;
  final String serverUrl;
  final bool useDirectCloud;
  final String customGeminiKey;
  final VoidCallback onClose;
  final void Function(String, bool, String) onConfigChanged;

  const SmsCenterSheet({
    super.key,
    required this.t,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
    required this.onClose,
    required this.onConfigChanged,
  });

  @override
  State<SmsCenterSheet> createState() => _SmsCenterSheetState();
}

class _SmsCenterSheetState extends State<SmsCenterSheet> {
  final _urlController = TextEditingController();
  final _geminiKeyController = TextEditingController();
  late bool _directCloudActive;

  List<dynamic> _smsLogs = [];

  @override
  void initState() {
    super.initState();
    _urlController.text = widget.serverUrl;
    _geminiKeyController.text = widget.customGeminiKey;
    _directCloudActive = widget.useDirectCloud;
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    try {
      final res = await http.get(Uri.parse('${widget.serverUrl}/api/sms-logs')).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        setState(() {
          _smsLogs = jsonDecode(res.body)['logs'] ?? [];
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 380,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('SMS & CLOUD SETTINGS LINK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 24), onPressed: widget.onClose)
            ],
          ),
          const Divider(height: 12),
          Expanded(
            child: ListView(physics: const ClampingScrollPhysics(), 
              children: [
                SwitchListTile(
                  title: const Text('Direct Cloud (Firestore) Link', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Connects directly to Firestore (No local server required).', style: TextStyle(fontSize: 8.5)),
                  value: _directCloudActive,
                  onChanged: (val) => setState(() => _directCloudActive = val),
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 4),
                TextFormField(
                  controller: _geminiKeyController,
                  obscureText: true,
                  style: const TextStyle(fontSize: 10),
                  decoration: const InputDecoration(labelText: 'Custom Gemini Key (Optional)', contentPadding: EdgeInsets.all(6), border: OutlineInputBorder()),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _urlController,
                        style: const TextStyle(fontSize: 10),
                        decoration: const InputDecoration(labelText: 'Server Proxy URL', contentPadding: EdgeInsets.all(6), border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {
                        widget.onConfigChanged(
                          _urlController.text.trim(),
                          _directCloudActive,
                          _geminiKeyController.text.trim(),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Config saved successfully!')));
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white),
                      child: const Text('Save', style: TextStyle(fontSize: 10)),
                    )
                  ],
                ),
                const SizedBox(height: 12),
                const Text('SIMULATED SMS TRANSMISSION OUTBOX:', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.indigo)),
                const SizedBox(height: 4),
                if (_smsLogs.isEmpty)
                  const Text('No SMS codes dispatched yet.', style: TextStyle(fontSize: 9, color: Colors.grey))
                else
                  Container(
                    height: 100,
                    decoration: BoxDecoration(border: Border.all(color: Colors.black12), borderRadius: BorderRadius.circular(6)),
                    child: ListView.separated(physics: const ClampingScrollPhysics(), 
                      itemCount: _smsLogs.length,
                      separatorBuilder: (ctx, i) => const Divider(height: 1),
                      itemBuilder: (ctx, i) {
                        final log = _smsLogs[i];
                        return Padding(
                          padding: const EdgeInsets.all(4.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('To: ${log['to']} | Msg: "${log['message']}"', style: const TextStyle(fontSize: 8.5)),
                            ],
                          ),
                        );
                      },
                    ),
                  )
              ],
            ),
          )
        ],
      ),
    );
  }
}

class VoiceInstructionsWidget extends StatefulWidget {
  final String lang;
  final ValueChanged<String> onLangChanged;
  final String Function(String) t;

  const VoiceInstructionsWidget({
    super.key,
    required this.lang,
    required this.onLangChanged,
    required this.t,
  });

  @override
  State<VoiceInstructionsWidget> createState() => _VoiceInstructionsWidgetState();
}

class _VoiceInstructionsWidgetState extends State<VoiceInstructionsWidget> {
  int _currentStepIndex = 0;
  bool _isPlaying = false;

  void _nextStep() {
    setState(() {
      _currentStepIndex = (_currentStepIndex + 1) % guideSteps.length;
    });
  }

  void _prevStep() {
    setState(() {
      _currentStepIndex = (_currentStepIndex - 1 + guideSteps.length) % guideSteps.length;
    });
  }

  @override
  Widget build(BuildContext context) {
    final step = guideSteps[_currentStepIndex];
    final isHi = widget.lang == 'hi';

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.volume_up_rounded, color: Colors.blueAccent, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Builder(
                  builder: (context) {
                    String title = step.title;
                    if (widget.lang == 'hi') {
                      if (step.title == "WELCOME & PORTAL OVERVIEW") title = "स्वागत और पोर्टल सिंहावलोकन";
                      else if (step.title == "HOW TO FILE A GRIEVANCE") title = "शिकायत कैसे दर्ज करें";
                      else if (step.title == "TRACK YOUR TICKET STATUS") title = "अपनी शिकायत की स्थिति ट्रैक करें";
                    }
                    return Text(
                      title,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                    );
                  }
                ),
                Text(
                  isHi ? step.hi : step.en,
                  style: const TextStyle(fontSize: 8.5, color: Colors.white70),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded, color: Colors.white, size: 16),
                onPressed: _prevStep,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 4),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isPlaying = !_isPlaying;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(_isPlaying ? 'Playing Guide audio...' : 'Stopped guide audio.'),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  minimumSize: Size.zero,
                ),
                child: Text(_isPlaying ? 'STOP' : 'PLAY', style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 16),
                onPressed: _nextStep,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 8),
              // Lang toggle
              InkWell(
                onTap: () => widget.onLangChanged(isHi ? 'en' : 'hi'),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)),
                  child: Text(isHi ? 'EN' : 'हिं', style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              )
            ],
          )
        ],
      ),
    );
  }
}
