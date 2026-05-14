# UI-Library

<p align="center">
  <a href="https://lombard-web-services.github.io/UI/demo-ui.html">
    <img src="https://github.com/Lombard-Web-Services/UI/blob/main/UI-library.gif?raw=true" alt="UI-Library Demo">
  </a>
</p>

<p align="center"><strong>Bibliothèque JavaScript d'effets UX/UI avancés — Lampe magiques, déformations élastiques fenêtres wobbly et glassmorphism</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License MIT">
  <img src="https://img.shields.io/badge/lang-JavaScript-yellow?style=flat-square&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-orange?style=flat-square" alt="Navigateurs">
</p>

<p align="center">
  <strong>🪔 Lampe Magique</strong> · <strong>🌀 Wobbly Windows</strong> · <strong>🔮 Combo Window</strong>
</p>

<p align="center">Demo en ligne : <a href="https://lombard-web-services.github.io/UI/demo-ui.html" target="_blank">ICI</a></p>

---

## Presentation

UI-Library est une bibliotheque JavaScript modulaire qui reproduit deux effets de fenetres emblematiques des bureaux graphiques modernes : l'effet Genie de macOS et l'effet Wobbly Windows de Compiz. Ces effets sont implementes en pur JavaScript, sans dependance externe, et peuvent etre integres dans n'importe quel projet Web.

Le projet se compose de trois modules independants qui peuvent etre utilises seuls ou combines :

- **GenieEffect** : Effet de minimisation/restauration directionnel avec deformation elastique
- **WobblyWindow** : Effet de deformation physique a la traction (style Compiz)
- **ComboWindow** : Combinaison des deux effets precedents

## Table des matieres

