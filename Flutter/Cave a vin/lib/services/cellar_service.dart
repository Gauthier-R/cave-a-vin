import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/wine_bottle.dart';

class CellarService extends ChangeNotifier {
  static const String _storageKey = 'cave_a_vin_bottles_v1';
  final _uuid = const Uuid();

  List<WineBottle> _bottles = [];
  bool _isLoading = true;

  bool get isLoading => _isLoading;
  List<WineBottle> get bottles => _bottles.where((b) => !b.isConsumed).toList();
  List<WineBottle> get consumedBottles =>
      _bottles.where((b) => b.isConsumed).toList()
        ..sort((a, b) => (b.consumedDate ?? DateTime.now())
            .compareTo(a.consumedDate ?? DateTime.now()));

  int get totalInCellarCount => bottles.length;
  int get totalConsumedCount => consumedBottles.length;

  CellarService() {
    loadBottles();
  }

  // Obtenir les bouteilles actives d'un étage et d'une rangée spécifique
  List<WineBottle> getBottles(int floor, BottleRow row) {
    return _bottles
        .where((b) => !b.isConsumed && b.floor == floor && b.row == row)
        .toList();
  }

  // Nombre total de bouteilles actives sur un étage (fond + devant)
  int countForFloor(int floor) {
    return _bottles
        .where((b) => !b.isConsumed && b.floor == floor)
        .length;
  }

  // Chargement depuis SharedPreferences ou initialisation avec données de dégustation
  Future<void> loadBottles() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = prefs.getString(_storageKey);

      if (rawJson != null && rawJson.isNotEmpty) {
        final List<dynamic> decoded = jsonDecode(rawJson) as List<dynamic>;
        _bottles = decoded
            .map((item) => WineBottle.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        // Premier lancement : charger une cave garnie d'exemples réalistes
        _bottles = _generateInitialBottles();
        await _persist();
      }
    } catch (e) {
      debugPrint('Erreur lors du chargement de la cave : $e');
      _bottles = _generateInitialBottles();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Persistance dans SharedPreferences
  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = jsonEncode(_bottles.map((b) => b.toJson()).toList());
      await prefs.setString(_storageKey, rawJson);
    } catch (e) {
      debugPrint('Erreur de sauvegarde locale : $e');
    }
  }

  // Ajouter une bouteille
  Future<void> addBottle({
    required String name,
    String appellation = '',
    int? vintage,
    WineType wineType = WineType.rouge,
    required int floor,
    required BottleRow row,
    String? region,
    int? optimalYear,
    String? notes,
  }) async {
    final newBottle = WineBottle(
      id: _uuid.v4(),
      name: name.trim(),
      appellation: appellation.trim(),
      vintage: vintage,
      wineType: wineType,
      floor: floor,
      row: row,
      region: region?.trim(),
      optimalYear: optimalYear,
      notes: notes?.trim(),
      isConsumed: false,
    );

    _bottles.add(newBottle);
    await _persist();
    notifyListeners();
  }

  // Modifier une bouteille
  Future<void> updateBottle(WineBottle updated) async {
    final index = _bottles.indexWhere((b) => b.id == updated.id);
    if (index != -1) {
      _bottles[index] = updated;
      await _persist();
      notifyListeners();
    }
  }

  // Déplacer rapidement une bouteille vers un autre étage / rangée
  Future<void> moveBottle(String id, int targetFloor, BottleRow targetRow) async {
    final index = _bottles.indexWhere((b) => b.id == id);
    if (index != -1) {
      _bottles[index] = _bottles[index].copyWith(
        floor: targetFloor,
        row: targetRow,
      );
      await _persist();
      notifyListeners();
    }
  }

  // Boire / Déguster une bouteille (la déplace dans l'historique)
  Future<void> consumeBottle(
    String id, {
    int? rating,
    String? tastingNotes,
  }) async {
    final index = _bottles.indexWhere((b) => b.id == id);
    if (index != -1) {
      final current = _bottles[index];
      _bottles[index] = current.copyWith(
        isConsumed: true,
        consumedDate: DateTime.now(),
        rating: rating ?? current.rating,
        tastingNotes: tastingNotes ?? current.tastingNotes,
      );
      await _persist();
      notifyListeners();
    }
  }

  // Remettre en cave (annuler la dégustation)
  Future<void> restoreBottle(String id) async {
    final index = _bottles.indexWhere((b) => b.id == id);
    if (index != -1) {
      _bottles[index] = _bottles[index].copyWith(
        isConsumed: false,
        consumedDate: null,
      );
      await _persist();
      notifyListeners();
    }
  }

  // Supprimer définitivement
  Future<void> deleteBottle(String id) async {
    _bottles.removeWhere((b) => b.id == id);
    await _persist();
    notifyListeners();
  }

  // Recherche avec filtres
  List<WineBottle> searchBottles({
    String query = '',
    WineType? wineType,
    bool onlyReadyToDrink = false,
  }) {
    final currentYear = DateTime.now().year;
    final normalizedQuery = query.toLowerCase().trim();

    return bottles.where((bottle) {
      if (wineType != null && bottle.wineType != wineType) {
        return false;
      }

      if (onlyReadyToDrink) {
        if (bottle.optimalYear == null || bottle.optimalYear! > currentYear + 1) {
          return false;
        }
      }

      if (normalizedQuery.isEmpty) return true;

      final matchName = bottle.name.toLowerCase().contains(normalizedQuery);
      final matchAppellation =
          bottle.appellation.toLowerCase().contains(normalizedQuery);
      final matchRegion =
          bottle.region?.toLowerCase().contains(normalizedQuery) ?? false;
      final matchVintage =
          bottle.vintage != null && bottle.vintage.toString().contains(normalizedQuery);

      return matchName || matchAppellation || matchRegion || matchVintage;
    }).toList();
  }

  // Données initiales (La cave est vide par défaut au premier lancement)
  List<WineBottle> _generateInitialBottles() {
    return [];
  }
}
