export type Viewpoint = {
  slug: string;
  title: string;
  shortTitle: string;
  region: string;
  country: string;
  rating: number;
  reviews: number;
  rank: number;
  category: 'Mountains' | 'Sunsets' | 'City lights' | 'Coastlines' | 'Hidden gems';
  bestTime: string;
  bestSeason: string;
  difficulty: string;
  cost: string;
  walk: string;
  lookDirection: string;
  coordinates: string;
  latitude: number;
  longitude: number;
  altitude: string;
  detour: number;
  image: string;
  thumb: string;
  description: string;
  tip: string;
};

export const viewpoints: Viewpoint[] = [
  {
    slug: 'seceda-ridgeline',
    title: 'Seceda Ridgeline',
    shortTitle: 'Seceda',
    region: 'South Tyrol',
    country: 'Italy',
    rating: 4.96,
    reviews: 842,
    rank: 1,
    category: 'Mountains',
    bestTime: '06:10–07:30',
    bestSeason: 'June–September',
    difficulty: 'Moderate',
    cost: 'Cable car €45',
    walk: '22 min from Seceda cable-car station',
    lookDirection: 'Face east toward the Odle peaks',
    coordinates: '46.6005° N, 11.7248° E',
    latitude: 46.6005,
    longitude: 11.7248,
    altitude: '2,519 m',
    detour: 94,
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2200&q=92',
    thumb: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=86',
    description: 'A knife-edge meadow above Val Gardena, facing the pale Odle spires as the first light moves across the ridge.',
    tip: 'Leave the upper cable-car station to your right and follow the ridgeline path for 1.4 km. The quieter ledge begins just beyond the second wooden gate.',
  },
  {
    slug: 'vernazza-overlook',
    title: 'Vernazza Overlook',
    shortTitle: 'Vernazza',
    region: 'Liguria',
    country: 'Italy',
    rating: 4.92,
    reviews: 619,
    rank: 2,
    category: 'Sunsets',
    bestTime: '18:40–20:10',
    bestSeason: 'April–October',
    difficulty: 'Easy',
    cost: 'Trail pass €7.50',
    walk: '14 min from Vernazza trailhead',
    lookDirection: 'Look southwest over the harbour',
    coordinates: '44.1353° N, 9.6822° E',
    latitude: 44.1353,
    longitude: 9.6822,
    altitude: '92 m',
    detour: 91,
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=92',
    thumb: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=86',
    description: 'The classic high angle over Vernazza, where the village, harbour and Ligurian coast settle into one perfect frame.',
    tip: 'Take the Monterosso trail uphill for about 12 minutes. The best standing point is the second stone opening after the ticket checkpoint.',
  },
  {
    slug: 'top-of-the-rock',
    title: 'Top of the Rock',
    shortTitle: 'Top of the Rock',
    region: 'New York City',
    country: 'United States',
    rating: 4.89,
    reviews: 1943,
    rank: 5,
    category: 'City lights',
    bestTime: '19:20–20:40',
    bestSeason: 'September–November',
    difficulty: 'Step-free',
    cost: 'From $40',
    walk: '2 min from the elevator exit',
    lookDirection: 'Face south toward Midtown',
    coordinates: '40.7593° N, 73.9794° W',
    latitude: 40.7593,
    longitude: -73.9794,
    altitude: '260 m',
    detour: 89,
    image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=2200&q=92',
    thumb: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=600&q=86',
    description: 'An open-air, unobstructed view straight down Manhattan with the Empire State Building centered in the skyline.',
    tip: 'Book a slot 45 minutes before sunset. Go directly to the uppermost deck, then stand at the southwest corner for the cleanest view.',
  },
  {
    slug: 'pico-do-arieiro',
    title: 'Pico do Arieiro Cloud Deck',
    shortTitle: 'Pico do Arieiro',
    region: 'Madeira',
    country: 'Portugal',
    rating: 4.87,
    reviews: 718,
    rank: 7,
    category: 'Mountains',
    bestTime: '06:40–08:00',
    bestSeason: 'May–October',
    difficulty: 'Easy',
    cost: 'Free',
    walk: '8 min from the summit car park',
    lookDirection: 'Look east above the cloud layer',
    coordinates: '32.7351° N, 16.9289° W',
    latitude: 32.7351,
    longitude: -16.9289,
    altitude: '1,818 m',
    detour: 93,
    image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=2200&q=92',
    thumb: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=600&q=86',
    description: 'A volcanic balcony that often sits above Madeira’s moving cloud sea, with the island peaks breaking through at sunrise.',
    tip: 'Skip the summit platform. Walk eight minutes down PR1 to the first broad stone terrace; it separates the foreground peaks beautifully.',
  },
  {
    slug: 'moraine-lake-rockpile',
    title: 'Moraine Lake Rockpile',
    shortTitle: 'Moraine Lake',
    region: 'Alberta',
    country: 'Canada',
    rating: 4.86,
    reviews: 1106,
    rank: 8,
    category: 'Hidden gems',
    bestTime: '05:50–07:10',
    bestSeason: 'July–September',
    difficulty: 'Easy',
    cost: 'Shuttle required',
    walk: '10 min from the shuttle drop-off',
    lookDirection: 'Face southwest across the lake',
    coordinates: '51.3276° N, 116.1818° W',
    latitude: 51.3276,
    longitude: -116.1818,
    altitude: '1,885 m',
    detour: 92,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=92',
    thumb: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=86',
    description: 'Turquoise water, larch forest and the Valley of Ten Peaks aligned from a natural rock terrace above the shore.',
    tip: 'Climb the Rockpile Trail and continue beyond the first railing. The final bend has more foreground trees and fewer people.',
  },
  {
    slug: 'kjerag-plateau',
    title: 'Kjerag Plateau',
    shortTitle: 'Kjerag',
    region: 'Rogaland',
    country: 'Norway',
    rating: 4.84,
    reviews: 483,
    rank: 11,
    category: 'Coastlines',
    bestTime: '15:00–18:00',
    bestSeason: 'June–September',
    difficulty: 'Hard',
    cost: 'Parking NOK 300',
    walk: '5–6 hr return from Øygardstøl car park',
    lookDirection: 'Look northwest along Lysefjord',
    coordinates: '59.0337° N, 6.5930° E',
    latitude: 59.0337,
    longitude: 6.593,
    altitude: '1,084 m',
    detour: 90,
    image: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=2200&q=92',
    thumb: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=600&q=86',
    description: 'A broad granite shelf hanging more than a kilometre above Lysefjord, with extraordinary scale in every direction.',
    tip: 'The most balanced panorama is not at Kjeragbolten. Continue 180 m northwest to the flat shelf with a single low cairn.',
  },
];

export const categories = ['For you', 'Sunsets', 'Mountains', 'City lights', 'Coastlines', 'Hidden gems'] as const;

export function getViewpoint(slug: string) {
  return viewpoints.find((view) => view.slug === slug);
}
