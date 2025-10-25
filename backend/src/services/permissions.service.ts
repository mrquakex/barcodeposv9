/**
 * Advanced RBAC/ABAC Permission System
 */

export interface Permission {
  resource: string; // e.g., 'products', 'sales', 'users'
  action: string;   // e.g., 'create', 'read', 'update', 'delete'
  conditions?: Record<string, any>; // ABAC conditions
}

export interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[]; // Role inheritance
}

class PermissionsService {
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.initializeRoles();
  }

  /**
   * Varsayılan roller ve izinler
   */
  private initializeRoles() {
    // Admin - Tüm yetkiler
    this.roles.set('admin', {
      name: 'admin',
      permissions: [
        { resource: '*', action: '*' }, // Wildcard - tüm yetkiler
      ],
    });

    // Manager - Yönetim yetkileri
    this.roles.set('manager', {
      name: 'manager',
      permissions: [
        { resource: 'products', action: '*' },
        { resource: 'categories', action: '*' },
        { resource: 'suppliers', action: '*' },
        { resource: 'customers', action: '*' },
        { resource: 'sales', action: 'read' },
        { resource: 'sales', action: 'create' },
        { resource: 'reports', action: 'read' },
        { resource: 'inventory', action: '*' },
        { resource: 'expenses', action: 'read' },
        { resource: 'campaigns', action: '*' },
      ],
    });

    // Cashier - Kasiyer yetkileri
    this.roles.set('cashier', {
      name: 'cashier',
      permissions: [
        { resource: 'products', action: 'read' },
        { resource: 'sales', action: 'create' },
        { resource: 'sales', action: 'read', conditions: { ownSalesOnly: true } },
        { resource: 'customers', action: 'read' },
        { resource: 'customers', action: 'create' },
      ],
    });

    // Accountant - Muhasebe
    this.roles.set('accountant', {
      name: 'accountant',
      permissions: [
        { resource: 'sales', action: 'read' },
        { resource: 'expenses', action: '*' },
        { resource: 'reports', action: 'read' },
        { resource: 'finance', action: '*' },
        { resource: 'suppliers', action: 'read' },
      ],
    });

    // Warehouse - Depo görevlisi
    this.roles.set('warehouse', {
      name: 'warehouse',
      permissions: [
        { resource: 'products', action: 'read' },
        { resource: 'products', action: 'update' },
        { resource: 'inventory', action: '*' },
        { resource: 'suppliers', action: 'read' },
        { resource: 'purchase-orders', action: '*' },
      ],
    });
  }

  /**
   * Kullanıcının izni var mı? (RBAC)
   */
  can(userRole: string, resource: string, action: string): boolean {
    const role = this.roles.get(userRole);
    if (!role) return false;

    return role.permissions.some(perm => {
      const resourceMatch = perm.resource === '*' || perm.resource === resource;
      const actionMatch = perm.action === '*' || perm.action === action;
      return resourceMatch && actionMatch;
    });
  }

  /**
   * Koşullu izin kontrolü (ABAC)
   */
  canWithConditions(
    userRole: string,
    userId: number,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    const role = this.roles.get(userRole);
    if (!role) return false;

    for (const perm of role.permissions) {
      const resourceMatch = perm.resource === '*' || perm.resource === resource;
      const actionMatch = perm.action === '*' || perm.action === action;

      if (resourceMatch && actionMatch) {
        // Koşul kontrolü
        if (perm.conditions) {
          // Örnek: Sadece kendi kayıtlarını görebilir
          if (perm.conditions.ownSalesOnly && context?.ownerId !== userId) {
            continue;
          }
          // Diğer koşullar buraya eklenebilir
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Kullanıcının tüm izinlerini getir
   */
  getPermissions(userRole: string): Permission[] {
    const role = this.roles.get(userRole);
    return role ? role.permissions : [];
  }

  /**
   * Yeni rol ekle
   */
  addRole(role: Role) {
    this.roles.set(role.name, role);
  }

  /**
   * Role izin ekle
   */
  addPermission(roleName: string, permission: Permission) {
    const role = this.roles.get(roleName);
    if (role) {
      role.permissions.push(permission);
    }
  }

  /**
   * Rolden izin çıkar
   */
  removePermission(roleName: string, resource: string, action: string) {
    const role = this.roles.get(roleName);
    if (role) {
      role.permissions = role.permissions.filter(
        p => !(p.resource === resource && p.action === action)
      );
    }
  }

  /**
   * Tüm rolleri listele
   */
  getAllRoles(): string[] {
    return Array.from(this.roles.keys());
  }
}

export const permissionsService = new PermissionsService();

