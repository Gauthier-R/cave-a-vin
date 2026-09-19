import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/wine_bottle.dart';
import '../services/cellar_service.dart';
import '../theme/cellar_theme.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  // Nouveaux filtres spécifiques
  String _searchQuery = '';
  int _filterMinRating = 0; 
  bool _filterHasComment = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _editTasting(BuildContext context, WineBottle bottle) {
    int selectedRating = bottle.rating ?? 0;
    final notesController = TextEditingController(text: bottle.tastingNotes ?? '');

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) {
          return AlertDialog(
            backgroundColor: CellarColors.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Text('Modifier la dégustation', style: TextStyle(color: CellarColors.textPrimary)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Votre appréciation :', style: TextStyle(color: CellarColors.goldLight, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final starValue = index + 1;
                    return IconButton(
                      onPressed: () {
                        setState(() {
                          if (selectedRating == starValue) {
                            selectedRating = 0; // permet de désélectionner
                          } else {
                            selectedRating = starValue;
                          }
                        });
                      },
                      icon: Icon(
                        starValue <= selectedRating ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: CellarColors.gold,
                        size: 32,
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(hintText: 'Avis de dégustation'),
                  maxLines: 3,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx),
                child: const Text('Annuler', style: TextStyle(color: CellarColors.textMuted)),
              ),
              ElevatedButton(
                onPressed: () {
                  final updated = bottle.copyWith(
                    rating: selectedRating,
                    tastingNotes: notesController.text.trim(),
                  );
                  context.read<CellarService>().updateBottle(updated);
                  Navigator.pop(dialogCtx);
                },
                style: ElevatedButton.styleFrom(backgroundColor: CellarColors.gold, foregroundColor: Colors.black),
                child: const Text('Enregistrer'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmRestore(BuildContext context, WineBottle bottle, CellarService cellar) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CellarColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Remettre en cave ?', style: TextStyle(color: CellarColors.textPrimary)),
        content: Text('Voulez-vous vraiment remettre la bouteille "${bottle.name}" dans votre cave ?', style: const TextStyle(color: CellarColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler', style: TextStyle(color: CellarColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              cellar.restoreBottle(bottle.id);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: CellarColors.gold, foregroundColor: Colors.black),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WineBottle bottle, CellarService cellar) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CellarColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Supprimer la bouteille ?', style: TextStyle(color: CellarColors.textPrimary)),
        content: Text('Voulez-vous vraiment supprimer définitivement la bouteille "${bottle.name}" de votre historique ? Cette action est irréversible.', style: const TextStyle(color: CellarColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler', style: TextStyle(color: CellarColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              cellar.deleteBottle(bottle.id);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade400, foregroundColor: Colors.white),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMMM yyyy', 'fr_FR');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bouteilles Bues & Dégustées', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      ),
      body: Consumer<CellarService>(
        builder: (context, cellar, child) {
          final allConsumed = cellar.consumedBottles;

          // Filtrage
          final consumed = allConsumed.where((b) {
            // Filtre par commentaire
            if (_filterHasComment) {
              final hasNotes = b.tastingNotes != null && b.tastingNotes!.trim().isNotEmpty;
              if (!hasNotes) return false;
            }
            
            // Filtre par note minimale
            if (_filterMinRating > 0) {
              final rating = b.rating ?? 0;
              if (rating < _filterMinRating) return false;
            }

            // Filtre par texte (recherche)
            if (_searchQuery.isNotEmpty) {
              final q = _searchQuery.toLowerCase();
              return b.name.toLowerCase().contains(q) || 
                     b.appellation.toLowerCase().contains(q) ||
                     (b.tastingNotes != null && b.tastingNotes!.toLowerCase().contains(q)) ||
                     (b.notes != null && b.notes!.toLowerCase().contains(q));
            }
            return true;
          }).toList();

          return Column(
            children: [
              // Barre de recherche et filtres avancés
              if (allConsumed.isNotEmpty)
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  decoration: const BoxDecoration(
                    color: CellarColors.background,
                    border: Border(bottom: BorderSide(color: CellarColors.surfaceBorder)),
                  ),
                  child: Column(
                    children: [
                      // Champ de recherche
                      TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val),
                        decoration: InputDecoration(
                          hintText: 'Rechercher (nom, appellation, avis...)',
                          prefixIcon: const Icon(Icons.search, color: CellarColors.textMuted),
                          suffixIcon: _searchQuery.isNotEmpty ? IconButton(
                            icon: const Icon(Icons.clear, color: CellarColors.textMuted),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          ) : null,
                          filled: true,
                          fillColor: CellarColors.surface,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // Ligne des filtres : Note et Commentaire
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Filtre Etoiles
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Note minimum :', style: TextStyle(color: CellarColors.textMuted, fontSize: 12)),
                              const SizedBox(height: 4),
                              Row(
                                children: List.generate(5, (index) {
                                  final starValue = index + 1;
                                  return GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        if (_filterMinRating == starValue) {
                                          _filterMinRating = 0; // Désactiver le filtre
                                        } else {
                                          _filterMinRating = starValue;
                                        }
                                      });
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 2.0),
                                      child: Icon(
                                        starValue <= _filterMinRating ? Icons.star_rounded : Icons.star_outline_rounded,
                                        color: CellarColors.gold,
                                        size: 26,
                                      ),
                                    ),
                                  );
                                }),
                              ),
                            ],
                          ),
                          
                          // Filtre Commentaire
                          Row(
                            children: [
                              const Text('A un avis', style: TextStyle(color: CellarColors.textSecondary, fontSize: 13.5)),
                              const SizedBox(width: 4),
                              Switch(
                                value: _filterHasComment,
                                activeColor: CellarColors.gold,
                                onChanged: (val) => setState(() => _filterHasComment = val),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

              if (consumed.isEmpty)
                Expanded(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 36.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(allConsumed.isEmpty ? '📜' : '🔍', style: const TextStyle(fontSize: 48)),
                          const SizedBox(height: 14),
                          Text(
                            allConsumed.isEmpty 
                              ? 'Aucune bouteille dégustée pour l\'instant' 
                              : 'Aucun résultat pour ces filtres',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: CellarColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 6),
                          if (allConsumed.isEmpty)
                            const Text(
                              'Lorsque vous dégustez un vin, cliquez sur "Boire cette bouteille" pour l\'archiver dans ce carnet de dégustation.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: CellarColors.textMuted, fontSize: 14, height: 1.3),
                            ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                    itemCount: consumed.length,
                    itemBuilder: (context, index) {
                      final bottle = consumed[index];
                      final wineType = bottle.wineType;
                      String dateStr = '';
                      if (bottle.consumedDate != null) {
                        try {
                          dateStr = dateFormat.format(bottle.consumedDate!);
                        } catch (_) {
                          dateStr = '${bottle.consumedDate!.day}/${bottle.consumedDate!.month}/${bottle.consumedDate!.year}';
                        }
                      }

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: CellarColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: CellarColors.surfaceBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: wineType.primaryColor.withValues(alpha: 0.25),
                                    border: Border.all(color: wineType.primaryColor, width: 1.5),
                                  ),
                                  child: Center(
                                    child: Text(wineType.iconEmoji, style: const TextStyle(fontSize: 18)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        bottle.name,
                                        style: const TextStyle(color: CellarColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        [if (bottle.vintage != null) '${bottle.vintage}', if (bottle.appellation.isNotEmpty) bottle.appellation].join(' • '),
                                        style: const TextStyle(color: CellarColors.textSecondary, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                                if (dateStr.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: CellarColors.surfaceLight, borderRadius: BorderRadius.circular(8)),
                                    child: Text(dateStr, style: const TextStyle(color: CellarColors.textMuted, fontSize: 11, fontWeight: FontWeight.w500)),
                                  ),
                              ],
                            ),
                            if (bottle.rating != null && bottle.rating! > 0) ...[
                              const SizedBox(height: 10),
                              Row(
                                children: List.generate(5, (starIdx) {
                                  return Icon(
                                    starIdx < bottle.rating! ? Icons.star_rounded : Icons.star_outline_rounded,
                                    color: CellarColors.gold,
                                    size: 18,
                                  );
                                }),
                              ),
                            ],
                            if (bottle.notes != null && bottle.notes!.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              const Text('NOTES PERSONNELLES', style: TextStyle(color: CellarColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text(bottle.notes!, style: const TextStyle(color: CellarColors.textSecondary, fontSize: 13.5)),
                            ],
                            if (bottle.tastingNotes != null && bottle.tastingNotes!.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              const Text('AVIS DE DÉGUSTATION', style: TextStyle(color: CellarColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text(bottle.tastingNotes!, style: const TextStyle(color: CellarColors.textSecondary, fontSize: 13.5, fontStyle: FontStyle.italic)),
                            ],
                            const SizedBox(height: 10),
                            const Divider(height: 1),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _editTasting(context, bottle),
                                  icon: const Icon(Icons.edit_note, size: 18),
                                  label: const Text('Noter / Commenter'),
                                  style: TextButton.styleFrom(foregroundColor: CellarColors.goldLight, textStyle: const TextStyle(fontSize: 12.5)),
                                ),
                                const Spacer(),
                                IconButton(
                                  icon: const Icon(Icons.undo_rounded, size: 18, color: CellarColors.textSecondary),
                                  tooltip: 'Remettre en cave',
                                  onPressed: () => _confirmRestore(context, bottle, cellar),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: CellarColors.textMuted),
                                  tooltip: 'Supprimer',
                                  onPressed: () => _confirmDelete(context, bottle, cellar),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
