import 'package:flutter/material.dart';

class CellarColors {
  // Fond et surfaces sombres
  static const Color background = Color(0xFF0F1014);
  static const Color surface = Color(0xFF181920);
  static const Color surfaceLight = Color(0xFF22242D);
  static const Color surfaceBorder = Color(0xFF2E313D);

  // Tons boisés & cave
  static const Color woodShelf = Color(0xFF2A211D);
  static const Color woodBorder = Color(0xFF45362E);
  static const Color brassRail = Color(0xFF8A6D3B);

  // Accents or & prestige
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFF3D56D);
  static const Color goldDark = Color(0xFF9A7B1C);

  // Textes & contrastes
  static const Color textPrimary = Color(0xFFF5F5F7);
  static const Color textSecondary = Color(0xFFA1A4B2);
  static const Color textMuted = Color(0xFF6B6E7D);

  // Couleurs d'action
  static const Color wineRed = Color(0xFF8B1E2F);
  static const Color wineRedLight = Color(0xFFA8293E);
  static const Color success = Color(0xFF2E7D32);
  static const Color danger = Color(0xFFD32F2F);
}

class CellarTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: CellarColors.background,
      colorScheme: const ColorScheme.dark(
        primary: CellarColors.gold,
        onPrimary: Colors.black,
        secondary: CellarColors.goldLight,
        surface: CellarColors.surface,
        onSurface: CellarColors.textPrimary,
        error: CellarColors.danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CellarColors.background,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: CellarColors.textPrimary,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
        iconTheme: IconThemeData(color: CellarColors.gold),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: CellarColors.surface,
        selectedItemColor: CellarColors.gold,
        unselectedItemColor: CellarColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
      cardTheme: CardThemeData(
        color: CellarColors.surface,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: CellarColors.surfaceBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CellarColors.wineRed,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
          elevation: 2,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: CellarColors.textPrimary,
          minimumSize: const Size(double.infinity, 52),
          side: const BorderSide(color: CellarColors.surfaceBorder, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: CellarColors.surfaceLight,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CellarColors.surfaceBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CellarColors.surfaceBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CellarColors.gold, width: 1.8),
        ),
        hintStyle: const TextStyle(color: CellarColors.textMuted, fontSize: 15),
        labelStyle: const TextStyle(color: CellarColors.textSecondary, fontSize: 15),
      ),
      dividerTheme: const DividerThemeData(
        color: CellarColors.surfaceBorder,
        thickness: 1,
        space: 24,
      ),
    );
  }
}
