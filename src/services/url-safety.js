import {isIP} from "node:net";
import {lookup} from "node:dns/promises";

function privateIp(host){
  const h=host.replace(/^\[|\]$/g,"").toLowerCase();
  if(h.startsWith("::ffff:")) return privateIp(h.slice(7));
  if(isIP(h)===4){
    const p=h.split(".").map(Number);
    return p[0]===0||p[0]===10||p[0]===127||p[0]>=224||
      (p[0]===100&&p[1]>=64&&p[1]<=127)||
      (p[0]===169&&p[1]===254)||
      (p[0]===172&&p[1]>=16&&p[1]<=31)||
      (p[0]===192&&(p[1]===168||(p[1]===0&&p[2]===0)))||
      (p[0]===198&&(p[1]===18||p[1]===19||p[1]===51&&p[2]===100))||
      (p[0]===203&&p[1]===0&&p[2]===113);
  }
  if(isIP(h)===6){
    return h==="::"||h==="::1"||h.startsWith("fc")||h.startsWith("fd")||
      h.startsWith("fe8")||h.startsWith("fe9")||h.startsWith("fea")||
      h.startsWith("feb")||h.startsWith("ff")||h.startsWith("2001:db8:");
  }
  return false;
}
export function validateTestUrl(raw){
  let u;try{u=new URL(raw);}catch{throw Object.assign(new Error("Invalid URL"),{status:400});}
  if(!["http:","https:"].includes(u.protocol)||u.username||u.password)
    throw Object.assign(new Error("Only credential-free HTTP(S) URLs are allowed"),{status:400});
  const h=u.hostname.toLowerCase().replace(/^\[|\]$/g,"");
  if(h==="localhost"||h.endsWith(".localhost")||h.endsWith(".local")||privateIp(h))
    throw Object.assign(new Error("Local/private network targets are blocked"),{status:400});
  const allow=(process.env.TEST_ALLOWED_HOSTS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!allow.includes(h))throw Object.assign(new Error("Hostname is not in TEST_ALLOWED_HOSTS"),{status:403});
  return u.toString();
}
export async function assertPublicHost(raw,resolver=lookup){
  const u=raw instanceof URL?raw:new URL(raw);
  const host=u.hostname.replace(/^\[|\]$/g,"");
  if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||privateIp(host))
    throw Object.assign(new Error("Local/private network targets are blocked"),{status:400});
  if(isIP(host))return true;
  let records;
  try{records=await resolver(host,{all:true,verbatim:true});}
  catch{throw Object.assign(new Error("Target hostname could not be resolved safely"),{status:400});}
  if(!records?.length||records.some(record=>privateIp(record.address)))
    throw Object.assign(new Error("Target hostname resolves to a local/private network address"),{status:400});
  return true;
}