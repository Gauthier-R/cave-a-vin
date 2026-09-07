import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'services/cellar_service.dart';
import 'theme/cellar_theme.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await initializeDateFormatting('fr_FR', null);
  } catch (e) {
    debugPrint('Format de date fr_FR initialisé par défaut : $e');
  }

  runApp(const CaveAVinApp());
}

class CaveAVinApp extends StatelessWidget {
  const CaveAVinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CellarService(),
      child: MaterialApp(
        title: 'Cave à Vin',
        debugShowCheckedModeBanner: false,
        theme: CellarTheme.darkTheme,
        home: const MainNavigationScreen(),
      ),
    );
  }
}
