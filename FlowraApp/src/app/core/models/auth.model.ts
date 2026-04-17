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

// 2. Login sonrası Backend'den dönen veri (AuthResultDto)
export interface AuthResultDto {
  userId: number;
  email: string;
  username: string;
  fullName: string;
  roles: string[];

  requiresPasswordReset: boolean;
  resetPasswordToken?: string;

  // Bunları TS tarafında kullanmayacağız (Cookie'de kalacak) ama
  // tip güvenliği ve DTO bütünlüğü için burada tanımlı olmaları iyidir.
  accessToken?: string;
  accessTokenExpiresAtUtc?: string;
  refreshToken?: string;
  refreshTokenExpiresAtUtc?: string;
}

// 3. Angular UI tarafında Signal/BehaviorSubject içinde tutacağımız aktif kullanıcı
export interface UserState {
  userId: number;
  fullName: string;
  email: string;
  roles: string[];
}
