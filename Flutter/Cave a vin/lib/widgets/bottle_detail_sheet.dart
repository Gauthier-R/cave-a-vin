import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/wine_bottle.dart';
import '../services/cellar_service.dart';
import '../theme/cellar_theme.dart';
import 'bottle_form_sheet.dart';

class BottleDetailSheet extends StatelessWidget {
  final WineBottle bottle;

  const BottleDetailSheet({
    super.key,
    required this.bottle,
  });

  static void show(BuildContext context, WineBottle bottle) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BottleDetailSheet(bottle: bottle),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wineType = bottle.wineType;
    final currentYear = DateTime.now().year;

    String gardeStatus = '';
    Color gardeColor = CellarColors.gold;
    if (bottle.optimalYear != null) {
      if (bottle.optimalYear! < currentYear) {
        gardeStatus = 'À boire sans tarder (apogée ${bottle.optimalYear})';
        gardeColor = const Color(0xFFE57373);
      } else if (bottle.optimalYear! <= currentYear + 1) {
        gardeStatus = 'À son apogée (${bottle.optimalYear})';
        gardeColor = const Color(0xFF81C784);
      } else {
        gardeStatus = 'À garder jusqu\'en ${bottle.optimalYear}';
        gardeColor = CellarColors.goldLight;
      }
    }

