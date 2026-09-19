import 'package:flutter/material.dart';
import '../models/wine_bottle.dart';
import '../theme/cellar_theme.dart';
import '../services/cellar_service.dart';
import 'bottle_capsule_widget.dart';
import 'package:provider/provider.dart';

class ShelfCardWidget extends StatelessWidget {
  final int floor;
  final List<WineBottle> backRowBottles;
  final List<WineBottle> frontRowBottles;
  final Function(WineBottle) onBottleTap;
  final Function(int floor, BottleRow row) onAddTap;

  const ShelfCardWidget({
    super.key,
    required this.floor,
    required this.backRowBottles,
    required this.frontRowBottles,
    required this.onBottleTap,
    required this.onAddTap,
  });

  String _getFloorTitle(int floor) {
    return 'Étage $floor';
  }

  @override
  Widget build(BuildContext context) {
    final totalCount = backRowBottles.length + frontRowBottles.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 22.0),
      decoration: BoxDecoration(
        color: CellarColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: CellarColors.surfaceBorder,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête de l'étage
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: CellarColors.gold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: CellarColors.gold.withValues(alpha: 0.4),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        'NIVEAU $floor',
                        style: const TextStyle(
                          color: CellarColors.goldLight,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _getFloorTitle(floor),
                      style: const TextStyle(
                        color: CellarColors.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                // Badge total bouteilles
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: CellarColors.surfaceLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$totalCount ${totalCount > 1 ? "bouteilles" : "bouteille"}',
                    style: const TextStyle(
                      color: CellarColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Rangée 1 : FOND (Effet profondeur)
          _buildRowSection(
            context: context,
            title: 'Rangée du Fond',
            isBack: true,
            floor: floor,
            row: BottleRow.fond,
            bottles: backRowBottles,
            onAdd: () => onAddTap(floor, BottleRow.fond),
          ),

          // Barre étagère bois & laiton
          Container(
            height: 8,
            margin: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: CellarColors.woodShelf,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: CellarColors.woodBorder, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.5),
                  blurRadius: 3,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),

          // Rangée 2 : DEVANT (Premier plan lumineux)
          _buildRowSection(
            context: context,
            title: 'Rangée de Devant',
            isBack: false,
            floor: floor,
            row: BottleRow.devant,
            bottles: frontRowBottles,
            onAdd: () => onAddTap(floor, BottleRow.devant),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildRowSection({
    required BuildContext context,
    required String title,
    required bool isBack,
    required int floor,
    required BottleRow row,
    required List<WineBottle> bottles,
    required VoidCallback onAdd,
  }) {
    return DragTarget<WineBottle>(
      onWillAcceptWithDetails: (details) => details.data.floor != floor || details.data.row != row || details.data.location != BottleLocation.cave,
      onAcceptWithDetails: (details) {
        final cellar = Provider.of<CellarService>(context, listen: false);
        final bottle = details.data;
        cellar.updateBottle(bottle.copyWith(location: BottleLocation.cave, floor: floor, row: row));
      },
      builder: (context, candidateData, rejectedData) {
        final isHovered = candidateData.isNotEmpty;

        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12.0),
          decoration: BoxDecoration(
            color: isHovered 
                ? CellarColors.gold.withValues(alpha: 0.15)
                : (isBack ? const Color(0xFF0F1014) : Colors.transparent),
            boxShadow: isBack ? [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.8),
                blurRadius: 10,
                offset: const Offset(0, 4),
                blurStyle: BlurStyle.inner,
              )
            ] : null,
            border: isHovered 
                ? Border.all(color: CellarColors.gold, width: 1.5)
                : null,
          ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Titre discret de la rangée
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      isBack ? Icons.layers_outlined : Icons.wb_sunny_outlined,
                      size: 13,
                      color: isBack
                          ? CellarColors.textMuted
                          : CellarColors.goldLight.withValues(alpha: 0.8),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      title.toUpperCase(),
                      style: TextStyle(
                        color: isBack
                            ? CellarColors.textMuted
                            : CellarColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                Text(
                  '${bottles.length}',
                  style: TextStyle(
                    color: isBack
                        ? CellarColors.textMuted
                        : CellarColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Défilement horizontal des bouteilles sans contrainte rigide
          SizedBox(
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
                    isBackRow: isBack,
                    onTap: () => onBottleTap(bottle),
                  );
                } else {
                  // Bouton d'ajout direct sur cette rangée
                  return _buildAddBottleButton(isBack: isBack, onAdd: onAdd);
                }
              },
            ),
          ),
        ],
      ),
    );
      },
    );
  }

  Widget _buildAddBottleButton({
    required bool isBack,
    required VoidCallback onAdd,
  }) {
    final size = isBack ? 56.0 : 64.0;

    return Center(
      child: Padding(
        padding: EdgeInsets.only(top: isBack ? 14.0 : 0),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 8.0),
          child: InkWell(
            onTap: onAdd,
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
                Text(
                  'Ajouter',
                  style: TextStyle(
                    color: CellarColors.textMuted,
                    fontSize: isBack ? 9 : 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
    );
  }
}
