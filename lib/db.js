import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { randomUUID } from "crypto";

const INTEGRATION_PREFIX = "SPACEKAYSONKELLY_";

/** Vercel-injected vars use SPACEKAYSONKELLY_; fall back to unprefixed names. */
function env(name) {
  return process.env[`${INTEGRATION_PREFIX}${name}`] ?? process.env[name];
}

const region = env("AWS_REGION");
const roleArn = env("AWS_ROLE_ARN");

const client = new DynamoDBClient({
  region,
  credentials: awsCredentialsProvider({
    roleArn,
    clientConfig: { region },
  }),
});

export const docClient = DynamoDBDocumentClient.from(client);

export function getTableName() {
  const table = env("DYNAMODB_TABLE_NAME");
  if (!table) throw new Error("DYNAMODB_TABLE_NAME is not configured");
  return table;
}

export function getPartitionKeyName() {
  return env("DYNAMODB_TABLE_PARTITION_KEY") || "PK";
}

export function getSortKeyName() {
  return env("DYNAMODB_TABLE_SORT_KEY") || "SK";
}

/** Build a DynamoDB item using the table's PK/SK schema. */
export function buildItem(entityType, data) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();

  return {
    [pk]: entityType.toUpperCase(),
    [sk]: `${createdAt}#${id}`,
    id,
    type: entityType,
    createdAt,
    ...data,
  };
}
