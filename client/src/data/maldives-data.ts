export interface Island {
  name: string;
  isCapital?: boolean;
  isCity?: boolean;
  note?: string;
}

export interface Atoll {
  code: string;
  name: string;
  fullName: string;
  islands: Island[];
}

const maldivesData: Atoll[] = [
  {
    code: "HA",
    name: "Haa Alif",
    fullName: "Haa Alif (North Thiladhunmathi)",
    islands: [
      { name: "Baarah" },
      { name: "Dhiddhoo", isCapital: true },
      { name: "Filladhoo" },
      { name: "Hoarafushi" },
      { name: "Ihavandhoo" },
      { name: "Kelaa" },
      { name: "Maarandhoo" },
      { name: "Mulhadhoo" },
      { name: "Muraidhoo" },
      { name: "Thakandhoo" },
      { name: "Thuraakunu" },
      { name: "Uligamu" },
      { name: "Utheemu" },
      { name: "Vashafaru" }
    ]
  },
  {
    code: "HDh",
    name: "Haa Dhaalu",
    fullName: "Haa Dhaalu (South Thiladhunmathi)",
    islands: [
      { name: "Finey" },
      { name: "Hanimaadhoo" },
      { name: "Hirimaradhoo" },
      { name: "Kulhudhuffushi", isCapital: true, isCity: true },
      { name: "Kumundhoo" },
      { name: "Kurinbi" },
      { name: "Makunudhoo" },
      { name: "Naivaadhoo" },
      { name: "Nellaidhoo" },
      { name: "Neykurendhoo" },
      { name: "Nolhivaram" },
      { name: "Nolhivaranfaru" },
      { name: "Vaikaradhoo" }
    ]
  },
  {
    code: "Sh",
    name: "Shaviyani",
    fullName: "Shaviyani (North Miladhunmadulu)",
    islands: [
      { name: "Bileffahi" },
      { name: "Feevah" },
      { name: "Feydhoo" },
      { name: "Foakaidhoo" },
      { name: "Funadhoo", isCapital: true },
      { name: "Goidhoo" },
      { name: "Kanditheemu" },
      { name: "Komandoo" },
      { name: "Lhaimagu" },
      { name: "Maaungoodhoo" },
      { name: "Maroshi" },
      { name: "Milandhoo" },
      { name: "Narudhoo" },
      { name: "Noomaraa" }
    ]
  },
  {
    code: "N",
    name: "Noonu",
    fullName: "Noonu (South Miladhunmadulu)",
    islands: [
      { name: "Foddhoo" },
      { name: "Henbandhoo" },
      { name: "Holhudhoo" },
      { name: "Kendhikulhudhoo" },
      { name: "Kudafari" },
      { name: "Landhoo" },
      { name: "Lhohi" },
      { name: "Maafaru" },
      { name: "Maalhendhoo" },
      { name: "Magoodhoo" },
      { name: "Manadhoo", isCapital: true },
      { name: "Miladhoo" },
      { name: "Velidhoo" }
    ]
  },
  {
    code: "R",
    name: "Raa",
    fullName: "Raa (North Maalhosmadulu)",
    islands: [
      { name: "Alifushi" },
      { name: "Angolhitheemu" },
      { name: "Dhuvaafaru" },
      { name: "Fainu" },
      { name: "Hulhudhuffaaru" },
      { name: "Inguraidhoo" },
      { name: "Innamaadhoo" },
      { name: "Kinolhas" },
      { name: "Maakurathu" },
      { name: "Maduvvaree" },
      { name: "Meedhoo", note: "vice capital" },
      { name: "Rasgetheemu" },
      { name: "Rasmaadhoo" },
      { name: "Ungoofaaru", isCapital: true },
      { name: "Vaadhoo" }
    ]
  },
  {
    code: "B",
    name: "Baa",
    fullName: "Baa (South Maalhosmadulu)",
    islands: [
      { name: "Dharavandhoo" },
      { name: "Dhonfanu" },
      { name: "Eydhafushi", isCapital: true },
      { name: "Fehendhoo" },
      { name: "Fulhadhoo" },
      { name: "Goidhoo" },
      { name: "Hithaadhoo" },
      { name: "Kamadhoo" },
      { name: "Kendhoo" },
      { name: "Kihaadhoo" },
      { name: "Kudarikilu" },
      { name: "Maalhos" },
      { name: "Thulhaadhoo" }
    ]
  },
  {
    code: "Lh",
    name: "Lhaviyani",
    fullName: "Lhaviyani (Faadhippolhu)",
    islands: [
      { name: "Hinnavaru" },
      { name: "Kurendhoo" },
      { name: "Naifaru", isCapital: true },
      { name: "Olhuvelifushi" }
    ]
  },
  {
    code: "K",
    name: "Kaafu",
    fullName: "Kaafu (Malé Atoll admin division)",
    islands: [
      { name: "Dhiffushi" },
      { name: "Gaafaru" },
      { name: "Gulhi" },
      { name: "Guraidhoo" },
      { name: "Himmafushi" },
      { name: "Huraa" },
      { name: "Kaashidhoo" },
      { name: "Maafushi" },
      { name: "Thulusdhoo", isCapital: true }
    ]
  },
  {
    code: "MALE",
    name: "Malé City",
    fullName: "Malé City (separate admin)",
    islands: [
      { name: "Hulhumalé" },
      { name: "Malé", isCapital: true, isCity: true },
      { name: "Vilimalé" }
    ]
  },
  {
    code: "AA",
    name: "Alif Alif",
    fullName: "Alif Alif (North Ari)",
    islands: [
      { name: "Bodufolhudhoo" },
      { name: "Feridhoo" },
      { name: "Himandhoo" },
      { name: "Maalhos" },
      { name: "Mathiveri" },
      { name: "Rasdhoo", isCapital: true },
      { name: "Thoddoo" },
      { name: "Ukulhas" }
    ]
  },
  {
    code: "ADh",
    name: "Alif Dhaal",
    fullName: "Alif Dhaal (South Ari)",
    islands: [
      { name: "Dhangethi" },
      { name: "Dhiddhoo" },
      { name: "Dhigurah" },
      { name: "Fenfushi" },
      { name: "Haggnaameedhoo" },
      { name: "Kunburudhoo" },
      { name: "Maamigili" },
      { name: "Mahibadhoo", isCapital: true },
      { name: "Mandhoo" },
      { name: "Omadhoo" }
    ]
  },
  {
    code: "V",
    name: "Vaavu",
    fullName: "Vaavu (Felidhu)",
    islands: [
      { name: "Felidhoo", isCapital: true },
      { name: "Fulidhoo" },
      { name: "Keyodhoo" },
      { name: "Rakeedhoo" },
      { name: "Thinadhoo" }
    ]
  },
  {
    code: "M",
    name: "Meemu",
    fullName: "Meemu (Mulaku)",
    islands: [
      { name: "Dhiggaru" },
      { name: "Kolhufushi" },
      { name: "Maduvvaree" },
      { name: "Mulah" },
      { name: "Muli", isCapital: true },
      { name: "Naalaafushi" },
      { name: "Raimmandhoo" },
      { name: "Veyvah" }
    ]
  },
  {
    code: "F",
    name: "Faafu",
    fullName: "Faafu (North Nilandhe)",
    islands: [
      { name: "Bileddhoo" },
      { name: "Dharanboodhoo" },
      { name: "Feeali" },
      { name: "Magoodhoo" },
      { name: "Nilandhoo", isCapital: true }
    ]
  },
  {
    code: "Dh",
    name: "Dhaalu",
    fullName: "Dhaalu (South Nilandhe)",
    islands: [
      { name: "Bandidhoo" },
      { name: "Hulhudheli" },
      { name: "Kudahuvadhoo", isCapital: true },
      { name: "Maaenboodhoo" },
      { name: "Meedhoo" },
      { name: "Rinbudhoo" },
      { name: "Vaanee" }
    ]
  },
  {
    code: "Th",
    name: "Thaa",
    fullName: "Thaa (Kolhumadulu)",
    islands: [
      { name: "Burunee" },
      { name: "Dhiyamingili" },
      { name: "Gaadhiffushi" },
      { name: "Guraidhoo" },
      { name: "Hirilandhoo" },
      { name: "Kandoodhoo" },
      { name: "Kinbidhoo" },
      { name: "Madifushi" },
      { name: "Omadhoo" },
      { name: "Thimarafushi" },
      { name: "Vandhoo" },
      { name: "Veymandoo", isCapital: true },
      { name: "Vilufushi" }
    ]
  },
  {
    code: "L",
    name: "Laamu",
    fullName: "Laamu (Hadhdhunmathi)",
    islands: [
      { name: "Dhanbidhoo" },
      { name: "Fonadhoo", isCapital: true },
      { name: "Gan" },
      { name: "Hithadhoo" },
      { name: "Isdhoo" },
      { name: "Kunahandhoo" },
      { name: "Maabaidhoo" },
      { name: "Maamendhoo" },
      { name: "Maavah" },
      { name: "Mundoo" }
    ]
  },
  {
    code: "GA",
    name: "Gaafu Alif",
    fullName: "Gaafu Alif (North Huvadhu)",
    islands: [
      { name: "Dhaandhoo" },
      { name: "Dhevvadhoo" },
      { name: "Gemanafushi" },
      { name: "Kanduhulhudhoo" },
      { name: "Kolamaafushi" },
      { name: "Kondey" },
      { name: "Maamendhoo" },
      { name: "Nilandhoo" },
      { name: "Villingili", isCapital: true }
    ]
  },
  {
    code: "GDh",
    name: "Gaafu Dhaalu",
    fullName: "Gaafu Dhaalu (South Huvadhu)",
    islands: [
      { name: "Fares-Maathodaa", isCapital: true },
      { name: "Fiyoaree" },
      { name: "Gadhdhoo" },
      { name: "Hoandeddhoo" },
      { name: "Madaveli" },
      { name: "Nadellaa" },
      { name: "Rathafandhoo" },
      { name: "Thinadhoo" },
      { name: "Vaadhoo" }
    ]
  },
  {
    code: "Gn",
    name: "Gnaviyani",
    fullName: "Gnaviyani (Fuvahmulah City)",
    islands: [
      { name: "Fuvahmulah", isCapital: true, isCity: true }
    ]
  },
  {
    code: "S",
    name: "Seenu",
    fullName: "Seenu (Addu City)",
    islands: [
      { name: "Feydhoo" },
      { name: "Hithadhoo", isCapital: true, isCity: true },
      { name: "Hulhudhoo" },
      { name: "Maradhoo" },
      { name: "Maradhoo-Feydhoo" },
      { name: "Meedhoo" }
    ]
  }
];

export function getMaldivesData() {
  return maldivesData;
}

export function getIslandsByAtoll(atollCode: string): Island[] {
  const atoll = maldivesData.find(a => a.code === atollCode);
  return atoll ? atoll.islands : [];
}

export function getAtollName(atollCode: string): string {
  const atoll = maldivesData.find(a => a.code === atollCode);
  return atoll ? atoll.name : atollCode;
}

// Legacy functions for backwards compatibility
export function getIslandsForAtoll(atollCode: string): string[] {
  const islands = getIslandsByAtoll(atollCode);
  return islands.map(island => island.name);
}

// For old interface compatibility
export interface Atoll_Old {
  code: string;
  name: string;
  islands: string[];
}

export const MALDIVES_ATOLLS: Atoll_Old[] = maldivesData.map(atoll => ({
  code: atoll.code,
  name: atoll.name,
  islands: atoll.islands.map(island => island.name)
}));