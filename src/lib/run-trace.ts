import { prisma } from "./prisma";

/**
 * Wraps an agent function so every invocation is logged to AgentRun.
 * Use for observability — Tim can see what ran when from the dashboard.
 */
export async function trackRun<T extends { itemsCreated?: number; itemsUpdated?: number } | unknown>(
  agent: string,
  fn: () => Promise<T>
): Promise<T> {
  const run = await prisma.agentRun.create({
    data: { agent, status: "running" },
  });

  try {
    const result = await fn();
    const meta = result as { itemsCreated?: number; itemsUpdated?: number };
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        itemsCreated: meta?.itemsCreated ?? 0,
        itemsUpdated: meta?.itemsUpdated ?? 0,
        metadata: JSON.stringify(result).slice(0, 4000),
      },
    });
    return result;
  } catch (e) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "failure",
        finishedAt: new Date(),
        errorMessage: String(e).slice(0, 2000),
      },
    });
    throw e;
  }
}
