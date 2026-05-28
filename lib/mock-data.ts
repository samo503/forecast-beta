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

export const heroFeed: HeroFeedItem[] = [
  {
    id: 1,
    kind: "show",
    channel: "CH 01",
    slot: "LIVE NOW",
    status: "LIVE",
    title: "Love Island",
    subtitle: "USA",
    detail: "S6 E12 · Tonight 9PM ET",
    viewers: "7.82k watching",
    predicted: "68% predicted right",
    action: "ENTER THE VILLA",
    poster:
      "https://deadline.com/wp-content/uploads/2025/05/love-island-usa-season-7-cast-photos.jpg?w=1000&h=667&crop=1",
    liveChatCount: 7820,
    topPrediction: "Serena stays",
    momentum: "up",
  },
  {
    id: 4,
    kind: "prediction",
    poster:
      "https://variety.com/wp-content/uploads/2026/04/House-of-the-Dragon-emma-d-arcy.jpg?w=1000&h=667&crop=1",
    show: "House of the Dragon",
    question: "Has the throne already been decided?",
    detail: "Audience debate heating up around the next succession move",
    trend: "Dragon scale rising",
    votes: [
      { label: "Rhaenyra", percent: 62 },
      { label: "Alicent", percent: 38 },
    ],
    action: "Join the debate",
    status: "TRENDING",
  },
  {
    id: 5,
    kind: "show",
    channel: "CH 07",
    slot: "WORKING",
    status: "LIVE",
    title: "Severance",
    subtitle: "Lumon Files",
    detail: "M3 E1 · New mystery drops",
    viewers: "2.9K watching",
    predicted: "89% think it’s a setup",
    action: "Enter Lumon",
    poster:
      "https://variety.com/wp-content/uploads/2025/03/Severance-finale-Mark-Helly.2.jpg?w=1000&h=667&crop=1",
    liveChatCount: 2900,
    topPrediction: "Mark finds the exit",
    momentum: "down",
  },
  {
    id: 2,
    kind: "prediction",
    poster:
      "https://www.tvline.com/tvline/recaps/big-brother-recap-katherine-evicted-season-27-week-7-1235494086/big-brother-live-eviction-week-7.png.jpg",
    show: "Big Brother",
    question: "Will tonight’s eviction shock the house?",
    detail: "Live vote trending as eviction closes",
    trend: "Eviction heat +17",
    votes: [
      { label: "Yes", percent: 57 },
      { label: "No", percent: 43 },
    ],
    action: "Cast a prediction",
    status: "LIVE POLL",
  },
  {
    id: 3,
    kind: "show",
    channel: "CH 04",
    slot: "PREMIERE",
    status: "FINAL",
    title: "RuPaul’s Drag Race",
    subtitle: "Live Finale",
    detail: "Final lip-sync showdown",
    viewers: "1.1K watching",
    predicted: "73% say winner locked",
    action: "ENTER THE STAGE",
    poster:
      "https://deadline.com/wp-content/uploads/2025/04/GettyImages-2209679837.jpg?w=1000&h=667&crop=1",
    liveChatCount: 1100,
    topPrediction: "Winner: AJ",
    momentum: "up",
  },
];

export const categories: CategoryPill[] = [
  { id: 1, label: "Following", active: true },
  { id: 2, label: "Reality" },
  { id: 3, label: "Drama" },
  { id: 4, label: "Sports" },
  { id: 5, label: "Awards" },
  { id: 6, label: "Entertainment" },
];

