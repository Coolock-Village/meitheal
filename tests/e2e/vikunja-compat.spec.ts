import { expect, test } from "@playwright/test";
import { shouldSkipBrowserSpecs } from "./_helpers";

const compatibilityToken = process.env.E2E_VIKUNJA_TOKEN;

test.skip(shouldSkipBrowserSpecs() || !compatibilityToken, "Set E2E_BASE_URL and E2E_VIKUNJA_TOKEN to run compat checks");

test("vikunja compatibility flow supports projects, labels, tasks, and assignees", async ({ request, baseURL }) => {
  const authHeaders = { authorization: `Bearer ${compatibilityToken}` };

  const projectsResponse = await request.get(`${baseURL}/api/v1/projects`, { headers: authHeaders });
  expect(projectsResponse.ok()).toBeTruthy();
  const projects = (await projectsResponse.json()) as Array<{ id: number }>;
  expect(projects.length).toBeGreaterThan(0);
  const projectId = projects[0]?.id;
  expect(typeof projectId).toBe("number");

  const projectUsersResponse = await request.get(`${baseURL}/api/v1/projects/${projectId}/projectusers`, {
    headers: authHeaders
  });
  expect(projectUsersResponse.ok()).toBeTruthy();
  const projectUsers = (await projectUsersResponse.json()) as Array<{ id: number }>;
  expect(Array.isArray(projectUsers)).toBeTruthy();

  const labelResponse = await request.put(`${baseURL}/api/v1/labels`, {
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    data: { title: `voice-e2e-${Date.now()}` }
  });
  expect(labelResponse.ok()).toBeTruthy();
  const label = (await labelResponse.json()) as { id: number };
  expect(typeof label.id).toBe("number");

  const createTaskResponse = await request.put(`${baseURL}/api/v1/projects/${projectId}/tasks`, {
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    data: {
      title: `Compat task ${Date.now()}`,
      description: "created from vikunja-compat e2e",
      priority: 3
    }
  });
  expect(createTaskResponse.ok()).toBeTruthy();
  const task = (await createTaskResponse.json()) as { id: string };
  expect(typeof task.id).toBe("string");

  const attachLabelResponse = await request.put(`${baseURL}/api/v1/tasks/${task.id}/labels`, {
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    data: { label_id: label.id }
  });
  expect(attachLabelResponse.ok()).toBeTruthy();

  const usersResponse = await request.get(`${baseURL}/api/v1/users?s=villager&page=1`, { headers: authHeaders });
  expect(usersResponse.ok()).toBeTruthy();
  const users = (await usersResponse.json()) as Array<{ id: number }>;
  expect(users.length).toBeGreaterThan(0);

  const assignResponse = await request.put(`${baseURL}/api/v1/tasks/${task.id}/assignees`, {
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    data: {
      max_permission: null,
      created: "1970-01-01T00:00:00.000Z",
      user_id: users[0]?.id ?? 1,
      task_id: task.id
    }
  });
  expect(assignResponse.ok()).toBeTruthy();
});
