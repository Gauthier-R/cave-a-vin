import 'package:flutter_test/flutter_test.dart';
import 'package:cave_a_vin/main.dart';

void main() {
  testWidgets('Smoke test de lancement de l\'application Cave a Vin', (WidgetTester tester) async {
    await tester.pumpWidget(const CaveAVinApp());
    expect(find.text('Ma Cave à Vin'), findsOneWidget);
  });
}
