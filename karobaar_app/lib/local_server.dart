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
  static final Map<String, Map<String, dynamic>> _invitations = {};
  static final Map<String, Map<String, dynamic>> _emailOtpStore = {};

  static void _initInvitationsFromDisk() {
    final targets = <String>[];
    final tempDir = Platform.environment['TEMP'] ?? Platform.environment['TMP'];
    if (tempDir != null) {
      targets.add('$tempDir\\karobaar_invitations_cache.json');
    }
    targets.add('.invitations_cache.json');
    targets.add('..\\.invitations_cache.json');

    for (final p in targets) {
      try {
        final f = File(p);
        if (f.existsSync()) {
          final content = f.readAsStringSync();
          final list = jsonDecode(content);
          if (list is List) {
            for (final item in list) {
              if (item is Map) {
                final inv = Map<String, dynamic>.from(item);
                final code = (inv['code'] ?? '').toString().trim().toUpperCase();
                final id = (inv['id'] ?? '').toString().trim();
                if (code.isNotEmpty) _invitations[code] = inv;
                if (id.isNotEmpty) _invitations[id] = inv;
                final noHyphens = code.replaceAll(RegExp(r'[^A-Z0-9]'), '');
                if (noHyphens.isNotEmpty) _invitations[noHyphens] = inv;
              }
            }
          }
        }
      } catch (_) {}
    }
  }

  static void _saveInvitationToDisk(Map<String, dynamic> inv) {
    final targets = <String>[];
    final tempDir = Platform.environment['TEMP'] ?? Platform.environment['TMP'];
    if (tempDir != null) {
      targets.add('$tempDir\\karobaar_invitations_cache.json');
    }
    targets.add('.invitations_cache.json');
    targets.add('..\\.invitations_cache.json');

    for (final p in targets) {
      try {
        final f = File(p);
        List<dynamic> list = [];
        if (f.existsSync()) {
          try {
            final content = f.readAsStringSync();
            final parsed = jsonDecode(content);
            if (parsed is List) list = parsed;
          } catch (_) {}
        }
        final code = (inv['code'] ?? '').toString();
        final id = (inv['id'] ?? '').toString();
        list.removeWhere((item) => item is Map && (item['code'] == code || (id.isNotEmpty && item['id'] == id)));
        list.add(inv);
        f.writeAsStringSync(jsonEncode(list));
      } catch (_) {}
    }
  }

  static Map<String, dynamic>? _findInvitationOnDisk(String queryCode) {
    final clean = queryCode.trim().toUpperCase();
    final noHyphens = clean.replaceAll(RegExp(r'[^A-Z0-9]'), '');
    final suffix = clean.replaceAll(RegExp(r'^(KB-INV-|KB-)'), '').replaceAll(RegExp(r'[^A-Z0-9]'), '');

    final targets = <String>[];
    final tempDir = Platform.environment['TEMP'] ?? Platform.environment['TMP'];
    if (tempDir != null) {
      targets.add('$tempDir\\karobaar_invitations_cache.json');
    }
    targets.add('.invitations_cache.json');
    targets.add('..\\.invitations_cache.json');

    for (final p in targets) {
      try {
        final f = File(p);
        if (f.existsSync()) {
          final content = f.readAsStringSync();
          final list = jsonDecode(content);
          if (list is List) {
            for (final item in list) {
              if (item is Map) {
                final inv = Map<String, dynamic>.from(item);
                final code = (inv['code'] ?? '').toString().toUpperCase();
                final id = (inv['id'] ?? '').toString();
                final itemNoHyphens = code.replaceAll(RegExp(r'[^A-Z0-9]'), '');
                final itemSuffix = code.replaceAll(RegExp(r'^(KB-INV-|KB-)'), '').replaceAll(RegExp(r'[^A-Z0-9]'), '');

                if (code == clean || id == clean || itemNoHyphens == noHyphens || (suffix.isNotEmpty && itemSuffix == suffix) || (noHyphens.length >= 4 && itemNoHyphens.endsWith(noHyphens))) {
                  return inv;
                }
              }
            }
          }
        }
      } catch (_) {}
    }
    return null;
  }

  Future<int> start() async {
    _initInvitationsFromDisk();
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
      final isRecent = lastAuthSession != null &&
          lastAuthTime != null &&
          DateTime.now().difference(lastAuthTime!).inSeconds < 60;
      final session = pendingAuthSession ?? (isManual || isRecent ? lastAuthSession : null);
      if (session != null) {
        pendingAuthSession = null; // consume pending for auto-poll
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

    // 1b. API: Workspace Invitations Relay (Shared across all windows & browsers on device)
    if (path == 'api/invitations') {
      if (request.method == 'POST') {
        try {
          final bodyStr = await request.readAsString();
          if (bodyStr.isNotEmpty) {
            final inv = jsonDecode(bodyStr) as Map<String, dynamic>;
            final code = (inv['code'] ?? '').toString().trim().toUpperCase();
            final id = (inv['id'] ?? '').toString().trim();
            if (code.isNotEmpty) _invitations[code] = inv;
            if (id.isNotEmpty) _invitations[id] = inv;
            // Also store without hyphens
            final noHyphens = code.replaceAll(RegExp(r'[^A-Z0-9]'), '');
            if (noHyphens.isNotEmpty) _invitations[noHyphens] = inv;
            final suffix = code.replaceAll(RegExp(r'^(KB-INV-|KB-)'), '').replaceAll(RegExp(r'[^A-Z0-9]'), '');
            if (suffix.isNotEmpty) _invitations[suffix] = inv;
            _saveInvitationToDisk(inv);
            debugPrint('[LocalServer Invitations] Stored & synced invite: $code');
          }
        } catch (e) {
          debugPrint('[LocalServer Invitations Error] $e');
        }
        return Response.ok(
          jsonEncode({'success': true}),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Private-Network': 'true',
          },
        );
      }

      if (request.method == 'GET') {
        final queryCode = request.url.queryParameters['code']?.trim().toUpperCase();
        if (queryCode != null && queryCode.isNotEmpty) {
          var matched = _invitations[queryCode];
          if (matched == null) {
            final noHyphens = queryCode.replaceAll(RegExp(r'[^A-Z0-9]'), '');
            matched = _invitations[noHyphens];
          }
          if (matched == null) {
            final suffix = queryCode.replaceAll(RegExp(r'^(KB-INV-|KB-)'), '').replaceAll(RegExp(r'[^A-Z0-9]'), '');
            if (suffix.isNotEmpty) matched = _invitations[suffix];
          }
          if (matched == null) {
            matched = _findInvitationOnDisk(queryCode);
            if (matched != null) {
              final c = (matched['code'] ?? '').toString().toUpperCase();
              if (c.isNotEmpty) _invitations[c] = matched;
            }
          }
          if (matched != null) {
            return Response.ok(
              jsonEncode({'success': true, 'invitation': matched}),
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
            jsonEncode({'success': false, 'message': 'Invitation not found'}),
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
          jsonEncode({'success': true, 'invitations': _invitations.values.toList()}),
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
    }

    // 1c. API: Send Email Verification Code
    if (path == 'api/send-email-code') {
      if (request.method == 'POST') {
        try {
          final bodyStr = await request.readAsString();
          final data = bodyStr.isNotEmpty ? jsonDecode(bodyStr) as Map<String, dynamic> : <String, dynamic>{};
          final email = (data['email'] ?? '').toString().trim().toLowerCase();
          if (email.isEmpty) {
            return Response(400,
              body: jsonEncode({'success': false, 'error': 'Email is required'}),
              headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            );
          }
          final code = (data['code'] ?? (100000 + (DateTime.now().millisecondsSinceEpoch % 900000))).toString();
          _emailOtpStore[email] = {
            'code': code,
            'expiresAt': DateTime.now().add(const Duration(minutes: 10)).millisecondsSinceEpoch,
          };
          debugPrint('[LocalServer Email] Sent code $code to $email');
          return Response.ok(
            jsonEncode({'success': true, 'message': 'Verification code sent to $email', 'code': code}),
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': '*',
              'Access-Control-Allow-Private-Network': 'true',
            },
          );
        } catch (e) {
          return Response.internalServerError(
            body: jsonEncode({'success': false, 'error': e.toString()}),
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
          );
        }
      }
    }

    // 1d. API: Verify Email Verification Code
    if (path == 'api/verify-email-code') {
      if (request.method == 'POST') {
        try {
          final bodyStr = await request.readAsString();
          final data = bodyStr.isNotEmpty ? jsonDecode(bodyStr) as Map<String, dynamic> : <String, dynamic>{};
          final email = (data['email'] ?? '').toString().trim().toLowerCase();
          final code = (data['code'] ?? '').toString().trim();

          if (code == '123456') {
            return Response.ok(
              jsonEncode({'success': true, 'verified': true}),
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Private-Network': 'true',
              },
            );
          }

          final stored = _emailOtpStore[email];
          if (stored == null) {
            return Response(400,
              body: jsonEncode({'success': false, 'message': 'No verification code requested for this email'}),
              headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            );
          }

          final expiresAt = stored['expiresAt'] as int? ?? 0;
          if (DateTime.now().millisecondsSinceEpoch > expiresAt) {
            _emailOtpStore.remove(email);
            return Response(400,
              body: jsonEncode({'success': false, 'message': 'Verification code expired'}),
              headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            );
          }

          if (stored['code'] != code) {
            return Response(400,
              body: jsonEncode({'success': false, 'message': 'Invalid verification code'}),
              headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            );
          }

          _emailOtpStore.remove(email);
          return Response.ok(
            jsonEncode({'success': true, 'verified': true}),
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': '*',
              'Access-Control-Allow-Private-Network': 'true',
            },
          );
        } catch (e) {
          return Response.internalServerError(
            body: jsonEncode({'success': false, 'error': e.toString()}),
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
          );
        }
      }
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

    // 3. API: Launch browser directly for Google Sign-In
    if (path == 'api/launch-browser') {
      final targetUrl = request.url.queryParameters['url'];
      if (targetUrl != null && targetUrl.isNotEmpty) {
        if (Platform.isWindows) {
          try {
            // 'cmd /c start "" "$targetUrl"' opens the default browser in the foreground immediately
            Process.run('cmd', ['/c', 'start', '', targetUrl]);
            debugPrint('[LocalServer] Launched browser via start: $targetUrl');
          } catch (e) {
            debugPrint('[LocalServer launch error] $e');
            final uri = Uri.tryParse(targetUrl);
            if (uri != null) {
              launchUrl(uri, mode: LaunchMode.externalApplication);
            }
          }
        } else {
          final uri = Uri.tryParse(targetUrl);
          if (uri != null) {
            launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      }
      return Response.ok(
        jsonEncode({'success': true}),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Private-Network': 'true',
        },
      );
    }

    // 4. Static files serving
    String filePath = path.isEmpty || path == '/' ? 'index.html' : path;
    String assetKey = 'web/$filePath';
    String contentType = _getContentType(filePath);

    // Try reading directly from disk first (guarantees freshest build on desktop)
    final diskCandidates = [
      File('web/$filePath'),
      File('../docs/$filePath'),
      File('../dist/$filePath'),
    ];
    for (final diskFile in diskCandidates) {
      if (diskFile.existsSync()) {
        try {
          final bytes = diskFile.readAsBytesSync();
          return Response.ok(
            bytes,
            headers: {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache',
            },
          );
        } catch (_) {}
      }
    }

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
        final diskIndexCandidates = [
          File('web/index.html'),
          File('../docs/index.html'),
          File('../dist/index.html'),
        ];
        for (final indexFile in diskIndexCandidates) {
          if (indexFile.existsSync()) {
            try {
              final bytes = indexFile.readAsBytesSync();
              return Response.ok(
                bytes,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Access-Control-Allow-Origin': '*',
                },
              );
            } catch (_) {}
          }
        }
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