export const channelCards: ChannelCard[] = [
  {
    id: 14,
    channel: "CH 09",
    title: "Love Island",
    status: "LIVE",
    note: "New Episode Daily",
    poster: "https://deadline.com/wp-content/uploads/2025/06/love-island-usa-season-7-recoupling.jpg?w=1000&h=667&crop=1",
    mode: "poster",
    visualWeight: "bright",
    discussingCount: 5600,
    activity: "high",
  },
  {
    id: 10,
    channel: "CH 11",
    title: "Survivor",
    status: "LIVE",
    note: "S49 · Tribal Tonight",
    poster: "/survivor-challenge.webp",
    mode: "poster",
    visualWeight: "dark",
    discussingCount: 1800,
    activity: "high",
  },
  {
    id: 4,
    channel: "CH 05",
    title: "The Bachelor",
    status: "OFF-SEA",
    note: "Returns Jan 2026",
    poster: "/bachelor-grant.avif",
    mode: "poster",
    visualWeight: "bright",
    discussingCount: 120,
    activity: "low",
  },
  {
    id: 3,
    channel: "CH 03",
    title: "House of the Dragon",
    status: "RETURNS",
    note: "Season 3 Jun 21",
    poster: "https://variety.com/wp-content/uploads/2026/04/House-of-the-Dragon-emma-d-arcy.jpg?w=1000&h=667&crop=1",
    mode: "poster",
    visualWeight: "dark",
    discussingCount: 420,
    activity: "medium",
  },
  {
    id: 6,
    channel: "CH 07",
    title: "Severance",
    status: "RETURNS",
    note: "Season 3",
    poster: "https://variety.com/wp-content/uploads/2025/03/Severance-finale-Mark-Helly.2.jpg?w=1000&h=667&crop=1",
    mode: "poster",
    visualWeight: "bright",
    discussingCount: 2900,
    activity: "high",
  },
  {
    id: 12,
    channel: "CH 04",
    title: "The White Lotus",
    status: "OFF-AIR",
    note: "Season 3 Complete",
    poster: "https://variety.com/wp-content/uploads/2025/02/morgana-o-reilly-arnas-fedaravicius-christian-friedel-dom-hetrakul-lalisa-manobal.jpg?w=1000&h=667&crop=1",
    mode: "poster",
    visualWeight: "dark",
    discussingCount: 380,
    activity: "medium",
  },
  {
    id: 13,
    channel: "CH 06",
    title: "Euphoria",
    status: "FINAL",
    note: "Season Finale Sunday",
    poster: "https://variety.com/wp-content/uploads/2026/05/Euphoria-Episode6-sydney-sweeney.jpg?w=1000&h=667&crop=1",
    mode: "poster",
    visualWeight: "bright",
    discussingCount: 4200,
    activity: "high",
  },
  {
    id: 9,
    channel: "CH 02",
    title: "Big Brother",
    status: "LIVE",
    note: "S27 · Live Thursday",
    poster: "https://media.zenfs.com/en/entertainment_weekly_785/34a4da2e3a4aec811d8e2d924b514310",
    mode: "poster",
    visualWeight: "dark",
    discussingCount: 890,
    activity: "high",
  },
];

export type LiveRoom = {
  id: number;
  show: string;
  network: string;
  status: string;
  viewers: number;
  topic: string;
  poster: string;
  avatars: string[];
  friendsActive: number;
  heat?: "rising" | "heating" | "peak";
};

export type FriendComment = {
  id: number;
  user: string;
  avatar: string;
  show: string;
  room: string;
  message: string;
  time: string;
  accuracy?: number;
  badge?: string;
  mutual?: boolean;
};

export type TopComment = {
  id: number;
  label: string;
  labelColor: string;
  user: string;
  avatar: string;
  show: string;
  message: string;
  agreementCount: number;
};

export type DiscussionPrompt = {
  id: number;
  show: string;
  question: string;
  votes: number;
  category: string;
  timeLeft?: string;
};

export const liveRooms: LiveRoom[] = [
  {
    id: 1,
    show: "Love Island USA",
    network: "Peacock",
    status: "LIVE",
    viewers: 7820,
    topic: "Recoupling fallout",
    poster: "https://deadline.com/wp-content/uploads/2025/06/love-island-usa-season-7-recoupling.jpg?w=1000&h=667&crop=1",
    avatars: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    ],
    friendsActive: 6,
    heat: "peak",
  },
  {
    id: 2,
    show: "Big Brother",
    network: "CBS",
    status: "LIVE",
    viewers: 4100,
    topic: "HOH rumors",
    poster: "https://www.tvline.com/tvline/recaps/big-brother-recap-katherine-evicted-season-27-week-7-1235494086/big-brother-live-eviction-week-7.png.jpg",
    avatars: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    ],
    friendsActive: 3,
    heat: "heating",
  },
  {
    id: 3,
    show: "Survivor",
    network: "CBS",
    status: "TRIBAL IN 22M",
    viewers: 1800,
    topic: "Immunity debate",
    poster: "/survivor-challenge.webp",
    avatars: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    ],
    friendsActive: 4,
    heat: "rising",
  },
  {
    id: 4,
    show: "RuPaul's Drag Race",
    network: "MTV",
    status: "FINALE",
    viewers: 1100,
    topic: "Lip-sync predictions",
    poster: "https://deadline.com/wp-content/uploads/2025/04/GettyImages-2209679837.jpg?w=1000&h=667&crop=1",
    avatars: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    ],
    friendsActive: 2,
  },
];

export const friendComments: FriendComment[] = [
  {
    id: 1,
    user: "Maya",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    show: "Love Island USA",
    room: "Recoupling fallout",
    message: "No way Serena goes home after that. The room is delusional.",
    time: "1m",
    accuracy: 92,
    badge: "called it",
    mutual: true,
  },
  {
    id: 2,
    user: "Cruz",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    show: "RuPaul's Drag Race",
    room: "Lip-sync predictions",
    message: "AJ is winning this. It's not even close. I locked it in 20 minutes ago.",
    time: "3m",
    accuracy: 90,
    badge: "hot streak",
    mutual: true,
  },
  {
    id: 3,
    user: "Tess",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
    show: "Survivor",
    room: "Immunity debate",
    message: "The edit on Jordan this episode was way too soft. That's a boot edit.",
    time: "5m",
    accuracy: 89,
  },
  {
    id: 4,
    user: "Jon",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    show: "Big Brother",
    room: "HOH rumors",
    message: "HOH comp is endurance based on the CBS leak. Maya's picked up 40 people agreeing.",
    time: "7m",
  },
];

