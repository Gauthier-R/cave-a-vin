import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/wine_bottle.dart';
import '../services/cellar_service.dart';
import '../theme/cellar_theme.dart';
import 'bottle_form_sheet.dart';
import 'bottle_detail_sheet.dart';
import 'bottle_capsule_widget.dart';

class SpecialLocationCardWidget extends StatelessWidget {
  final BottleLocation location;

  const SpecialLocationCardWidget({
    super.key,
    required this.location,
  });

  @override
  Widget build(BuildContext context) {
    final service = context.watch<CellarService>();
    final bottles = service.getBottlesInLocation(location);

    final bgImage = location == BottleLocation.chambre
        ? 'assets/images/bg_chambre.jpg'
        : 'assets/images/bg_garage.jpg';

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: CellarColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CellarColors.surfaceBorder, width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Colors.black45,
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: Stack(
          children: [
            // Fond spécifique généré par IA
            Positioned.fill(
              child: Image.asset(
                bgImage,
                fit: BoxFit.cover,
              ),
            ),
            // Couche d'assombrissement pour la lisibilité
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.5),
              ),
            ),
            // Contenu
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // En-tête (Nom du lieu)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          location.label.toUpperCase(),
                          style: const TextStyle(
                            color: CellarColors.goldLight,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2.0,
                          ),
                        ),
                        Text(
                          '${bottles.length} BOUTEILLE${bottles.length > 1 ? 'S' : ''}',
                          style: const TextStyle(
                            color: CellarColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Zone de DragTarget pour permettre de glisser-déposer des bouteilles
                  DragTarget<WineBottle>(
                    onWillAcceptWithDetails: (details) => details.data.location != location,
                    onAcceptWithDetails: (details) {
                      context.read<CellarService>().updateBottle(
                        details.data.copyWith(
                          location: location,
                          floor: 1, // par défaut
                          row: BottleRow.devant, // par défaut
                        ),
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: CellarColors.surfaceLight,
                          content: Text(
                            '✓ Déplacée vers ${location.label}',
                            style: const TextStyle(color: CellarColors.goldLight),
                          ),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    builder: (context, candidateData, rejectedData) {
                      final isHovered = candidateData.isNotEmpty;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: isHovered
                            ? BoxDecoration(
                                color: CellarColors.gold.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: CellarColors.gold, width: 1.5),
                              )
                            : null,
                        child: bottles.isEmpty
                            ? _buildEmptyState(context)
                            : _buildBottleRow(context, bottles),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return GestureDetector(
      onTap: () => BottleFormSheet.show(context, initialLocation: location),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.symmetric(vertical: 32),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: CellarColors.surfaceBorder,
          ),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(
                location == BottleLocation.chambre ? Icons.bed : Icons.garage,
                size: 32,
                color: CellarColors.textMuted,
              ),
              const SizedBox(height: 8),
              Text(
                'Ajouter une bouteille dans ${location.label.toLowerCase()}',
                style: const TextStyle(
                  color: CellarColors.textMuted,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottleRow(BuildContext context, List<WineBottle> bottles) {
    return SizedBox(
      height: 138,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12.0),
        itemCount: bottles.length + 1, // +1 pour le bouton d'ajout
        itemBuilder: (context, index) {
          if (index < bottles.length) {
            final bottle = bottles[index];
            return BottleCapsuleWidget(
              bottle: bottle,
              isBackRow: false,
              onTap: () => BottleDetailSheet.show(context, bottle),
            );
          } else {
            return _buildAddBottleButton(context);
          }
        },
      ),
    );
  }

  Widget _buildAddBottleButton(BuildContext context) {
    const size = 64.0;

    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8.0),
        child: InkWell(
          onTap: () => BottleFormSheet.show(context, initialLocation: location),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: CellarColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: CellarColors.surfaceBorder,
                width: 1.5,
                style: BorderStyle.solid,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.add,
                  color: CellarColors.gold,
                  size: 26,
                ),
                const SizedBox(height: 2),
                const Text(
                  'Ajouter',
                  style: TextStyle(
                    color: CellarColors.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
