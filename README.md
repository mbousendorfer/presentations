# Présentations

Mes présentations, une par dossier. Chacune est une page HTML autonome : pas de
build, pas de dépendances, ouvrable en double-cliquant sur le fichier.

Le site est publié sur GitHub Pages à chaque push sur `main`.

## Ajouter une présentation

1. Créer un dossier à la racine — son nom devient l'URL (`/mon-sujet/`).
2. Y mettre un `index.html`. C'est le seul fichier obligatoire.
3. Ajouter un `meta.json` à côté pour soigner la vignette sur la page d'accueil :

```json
{
  "title": "Design Tokens V3",
  "subtitle": "Refonte des tokens & de la palette de couleurs",
  "description": "Une phrase de contexte.",
  "date": "2026-08-12",
  "tags": ["Design System", "Tokens"],
  "accent": "#FF6726"
}
```

Sans `meta.json`, le titre est repris du `<title>` de la page, et à défaut du
nom du dossier. Le nombre de slides est compté automatiquement.

4. Pousser. L'index se régénère tout seul.

## Structure

```
.
├─ index.html              ← généré, ne pas éditer à la main
├─ scripts/build-index.mjs ← le générateur (Node, sans dépendance)
├─ assets/fonts/           ← Averta Std, partagée par les pages
├─ explo-v3-tokens/        ← une présentation
│  ├─ index.html
│  ├─ meta.json
│  └─ img/
└─ .github/workflows/      ← déploiement Pages
```

## Vérifier en local

```bash
node scripts/build-index.mjs
python3 -m http.server 8787
```

Puis ouvrir <http://localhost:8787>.

## Naviguer dans une présentation

`←` `→` ou espace pour avancer · `O` le plan · `F` le plein écran ·
`E` le mode édition (clic sur un texte, `⌘S` télécharge la version modifiée) ·
un chiffre pour sauter à une slide.

## Note

Les pages embarquent **Averta Std**, la police de marque Agorapulse, sous
licence commerciale. Le site étant accessible publiquement par URL, vérifier que
la licence le permet avant d'ajouter des présentations destinées à circuler
au-delà de l'entreprise.
