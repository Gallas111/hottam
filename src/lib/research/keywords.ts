export const SHOPPING_SHORTS_KEYWORDS = [
  "살림템",
  "살림꿀팁",
  "주방템",
  "주방꿀템",
  "자취템",
  "자취필수템",
  "생활꿀팁",
  "청소템",
  "청소꿀팁",
  "수납템",
  "욕실청소",
  "냉장고정리",
  "다이소꿀템",
  "쿠팡추천템",
  "신박한아이템",
] as const;

export const KEYWORD_PRESETS: Record<string, readonly string[]> = {
  "쇼핑 쇼츠 (한국)": SHOPPING_SHORTS_KEYWORDS,
  "주방·살림": [
    "살림템",
    "주방템",
    "주방꿀템",
    "냉장고정리",
    "수납템",
    "다이소꿀템",
  ],
  "청소·욕실": [
    "청소템",
    "청소꿀팁",
    "욕실청소",
    "곰팡이제거",
    "물때제거",
  ],
  "자취 시작": [
    "자취템",
    "자취필수템",
    "자취꿀팁",
    "원룸인테리어",
    "1인가구",
  ],
  "글로벌 가젯": [
    "home gadgets",
    "kitchen gadgets",
    "cleaning hacks",
    "amazon finds",
    "useful gadgets",
  ],
};

export type KeywordPreset = keyof typeof KEYWORD_PRESETS;
