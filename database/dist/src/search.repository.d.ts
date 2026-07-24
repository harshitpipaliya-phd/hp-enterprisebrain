export declare const SEARCHABLE_ENTITIES: readonly ["signal", "evidence", "recommendation", "decision", "learning"];
export type SearchableEntity = (typeof SEARCHABLE_ENTITIES)[number];
export interface SearchResult {
    entityType: SearchableEntity;
    id: string;
    headline: string;
    createdDate: string;
}
export declare class SearchRepository {
    search(tenantId: string, query: string, entityTypes?: SearchableEntity[]): Promise<SearchResult[]>;
    private mapRow;
}
