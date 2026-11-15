import test from "node:test";
import assert from "node:assert/strict";
import {parseScenarioResponse} from "../src/services/ai-scenarios.js";
const good={scenarios:[{title:"Reject invalid password",priority:"high",category:"authentication",preconditions:["A registered test user exists"],steps:["Open the sign-in page","Enter an invalid password","Submit the form"],expectedResults:["Access is denied","A safe error message is shown"]}]};
test("accepts valid generated scenario JSON",()=>{assert.deepEqual(parseScenarioResponse(JSON.stringify(good)),good);});
test("rejects invalid JSON",()=>{assert.throws(()=>parseScenarioResponse("not json"),/invalid structured content/);});
test("rejects missing required scenario fields",()=>{assert.throws(()=>parseScenarioResponse(JSON.stringify({scenarios:[{title:"Missing fields"}]})),/did not match/);});
test("rejects an empty scenario list",()=>{assert.throws(()=>parseScenarioResponse(JSON.stringify({scenarios:[]})),/did not match/);});