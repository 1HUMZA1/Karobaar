import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'local_server.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const KarobaarApp());
}

class KarobaarApp extends StatelessWidget {
  const KarobaarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Karobaar',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: Colors.white,
        colorScheme: const ColorScheme.light(
          primary: Colors.black,
          surface: Colors.white,
        ),
        useMaterial3: true,
      ),
      home: const KarobaarWebView(),
    );
  }
}

class KarobaarWebView extends StatefulWidget {
  const KarobaarWebView({super.key});

  @override
  State<KarobaarWebView> createState() => _KarobaarWebViewState();
}

class _KarobaarWebViewState extends State<KarobaarWebView> {
  late final WebViewController _controller;
  final LocalServer _localServer = LocalServer();
  bool _isServerReady = false;
  bool _isLoading = true;
  bool _hasInitialLoaded = false;
  static const String _cloudUrl = 'https://1HUMZA1.github.io/Karobaar/docs/#/dashboard';
  String _currentUrl = _cloudUrl;

  @override
  void initState() {
    super.initState();
    _startApp();

    // Safety timeout: Maximum 1.2 second splash display so dashboard shows immediately
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasInitialLoaded = true;
        });
      }
    });
  }

  Future<void> _startApp() async {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 KarobaarApp/1.1.0',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            if (mounted && !_hasInitialLoaded) {
              setState(() {
                _isLoading = true;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasInitialLoaded = true;
              });
            }
          },
          onWebResourceError: (WebResourceError error) async {
            debugPrint('[Karobaar WebResourceError] ${error.errorCode}: ${error.description}');
            // If cloud mirror cannot be reached, fallback to offline local server
            if (_currentUrl.startsWith('https://')) {
              try {
                final port = await _localServer.start();
                _currentUrl = 'http://127.0.0.1:$port/';
                await _controller.loadRequest(Uri.parse(_currentUrl));
              } catch (_) {}
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            return NavigationDecision.navigate;
          },
        ),
      );

    try {
      await _controller.loadRequest(Uri.parse(_currentUrl));
    } catch (e) {
      debugPrint('[Initial load error] $e');
    }

    if (mounted) {
      setState(() {
        _isServerReady = true;
      });
    }
  }

  @override
  void dispose() {
    _localServer.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) async {
        if (didPop) return;
        if (!_isServerReady) return;
        final canGoBack = await _controller.canGoBack();
        if (canGoBack) {
          await _controller.goBack();
        } else {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: !_isServerReady
              ? _buildSplashScreen()
              : Stack(
                  children: [
                    WebViewWidget(controller: _controller),
                    if (_isLoading && !_hasInitialLoaded) _buildSplashScreen(),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildSplashScreen() {
    return Container(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Official Karobaar "K" Logo Emblem (Black on White)
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.black, width: 3),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Center(
                child: Text(
                  'K',
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    height: 1.0,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Karobaar',
              style: TextStyle(
                color: Colors.black,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Turn Work Into Growth.',
              style: TextStyle(
                color: Color(0xFF71717A),
                fontSize: 12,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 32),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
