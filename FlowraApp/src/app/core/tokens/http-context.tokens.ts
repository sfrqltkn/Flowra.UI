import { HttpContextToken } from '@angular/common/http';

// true ise: 401 durumunda refresh-token döngüsüne girme
export const IS_INITIAL_AUTH_CHECK = new HttpContextToken<boolean>(() => false);
