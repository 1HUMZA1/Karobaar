import 'dart:io';
import 'package:flutter/services.dart' show rootBundle;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;

class LocalServer {
  HttpServer? _server;
  int? port;

  Future<int> start() async {
    final handler = const Pipeline().addHandler(_handleRequest);
    _server = await io.serve(handler, InternetAddress.loopbackIPv4, 0);
    port = _server!.port;
    return port!;
  }

  Future<Response> _handleRequest(Request request) async {
    String path = request.url.path;
    if (path.isEmpty || path == '/') {
      path = 'index.html';
    }

    String assetKey = 'web/$path';
    String contentType = _getContentType(path);

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
      final hasExtension = path.split('/').last.contains('.');
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
      return Response.notFound('Not found: $path');
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
