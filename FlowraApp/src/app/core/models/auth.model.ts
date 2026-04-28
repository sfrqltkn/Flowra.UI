// 1. Kullanıcının Login formundan göndereceği veri (LoginCommandRequest)
export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginResponseDto {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  requiresPasswordReset: boolean;
  resetPasswordToken?: string | null;
}

export interface AuthResultDto {
  response: LoginResponseDto;
}

// 3. Angular UI tarafında Signal/BehaviorSubject içinde tutacağımız aktif kullanıcı
export interface UserState {
  userId: number;
  fullName: string;
  email: string;
  roles: string[];
}

export interface ResetPasswordRequest {
  userId: number;
  resetToken: string;
  newPassword: string;
  confirmNewPassword: string;
}
