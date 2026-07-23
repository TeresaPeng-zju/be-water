import type {BusinessObservationSnapshot} from "@/lib/domain/business-observation";

export type RetrievalDocument = {
  ref:string;
  caseRef:string|null;
  serviceRef:string;
  kind:"case"|"evidence"|"material"|"asset";
  title:string;
  text:string;
};

export type RetrievalMatch = {
  queryRef:string;
  retrievedRef:string;
  score:number;
  queryExcerpt:string;
  retrievedExcerpt:string;
};

export type RetrievalOptions = {
  limit?:number;
  excludeRefs?:Set<string>;
  excludeCaseRef?:string|null;
  minimumScore?:number;
};

export interface SemanticRetriever {
  readonly strategy:string;
  search(query:string,documents:RetrievalDocument[],options?:RetrievalOptions):Promise<RetrievalDocumentMatch[]>;
  searchAcrossCases?(documents:RetrievalDocument[]):Promise<RetrievalMatch[]>;
}

export type RetrievalDocumentMatch = {document:RetrievalDocument;score:number};
type PreparedDocument = {document:RetrievalDocument;vector:Float32Array;tokenSet:Set<string>};

const vectorSize = 384;

function normalizedText(value:string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g," ").trim();
}

function tokens(value:string) {
  const text = normalizedText(value);
  const latin = text.match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
  const cjkRuns = text.match(/[\p{Script=Han}]{1,}/gu) ?? [];
  const cjk:string[] = [];
  cjkRuns.forEach((run) => {
    if (run.length === 1) cjk.push(run);
    for (let index = 0; index < run.length - 1; index += 1) cjk.push(run.slice(index,index + 2));
  });
  return [...latin,...cjk];
}

function hashToken(value:string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash,16777619);
  }
  return hash >>> 0;
}

function embedding(value:string) {
  const vector = new Float32Array(vectorSize);
  const counts = new Map<string,number>();
  tokens(value).forEach((token) => counts.set(token,(counts.get(token) ?? 0) + 1));
  counts.forEach((count,token) => {
    const hash = hashToken(token);
    const index = hash % vectorSize;
    const sign = (hash & 0x40000000) === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.log(count));
  });
  let norm = 0;
  vector.forEach((valueAtIndex) => {norm += valueAtIndex * valueAtIndex;});
  norm = Math.sqrt(norm) || 1;
  for (let index = 0; index < vector.length; index += 1) vector[index] /= norm;
  return vector;
}

function cosine(left:Float32Array,right:Float32Array) {
  let score = 0;
  for (let index = 0; index < left.length; index += 1) score += left[index] * right[index];
  return score;
}

function lexicalOverlap(left:Set<string>,right:Set<string>) {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((token) => {if (right.has(token)) shared += 1;});
  return shared / Math.sqrt(left.size * right.size);
}

function prepareDocuments(documents:RetrievalDocument[],limit = 1200) {
  const assets = documents.filter((document) => document.kind === "asset");
  const remainder = documents.filter((document) => document.kind !== "asset").slice(-Math.max(0,limit - assets.length));
  return [...assets.slice(-Math.min(assets.length,160)),...remainder].map((document) => {
    const searchable = `${document.title}\n${document.text}`;
    return {document,vector:embedding(searchable),tokenSet:new Set(tokens(searchable))} satisfies PreparedDocument;
  });
}

function searchPrepared(query:string,documents:PreparedDocument[],options:RetrievalOptions = {}) {
  const queryVector = embedding(query);
  const queryTokens = new Set(tokens(query));
  const excludeRefs = options.excludeRefs ?? new Set<string>();
  const minimumScore = options.minimumScore ?? 0.18;
  return documents
    .filter(({document}) => !excludeRefs.has(document.ref) && (!options.excludeCaseRef || document.caseRef !== options.excludeCaseRef))
    .map(({document,vector,tokenSet}) => {
      const semanticHash = Math.max(0,cosine(queryVector,vector));
      const lexical = lexicalOverlap(queryTokens,tokenSet);
      return {document,score:semanticHash * 0.72 + lexical * 0.28};
    })
    .filter((match) => match.score >= minimumScore)
    .sort((left,right) => right.score - left.score)
    .slice(0,options.limit ?? 8);
}

