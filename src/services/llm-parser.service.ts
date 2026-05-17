import type { ZodType } from 'zod';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';

const stripMarkdownFence = (raw: string): string => {
  return raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
};

const extractJsonObject = (raw: string): string => {
  const firstObject = raw.indexOf('{');
  const firstArray = raw.indexOf('[');
  const starts = [firstObject, firstArray].filter((index) => index >= 0);

  if (!starts.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'LLM response did not contain JSON');
  }

  const start = Math.min(...starts);
  const open = raw[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === open) {
      depth += 1;
    }

    if (char === close) {
      depth -= 1;
    }

    if (depth === 0) {
      return raw.slice(start, index + 1);
    }
  }

  return raw.slice(start);
};

const repairJson = (json: string): string => {
  return json
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
};

// Attempt to close a truncated JSON string by tracking open brackets and strings
const recoverTruncatedJson = (json: string): string => {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  let recovered = json;
  // If we ended mid-string, close it
  if (inString) recovered += '"';
  // Remove trailing comma before we close
  recovered = recovered.replace(/,\s*$/, '');
  // Close all open brackets in reverse
  for (let i = stack.length - 1; i >= 0; i--) {
    recovered += stack[i];
  }
  return recovered;
};

export const parseLlmJson = <T>(rawResponse: string, schema: ZodType<T>): T => {
  if (!rawResponse.trim()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'LLM response was empty');
  }

  const stripped = stripMarkdownFence(rawResponse);
  const extracted = extractJsonObject(stripped);
  const repaired = repairJson(extracted);

  let parsed: unknown;

  try {
    parsed = JSON.parse(repaired);
  } catch {
    // JSON was likely truncated — attempt recovery before giving up
    try {
      parsed = JSON.parse(repairJson(recoverTruncatedJson(extracted)));
    } catch (error) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'LLM response was not valid JSON', {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const validated = schema.safeParse(parsed);

  if (!validated.success) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'LLM response schema validation failed', {
      issues: validated.error.issues,
    });
  }

  return validated.data;
};
