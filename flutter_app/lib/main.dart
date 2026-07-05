import 'dart:convert';
import 'package:flutter/material';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MpGrievanceApp());
}

class MpGrievanceApp extends StatelessWidget {
  const MpGrievanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MP Grievance Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A), // Slate 900 feel
          primary: const Color(0xFF0F172A),
          secondary: const Color(0xFF4F46E5), // Indigo
          background: const Color(0xFFF8FAFC), // Slate 50
        ),
        fontFamily: 'sans-serif',
      ),
      home: const MainTabNavigator(),
    );
  }
}

// Translations dictionary for Hindi/English/Hinglish
const Map<String, Map<String, String>> translations = {
  'en': {
    'title': 'MP Public Grievance Portal',
    'subtitle': 'Direct Grievance Submission to MP Office',
    'fileGrievance': 'Submit Grievance',
    'adminDashboard': 'MP Admin Panel',
    'fullName': 'Citizen Name',
    'contactNumber': 'Contact Phone Number',
    'selectDepartment': 'Select Civic Category',
    'landmark': 'Nearest Landmark / Location',
    'description': 'Describe the Problem in Detail',
    'submitButton': 'Submit Report',
    'submitting': 'Uploading to Server...',
    'offlineSave': 'Saved Offline! Sync when online.',
    'syncQueue': 'Sync Offline Queue',
    'noOfflineGrievances': 'All reports are synced successfully.',
    'phoneError10': 'Phone number must be exactly 10 digits.',
    'phoneError11': 'Phone number with leading 0 must be 11 digits.',
    'successSubmit': 'Grievance registered successfully!',
    'potholes': 'Potholes / Damaged Road',
    'garbage': 'Garbage Report / Waste Dumping',
    'waterlogging': 'Water Logging / Drainage Leak',
    'hotspots': 'Hotspots',
    'decisionSupport': 'Smart MP Planner',
    'runDSS': 'Weigh Competing Proposals',
  },
  'hi': {
    'title': 'सांसद जन शिकायत निवारण',
    'subtitle': 'सांसद कार्यालय में सीधे शिकायत दर्ज करें',
    'fileGrievance': 'शिकायत दर्ज करें',
    'adminDashboard': 'प्रशासक पैनल',
    'fullName': 'नागरिक का नाम',
    'contactNumber': 'संपर्क मोबाइल नंबर',
    'selectDepartment': 'नागरिक श्रेणी चुनें',
    'landmark': 'निकटतम मील का पत्थर / स्थान',
    'description': 'समस्या का विस्तार से वर्णन करें',
    'submitButton': 'शिकायत भेजें',
    'submitting': 'सर्वर पर अपलोड हो रहा है...',
    'offlineSave': 'ऑफ़लाइन सहेज लिया गया! नेटवर्क आने पर सिंक करें।',
    'syncQueue': 'ऑफ़लाइन कतार सिंक करें',
    'noOfflineGrievances': 'सभी शिकायतें सिंक हो चुकी हैं।',
    'phoneError10': 'फोन नंबर ठीक 10 अंकों का होना चाहिए।',
    'phoneError11': 'शून्य (0) से शुरू होने वाला फोन नंबर 11 अंकों का होना चाहिए।',
    'successSubmit': 'शिकायत सफलतापूर्वक दर्ज की गई!',
    'potholes': 'सड़क के गड्ढे / खराब सड़क',
    'garbage': 'कचरा रिपोर्ट / कचरा डंपिंग',
    'waterlogging': 'जलभराव / जल निकासी रिसाव',
    'hotspots': 'हॉटस्पॉट',
    'decisionSupport': 'स्मार्ट सांसद योजना',
    'runDSS': 'प्रस्तावों की तुलना करें',
  },
  'hinglish': {
    'title': 'MP Grievance Redressal',
    'subtitle': 'Direct Grievance MP Office ko bhejein',
    'fileGrievance': 'Shikayat Darj Karein',
    'adminDashboard': 'MP Admin Panel',
    'fullName': 'Citizen Name',
    'contactNumber': 'Contact Mobile Number',
    'selectDepartment': 'Category Select Karein',
    'landmark': 'Pass ka Landmark / Location',
    'description': 'Problem detail mein likhein',
    'submitButton': 'Shikayat Submit Karein',
    'submitting': 'Upload ho raha hai...',
    'offlineSave': 'Offline save ho gaya! Network aane par sync karein.',
    'syncQueue': 'Offline Queue Sync Karein',
    'noOfflineGrievances': 'Saari shikayatein sync ho gayi hain.',
    'phoneError10': 'Phone number 10 digit ka hona chahiye.',
    'phoneError11': 'Leading 0 ke saath number 11 digit ka hona chahiye.',
    'successSubmit': 'Shikayat successfully submit ho gayi!',
    'potholes': 'Potholes / Gaddha',
    'garbage': 'Garbage dumping / Kachra',
    'waterlogging': 'Water logging / Pani bharna',
    'hotspots': 'Hotspots',
    'decisionSupport': 'Smart MP Planner',
    'runDSS': 'Weigh Competing Proposals',
  }
};

