import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'local_server.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.black,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
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
        scaffoldBackgroundColor: Colors.black,
        colorScheme: const ColorScheme.dark(
          primary: Colors.black,
          surface: Colors.black,
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
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _startApp();

    // Safety timeout: Never stay stuck on splash screen for more than 2.5s
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted && _isLoading) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  Future<void> _startApp() async {
    try {
      final port = await _localServer.start();
      _currentUrl = 'http://127.0.0.1:$port/';

      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.black)
        ..setUserAgent(
          'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 KarobaarApp/1.1.0',
        )
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (String url) {
              if (mounted) {
                setState(() {
                  _isLoading = true;
                });
              }
            },
            onPageFinished: (String url) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            onWebResourceError: (WebResourceError error) {
              debugPrint('[Karobaar WebResourceError] ${error.errorCode}: ${error.description}');
              if (error.isForMainFrame ?? false) {
                // Seamless fallback to online production mirror if local socket failed
                _controller.loadRequest(Uri.parse('https://1HUMZA1.github.io/Karobaar/'));
              }
            },
            onNavigationRequest: (NavigationRequest request) {
              return NavigationDecision.navigate;
            },
          ),
        );

      await _controller.loadRequest(Uri.parse(_currentUrl));

      if (mounted) {
        setState(() {
          _isServerReady = true;
        });
      }
    } catch (e) {
      debugPrint('[Karobaar Server Init Error] $e - Falling back to online mirror');
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.black)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageFinished: (_) {
              if (mounted) setState(() => _isLoading = false);
            },
          ),
        )
        ..loadRequest(Uri.parse('https://1HUMZA1.github.io/Karobaar/'));

      if (mounted) {
        setState(() {
          _isServerReady = true;
        });
      }
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
        backgroundColor: Colors.black,
        body: SafeArea(
          child: !_isServerReady
              ? _buildSplashScreen()
              : Stack(
                  children: [
                    WebViewWidget(controller: _controller),
                    if (_isLoading) _buildSplashScreen(),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildSplashScreen() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Official Karobaar 3-Ascending-Bars Logo
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  width: 8,
                  height: 18,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: 5),
                Container(
                  width: 8,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: 5),
                Container(
                  width: 8,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'Karobaar',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Turn Work Into Growth.',
              style: TextStyle(
                color: Colors.white70,
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
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
