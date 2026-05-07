import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { RoleDto } from '../../models/role.model';
import { UserRoleRequest } from '../../models/userRole.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private rolesUrl = `${environment.apiUrl}/roles`;
  private userRolesUrl = `${environment.apiUrl}/userroles`;

  getAllRoles(): Observable<ApiResponse<RoleDto[]>> {
    return this.http.get<ApiResponse<RoleDto[]>>(this.rolesUrl);
  }

  getRoleById(id: number): Observable<ApiResponse<RoleDto>> {
    return this.http.get<ApiResponse<RoleDto>>(`${this.rolesUrl}/${id}`);
  }

  createRole(name: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.rolesUrl}/create`, { name });
  }

  updateRole(id: number, name: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.rolesUrl}/${id}/update`, { name });
  }

  deleteRole(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.rolesUrl}/${id}/delete`);
  }

  addRoleToUser(request: UserRoleRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.userRolesUrl}/add-role`, request);
  }

  removeRoleFromUser(request: UserRoleRequest): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.userRolesUrl}/remove-role`, { body: request });
  }
}
