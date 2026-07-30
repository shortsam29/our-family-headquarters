import type{ConversationMessage}from"@/lib/kenzie/core/types";
export type KenzieModelRequest={instructions:string;messages:ConversationMessage[];maxOutputTokens:number};export type KenzieModelResponse={text:string;model:string};export interface KenzieModelProvider{generate(request:KenzieModelRequest):Promise<KenzieModelResponse>}
