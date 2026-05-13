# UI-Library

Bibliothèque JavaScript d'effets UX/UI avancés utilisant des prototypes et des classes constructeurs.

## Auteur

Thibaut Lombard

## Description

UI-Library est une bibliothèque JavaScript légère qui implémente des effets d'interface utilisateur modernes et fluides. Elle s'inspire des principes du livre "Secrets of the JavaScript Ninja" pour offrir une architecture propre basée sur les prototypes et les patterns de conception avancés.

## Fonctionnalités

### Lampe Magique
Effet de minimisation/restauration de fenêtre inspiré des génies des lampes magiques :
- Animation directionnelle qui sort du bord opposé du bouton
- Déformation symétrique avec skew dynamique
- Clip-path progressif pour un effet de pincement
- Fenêtre et bouton déplaçables
- Paramètres configurables (durée, intensité, glassmorphism)

### Windows Wobble
Effet élastique liquide inspiré de Compiz Fusion :
- Physique de ressort amortie
- Déformation skew et rotation pendant le déplacement
- Gestion du drag & drop fluide
- Support multi-fenêtres avec gestion du z-index
- Thèmes clair/sombre
- Paramètres physiques ajustables (ressort, amortissement, rotation)

## Architecture

La bibliothèque utilise une approche orientée prototype avec :

- **Utils** : Fonctions utilitaires (extend, clamp, lerp, etc.)
- **DragManager** : Gestionnaire de drag & drop réutilisable
- **PositionDetector** : Module singleton pour la détection de direction
- **AnimationConfig** : Singleton de configuration des animations
- **GenieAnimator** : Générateur d'animations keyframes dynamiques
- **LampeMagique** : Classe principale pour l'effet lampe magique
- **WobblyWindow** : Classe pour les fenêtres à effet wobble
- **WobblyWindowManager** : Gestionnaire de multiples fenêtres wobbly

## Installation

Incluez simplement le fichier JavaScript dans votre page HTML :

```html
<script src="UI-Library.js"></script>
```

## Utilisation

### Lampe Magique

```javascript
// Initialisation
const lampe = UILibrary.createLampeMagique('#monElement', {
    duration: 700,
    skewIntensity: 50,
    glassEnabled: true
});

// Contrôles
lampe.minimize();
lampe.restore();
lampe.setDuration(1000);
lampe.setSkewIntensity(75);
lampe.setGlassEnabled(false);
```

### Windows Wobble

```javascript
// Initialisation d'une fenêtre
const window = UILibrary.createWobblyWindow(element, {
    springSpeed: 0.15,
    damping: 0.85,
    rotationFactor: 0.3
});

// Modification des paramètres physiques
window.setParams({
    springSpeed: 0.2,
    damping: 0.9
});

// Actions
window.toggleMaximize();
window.minimize();
window.restore();
```

### WobblyWindowManager

```javascript
// Création du manager
const manager = UILibrary.createWobblyWindowManager({
    container: document.body,
    themeToggle: document.getElementById('themeToggle')
});

// Ajout de fenêtres
manager.addWindow(element1);
manager.addWindow(element2);

// Gestion du thème
manager.toggleTheme();

// Mettre une fenêtre au premier plan
manager.bringToFront(element);
```

## Structure des Fichiers

```
/workspace/
├── UI-Library.js          # Bibliothèque principale
├── demo-ui-library.html   # Page de démonstration complète
├── lampe_magique.html     # Version originale lampe magique
└── windows_wobble.html    # Version originale windows wobble
```

## API Référence

### Utils

| Méthode | Description |
|---------|-------------|
| `extend(target, source)` | Fusionne deux objets |
| `getCenter(element)` | Retourne le centre d'un élément |
| `clamp(value, min, max)` | Normalise une valeur entre min et max |
| `lerp(start, end, t)` | Interpolation linéaire |

### DragManager

| Méthode | Description |
|---------|-------------|
| `setEnabled(enabled)` | Active/désactive le drag |
| `isDragging()` | Vérifie si en cours de drag |
| `getPosition()` | Retourne la position actuelle |
| `destroy()` | Nettoie les événements |

### LampeMagique

| Méthode | Description |
|---------|-------------|
| `minimize()` | Minimise la fenêtre |
| `restore()` | Restaure la fenêtre |
| `setDuration(ms)` | Définit la durée d'animation |
| `setSkewIntensity(value)` | Définit l'intensité du skew |
| `setGlassEnabled(enabled)` | Active/désactive l'effet glass |

### WobblyWindow

| Méthode | Description |
|---------|-------------|
| `toggleMaximize()` | Bascule entre normal/maximisé |
| `minimize()` | Minimise la fenêtre |
| `restore()` | Affiche la fenêtre |
| `setParams(params)` | Modifie les paramètres physiques |

### WobblyWindowManager

| Méthode | Description |
|---------|-------------|
| `addWindow(element, options)` | Ajoute une fenêtre au manager |
| `getWindow(index)` | Récupère une fenêtre par index |
| `setActiveWindow(index)` | Active une fenêtre spécifique |
| `bringToFront(element)` | Met la fenêtre au premier plan |
| `toggleTheme()` | Bascule entre thèmes clair/sombre |

## Démonstration

Ouvrez `demo-ui-library.html` dans un navigateur moderne pour voir tous les effets en action avec :
- Menu latéral de navigation
- Panneaux de contrôle interactifs
- Liens vers les versions originales
- Interface moderne et élégante

## Compatibilité Navigateurs

- Chrome (recommandé)
- Firefox
- Safari
- Edge

Nécessite un navigateur supportant :
- CSS backdrop-filter
- ES6+
- requestAnimationFrame

## License

Usage libre pour projets personnels et commerciaux.

## Remerciements

Inspiré par les concepts avancés de manipulation DOM et d'animations présentés dans la littérature JavaScript spécialisée.
