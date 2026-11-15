import {z} from "zod";
const scenarioSchema=z.object({
  title:z.string().min(4).max(160),
  priority:z.enum(["critical","high","medium","low"]),
  category:z.enum(["authentication","authorization","functional","validation","workflow","usability","accessibility","data-integrity"]),
  preconditions:z.array(z.string().min(1).max(300)).max(8),
  steps:z.array(z.string().min(1).max(500)).min(1).max(12),
  expectedResults:z.array(z.string().min(1).max(500)).min(1).max(12)
});
const responseSchema=z.object({scenarios:z.array(scenarioSchema).min(1).max(12)});
export function parseScenarioResponse(text){
  let value;try{value=JSON.parse(text);}catch{throw Object.assign(new Error("AI returned invalid structured content. Please try again."),{status:502});}
  const parsed=responseSchema.safeParse(value);
  if(!parsed.success)throw Object.assign(new Error("AI returned scenarios that did not match the required format."),{status:502});
  return parsed.data;
}
export async function generateScenarios({description,roles=[],workflows=[]}){
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw Object.assign(new Error("AI scenario generation is not configured. Add OPENAI_API_KEY to the backend environment."),{status:503});
  const model=process.env.OPENAI_MODEL||"gpt-6-luna";
  const input=[
    "Create practical software QA test scenarios for a website the user owns or is authorized to test.",
    "Return only a JSON object with a top-level scenarios array. Each item must have: title, priority (critical/high/medium/low), category (authentication/authorization/functional/validation/workflow/usability/accessibility/data-integrity), preconditions (string array), steps (string array), expectedResults (string array).",
    "Do not invent endpoints, credentials, or undocumented features. Mark assumptions in preconditions. Include positive, negative, and permission-boundary tests where relevant. Never suggest destructive tests against production.",
    JSON.stringify({description,roles,workflows})
  ].join("\n\n");
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",signal:controller.signal,
      headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({model,input,max_output_tokens:3000})
    });
    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      const status=response.status===429?429:response.status>=500?502:502;
      throw Object.assign(new Error(status===429?"AI service rate limit reached. Please retry shortly.":"AI scenario generation failed. Check the backend AI configuration."),{status,providerStatus:response.status,providerError:data.error?.code||data.error?.type});
    }
    const data=await response.json();
    const text=data.output?.flatMap(item=>item.content||[]).filter(part=>part.type==="output_text").map(part=>part.text).join("\n")||"";
    if(!text)throw Object.assign(new Error("AI returned an empty response."),{status:502});
    return parseScenarioResponse(text);
  }catch(error){
    if(error.name==="AbortError")throw Object.assign(new Error("AI request timed out. Please try again."),{status:504});
    throw error;
  }finally{clearTimeout(timeout);}
}