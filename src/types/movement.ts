export enum MovementType {
  SALE_OFFLINE = 'SALE_OFFLINE',
  CANCEL_SALE = 'CANCEL_SALE',
  RETURN = 'RETURN',
  LOSS = 'LOSS',
  ADJUSTMENT = 'ADJUSTMENT',
}

export const MOVEMENT_TYPE_LABELS = {
  [MovementType.SALE_OFFLINE]: 'Vente',
  [MovementType.CANCEL_SALE]: 'Annulation',
  [MovementType.RETURN]: 'Retour',
  [MovementType.LOSS]: 'Perte',
  [MovementType.ADJUSTMENT]: 'Ajustement',
} as const

export const MOVEMENT_TYPE_COLORS = {
  [MovementType.SALE_OFFLINE]: 'bg-red-100 text-red-800',
  [MovementType.CANCEL_SALE]: 'bg-yellow-100 text-yellow-800',
  [MovementType.RETURN]: 'bg-green-100 text-green-800',
  [MovementType.LOSS]: 'bg-gray-100 text-gray-800',
  [MovementType.ADJUSTMENT]: 'bg-blue-100 text-blue-800',
} as const
