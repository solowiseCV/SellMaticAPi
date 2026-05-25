export class AuthValidation {
  static register(body: any): {
    valid: boolean;
    errors: string[];
    data?: any;
  } {
    const errors: string[] = [];

    if (
      !body.businessName ||
      typeof body.businessName !== "string" ||
      !body.businessName.trim()
    ) {
      errors.push("Business name is required");
    }

    if (
      !body.ownerName ||
      typeof body.ownerName !== "string" ||
      !body.ownerName.trim()
    ) {
      errors.push("Owner name is required");
    }

    if (!body.ownerEmail) {
      errors.push("Owner email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.ownerEmail)) {
        errors.push("Invalid email format");
      }
    }

    if (!body.ownerPhone) {
      errors.push("Owner phone number is required");
    } else {
      const cleaned = body.ownerPhone.replace(/\s/g, "");
      const nigerianRegex = /^(\+?234|0)[789][01]\d{8}$/;
      if (!nigerianRegex.test(cleaned)) {
        errors.push("Invalid Nigerian phone number format");
      }
    }

    if (!body.password) {
      errors.push("Password is required");
    } else if (typeof body.password !== "string" || body.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (errors.length > 0) return { valid: false, errors };

    return {
      valid: true,
      errors: [],
      data: {
        businessName: body.businessName.trim(),
        ownerName: body.ownerName.trim(),
        ownerEmail: body.ownerEmail.trim().toLowerCase(),
        ownerPhone: body.ownerPhone.replace(/\s/g, ""),
        password: body.password,
      },
    };
  }

  static login(body: any): {
    valid: boolean;
    errors: string[];
    data?: any;
  } {
    const errors: string[] = [];

    if (!body.ownerEmail) {
      errors.push("Owner email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.ownerEmail)) {
        errors.push("Invalid email format");
      }
    }

    if (!body.password) {
      errors.push("Password is required");
    }

    if (errors.length > 0) return { valid: false, errors };

    return {
      valid: true,
      errors: [],
      data: {
        ownerEmail: body.ownerEmail.trim().toLowerCase(),
        password: body.password,
      },
    };
  }
}