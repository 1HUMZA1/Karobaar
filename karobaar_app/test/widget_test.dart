import 'package:flutter_test/flutter_test.dart';
import 'package:karobaar_app/main.dart';

void main() {
  testWidgets('App renders KarobaarApp', (WidgetTester tester) async {
    await tester.pumpWidget(const KarobaarApp());
    expect(find.byType(KarobaarApp), findsOneWidget);
  });
}
