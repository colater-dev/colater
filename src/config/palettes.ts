/** Generated named palette library: 8 mood groups x 32 palettes. Edit freely; tests enforce contrast. */
export const PALETTE_GROUPS = [
  {
    "id": "calm",
    "label": "Calm & serene",
    "description": "soft, quiet, restful, airy, gentle"
  },
  {
    "id": "warm",
    "label": "Warm & friendly",
    "description": "welcoming, cozy, human, approachable"
  },
  {
    "id": "bold",
    "label": "Bold & energetic",
    "description": "high-energy, confident, punchy, sporty"
  },
  {
    "id": "premium",
    "label": "Premium & elegant",
    "description": "refined, luxurious, sophisticated, understated"
  },
  {
    "id": "playful",
    "label": "Playful & bright",
    "description": "fun, cheerful, youthful, colorful"
  },
  {
    "id": "tech",
    "label": "Tech & modern",
    "description": "digital, precise, clean, futuristic"
  },
  {
    "id": "earthy",
    "label": "Earthy & organic",
    "description": "natural, grounded, botanical, handmade"
  },
  {
    "id": "retro",
    "label": "Retro & vintage",
    "description": "nostalgic, classic, mid-century, warm-faded"
  }
] as const;

export type PaletteGroupId = (typeof PALETTE_GROUPS)[number]['id'];

export interface LibraryPalette {
  name: string;
  group: PaletteGroupId;
  tags: string[];
  colors: { primary: string; secondary: string; accent: string; background: string; ink: string };
}

