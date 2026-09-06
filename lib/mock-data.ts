export type HeroFeedShow = {
  id: number;
  kind: "show";
  channel: string;
  slot: string;
  status: string;
  title: string;
  subtitle: string;
  detail: string;
  viewers: string;
  predicted: string;
  action: string;
  poster: string;
  liveChatCount?: number;
  topPrediction?: string;
  momentum?: "up" | "flat" | "down";
};

export type HeroFeedPrediction = {
  id: number;
  kind: "prediction";
  poster: string;
  show: string;
  question: string;
  detail: string;
  trend: string;
  votes: Array<{ label: string; percent: number }>;
  action: string;
  status: string;
};

export type HeroFeedItem = HeroFeedShow | HeroFeedPrediction;

export type CategoryPill = {
  id: number;
  label: string;
  active?: boolean;
};

export type ChannelCard = {
  id: number;
  channel: string;
  title: string;
  status: string;
  note: string;
  poster: string;
  // Rendering mode for curated layout
  mode?: "poster" | "logo" | "typography" | "live" | "prediction";
  // Fallback logo or vertical-safe image when poster is weak
  logoFallback?: string;
  // Visual weight hint for sequencing: bright / dark / face / logo
  visualWeight?: "bright" | "dark" | "face" | "logo" | "typography";
  // Number of people actively discussing right now (approx)
  discussingCount?: number;
  // activity level hint
  activity?: "low" | "medium" | "high";
};

export type ChatterPost = {
  id: number;
  user: string;
  avatar: string;
  message: string;
  show: string;
  time: string;
  accuracy?: number;
  badge?: string;
  // social indicators for richer chatter UI
  mutual?: boolean;
  streak?: number;
  agreementCount?: number;
  switchedSides?: boolean;
};

export const categories: CategoryPill[] = [
  { id: 1, label: "Following", active: true },
  { id: 2, label: "Reality" },
  { id: 3, label: "Drama" },
  { id: 4, label: "Sports" },
  { id: 5, label: "Awards" },
  { id: 6, label: "Entertainment" },
];

export type BriefCard = {
  id: number;
  category: string;
  headline: string;
  context: string;
  image: string;
};

export const tonightsBrief: BriefCard[] = [
  {
    id: 1,
    category: "PREDICTION OPEN",
    headline: "Survivor picks close at 8PM",
    context: "62% of forecasters think the alliance holds. Lock in before tonight.",
    image: "https://www.tvline.com/img/gallery/survivor-49-recap-episode-8/the-tribe-has-spoken-1762973085.jpg",
  },
  {
    id: 2,
    category: "RETURNING",
    headline: "Big Brother live feeds open tonight",
    context: "The house goes live after the premiere. First alliance forming.",
    image: "https://variety.com/wp-content/uploads/2025/07/3090548_0110b.jpg?w=1000&h=667&crop=1",
  },
  {
    id: 3,
    category: "RECOMMENDED",
    headline: "You watch Love Island — try Love Is Blind",
    context: "New episodes Wednesday. 41% already predicted the final pairings.",
    image: "https://deadline.com/wp-content/uploads/2025/09/love-is-blind-season-9-cast-photos-netflix.jpg?w=1000&h=667&crop=1",
  },
  {
    id: 4,
    category: "CASTING",
    headline: "Bachelor reportedly eyeing a fan favorite for next season",
    context: "ABC sources say Season 30 leads are being narrowed down now.",
    image: "https://deadline.com/wp-content/uploads/2025/01/174443_0017-900x0-copy.jpg?w=1000&h=667&crop=1",
  },
  {
    id: 5,
    category: "RENEWED",
    headline: "HOTD Season 3 premiere window is narrowing",
    context: "2.1K predictions already locked in. Cast your pick before it drops.",
    image: "https://variety.com/wp-content/uploads/2026/02/house-of-the-dragon-s3.jpg?w=1000&h=667&crop=1",
  },
];

// ── Predict page data ────────────────────────────────────────────────────────

export type PredictStats = {
  streak: number;
  accuracy: number;
  correctThisWeek: number;
};

export type ClosingCard = {
  id: number;
  show: string;
  question: string;
  closesIn: string;
  yesPercent: number;
  poster: string;
  cta: string;
};

export type LiveQuestion = {
  id: number;
  show: string;
  question: string;
  options: string[];
  totalVotes: number;
  crowdSplit: number[]; // percent per option, same order as options
};

export type UpcomingItem = {
  id: number;
  show: string;
  description: string;
  opensAt: string;
};

export type PastItem = {
  id: number;
  show: string;
  question: string;
  pick: string;
  result: "correct" | "wrong" | "pending";
};

export const upcomingItems: UpcomingItem[] = [
  {
    id: 1,
    show: "The Bachelor",
    description: "Final rose prediction opens",
    opensAt: "Tonight 8PM",
  },
  {
    id: 2,
    show: "Survivor",
    description: "Season winner picks open",
    opensAt: "Tomorrow",
  },
  {
    id: 3,
    show: "House of the Dragon",
    description: "Succession debate opens",
    opensAt: "Sunday",
  },
];

