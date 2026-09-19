import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/wine_bottle.dart';
import '../services/cellar_service.dart';
import '../theme/cellar_theme.dart';
import '../widgets/bottle_detail_sheet.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  WineType? _selectedTypeFilter;
  bool _onlyReadyToDrink = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Rechercher & Localiser',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: Consumer<CellarService>(
        builder: (context, cellar, child) {
          final results = cellar.searchBottles(
            query: _searchController.text,
            wineType: _selectedTypeFilter,
            onlyReadyToDrink: _onlyReadyToDrink,
          );

          return Column(
            children: [
              // Barre de recherche
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Nom, domaine, appellation, millésime...',
                    prefixIcon:
                        const Icon(Icons.search, color: CellarColors.gold),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                  ),
                ),
              ),

              // Pastilles de filtres horizontales
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    // Filtre Tous
                    FilterChip(
                      label: const Text('Tous'),
                      selected: _selectedTypeFilter == null && !_onlyReadyToDrink,
                      selectedColor: CellarColors.gold,
                      labelStyle: TextStyle(
                        color: _selectedTypeFilter == null && !_onlyReadyToDrink
                            ? Colors.black
                            : CellarColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (_) {
                        setState(() {
                          _selectedTypeFilter = null;
                          _onlyReadyToDrink = false;
                        });
                      },
                    ),
                    const SizedBox(width: 8),

                    // Filtre À boire en priorité
                    FilterChip(
                      avatar: const Icon(Icons.hourglass_top_rounded,
                          size: 16, color: CellarColors.goldLight),
                      label: const Text('À boire en priorité'),
                      selected: _onlyReadyToDrink,
                      selectedColor: CellarColors.gold,
                      labelStyle: TextStyle(
                        color: _onlyReadyToDrink
                            ? Colors.black
                            : CellarColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (selected) {
                        setState(() {
                          _onlyReadyToDrink = selected;
                        });
                      },
                    ),
                    const SizedBox(width: 8),

                    // Filtres par type de vin
                    ...WineType.values.map((type) {
                      final isSelected = _selectedTypeFilter == type;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: FilterChip(
                          avatar: Text(type.iconEmoji),
                          label: Text(type.shortLabel),
                          selected: isSelected,
                          selectedColor: type.primaryColor,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : CellarColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (selected) {
                            setState(() {
                              _selectedTypeFilter = selected ? type : null;
                            });
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Compteur de résultats
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${results.length} ${results.length > 1 ? "bouteilles trouvées" : "bouteille trouvée"}',
                      style: const TextStyle(
                        color: CellarColors.textMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Liste des résultats
              Expanded(
                child: results.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('🔍', style: TextStyle(fontSize: 44)),
                            const SizedBox(height: 12),
                            const Text(
                              'Aucune bouteille correspondante',
                              style: TextStyle(
                                color: CellarColors.textSecondary,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _searchController.text.isNotEmpty
                                  ? 'Essayez un autre mot-clé ou réinitialisez les filtres'
                                  : 'Votre cave ne contient pas encore ce type de vin',
                              style: const TextStyle(
                                color: CellarColors.textMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                        itemCount: results.length,
                        itemBuilder: (context, index) {
                          final bottle = results[index];
                          return _buildBottleCard(context, bottle);
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBottleCard(BuildContext context, WineBottle bottle) {
    final wineType = bottle.wineType;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: CellarColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: CellarColors.surfaceBorder,
          width: 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => BottleDetailSheet.show(context, bottle),
        child: Padding(
          padding: const EdgeInsets.all(14.0),
          child: Row(
            children: [
              // Médaillon type de vin
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    center: const Alignment(-0.2, -0.2),
                    colors: [
                      wineType.highlightColor,
                      wineType.primaryColor,
                      wineType.secondaryColor,
                    ],
                  ),
                  border: Border.all(color: CellarColors.gold, width: 1.5),
                ),
                child: Center(
                  child: Text(
                    bottle.vintage != null
                        ? '${bottle.vintage}'
                        : wineType.iconEmoji,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Informations principales
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bottle.name,
                      style: const TextStyle(
                        color: CellarColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      [
                        if (bottle.appellation.isNotEmpty) bottle.appellation,
                        if (bottle.region != null && bottle.region!.isNotEmpty)
                          bottle.region,
                      ].join(' • '),
                      style: const TextStyle(
                        color: CellarColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Badge de localisation claire
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: CellarColors.gold.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: CellarColors.gold.withValues(alpha: 0.35),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        '📍 Étage ${bottle.floor} • ${bottle.row.label}',
                        style: const TextStyle(
                          color: CellarColors.goldLight,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Icon(
                Icons.chevron_right,
                color: CellarColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
