import {z} from "zod";
const locator=z.object({by:z.enum(["role","label","placeholder","text","testId","css"]),value:z.string().min(1).max(300),role:z.string().max(60).optional()});
const action=z.discriminatedUnion("type",[
 z.object({type:z.literal("navigate"),path:z.string().startsWith("/").max(500).refine(value=>!value.startsWith("//"))}),
 z.object({type:z.enum(["click","check","uncheck","expectVisible"]),locator}),
 z.object({type:z.literal("fill"),locator,value:z.string().max(1000)}),
 z.object({type:z.literal("selectOption"),locator,value:z.string().max(200)}),
 z.object({type:z.literal("expectText"),locator,value:z.string().max(500)}),
 z.object({type:z.literal("expectUrl"),value:z.string().startsWith("/").max(500).refine(value=>!value.startsWith("//"))})
]);
const scenarioSchema=z.object({
 title:z.string().min(4).max(160),
 priority:z.enum(["critical","high","medium","low"]),
 category:z.enum(["authentication","authorization","functional","validation","workflow","usability","accessibility","data-integrity"]),
 preconditions:z.array(z.string().min(1).max(300)).max(8),
 steps:z.array(z.string().min(1).max(500)).min(1).max(12),
 expectedResults:z.array(z.string().min(1).max(500)).min(1).max(12),
 actions:z.array(action).min(1).max(30)
});
const responseSchema=z.object({scenarios:z.array(scenarioSchema).min(1).max(10)});
export function parseScenarioResponse(text){
 let value;try{value=JSON.parse(text);}catch{throw Object.assign(new Error("AI returned invalid structured content. Please try again."),{status:502});}
 const parsed=responseSchema.safeParse(value);
 if(!parsed.success)throw Object.assign(new Error("AI returned scenarios that did not match the required format."),{status:502});
 return parsed.data;
}
export async function generateScenarios({description,roles=[],workflows=[]}){
 const key=process.env.GEMINI_API_KEY;
 if(!key)throw Object.assign(new Error("AI scenario generation is not configured. Add GEMINI_API_KEY to the backend environment."),{status:503});
 const model=process.env.GEMINI_MODEL||"gemini-3.8-flash";
 const prompt=[
 "Create practical browser-executable QA scenarios for a website the user owns or is authorized to test.",
 "Return only JSON with a top-level scenarios array. Every scenario must have title, priority (critical/high/medium/low), category (authentication/authorization/functional/validation/workflow/usability/accessibility/data-integrity), preconditions (string array), steps (string array), expectedResults (string array), and actions (array).",
 "Each action must be one of these exact shapes: {type:'navigate',path:'/relative/path'}; {type:'click'|'check'|'uncheck'|'expectVisible',locator:{by:'role'|'label'|'placeholder'|'text'|'testId'|'css',value:'...',role:'optional role name'}}; {type:'fill',locator:{...},value:'...'}; {type:'selectOption',locator:{...},value:'...'}; {type:'expectText',locator:{...},value:'...'}; {type:'expectUrl',value:'/relative/path'}.",
 "Never use absolute URLs, JavaScript, eval, arbitrary browser code, file access, destructive actions, or external domains. Only use relative paths and user-facing accessible locators. Prefer role/label/testId. If selectors or paths are unknown, state assumptions and use reasonable accessible labels. Do not invent credentials; use placeholder values like qa.user@example.test and TEST_PASSWORD.",
 "Include positive and negative cases, validation and permission boundaries. Do not propose destructive tests against production.",
 "Use synthetic example data only. Never request or reproduce real student personal data, passwords, or other sensitive information.",
 JSON.stringify({description,roles,workflows})
 ].join("\n\n");
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
 try{
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
   method:"POST",
   signal:controller.signal,
   headers:{"x-goog-api-key":key,"Content-Type":"application/json"},
   body:JSON.stringify({
    contents:[{role:"user",parts:[{text:prompt}]}],
    generationConfig:{responseMimeType:"application/json",maxOutputTokens:5000,temperature:0.2}
   })
  });
  if(!response.ok){
   const data=await response.json().catch(()=>({}));
   const providerCode=data.error?.status||data.error?.code||"unknown";
   console.warn("Gemini scenario-generation request rejected",{status:response.status,code:providerCode});
   if(response.status===429)throw Object.assign(new Error("Gemini free-tier rate limit reached. Wait for the quota window to reset, then try again."),{status:429,providerStatus:response.status,providerError:providerCode});
   if(response.status===400)throw Object.assign(new Error("Gemini rejected the scenario request. Check the model setting and prompt, then retry."),{status:502,providerStatus:response.status,providerError:providerCode});
   if(response.status===401||response.status===403)throw Object.assign(new Error("Gemini API key is invalid or does not have permission. Check GEMINI_API_KEY in the backend environment."),{status:503,providerStatus:response.status,providerError:providerCode});
   throw Object.assign(new Error("Gemini scenario generation failed. Check the Gemini API configuration and service status."),{status:502,providerStatus:response.status,providerError:providerCode});
  }
  const data=await response.json();
  const output=data.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("\n")||"";
  if(!output)throw Object.assign(new Error("Gemini returned an empty response. Try simplifying the request."),{status:502});
  return parseScenarioResponse(output);
 }catch(error){if(error.name==="AbortError")throw Object.assign(new Error("AI request timed out. Please try again."),{status:504});throw error;}
 finally{clearTimeout(timeout);}
}
