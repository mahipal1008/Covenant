import { prisma } from "../src/index";
import { demoFindings, demoIntentContracts, demoIntegrations, demoRepositories, demoScan } from "@covenant/shared";

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "covenant-demo" },
    update: { name: "Covenant Demo", plan: "Startup" },
    create: { id: "org_covenant_demo", name: "Covenant Demo", slug: "covenant-demo", plan: "Startup" }
  });

  const user = await prisma.user.upsert({
    where: { email: "founder@covenant.dev" },
    update: { name: "Covenant Founder" },
    create: { id: "user_demo_founder", email: "founder@covenant.dev", name: "Covenant Founder" }
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    update: { role: "owner" },
    create: { userId: user.id, organizationId: organization.id, role: "owner" }
  });

  const project = await prisma.project.upsert({
    where: { id: "project_sample_saas" },
    update: { name: "Sample SaaS" },
    create: {
      id: "project_sample_saas",
      organizationId: organization.id,
      name: "Sample SaaS",
      description: "Local demo project for multi-tenant SaaS risk detection."
    }
  });

  for (const repo of demoRepositories) {
    await prisma.repository.upsert({
      where: { id: repo.id },
      update: {
        name: repo.name,
        provider: repo.provider,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        lastCommitSha: repo.lastCommitSha,
        lastScannedAt: new Date(repo.lastScannedAt),
        scanStatus: repo.scanStatus,
        riskScore: repo.riskScore
      },
      create: {
        id: repo.id,
        organizationId: organization.id,
        projectId: project.id,
        name: repo.name,
        provider: repo.provider,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        lastCommitSha: repo.lastCommitSha,
        lastScannedAt: new Date(repo.lastScannedAt),
        scanStatus: repo.scanStatus,
        riskScore: repo.riskScore
      }
    });
  }

  await prisma.scan.upsert({
    where: { id: demoScan.id },
    update: {
      status: demoScan.status,
      riskScore: demoScan.riskScore,
      filesAnalyzed: demoScan.filesAnalyzed,
      endpointsAnalyzed: demoScan.endpointsAnalyzed,
      queriesAnalyzed: demoScan.queriesAnalyzed,
      completedAt: new Date(demoScan.completedAt)
    },
    create: {
      id: demoScan.id,
      organizationId: organization.id,
      repositoryId: demoScan.repositoryId,
      status: demoScan.status,
      branch: demoScan.branch,
      commitSha: demoScan.commitSha,
      startedAt: new Date(demoScan.startedAt),
      completedAt: new Date(demoScan.completedAt),
      riskScore: demoScan.riskScore,
      filesAnalyzed: demoScan.filesAnalyzed,
      endpointsAnalyzed: demoScan.endpointsAnalyzed,
      queriesAnalyzed: demoScan.queriesAnalyzed
    }
  });

  for (const finding of demoFindings) {
    await prisma.finding.upsert({
      where: { id: finding.id },
      update: {
        severity: finding.severity,
        status: finding.status,
        title: finding.title,
        summary: finding.summary,
        evidence: finding.evidence,
        impact: finding.impact,
        suggestedFix: finding.suggestedFix,
        exploitSteps: finding.exploitSteps
      },
      create: {
        id: finding.id,
        organizationId: organization.id,
        repositoryId: finding.repositoryId,
        scanId: finding.scanId,
        severity: finding.severity,
        status: finding.status,
        ruleId: finding.ruleId,
        title: finding.title,
        summary: finding.summary,
        filePath: finding.filePath,
        line: finding.line,
        endpoint: finding.endpoint,
        routeMethod: finding.routeMethod,
        evidence: finding.evidence,
        impact: finding.impact,
        suggestedFix: finding.suggestedFix,
        exploitSteps: finding.exploitSteps
      }
    });
  }

  for (const contract of demoIntentContracts) {
    await prisma.intentContract.upsert({
      where: { id: contract.id },
      update: {
        name: contract.name,
        plainEnglish: contract.plainEnglish,
        owner: contract.owner,
        status: contract.status,
        linkedFindings: contract.linkedFindings,
        lastCheckedAt: new Date(contract.lastCheckedAt)
      },
      create: {
        id: contract.id,
        organizationId: organization.id,
        name: contract.name,
        plainEnglish: contract.plainEnglish,
        owner: contract.owner,
        status: contract.status,
        linkedFindings: contract.linkedFindings,
        lastCheckedAt: new Date(contract.lastCheckedAt)
      }
    });
  }

  for (const integration of demoIntegrations) {
    await prisma.integration.upsert({
      where: { organizationId_provider: { organizationId: organization.id, provider: integration.id } },
      update: { status: integration.status },
      create: {
        organizationId: organization.id,
        provider: integration.id,
        status: integration.status,
        config: { mode: "local-stub", name: integration.name }
      }
    });
  }

  await prisma.subscription.upsert({
    where: { id: "sub_demo_startup" },
    update: { plan: "Startup", status: "active" },
    create: {
      id: "sub_demo_startup",
      organizationId: organization.id,
      plan: "Startup",
      status: "active",
      currentPeriodEnd: new Date("2026-05-26T00:00:00.000Z")
    }
  });

  // ---------- New surfaces (account / billing depth) ----------
  const tokenSeeds = [
    { id: "tok_demo_ci", name: "CI / GitHub Actions", scope: "write" as const, prefix: "cov_live_a1b2", hash: "seed:ci", createdById: user.id, lastUsedAt: new Date() },
    { id: "tok_demo_ro", name: "Read-only dashboard mirror", scope: "read" as const, prefix: "cov_live_c3d4", hash: "seed:ro", createdById: user.id, lastUsedAt: null }
  ];
  for (const t of tokenSeeds) {
    await prisma.apiToken.upsert({
      where: { id: t.id },
      update: { name: t.name, scope: t.scope, lastUsedAt: t.lastUsedAt },
      create: { ...t, organizationId: organization.id }
    });
  }

  const sub = await prisma.webhookSubscription.upsert({
    where: { id: "sub_demo_webhook_1" },
    update: {},
    create: {
      id: "sub_demo_webhook_1",
      organizationId: organization.id,
      url: "https://hooks.example.com/covenant",
      events: ["scan.completed", "finding.created", "contract.violated"],
      active: true,
      secretHash: "seed:whsec",
      secretPrefix: "whsec_d3m"
    }
  });
  // Wipe + reseed deliveries so we always have a stable 8-entry tail
  await prisma.webhookDelivery.deleteMany({ where: { subscriptionId: sub.id } });
  const eventsList = ["scan.completed", "scan.failed", "finding.created", "finding.resolved", "contract.violated", "pr.gate.blocked"];
  for (let i = 0; i < 8; i++) {
    await prisma.webhookDelivery.create({
      data: {
        subscriptionId: sub.id,
        event: eventsList[i % eventsList.length]!,
        status: i === 4 ? "failed" : "delivered",
        responseCode: i === 4 ? 502 : 200,
        attempts: i === 4 ? 3 : 1,
        payload: { sample: true, idx: i },
        attemptedAt: new Date(Date.now() - i * 3600 * 1000)
      }
    });
  }

  const auditSeeds: Array<{ actor: string; action: string; targetType: string; targetId: string; ip: string; ua: string }> = [
    { actor: "founder@covenant.dev", action: "auth.login", targetType: "session", targetId: "s_1", ip: "203.0.113.18", ua: "Chrome 124" },
    { actor: "founder@covenant.dev", action: "repo.connected", targetType: "repository", targetId: "repo_sample-saas", ip: "203.0.113.18", ua: "Chrome 124" },
    { actor: "ops@covenant.dev", action: "scan.run", targetType: "scan", targetId: demoScan.id, ip: "198.51.100.7", ua: "Firefox 125" },
    { actor: "founder@covenant.dev", action: "contract.created", targetType: "contract", targetId: "ctr_tenant_billing", ip: "203.0.113.18", ua: "Chrome 124" },
    { actor: "system", action: "webhook.delivered", targetType: "webhook", targetId: sub.id, ip: "internal", ua: "covenant-worker" },
    { actor: "ops@covenant.dev", action: "token.created", targetType: "token", targetId: "tok_demo_ci", ip: "198.51.100.7", ua: "Firefox 125" },
    { actor: "founder@covenant.dev", action: "billing.updated", targetType: "subscription", targetId: "sub_demo_startup", ip: "203.0.113.18", ua: "Chrome 124" },
    { actor: "system", action: "scan.completed", targetType: "scan", targetId: demoScan.id, ip: "internal", ua: "covenant-worker" },
    { actor: "founder@covenant.dev", action: "team.invited", targetType: "user", targetId: "u_pending", ip: "203.0.113.18", ua: "Chrome 124" },
    { actor: "founder@covenant.dev", action: "settings.notifications.updated", targetType: "preferences", targetId: organization.id, ip: "203.0.113.18", ua: "Chrome 124" },
    { actor: "system", action: "auth.token.rotated", targetType: "jwk", targetId: "current", ip: "internal", ua: "covenant-platform" },
    { actor: "founder@covenant.dev", action: "data.export.requested", targetType: "export", targetId: "exp_demo_1", ip: "203.0.113.18", ua: "Chrome 124" }
  ];
  await prisma.auditEvent.deleteMany({ where: { organizationId: organization.id } });
  for (let i = 0; i < auditSeeds.length; i++) {
    const s = auditSeeds[i]!;
    await prisma.auditEvent.create({
      data: {
        organizationId: organization.id,
        userId: s.actor === "system" ? null : user.id,
        actorEmail: s.actor,
        action: s.action,
        targetType: s.targetType,
        targetId: s.targetId,
        ipAddress: s.ip,
        userAgent: s.ua,
        createdAt: new Date(Date.now() - i * 1.5 * 3600 * 1000)
      }
    });
  }

  const eventTypes = ["scan.completed", "scan.failed", "finding.critical", "contract.violated", "pr.gate.blocked", "billing.invoice", "team.invitation"];
  for (const e of eventTypes) {
    await prisma.notificationPreference.upsert({
      where: { organizationId_eventType: { organizationId: organization.id, eventType: e } },
      update: {},
      create: {
        organizationId: organization.id,
        eventType: e,
        email: true,
        slack: e !== "billing.invoice",
        inApp: true
      }
    });
  }

  await prisma.dataExportJob.upsert({
    where: { id: "exp_demo_1" },
    update: { status: "ready" },
    create: {
      id: "exp_demo_1",
      organizationId: organization.id,
      status: "ready",
      bytes: BigInt(18_432_188),
      requestedAt: new Date(Date.now() - 86400 * 2 * 1000),
      readyAt: new Date(Date.now() - 86400 * 2 * 1000 + 12 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 86400 * 1000),
      downloadUrl: "/api/exports/exp_demo_1.tar.gz"
    }
  });

  await prisma.usageRecord.deleteMany({ where: { organizationId: organization.id } });
  const today = new Date();
  for (let i = 0; i < 1284; i++) {
    if (i % 60 !== 0) continue; // sample to keep seed small
    await prisma.usageRecord.create({
      data: {
        organizationId: organization.id,
        metric: "scan",
        quantity: 60,
        recordedAt: new Date(today.getTime() - i * 30 * 60 * 1000)
      }
    });
  }
  // Top-up scan usage to exact 1284
  await prisma.usageRecord.create({
    data: { organizationId: organization.id, metric: "scan", quantity: 1284 - (Math.floor(1284 / 60) * 60 + 60 * Math.floor(1284 / 60 / 1)), recordedAt: today }
  }).catch(() => undefined);
  await prisma.usageRecord.create({ data: { organizationId: organization.id, metric: "repository", quantity: 9, recordedAt: today } });
  await prisma.usageRecord.create({ data: { organizationId: organization.id, metric: "contract", quantity: 48, recordedAt: today } });

  const months = [
    { id: "inv_2026_04", n: "COV-2026-1000", start: "2026-04-01", end: "2026-04-30", amount: 0, status: "trial" as const },
    { id: "inv_2026_03", n: "COV-2026-0999", start: "2026-03-01", end: "2026-03-31", amount: 49900, status: "paid" as const },
    { id: "inv_2026_02", n: "COV-2026-0998", start: "2026-02-01", end: "2026-02-28", amount: 49900, status: "paid" as const },
    { id: "inv_2026_01", n: "COV-2026-0997", start: "2026-01-01", end: "2026-01-31", amount: 49900, status: "paid" as const },
    { id: "inv_2025_12", n: "COV-2025-0996", start: "2025-12-01", end: "2025-12-31", amount: 49900, status: "paid" as const },
    { id: "inv_2025_11", n: "COV-2025-0995", start: "2025-11-01", end: "2025-11-30", amount: 49900, status: "paid" as const }
  ];
  for (const m of months) {
    await prisma.invoice.upsert({
      where: { id: m.id },
      update: { status: m.status, amountCents: m.amount },
      create: {
        id: m.id,
        organizationId: organization.id,
        number: m.n,
        amountCents: m.amount,
        currency: "USD",
        status: m.status,
        periodStart: new Date(m.start),
        periodEnd: new Date(m.end),
        issuedAt: new Date(m.end),
        paidAt: m.status === "paid" ? new Date(m.end) : null,
        pdfUrl: m.status === "paid" ? `/billing/invoices/${m.id}.pdf` : null
      }
    });
  }

  const flags = [
    { key: "ai.scan.economic-blast-radius", description: "Enable A14 Economic Blast Radius cost simulation in scans", defaultOn: true, rollout: 100 },
    { key: "billing.metered-llm", description: "Charge customers for LLM tokens above plan ceiling", defaultOn: false, rollout: 25 },
    { key: "enterprise.sso.workos", description: "WorkOS SAML/OIDC adapter (requires keys)", defaultOn: false, rollout: 0 },
    { key: "self-hosted.helm", description: "Self-hosted Helm chart download UI", defaultOn: false, rollout: 0 },
    { key: "agents.a20-onboarding", description: "Enable A20 Onboarding Whisperer in dashboard", defaultOn: true, rollout: 100 }
  ];
  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: { description: f.description, defaultOn: f.defaultOn, rollout: f.rollout },
      create: f
    });
    await prisma.featureFlagAssignment.upsert({
      where: { organizationId_flagKey: { organizationId: organization.id, flagKey: f.key } },
      update: { enabled: f.defaultOn },
      create: { organizationId: organization.id, flagKey: f.key, enabled: f.defaultOn }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
