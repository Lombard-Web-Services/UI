# UI-Library

> Bibliothèque JavaScript d'effets UX/UI avancés — Fenêtres magiques, déformations élastiques et glassmorphism

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License MIT">
  <img src="https://img.shields.io/badge/lang-JavaScript-yellow?style=flat-square&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-orange?style=flat-square" alt="Navigateurs">
</p>

<p align="center">
  <strong>🪔 Lampe Magique</strong> · <strong>🌀 Wobbly Windows</strong> · <strong>🔮 Combo Window</strong>
</p>

---

## Présentation

**UI-Library** est une bibliothèque JavaScript légère qui implémente des effets d'interface utilisateur modernes et fluides. Elle s'inspire des principes du livre *"Secrets of the JavaScript Ninja"* pour offrir une architecture propre basée sur les **prototypes**, les **classes constructeurs** et les **patterns de conception avancés**.

Cette bibliothèque propose trois modules principaux :

| Module | Description | Inspiration |
|--------|-------------|-------------|
| 🪔 **Lampe Magique** | Effet de minimisation/restauration directionnel avec déformation symétrique | Génie des lampes magiques (macOS Genie Effect) |
| 🌀 **Wobbly Windows** | Déformation élastique liquide au drag & drop | Compiz Fusion (Linux) |
| 🔮 **Combo Window** | Combinaison des deux effets sur une même fenêtre | — |

---

## Démonstration en ligne

Ouvrez `demo-ui.html` dans un navigateur moderne pour explorer tous les effets avec :

- Navigation par onglets entre les trois modules
- Panneaux de contrôle interactifs en temps réel
- Thème clair/sombre global
- Drag & drop fluide sur toutes les fenêtres

---

## Installation

Incluez simplement les fichiers dans votre page HTML :

```html
<link rel="stylesheet" href="UI-Library.css">
<script src="UI-Library.js"></script>
```

> **Prérequis** : Navigateur moderne supportant `CSS backdrop-filter`, `ES6+` et `requestAnimationFrame`.

---

## Lampe Magique (Genie Effect)

Animation de minimisation/restauration où la fenêtre semble être aspirée vers le bouton, puis réapparaît depuis le bord opposé.

### Caractéristiques

- 🧭 **Directionnel** — La fenêtre sort du bord opposé du bouton
- 🪞 **Déformation symétrique** — Skew dynamique selon la direction
- ✂️ **Clip-path progressif** — Effet de pincement réaliste
- 🖱️ **Drag & drop fluide** — Fenêtre et bouton déplaçables
- 🎛️ **Paramètres configurables** — Durée, intensité, glassmorphism

### Utilisation

```javascript
const genie = new UILibrary.GenieEffect(windowElement, buttonElement, {
    duration: 700,        // Durée de l'animation (ms)
    skewIntensity: 50,    // Intensité de la déformation (°)
    glassEnabled: true    // Activer l'effet glassmorphism
});

// Actions
genie.minimize();   // Minimiser vers le bouton
genie.restore();    // Restaurer depuis le bord opposé
genie.toggle();     // Basculer l'état

// Mise à jour des paramètres
genie.updateOptions({
    duration: 1000,
    skewIntensity: 75,
    glassEnabled: false
});
```

---

## Wobbly Windows (Compiz Style)

Effet élastique liquide inspiré de Compiz Fusion : la fenêtre elle-même se déforme comme de la gelée pendant le déplacement.

### Caractéristiques

- 💧 **Physique de ressort amortie** — Retour élastique naturel
- 🔄 **Déformation skew + rotation** — Réaction à la vélocité du mouvement
- 📐 **Scale directionnel** — Étirement dans la direction du drag
- 🪟 **Multi-fenêtres** — Gestion du z-index et focus
- 🌓 **Thèmes clair/sombre** — Basculage dynamique
- 🎛️ **Paramètres physiques ajustables** — Ressort, amortissement, force

### Utilisation