export const PALETTES: LibraryPalette[] = [
  {
    "name": "Misty Morning",
    "group": "calm",
    "tags": [
      "tranquil",
      "fresh",
      "ethereal"
    ],
    "colors": {
      "primary": "#4A90A4",
      "secondary": "#7CB8C9",
      "accent": "#B8D8E0",
      "background": "#F7FCFD",
      "ink": "#1A3540"
    }
  },
  {
    "name": "Lavender Fields",
    "group": "calm",
    "tags": [
      "peaceful",
      "gentle",
      "soothing"
    ],
    "colors": {
      "primary": "#8B7BA8",
      "secondary": "#B5A8C8",
      "accent": "#D9D0E8",
      "background": "#FAF8FC",
      "ink": "#2D2438"
    }
  },
  {
    "name": "Ocean Whisper",
    "group": "calm",
    "tags": [
      "serene",
      "quiet",
      "flowing"
    ],
    "colors": {
      "primary": "#5B8FA3",
      "secondary": "#8FB4C4",
      "accent": "#C4DBE5",
      "background": "#F8FBFC",
      "ink": "#1E3642"
    }
  },
  {
    "name": "Soft Sage",
    "group": "calm",
    "tags": [
      "restful",
      "natural",
      "balanced"
    ],
    "colors": {
      "primary": "#6B9080",
      "secondary": "#95B5A8",
      "accent": "#C5D8D1",
      "background": "#F7FBF9",
      "ink": "#1F3229"
    }
  },
  {
    "name": "Pearl Horizon",
    "group": "calm",
    "tags": [
      "airy",
      "light",
      "spacious"
    ],
    "colors": {
      "primary": "#7A93AC",
      "secondary": "#A3B8CC",
      "accent": "#D1DCE8",
      "background": "#F9FBFD",
      "ink": "#23334A"
    }
  },
  {
    "name": "Powder Dream",
    "group": "calm",
    "tags": [
      "soft",
      "delicate",
      "tender"
    ],
    "colors": {
      "primary": "#A585A2",
      "secondary": "#C5B0C3",
      "accent": "#E3D8E1",
      "background": "#FCF9FB",
      "ink": "#3A2838"
    }
  },
  {
    "name": "Morning Dew",
    "group": "calm",
    "tags": [
      "fresh",
      "clean",
      "crisp"
    ],
    "colors": {
      "primary": "#5B9A8B",
      "secondary": "#8BBFB3",
      "accent": "#C0DDD6",
      "background": "#F6FCFA",
      "ink": "#1D3630"
    }
  },
  {
    "name": "Porcelain Sky",
    "group": "calm",
    "tags": [
      "quiet",
      "refined",
      "minimal"
    ],
    "colors": {
      "primary": "#6B8CAE",
      "secondary": "#97B1CC",
      "accent": "#C8D7E6",
      "background": "#F8FAFE",
      "ink": "#1F2F42"
    }
  },
  {
    "name": "Gentle Breeze",
    "group": "calm",
    "tags": [
      "airy",
      "calm",
      "flowing"
    ],
    "colors": {
      "primary": "#6B9B98",
      "secondary": "#A3C5C3",
      "accent": "#D1E5E4",
      "background": "#F8FDFC",
      "ink": "#213938"
    }
  },
  {
    "name": "Moonlit Lake",
    "group": "calm",
    "tags": [
      "tranquil",
      "still",
      "reflective"
    ],
    "colors": {
      "primary": "#5D7B9D",
      "secondary": "#8BA4BC",
      "accent": "#BFD0DF",
      "background": "#F7FAFE",
      "ink": "#1C2937"
    }
  },
  {
    "name": "Blush Cloud",
    "group": "calm",
    "tags": [
      "soft",
      "warm",
      "gentle"
    ],
    "colors": {
      "primary": "#B4858D",
      "secondary": "#D0B0B6",
      "accent": "#E8D8DB",
      "background": "#FDF9FA",
      "ink": "#3D2528"
    }
  },
  {
    "name": "Mint Frost",
    "group": "calm",
    "tags": [
      "cool",
      "fresh",
      "clean"
    ],
    "colors": {
      "primary": "#5E9C8A",
      "secondary": "#8BBFB0",
      "accent": "#BFE0D6",
      "background": "#F6FCFA",
      "ink": "#1C3530"
    }
  },
  {
    "name": "Silent Snow",
    "group": "calm",
    "tags": [
      "peaceful",
      "pure",
      "still"
    ],
    "colors": {
      "primary": "#7A93AB",
      "secondary": "#A8BBCE",
      "accent": "#D4E0EB",
      "background": "#F9FCFE",
      "ink": "#223449"
    }
  },
  {
    "name": "Eucalyptus Calm",
    "group": "calm",
    "tags": [
      "restful",
      "herbal",
      "balanced"
    ],
    "colors": {
      "primary": "#6E9287",
      "secondary": "#98B6AC",
      "accent": "#C7DBD4",
      "background": "#F7FBFA",
      "ink": "#1E322D"
    }
  },
  {
    "name": "Twilight Haze",
    "group": "calm",
    "tags": [
      "serene",
      "dreamy",
      "soft"
    ],
    "colors": {
      "primary": "#8580A0",
      "secondary": "#AEA8C0",
      "accent": "#D6D2E3",
      "background": "#FAF9FD",
      "ink": "#2B2738"
    }
  },
  {
    "name": "Cloud Nine",
    "group": "calm",
    "tags": [
      "airy",
      "light",
      "uplifting"
    ],
    "colors": {
      "primary": "#7194B4",
      "secondary": "#A5BED5",
      "accent": "#D3E4EE",
      "background": "#F8FCFE",
      "ink": "#1F3347"
    }
  },
  {
    "name": "Stone Garden",
    "group": "calm",
    "tags": [
      "grounded",
      "quiet",
      "zen"
    ],
    "colors": {
      "primary": "#7B8C8D",
      "secondary": "#A5B3B4",
      "accent": "#D1DADB",
      "background": "#F8FAFB",
      "ink": "#262F30"
    }
  },
  {
    "name": "Rose Petal",
    "group": "calm",
    "tags": [
      "delicate",
      "tender",
      "romantic"
    ],
    "colors": {
      "primary": "#B18393",
      "secondary": "#D0AFB9",
      "accent": "#E8D9DE",
      "background": "#FDF9FB",
      "ink": "#3A2529"
    }
  },
  {
    "name": "Seafoam Rest",
    "group": "calm",
    "tags": [
      "coastal",
      "gentle",
      "soothing"
    ],
    "colors": {
      "primary": "#589B97",
      "secondary": "#88C0BC",
      "accent": "#BCE0DD",
      "background": "#F6FCFB",
      "ink": "#1A3635"
    }
  },
  {
    "name": "Opal Glow",
    "group": "calm",
    "tags": [
      "soft",
      "iridescent",
      "luminous"
    ],
    "colors": {
      "primary": "#8B8FB6",
      "secondary": "#B3B6D3",
      "accent": "#DADCE9",
      "background": "#FAFAFD",
      "ink": "#2A2C42"
    }
  },
  {
    "name": "Bamboo Silence",
    "group": "calm",
    "tags": [
      "natural",
      "restful",
      "meditative"
    ],
    "colors": {
      "primary": "#6D9174",
      "secondary": "#96B59C",
      "accent": "#C5D9C8",
      "background": "#F7FBF8",
      "ink": "#1F3122"
    }
  },
  {
    "name": "Linen Light",
    "group": "calm",
    "tags": [
      "clean",
      "minimal",
      "airy"
    ],
    "colors": {
      "primary": "#8492A9",
      "secondary": "#B3BECF",
      "accent": "#D9E1EA",
      "background": "#FAFCFD",
      "ink": "#252F3E"
    }
  },
  {
    "name": "Dove Wing",
    "group": "calm",
    "tags": [
      "gentle",
      "soft",
      "graceful"
    ],
    "colors": {
      "primary": "#8489A3",
      "secondary": "#ADADC4",
      "accent": "#D6D8E5",
      "background": "#FAFAFD",
      "ink": "#262839"
    }
  },
  {
    "name": "Pale Jade",
    "group": "calm",
    "tags": [
      "tranquil",
      "refined",
      "cool"
    ],
    "colors": {
      "primary": "#679B8F",
      "secondary": "#95BFB4",
      "accent": "#C5E0D9",
      "background": "#F7FCFB",
      "ink": "#1D3631"
    }
  },
  {
    "name": "Cherry Blossom",
    "group": "calm",
    "tags": [
      "delicate",
      "spring",
      "peaceful"
    ],
    "colors": {
      "primary": "#C07E98",
      "secondary": "#DCB3C4",
      "accent": "#EDDAE1",
      "background": "#FEF9FB",
      "ink": "#3F2630"
    }
  },
  {
    "name": "Aqua Meditation",
    "group": "calm",
    "tags": [
      "calm",
      "centered",
      "clear"
    ],
    "colors": {
      "primary": "#5391A0",
      "secondary": "#84B6C2",
      "accent": "#BADBE3",
      "background": "#F6FBFD",
      "ink": "#1B3339"
    }
  },
  {
    "name": "Heather Mist",
    "group": "calm",
    "tags": [
      "soft",
      "muted",
      "gentle"
    ],
    "colors": {
      "primary": "#9785AA",
      "secondary": "#BDADC8",
      "accent": "#DDD6E5",
      "background": "#FBF9FD",
      "ink": "#2E2639"
    }
  },
  {
    "name": "Frosted Glass",
    "group": "calm",
    "tags": [
      "clean",
      "transparent",
      "quiet"
    ],
    "colors": {
      "primary": "#6E90A8",
      "secondary": "#9BB5C9",
      "accent": "#CCDCE7",
      "background": "#F8FBFD",
      "ink": "#1E2F3D"
    }
  },
  {
    "name": "Pistachio Peace",
    "group": "calm",
    "tags": [
      "fresh",
      "restful",
      "organic"
    ],
    "colors": {
      "primary": "#779976",
      "secondary": "#A7BFA6",
      "accent": "#D1E0D0",
      "background": "#F8FCF8",
      "ink": "#233523"
    }
  },
  {
    "name": "Dusty Lilac",
    "group": "calm",
    "tags": [
      "quiet",
      "muted",
      "elegant"
    ],
    "colors": {
      "primary": "#9A89AB",
      "secondary": "#BFB1CC",
      "accent": "#DFD8E7",
      "background": "#FBF9FD",
      "ink": "#312A3A"
    }
  },
  {
    "name": "Glacier Calm",
    "group": "calm",
    "tags": [
      "cool",
      "pristine",
      "serene"
    ],
    "colors": {
      "primary": "#5B8DA8",
      "secondary": "#8BB2C7",
      "accent": "#C0D9E4",
      "background": "#F7FBFD",
      "ink": "#1A2F3C"
    }
  },
  {
    "name": "Peach Serenity",
    "group": "calm",
    "tags": [
      "warm",
      "gentle",
      "soothing"
    ],
    "colors": {
      "primary": "#BB826C",
      "secondary": "#DCBDAF",
      "accent": "#EFDDD6",
      "background": "#FEF9F7",
      "ink": "#3D2C23"
    }
  },
  {
    "name": "Sunset Embrace",
    "group": "warm",
    "tags": [
      "welcoming",
      "warm",
      "optimistic"
    ],
    "colors": {
      "primary": "#E85D04",
      "secondary": "#FABB05",
      "accent": "#DC2F02",
      "background": "#FFF8F0",
      "ink": "#231F20"
    }
  },
  {
    "name": "Coral Hearth",
    "group": "warm",
    "tags": [
      "cozy",
      "friendly",
      "inviting"
    ],
    "colors": {
      "primary": "#FF5757",
      "secondary": "#FFE66D",
      "accent": "#4ECDC4",
      "background": "#FFFBF7",
      "ink": "#2C3E50"
    }
  },
  {
    "name": "Honey Glow",
    "group": "warm",
    "tags": [
      "approachable",
      "natural",
      "comforting"
    ],
    "colors": {
      "primary": "#C48441",
      "secondary": "#F4E4C1",
      "accent": "#A67C52",
      "background": "#FEFAF5",
      "ink": "#3C2F2F"
    }
  },
  {
    "name": "Terracotta Dreams",
    "group": "warm",
    "tags": [
      "earthy",
      "welcoming",
      "grounded"
    ],
    "colors": {
      "primary": "#C1666B",
      "secondary": "#D4B996",
      "accent": "#48A9A6",
      "background": "#FFF9F5",
      "ink": "#1A1A1A"
    }
  },
  {
    "name": "Peach Haven",
    "group": "warm",
    "tags": [
      "soft",
      "friendly",
      "gentle"
    ],
    "colors": {
      "primary": "#FF5A15",
      "secondary": "#FFEAA7",
      "accent": "#74B9FF",
      "background": "#FFFCF9",
      "ink": "#2D3436"
    }
  },
  {
    "name": "Maple Warmth",
    "group": "warm",
    "tags": [
      "cozy",
      "authentic",
      "nurturing"
    ],
    "colors": {
      "primary": "#CB6040",
      "secondary": "#F4D03F",
      "accent": "#52B788",
      "background": "#FFF7F2",
      "ink": "#1C2321"
    }
  },
  {
    "name": "Golden Hour",
    "group": "warm",
    "tags": [
      "radiant",
      "welcoming",
      "joyful"
    ],
    "colors": {
      "primary": "#CD820A",
      "secondary": "#E74C3C",
      "accent": "#3498DB",
      "background": "#FFFDF8",
      "ink": "#212121"
    }
  },
  {
    "name": "Clay Comfort",
    "group": "warm",
    "tags": [
      "rustic",
      "approachable",
      "warm"
    ],
    "colors": {
      "primary": "#A0522D",
      "secondary": "#DEB887",
      "accent": "#5F9EA0",
      "background": "#FAF8F5",
      "ink": "#2F1F1F"
    }
  },
  {
    "name": "Apricot Garden",
    "group": "warm",
    "tags": [
      "cheerful",
      "human",
      "lively"
    ],
    "colors": {
      "primary": "#F46000",
      "secondary": "#FFDA77",
      "accent": "#8FBC8F",
      "background": "#FFFAF4",
      "ink": "#1F1F1F"
    }
  },
  {
    "name": "Cinnamon Spirit",
    "group": "warm",
    "tags": [
      "spicy",
      "cozy",
      "inviting"
    ],
    "colors": {
      "primary": "#B85C38",
      "secondary": "#E8B298",
      "accent": "#6C9A8B",
      "background": "#FFF6F1",
      "ink": "#2B231C"
    }
  },
  {
    "name": "Blush Welcome",
    "group": "warm",
    "tags": [
      "gentle",
      "friendly",
      "soft"
    ],
    "colors": {
      "primary": "#E66B4D",
      "secondary": "#F4A261",
      "accent": "#2A9D8F",
      "background": "#FFF9F6",
      "ink": "#264653"
    }
  },
  {
    "name": "Butterscotch Joy",
    "group": "warm",
    "tags": [
      "sweet",
      "approachable",
      "warm"
    ],
    "colors": {
      "primary": "#BE8634",
      "secondary": "#F2D492",
      "accent": "#8B7355",
      "background": "#FFFCF6",
      "ink": "#3D2817"
    }
  },
  {
    "name": "Paprika Charm",
    "group": "warm",
    "tags": [
      "vibrant",
      "welcoming",
      "energetic"
    ],
    "colors": {
      "primary": "#D94F30",
      "secondary": "#F2A65A",
      "accent": "#58A4B0",
      "background": "#FFF8F4",
      "ink": "#1B1B1B"
    }
  },
  {
    "name": "Amber Hearth",
    "group": "warm",
    "tags": [
      "glowing",
      "cozy",
      "inviting"
    ],
    "colors": {
      "primary": "#D17D00",
      "secondary": "#FFD54F",
      "accent": "#6A994E",
      "background": "#FFFBF3",
      "ink": "#1D1D1D"
    }
  },
  {
    "name": "Rustic Rose",
    "group": "warm",
    "tags": [
      "charming",
      "human",
      "delicate"
    ],
    "colors": {
      "primary": "#D8737F",
      "secondary": "#FAD4C0",
      "accent": "#AB6E67",
      "background": "#FFFAF9",
      "ink": "#3E2723"
    }
  },
  {
    "name": "Copper Kindness",
    "group": "warm",
    "tags": [
      "metallic",
      "warm",
      "approachable"
    ],
    "colors": {
      "primary": "#B87333",
      "secondary": "#E6B89C",
      "accent": "#4A7C7E",
      "background": "#FFF9F4",
      "ink": "#2C1810"
    }
  },
  {
    "name": "Mango Sunrise",
    "group": "warm",
    "tags": [
      "tropical",
      "friendly",
      "bright"
    ],
    "colors": {
      "primary": "#FF5B19",
      "secondary": "#FFCC70",
      "accent": "#77BFA3",
      "background": "#FFFCF8",
      "ink": "#1A1A1A"
    }
  },
  {
    "name": "Toast & Marmalade",
    "group": "warm",
    "tags": [
      "comforting",
      "homey",
      "welcoming"
    ],
    "colors": {
      "primary": "#D2691E",
      "secondary": "#F5DEB3",
      "accent": "#CD853F",
      "background": "#FFF8F1",
      "ink": "#3B2616"
    }
  },
  {
    "name": "Brick Friendship",
    "group": "warm",
    "tags": [
      "solid",
      "trustworthy",
      "warm"
    ],
    "colors": {
      "primary": "#B7410E",
      "secondary": "#F4A460",
      "accent": "#708090",
      "background": "#FFF6F0",
      "ink": "#2F2519"
    }
  },
  {
    "name": "Cantaloupe Smile",
    "group": "warm",
    "tags": [
      "cheerful",
      "approachable",
      "fresh"
    ],
    "colors": {
      "primary": "#FF5C0A",
      "secondary": "#FFCC99",
      "accent": "#66CC99",
      "background": "#FFFCF7",
      "ink": "#1F1F1F"
    }
  },
  {
    "name": "Sandstone Welcome",
    "group": "warm",
    "tags": [
      "natural",
      "grounded",
      "inviting"
    ],
    "colors": {
      "primary": "#B68952",
      "secondary": "#E8D5B7",
      "accent": "#8B8C7A",
      "background": "#FEFBF6",
      "ink": "#3A3226"
    }
  },
  {
    "name": "Persimmon Path",
    "group": "warm",
    "tags": [
      "bold",
      "friendly",
      "confident"
    ],
    "colors": {
      "primary": "#EC5800",
      "secondary": "#FFB347",
      "accent": "#588C7E",
      "background": "#FFF9F3",
      "ink": "#1E1E1E"
    }
  },
  {
    "name": "Caramel Kindness",
    "group": "warm",
    "tags": [
      "sweet",
      "cozy",
      "genuine"
    ],
    "colors": {
      "primary": "#AF6E4D",
      "secondary": "#D4A574",
      "accent": "#8BA888",
      "background": "#FFF9F5",
      "ink": "#2E1F15"
    }
  },
  {
    "name": "Tangerine Hug",
    "group": "warm",
    "tags": [
      "vibrant",
      "joyful",
      "human"
    ],
    "colors": {
      "primary": "#DB7800",
      "secondary": "#FFD700",
      "accent": "#20B2AA",
      "background": "#FFFCF5",
      "ink": "#212121"
    }
  },
  {
    "name": "Sienna Stories",
    "group": "warm",
    "tags": [
      "earthy",
      "authentic",
      "warm"
    ],
    "colors": {
      "primary": "#A0522D",
      "secondary": "#DDA15E",
      "accent": "#BC6C25",
      "background": "#FAF7F2",
      "ink": "#2B1B0F"
    }
  },
  {
    "name": "Ginger Glow",
    "group": "warm",
    "tags": [
      "spicy",
      "welcoming",
      "energizing"
    ],
    "colors": {
      "primary": "#CD7F32",
      "secondary": "#F2CC8F",
      "accent": "#81B29A",
      "background": "#FFFDF7",
      "ink": "#1C1C1C"
    }
  },
  {
    "name": "Pecan Warmth",
    "group": "warm",
    "tags": [
      "nutty",
      "cozy",
      "reliable"
    ],
    "colors": {
      "primary": "#8B6F47",
      "secondary": "#C4A77D",
      "accent": "#A68A64",
      "background": "#FBF8F3",
      "ink": "#2D2416"
    }
  },
  {
    "name": "Salmon Stream",
    "group": "warm",
    "tags": [
      "flowing",
      "gentle",
      "approachable"
    ],
    "colors": {
      "primary": "#F95D4B",
      "secondary": "#FFC0CB",
      "accent": "#5F9EA0",
      "background": "#FFFBF8",
      "ink": "#2F4F4F"
    }
  },
  {
    "name": "Pumpkin Patch",
    "group": "warm",
    "tags": [
      "seasonal",
      "friendly",
      "festive"
    ],
    "colors": {
      "primary": "#F36200",
      "secondary": "#FFAA33",
      "accent": "#6B8E23",
      "background": "#FFFAF2",
      "ink": "#1A1A1A"
    }
  },
  {
    "name": "Chai Comfort",
    "group": "warm",
    "tags": [
      "aromatic",
      "cozy",
      "soothing"
    ],
    "colors": {
      "primary": "#9B7653",
      "secondary": "#D4A373",
      "accent": "#8FAF9F",
      "background": "#FEF9F4",
      "ink": "#2A1F17"
    }
  },
  {
    "name": "Citrus Embrace",
    "group": "warm",
    "tags": [
      "bright",
      "welcoming",
      "refreshing"
    ],
    "colors": {
      "primary": "#E67200",
      "secondary": "#FFA500",
      "accent": "#32CD32",
      "background": "#FFFDF6",
      "ink": "#1F1F1F"
    }
  },
  {
    "name": "Adobe Hearth",
    "group": "warm",
    "tags": [
      "southwestern",
      "warm",
      "sheltering"
    ],
    "colors": {
      "primary": "#C84630",
      "secondary": "#E8B298",
      "accent": "#8D6A52",
      "background": "#FFF7F1",
      "ink": "#2B1A10"
    }
  },
  {
    "name": "Electric Surge",
    "group": "bold",
    "tags": [
      "energetic",
      "modern",
      "tech"
    ],
    "colors": {
      "primary": "#FF0080",
      "secondary": "#8000FF",
      "accent": "#00D9FF",
      "background": "#FAFCFF",
      "ink": "#0A0A14"
    }
  },
  {
    "name": "Blazing Sunset",
    "group": "bold",
    "tags": [
      "bold",
      "warm",
      "passionate"
    ],
    "colors": {
      "primary": "#FF3D00",
      "secondary": "#FF8F00",
      "accent": "#FFD600",
      "background": "#FFFAF5",
      "ink": "#1A0D00"
    }
  },
  {
    "name": "Neon Velocity",
    "group": "bold",
    "tags": [
      "sporty",
      "vibrant",
      "dynamic"
    ],
    "colors": {
      "primary": "#00A82B",
      "secondary": "#00E5FF",
      "accent": "#FF00E5",
      "background": "#F8FFFA",
      "ink": "#001A0A"
    }
  },
  {
    "name": "Power Punch",
    "group": "bold",
    "tags": [
      "confident",
      "strong",
      "impactful"
    ],
    "colors": {
      "primary": "#E91E63",
      "secondary": "#9C27B0",
      "accent": "#FFC107",
      "background": "#FFF9FB",
      "ink": "#1C0A14"
    }
  },
  {
    "name": "Turbo Charge",
    "group": "bold",
    "tags": [
      "fast",
      "sleek",
      "athletic"
    ],
    "colors": {
      "primary": "#0066FF",
      "secondary": "#00CCFF",
      "accent": "#FFDD00",
      "background": "#F7FBFF",
      "ink": "#000D1A"
    }
  },
  {
    "name": "Crimson Thunder",
    "group": "bold",
    "tags": [
      "fierce",
      "powerful",
      "intense"
    ],
    "colors": {
      "primary": "#DC143C",
      "secondary": "#8B0000",
      "accent": "#FF6B6B",
      "background": "#FFF8F9",
      "ink": "#1A0000"
    }
  },
  {
    "name": "Atomic Lime",
    "group": "bold",
    "tags": [
      "fresh",
      "punchy",
      "youthful"
    ],
    "colors": {
      "primary": "#6DA300",
      "secondary": "#66FF00",
      "accent": "#FFEE00",
      "background": "#FDFFF7",
      "ink": "#0D1A00"
    }
  },
  {
    "name": "Volt Rush",
    "group": "bold",
    "tags": [
      "electric",
      "high-energy",
      "striking"
    ],
    "colors": {
      "primary": "#999900",
      "secondary": "#FFB300",
      "accent": "#FF4081",
      "background": "#FFFEF7",
      "ink": "#1A1A00"
    }
  },
  {
    "name": "Cobalt Streak",
    "group": "bold",
    "tags": [
      "sporty",
      "crisp",
      "determined"
    ],
    "colors": {
      "primary": "#0047AB",
      "secondary": "#0099FF",
      "accent": "#FF5722",
      "background": "#F7F9FF",
      "ink": "#00091A"
    }
  },
  {
    "name": "Lava Burst",
    "group": "bold",
    "tags": [
      "fiery",
      "explosive",
      "energetic"
    ],
    "colors": {
      "primary": "#FF4500",
      "secondary": "#FF6F00",
      "accent": "#FFD54F",
      "background": "#FFF9F5",
      "ink": "#1A0900"
    }
  },
  {
    "name": "Cyber Magenta",
    "group": "bold",
    "tags": [
      "digital",
      "bold",
      "futuristic"
    ],
    "colors": {
      "primary": "#FF006E",
      "secondary": "#D500F9",
      "accent": "#00F5FF",
      "background": "#FFF7FC",
      "ink": "#1A0014"
    }
  },
  {
    "name": "Tangerine Blast",
    "group": "bold",
    "tags": [
      "playful",
      "vibrant",
      "optimistic"
    ],
    "colors": {
      "primary": "#D67D00",
      "secondary": "#FF6F00",
      "accent": "#00E5CC",
      "background": "#FFFCF7",
      "ink": "#1A1000"
    }
  },
  {
    "name": "Royal Velocity",
    "group": "bold",
    "tags": [
      "regal",
      "powerful",
      "confident"
    ],
    "colors": {
      "primary": "#6200EA",
      "secondary": "#AA00FF",
      "accent": "#FFD700",
      "background": "#FAF7FF",
      "ink": "#0D0014"
    }
  },
  {
    "name": "Plasma Strike",
    "group": "bold",
    "tags": [
      "intense",
      "cutting-edge",
      "dynamic"
    ],
    "colors": {
      "primary": "#00A870",
      "secondary": "#00D4AA",
      "accent": "#FF0099",
      "background": "#F7FFFC",
      "ink": "#001A14"
    }
  },
  {
    "name": "Scarlet Sprint",
    "group": "bold",
    "tags": [
      "fast",
      "aggressive",
      "athletic"
    ],
    "colors": {
      "primary": "#FF0033",
      "secondary": "#CC0028",
      "accent": "#FFCC00",
      "background": "#FFF7F8",
      "ink": "#1A0005"
    }
  },
  {
    "name": "Sonic Teal",
    "group": "bold",
    "tags": [
      "modern",
      "energetic",
      "fresh"
    ],
    "colors": {
      "primary": "#00A1A3",
      "secondary": "#00A3A6",
      "accent": "#FF6B35",
      "background": "#F7FEFF",
      "ink": "#001A1A"
    }
  },
  {
    "name": "Inferno Orange",
    "group": "bold",
    "tags": [
      "bold",
      "hot",
      "impactful"
    ],
    "colors": {
      "primary": "#FF5500",
      "secondary": "#FF3300",
      "accent": "#FFEE32",
      "background": "#FFFAF7",
      "ink": "#1A0A00"
    }
  },
  {
    "name": "Ultraviolet Pulse",
    "group": "bold",
    "tags": [
      "mysterious",
      "high-energy",
      "trendy"
    ],
    "colors": {
      "primary": "#9D00FF",
      "secondary": "#7700CC",
      "accent": "#00FFFF",
      "background": "#FCFAFF",
      "ink": "#14001A"
    }
  },
  {
    "name": "Jade Lightning",
    "group": "bold",
    "tags": [
      "vibrant",
      "natural",
      "powerful"
    ],
    "colors": {
      "primary": "#00A946",
      "secondary": "#00E676",
      "accent": "#FFD740",
      "background": "#F7FFF9",
      "ink": "#001A09"
    }
  },
  {
    "name": "Rocket Red",
    "group": "bold",
    "tags": [
      "sporty",
      "fierce",
      "determined"
    ],
    "colors": {
      "primary": "#E30022",
      "secondary": "#B3001B",
      "accent": "#FFAA00",
      "background": "#FFF7F8",
      "ink": "#1A0003"
    }
  },
  {
    "name": "Laser Azure",
    "group": "bold",
    "tags": [
      "sleek",
      "confident",
      "tech"
    ],
    "colors": {
      "primary": "#007FFF",
      "secondary": "#0059B3",
      "accent": "#FF3366",
      "background": "#F7FCFF",
      "ink": "#001A33"
    }
  },
  {
    "name": "Fuchsia Force",
    "group": "bold",
    "tags": [
      "punchy",
      "daring",
      "expressive"
    ],
    "colors": {
      "primary": "#FA00FA",
      "secondary": "#C71585",
      "accent": "#00FF7F",
      "background": "#FFF7FF",
      "ink": "#1A001A"
    }
  },
  {
    "name": "Amber Ignition",
    "group": "bold",
    "tags": [
      "warm",
      "energetic",
      "confident"
    ],
    "colors": {
      "primary": "#B88A00",
      "secondary": "#FF9900",
      "accent": "#FF3D00",
      "background": "#FFFEF7",
      "ink": "#1A1400"
    }
  },
  {
    "name": "Indigo Storm",
    "group": "bold",
    "tags": [
      "bold",
      "dramatic",
      "intense"
    ],
    "colors": {
      "primary": "#4B0082",
      "secondary": "#6A0DAD",
      "accent": "#00FFCC",
      "background": "#FAF8FF",
      "ink": "#0D0014"
    }
  },
  {
    "name": "Citrus Shock",
    "group": "bold",
    "tags": [
      "zesty",
      "playful",
      "high-energy"
    ],
    "colors": {
      "primary": "#7E9E00",
      "secondary": "#AADD00",
      "accent": "#FF006E",
      "background": "#FEFFF7",
      "ink": "#141A00"
    }
  },
  {
    "name": "Sapphire Dash",
    "group": "bold",
    "tags": [
      "athletic",
      "clean",
      "dynamic"
    ],
    "colors": {
      "primary": "#0F52BA",
      "secondary": "#1E90FF",
      "accent": "#FFA500",
      "background": "#F7FAFF",
      "ink": "#000A1A"
    }
  },
  {
    "name": "Vermillion Rush",
    "group": "bold",
    "tags": [
      "energetic",
      "striking",
      "bold"
    ],
    "colors": {
      "primary": "#D9381E",
      "secondary": "#FF5733",
      "accent": "#FFEB3B",
      "background": "#FFF8F7",
      "ink": "#1A0700"
    }
  },
  {
    "name": "Mint Bolt",
    "group": "bold",
    "tags": [
      "fresh",
      "sporty",
      "crisp"
    ],
    "colors": {
      "primary": "#00A85A",
      "secondary": "#00D97A",
      "accent": "#FF4F81",
      "background": "#F7FFFC",
      "ink": "#001A10"
    }
  },
  {
    "name": "Cardinal Power",
    "group": "bold",
    "tags": [
      "strong",
      "passionate",
      "confident"
    ],
    "colors": {
      "primary": "#C41E3A",
      "secondary": "#8B1A2E",
      "accent": "#FFD700",
      "background": "#FFF8F9",
      "ink": "#1A0306"
    }
  },
  {
    "name": "Aqua Adrenaline",
    "group": "bold",
    "tags": [
      "refreshing",
      "punchy",
      "vibrant"
    ],
    "colors": {
      "primary": "#009DD1",
      "secondary": "#0099DD",
      "accent": "#FF2D55",
      "background": "#F7FDFF",
      "ink": "#001A26"
    }
  },
  {
    "name": "Sunburst Yellow",
    "group": "bold",
    "tags": [
      "optimistic",
      "energetic",
      "bold"
    ],
    "colors": {
      "primary": "#AD9200",
      "secondary": "#FFB700",
      "accent": "#FF1744",
      "background": "#FFFEF9",
      "ink": "#1A1500"
    }
  },
  {
    "name": "Emerald Velocity",
    "group": "bold",
    "tags": [
      "dynamic",
      "powerful",
      "modern"
    ],
    "colors": {
      "primary": "#00A552",
      "secondary": "#008844",
      "accent": "#FF6600",
      "background": "#F7FFF9",
      "ink": "#001A0D"
    }
  },
  {
    "name": "Midnight Velvet",
    "group": "premium",
    "tags": [
      "luxurious",
      "sophisticated",
      "dramatic"
    ],
    "colors": {
      "primary": "#1A0F3D",
      "secondary": "#4A3B6B",
      "accent": "#B8860B",
      "background": "#FAFAF9",
      "ink": "#1C1C1E"
    }
  },
  {
    "name": "Champagne Toast",
    "group": "premium",
    "tags": [
      "refined",
      "celebratory",
      "elegant"
    ],
    "colors": {
      "primary": "#AE8844",
      "secondary": "#E8D5B7",
      "accent": "#5C4A3A",
      "background": "#FBF9F6",
      "ink": "#2A2520"
    }
  },
  {
    "name": "Royal Sapphire",
    "group": "premium",
    "tags": [
      "prestigious",
      "trustworthy",
      "classic"
    ],
    "colors": {
      "primary": "#0F4C81",
      "secondary": "#2E7AB8",
      "accent": "#C5A572",
      "background": "#F8FAFB",
      "ink": "#1A2127"
    }
  },
  {
    "name": "Emerald Silk",
    "group": "premium",
    "tags": [
      "sophisticated",
      "natural",
      "wealthy"
    ],
    "colors": {
      "primary": "#0D5C4D",
      "secondary": "#2A8C75",
      "accent": "#D4AF37",
      "background": "#F9FBFA",
      "ink": "#1E2622"
    }
  },
  {
    "name": "Bordeaux Legacy",
    "group": "premium",
    "tags": [
      "mature",
      "luxurious",
      "confident"
    ],
    "colors": {
      "primary": "#6B1F3A",
      "secondary": "#9B4165",
      "accent": "#D4A574",
      "background": "#FAF8F9",
      "ink": "#231A1D"
    }
  },
  {
    "name": "Platinum Dawn",
    "group": "premium",
    "tags": [
      "modern",
      "minimalist",
      "refined"
    ],
    "colors": {
      "primary": "#4A5568",
      "secondary": "#8B95A8",
      "accent": "#E8C4A0",
      "background": "#FCFCFD",
      "ink": "#1F2937"
    }
  },
  {
    "name": "Amber Prestige",
    "group": "premium",
    "tags": [
      "warm",
      "inviting",
      "established"
    ],
    "colors": {
      "primary": "#B85C00",
      "secondary": "#E89B5C",
      "accent": "#3D5A6B",
      "background": "#FDF9F5",
      "ink": "#2C1810"
    }
  },
  {
    "name": "Orchid Noir",
    "group": "premium",
    "tags": [
      "creative",
      "bold",
      "mysterious"
    ],
    "colors": {
      "primary": "#6B2D5C",
      "secondary": "#A04E8C",
      "accent": "#C9A86A",
      "background": "#FCF9FB",
      "ink": "#251A23"
    }
  },
  {
    "name": "Charcoal Essence",
    "group": "premium",
    "tags": [
      "understated",
      "powerful",
      "timeless"
    ],
    "colors": {
      "primary": "#2C3E50",
      "secondary": "#546E7A",
      "accent": "#BFA76F",
      "background": "#F9FAFB",
      "ink": "#1A1F26"
    }
  },
  {
    "name": "Ivory Luxe",
    "group": "premium",
    "tags": [
      "pristine",
      "exclusive",
      "gentle"
    ],
    "colors": {
      "primary": "#7A5C47",
      "secondary": "#A88968",
      "accent": "#4A6B7C",
      "background": "#FDFCFA",
      "ink": "#2A2117"
    }
  },
  {
    "name": "Crimson Crown",
    "group": "premium",
    "tags": [
      "passionate",
      "prestigious",
      "daring"
    ],
    "colors": {
      "primary": "#8C1F28",
      "secondary": "#C44D58",
      "accent": "#D4AF37",
      "background": "#FBF8F8",
      "ink": "#2A1214"
    }
  },
  {
    "name": "Ocean Depth",
    "group": "premium",
    "tags": [
      "serene",
      "expansive",
      "trusted"
    ],
    "colors": {
      "primary": "#1B4965",
      "secondary": "#3D7EA6",
      "accent": "#C9A66B",
      "background": "#F7FAFB",
      "ink": "#1C252B"
    }
  },
  {
    "name": "Slate Whisper",
    "group": "premium",
    "tags": [
      "subtle",
      "balanced",
      "contemporary"
    ],
    "colors": {
      "primary": "#5D6D7E",
      "secondary": "#95A5A6",
      "accent": "#D99058",
      "background": "#FAFBFC",
      "ink": "#212529"
    }
  },
  {
    "name": "Plum Elegance",
    "group": "premium",
    "tags": [
      "refined",
      "feminine",
      "regal"
    ],
    "colors": {
      "primary": "#5C3D5E",
      "secondary": "#8B6A8F",
      "accent": "#CBA65D",
      "background": "#FBF9FB",
      "ink": "#221D23"
    }
  },
  {
    "name": "Bronze Heritage",
    "group": "premium",
    "tags": [
      "established",
      "classic",
      "distinguished"
    ],
    "colors": {
      "primary": "#8B5A3C",
      "secondary": "#B87F5E",
      "accent": "#3E5D6E",
      "background": "#FAF8F6",
      "ink": "#281F1A"
    }
  },
  {
    "name": "Teal Majesty",
    "group": "premium",
    "tags": [
      "balanced",
      "luxurious",
      "calming"
    ],
    "colors": {
      "primary": "#0F5959",
      "secondary": "#2E8B8B",
      "accent": "#D6A86F",
      "background": "#F8FBFB",
      "ink": "#1A2525"
    }
  },
  {
    "name": "Graphite Refined",
    "group": "premium",
    "tags": [
      "industrial",
      "sleek",
      "sophisticated"
    ],
    "colors": {
      "primary": "#3A4750",
      "secondary": "#5F6F78",
      "accent": "#C99A5C",
      "background": "#F9FAFB",
      "ink": "#1E2326"
    }
  },
  {
    "name": "Blush Reserve",
    "group": "premium",
    "tags": [
      "gentle",
      "elegant",
      "modern"
    ],
    "colors": {
      "primary": "#9B5366",
      "secondary": "#C78798",
      "accent": "#7A6B4E",
      "background": "#FCF9FA",
      "ink": "#2A1E21"
    }
  },
  {
    "name": "Forest Manor",
    "group": "premium",
    "tags": [
      "natural",
      "grounded",
      "enduring"
    ],
    "colors": {
      "primary": "#2C4A3E",
      "secondary": "#4B7C68",
      "accent": "#D4A76A",
      "background": "#F9FBF9",
      "ink": "#1E2621"
    }
  },
  {
    "name": "Pewter Grace",
    "group": "premium",
    "tags": [
      "neutral",
      "sophisticated",
      "versatile"
    ],
    "colors": {
      "primary": "#6B737C",
      "secondary": "#9BA3AC",
      "accent": "#C68B5A",
      "background": "#FBFBFC",
      "ink": "#252729"
    }
  },
  {
    "name": "Cognac Reserve",
    "group": "premium",
    "tags": [
      "warm",
      "inviting",
      "mature"
    ],
    "colors": {
      "primary": "#8E4A2D",
      "secondary": "#B87154",
      "accent": "#4D6B7A",
      "background": "#FBF8F5",
      "ink": "#281B14"
    }
  },
  {
    "name": "Indigo Vault",
    "group": "premium",
    "tags": [
      "deep",
      "mysterious",
      "intellectual"
    ],
    "colors": {
      "primary": "#2E3A59",
      "secondary": "#4A5F8C",
      "accent": "#C9A56A",
      "background": "#F8F9FB",
      "ink": "#1A1E26"
    }
  },
  {
    "name": "Copper Refined",
    "group": "premium",
    "tags": [
      "artisanal",
      "crafted",
      "distinctive"
    ],
    "colors": {
      "primary": "#A0522D",
      "secondary": "#CD7F5C",
      "accent": "#3D5E6B",
      "background": "#FDF9F6",
      "ink": "#2A1C12"
    }
  },
  {
    "name": "Sage Authority",
    "group": "premium",
    "tags": [
      "calm",
      "organic",
      "balanced"
    ],
    "colors": {
      "primary": "#5B6E5B",
      "secondary": "#8AA18A",
      "accent": "#C89A5C",
      "background": "#F9FBF9",
      "ink": "#242824"
    }
  },
  {
    "name": "Navy Prestige",
    "group": "premium",
    "tags": [
      "authoritative",
      "classic",
      "dependable"
    ],
    "colors": {
      "primary": "#1E3A5F",
      "secondary": "#3A5F8F",
      "accent": "#D4A86F",
      "background": "#F7F9FB",
      "ink": "#1A2129"
    }
  },
  {
    "name": "Mauve Serenity",
    "group": "premium",
    "tags": [
      "peaceful",
      "refined",
      "artistic"
    ],
    "colors": {
      "primary": "#7D5C7F",
      "secondary": "#A687A9",
      "accent": "#B89860",
      "background": "#FBFAFB",
      "ink": "#252024"
    }
  },
  {
    "name": "Obsidian Luxe",
    "group": "premium",
    "tags": [
      "powerful",
      "modern",
      "exclusive"
    ],
    "colors": {
      "primary": "#252B33",
      "secondary": "#4A5259",
      "accent": "#D4A96F",
      "background": "#F8F9FA",
      "ink": "#151719"
    }
  },
  {
    "name": "Terracotta Heritage",
    "group": "premium",
    "tags": [
      "earthy",
      "warm",
      "timeless"
    ],
    "colors": {
      "primary": "#A0564B",
      "secondary": "#C58074",
      "accent": "#4A6B68",
      "background": "#FBF8F7",
      "ink": "#2A1E1B"
    }
  },
  {
    "name": "Garnet Distinction",
    "group": "premium",
    "tags": [
      "bold",
      "prestigious",
      "intense"
    ],
    "colors": {
      "primary": "#75232E",
      "secondary": "#A04654",
      "accent": "#C9A66A",
      "background": "#FAF8F8",
      "ink": "#231416"
    }
  },
  {
    "name": "Steel Sophisticate",
    "group": "premium",
    "tags": [
      "modern",
      "industrial",
      "clean"
    ],
    "colors": {
      "primary": "#556B7C",
      "secondary": "#7A92A3",
      "accent": "#D49C5C",
      "background": "#F9FAFB",
      "ink": "#1F2529"
    }
  },
  {
    "name": "Moss Refined",
    "group": "premium",
    "tags": [
      "organic",
      "sophisticated",
      "grounded"
    ],
    "colors": {
      "primary": "#4A5D4F",
      "secondary": "#6E8B76",
      "accent": "#C69860",
      "background": "#F9FBF9",
      "ink": "#222623"
    }
  },
  {
    "name": "Aubergine Elite",
    "group": "premium",
    "tags": [
      "luxurious",
      "dramatic",
      "distinctive"
    ],
    "colors": {
      "primary": "#4B2E42",
      "secondary": "#75556B",
      "accent": "#CDA767",
      "background": "#FAF9FA",
      "ink": "#221C20"
    }
  },
  {
    "name": "Bubble Burst",
    "group": "playful",
    "tags": [
      "playful",
      "energetic",
      "joyful"
    ],
    "colors": {
      "primary": "#FF1493",
      "secondary": "#FFD700",
      "accent": "#00CED1",
      "background": "#FFF9FB",
      "ink": "#1A0A14"
    }
  },
  {
    "name": "Citrus Splash",
    "group": "playful",
    "tags": [
      "fresh",
      "vibrant",
      "cheerful"
    ],
    "colors": {
      "primary": "#DB7800",
      "secondary": "#FFEB3B",
      "accent": "#4CAF50",
      "background": "#FFFEF5",
      "ink": "#1F1A0A"
    }
  },
  {
    "name": "Candy Dream",
    "group": "playful",
    "tags": [
      "sweet",
      "youthful",
      "fun"
    ],
    "colors": {
      "primary": "#E91E63",
      "secondary": "#BA68C8",
      "accent": "#FFB6C1",
      "background": "#FFF7FA",
      "ink": "#2D1420"
    }
  },
  {
    "name": "Tropical Fiesta",
    "group": "playful",
    "tags": [
      "exotic",
      "bold",
      "colorful"
    ],
    "colors": {
      "primary": "#FF5C21",
      "secondary": "#F7B801",
      "accent": "#1DD3B0",
      "background": "#FFFCF7",
      "ink": "#1C1410"
    }
  },
  {
    "name": "Rainbow Pop",
    "group": "playful",
    "tags": [
      "vibrant",
      "diverse",
      "playful"
    ],
    "colors": {
      "primary": "#9C27B0",
      "secondary": "#FF5722",
      "accent": "#FFEB3B",
      "background": "#FBF8FF",
      "ink": "#1A0F1F"
    }
  },
  {
    "name": "Berry Bounce",
    "group": "playful",
    "tags": [
      "fruity",
      "energetic",
      "bright"
    ],
    "colors": {
      "primary": "#C2185B",
      "secondary": "#7B1FA2",
      "accent": "#FF4081",
      "background": "#FFF6F9",
      "ink": "#1F0D15"
    }
  },
  {
    "name": "Sunshine Festival",
    "group": "playful",
    "tags": [
      "warm",
      "happy",
      "optimistic"
    ],
    "colors": {
      "primary": "#D37E00",
      "secondary": "#FFEE58",
      "accent": "#EC407A",
      "background": "#FFFDF6",
      "ink": "#241F0D"
    }
  },
  {
    "name": "Cosmic Carnival",
    "group": "playful",
    "tags": [
      "imaginative",
      "fun",
      "whimsical"
    ],
    "colors": {
      "primary": "#5E35B1",
      "secondary": "#FF6F00",
      "accent": "#00E5FF",
      "background": "#F9F8FF",
      "ink": "#14101F"
    }
  },
  {
    "name": "Mint Melody",
    "group": "playful",
    "tags": [
      "fresh",
      "cool",
      "uplifting"
    ],
    "colors": {
      "primary": "#00A68F",
      "secondary": "#76FF03",
      "accent": "#FFD54F",
      "background": "#F5FFFC",
      "ink": "#0A1F1A"
    }
  },
  {
    "name": "Neon Playground",
    "group": "playful",
    "tags": [
      "bold",
      "electric",
      "youthful"
    ],
    "colors": {
      "primary": "#D500F9",
      "secondary": "#00E676",
      "accent": "#FFEA00",
      "background": "#FDF8FF",
      "ink": "#1A0F1F"
    }
  },
  {
    "name": "Coral Celebration",
    "group": "playful",
    "tags": [
      "warm",
      "cheerful",
      "inviting"
    ],
    "colors": {
      "primary": "#FF5252",
      "secondary": "#FFB74D",
      "accent": "#4DD0E1",
      "background": "#FFF9F7",
      "ink": "#1F0F0A"
    }
  },
  {
    "name": "Sky Sparkle",
    "group": "playful",
    "tags": [
      "bright",
      "airy",
      "joyful"
    ],
    "colors": {
      "primary": "#2196F3",
      "secondary": "#00BCD4",
      "accent": "#FFC107",
      "background": "#F7FCFF",
      "ink": "#0A1419"
    }
  },
  {
    "name": "Lemon Drop",
    "group": "playful",
    "tags": [
      "zesty",
      "vibrant",
      "fun"
    ],
    "colors": {
      "primary": "#9E9200",
      "secondary": "#8BC34A",
      "accent": "#FF6E40",
      "background": "#FFFEF5",
      "ink": "#1F1E0A"
    }
  },
  {
    "name": "Peachy Keen",
    "group": "playful",
    "tags": [
      "soft",
      "cheerful",
      "warm"
    ],
    "colors": {
      "primary": "#FF5824",
      "secondary": "#FFD180",
      "accent": "#EA80FC",
      "background": "#FFFBF7",
      "ink": "#1F1710"
    }
  },
  {
    "name": "Electric Jam",
    "group": "playful",
    "tags": [
      "energetic",
      "bold",
      "dynamic"
    ],
    "colors": {
      "primary": "#7C4DFF",
      "secondary": "#FF1744",
      "accent": "#00E5FF",
      "background": "#FAF8FF",
      "ink": "#140A1F"
    }
  },
  {
    "name": "Mango Tango",
    "group": "playful",
    "tags": [
      "tropical",
      "vibrant",
      "playful"
    ],
    "colors": {
      "primary": "#F06800",
      "secondary": "#FFAB00",
      "accent": "#1DE9B6",
      "background": "#FFFCF5",
      "ink": "#1F1508"
    }
  },
  {
    "name": "Violet Vibes",
    "group": "playful",
    "tags": [
      "creative",
      "energetic",
      "fun"
    ],
    "colors": {
      "primary": "#AA00FF",
      "secondary": "#E040FB",
      "accent": "#69F0AE",
      "background": "#FDF7FF",
      "ink": "#1A0A1F"
    }
  },
  {
    "name": "Lime Light",
    "group": "playful",
    "tags": [
      "fresh",
      "bright",
      "youthful"
    ],
    "colors": {
      "primary": "#759E00",
      "secondary": "#76FF03",
      "accent": "#FF4081",
      "background": "#FDFFF5",
      "ink": "#14190A"
    }
  },
  {
    "name": "Bubblegum Bliss",
    "group": "playful",
    "tags": [
      "sweet",
      "playful",
      "cheerful"
    ],
    "colors": {
      "primary": "#FF45A2",
      "secondary": "#FFB3E6",
      "accent": "#87CEEB",
      "background": "#FFF9FD",
      "ink": "#1F0A17"
    }
  },
  {
    "name": "Tangerine Dream",
    "group": "playful",
    "tags": [
      "vibrant",
      "warm",
      "optimistic"
    ],
    "colors": {
      "primary": "#D67D00",
      "secondary": "#FFCC00",
      "accent": "#00BFA5",
      "background": "#FFFDF6",
      "ink": "#1F1808"
    }
  },
  {
    "name": "Flamingo Flair",
    "group": "playful",
    "tags": [
      "bold",
      "tropical",
      "fun"
    ],
    "colors": {
      "primary": "#FC0FC0",
      "secondary": "#FF6B9D",
      "accent": "#FFC837",
      "background": "#FFF7FC",
      "ink": "#1F0A18"
    }
  },
  {
    "name": "Ocean Party",
    "group": "playful",
    "tags": [
      "cool",
      "vibrant",
      "playful"
    ],
    "colors": {
      "primary": "#009DB5",
      "secondary": "#0091EA",
      "accent": "#FF6D00",
      "background": "#F5FCFF",
      "ink": "#0A181F"
    }
  },
  {
    "name": "Cherry Blossom II",
    "group": "playful",
    "tags": [
      "delicate",
      "cheerful",
      "youthful"
    ],
    "colors": {
      "primary": "#FF4893",
      "secondary": "#FFB7D5",
      "accent": "#B2FF59",
      "background": "#FFF8FB",
      "ink": "#1F0A15"
    }
  },
  {
    "name": "Laser Tag",
    "group": "playful",
    "tags": [
      "futuristic",
      "energetic",
      "bold"
    ],
    "colors": {
      "primary": "#00A3A3",
      "secondary": "#FF00FF",
      "accent": "#FFFF00",
      "background": "#F5FEFF",
      "ink": "#0A1A1F"
    }
  },
  {
    "name": "Popsicle Stand",
    "group": "playful",
    "tags": [
      "fun",
      "colorful",
      "nostalgic"
    ],
    "colors": {
      "primary": "#F44336",
      "secondary": "#9C27B0",
      "accent": "#00BCD4",
      "background": "#FFF7F7",
      "ink": "#1F0A0A"
    }
  },
  {
    "name": "Starfruit Surprise",
    "group": "playful",
    "tags": [
      "exotic",
      "bright",
      "cheerful"
    ],
    "colors": {
      "primary": "#8D991B",
      "secondary": "#FF9800",
      "accent": "#E91E63",
      "background": "#FEFFF6",
      "ink": "#1A1F0A"
    }
  },
  {
    "name": "Confetti Cascade",
    "group": "playful",
    "tags": [
      "festive",
      "joyful",
      "colorful"
    ],
    "colors": {
      "primary": "#FF3D00",
      "secondary": "#FFAB40",
      "accent": "#B388FF",
      "background": "#FFF9F5",
      "ink": "#1F0F0A"
    }
  },
  {
    "name": "Raspberry Riot",
    "group": "playful",
    "tags": [
      "bold",
      "fruity",
      "energetic"
    ],
    "colors": {
      "primary": "#D81B60",
      "secondary": "#8E24AA",
      "accent": "#FDD835",
      "background": "#FFF6F8",
      "ink": "#1F0A12"
    }
  },
  {
    "name": "Kiwi Kick",
    "group": "playful",
    "tags": [
      "fresh",
      "zesty",
      "vibrant"
    ],
    "colors": {
      "primary": "#4BA611",
      "secondary": "#AEEA00",
      "accent": "#FF6E40",
      "background": "#F9FFF5",
      "ink": "#0F1F0A"
    }
  },
  {
    "name": "Sapphire Circus",
    "group": "playful",
    "tags": [
      "vivid",
      "playful",
      "bold"
    ],
    "colors": {
      "primary": "#2962FF",
      "secondary": "#448AFF",
      "accent": "#FFAB00",
      "background": "#F6FAFF",
      "ink": "#0A0F1F"
    }
  },
  {
    "name": "Watermelon Wave",
    "group": "playful",
    "tags": [
      "summery",
      "fun",
      "refreshing"
    ],
    "colors": {
      "primary": "#FF4E6C",
      "secondary": "#4EC9B0",
      "accent": "#FFE66D",
      "background": "#FFF8F9",
      "ink": "#1F0A0E"
    }
  },
  {
    "name": "Amber Arcade",
    "group": "playful",
    "tags": [
      "retro",
      "bright",
      "playful"
    ],
    "colors": {
      "primary": "#F06800",
      "secondary": "#FFC400",
      "accent": "#6200EA",
      "background": "#FFFCF5",
      "ink": "#1F1508"
    }
  },
  {
    "name": "Electric Void",
    "group": "tech",
    "tags": [
      "futuristic",
      "bold",
      "digital"
    ],
    "colors": {
      "primary": "#0066FF",
      "secondary": "#00D4FF",
      "accent": "#FF0080",
      "background": "#F8FBFF",
      "ink": "#0A1929"
    }
  },
  {
    "name": "Neon Pulse",
    "group": "tech",
    "tags": [
      "vibrant",
      "tech",
      "energetic"
    ],
    "colors": {
      "primary": "#00A85A",
      "secondary": "#00CCFF",
      "accent": "#FF3366",
      "background": "#F7FFFC",
      "ink": "#001A14"
    }
  },
  {
    "name": "Quantum Shift",
    "group": "tech",
    "tags": [
      "precise",
      "modern",
      "clean"
    ],
    "colors": {
      "primary": "#6B4EFF",
      "secondary": "#9D7FFF",
      "accent": "#FFD166",
      "background": "#FAFAFF",
      "ink": "#1A1347"
    }
  },
  {
    "name": "Arctic Code",
    "group": "tech",
    "tags": [
      "cool",
      "minimal",
      "sharp"
    ],
    "colors": {
      "primary": "#009DB5",
      "secondary": "#0091B8",
      "accent": "#FF6B35",
      "background": "#F5FCFF",
      "ink": "#0D1F26"
    }
  },
  {
    "name": "Cyber Dawn",
    "group": "tech",
    "tags": [
      "futuristic",
      "fresh",
      "innovative"
    ],
    "colors": {
      "primary": "#FF006E",
      "secondary": "#8338EC",
      "accent": "#FFBE0B",
      "background": "#FFF9FB",
      "ink": "#1A0614"
    }
  },
  {
    "name": "Digital Horizon",
    "group": "tech",
    "tags": [
      "clean",
      "expansive",
      "tech"
    ],
    "colors": {
      "primary": "#0F52BA",
      "secondary": "#5B9BD5",
      "accent": "#FF7F50",
      "background": "#F6F9FD",
      "ink": "#0A1628"
    }
  },
  {
    "name": "Plasma Core",
    "group": "tech",
    "tags": [
      "intense",
      "modern",
      "powerful"
    ],
    "colors": {
      "primary": "#D946EF",
      "secondary": "#A855F7",
      "accent": "#22D3EE",
      "background": "#FDF9FF",
      "ink": "#2D0A42"
    }
  },
  {
    "name": "Silicon Valley",
    "group": "tech",
    "tags": [
      "professional",
      "innovative",
      "precise"
    ],
    "colors": {
      "primary": "#1E88E5",
      "secondary": "#42A5F5",
      "accent": "#FFC107",
      "background": "#F7FAFC",
      "ink": "#1A2332"
    }
  },
  {
    "name": "Laser Focus",
    "group": "tech",
    "tags": [
      "sharp",
      "cutting-edge",
      "bold"
    ],
    "colors": {
      "primary": "#E91E63",
      "secondary": "#F06292",
      "accent": "#00E676",
      "background": "#FFF8FA",
      "ink": "#2D0A17"
    }
  },
  {
    "name": "Matrix Green",
    "group": "tech",
    "tags": [
      "digital",
      "tech",
      "iconic"
    ],
    "colors": {
      "primary": "#00A82B",
      "secondary": "#39FF14",
      "accent": "#0080FF",
      "background": "#F6FFF9",
      "ink": "#001A09"
    }
  },
  {
    "name": "Titanium Edge",
    "group": "tech",
    "tags": [
      "sleek",
      "modern",
      "metallic"
    ],
    "colors": {
      "primary": "#546E7A",
      "secondary": "#78909C",
      "accent": "#FF5722",
      "background": "#F8F9FA",
      "ink": "#1C2428"
    }
  },
  {
    "name": "Cosmic Blue",
    "group": "tech",
    "tags": [
      "expansive",
      "futuristic",
      "deep"
    ],
    "colors": {
      "primary": "#2962FF",
      "secondary": "#5E92F3",
      "accent": "#FF4081",
      "background": "#F7F9FF",
      "ink": "#0D1B3D"
    }
  },
  {
    "name": "Volt Yellow",
    "group": "tech",
    "tags": [
      "energetic",
      "bright",
      "innovative"
    ],
    "colors": {
      "primary": "#9E9100",
      "secondary": "#FFD600",
      "accent": "#6200EA",
      "background": "#FFFEF5",
      "ink": "#1A1600"
    }
  },
  {
    "name": "Neural Network",
    "group": "tech",
    "tags": [
      "intelligent",
      "precise",
      "complex"
    ],
    "colors": {
      "primary": "#00A68F",
      "secondary": "#1DE9B6",
      "accent": "#FF6D00",
      "background": "#F5FFFD",
      "ink": "#003D33"
    }
  },
  {
    "name": "Midnight Algorithm",
    "group": "tech",
    "tags": [
      "sophisticated",
      "dark",
      "precise"
    ],
    "colors": {
      "primary": "#7C4DFF",
      "secondary": "#B388FF",
      "accent": "#00E5FF",
      "background": "#FAFBFF",
      "ink": "#1A0F33"
    }
  },
  {
    "name": "Chrome Finish",
    "group": "tech",
    "tags": [
      "polished",
      "modern",
      "clean"
    ],
    "colors": {
      "primary": "#607D8B",
      "secondary": "#90A4AE",
      "accent": "#FF9100",
      "background": "#F9FAFB",
      "ink": "#263238"
    }
  },
  {
    "name": "Ruby Circuit",
    "group": "tech",
    "tags": [
      "bold",
      "tech",
      "vibrant"
    ],
    "colors": {
      "primary": "#C62828",
      "secondary": "#EF5350",
      "accent": "#00BCD4",
      "background": "#FFF8F8",
      "ink": "#2B0808"
    }
  },
  {
    "name": "Hologram Teal",
    "group": "tech",
    "tags": [
      "futuristic",
      "luminous",
      "clean"
    ],
    "colors": {
      "primary": "#00897B",
      "secondary": "#26A69A",
      "accent": "#FFAB00",
      "background": "#F5FFFD",
      "ink": "#00251F"
    }
  },
  {
    "name": "Sapphire Protocol",
    "group": "tech",
    "tags": [
      "professional",
      "trustworthy",
      "digital"
    ],
    "colors": {
      "primary": "#1565C0",
      "secondary": "#1976D2",
      "accent": "#FF6F00",
      "background": "#F6FAFD",
      "ink": "#0A1E35"
    }
  },
  {
    "name": "Velocity Orange",
    "group": "tech",
    "tags": [
      "dynamic",
      "fast",
      "modern"
    ],
    "colors": {
      "primary": "#F56200",
      "secondary": "#FF8533",
      "accent": "#0099FF",
      "background": "#FFF9F5",
      "ink": "#331A00"
    }
  },
  {
    "name": "Indigo Wave",
    "group": "tech",
    "tags": [
      "calm",
      "tech",
      "sophisticated"
    ],
    "colors": {
      "primary": "#3949AB",
      "secondary": "#5C6BC0",
      "accent": "#FFCA28",
      "background": "#F8F9FF",
      "ink": "#1A1F42"
    }
  },
  {
    "name": "Emerald Code",
    "group": "tech",
    "tags": [
      "fresh",
      "precise",
      "growth"
    ],
    "colors": {
      "primary": "#00A946",
      "secondary": "#69F0AE",
      "accent": "#DD2C00",
      "background": "#F5FFF9",
      "ink": "#003314"
    }
  },
  {
    "name": "Photon Beam",
    "group": "tech",
    "tags": [
      "bright",
      "clean",
      "innovative"
    ],
    "colors": {
      "primary": "#00A0B3",
      "secondary": "#84FFFF",
      "accent": "#FF1744",
      "background": "#F5FEFF",
      "ink": "#003D47"
    }
  },
  {
    "name": "Magenta Flux",
    "group": "tech",
    "tags": [
      "bold",
      "creative",
      "digital"
    ],
    "colors": {
      "primary": "#D500F9",
      "secondary": "#E040FB",
      "accent": "#76FF03",
      "background": "#FEF7FF",
      "ink": "#3D0047"
    }
  },
  {
    "name": "Cobalt Interface",
    "group": "tech",
    "tags": [
      "strong",
      "modern",
      "reliable"
    ],
    "colors": {
      "primary": "#0D47A1",
      "secondary": "#1976D2",
      "accent": "#FFC400",
      "background": "#F5F8FD",
      "ink": "#091E38"
    }
  },
  {
    "name": "Lime Binary",
    "group": "tech",
    "tags": [
      "vibrant",
      "tech",
      "energetic"
    ],
    "colors": {
      "primary": "#759E00",
      "secondary": "#C6FF00",
      "accent": "#6200EA",
      "background": "#FDFFF5",
      "ink": "#2E3D00"
    }
  },
  {
    "name": "Amber Signal",
    "group": "tech",
    "tags": [
      "warm",
      "attention",
      "precise"
    ],
    "colors": {
      "primary": "#D67800",
      "secondary": "#FFB300",
      "accent": "#00B0FF",
      "background": "#FFFAF5",
      "ink": "#2E1F00"
    }
  },
  {
    "name": "Deep Ocean",
    "group": "tech",
    "tags": [
      "calm",
      "professional",
      "depth"
    ],
    "colors": {
      "primary": "#006064",
      "secondary": "#00838F",
      "accent": "#FF3D00",
      "background": "#F5FDFE",
      "ink": "#001A1C"
    }
  },
  {
    "name": "Slate Modern",
    "group": "tech",
    "tags": [
      "minimal",
      "clean",
      "sophisticated"
    ],
    "colors": {
      "primary": "#455A64",
      "secondary": "#607D8B",
      "accent": "#00E676",
      "background": "#F7F8F9",
      "ink": "#1C2528"
    }
  },
  {
    "name": "Crimson Data",
    "group": "tech",
    "tags": [
      "powerful",
      "precise",
      "bold"
    ],
    "colors": {
      "primary": "#D32F2F",
      "secondary": "#E57373",
      "accent": "#18FFFF",
      "background": "#FFF7F7",
      "ink": "#330A0A"
    }
  },
  {
    "name": "Azure Sky",
    "group": "tech",
    "tags": [
      "open",
      "clear",
      "innovative"
    ],
    "colors": {
      "primary": "#0288D1",
      "secondary": "#03A9F4",
      "accent": "#FF6E40",
      "background": "#F6FBFE",
      "ink": "#0A2433"
    }
  },
  {
    "name": "Orchid Future",
    "group": "tech",
    "tags": [
      "creative",
      "futuristic",
      "unique"
    ],
    "colors": {
      "primary": "#AB47BC",
      "secondary": "#CE93D8",
      "accent": "#00E5FF",
      "background": "#FCF8FD",
      "ink": "#2D1233"
    }
  },
  {
    "name": "Forest Canopy",
    "group": "earthy",
    "tags": [
      "natural",
      "grounded",
      "botanical"
    ],
    "colors": {
      "primary": "#2D5016",
      "secondary": "#6B8E23",
      "accent": "#A0522D",
      "background": "#F8FAF5",
      "ink": "#1A2E0F"
    }
  },
  {
    "name": "Clay Vessel",
    "group": "earthy",
    "tags": [
      "handmade",
      "grounded",
      "natural"
    ],
    "colors": {
      "primary": "#8B4513",
      "secondary": "#CD853F",
      "accent": "#D2691E",
      "background": "#FBF8F3",
      "ink": "#2C1810"
    }
  },
  {
    "name": "Moss Garden",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#4A6741",
      "secondary": "#7A9D54",
      "accent": "#B4C7A5",
      "background": "#F7FAF6",
      "ink": "#1E2A1B"
    }
  },
  {
    "name": "Desert Bloom",
    "group": "earthy",
    "tags": [
      "natural",
      "botanical",
      "grounded"
    ],
    "colors": {
      "primary": "#B8860B",
      "secondary": "#DAA520",
      "accent": "#E9967A",
      "background": "#FFFCF5",
      "ink": "#3A2F0B"
    }
  },
  {
    "name": "Wheat Field",
    "group": "earthy",
    "tags": [
      "natural",
      "grounded",
      "handmade"
    ],
    "colors": {
      "primary": "#9A7B4F",
      "secondary": "#C19A6B",
      "accent": "#DEB887",
      "background": "#FBF9F4",
      "ink": "#3D2F1F"
    }
  },
  {
    "name": "Ocean Kelp",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#2F4F4F",
      "secondary": "#5F9EA0",
      "accent": "#8FBC8F",
      "background": "#F5F9F9",
      "ink": "#1A2828"
    }
  },
  {
    "name": "Terracotta Sun",
    "group": "earthy",
    "tags": [
      "handmade",
      "grounded",
      "natural"
    ],
    "colors": {
      "primary": "#CC5500",
      "secondary": "#E97451",
      "accent": "#F4A460",
      "background": "#FFF8F3",
      "ink": "#331500"
    }
  },
  {
    "name": "Sage Meadow",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#7A8450",
      "secondary": "#9CAF88",
      "accent": "#C1CFA7",
      "background": "#F9FAF7",
      "ink": "#2E3320"
    }
  },
  {
    "name": "Amber Harvest",
    "group": "earthy",
    "tags": [
      "natural",
      "grounded",
      "handmade"
    ],
    "colors": {
      "primary": "#C17817",
      "secondary": "#D4A574",
      "accent": "#E8C89E",
      "background": "#FFFCF8",
      "ink": "#3B2508"
    }
  },
  {
    "name": "Pine Bark",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#4E342E",
      "secondary": "#6D4C41",
      "accent": "#8D6E63",
      "background": "#F7F4F3",
      "ink": "#1B0F0D"
    }
  },
  {
    "name": "Olive Grove",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#556B2F",
      "secondary": "#808000",
      "accent": "#9ACD32",
      "background": "#F9FAF5",
      "ink": "#252E14"
    }
  },
  {
    "name": "Rust Earth",
    "group": "earthy",
    "tags": [
      "grounded",
      "handmade",
      "natural"
    ],
    "colors": {
      "primary": "#B7410E",
      "secondary": "#CD5C5C",
      "accent": "#E67E50",
      "background": "#FFF8F5",
      "ink": "#331204"
    }
  },
  {
    "name": "Eucalyptus Mist",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#4A7C59",
      "secondary": "#6B9B7F",
      "accent": "#A7C4BC",
      "background": "#F7FAF8",
      "ink": "#1E2F25"
    }
  },
  {
    "name": "Sandstone Valley",
    "group": "earthy",
    "tags": [
      "natural",
      "grounded",
      "handmade"
    ],
    "colors": {
      "primary": "#AF8260",
      "secondary": "#C9A87D",
      "accent": "#E4CCAD",
      "background": "#FCF9F6",
      "ink": "#3A2B1F"
    }
  },
  {
    "name": "Juniper Berry",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#2C5F2D",
      "secondary": "#4A7C59",
      "accent": "#6A994E",
      "background": "#F6F9F6",
      "ink": "#1A2E1A"
    }
  },
  {
    "name": "Copper Canyon",
    "group": "earthy",
    "tags": [
      "grounded",
      "natural",
      "handmade"
    ],
    "colors": {
      "primary": "#A0522D",
      "secondary": "#BC6C25",
      "accent": "#D4925A",
      "background": "#FBF7F4",
      "ink": "#331B0F"
    }
  },
  {
    "name": "Fern Shade",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#3B5441",
      "secondary": "#5A7C66",
      "accent": "#88A17A",
      "background": "#F6F9F7",
      "ink": "#1A2420"
    }
  },
  {
    "name": "Honey Drizzle",
    "group": "earthy",
    "tags": [
      "natural",
      "handmade",
      "grounded"
    ],
    "colors": {
      "primary": "#CA800E",
      "secondary": "#E6A23C",
      "accent": "#F5C77E",
      "background": "#FFFDF8",
      "ink": "#3E2805"
    }
  },
  {
    "name": "Walnut Shell",
    "group": "earthy",
    "tags": [
      "grounded",
      "handmade",
      "natural"
    ],
    "colors": {
      "primary": "#5D4037",
      "secondary": "#795548",
      "accent": "#A1887F",
      "background": "#F8F6F4",
      "ink": "#1F1512"
    }
  },
  {
    "name": "Lichen Stone",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#6B7C59",
      "secondary": "#8B9D7C",
      "accent": "#B5C4A1",
      "background": "#F9FAF7",
      "ink": "#2A3023"
    }
  },
  {
    "name": "Burnt Sienna",
    "group": "earthy",
    "tags": [
      "grounded",
      "handmade",
      "natural"
    ],
    "colors": {
      "primary": "#A0410D",
      "secondary": "#C65D3B",
      "accent": "#E08B5B",
      "background": "#FFF7F4",
      "ink": "#2F1404"
    }
  },
  {
    "name": "Bamboo Forest",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#4F6F52",
      "secondary": "#739072",
      "accent": "#A4C3A2",
      "background": "#F7FAF7",
      "ink": "#202B20"
    }
  },
  {
    "name": "Saffron Thread",
    "group": "earthy",
    "tags": [
      "natural",
      "handmade",
      "botanical"
    ],
    "colors": {
      "primary": "#D97706",
      "secondary": "#F59E0B",
      "accent": "#FBB03B",
      "background": "#FFFCF5",
      "ink": "#3D2502"
    }
  },
  {
    "name": "Cedar Wood",
    "group": "earthy",
    "tags": [
      "natural",
      "grounded",
      "botanical"
    ],
    "colors": {
      "primary": "#8B5A3C",
      "secondary": "#A67C52",
      "accent": "#C9A677",
      "background": "#FBF8F5",
      "ink": "#331F16"
    }
  },
  {
    "name": "Thyme Sprigs",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#5B7553",
      "secondary": "#7D9A72",
      "accent": "#A8BF9C",
      "background": "#F8FAF7",
      "ink": "#242E22"
    }
  },
  {
    "name": "Ochre Earth",
    "group": "earthy",
    "tags": [
      "grounded",
      "natural",
      "handmade"
    ],
    "colors": {
      "primary": "#CC7722",
      "secondary": "#DD9933",
      "accent": "#E6B85C",
      "background": "#FFFBF5",
      "ink": "#3A2208"
    }
  },
  {
    "name": "Ivy Climb",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#3A5A40",
      "secondary": "#588157",
      "accent": "#7FA77C",
      "background": "#F6F9F7",
      "ink": "#1B2720"
    }
  },
  {
    "name": "Cinnamon Bark",
    "group": "earthy",
    "tags": [
      "natural",
      "handmade",
      "grounded"
    ],
    "colors": {
      "primary": "#9B4A20",
      "secondary": "#B8693F",
      "accent": "#D49269",
      "background": "#FBF7F4",
      "ink": "#2E160A"
    }
  },
  {
    "name": "Willow Branch",
    "group": "earthy",
    "tags": [
      "botanical",
      "natural",
      "grounded"
    ],
    "colors": {
      "primary": "#5F7C4E",
      "secondary": "#7E9C6B",
      "accent": "#A5BC93",
      "background": "#F8FAF7",
      "ink": "#252F1F"
    }
  },
  {
    "name": "Turmeric Root",
    "group": "earthy",
    "tags": [
      "natural",
      "botanical",
      "handmade"
    ],
    "colors": {
      "primary": "#D97917",
      "secondary": "#E89B3C",
      "accent": "#F3C07A",
      "background": "#FFFDF7",
      "ink": "#3C2507"
    }
  },
  {
    "name": "Peat Moss",
    "group": "earthy",
    "tags": [
      "botanical",
      "grounded",
      "natural"
    ],
    "colors": {
      "primary": "#4A5D3F",
      "secondary": "#687C5A",
      "accent": "#92A687",
      "background": "#F7F9F6",
      "ink": "#1E2519"
    }
  },
  {
    "name": "Adobe Clay",
    "group": "earthy",
    "tags": [
      "grounded",
      "handmade",
      "natural"
    ],
    "colors": {
      "primary": "#B8531A",
      "secondary": "#D17842",
      "accent": "#E5A073",
      "background": "#FFF8F4",
      "ink": "#341808"
    }
  },
  {
    "name": "Sunset Boulevard",
    "group": "retro",
    "tags": [
      "nostalgic",
      "warm",
      "classic"
    ],
    "colors": {
      "primary": "#D94F2A",
      "secondary": "#E8A445",
      "accent": "#8B5A3C",
      "background": "#FFF9F5",
      "ink": "#2B1810"
    }
  },
  {
    "name": "Vinyl Groove",
    "group": "retro",
    "tags": [
      "retro",
      "mid-century",
      "bold"
    ],
    "colors": {
      "primary": "#C84B31",
      "secondary": "#2A5C6F",
      "accent": "#ECAB5E",
      "background": "#FBF8F3",
      "ink": "#1A1A1A"
    }
  },
  {
    "name": "Faded Denim",
    "group": "retro",
    "tags": [
      "vintage",
      "cool",
      "worn"
    ],
    "colors": {
      "primary": "#4A6FA5",
      "secondary": "#8B9DC3",
      "accent": "#C58B62",
      "background": "#F7F9FB",
      "ink": "#1F2937"
    }
  },
  {
    "name": "Mustard Memories",
    "group": "retro",
    "tags": [
      "nostalgic",
      "warm-faded",
      "earthy"
    ],
    "colors": {
      "primary": "#B78B27",
      "secondary": "#8B4513",
      "accent": "#6B8E68",
      "background": "#FFFBF0",
      "ink": "#2C1810"
    }
  },
  {
    "name": "Teal Dreams",
    "group": "retro",
    "tags": [
      "mid-century",
      "retro",
      "calm"
    ],
    "colors": {
      "primary": "#2A9D8F",
      "secondary": "#E76F51",
      "accent": "#F4A261",
      "background": "#F8FCFB",
      "ink": "#1C1C1C"
    }
  },
  {
    "name": "Coral Motel",
    "group": "retro",
    "tags": [
      "vintage",
      "warm",
      "faded"
    ],
    "colors": {
      "primary": "#E75A4C",
      "secondary": "#F9C784",
      "accent": "#5B8C85",
      "background": "#FFFAF8",
      "ink": "#221814"
    }
  },
  {
    "name": "Olive Avenue",
    "group": "retro",
    "tags": [
      "classic",
      "earthy",
      "subdued"
    ],
    "colors": {
      "primary": "#6B7F3A",
      "secondary": "#C4A564",
      "accent": "#A85042",
      "background": "#FAFBF6",
      "ink": "#2A2419"
    }
  },
  {
    "name": "Purple Haze",
    "group": "retro",
    "tags": [
      "retro",
      "psychedelic",
      "nostalgic"
    ],
    "colors": {
      "primary": "#8B5FB5",
      "secondary": "#E89F6C",
      "accent": "#D94976",
      "background": "#FBF9FC",
      "ink": "#1F1522"
    }
  },
  {
    "name": "Burnt Sienna II",
    "group": "retro",
    "tags": [
      "warm-faded",
      "vintage",
      "earthy"
    ],
    "colors": {
      "primary": "#B5573F",
      "secondary": "#D8AF7A",
      "accent": "#4A6C6A",
      "background": "#FFF8F4",
      "ink": "#261A15"
    }
  },
  {
    "name": "Peacock Lounge",
    "group": "retro",
    "tags": [
      "mid-century",
      "bold",
      "jewel"
    ],
    "colors": {
      "primary": "#1B6B93",
      "secondary": "#2C9AA0",
      "accent": "#D87A4D",
      "background": "#F6FAFB",
      "ink": "#0F1E24"
    }
  },
  {
    "name": "Marigold Afternoon",
    "group": "retro",
    "tags": [
      "nostalgic",
      "warm",
      "cheerful"
    ],
    "colors": {
      "primary": "#D57A1F",
      "secondary": "#8B6C42",
      "accent": "#C14A3D",
      "background": "#FFFCF7",
      "ink": "#231A12"
    }
  },
  {
    "name": "Sage Wisdom",
    "group": "retro",
    "tags": [
      "vintage",
      "calm",
      "muted"
    ],
    "colors": {
      "primary": "#779973",
      "secondary": "#C9B896",
      "accent": "#B57969",
      "background": "#F9FBF9",
      "ink": "#24271E"
    }
  },
  {
    "name": "Cherry Cola",
    "group": "retro",
    "tags": [
      "retro",
      "bold",
      "americana"
    ],
    "colors": {
      "primary": "#B92D3A",
      "secondary": "#F7D794",
      "accent": "#3D5A6B",
      "background": "#FFF9F9",
      "ink": "#1A0F11"
    }
  },
  {
    "name": "Turquoise Trailer",
    "group": "retro",
    "tags": [
      "mid-century",
      "playful",
      "bright"
    ],
    "colors": {
      "primary": "#399E97",
      "secondary": "#F4A261",
      "accent": "#D84654",
      "background": "#F7FCFB",
      "ink": "#1A2624"
    }
  },
  {
    "name": "Harvest Gold",
    "group": "retro",
    "tags": [
      "warm-faded",
      "classic",
      "homely"
    ],
    "colors": {
      "primary": "#B78D38",
      "secondary": "#8B5A3C",
      "accent": "#A65D5D",
      "background": "#FFFDF7",
      "ink": "#2B2217"
    }
  },
  {
    "name": "Plum Velvet",
    "group": "retro",
    "tags": [
      "vintage",
      "rich",
      "elegant"
    ],
    "colors": {
      "primary": "#7A4E7E",
      "secondary": "#B8936E",
      "accent": "#C76B5B",
      "background": "#FBF8FA",
      "ink": "#211520"
    }
  },
  {
    "name": "Seafoam Memory",
    "group": "retro",
    "tags": [
      "nostalgic",
      "cool",
      "gentle"
    ],
    "colors": {
      "primary": "#549F8E",
      "secondary": "#E6B88A",
      "accent": "#D4695B",
      "background": "#F8FCFA",
      "ink": "#1B2623"
    }
  },
  {
    "name": "Copper Kettle",
    "group": "retro",
    "tags": [
      "warm",
      "metallic",
      "classic"
    ],
    "colors": {
      "primary": "#B56C47",
      "secondary": "#D9A15F",
      "accent": "#5B7B6A",
      "background": "#FFF9F6",
      "ink": "#281B14"
    }
  },
  {
    "name": "Lavender Sachet",
    "group": "retro",
    "tags": [
      "vintage",
      "soft",
      "feminine"
    ],
    "colors": {
      "primary": "#9B7BA5",
      "secondary": "#D5A98F",
      "accent": "#C85F6D",
      "background": "#FAF9FB",
      "ink": "#241D25"
    }
  },
  {
    "name": "Brick Terrace",
    "group": "retro",
    "tags": [
      "retro",
      "warm-faded",
      "solid"
    ],
    "colors": {
      "primary": "#A84632",
      "secondary": "#D9B382",
      "accent": "#5A7B7A",
      "background": "#FFF9F6",
      "ink": "#251712"
    }
  },
  {
    "name": "Mint Condition",
    "group": "retro",
    "tags": [
      "mid-century",
      "fresh",
      "clean"
    ],
    "colors": {
      "primary": "#589F7F",
      "secondary": "#E8A55D",
      "accent": "#D86053",
      "background": "#F8FCF9",
      "ink": "#1A2721"
    }
  },
  {
    "name": "Amber Glow",
    "group": "retro",
    "tags": [
      "nostalgic",
      "warm",
      "luminous"
    ],
    "colors": {
      "primary": "#CC8226",
      "secondary": "#8F5B3C",
      "accent": "#6B8576",
      "background": "#FFFCF6",
      "ink": "#261D13"
    }
  },
  {
    "name": "Dusty Rose",
    "group": "retro",
    "tags": [
      "vintage",
      "romantic",
      "faded"
    ],
    "colors": {
      "primary": "#C17B7B",
      "secondary": "#D4B896",
      "accent": "#6B8FA5",
      "background": "#FBF8F8",
      "ink": "#281E1E"
    }
  },
  {
    "name": "Forest Cabin",
    "group": "retro",
    "tags": [
      "classic",
      "earthy",
      "rustic"
    ],
    "colors": {
      "primary": "#4E6B3E",
      "secondary": "#C5995F",
      "accent": "#A35D4D",
      "background": "#F8FAF6",
      "ink": "#1E2419"
    }
  },
  {
    "name": "Tangerine Twist",
    "group": "retro",
    "tags": [
      "retro",
      "vibrant",
      "playful"
    ],
    "colors": {
      "primary": "#E76F30",
      "secondary": "#4A8A9B",
      "accent": "#D9A73E",
      "background": "#FFFAF7",
      "ink": "#1F1712"
    }
  },
  {
    "name": "Slate Blue",
    "group": "retro",
    "tags": [
      "mid-century",
      "cool",
      "sophisticated"
    ],
    "colors": {
      "primary": "#5B7C9E",
      "secondary": "#C8A682",
      "accent": "#B65D5F",
      "background": "#F8FAFB",
      "ink": "#1A1F26"
    }
  },
  {
    "name": "Butterscotch Dream",
    "group": "retro",
    "tags": [
      "warm-faded",
      "sweet",
      "nostalgic"
    ],
    "colors": {
      "primary": "#BE882B",
      "secondary": "#9B6B49",
      "accent": "#7A8F6D",
      "background": "#FFFDF8",
      "ink": "#271F14"
    }
  },
  {
    "name": "Crimson Record",
    "group": "retro",
    "tags": [
      "vintage",
      "bold",
      "dramatic"
    ],
    "colors": {
      "primary": "#A13844",
      "secondary": "#E5A867",
      "accent": "#3D6672",
      "background": "#FFF9F9",
      "ink": "#1D1013"
    }
  },
  {
    "name": "Pistachio Parlor",
    "group": "retro",
    "tags": [
      "retro",
      "cool",
      "cheerful"
    ],
    "colors": {
      "primary": "#77986C",
      "secondary": "#E8B475",
      "accent": "#C96B5F",
      "background": "#F9FBF8",
      "ink": "#212519"
    }
  },
  {
    "name": "Sandstone Path",
    "group": "retro",
    "tags": [
      "warm",
      "neutral",
      "timeless"
    ],
    "colors": {
      "primary": "#B38B61",
      "secondary": "#8B6F4E",
      "accent": "#A65B57",
      "background": "#FFFCF8",
      "ink": "#261F18"
    }
  },
  {
    "name": "Periwinkle Sky",
    "group": "retro",
    "tags": [
      "nostalgic",
      "dreamy",
      "soft"
    ],
    "colors": {
      "primary": "#7B8CB4",
      "secondary": "#D9A97D",
      "accent": "#C87269",
      "background": "#F9FAFC",
      "ink": "#1C1E25"
    }
  },
  {
    "name": "Tobacco Leaf",
    "group": "retro",
    "tags": [
      "classic",
      "rich",
      "masculine"
    ],
    "colors": {
      "primary": "#8E5B3A",
      "secondary": "#C4A46B",
      "accent": "#6B7F65",
      "background": "#FBF9F6",
      "ink": "#231710"
    }
  }
];
