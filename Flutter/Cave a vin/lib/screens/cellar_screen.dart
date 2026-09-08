import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/wine_bottle.dart';
import '../services/cellar_service.dart';
import '../theme/cellar_theme.dart';
import '../widgets/shelf_card_widget.dart';
import '../widgets/special_location_card_widget.dart';
import '../widgets/bottle_detail_sheet.dart';
import '../widgets/bottle_form_sheet.dart';

import 'dart:async';

class CellarScreen extends StatefulWidget {
  const CellarScreen({super.key});

  @override
  State<CellarScreen> createState() => _CellarScreenState();
}

class _CellarScreenState extends State<CellarScreen> {
  final ScrollController _scrollController = ScrollController();
  Timer? _scrollTimer;

  bool _isCaveExpanded = true;
  bool _isChambreExpanded = true;
  bool _isGarageExpanded = true;

  void _startAutoScroll(double direction) {
    _scrollTimer?.cancel();
    _scrollTimer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
      if (!_scrollController.hasClients) return;
      final offset = _scrollController.offset + (direction * 10.0);
      _scrollController.jumpTo(offset.clamp(
        _scrollController.position.minScrollExtent,
        _scrollController.position.maxScrollExtent,
      ));
    });
  }

  void _stopAutoScroll() {
    _scrollTimer?.cancel();
    _scrollTimer = null;
  }

  @override
  void dispose() {
    _scrollTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  Widget _buildSectionHeader(String title, bool isExpanded, VoidCallback onToggle) {
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: CellarColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CellarColors.surfaceBorder),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: CellarColors.goldLight,
                fontSize: 14,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
              ),
            ),
            Icon(
              isExpanded ? Icons.expand_less : Icons.expand_more,
              color: CellarColors.goldLight,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text(
              '🍷',
              style: TextStyle(fontSize: 22),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ma Cave à Vin',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Consumer<CellarService>(
                  builder: (context, cellar, child) {
                    final count = cellar.totalInCellarCount;
                    return Text(
                      '$count ${count > 1 ? "bouteilles en stock" : "bouteille en stock"}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: CellarColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Ajouter une bouteille',
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: CellarColors.gold.withValues(alpha: 0.18),
                shape: BoxShape.circle,
                border: Border.all(
                  color: CellarColors.gold.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: const Icon(
                Icons.add,
                color: CellarColors.goldLight,
                size: 20,
              ),
            ),
            onPressed: () => BottleFormSheet.show(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<CellarService>(
        builder: (context, cellar, child) {
          if (cellar.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: CellarColors.gold),
            );
          }

          final floors = [4, 3, 2, 1];

          return Stack(
            children: [
              ListView(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                children: [
                  _buildSectionHeader('CAVE À VIN', _isCaveExpanded, () => setState(() => _isCaveExpanded = !_isCaveExpanded)),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOutCubic,
                    alignment: Alignment.topCenter,
                    child: _isCaveExpanded
                        ? Column(
                            children: floors.map((floorNumber) {
                              final backBottles = cellar.getBottlesInCellar(floorNumber, BottleRow.fond);
                              final frontBottles = cellar.getBottlesInCellar(floorNumber, BottleRow.devant);
                              return ShelfCardWidget(
                                floor: floorNumber,
                                backRowBottles: backBottles,
                                frontRowBottles: frontBottles,
                                onBottleTap: (bottle) => BottleDetailSheet.show(context, bottle),
                                onAddTap: (floor, row) => BottleFormSheet.show(
                                  context,
                                  initialFloor: floor,
                                  initialRow: row,
                                ),
                              );
                            }).toList(),
                          )
                        : const SizedBox.shrink(),
                  ),

                  _buildSectionHeader('CHAMBRE', _isChambreExpanded, () => setState(() => _isChambreExpanded = !_isChambreExpanded)),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOutCubic,
                    alignment: Alignment.topCenter,
                    child: _isChambreExpanded
                        ? const SpecialLocationCardWidget(location: BottleLocation.chambre)
                        : const SizedBox.shrink(),
                  ),

                  _buildSectionHeader('GARAGE', _isGarageExpanded, () => setState(() => _isGarageExpanded = !_isGarageExpanded)),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOutCubic,
                    alignment: Alignment.topCenter,
                    child: _isGarageExpanded
                        ? const SpecialLocationCardWidget(location: BottleLocation.garage)
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
              // Zone de défilement vers le haut
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                child: DragTarget<WineBottle>(
                  onWillAcceptWithDetails: (_) {
                    _startAutoScroll(-1.0);
                    return false;
                  },
                  onLeave: (_) => _stopAutoScroll(),
                  builder: (context, _, __) => const SizedBox(),
                ),
              ),
              // Zone de défilement vers le bas
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                child: DragTarget<WineBottle>(
                  onWillAcceptWithDetails: (_) {
                    _startAutoScroll(1.0);
                    return false;
                  },
                  onLeave: (_) => _stopAutoScroll(),
                  builder: (context, _, __) => const SizedBox(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
