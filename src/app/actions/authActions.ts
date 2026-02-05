"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character (@, $, !, etc.)",
    ),
  secretCode: z.string().min(1, "Company Access Code is required"),
});

export async function registerUser(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    secretCode: formData.get("secretCode"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.issues[0].message;
    return { success: false, message: errorMessage };
  }

  const { name, email, password, secretCode } = validatedFields.data;

  if (secretCode !== process.env.REGISTRATION_SECRET) {
    return { success: false, message: "Invalid Company Access Code" };
  }

  await dbConnect();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: "Registration failed. Please try again later.",
    };
  }
}