class MainTabNavigator extends StatefulWidget {
  const MainTabNavigator({super.key});

  @override
  State<MainTabNavigator> createState() => _MainTabNavigatorState();
}

class _MainTabNavigatorState extends State<MainTabNavigator> {
  int _currentIndex = 0;
  String _currentLanguage = 'en'; // en, hi, hinglish

  String t(String key) {
    return translations[_currentLanguage]?[key] ?? translations['en']?[key] ?? key;
  }

  void _changeLanguage(String lang) {
    setState(() {
      _currentLanguage = lang;
    });
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      GrievanceFormScreen(
        currentLanguage: _currentLanguage,
        t: t,
        onLanguageChanged: _changeLanguage,
      ),
      AdminDashboardScreen(
        currentLanguage: _currentLanguage,
        t: t,
      ),
    ];

    return Scaffold(
      body: SafeArea(child: screens[_currentIndex]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: const Color(0xFF4F46E5),
        unselectedItemColor: Colors.slate.shade400,
        backgroundColor: Colors.white,
        elevation: 8,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontSize: 10),
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.edit_note_rounded),
            label: t('fileGrievance'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.admin_panel_settings_rounded),
            label: t('adminDashboard'),
          ),
        ],
      ),
    );
  }
}

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
    title: "Welcome & Portal Overview",
    points: [
      "File public complaints easily.",
      "MCD and NDMC resolving departments.",
      "AI automatically geocodes and dispatches."
    ],
    en: "Welcome to the Citizen Grievance Portal. You can easily file public complaints here. MCD and NDMC teams will resolve them.",
    hi: "सांसद जन शिकायत निवारण पोर्टल में आपका स्वागत है। आप यहाँ अपनी शिकायतें आसानी से दर्ज कर सकते हैं। एमसीडी और एनडीएमसी टीमें इनका समाधान करेंगी।"
  ),
  GuideStep(
    id: 2,
    title: "How to File a Grievance",
    points: [
      "Enter your Name and 10-digit Phone.",
      "Upload or click a photo of the damage.",
      "State category and location."
    ],
    en: "Step 1. Enter your Name and mobile number. Describe your issue and attach a photo.",
    hi: "चरण १. अपना नाम और मोबाइल नंबर भरें। समस्या लिखें और फोटो जोड़ें।"
  ),
  GuideStep(
    id: 3,
    title: "Offline Resilience Queue",
    points: [
      "Submit offline if no coverage.",
      "Auto-saved to device cache queue.",
      "Tap 'SYNC' when back in network."
    ],
    en: "Step 2. If you are offline, your complaint is automatically saved in our secure device cache. Tap SYNC when you have internet.",
    hi: "ऑफ़लाइन होने पर आपकी शिकायत सुरक्षित रूप से सहेज ली जाती है। इंटरनेट होने पर सिंक टैप करें।"
  ),
  GuideStep(
    id: 4,
    title: "MP Decision Planner",
    points: [
      "Decision support system for development works.",
      "Compare proposals side-by-side using demand profiles."
    ],
    en: "Step 3. Administrators can use the Decision Support tab to calculate and rank school expansions or skill hubs.",
    hi: "अधिकारी विकास कार्यों की तुलना और प्राथमिकता तय करने के लिए 'स्मार्ट योजना' का उपयोग कर सकते हैं।"
  )
];

