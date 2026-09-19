import 'package:flutter/material.dart';

enum WineType {
  rouge,
  blanc,
  rose,
  petillant,
  autre,
}

extension WineTypeExtension on WineType {
  String get label {
    switch (this) {
      case WineType.rouge:
        return 'Rouge';
      case WineType.blanc:
        return 'Blanc';
      case WineType.rose:
        return 'Rosé';
      case WineType.petillant:
        return 'Pétillant / Champagne';
      case WineType.autre:
        return 'Autre';
    }
  }

  String get shortLabel {
    switch (this) {
      case WineType.rouge:
        return 'Rouge';
      case WineType.blanc:
        return 'Blanc';
      case WineType.rose:
        return 'Rosé';
      case WineType.petillant:
        return 'Bulles';
      case WineType.autre:
        return 'Autre';
    }
  }

  String get iconEmoji {
    switch (this) {
      case WineType.rouge:
        return '🍷';
      case WineType.blanc:
        return '🥂';
      case WineType.rose:
        return '🌸';
      case WineType.petillant:
        return '🍾';
      case WineType.autre:
        return '🍇';
    }
  }

  Color get primaryColor {
    switch (this) {
      case WineType.rouge:
        return const Color(0xFF8B1E2F);
      case WineType.blanc:
        return const Color(0xFFD8D081); // jaune très clair / or vert
      case WineType.rose:
        return const Color(0xFFE88E9B);
      case WineType.petillant:
        return const Color(0xFF1B4D3E);
      case WineType.autre:
        return const Color(0xFF6A5ACD);
    }
  }

  Color get secondaryColor {
    switch (this) {
      case WineType.rouge:
        return const Color(0xFF4A0E18);
      case WineType.blanc:
        return const Color(0xFF968B42);
      case WineType.rose:
        return const Color(0xFFB85B6B);
      case WineType.petillant:
        return const Color(0xFF0C271F);
      case WineType.autre:
        return const Color(0xFF382F72);
    }
  }

  Color get highlightColor {
    switch (this) {
      case WineType.rouge:
        return const Color(0xFFB52E43);
      case WineType.blanc:
        return const Color(0xFFEFE8A3);
      case WineType.rose:
        return const Color(0xFFF7B9C3);
      case WineType.petillant:
        return const Color(0xFF2D7B64);
      case WineType.autre:
        return const Color(0xFF8D7FE0);
    }
  }
}

enum BottleRow {
  fond,
  devant,
}

extension BottleRowExtension on BottleRow {
  String get label {
    switch (this) {
      case BottleRow.fond:
        return 'Fond';
      case BottleRow.devant:
        return 'Devant';
    }
  }

  String get shortLabel {
    switch (this) {
      case BottleRow.fond:
        return 'Fond';
      case BottleRow.devant:
        return 'Devant';
    }
  }
}

enum BottleLocation {
  cave,
  chambre,
  garage,
}

extension BottleLocationExtension on BottleLocation {
  String get label {
    switch (this) {
      case BottleLocation.cave:
        return 'Cave à vin';
      case BottleLocation.chambre:
        return 'Chambre';
      case BottleLocation.garage:
        return 'Garage';
    }
  }

  String get shortLabel {
    switch (this) {
      case BottleLocation.cave:
        return 'Cave';
      case BottleLocation.chambre:
        return 'Chambre';
      case BottleLocation.garage:
        return 'Garage';
    }
  }
}

class WineBottle {
  final String id;
  final String name;
  final String appellation;
  final int? vintage;
  final WineType wineType;
  final BottleLocation location; // cave, chambre, garage
  final int floor; // 1, 2, 3, 4 (seulement pour la cave)
  final BottleRow row; // fond, devant (seulement pour la cave)
  final String? region;
  final int? optimalYear;
  final String? notes;
  final String? tastingNotes;
  final bool isConsumed;
  final DateTime? consumedDate;
  final int? rating;
  final DateTime createdAt;

  WineBottle({
    required this.id,
    required this.name,
    this.appellation = '',
    this.vintage,
    this.wineType = WineType.rouge,
    this.location = BottleLocation.cave,
    required this.floor,
    required this.row,
    this.region,
    this.optimalYear,
    this.notes,
    this.tastingNotes,
    this.isConsumed = false,
    this.consumedDate,
    this.rating,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  WineBottle copyWith({
    String? id,
    String? name,
    String? appellation,
    int? vintage,
    WineType? wineType,
    BottleLocation? location,
    int? floor,
    BottleRow? row,
    String? region,
    int? optimalYear,
    String? notes,
    String? tastingNotes,
    bool? isConsumed,
    DateTime? consumedDate,
    int? rating,
    DateTime? createdAt,
  }) {
    return WineBottle(
      id: id ?? this.id,
      name: name ?? this.name,
      appellation: appellation ?? this.appellation,
      vintage: vintage ?? this.vintage,
      wineType: wineType ?? this.wineType,
      location: location ?? this.location,
      floor: floor ?? this.floor,
      row: row ?? this.row,
      region: region ?? this.region,
      optimalYear: optimalYear ?? this.optimalYear,
      notes: notes ?? this.notes,
      tastingNotes: tastingNotes ?? this.tastingNotes,
      isConsumed: isConsumed ?? this.isConsumed,
      consumedDate: consumedDate ?? this.consumedDate,
      rating: rating ?? this.rating,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'appellation': appellation,
      'vintage': vintage,
      'wineType': wineType.name,
      'location': location.name,
      'floor': floor,
      'row': row.name,
      'region': region,
      'optimalYear': optimalYear,
      'notes': notes,
      'tastingNotes': tastingNotes,
      'isConsumed': isConsumed,
      'consumedDate': consumedDate?.toIso8601String(),
      'rating': rating,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory WineBottle.fromJson(Map<String, dynamic> json) {
    return WineBottle(
      id: json['id'] as String,
      name: json['name'] as String,
      appellation: (json['appellation'] as String?) ?? '',
      vintage: json['vintage'] as int?,
      wineType: WineType.values.firstWhere(
        (t) => t.name == json['wineType'],
        orElse: () => WineType.rouge,
      ),
      location: BottleLocation.values.firstWhere(
        (l) => l.name == json['location'],
        orElse: () => BottleLocation.cave, // Cave par défaut pour les anciennes données
      ),
      floor: (json['floor'] as int?) ?? 1,
      row: BottleRow.values.firstWhere(
        (r) => r.name == json['row'],
        orElse: () => BottleRow.devant,
      ),
      region: json['region'] as String?,
      optimalYear: json['optimalYear'] as int?,
      notes: json['notes'] as String?,
      tastingNotes: json['tastingNotes'] as String?,
      isConsumed: (json['isConsumed'] as bool?) ?? false,
      consumedDate: json['consumedDate'] != null
          ? DateTime.tryParse(json['consumedDate'] as String)
          : null,
      rating: json['rating'] as int?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
