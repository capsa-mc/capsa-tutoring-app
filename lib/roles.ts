import { Role } from '@/types/database/schema'

// Define role hierarchy (higher index = higher level)
export const roleHierarchy: Role[] = [
  Role.Tutee,
  Role.Tutor,
  Role.Coordinator,
  Role.Staff,
  Role.Admin
]

/**
 * Check if a role is higher than another role
 * @param role1 The first role to compare
 * @param role2 The second role to compare
 * @returns true if role1 is higher than role2, false otherwise
 */
export function isRoleHigher(role1: Role | null, role2: Role | null): boolean {
  if (!role1) return false
  if (!role2) return true
  
  const role1Index = roleHierarchy.indexOf(role1)
  const role2Index = roleHierarchy.indexOf(role2)
  
  return role1Index > role2Index
}

/**
 * Get all roles lower than the specified role
 * @param role The role to get lower roles for
 * @returns Array of roles lower than the specified role
 */
export function getLowerRoles(role: Role | null): Role[] {
  if (!role) return []
  
  const roleIndex = roleHierarchy.indexOf(role)
  if (roleIndex === -1) return []
  
  return roleHierarchy.slice(0, roleIndex)
}

/**
 * Get the highest role a user can approve to
 * @param userRole The role of the user doing the approval
 * @returns The highest role that can be approved
 */
export function getHighestApprovableRole(userRole: Role | null): Role | null {
  if (!userRole) return null
  
  const userRoleIndex = roleHierarchy.indexOf(userRole)
  if (userRoleIndex <= 0) return null
  
  // User can approve up to one level below their own role
  return roleHierarchy[userRoleIndex - 1]
} 