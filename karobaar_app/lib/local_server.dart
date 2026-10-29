import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter/services.dart' show rootBundle;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:url_launcher/url_launcher.dart';

class LocalServer {
  HttpServer? _server;
  int? port;
  static Map<String, dynamic>? pendingAuthSession;
  static Map<String, dynamic>? lastAuthSession;
  static DateTime? lastAuthTime;

  Future<int> start() async {
    final handler = const Pipeline().addHandler(_handleRequest);
    _server = await io.serve(handler, InternetAddress.loopbackIPv4, 0);
    port = _server!.port;
    return port!;
  }

  Future<Response> _handleRequest(Request request) async {
    final rawPath = request.url.path;
    final path = rawPath.startsWith('/') ? rawPath.substring(1) : rawPath;

    // Handle CORS Pre-flight for API calls
    if (request.method == 'OPTIONS' && path.startsWith('api/')) {
      return Response.ok('', headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Private-Network': 'true',
      });
    }

    // 1. API: Check auth status
    if (path == 'api/auth-status') {
      final isManual = request.url.queryParameters['manual'] == 'true';
      final session = isManual ? (lastAuthSession ?? pendingAuthSession) : pendingAuthSession;
      if (session != null) {
        if (!isManual) {
          pendingAuthSession = null; // consume pending for auto-poll
        }
        return Response.ok(
          jsonEncode({'authenticated': true, 'user': session}),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Private-Network': 'true',
            'Cache-Control': 'no-cache',
          },
        );
      }
      return Response.ok(
        jsonEncode({'authenticated': false}),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Private-Network': 'true',
          'Cache-Control': 'no-cache',
        },
      );
    }

    // 2. API: Callback when external browser finishes Google sign-in
    if (path == 'api/auth-callback') {
      try {
        if (request.method == 'POST') {
          final bodyStr = await request.readAsString();
          if (bodyStr.isNotEmpty) {
            pendingAuthSession = jsonDecode(bodyStr) as Map<String, dynamic>;
            lastAuthSession = pendingAuthSession;
            lastAuthTime = DateTime.now();
          }
        } else if (request.url.queryParameters.containsKey('data')) {
          final dataStr = Uri.decodeComponent(request.url.queryParameters['data']!);
          pendingAuthSession = jsonDecode(dataStr) as Map<String, dynamic>;
          lastAuthSession = pendingAuthSession;
          lastAuthTime = DateTime.now();
        }
        debugPrint('[LocalServer Auth Callback] Received auth for: ${pendingAuthSession?['email']}');
      } catch (e) {
        debugPrint('[LocalServer Auth Error] $e');
      }

      if (request.method == 'POST') {
        return Response.ok(
          jsonEncode({'success': true, 'email': pendingAuthSession?['email']}),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Private-Network': 'true',
          },
        );
      }
      return Response.ok(
        '''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Karobaar — Google Sign-In Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 20px;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 440px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .icon {
      width: 56px;
      height: 56px;
      background: #22c55e22;
      color: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 16px;
    }
    h2 { margin: 0 0 10px; font-size: 22px; font-weight: 700; }
    p { color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
    .btn {
      display: inline-block;
      background: #ffffff;
      color: #09090b;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Google Sign-In Successful</h2>
    <p>Your Google account has been verified. Karobaar is ready and updated.</p>
    <button class="btn" onclick="window.close()">Close & Return to Karobaar</button>
  </div>
  <script>
    setTimeout(function() {
      try { window.close(); } catch(e) {}
    }, 1800);
  </script>
</body>
</html>''',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      );
    }

    // 3. API: Launch system browser
    if (path == 'api/launch-browser') {
      final targetUrl = request.url.queryParameters['url'];
      if (targetUrl != null && targetUrl.isNotEmpty) {
        final uri = Uri.tryParse(targetUrl);
        if (uri != null) {
          try {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } catch (_) {
            if (Platform.isWindows) {
              Process.run('cmd', ['/c', 'start', '', targetUrl]);
            }
          }
        }
      }
      return Response.ok(
        jsonEncode({'success': true}),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      );
    }

    // 4. Static files serving
    String filePath = path.isEmpty || path == '/' ? 'index.html' : path;
    String assetKey = 'web/$filePath';
    String contentType = _getContentType(filePath);

    try {
      final bytes = await rootBundle.load(assetKey);
      return Response.ok(
        bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes),
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      );
    } catch (_) {
      // SPA Fallback: ONLY serve index.html for navigation routes (not static files with extensions)
      final hasExtension = filePath.split('/').last.contains('.');
      if (!hasExtension) {
        try {
          final indexBytes = await rootBundle.load('web/index.html');
          return Response.ok(
            indexBytes.buffer.asUint8List(indexBytes.offsetInBytes, indexBytes.lengthInBytes),
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          );
        } catch (_) {}
      }
      return Response.notFound('Not found: $filePath');
    }
  }

  String _getContentType(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
    if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
    if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.ico')) return 'image/x-icon';
    if (lower.endsWith('.json') || lower.endsWith('.webmanifest')) return 'application/json; charset=utf-8';
    if (lower.endsWith('.woff2')) return 'font/woff2';
    if (lower.endsWith('.woff')) return 'font/woff';
    if (lower.endsWith('.ttf')) return 'font/ttf';
    return 'application/octet-stream';
  }

  Future<void> stop() async {
    await _server?.close(force: true);
    _server = null;
  }
}
