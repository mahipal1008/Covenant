import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding, SourceFileInput } from "../index";

/**
 * A3 — Data Sensitivity Classifier.
 *
 * Scans Prisma schema + TS source for fields/identifiers that look like
 * personally identifiable information and flags any that ship without an
 * encryption helper or `@encrypted` marker. The classifier is heuristic,
 * not authoritative; it gives the dashboard a starting list of "suspect
 * PII columns" for the operator to confirm.
 */

const piiPatterns: Array<{ rx: RegExp; label: string; severity: "high" | "medium" }> = [
  { rx: /\b(ssn|socialSecurity|nationalId|passportNumber|driversLicense)\b/i, label: "government-id", severity: "high" },
  { rx: /\b(creditCard|cardNumber|cvv|cvc|iban|routingNumber|bankAccount)\b/i, label: "financial-pan", severity: "high" },
  { rx: /\b(dateOfBirth|dob|birthDate)\b/i, label: "date-of-birth", severity: "medium" },
  { rx: /\b(homeAddress|streetAddress|postalCode|zipCode)\b/i, label: "address", severity: "medium" },
  { rx: /\b(phoneNumber|mobileNumber)\b/i, label: "phone", severity: "medium" }
];

export const a3DataSensitivity: Agent<{ classified: number }> = {
  id: "A3",
  name: "Data Sensitivity Classifier",
  description: "Heuristically labels PII-like fields and flags missing encryption hints.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let classified = 0;

    for (const file of ctx.sourceFiles) {
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const p of piiPatterns) {
          if (!p.rx.test(line)) continue;
          if (/encrypt|hash|kms|vault|@sensitive|@encrypted/i.test(line)) continue;
          classified += 1;
          findings.push({
            id: `a3-${Buffer.from(`${file.path}:${idx}:${p.label}`).toString("hex").slice(0, 16)}`,
            ruleId: `data-sensitivity-${p.label}`,
            severity: p.severity,
            title: `Possible ${p.label} field stored in plaintext`,
            summary: `Identifier on this line matches a PII pattern but no encryption helper is referenced nearby.`,
            filePath: file.path,
            line: idx + 1,
            endpoint: "n/a",
            routeMethod: "n/a",
            evidence: line.trim().slice(0, 200),
            impact: "Plaintext storage of PII expands the blast radius of any data breach and complicates GDPR/CCPA compliance.",
            suggestedFix: "Wrap reads/writes in a KMS-backed encryption helper or mark the field with @encrypted in the schema.",
            exploitSteps: ["Compromise a single read-only DB credential", `Read the ${p.label} column in plaintext`]
          });
        }
      });
    }

    return { output: { classified }, findings };
  }
};

export type _A3SourceTypeAlias = SourceFileInput;
