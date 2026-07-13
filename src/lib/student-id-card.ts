import { API_BASE_URL } from "@/api/axios";
import type { StudentProfile, StudentRecord } from "@/types/api";

type IdCardFields = Pick<
  StudentProfile,
  "idCardUrl" | "idCard" | "idCardImage" | "studentIdCardUrl" | "verificationDocumentUrl"
>;

function rawIdCardUrl(source?: Partial<IdCardFields> | null) {
  return [
    source?.idCardUrl,
    source?.studentIdCardUrl,
    source?.verificationDocumentUrl,
    source?.idCardImage,
    source?.idCard,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function absoluteUrl(value: string) {
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, API_BASE_URL).toString();
}

export function studentIdCardUrl(student?: StudentRecord | StudentProfile | null) {
  const directUrl = rawIdCardUrl(student);
  if (directUrl) return absoluteUrl(directUrl);

  if (student && "studentProfile" in student) {
    const profileUrl = rawIdCardUrl(student.studentProfile);
    if (profileUrl) return absoluteUrl(profileUrl);
  }

  return null;
}
