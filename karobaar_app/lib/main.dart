import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart' as wf;
import 'package:webview_windows/webview_windows.dart' as ww;
import 'local_server.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (Platform.isAndroid || Platform.isIOS) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.white,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );
  }
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
  wf.WebViewController? _mobileController;
  ww.WebviewController? _windowsController;
  final bool _isWindows = Platform.isWindows;
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
    // 1. Start the local server serving the fresh, bundled Karobaar 2.0 assets
    try {
      final port = await _localServer.start();
      _currentUrl = 'http://localhost:$port/?platform=desktop#/dashboard';
      debugPrint('[Karobaar LocalServer] Started successfully on port $port');
    } catch (e) {
      debugPrint('[Karobaar LocalServer Error] $e - falling back to cloud mirror');
      _currentUrl = _cloudUrl;
    }

    // 2. Windows Desktop implementation using Microsoft Edge WebView2
    if (_isWindows) {
      _windowsController = ww.WebviewController();
      try {
        await _windowsController!.initialize();
        try {
          await _windowsController!.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          );
        } catch (_) {}
        _windowsController!.url.listen((url) {
          if (mounted) {
            setState(() {
              _isLoading = false;
              _hasInitialLoaded = true;
            });
          }
        });
        await _windowsController!.loadUrl(_currentUrl);
      } catch (e) {
        debugPrint('[Windows WebView error] $e');
        if (!_currentUrl.startsWith('https://')) {
          _currentUrl = _cloudUrl;
          try {
            await _windowsController!.loadUrl(_currentUrl);
          } catch (_) {}
        }
      }

      if (mounted) {
        setState(() {
          _isServerReady = true;
        });
      }
      return;
    }

    // 3. Android / iOS Mobile implementation using webview_flutter
    _mobileController = wf.WebViewController()
      ..setJavaScriptMode(wf.JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        wf.NavigationDelegate(
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
          onWebResourceError: (wf.WebResourceError error) async {
            debugPrint('[Karobaar WebResourceError] ${error.errorCode}: ${error.description}');
            if (!_currentUrl.startsWith('https://')) {
              _currentUrl = _cloudUrl;
              try {
                await _mobileController?.loadRequest(Uri.parse(_currentUrl));
              } catch (_) {}
            }
          },
          onNavigationRequest: (wf.NavigationRequest request) {
            return wf.NavigationDecision.navigate;
          },
        ),
      );

    try {
      await _mobileController!.loadRequest(Uri.parse(_currentUrl));
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
    _windowsController?.dispose();
    _localServer.stop();
    super.dispose();
  }

  Widget _buildWebView() {
    if (_isWindows && _windowsController != null && _windowsController!.value.isInitialized) {
      return ww.Webview(_windowsController!);
    } else if (_mobileController != null) {
      return wf.WebViewWidget(controller: _mobileController!);
    }
    return _buildSplashScreen();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) async {
        if (didPop) return;
        if (!_isServerReady) return;

        if (_isWindows && _windowsController != null) {
          SystemNavigator.pop();
          return;
        }

        if (_mobileController != null) {
          final canGoBack = await _mobileController!.canGoBack();
          if (canGoBack) {
            await _mobileController!.goBack();
          } else {
            SystemNavigator.pop();
          }
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: !_isServerReady
              ? _buildSplashScreen()
              : Stack(
                  children: [
                    _buildWebView(),
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
                    letterSpacing: -1.0,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'KAROBAAR',
              style: TextStyle(
                color: Colors.black,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Business Intelligence & Management',
              style: TextStyle(
                color: Color(0xFF71717A),
                fontSize: 11,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 24),
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
