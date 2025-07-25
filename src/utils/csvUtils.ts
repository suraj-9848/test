import { CreateUserRequest } from "@/api/adminApi";

export interface CSVUserData {
  username: string;
  email: string;
  org_id: string;
  role: string;
  batch_id?: string[];
}

export class CSVUtils {
  static parseCSV(csvText: string): CSVUserData[] {
    const lines = csvText.trim().split("\n");
    const users: CSVUserData[] = [];

    // Skip header if present
    const dataLines = lines[0].toLowerCase().includes("username")
      ? lines.slice(1)
      : lines;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const parts = line
        .split(",")
        .map((part) => part.trim().replace(/"/g, ""));

      if (parts.length >= 4) {
        const [username, email, org_id, role, ...batches] = parts;
        users.push({
          username,
          email,
          org_id,
          role,
          batch_id: batches.filter((b) => b.length > 0),
        });
      }
    }

    return users;
  }

  static validateCSVData(users: CSVUserData[]): {
    valid: CSVUserData[];
    invalid: { user: CSVUserData; errors: string[] }[];
  } {
    const valid: CSVUserData[] = [];
    const invalid: { user: CSVUserData; errors: string[] }[] = [];

    for (const user of users) {
      const errors: string[] = [];

      if (!user.username || user.username.length < 3) {
        errors.push("Username must be at least 3 characters");
      }

      if (!user.email || !this.isValidEmail(user.email)) {
        errors.push("Valid email is required");
      }

      if (!user.org_id) {
        errors.push("Organization ID is required");
      }

      if (!user.role) {
        errors.push("Role is required");
      }

      if (errors.length === 0) {
        valid.push(user);
      } else {
        invalid.push({ user, errors });
      }
    }

    return { valid, invalid };
  }

  static convertToCreateRequests(users: CSVUserData[]): CreateUserRequest[] {
    return users.map((user) => ({
      username: user.username,
      email: user.email,
      password: this.generateRandomPassword(),
      org_id: user.org_id,
      batch_id: user.batch_id || [],
    }));
  }

  static exportToCSV(users: Record<string, unknown>[]): string {
    const headers = [
      "Username",
      "Email",
      "Role",
      "College",
      "Status",
      "Join Date",
    ];
    const rows = users.map((user) => [
      user.name || user.username,
      user.email,
      user.role,
      user.college,
      user.status,
      user.joinDate,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  }

  static downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static generateSampleCSV(): string {
    const sample = [
      ["username", "email", "org_id", "role", "batch_id"],
      ["john_doe", "john@example.com", "org123", "student", "batch1"],
      ["jane_smith", "jane@example.com", "org123", "instructor", ""],
      ["admin_user", "admin@example.com", "org123", "admin", ""],
    ];

    return sample.map((row) => row.join(",")).join("\n");
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateRandomPassword(length: number = 12): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
