import {z} from 'zod';

export const Id = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const InputText = z.string().trim().min(1).max(200).refine(v => !/[\u0000-\u001f\u007f]/.test(v), 'Control characters are not allowed');
export const Operations = {
  autocomplete: z.strictObject({word: InputText}),
  get_details: z.strictObject({ids: Id}),
  get_connections: z.strictObject({id: Id, direction: z.literal('ance').default('ance')}),
  get_trees: z.strictObject({ids: Id}),
  get_kin: z.strictObject({id: Id}),
  get_progeny: z.strictObject({id: Id}),
  get_connected_progeny: z.strictObject({id: Id}),
  get_connection_details: z.strictObject({root: Id, descendant: Id}),
  random_etymology: z.strictObject({type: z.literal('root').default('root'), language: InputText})
} as const;
export type Operation = keyof typeof Operations;
export const AutocompleteSchema = z.looseObject({
  search_term: z.string().max(1000),
  order: z.number().int(),
  auto_complete_data: z.array(z.looseObject({
    _id: Id,
    word: z.string().min(1).max(1000),
    language: z.string().min(1).max(200),
    transliteration: z.string().max(1000).nullable().optional()
  })).max(30)
});
export type AutocompleteData = z.infer<typeof AutocompleteSchema>;