export const localHybridRetriever:SemanticRetriever = {
  strategy:"local-hybrid-lexical-v2",
  async search(query,documents,options = {}) {
    return searchPrepared(query,prepareDocuments(documents),options);
  },
  async searchAcrossCases(documents) {
    const prepared = prepareDocuments(documents,800);
    const seeds = prepared.filter(({document}) => document.caseRef && document.kind !== "case").slice(-32);
    const candidates:RetrievalMatch[] = [];
    const seen = new Set<string>();
    seeds.forEach((seed) => {
      const matches = searchPrepared(`${seed.document.title}\n${seed.document.text}`,prepared,{limit:2,excludeRefs:new Set([seed.document.ref]),excludeCaseRef:seed.document.caseRef,minimumScore:0.2});
      matches.forEach((match) => {
        const key = [seed.document.ref,match.document.ref].sort().join("|");
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push({queryRef:seed.document.ref,retrievedRef:match.document.ref,score:Number(match.score.toFixed(4)),queryExcerpt:excerpt(seed.document.text),retrievedExcerpt:excerpt(match.document.text)});
      });
    });
    return candidates.sort((left,right) => right.score - left.score).slice(0,16);
  },
};

function compact(parts:Array<string|null|undefined>) {
  return parts.filter((part):part is string => Boolean(part?.trim())).join("\n");
}

export function buildRetrievalDocuments(snapshot:BusinessObservationSnapshot):RetrievalDocument[] {
  const documents:RetrievalDocument[] = [];
  snapshot.services.forEach((service) => {
    service.assets.forEach((asset) => documents.push({ref:asset.ref,caseRef:asset.sourceCaseRef,serviceRef:service.ref,kind:"asset",title:asset.label,text:compact([asset.role,asset.format,asset.content])}));
    service.cases.forEach((item) => {
      documents.push({ref:item.ref,caseRef:item.ref,serviceRef:service.ref,kind:"case",title:item.label,text:compact([`客户 ${item.customerName}`,`商业 ${item.status.commercial}`,`交付 ${item.status.delivery}`,`付款 ${item.status.payment}`,`结果 ${item.status.outcome}`,item.discoveryChannel,item.transactionChannel])});
      item.materials.forEach((material) => documents.push({ref:material.ref,caseRef:item.ref,serviceRef:service.ref,kind:"material",title:material.label,text:compact([material.role,material.format,material.content])}));
      item.evidence.forEach((evidence) => documents.push({
        ref:evidence.ref,
        caseRef:item.ref,
        serviceRef:service.ref,
        kind:"evidence",
        title:evidence.label,
        text:compact([
          evidence.summary,
          ...evidence.facts.map((fact) => `${fact.label} ${fact.value}`),
          ...evidence.businessEvents.map((event) => `${event.title} ${event.summary} ${event.nextActions.join(" ")}`),
          ...evidence.outcomeClaims.map((outcome) => `${outcome.theme} ${outcome.statement} ${outcome.verification}`),
          evidence.rawText,
        ]),
      }));
    });
  });
  return documents.filter((document) => document.text.trim().length >= 4);
}

function excerpt(value:string,length = 420) {
  const normalized = value.replace(/\s+/g," ").trim();
  return normalized.length > length ? `${normalized.slice(0,length)}…` : normalized;
}

export async function buildCrossCaseRagContext(snapshot:BusinessObservationSnapshot,retriever:SemanticRetriever = localHybridRetriever) {
  const documents = buildRetrievalDocuments(snapshot);
  const candidates = retriever.searchAcrossCases
    ? await retriever.searchAcrossCases(documents)
    : (await Promise.all(documents.filter((document) => document.caseRef && document.kind !== "case").slice(-32).map(async (document) => {
      const matches = await retriever.search(`${document.title}\n${document.text}`,documents,{limit:2,excludeRefs:new Set([document.ref]),excludeCaseRef:document.caseRef,minimumScore:0.2});
      return matches.map((match) => ({queryRef:document.ref,retrievedRef:match.document.ref,score:Number(match.score.toFixed(4)),queryExcerpt:excerpt(document.text),retrievedExcerpt:excerpt(match.document.text)}));
    }))).flat();
  return {
    strategy:retriever.strategy,
    scope:"cross_case",
    matches:candidates.sort((left,right) => right.score - left.score).slice(0,16),
  };
}