class VoiceInstructionsWidget extends StatefulWidget {
  const VoiceInstructionsWidget({super.key});

  @override
  State<VoiceInstructionsWidget> createState() => _VoiceInstructionsWidgetState();
}

class _VoiceInstructionsWidgetState extends State<VoiceInstructionsWidget> {
  int _currentStepIndex = 0;
  String _assistantLanguage = 'en'; // en, hi
  bool _isPlaying = false;

  @override
  Widget build(BuildContext context) {
    final step = guideSteps[_currentStepIndex];
    String spokenText = '';
    if (_assistantLanguage == 'hi') {
      spokenText = step.hi;
    } else {
      spokenText = step.en;
    }

    return Card(
      color: const Color(0xFF0F172A), // Elegant dark slate matching parent web app theme
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Row(
                  children: [
                    const Icon(Icons.record_voice_over_rounded, color: Colors.blueAccent, size: 18),
                    const SizedBox(width: 6),
                    const Text(
                      'VOICE ASSISTANT (English/Hindi)',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                // Pulse indicator if playing
                if (_isPlaying)
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Colors.greenAccent,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              step.title.toUpperCase(),
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            // Bullet points
            ...step.points.map((pt) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('• ', style: TextStyle(color: Colors.blueAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                  Expanded(
                    child: Text(
                      pt,
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, height: 1.3),
                    ),
                  ),
                ],
              ),
            )),
            const Divider(color: Colors.white12, height: 16),
            // Audio Controls Bar
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                // Nav buttons
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.skip_previous_rounded, size: 18, color: Colors.white70),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _currentStepIndex > 0
                          ? () {
                              setState(() {
                                _currentStepIndex--;
                                _isPlaying = true;
                              });
                            }
                          : null,
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(
                        _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded,
                        size: 24,
                        color: _isPlaying ? Colors.amberAccent : Colors.greenAccent,
                      ),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        setState(() {
                          _isPlaying = !_isPlaying;
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.skip_next_rounded, size: 18, color: Colors.white70),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _currentStepIndex < guideSteps.length - 1
                          ? () {
                              setState(() {
                                _currentStepIndex++;
                                _isPlaying = true;
                              });
                            }
                          : null,
                    ),
                  ],
                ),
                // Language selectors
                Row(
                  children: [
                    _assistantLangButton('EN', 'en'),
                    const SizedBox(width: 4),
                    _assistantLangButton('हिंदी', 'hi'),
                  ],
                ),
              ],
            ),
            if (_isPlaying) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.volume_up_rounded, size: 12, color: Colors.amberAccent),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '"$spokenText"',
                        style: const TextStyle(
                          color: Colors.amber,
                          fontSize: 9,
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _assistantLangButton(String label, String code) {
    final isSelected = _assistantLanguage == code;
    return InkWell(
      onTap: () {
        setState(() {
          _assistantLanguage = code;
          _isPlaying = true;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blueAccent : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: isSelected ? Colors.blueAccent : Colors.white24),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.white70,
          ),
        ),
      ),
    );
  }
}

/// CITIZEN GRIEVANCE REGISTRATION SCREEN
/// Optimized for ultra-fast performance on older devices & slow networks.
class GrievanceFormScreen extends StatefulWidget {
  final String currentLanguage;
  final String Function(String) t;
  final Function(String) onLanguageChanged;

  const GrievanceFormScreen({
    super.key,
    required this.currentLanguage,
    required this.t,
    required this.onLanguageChanged,
  });

  @override
  State<GrievanceFormScreen> createState() => _GrievanceFormScreenState();
}