- [Installation](#installation)
- [Modules](#modules)
  - [GenieEffect](#genieeffect)
  - [WobblyWindow](#wobblywindow)
  - [ComboWindow](#combowindow)
- [API de reference](#api-de-reference)
- [Demonstration](#demonstration)
- [Structure du projet](#structure-du-projet)
- [Credits](#credits)
- [Licence](#licence)

---

## Installation

### Inclusion directe

Telechargez les fichiers `UI-Library.js` et `UI-Library.css`, puis incluez-les dans votre page HTML :

```html
<link rel="stylesheet" href="UI-Library.css">
<script src="UI-Library.js"></script>
```

La bibliotheque s'auto-instancie dans l'objet global `UILibrary`.

### Verification

Apres inclusion, verifiez que la bibliotheque est chargee :

```javascript
console.log(UILibrary.version); // "1.0.0"
```

---

## Modules

### GenieEffect

Reproduit l'effet Genie de macOS : la fenetre se deforme et se retracte vers un bouton de controle avec une animation directionnelle. La restauration fait emerger la fenetre depuis le bord oppose du bouton.

#### Utilisation de base

```html
<div id="maFenetre" class="window">
    <div class="title-bar">
        <div class="window-buttons">
            <div class="window-btn close"></div>
            <div class="window-btn minimize-btn"></div>
            <div class="window-btn maximize"></div>
        </div>
        <div class="title-text">Ma Fenetre</div>
    </div>
    <div class="content">
        <p>Contenu de la fenetre</p>
    </div>
</div>

<button id="monBouton" class="control-btn">Minimiser</button>
```

```javascript
var genie = new UILibrary.GenieEffect(
    document.getElementById('maFenetre'),
    document.getElementById('monBouton'),
    {
        duration: 700,
        skewIntensity: 50,
        glassEnabled: true
    }
);
```

#### Options

| Option | Type | Defaut | Description |
|--------|------|--------|-------------|
| `duration` | Number | 700 | Duree de l'animation en millisecondes |
| `skewIntensity` | Number | 50 | Intensite de la deformation en degres |
| `glassEnabled` | Boolean | true | Active l'effet glassmorphism |

#### Methodes

| Methode | Description |
|---------|-------------|
| `minimize()` | Minimise la fenetre vers le bouton |
| `restore()` | Restaure la fenetre depuis le bord oppose du bouton |
| `toggle()` | Bascule entre minimise et restaure |
| `updateOptions(options)` | Met a jour les options en temps reel |
| `destroy()` | Detruit l'instance et nettoie le DOM |

#### Fonctionnalites

- **Direction automatique** : La direction de l'animation est calculee automatiquement en fonction de la position relative du bouton et de la fenetre (haut, bas, gauche, droite).
- **Deformation symetrique** : La fenetre se pince et se deforme de maniere symetrique pendant l'animation.
- **Drag and drop** : La fenetre et le bouton sont deplacables par glisser-deposer.
- **Sauvegarde de position** : La position de la fenetre est conservee lors de la minimisation et restauree a l'identique.

---

### WobblyWindow

Reproduit l'effet Wobbly Windows de Compiz : la fenetre entiere se deforme elastiquement lorsqu'on la deplace, comme de la gelatine. Un moteur physique a ressort assure le retour a la forme initiale.

#### Utilisation de base

```html
<div class="wobbly-window" id="fenetre1">
    <div class="window-surface">
        <div class="window-titlebar" data-drag-handle>
            <span class="window-title">Titre de la fenetre</span>
            <div class="window-controls">
                <button class="window-btn btn-close" data-action="close">x</button>
                <button class="window-btn btn-minimize" data-action="minimize">-</button>
                <button class="window-btn btn-maximize" data-action="maximize">[]</button>
            </div>
        </div>
        <div class="window-content">
            <p>Contenu de la fenetre</p>
        </div>
    </div>
</div>
```

```javascript
var wobbly = new UILibrary.WobblyWindow(
    document.getElementById('fenetre1'),
    {
        intensity: 1.2,
        springSpeed: 0.14,
        damping: 0.89,
        dragForce: 2.0
    }
);
```

#### Options

| Option | Type | Defaut | Description |
|--------|------|--------|-------------|
| `intensity` | Number | 1.2 | Intensite globale de la deformation |
| `springSpeed` | Number | 0.14 | Vitesse de rappel elastique |
| `damping` | Number | 0.89 | Coefficient d'amortissement |
| `dragForce` | Number | 2.0 | Force de traction lors du deplacement |
| `maxSkew` | Number | 14 | Inclinaison maximale en degres |
| `maxScale` | Number | 0.12 | Etirement maximal |

#### Methodes

| Methode | Description |
|---------|-------------|
| `bringToFront()` | Place la fenetre au premier plan |
| `toggleMaximize()` | Bascule entre taille normale et maximise |
| `updateParams(params)` | Met a jour les parametres physiques |
| `resetTransform()` | Reinitialise la transformation |
| `setActive(boolean)` | Active ou desactive l'effet wobbly |

#### Fonctionnalites

- **Deformation physique** : Scale, skew et rotation calcules en fonction de la vitesse de deplacement.
- **Moteur a ressort** : Retour elastique avec amortissement physique.
- **Ondulation en temps reel** : Effet de vague supplementaire lors des deplacements rapides.
- **Gestion du focus** : Clic pour mettre au premier plan.
- **Maximisation** : Support du mode plein ecran avec animation.

---

### ComboWindow

Combine les effets Genie et Wobbly dans une seule fenetre. L'effet Wobbly est desactive pendant les animations Genie pour eviter les conflits, puis reactive automatiquement.

#### Utilisation de base

```javascript
var combo = new UILibrary.ComboWindow(
    document.getElementById('maFenetreCombo'),
    document.getElementById('monBoutonCombo'),
    {
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
    }
);
```

#### Methodes

| Methode | Description |
|---------|-------------|
| `minimize()` | Minimise avec effet Genie |
| `restore()` | Restaure avec effet Genie |
| `toggle()` | Bascule minimise/restaure |
| `toggleMaximize()` | Bascule plein ecran |
| `bringToFront()` | Met au premier plan |
| `updateGenieOptions(options)` | Met a jour les options Genie |
| `updateWobblyOptions(options)` | Met a jour les options Wobbly |
| `reposition()` | Recalcule la position |
| `isWobblyEnabled()` | Retourne l'etat de l'effet Wobbly |

---

## API de reference

### DragManager (interne)

Gestionnaire de drag and drop fluide utilise par tous les modules.

| Methode | Description |
|---------|-------------|
| `setEnabled(boolean)` | Active ou desactive le drag |
| `isDragging()` | Retourne l'etat du drag |

### PositionDetector (interne)

Utilitaire de detection de direction pour les animations.

| Methode | Description |
|---------|-------------|
| `getDirection(buttonRect, windowRect)` | Calcule la direction relative |
| `getClipPath(direction, progress)` | Genere le clip-path de deformation |
| `getStartPosition(buttonRect, targetRect, direction)` | Calcule la position de depart |
| `getSkew(direction, intensity, progress)` | Calcule l'inclinaison |

---

## Demonstration

Le projet inclut trois pages de demonstration :

| Fichier | Description |
|---------|-------------|
| `lampe_magique.html` | Demonstration isolee de l'effet Genie |
| `windows_wobble.html` | Demonstration isolee de l'effet Wobbly |
| `demo-ui.html` | Demonstration combinee avec navigation par onglets |

Ouvrez `demo-ui.html` dans un navigateur pour tester l'ensemble des fonctionnalites. La page propose :

- Navigation entre les trois sections (Lampe Magique, Wobbly Windows, Combo)
- Panneaux de controle en temps reel pour ajuster les parametres
- Basculement entre theme sombre et theme clair
- Deplacement libre des fenetres et des boutons de controle

**Demo en ligne :** [https://lombard-web-services.github.io/UI/demo-ui.html](https://lombard-web-services.github.io/UI/demo-ui.html)

---

## Structure du projet

```
ui-library/
|-- UI-Library.js      # Bibliotheque principale (modules + moteur physique)
|-- UI-Library.css     # Styles de base (glassmorphism, themes, controles)
|-- demo-ui.html       # Demonstration combinee avec navigation
|-- lampe_magique.html # Demonstration Genie Effect autonome
|-- windows_wobble.html# Demonstration Wobbly Windows autonome
```

### Dependances

Aucune. UI-Library est ecrit en pur JavaScript (ES5) et CSS3, compatible avec tous les navigateurs modernes.

### Compatibilite

- Chrome / Edge / Opera (recommande)
- Firefox
- Safari
- Navigateurs mobiles (avec limitations sur le drag)

---

## Credits

- **Moult-AI Enterprise** — Orchestration
- **Qwen-intl** — Assistance GitHub et correction de bugs
- **DeepSeek** — Assistance developpement
- **Kimi** — Assistance developpement
- **Grok** — Assistance developpement

Inspire par les concepts avances de manipulation DOM et d'animations presentes dans la litterature JavaScript specialisee.

---

## Licence

Ce projet est distribue sous licence libre. Voir le fichier de licence pour plus de details.

---

## Auteur

**Thibaut Lombard**

- Version : 1.0.0
- Date : 2026
