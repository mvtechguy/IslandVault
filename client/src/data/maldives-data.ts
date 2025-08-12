export interface Atoll {
  code: string;
  name: string;
  islands: string[];
}

export const MALDIVES_ATOLLS: Atoll[] = [
  {
    code: "kaafu",
    name: "Kaafu (North Malé)",
    islands: ["Malé", "Hulhumalé", "Vilimalé", "Hulhulé", "Thulusdhoo", "Himmafushi", "Huraa", "Kaashidhoo", "Gaafaru", "Dhiffushi"]
  },
  {
    code: "alifu_alifu",
    name: "Alifu Alifu (North Ari)",
    islands: ["Rasdhoo", "Thoddoo", "Mathiveri", "Bodufolhudhoo", "Feridhoo", "Himandhoo", "Maalhos", "Ukulhas"]
  },
  {
    code: "alifu_dhaalu", 
    name: "Alifu Dhaalu (South Ari)",
    islands: ["Mahibadhoo", "Dhigurah", "Omadhoo", "Hangnameedhoo", "Mandhoo", "Kunburudhoo", "Dhangethi"]
  },
  {
    code: "vaavu",
    name: "Vaavu (Felidhu)",
    islands: ["Felidhoo", "Fulidhoo", "Thinadhoo", "Rakeedhoo", "Keyodhoo"]
  },
  {
    code: "meemu",
    name: "Meemu (Mulaku)",
    islands: ["Muli", "Naalaafushi", "Dhiggaru", "Raimmandhoo", "Madifushi", "Mulah"]
  },
  {
    code: "faafu",
    name: "Faafu (Nilandhe Atholhu Uthuruburi)",
    islands: ["Nilandhoo", "Magoodhoo", "Dharanboodhoo", "Feeali", "Bilehdhoo"]
  },
  {
    code: "dhaalu",
    name: "Dhaalu (Nilandhe Atholhu Dhekunuburi)",
    islands: ["Kudahuvadhoo", "Bandidhoo", "Vaanee", "Meedhoo", "Rinbudhoo"]
  },
  {
    code: "thaa",
    name: "Thaa (Kolhumadulu)",
    islands: ["Veymandoo", "Thimarafushi", "Guraidhoo", "Gaadhiffushi", "Dhiyamigili"]
  },
  {
    code: "laamu",
    name: "Laamu (Haddhunmathi)",
    islands: ["Fonadhoo", "Gan", "Maamendhoo", "Kadhdhoo", "Mundoo", "Isdhoo"]
  },
  {
    code: "gaafu_alifu",
    name: "Gaafu Alifu (North Huvadhu)",
    islands: ["Villingili", "Maamendhoo", "Nilandhoo", "Dhevvadhoo", "Kolamaafushi"]
  },
  {
    code: "gaafu_dhaalu",
    name: "Gaafu Dhaalu (South Huvadhu)",
    islands: ["Thinadhoo", "Hoarafushi", "Gaddhoo", "Vaadhoo", "Fiyoaree"]
  },
  {
    code: "gnaviyani",
    name: "Gnaviyani (Fuvahmulah)",
    islands: ["Fuvahmulah"]
  },
  {
    code: "seenu",
    name: "Seenu (Addu)",
    islands: ["Hithadhoo", "Maradhoo", "Feydhoo", "Hulhudhoo", "Meedhoo"]
  },
  {
    code: "haa_alifu",
    name: "Haa Alifu (North Thiladhunmathi)",
    islands: ["Dhidhdhoo", "Hoarafushi", "Ihavandhoo", "Kelaa", "Nolhivaranfaru"]
  },
  {
    code: "haa_dhaalu",
    name: "Haa Dhaalu (South Thiladhunmathi)",
    islands: ["Kulhudhuffushi", "Hanimaadhoo", "Finey", "Kumundhoo", "Nellaidhoo"]
  },
  {
    code: "shaviyani",
    name: "Shaviyani (North Miladhunmadulu)",
    islands: ["Funadhoo", "Lhaimagu", "Milandhoo", "Komandoo", "Maroshi"]
  },
  {
    code: "noonu",
    name: "Noonu (South Miladhunmadulu)",
    islands: ["Manadhoo", "Lhohi", "Kendhikolhudhoo", "Kudafari", "Landhoo"]
  },
  {
    code: "raa",
    name: "Raa (Maalhosmadulu Uthuruburi)",
    islands: ["Ungoofaaru", "Rasmaadhoo", "Hulhuvehi", "Inguraidhoo", "Vaadhoo"]
  },
  {
    code: "baa",
    name: "Baa (Maalhosmadulu Dhekunuburi)",
    islands: ["Eydhafushi", "Thulhaadhoo", "Kamadhoo", "Dharavandhoo", "Goidhoo"]
  },
  {
    code: "lhaviyani",
    name: "Lhaviyani (Faadhippolhu)",
    islands: ["Naifaru", "Hinnavaru", "Kurendhoo", "Olhuvehi", "Maafilaafushi"]
  }
];

export function getMaldivesData() {
  return MALDIVES_ATOLLS;
}

export function getIslandsForAtoll(atollCode: string): string[] {
  const atoll = MALDIVES_ATOLLS.find(a => a.code === atollCode);
  return atoll ? atoll.islands : [];
}

export function getAtollName(atollCode: string): string {
  const atoll = MALDIVES_ATOLLS.find(a => a.code === atollCode);
  return atoll ? atoll.name : atollCode;
}
