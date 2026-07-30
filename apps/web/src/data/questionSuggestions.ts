export interface QuestionSuggestion {
  key: string;
  textKey: string;
}

export interface QuestionCategory {
  category: string;
  icon: string;
  labelKey: string;
  questions: QuestionSuggestion[];
}

export const QUESTION_SUGGESTIONS: QuestionCategory[] = [
  {
    category: 'hot',
    icon: '🔥',
    labelKey: 'questionCategory.hot',
    questions: [
      { key: 'q_hot_1', textKey: 'questionSuggestion.q_hot_1' },
      { key: 'q_hot_2', textKey: 'questionSuggestion.q_hot_2' },
      { key: 'q_hot_3', textKey: 'questionSuggestion.q_hot_3' },
      { key: 'q_hot_4', textKey: 'questionSuggestion.q_hot_4' },
      { key: 'q_hot_5', textKey: 'questionSuggestion.q_hot_5' },
      { key: 'q_hot_6', textKey: 'questionSuggestion.q_hot_6' },
    ],
  },
  {
    category: 'career',
    icon: '💼',
    labelKey: 'questionCategory.career',
    questions: [
      { key: 'q_career_1', textKey: 'questionSuggestion.q_career_1' },
      { key: 'q_career_2', textKey: 'questionSuggestion.q_career_2' },
      { key: 'q_career_3', textKey: 'questionSuggestion.q_career_3' },
      { key: 'q_career_4', textKey: 'questionSuggestion.q_career_4' },
      { key: 'q_career_5', textKey: 'questionSuggestion.q_career_5' },
    ],
  },
  {
    category: 'relationship',
    icon: '❤️',
    labelKey: 'questionCategory.relationship',
    questions: [
      { key: 'q_rel_1', textKey: 'questionSuggestion.q_rel_1' },
      { key: 'q_rel_2', textKey: 'questionSuggestion.q_rel_2' },
      { key: 'q_rel_3', textKey: 'questionSuggestion.q_rel_3' },
      { key: 'q_rel_4', textKey: 'questionSuggestion.q_rel_4' },
      { key: 'q_rel_5', textKey: 'questionSuggestion.q_rel_5' },
    ],
  },
  {
    category: 'personality',
    icon: '👤',
    labelKey: 'questionCategory.personality',
    questions: [
      { key: 'q_per_1', textKey: 'questionSuggestion.q_per_1' },
      { key: 'q_per_2', textKey: 'questionSuggestion.q_per_2' },
      { key: 'q_per_3', textKey: 'questionSuggestion.q_per_3' },
      { key: 'q_per_4', textKey: 'questionSuggestion.q_per_4' },
      { key: 'q_per_5', textKey: 'questionSuggestion.q_per_5' },
    ],
  },
  {
    category: 'finance',
    icon: '💰',
    labelKey: 'questionCategory.finance',
    questions: [
      { key: 'q_fin_1', textKey: 'questionSuggestion.q_fin_1' },
      { key: 'q_fin_2', textKey: 'questionSuggestion.q_fin_2' },
      { key: 'q_fin_3', textKey: 'questionSuggestion.q_fin_3' },
      { key: 'q_fin_4', textKey: 'questionSuggestion.q_fin_4' },
      { key: 'q_fin_5', textKey: 'questionSuggestion.q_fin_5' },
    ],
  },
  {
    category: 'life',
    icon: '🌱',
    labelKey: 'questionCategory.life',
    questions: [
      { key: 'q_life_1', textKey: 'questionSuggestion.q_life_1' },
      { key: 'q_life_2', textKey: 'questionSuggestion.q_life_2' },
      { key: 'q_life_3', textKey: 'questionSuggestion.q_life_3' },
      { key: 'q_life_4', textKey: 'questionSuggestion.q_life_4' },
      { key: 'q_life_5', textKey: 'questionSuggestion.q_life_5' },
    ],
  },
  {
    category: 'family',
    icon: '👨‍👩‍👧‍👦',
    labelKey: 'questionCategory.family',
    questions: [
      { key: 'q_fam_1', textKey: 'questionSuggestion.q_fam_1' },
      { key: 'q_fam_2', textKey: 'questionSuggestion.q_fam_2' },
      { key: 'q_fam_3', textKey: 'questionSuggestion.q_fam_3' },
      { key: 'q_fam_4', textKey: 'questionSuggestion.q_fam_4' },
    ],
  },
];
