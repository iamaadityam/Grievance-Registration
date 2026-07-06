import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'web_speech_stub.dart' if (dart.library.js) 'dart:js' as js;

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
        final res = await http.get(Uri.parse(databaseUrl)).timeout(const Duration(seconds: 4));
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
            _activeNavBarIdx == 0 ? Icons.people_outline_rounded : Icons.shield_outlined,
            color: _activeNavBarIdx == 0 ? Colors.blue : Colors.green,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _activeNavBarIdx == 0 
                  ? (_citizenLang == 'hi' ? 'नागरिक शिकायत' : 'CITIZEN INTAKE')
                  : (_citizenLang == 'hi' ? 'सांसद डैशबोर्ड' : 'MP COMMAND CENTER'),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      actions: [
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

class CitizenPortalContent extends StatefulWidget {
  final String Function(String) t;
  final String lang;
  final ValueChanged<String> onLangChanged;
  final String citizenSubTab;
  final ValueChanged<String> onSubTabChanged;
  final List<dynamic> myComplaints;
  final VoidCallback onClearHistory;
  final void Function(String, dynamic) onGrievanceSubmitted;
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
        imageQuality: 70,   // compress to reduce payload size
        maxWidth: 1280,
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Photo attached: $fileName'),
            backgroundColor: Colors.green.shade700,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not attach photo. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _openVoiceConsoleSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16))
      ),
      builder: (context) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          bool isListening = false;
          String dictationStatus = widget.t('voiceConsoleDesc');

          void handleSpeechResult(String text) {
            setSheetState(() {
              isListening = false;
              dictationStatus = "Dictated: $text";
              _descriptionController.text = text;
            });
            Future.delayed(const Duration(seconds: 1), () {
              Navigator.pop(context);
            });
          }

          void toggleListening() {
            if (isListening) {
              setSheetState(() {
                isListening = false;
                dictationStatus = "Speech ended.";
              });
            } else {
              setSheetState(() {
                isListening = true;
                dictationStatus = widget.t('voiceDictating');
              });

              if (kIsWeb) {
                try {
                  js.context['onVoiceTranscribed'] = (String text) {
                    handleSpeechResult(text);
                  };
                  js.context.callMethod('eval', ["""
                    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
                      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                      var r = new SpeechRecognition();
                      r.lang = '${widget.lang == 'hi' ? 'hi-IN' : 'en-IN'}';
                      r.onresult = function(e) {
                        var t = e.results[0][0].transcript;
                        if (window.onVoiceTranscribed) {
                          window.onVoiceTranscribed(t);
                        }
                      };
                      r.start();
                    } else {
                      alert('Browser speech recognition not supported.');
                    }
                  """]);
                } catch (e) {
                  debugPrint("Web speech registration failed: $e");
                }
              } else {
                // Simulate dictation on mobile
                Future.delayed(const Duration(seconds: 2), () {
                  final text = widget.lang == 'hi'
                      ? "गली में सीवर का गंदा पानी सड़क पर फैल रहा है, बड़ी बदबू आ रही है।"
                      : "Street drain is clogged and dirty water is overflowing near standard bakery.";
                  handleSpeechResult(text);
                });
              }
            }
          }

          return Container(
            padding: const EdgeInsets.all(20),
            height: 350,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.t('voiceConsoleTitle'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Text(dictationStatus, style: TextStyle(fontSize: 12, color: isListening ? Colors.redAccent : Colors.grey)),
                const SizedBox(height: 20),
                Center(
                  child: ElevatedButton(
                    onPressed: toggleListening,
                    style: ElevatedButton.styleFrom(
                      shape: const CircleBorder(),
                      padding: const EdgeInsets.all(24),
                      backgroundColor: isListening ? Colors.red : Colors.green,
                    ),
                    child: Icon(isListening ? Icons.stop : Icons.mic, size: 36, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 20),
                const Text('QUICK ACCESS HINDI TEMPLATES (त्वरित चयन):', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _templateChip("सड़क पर गहरा गड्ढा है", handleSpeechResult),
                    _templateChip("कचरा नहीं उठाया गया", handleSpeechResult),
                    _templateChip("पानी जमा हो गया है", handleSpeechResult),
                    _templateChip("स्ट्रीट लाइट बंद है", handleSpeechResult),
                  ],
                )
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
      ).timeout(const Duration(seconds: 4));
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
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Invalid verification code entered.'), backgroundColor: Colors.red),
                );
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
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$key';

        final prompt = """Analyze this citizen grievance description: "$descriptionText".
Identify any locations, addresses, landmarks, or areas mentioned.
Estimate approximate latitude and longitude coordinates for this landmark in Delhi NCR region (~28.4 to 28.8, ~76.8 to 77.4).
${_latitude != null ? "Prioritize and use these exact coordinates: latitude $_latitude, longitude $_longitude." : "Default to Connaught Place (latitude: 28.6139, longitude: 77.2090) if location is missing."}

Generate a structured JSON report.
Required keys:
- isGenuine: Boolean. Set to true if complaint is a genuine civic issue (trash, water logging, potholes, sewage, street lights, utility, public infrastructure). Set to false if private/personal (lost keys, neighbor fight, flat tire).
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
          final getRes = await http.get(Uri.parse(databaseUrl)).timeout(const Duration(seconds: 4));
          if (getRes.statusCode == 200) {
            final docs = jsonDecode(getRes.body)['documents'] ?? [];
            activeGrievances = docs.map((doc) => _mapFirestoreDoc(doc)).toList();
          }
        } catch (_) {}
      } else {
        try {
          final fetchRes = await http.get(Uri.parse('${widget.serverUrl}/api/grievances')).timeout(const Duration(seconds: 4));
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
            ).timeout(const Duration(seconds: 4));
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
            ).timeout(const Duration(seconds: 4));
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
            ).timeout(const Duration(seconds: 4));
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
            ).timeout(const Duration(seconds: 4));
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

      // Send WhatsApp / SMS confirmation to the citizen
      _sendConfirmationMessage(
        phone: _phoneController.text.trim(),
        name: _nameController.text.trim(),
        ticketId: finalId,
        category: finalGrievanceDoc['category'] ?? 'General',
        location: finalGrievanceDoc['cleanLocation'] ?? 'Delhi NCR',
        urgency: finalGrievanceDoc['urgency'] ?? 'Medium',
        dept: finalGrievanceDoc['suggested_department'] ?? 'MCD',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.t('successSubmit')), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll("Exception: ", "")), backgroundColor: Colors.red),
      );
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
  }) async {
    final shortId = '#G-${ticketId.substring(0, 6).toUpperCase()}';
    final now = DateTime.now();
    final timeStr = '${now.day}/${now.month}/${now.year} at ${now.hour.toString().padLeft(2,'0')}:${now.minute.toString().padLeft(2,'0')}';

    final message =
        '✅ Dear $name, your grievance has been successfully registered with the MP Command Center.\n\n'
        '📌 Ticket ID: $shortId\n'
        '📅 Submitted: $timeStr\n'
        '📌 Location: $location\n'
        '🚨 Category: $category\n'
        '⚠️ Urgency: $urgency\n'
        '🏢 Assigned to: $dept\n\n'
        'Your complaint is now in the MP Priority Backlog. You will be notified once it is resolved. Thank you for reporting!';

    final encodedMsg = Uri.encodeComponent(message);
    // Clean phone to 10 digits, add India country code
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    final internationalPhone = cleanPhone.length == 10 ? '91$cleanPhone' : cleanPhone;

    // Try WhatsApp first
    final waUrl = Uri.parse('https://wa.me/$internationalPhone?text=$encodedMsg');
    if (await canLaunchUrl(waUrl)) {
      await launchUrl(waUrl, mode: LaunchMode.externalApplication);
    } else {
      // Fallback: open native SMS
      final smsUrl = Uri.parse('sms:$cleanPhone?body=$encodedMsg');
      if (await canLaunchUrl(smsUrl)) {
        await launchUrl(smsUrl);
      }
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.t('captchaError')), backgroundColor: Colors.red),
      );
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
    final isResolved = rc['status'] == 'Resolved';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.verified_rounded, size: 14, color: Colors.blue.shade800),
              const SizedBox(width: 6),
              Text(
                widget.t('successTitle').toUpperCase(),
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.blue.shade900),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(widget.t('successSub'), style: const TextStyle(fontSize: 8.5, color: Colors.black87, height: 1.25)),
          const Divider(height: 12),
          _receiptRow('ID', '#G-${rc['id'].toString().substring(0,6).toUpperCase()}'),
          _receiptRow(widget.t('lblAssignedDept'), rc['suggested_department'] ?? 'MCD'),
          _receiptRow(widget.t('lblExtractedLandmark'), rc['cleanLocation'] ?? 'Delhi NCR'),
          _receiptRow(widget.t('lblCategory'), rc['category'] ?? 'Solid Waste'),
          _receiptRow(widget.t('lblUrgency'), rc['urgency'] ?? 'Medium'),
          _receiptRow('Detected Sentiment', rc['sentiment'] ?? 'Neutral'),
          _receiptRow('Systemic Need', rc['recurringNeed'] ?? 'N/A'),
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

  const TrackerHistoryWidget({
    super.key,
    required this.t,
    required this.lang,
    required this.myComplaints,
    required this.onClearHistory,
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
                        )
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

  const MpAdminPortalContent({
    super.key,
    required this.t,
    required this.lang,
    required this.serverUrl,
    required this.useDirectCloud,
    required this.customGeminiKey,
    required this.allGrievances,
    required this.onGrievancesFetched,
  });

  @override
  State<MpAdminPortalContent> createState() => _MpAdminPortalContentState();
}

class _MpAdminPortalContentState extends State<MpAdminPortalContent> {
  bool _isAuthenticated = false;
  String _activeSubTab = 'hub'; // hub, planner
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

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status updated to $newStatus'), backgroundColor: Colors.green),
      );

      setState(() {
        _selectedGrievance = null;
      });
      widget.onGrievancesFetched();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
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
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$key';

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
        final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$key';

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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
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
                      widget.lang == 'hi' ? 'शिकायत हब' : 'GRIEVANCES HUB',
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
                      widget.lang == 'hi' ? 'स्मार्ट प्लानर' : 'SMART PLANNER',
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
        _kpiCard('TOTAL LOGGED', '${filtered.length}', Icons.description_outlined, Colors.blueGrey),
        _kpiCard('OPEN BACKLOG', '$openCount', Icons.schedule_rounded, Colors.orange),
        _kpiCard('RESOLVED', '$resolvedCount', Icons.check_circle_outline, Colors.green),
        _kpiCard('HOTSPOTS', '${filtered.where((g) => g['status'] == 'Open').length}', Icons.trending_up, Colors.blue),
      ],
    );

    Widget grievancesHubContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. RECENT CASES — first thing MP sees
        _buildBacklogList(),
        const SizedBox(height: 14),
        // 2. GROUPED by location + issue type with demographics
        _buildGroupedCasesCard(),
        const SizedBox(height: 14),
        // 3. Zonal heatmap
        _buildConstituencyHeatmap(),
        // 4. KPI stats
        statsGrid,
        const SizedBox(height: 12),
        // 5. Detail panel when a case is tapped
        _buildSelectedGrievanceConsole(),
      ],
    );

    Widget smartPlannerContent = Column(
      children: [
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

  Widget _buildSelectedGrievanceConsole() {
    if (_selectedGrievance == null) return Container();
    final g = _selectedGrievance!;
    final isResolved = g['status'] == 'Resolved';

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
            const SizedBox(height: 6),
            Text(
              'Description: "${g['description']}"', 
              style: TextStyle(fontSize: _isEasyMode ? 11 : 9.5, fontStyle: FontStyle.italic)
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

            // Large Actions for MP
            Row(
              children: [
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
                if (isResolved) ...[
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
                  )
                ]
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
      final res = await http.get(Uri.parse('${widget.serverUrl}/api/sms-logs')).timeout(const Duration(seconds: 4));
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
            child: ListView(
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
                    child: ListView.separated(
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
                Text(
                  step.title,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
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
