import { ProjectsClient } from "@google-cloud/resource-manager";
import { config } from "../utils/config.js";

const client = new ProjectsClient();

export async function listProjects(): Promise<string[]> {
  if (config.mockGcp) {
    return ["mock-project-1", "mock-project-2"];
  }
  const [projects] = await client.searchProjects({});
  return (projects ?? [])
    .map((project) => project.projectId ?? "")
    .filter((projectId) => projectId);
}
