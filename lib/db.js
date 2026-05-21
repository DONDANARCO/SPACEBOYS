import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
});

export const docClient = DynamoDBDocumentClient.from(client);

export function getTableName() {
  const table = process.env.DYNAMODB_TABLE_NAME;
  if (!table) throw new Error("DYNAMODB_TABLE_NAME is not configured");
  return table;
}
