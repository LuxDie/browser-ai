# Mejores Prácticas para TypeScript

## 1. Configuración del tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 2. Tipos y Interfaces

**Preferir `interface` para objetos extensibles:**
```typescript
// ✅ Bueno
interface User {
  id: string;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// ✅ También bueno para tipos union
type Status = 'loading' | 'success' | 'error';
```

**Usar `const assertions` para inmutabilidad:**
```typescript
// ✅ Bueno
const themes = ['light', 'dark', 'auto'] as const;
type Theme = typeof themes[number]; // 'light' | 'dark' | 'auto'
```

## 3. Utility Types Modernos

**Usar utility types nativos:**
```typescript
// ✅ Bueno - Pick para seleccionar propiedades
type UserPreview = Pick<User, 'id' | 'name'>;

// ✅ Bueno - Omit para excluir propiedades
type CreateUser = Omit<User, 'id'>;

// ✅ Bueno - Partial para propiedades opcionales
type UpdateUser = Partial<User>;

// ✅ Bueno - Record para mapas
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;
```

## 4. Genéricos con Constrains

```typescript
// ✅ Bueno - Genéricos con restricciones
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ Bueno - Genéricos con valores por defecto
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}
```

## 5. Type Guards y Narrowing

```typescript
// ✅ Bueno - Type guards personalizados
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ✅ Bueno - Discriminated unions
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data);
  } else {
    console.error(result.error);
  }
}
```

## 6. Manejo de Arrays y Objetos

```typescript
// ✅ Bueno - Usar métodos inmutables
const addUser = (users: User[], newUser: User): User[] => [
  ...users,
  newUser
];

// ✅ Bueno - Usar optional chaining y nullish coalescing
const userName = user?.profile?.name ?? 'Usuario Anónimo';
```

## 7. Sintaxis Moderna

```typescript
// ✅ ES Modules (no CommonJS)
import { UserService } from './services/user';
export { UserController };

// ✅ async/await (no callbacks)
async function fetchUser(id: string): Promise<User> {
  return await userService.getById(id);
}

// ✅ Template literals (no concatenación)
const message = `Usuario ${user.name} creado exitosamente`;

// ✅ Unary plus para conversión numérica
const age = +ageString; // no Number(ageString)

// ✅ null para valores vacíos intencionales
let selectedUser: User | null = null; // no undefined
```

## 8. Constantes y Naming

```typescript
// ✅ SCREAMING_SNAKE_CASE para constantes globales
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// ✅ camelCase para otras constantes
const defaultUserPreferences = { theme: 'dark' };
```

## 9. Clases Modernas

```typescript
// ✅ Miembros privados con # y readonly cuando sea posible
class UserService {
  readonly #apiUrl = API_BASE_URL;
  #cache = new Map<string, User>();

  async getUser(id: string): Promise<User> {
    return this.#fetchFromCacheOrApi(id);
  }

  #fetchFromCacheOrApi(id: string): Promise<User> {
    // implementación privada
  }
}
```

## 10. Organización de Interfaces

```typescript
// ✅ Una interfaz por archivo (para interfaces complejas)
// user.interface.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// user-preferences.interface.ts  
export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}
```

## 11. Consideraciones sobre "unknown" vs Tipado Específico

```typescript
// ✅ unknown es mejor que any para entrada no tipada
function parseApiResponse(response: unknown): User {
  // Validación y type guards aquí
  if (isValidUserResponse(response)) {
    return response as User;
  }
  throw new Error('Invalid response');
}

// ✅ Pero siempre preferir tipos específicos cuando sea posible
function parseUserResponse(response: ApiResponse<User>): User {
  return response.data;
}
```

## 12. Patrones Anti-Patrones

### ❌ Evitar

```typescript
// ❌ Malo - any (nunca usar)
function processData(data: any) { }

// ❌ Malo - CommonJS
const fs = require('fs'); 

// ❌ Malo - callbacks
getUserData(id, (error, data) => { });

// ❌ Malo - concatenación de strings
const url = baseUrl + '/users/' + userId;
```

### ✅ Preferir

```typescript
// ✅ Bueno - tipos específicos o unknown con validación
function processData<T extends Record<string, unknown>>(data: T): T { return data; }

// ✅ Bueno - ES Modules
import fs from 'fs/promises';

// ✅ Bueno - async/await
const userData = await getUserData(id);

// ✅ Bueno - template literals
const url = `${baseUrl}/users/${userId}`;
```