    return Container(
      decoration: const BoxDecoration(
        color: CellarColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: CellarColors.surfaceBorder, width: 1.5),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Poignée du bas
            Center(
              child: Container(
                width: 44,
                height: 5,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: CellarColors.surfaceBorder,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),

            // En-tête : Badge Vin + Emplacement
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Badge type de vin
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: wineType.primaryColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: wineType.primaryColor.withValues(alpha: 0.5),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(wineType.iconEmoji,
                          style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 6),
                      Text(
                        wineType.label,
                        style: TextStyle(
                          color: wineType.highlightColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),

                // Badge localisation claire
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: CellarColors.gold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: CellarColors.gold.withValues(alpha: 0.4),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    'Étage ${bottle.floor} • ${bottle.row.label}',
                    style: const TextStyle(
                      color: CellarColors.goldLight,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Nom du vin & Millésime
            Text(
              bottle.name,
              style: const TextStyle(
                color: CellarColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 6),

            // Appellation et Région
            Text(
              [
                if (bottle.vintage != null) 'Millésime ${bottle.vintage}',
                if (bottle.appellation.isNotEmpty) bottle.appellation,
                if (bottle.region != null && bottle.region!.isNotEmpty)
                  bottle.region,
              ].join(' • '),
              style: const TextStyle(
                color: CellarColors.textSecondary,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),

            // Statut de garde / Apogée
            if (gardeStatus.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: CellarColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: CellarColors.surfaceBorder,
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.access_time_rounded,
                        size: 18, color: gardeColor),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        gardeStatus,
                        style: TextStyle(
                          color: gardeColor,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Commentaires / Notes de dégustation
            if (bottle.notes != null && bottle.notes!.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: CellarColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'NOTES & COMMENTAIRES',
                      style: TextStyle(
                        color: CellarColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      bottle.notes!,
                      style: const TextStyle(
                        color: CellarColors.textPrimary,
                        fontSize: 14,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            const SizedBox(height: 6),

            // GROS BOUTON 1 : BOIRE CETTE BOUTEILLE
            ElevatedButton.icon(
              onPressed: () => _handleDrinkBottle(context),
              icon: const Text('🍷', style: TextStyle(fontSize: 20)),
              label: const Text('Boire cette bouteille'),
              style: ElevatedButton.styleFrom(
                backgroundColor: CellarColors.wineRed,
                minimumSize: const Size(double.infinity, 54),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // BOUTON 2 : DÉPLACER (Étage / Rangée)
            OutlinedButton.icon(
              onPressed: () => _handleMoveBottle(context),
              icon: const Icon(Icons.swap_vert_rounded,
                  color: CellarColors.goldLight),
              label: const Text('Déplacer (changer d\'étage/rangée)'),
              style: OutlinedButton.styleFrom(
                foregroundColor: CellarColors.textPrimary,
                minimumSize: const Size(double.infinity, 50),
                side: const BorderSide(color: CellarColors.surfaceBorder),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Ligne : MODIFIER / SUPPRIMER
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      BottleFormSheet.show(context, bottleToEdit: bottle);
                    },
                    icon: const Icon(Icons.edit_outlined, size: 18),
                    label: const Text('Modifier'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 48),
                      side: const BorderSide(color: CellarColors.surfaceBorder),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _handleDelete(context),
                    icon: const Icon(Icons.delete_outline,
                        size: 18, color: CellarColors.danger),
                    label: const Text(
                      'Supprimer',
                      style: TextStyle(color: CellarColors.danger),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 48),
                      side: BorderSide(
                          color: CellarColors.danger.withValues(alpha: 0.4)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Dialogue de dégustation
  void _handleDrinkBottle(BuildContext context) {
    int selectedRating = 0;
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) {
          return AlertDialog(
            backgroundColor: CellarColors.surface,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Text('🍷', style: TextStyle(fontSize: 24)),
                SizedBox(width: 10),
                Text(
                  'Bonne dégustation !',
                  style: TextStyle(
                    color: CellarColors.textPrimary,
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'La bouteille "${bottle.name}" va être retirée de la cave et enregistrée dans votre historique.',
                  style: const TextStyle(
                    color: CellarColors.textSecondary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Votre appréciation :',
                  style: TextStyle(
                    color: CellarColors.goldLight,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                // Étoiles de notation
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final starValue = index + 1;
                    return IconButton(
                      onPressed: () {
                        setState(() {
                          if (selectedRating == starValue) {
                            selectedRating = 0;
                          } else {
                            selectedRating = starValue;
                          }
                        });
                      },
                      icon: Icon(
                        starValue <= selectedRating
                            ? Icons.star_rounded
                            : Icons.star_outline_rounded,
                        color: CellarColors.gold,
                        size: 32,
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    hintText: 'Avis de dégustation (optionnel)',
                  ),
                  maxLines: 2,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx),
                child: const Text('Annuler',
                    style: TextStyle(color: CellarColors.textMuted)),
              ),
              ElevatedButton(
                onPressed: () {
                  context.read<CellarService>().consumeBottle(
                        bottle.id,
                        rating: selectedRating,
                        tastingNotes: notesController.text.trim(),
                      );
                  Navigator.pop(dialogCtx); // ferme dialogue
                  Navigator.pop(context); // ferme modal
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: CellarColors.wineRed,
                      content: Text(
                        '🍷 ${bottle.name} ajoutée aux bouteilles dégustées !',
                        style: const TextStyle(color: Colors.white),
                      ),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: CellarColors.wineRed,
                  minimumSize: const Size(120, 46),
                ),
                child: const Text('Confirmer'),
              ),
            ],
          );
        },
      ),
    );
  }

  // Dialogue de déplacement rapide
  void _handleMoveBottle(BuildContext context) {
    int targetFloor = bottle.floor;
    BottleRow targetRow = bottle.row;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) {
          return AlertDialog(
            backgroundColor: CellarColors.surface,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Text(
              'Déplacer la bouteille',
              style: TextStyle(
                color: CellarColors.textPrimary,
                fontSize: 19,
                fontWeight: FontWeight.w700,
              ),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choisir l\'étage :',
                  style: TextStyle(
                    color: CellarColors.goldLight,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                // Choix de l'étage 1 à 4
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [1, 2, 3, 4].map((f) {
                    final isSelected = targetFloor == f;
                    return ChoiceChip(
                      label: Text('$f'),
                      selected: isSelected,
                      selectedColor: CellarColors.gold,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.black : CellarColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (selected) {
                        if (selected) setState(() => targetFloor = f);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Choisir la rangée :',
                  style: TextStyle(
                    color: CellarColors.goldLight,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                // Choix Devant ou Fond
                Row(
                  children: [BottleRow.devant, BottleRow.fond].map((r) {
                    final isSelected = targetRow == r;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                        child: ChoiceChip(
                          label: Center(child: Text(r.label)),
                          selected: isSelected,
                          selectedColor: CellarColors.gold,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Colors.black
                                : CellarColors.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => targetRow = r);
                          },
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx),
                child: const Text('Annuler',
                    style: TextStyle(color: CellarColors.textMuted)),
              ),
              ElevatedButton(
                onPressed: () {
                  context.read<CellarService>().moveBottle(
                        bottle.id,
                        targetFloor,
                        targetRow,
                      );
                  Navigator.pop(dialogCtx);
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: CellarColors.surfaceLight,
                      content: Text(
                        '✓ Déplacée vers Étage $targetFloor • ${targetRow.label}',
                        style: const TextStyle(color: CellarColors.goldLight),
                      ),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: CellarColors.gold,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(120, 46),
                ),
                child: const Text('Déplacer'),
              ),
            ],
          );
        },
      ),
    );
  }

  // Suppression
  void _handleDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: CellarColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Supprimer de la cave ?'),
        content: Text(
          'Voulez-vous supprimer définitivement "${bottle.name}" ?',
          style: const TextStyle(color: CellarColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Annuler',
                style: TextStyle(color: CellarColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<CellarService>().deleteBottle(bottle.id);
              Navigator.pop(dialogCtx);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: CellarColors.danger,
              minimumSize: const Size(100, 44),
            ),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}
