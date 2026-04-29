import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { ApiResponse } from "../../models/api-response.model";
import { UserDto } from "../../models/user.model";

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/users`;

  getAll(): Observable<ApiResponse<UserDto[]>> {
    return this.http.get<ApiResponse<UserDto[]>>(this.url);
  }

  setActive(id: number, isActive: boolean): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.url}/${id}/active-status`, { isActive });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}/delete`);
  }

  update(data: any): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.url}/${data.id}/update`, data);
  }
}
