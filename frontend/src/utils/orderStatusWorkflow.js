/**
 * Allowed order status transitions — must match backend OrderService.validateOrderStatusTransition.
 */
export function getAllowedNextOrderStatuses(current) {
  switch (current) {
    case 'PENDING':
      return ['PAID', 'PROCESSING', 'CANCELLED'];
    case 'PAID':
      return ['PROCESSING', 'SHIPPED', 'CANCELLED'];
    case 'PROCESSING':
      return ['SHIPPED', 'CANCELLED'];
    case 'SHIPPED':
      return ['DELIVERED', 'CANCELLED'];
    case 'DELIVERED':
      return ['REFUNDED'];
    case 'CANCELLED':
    case 'REFUNDED':
    default:
      return [];
  }
}