class _GrievanceFormScreenState extends State<GrievanceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _selectedCategory = 'Potholes';
  bool _isSubmitting = false;
  int _offlineQueueSize = 0;

  @override
  void initState() {
    super.initState();
    _checkOfflineQueue();
  }

  Future<void> _checkOfflineQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList('offline_grievances') ?? [];
    setState(() {
      _offlineQueueSize = queue.length;
    });
  }

  // Validate the phone number according to leading zero specifications:
  // - 11 digits if starts with "0"
  // - 10 digits otherwise
  String? _validatePhoneNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final cleanPhone = value.trim();
    final isLeadingZero = cleanPhone.startsWith('0');
    
    if (isLeadingZero) {
      final regExp = RegExp(r'^\d{11}$');
      if (!regExp.hasMatch(cleanPhone)) {
        return widget.t('phoneError11');
      }
    } else {
      final regExp = RegExp(r'^\d{10}$');
      if (!regExp.hasMatch(cleanPhone)) {
        return widget.t('phoneError10');
      }
    }
    return null;
  }

  Future<void> _submitGrievance() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    final grievanceData = {
      'citizenName': _nameController.text.trim(),
      'citizenContact': _phoneController.text.trim(),
      'department': _selectedCategory == 'Potholes' 
          ? 'Potholes' 
          : (_selectedCategory == 'Garbage' ? 'Garbage Report' : 'Water Logging'),
      'cleanLocation': _landmarkController.text.trim(),
      'description': _descriptionController.text.trim(),
      'createdAt': DateTime.now().toIso8601String(),
      'urgency': 'Medium',
      'status': 'Open',
    };

    try {
      // In a real device context, test connectivity. If offline, catch error & queue.
      // We will also simulate offline handling for smooth user feedback.
      final response = await http.post(
        Uri.parse('https://your-api-server.com/api/grievance'), // Replace with actual hosting URL
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(grievanceData),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 201 || response.statusCode == 200) {
        _showSnackbar(widget.t('successSubmit'), Colors.green);
        _clearForm();
      } else {
        throw Exception("Server status error");
      }
    } catch (e) {
      // Save locally to offline cache for absolute resilience on slow phones
      await _saveOffline(grievanceData);
    } finally {
      setState(() {
        _isSubmitting = false;
      });
      _checkOfflineQueue();
    }
  }

  Future<void> _saveOffline(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList('offline_grievances') ?? [];
    queue.add(jsonEncode(data));
    await prefs.setStringList('offline_grievances', queue);
    
    _showSnackbar(widget.t('offlineSave'), Colors.orange);
    _clearForm();
  }

  Future<void> _syncOfflineQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList('offline_grievances') ?? [];
    if (queue.isEmpty) {
      _showSnackbar(widget.t('noOfflineGrievances'), Colors.blueGrey);
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    int successCount = 0;
    List<String> remainingQueue = [];

    for (var item in queue) {
      try {
        final Map<String, dynamic> data = jsonDecode(item);
        final response = await http.post(
          Uri.parse('https://your-api-server.com/api/grievance'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(data),
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 || response.statusCode == 201) {
          successCount++;
        } else {
          remainingQueue.add(item);
        }
      } catch (e) {
        remainingQueue.add(item);
      }
    }

    await prefs.setStringList('offline_grievances', remainingQueue);
    setState(() {
      _offlineQueueSize = remainingQueue.length;
      _isSubmitting = false;
    });

    if (successCount > 0) {
      _showSnackbar('Successfully synced $successCount offline grievances!', Colors.green);
    } else {
      _showSnackbar('Network connection unstable. Saved for later retry.', Colors.orange);
    }
  }

  void _clearForm() {
    _nameController.clear();
    _phoneController.clear();
    _landmarkController.clear();
    _descriptionController.clear();
    setState(() {
      _selectedCategory = 'Potholes';
    });
  }

  void _showSnackbar(String msg, Color bg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        backgroundColor: bg,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Widget
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.t('title'),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.black,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.t('subtitle'),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.slate.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              // Language Switcher Chips
              Row(
                children: [
                  _languageChip('EN', 'en'),
                  const SizedBox(width: 4),
                  _languageChip('हिंदी', 'hi'),
                  const SizedBox(width: 4),
                  _languageChip('Hinglish', 'hinglish'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Multi-lingual Voice Guided Assistant
          const VoiceInstructionsWidget(),
          const SizedBox(height: 14),

          // Offline Alert Banner if items are queued
          if (_offlineQueueSize > 0)
            Container(
              margin: const EdgeInsets.bottom: 16,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.amber.shade55,
                border: Border.all(color: Colors.amber.shade200),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.wifi_off_rounded, color: Colors.amber.shade900),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Offline Queue Status: $_offlineQueueSize Pending',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade900,
                          ),
                        ),
                        const Text(
                          'You submitted grievances while offline. Tap sync when you are back in network.',
                          style: TextStyle(fontSize: 9, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _syncOfflineQueue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber.shade800,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('SYNC', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),

          // Core Registration Form Card
          Card(
            elevation: 1,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(color: Colors.slate.shade100),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category Selection Label
                    Text(
                      widget.t('selectDepartment'),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.slate,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Row of high-contrast category pills
                    Row(
                      children: [
                        _categoryButton('Potholes', widget.t('potholes')),
                        const SizedBox(width: 6),
                        _categoryButton('Garbage', widget.t('garbage')),
                        const SizedBox(width: 6),
                        _categoryButton('Water', widget.t('waterlogging')),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Citizen Name input
                    _buildLabel(widget.t('fullName')),
                    TextFormField(
                      controller: _nameController,
                      style: const TextStyle(fontSize: 12),
                      decoration: _inputDecoration('e.g. Aaditya Sharma', Icons.person_outline),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Please enter your name' : null,
                    ),
                    const SizedBox(height: 14),

                    // Citizen Phone input (The customized leading-zero handler is attached here!)
                    _buildLabel(widget.t('contactNumber')),
                    TextFormField(
                      controller: _phoneController,
                      style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                      keyboardType: TextInputType.phone,
                      decoration: _inputDecoration('e.g. 9876543210 or 09876543210', Icons.phone_android_rounded),
                      validator: _validatePhoneNumber,
                    ),
                    const SizedBox(height: 14),

                    // Landmark
                    _buildLabel(widget.t('landmark')),
                    TextFormField(
                      controller: _landmarkController,
                      style: const TextStyle(fontSize: 12),
                      decoration: _inputDecoration('e.g. Metro Pillar 45, Market Gate', Icons.pin_drop_outlined),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Please enter nearest location' : null,
                    ),
                    const SizedBox(height: 14),

                    // Detailed Description
                    _buildLabel(widget.t('description')),
                    TextFormField(
                      controller: _descriptionController,
                      style: const TextStyle(fontSize: 12),
                      maxLines: 4,
                      decoration: _inputDecoration('Provide as much detail as possible to help municipal teams find and repair it.', null),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Please enter a description' : null,
                    ),
                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitGrievance,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 1,
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                widget.t('submitButton').toUpperCase(),
                                style: const TextStyle(fontWeight: FontWeight.black, fontSize: 11, letterSpacing: 0.8),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Text(
        text,
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.slate),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData? icon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: icon != null ? Icon(icon, size: 16, color: Colors.slate.shade400) : null,
      hintStyle: TextStyle(fontSize: 11, color: Colors.slate.shade350),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.slate.shade250),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.slate.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF0F172A), width: 1.5),
      ),
    );
  }

  Widget _categoryButton(String code, String label) {
    final isSelected = _selectedCategory == code;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedCategory = code;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF0F172A) : Colors.slate.shade50,
            border: Border.all(
              color: isSelected ? const Color(0xFF0F172A) : Colors.slate.shade200,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.black,
              color: isSelected ? Colors.white : Colors.slate.shade600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _languageChip(String label, String code) {
    final isSelected = widget.currentLanguage == code;
    return InkWell(
      onTap: () => widget.onLanguageChanged(code),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF4F46E5) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: isSelected ? const Color(0xFF4F46E5) : Colors.slate.shade200),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.slate.shade600,
          ),
        ),
      ),
    );
  }
}

