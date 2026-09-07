import 'package:flutter/material.dart';
import '../theme/cellar_theme.dart';
import '../widgets/bottle_form_sheet.dart';
import 'cellar_screen.dart';
import 'search_screen.dart';
import 'history_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    CellarScreen(),
    SearchScreen(),
    HistoryScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => BottleFormSheet.show(context),
        backgroundColor: CellarColors.gold,
        foregroundColor: Colors.black,
        elevation: 6,
        icon: const Icon(Icons.add, size: 22),
        label: const Text(
          'Ajouter un vin',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: CellarColors.surfaceBorder, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.view_week_rounded),
              activeIcon: Icon(Icons.view_week_rounded, color: CellarColors.gold),
              label: 'Ma Cave',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search_rounded),
              activeIcon: Icon(Icons.search_rounded, color: CellarColors.gold),
              label: 'Recherche',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history_edu_rounded),
              activeIcon: Icon(Icons.history_edu_rounded, color: CellarColors.gold),
              label: 'Bouteilles Bues',
            ),
          ],
        ),
      ),
    );
  }
}