export const topRoomComments: TopComment[] = [
  {
    id: 1,
    label: "Hot Take",
    labelColor: "#fb923c",
    user: "Maya",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    show: "Love Island USA",
    message: "The producers are clearly protecting Serena. This isn't a twist, it's a script.",
    agreementCount: 312,
  },
  {
    id: 2,
    label: "Called It",
    labelColor: "#34d399",
    user: "Cruz",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    show: "RuPaul's Drag Race",
    message: "Predicted AJ to the finale three episodes ago. 91% accuracy this season.",
    agreementCount: 228,
  },
  {
    id: 3,
    label: "Most Agreed",
    labelColor: "#c4b5fd",
    user: "Tess",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
    show: "Survivor",
    message: "If the idol gets played tonight the whole season changes. Everyone's underestimating this.",
    agreementCount: 487,
  },
];

export const discussionPrompts: DiscussionPrompt[] = [
  {
    id: 1,
    show: "Love Island USA",
    question: "Will Serena be the last standing?",
    votes: 5420,
    category: "LIVE POLL",
    timeLeft: "Closes 12m",
  },
  {
    id: 2,
    show: "Big Brother",
    question: "Does the HOH flip the alliance tonight?",
    votes: 2100,
    category: "PREDICTION",
    timeLeft: "Closes 2h",
  },
  {
    id: 3,
    show: "Survivor",
    question: "Is the hidden idol still in play?",
    votes: 1380,
    category: "DEBATE",
  },
];

export const chatterFeed: ChatterPost[] = [
  {
    id: 1,
    user: "Maya",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    message: "called the elimination. respect.",
    show: "Love Island USA",
    time: "2m",
    accuracy: 92,
    badge: "called it",
    mutual: true,
    streak: 4,
    agreementCount: 128,
  },
  {
    id: 2,
    user: "Noah",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    message: "locked in a prediction on Who’s getting the text?",
    show: "Love Island USA",
    time: "3m",
    accuracy: 86,
    agreementCount: 42,
  },
  {
    id: 3,
    user: "Tess",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
    message: "82% of people think Serena stays. we’ll see.",
    show: "Love Island USA",
    time: "5m",
    accuracy: 89,
    agreementCount: 78,
  },
  {
    id: 4,
    user: "Jon",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    message: "that twist last night was insane 😳",
    show: "Big Brother",
    time: "6m",
    switchedSides: true,
  },
  {
    id: 5,
    user: "Cruz",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    message: "Ru giving us everything tonight 🔥",
    show: "RuPaul’s Drag Race",
    time: "8m",
    accuracy: 90,
    badge: "hot streak",
    mutual: true,
    streak: 6,
    agreementCount: 292,
  },
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

export const predictStats: PredictStats = {
  streak: 4,
  accuracy: 62,
  correctThisWeek: 12,
};

export const closingCards: ClosingCard[] = [
  {
    id: 1,
    show: "Love Island USA",
    question: "Will Serena survive tonight's recoupling?",
    closesIn: "12m",
    yesPercent: 73,
    poster: "https://deadline.com/wp-content/uploads/2025/08/love-island-usa-season-7-reunion-trailer-photos.jpg?w=1000&h=667&crop=1",
    cta: "Lock Pick",
  },
  {
    id: 2,
    show: "Survivor",
    question: "Will the hidden idol be played tonight?",
    closesIn: "22m",
    yesPercent: 41,
    poster: "https://www.tvline.com/img/gallery/survivor-49-recap-episode-12/slide--1765377421.jpg",
    cta: "Predict",
  },
];

export const liveQuestions: LiveQuestion[] = [
  {
    id: 1,
    show: "Big Brother",
    question: "Does the HOH flip the alliance tonight?",
    options: ["Yes", "No"],
    totalVotes: 2100,
    crowdSplit: [62, 38],
  },
  {
    id: 2,
    show: "RuPaul's Drag Race",
    question: "Who wins the final lip-sync?",
    options: ["AJ", "Luna", "Mika", "Someone else"],
    totalVotes: 4800,
    crowdSplit: [44, 28, 18, 10],
  },
  {
    id: 3,
    show: "House of the Dragon",
    question: "Has the throne already been decided?",
    options: ["Yes", "No"],
    totalVotes: 3200,
    crowdSplit: [57, 43],
  },
];

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