export const pastItems: PastItem[] = [
  {
    id: 1,
    show: "Love Island USA",
    question: "Will tonight's recoupling have a surprise twist?",
    pick: "Yes",
    result: "correct",
  },
  {
    id: 2,
    show: "Big Brother",
    question: "Will Katherine be evicted this week?",
    pick: "Yes",
    result: "correct",
  },
  {
    id: 3,
    show: "Survivor",
    question: "Will the immunity idol change tribal council?",
    pick: "No",
    result: "wrong",
  },
  {
    id: 4,
    show: "RuPaul's Drag Race",
    question: "Will AJ win the lip-sync in Ep 11?",
    pick: "Yes",
    result: "pending",
  },
];

// ── Profile page data ────────────────────────────────────────────────────────

export type Trophy = {
  id: number;
  icon: string;
  name: string;
  description: string;
  earned: boolean;
};

export type FollowedShow = {
  id: number;
  title: string;
  status: string;
  poster: string;
  accuracy?: number;
};

export type ProfileActivity = {
  id: number;
  type: "prediction" | "comment" | "trophy" | "streak";
  action: string;
  detail: string;
  show: string;
  time: string;
};

export type ProfileFriend = {
  id: number;
  name: string;
  avatar: string;
  accuracy?: number;
  badge?: string;
  activity?: string;
};

export const trophies: Trophy[] = [
  { id: 1, icon: "🎯", name: "Called It", description: "Predicted against the crowd and got it right", earned: true },
  { id: 2, icon: "🔥", name: "Hot Streak", description: "4 or more correct picks in a row", earned: true },
  { id: 3, icon: "👑", name: "Reality Expert", description: "75%+ accuracy across all reality shows", earned: true },
  { id: 4, icon: "🎙️", name: "Live Room Regular", description: "Active in 10 or more live rooms", earned: true },
  { id: 5, icon: "🔮", name: "Finale Prophet", description: "Correctly predicted 3 or more season finales", earned: true },
  { id: 6, icon: "⚡", name: "First Call", description: "First to lock in a correct prediction", earned: true },
];

export const followedShows: FollowedShow[] = [
  {
    id: 1,
    title: "Love Island USA",
    status: "LIVE",
    poster: "https://deadline.com/wp-content/uploads/2025/06/love-island-usa-season-7-recoupling.jpg?w=1000&h=667&crop=1",
    accuracy: 73,
  },
  {
    id: 2,
    title: "Survivor",
    status: "LIVE",
    poster: "/survivor-challenge.webp",
    accuracy: 68,
  },
  {
    id: 3,
    title: "Big Brother",
    status: "LIVE",
    poster: "https://www.tvline.com/tvline/recaps/big-brother-recap-katherine-evicted-season-27-week-7-1235494086/big-brother-live-eviction-week-7.png.jpg",
    accuracy: 55,
  },
  {
    id: 4,
    title: "House of the Dragon",
    status: "RETURNS",
    poster: "https://variety.com/wp-content/uploads/2026/04/House-of-the-Dragon-emma-d-arcy.jpg?w=1000&h=667&crop=1",
    accuracy: 61,
  },
  {
    id: 5,
    title: "Severance",
    status: "RETURNS",
    poster: "https://variety.com/wp-content/uploads/2025/03/Severance-finale-Mark-Helly.2.jpg?w=1000&h=667&crop=1",
    accuracy: 58,
  },
  {
    id: 6,
    title: "Drag Race",
    status: "FINALE",
    poster: "https://deadline.com/wp-content/uploads/2025/04/GettyImages-2209679837.jpg?w=1000&h=667&crop=1",
    accuracy: 70,
  },
];

export const profileActivity: ProfileActivity[] = [
  {
    id: 1,
    type: "prediction",
    action: "Locked in",
    detail: "Serena survives recoupling",
    show: "Love Island USA",
    time: "2m",
  },
  {
    id: 2,
    type: "comment",
    action: "Joined room",
    detail: "Tribal Tonight",
    show: "Survivor",
    time: "15m",
  },
  {
    id: 3,
    type: "trophy",
    action: "Earned",
    detail: "Hot Streak badge",
    show: "",
    time: "1h",
  },
  {
    id: 4,
    type: "comment",
    action: "Agreed with Maya",
    detail: "Producers are protecting Serena",
    show: "Love Island USA",
    time: "1h",
  },
  {
    id: 5,
    type: "prediction",
    action: "Correct call",
    detail: "Katherine evicted",
    show: "Big Brother",
    time: "Yesterday",
  },
];

export const profileFriends: ProfileFriend[] = [
  {
    id: 1,
    name: "Maya",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    accuracy: 92,
    badge: "called it",
  },
  {
    id: 2,
    name: "Cruz",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    accuracy: 90,
    badge: "hot streak",
  },
  {
    id: 3,
    name: "Tess",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
    accuracy: 89,
    activity: "Survivor room",
  },
  {
    id: 4,
    name: "Jon",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    activity: "Big Brother room",
  },
];
