import {
  Film, Atom, Globe, Trophy, Palette, Scroll, Star, Map as MapIcon, Landmark, Shield,
  Music, BookOpen, Flag, Plane, Heart, Lightbulb, Utensils, Mountain, Leaf, Rocket,
  Camera, Gamepad2, Medal, Compass,
} from 'lucide-react';

// Icone selezionabili per gli spicchi (le prime 6 sono quelle delle categorie predefinite)
export const CATEGORY_ICONS = {
  Film, Atom, Globe, Trophy, Palette, Scroll, Star, Map: MapIcon, Landmark, Shield,
  Music, BookOpen, Flag, Plane, Heart, Lightbulb, Utensils, Mountain, Leaf, Rocket,
  Camera, Gamepad2, Medal, Compass,
};

export const ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const getCategoryIcon = (name) => CATEGORY_ICONS[name] || Star;

// Colori proposti per i nuovi spicchi
export const CATEGORY_COLORS = [
  '#E91E63', '#4CAF50', '#2196F3', '#FF9800', '#795548', '#FFC107',
  '#00BCD4', '#9C27B0', '#F44336', '#3F51B5', '#009688', '#607D8B',
];
