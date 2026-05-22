import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { docClient, getPartitionKeyName, getSortKeyName, getTableName } from "./db.js";
import { hashPassword } from "./password.js";
import { POINT_RULES, tierFromPoints } from "./points.js";

const FAN_PK = "FAN";

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function emailKey(email) {
  return `EMAIL#${normalizeEmail(email)}`;
}

function userKey(userId) {
  return `USER#${userId}`;
}

export function fanToPublic(fan) {
  if (!fan) return null;
  const points = fan.points ?? 0;
  const tier = tierFromPoints(points);
  return {
    id: fan.userId,
    name: fan.name,
    email: fan.email,
    points,
    tier: tier.name,
    tierId: tier.id,
    pointsToNext: tier.next,
    referralCode: fan.referralCode,
    createdAt: fan.createdAt,
  };
}

export async function getFanByEmail(email) {
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();
  const res = await docClient.send(
    new GetCommand({
      TableName: getTableName(),
      Key: { [pk]: FAN_PK, [sk]: emailKey(email) },
    })
  );
  return res.Item || null;
}

export async function getFanById(userId) {
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();
  const res = await docClient.send(
    new GetCommand({
      TableName: getTableName(),
      Key: { [pk]: FAN_PK, [sk]: userKey(userId) },
    })
  );
  return res.Item || null;
}

export async function createFan({ name, email, password }) {
  const normalized = normalizeEmail(email);
  const existing = await getFanByEmail(normalized);
  if (existing) {
    const err = new Error("Email already registered");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const userId = randomUUID();
  const createdAt = new Date().toISOString();
  const referralCode = `SB${userId.slice(0, 8).toUpperCase()}`;
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();

  const fan = {
    [pk]: FAN_PK,
    [sk]: userKey(userId),
    type: "fan",
    userId,
    email: normalized,
    name: name.trim(),
    passwordHash: hashPassword(password),
    points: 0,
    referralCode,
    lastVisitDate: null,
    createdAt,
  };

  const emailIndex = {
    [pk]: FAN_PK,
    [sk]: emailKey(normalized),
    type: "fan-email",
    userId,
    email: normalized,
  };

  await docClient.send(new PutCommand({ TableName: getTableName(), Item: fan }));
  await docClient.send(new PutCommand({ TableName: getTableName(), Item: emailIndex }));

  await addPointsLedger(userId, POINT_RULES.signup.points, "signup", POINT_RULES.signup.label);

  return getFanById(userId);
}

export async function addPointsLedger(userId, amount, action, label) {
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();
  const createdAt = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: getTableName(),
      Key: { [pk]: FAN_PK, [sk]: userKey(userId) },
      UpdateExpression: "SET points = if_not_exists(points, :zero) + :amt, updatedAt = :now",
      ExpressionAttributeValues: {
        ":amt": amount,
        ":zero": 0,
        ":now": createdAt,
      },
    })
  );

  await docClient.send(
    new PutCommand({
      TableName: getTableName(),
      Item: {
        [pk]: "POINTS",
        [sk]: `${createdAt}#${userId}`,
        type: "points-ledger",
        userId,
        amount,
        action,
        label,
        createdAt,
      },
    })
  );
}

export async function awardPoints(userId, action, { oncePerDay = false } = {}) {
  const rule = POINT_RULES[action];
  if (!rule) return { awarded: 0, reason: "unknown_action" };

  const fan = await getFanById(userId);
  if (!fan) return { awarded: 0, reason: "no_user" };

  const today = new Date().toISOString().slice(0, 10);
  const flagKey = `last${action.charAt(0).toUpperCase()}${action.slice(1)}Date`;

  if (oncePerDay && fan[flagKey] === today) {
    return { awarded: 0, reason: "already_today", points: fan.points ?? 0 };
  }

  await addPointsLedger(userId, rule.points, action, rule.label);

  if (oncePerDay) {
    const pk = getPartitionKeyName();
    const sk = getSortKeyName();
    await docClient.send(
      new UpdateCommand({
        TableName: getTableName(),
        Key: { [pk]: FAN_PK, [sk]: userKey(userId) },
        UpdateExpression: `SET ${flagKey} = :today`,
        ExpressionAttributeValues: { ":today": today },
      })
    );
  }

  const updated = await getFanById(userId);
  return { awarded: rule.points, points: updated?.points ?? 0, label: rule.label };
}
