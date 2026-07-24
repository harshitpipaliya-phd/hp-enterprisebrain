export interface PromptTemplate {
    id: string;
    tenantId: string;
    name: string;
    template: string;
    variables: string[];
    version: number;
    previousVersionId: string | null;
    status: string;
    createdBy: string;
    createdDate: string;
}
export interface CreatePromptTemplateInput {
    tenantId: string;
    name: string;
    template: string;
    variables?: string[];
    createdBy: string;
}
export declare class PromptTemplateRepository {
    create(input: CreatePromptTemplateInput): Promise<PromptTemplate>;
    createVersion(tenantId: string, previousId: string, template: string, variables: string[], createdBy: string): Promise<PromptTemplate>;
    findById(tenantId: string, id: string): Promise<PromptTemplate | null>;
    list(tenantId: string): Promise<PromptTemplate[]>;
    render(template: PromptTemplate, values: Record<string, string>): string;
    private mapRow;
}