```javascript
const wobbly = new UILibrary.WobblyWindow(windowElement, {
    intensity: 1.2,     // Intensité globale du wobble
    springSpeed: 0.14,  // Vitesse de rappel élastique
    damping: 0.89,      // Amortissement
    dragForce: 2.0      // Force de traction
});

// Actions
wobbly.bringToFront();      // Mettre au premier plan
wobbly.toggleMaximize();    // Basculer normal/maximisé
wobbly.resetTransform();    // Réinitialiser la déformation

// Mise à jour des paramètres
wobbly.updateParams({
    intensity: 1.5,
    springSpeed: 0.20,
    damping: 0.85
});
```

---

## Combo Window

Combine les deux effets précédents sur une même fenêtre : minimisation magique **et** déformation élastique au déplacement.

### Utilisation

```javascript
const combo = new UILibrary.ComboWindow(windowElement, buttonElement, {
    // Options Genie
    duration: 700,
    skewIntensity: 50,
    glassEnabled: true,
    // Options Wobbly
    wobblyIntensity: 1.2,
    springSpeed: 0.14,
    damping: 0.89,
    dragForce: 2.0,
    wobblyEnabled: true
});

// Actions
combo.minimize();
combo.restore();
combo.toggle();
combo.toggleMaximize();

// Mise à jour séparée des options
combo.updateGenieOptions({ duration: 1000 });
combo.updateWobblyOptions({ intensity: 1.5, wobblyEnabled: false });
```

---

## Architecture

La bibliothèque utilise une approche orientée **prototype** et **classes constructeurs** :

| Composant | Rôle |
|-----------|------|
| `DragManager` | Gestionnaire de drag & drop réutilisable avec contraintes de bordure |
| `PositionDetector` | Singleton de détection de direction relative (bouton ↔ fenêtre) |
| `GenieAnimator` | Générateur dynamique de keyframes CSS pour les animations |
| `GenieEffect` | Classe principale de l'effet lampe magique |
| `WobblyWindow` | Classe de la fenêtre à effet élastique avec boucle physique |
| `ComboWindow` | Agrégation de GenieEffect + WobblyWindow avec synchronisation |

---

## 📁 Structure des fichiers

```
UI/
├── UI-Library.js          # Bibliothèque principale (modules Genie + Wobbly + Combo)
├── UI-Library.css         # Styles partagés (fenêtres, glassmorphism, thèmes)
├── demo-ui.html           # Démonstration complète des 3 modules
├── lampe_magique.html     # Version standalone de la Lampe Magique
└── windows_wobble.html    # Version standalone des Wobbly Windows
```

---

## Paramètres disponibles

### GenieEffect

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `duration` | `number` | `700` | Durée de l'animation en millisecondes |
| `skewIntensity` | `number` | `50` | Intensité de la déformation skew (degrés) |
| `glassEnabled` | `boolean` | `true` | Active l'effet glassmorphism |

### WobblyWindow

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `intensity` | `number` | `1.2` | Intensité globale de la déformation |
| `springSpeed` | `number` | `0.14` | Vitesse de rappel vers la forme initiale |
| `damping` | `number` | `0.89` | Coefficient d'amortissement (0–1) |
| `dragForce` | `number` | `2.0` | Force de réaction au mouvement |

---

## Compatibilité

| Navigateur | Support |
|------------|---------|
| Chrome | ✅ Recommandé |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |

---

## 📄 Licence

MIT License — © Thibaut Lombard

Usage libre pour projets personnels et commerciaux.

---

## Credits

- **Moult-AI Enterprise** — Orchestration
- **Qwen-intl** — Assistance GH & Bug fixes
- **DeepSeek** — Assistance développement
- **Kimi** — Assistance développement
- **Grok** — Assistance développement

> Inspiré par les concepts avancés de manipulation DOM et d'animations présentés dans la littérature JavaScript spécialisée.

---

<p align="center">
  <sub>Conçu avec 🧞 et 🍮 par <strong>Thibaut Lombard</strong></sub>
</p>
