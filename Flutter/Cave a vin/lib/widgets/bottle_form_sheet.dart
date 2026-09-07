import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/wine_bottle.dart';
import '../services/cellar_service.dart';
import '../theme/cellar_theme.dart';

class BottleFormSheet extends StatefulWidget {
  final WineBottle? bottleToEdit;
  final int? initialFloor;
  final BottleRow? initialRow;

  const BottleFormSheet({
    super.key,
    this.bottleToEdit,
    this.initialFloor,
    this.initialRow,
  });

  static void show(
    BuildContext context, {
    WineBottle? bottleToEdit,
    int? initialFloor,
    BottleRow? initialRow,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BottleFormSheet(
        bottleToEdit: bottleToEdit,
        initialFloor: initialFloor,
        initialRow: initialRow,
      ),
    );
  }

  @override
  State<BottleFormSheet> createState() => _BottleFormSheetState();
}

class _BottleFormSheetState extends State<BottleFormSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _appellationController;
  late TextEditingController _vintageController;
  late TextEditingController _regionController;
  late TextEditingController _optimalYearController;
  late TextEditingController _notesController;

  late WineType _selectedWineType;
  late int _selectedFloor;
  late BottleRow _selectedRow;

  @override
  void initState() {
    super.initState();
    final b = widget.bottleToEdit;

    _nameController = TextEditingController(text: b?.name ?? '');
    _appellationController =
        TextEditingController(text: b?.appellation ?? '');
    _vintageController = TextEditingController(
        text: b?.vintage != null ? b!.vintage.toString() : '');
    _regionController = TextEditingController(text: b?.region ?? '');
    _optimalYearController = TextEditingController(
        text: b?.optimalYear != null ? b!.optimalYear.toString() : '');
    _notesController = TextEditingController(text: b?.notes ?? '');

    _selectedWineType = b?.wineType ?? WineType.rouge;
    _selectedFloor = b?.floor ?? widget.initialFloor ?? 2;
    _selectedRow = b?.row ?? widget.initialRow ?? BottleRow.devant;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _appellationController.dispose();
    _vintageController.dispose();
    _regionController.dispose();
    _optimalYearController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final cellar = context.read<CellarService>();
    final vintageInt = int.tryParse(_vintageController.text.trim());
    final optimalYearInt = int.tryParse(_optimalYearController.text.trim());

    if (widget.bottleToEdit != null) {
      final updated = widget.bottleToEdit!.copyWith(
        name: _nameController.text.trim(),
        appellation: _appellationController.text.trim(),
        vintage: vintageInt,
        wineType: _selectedWineType,
        floor: _selectedFloor,
        row: _selectedRow,
        region: _regionController.text.trim(),
        optimalYear: optimalYearInt,
        notes: _notesController.text.trim(),
      );
      cellar.updateBottle(updated);
    } else {
      cellar.addBottle(
        name: _nameController.text.trim(),
        appellation: _appellationController.text.trim(),
        vintage: vintageInt,
        wineType: _selectedWineType,
        floor: _selectedFloor,
        row: _selectedRow,
        region: _regionController.text.trim(),
        optimalYear: optimalYearInt,
        notes: _notesController.text.trim(),
      );
    }

    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: CellarColors.surfaceLight,
        content: Text(
          widget.bottleToEdit != null
              ? '✓ Bouteille modifiée'
              : '✓ Bouteille ajoutée à l\'Étage $_selectedFloor (${_selectedRow.label})',
          style: const TextStyle(color: CellarColors.goldLight),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.bottleToEdit != null;

    return Container(
      decoration: const BoxDecoration(
        color: CellarColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: CellarColors.surfaceBorder, width: 1.5),
        ),
      ),
      padding: EdgeInsets.only(
        left: 22,
        right: 22,
        top: 14,
        bottom: MediaQuery.of(context).viewInsets.bottom + 26,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Poignée
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    margin: const EdgeInsets.only(bottom: 18),
                    decoration: BoxDecoration(
                      color: CellarColors.surfaceBorder,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),

                // Titre
                Text(
                  isEditing ? 'Modifier la bouteille' : 'Ajouter une bouteille',
                  style: const TextStyle(
                    color: CellarColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 18),

                // Sélection du type de vin (Chips colorées)
                const Text(
                  'TYPE DE VIN',
                  style: TextStyle(
                    color: CellarColors.goldLight,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: WineType.values.map((type) {
                    final isSelected = _selectedWineType == type;
                    return ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(type.iconEmoji,
                              style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(type.shortLabel),
                        ],
                      ),
                      selected: isSelected,
                      selectedColor: type.primaryColor,
                      backgroundColor: CellarColors.surfaceLight,
                      labelStyle: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : CellarColors.textSecondary,
                        fontWeight:
                            isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedWineType = type);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),

                // Nom du Vin / Domaine (Obligatoire)
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Nom du vin ou Domaine *',
                    hintText: 'ex: Château Chasse-Spleen',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Veuillez renseigner le nom du vin';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                // Appellation & Millésime
                Row(
                  children: [
                    Expanded(
                      flex: 6,
                      child: TextFormField(
                        controller: _appellationController,
                        decoration: const InputDecoration(
                          labelText: 'Appellation',
                          hintText: 'ex: Moulis-en-Médoc',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 4,
                      child: TextFormField(
                        controller: _vintageController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Millésime',
                          hintText: 'ex: 2018',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Emplacement : Étage & Rangée
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CellarColors.surfaceLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: CellarColors.surfaceBorder,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'EMPLACEMENT DANS LA CAVE',
                        style: TextStyle(
                          color: CellarColors.goldLight,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Étage
                      Row(
                        children: [
                          const Text('Étage : ',
                              style: TextStyle(
                                  color: CellarColors.textSecondary,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [1, 2, 3, 4].map((f) {
                                final isSelected = _selectedFloor == f;
                                return ChoiceChip(
                                  label: Text('$f'),
                                  selected: isSelected,
                                  selectedColor: CellarColors.gold,
                                  labelStyle: TextStyle(
                                    color: isSelected
                                        ? Colors.black
                                        : CellarColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  onSelected: (selected) {
                                    if (selected) {
                                      setState(() => _selectedFloor = f);
                                    }
                                  },
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      // Rangée (Fond / Devant)
                      Row(
                        children: [
                          const Text('Rangée : ',
                              style: TextStyle(
                                  color: CellarColors.textSecondary,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Row(
                              children: [
                                BottleRow.devant,
                                BottleRow.fond,
                              ].map((r) {
                                final isSelected = _selectedRow == r;
                                return Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 4.0),
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
                                        if (selected) {
                                          setState(() => _selectedRow = r);
                                        }
                                      },
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Région & Année d'apogée
                Row(
                  children: [
                    Expanded(
                      flex: 6,
                      child: TextFormField(
                        controller: _regionController,
                        decoration: const InputDecoration(
                          labelText: 'Région / Vigneron',
                          hintText: 'ex: Bordeaux',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 4,
                      child: TextFormField(
                        controller: _optimalYearController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Apogée',
                          hintText: 'ex: 2028',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Notes
                TextFormField(
                  controller: _notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes personnelles',
                    hintText: 'ex: Cadeau d\'anniversaire, à carafer 1h...',
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 24),

                // GROS BOUTON ENREGISTRER
                ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CellarColors.wineRed,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    isEditing
                        ? 'Enregistrer les modifications'
                        : 'Mettre en cave',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
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