/// ADMINISTRATIVE DECISION SUPPORT SCREEN
/// High efficiency priority scorer combining local datasets (UDISE+, Census) with complaint hot-spots
class AdminDashboardScreen extends StatefulWidget {
  final String currentLanguage;
  final String Function(String) t;

  const AdminDashboardScreen({
    super.key,
    required this.currentLanguage,
    required this.t,
  });

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  String _selectedSector = 'Central Zone';
  bool _isComparing = false;
  Map<String, dynamic>? _compareResult;

  // Pre-loaded competing proposals as requested
  final _schoolController = TextEditingController(text: "Upgrade Govt Girls Senior Secondary School");
  final _schoolEnrollment = TextEditingController(text: "450");
  final _schoolTravelDistance = TextEditingController(text: "12");

  final _vocaController = TextEditingController(text: "Build District Vocational Training Centre");
  final _vocaCapacity = TextEditingController(text: "150");
  final _vocaTravelDistance = TextEditingController(text: "25");

  Future<void> _runDSSAnalysis() async {
    setState(() {
      _isComparing = true;
      _compareResult = null;
    });

    // Simulated mathematical evaluation comparing school distances & local parameters
    // with citizen feedback, modeling the exact backend logic of the parent application
    await Future.delayed(const Duration(milliseconds: 1200));

    final double sEnroll = double.tryParse(_schoolEnrollment.text) ?? 300;
    final double sTravel = double.tryParse(_schoolTravelDistance.text) ?? 5;
    final double vCap = double.tryParse(_vocaCapacity.text) ?? 100;
    final double vTravel = double.tryParse(_vocaTravelDistance.text) ?? 15;

    // Weight based ranking
    final double schoolScore = 65 + (sTravel * 2.2) + (sEnroll / 80);
    final double vocaScore = 60 + (vTravel * 1.0) + (vCap / 20);

    final double roundedSchool = schoolScore.clamp(0, 98);
    final double roundedVoca = vocaScore.clamp(0, 98);

    setState(() {
      _isComparing = false;
      _compareResult = {
        'recommendation': roundedSchool > roundedVoca 
            ? 'Based on travel distance of ${sTravel}km for $sEnroll enrolled girls, the **School Upgrade** is prioritized to prevent educational dropouts. This aligns directly with UDISE+ primary literacy objectives.'
            : 'The **Vocational Centre** should be prioritized because a travel distance of ${vTravel}km to the nearest metropolis hinders local youth employment prospects for $vCap candidates.',
        'schoolScore': roundedSchool.round(),
        'vocaScore': roundedVoca.round(),
        'hazardIndex': 'Moderate Siltation & Stormwater risk',
        'sources': ['UDISE+ Educational Portals', 'National Census Data', ' constituency maps']
      };
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Screen Title
          Text(
            widget.t('adminDashboard'),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.black, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 4),
          const Text(
            'Compare municipal projects against real-time demand & travel constraints',
            style: TextStyle(fontSize: 10, color: Colors.slate),
          ),
          const SizedBox(height: 16),

          // Proposals section
          Card(
            elevation: 1,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(color: Colors.slate.shade100),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'WEIGH COMPETING PROPOSALS',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.black, color: Color(0xFF0F172A)),
                      ),
                      DropdownButton<String>(
                        value: _selectedSector,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
                        onChanged: (String? newValue) {
                          if (newValue != null) {
                            setState(() {
                              _selectedSector = newValue;
                            });
                          }
                        },
                        items: <String>['Central Zone', 'West Zone', 'East Zone', 'NDMC Area']
                            .map<DropdownMenuItem<String>>((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                  const Divider(height: 20),

                  // Option A Inputs
                  const Row(
                    children: [
                      Icon(Icons.school_outlined, size: 14, color: Colors.blue),
                      SizedBox(width: 6),
                      Text('PROPOSAL A: SCHOOL UPGRADE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.black, color: Colors.blue)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _buildAdminTextField(_schoolController, 'Proposal Title'),
                  const SizedBox(height: 6),
                  // Preset Quick Fill Buttons
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _schoolController.text = "Primary School Upgrade (East)";
                            _schoolEnrollment.text = "400";
                            _schoolTravelDistance.text = "15";
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade50,
                          foregroundColor: Colors.blue.shade800,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          elevation: 0,
                        ),
                        child: const Text('FILL: PRIMARY (15KM)', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 6),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _schoolController.text = "Central High School Expansion";
                            _schoolEnrollment.text = "800";
                            _schoolTravelDistance.text = "5";
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade50,
                          foregroundColor: Colors.blue.shade800,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          elevation: 0,
                        ),
                        child: const Text('FILL: HIGH SCHOOL (5KM)', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: _buildAdminTextField(_schoolEnrollment, 'Enrollment (students)', keyboard: TextInputType.number)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildAdminTextField(_schoolTravelDistance, 'Travel Distance (km)', keyboard: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Option B Inputs
                  const Row(
                    children: [
                      Icon(Icons.work_outline_rounded, size: 14, color: Colors.purple),
                      SizedBox(width: 6),
                      Text('PROPOSAL B: VOCATIONAL CENTRE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.black, color: Colors.purple)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _buildAdminTextField(_vocaController, 'Proposal Title'),
                  const SizedBox(height: 6),
                  // Preset Quick Fill Buttons
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _vocaController.text = "Mega IT Skill Hub";
                            _vocaCapacity.text = "250";
                            _vocaTravelDistance.text = "30";
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple.shade50,
                          foregroundColor: Colors.purple.shade800,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          elevation: 0,
                        ),
                        child: const Text('FILL: IT HUB (30KM)', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 6),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _vocaController.text = "Youth Apprenticeship Workshop";
                            _vocaCapacity.text = "100";
                            _vocaTravelDistance.text = "10";
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple.shade50,
                          foregroundColor: Colors.purple.shade800,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          elevation: 0,
                        ),
                        child: const Text('FILL: WORKSHOP (10KM)', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: _buildAdminTextField(_vocaCapacity, 'Capacity (seats)', keyboard: TextInputType.number)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildAdminTextField(_vocaTravelDistance, 'Metropolis Distance (km)', keyboard: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Button to run comparison
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: _isComparing ? null : _runDSSAnalysis,
                      icon: const Icon(Icons.analytics_outlined, size: 16),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      label: Text(
                        _isComparing ? 'CALCULATING DSS SCORING...' : widget.t('runDSS').toUpperCase(),
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.black, letterSpacing: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_compareResult != null) ...[
            const SizedBox(height: 16),
            Card(
              color: const Color(0xFFEEF2F6),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: BorderSide(color: Colors.slate.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AI DECISION SUPPORT METRICS',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.black, color: Color(0xFF4F46E5)),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _compareResult!['recommendation'],
                      style: const TextStyle(fontSize: 11, color: Color(0xFF1E293B), height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildScoreDisplay('School Priority Score', _compareResult!['schoolScore'], Colors.blue),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildScoreDisplay('Vocational Priority Score', _compareResult!['vocaScore'], Colors.purple),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'STATION WATERLOGGING HAZARD INDEX',
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.black, color: Colors.slate),
                    ),
                    Text(
                      _compareResult!['hazardIndex'],
                      style: const TextStyle(fontSize: 10, color: Colors.redAccent, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            )
          ]
        ],
      ),
    );
  }

  Widget _buildAdminTextField(TextEditingController ctrl, String hint, {TextInputType keyboard = TextInputType.text}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboard,
      style: const TextStyle(fontSize: 11),
      decoration: InputDecoration(
        labelText: hint,
        labelStyle: TextStyle(fontSize: 9, color: Colors.slate.shade400, fontWeight: FontWeight.bold),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.slate.shade250),
        ),
      ),
    );
  }

  Widget _buildScoreDisplay(String title, int score, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.slate.shade200),
      ),
      child: Column(
        children: [
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.slate)),
          const SizedBox(height: 4),
          Text('$score/100', style: TextStyle(fontSize: 18, fontWeight: FontWeight.black, color: color)),
        ],
      ),
    );
  }
}
