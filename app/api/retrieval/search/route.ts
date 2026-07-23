import {NextResponse} from "next/server";
import {z} from "zod";
import {businessObservationRequestSchema} from "@/lib/domain/business-observation";
import {buildRetrievalDocuments,localHybridRetriever} from "@/lib/ai/retrieval";

const requestSchema = businessObservationRequestSchema.extend({
  query:z.string().trim().min(2).max(500),
  limit:z.number().int().min(1).max(20).default(8),
  excludeCaseRef:z.string().nullable().optional(),
});

export async function POST(request:Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const documents = buildRetrievalDocuments(body.snapshot);
    const matches = await localHybridRetriever.search(body.query,documents,{limit:body.limit,excludeCaseRef:body.excludeCaseRef});
    return NextResponse.json({strategy:localHybridRetriever.strategy,matches:matches.map(({document,score}) => ({ref:document.ref,caseRef:document.caseRef,serviceRef:document.serviceRef,kind:document.kind,title:document.title,excerpt:document.text.slice(0,600),score:Number(score.toFixed(4))}))});
  } catch (error) {
    console.error("Semantic retrieval failed",error);
    return NextResponse.json({error:"无法检索相关经营记录。"},{status:400});
  }
}
