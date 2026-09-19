import 'package:flutter/material.dart';
import '../models/wine_bottle.dart';
import '../theme/cellar_theme.dart';

class BottleCapsuleWidget extends StatelessWidget {
  final WineBottle bottle;
  final bool isBackRow;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const BottleCapsuleWidget({
    super.key,
    required this.bottle,
    this.isBackRow = false,
    required this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final wineType = bottle.wineType;
    final size = isBackRow ? 68.0 : 78.0;

    final capsuleWidget = Padding(
      padding: EdgeInsets.only(top: isBackRow ? 14.0 : 0),
      child: Container(
        width: isBackRow ? 92.0 : 106.0,
        margin: const EdgeInsets.symmetric(horizontal: 6.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
          // Rendu visuel de la capsule en relief
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                center: const Alignment(-0.25, -0.3),
                radius: 0.85,
                colors: [
                  wineType.highlightColor,
                  wineType.primaryColor,
                  wineType.secondaryColor,
                ],
                stops: const [0.0, 0.45, 1.0],
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isBackRow ? 0.3 : 0.6),
                  blurRadius: isBackRow ? 6 : 10,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: wineType.primaryColor.withValues(alpha: isBackRow ? 0.1 : 0.4),
                  blurRadius: 12,
                  spreadRadius: -2,
                  offset: const Offset(0, 2),
                ),
              ],
              border: Border.all(
                color: isBackRow
                    ? CellarColors.brassRail.withValues(alpha: 0.4)
                    : CellarColors.gold.withValues(alpha: 0.9),
                width: isBackRow ? 1.5 : 2.2,
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Cercle gravé intérieur
                Container(
                  width: size * 0.72,
                  height: size * 0.72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                      width: 1.0,
                    ),
                  ),
                ),
                // Millésime ou icône centrale
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      bottle.vintage != null
                          ? '${bottle.vintage}'
                          : wineType.iconEmoji,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: bottle.vintage != null
                            ? (isBackRow ? 13 : 15)
                            : (isBackRow ? 17 : 19),
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                        shadows: const [
                          Shadow(
                            color: Colors.black54,
                            blurRadius: 4,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                    if (bottle.vintage != null)
                      Text(
                        wineType.shortLabel.toUpperCase(),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.95),
                          fontSize: isBackRow ? 7.5 : 8.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                          shadows: const [
                            Shadow(
                              color: Colors.black54,
                              blurRadius: 3,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 7),
          // Nom du vin / Château
          Text(
            bottle.name,
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: isBackRow
                  ? CellarColors.textSecondary
                  : CellarColors.textPrimary,
              fontSize: isBackRow ? 11.5 : 12.5,
              fontWeight: isBackRow ? FontWeight.w500 : FontWeight.w600,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 2),
          // Appellation
          if (bottle.appellation.isNotEmpty)
            Text(
              bottle.appellation,
              maxLines: 1,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: CellarColors.textMuted,
                fontSize: isBackRow ? 9.5 : 10.5,
                fontWeight: FontWeight.w400,
              ),
            ),
        ],
      ),
    ),
    );

    return LongPressDraggable<WineBottle>(
      data: bottle,
      feedback: Material(
        color: Colors.transparent,
        child: Transform.scale(
          scale: 1.1,
          child: Opacity(
            opacity: 0.9,
            child: capsuleWidget,
          ),
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.3,
        child: capsuleWidget,
      ),
      onDragStarted: () {
        // Feedback tactile optionnel
      },
      child: GestureDetector(
        onTap: onTap,
        onLongPress: onLongPress,
        child: capsuleWidget,
      ),
    );
  }
}
