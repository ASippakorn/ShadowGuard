import { inspect } from "../core/shadowguard-core.mjs";

const readStdin = async () => {
  let body = "";
  for await (const chunk of process.stdin) body += chunk;
  return body;
};

const writeReceipt = (event) => {
  const categories = event.categories.length ? event.categories.join(",") : "none";
  process.stderr.write(`ShadowGuard | ${event.stage} | ${event.decision} | ${categories} | ${event.id}\n`);
};

const outputFor = (eventName, payload) => {
  if (eventName === "userPromptTransformed") {
    const result = inspect({
      stage: "content_before_model",
      sessionId: payload.sessionId,
      text: payload.transformedPrompt
    });
    writeReceipt(result.event);
    return result.decision.kind === "transform"
      ? { modifiedTransformedPrompt: result.output }
      : {};
  }

  if (eventName === "preToolUse") {
    const result = inspect({
      stage: "action_before_execute",
      sessionId: payload.sessionId,
      actionArguments: payload.toolArgs
    });
    writeReceipt(result.event);
    return result.decision.kind === "block"
      ? {
          permissionDecision: "deny",
          permissionDecisionReason: result.decision.reasonCode
        }
      : {};
  }

  if (eventName === "postToolUse") {
    const result = inspect({
      stage: "result_before_model",
      sessionId: payload.sessionId,
      text: payload.toolResult?.resultType === "success"
        ? payload.toolResult.textResultForLlm
        : ""
    });
    writeReceipt(result.event);
    return result.decision.kind === "transform"
      ? {
          modifiedResult: {
            resultType: "success",
            textResultForLlm: result.output
          }
        }
      : {};
  }

  throw new Error(`Unsupported Copilot hook event: ${eventName}`);
};

const eventName = process.argv[2];

try {
  const payload = JSON.parse(await readStdin());
  process.stdout.write(`${JSON.stringify(outputFor(eventName, payload))}\n`);
} catch (error) {
  process.stderr.write(`ShadowGuard hook failed safely: ${error instanceof Error ? error.message : "unknown error"}\n`);
  if (eventName === "preToolUse") {
    process.stdout.write('{"permissionDecision":"deny","permissionDecisionReason":"shadowguard_hook_error"}\n');
    process.exitCode = 2;
  } else {
    process.stdout.write("{}\n");
    process.exitCode = 0;
  }
}
