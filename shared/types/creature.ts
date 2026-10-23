export type HomebrewTransfer = Omit<
  HomebrewItemInsert,
  'id' | 'campaign' | 'createdAt'
>
