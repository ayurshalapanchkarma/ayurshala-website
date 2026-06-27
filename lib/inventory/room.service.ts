import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export type RoomType = 'MASSAGE_ROOM' | 'STEAM_ROOM' | 'PROCEDURE_ROOM' | 'CONSULTATION_ROOM'

export interface CreateRoomInput {
  roomNumber: string
  roomType: RoomType
  capacity?: number
  remarks?: string
}

export class RoomService {
  /**
   * Create treatment room
   */
  static async createRoom(input: CreateRoomInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.roomNumber?.trim()) errors.push({ field: 'roomNumber', message: 'Room number required' })
    if (!input.roomType) errors.push({ field: 'roomType', message: 'Room type required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('treatment_rooms')
      .insert({
        room_number: input.roomNumber.trim().toUpperCase(),
        room_type: input.roomType,
        capacity: input.capacity || 1,
        remarks: input.remarks || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create room: ${error.message}`)
    return data
  }

  /**
   * Get all active rooms
   */
  static async getActiveRooms(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('treatment_rooms')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('room_number', { ascending: true })

    return data || []
  }

  /**
   * Get room by ID
   */
  static async getRoom(roomId: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('treatment_rooms')
      .select('*')
      .eq('id', roomId)
      .eq('is_deleted', false)
      .single()

    return data
  }

  /**
   * Update room
   */
  static async updateRoom(roomId: string, input: Partial<CreateRoomInput>): Promise<any> {
    const updateData: any = {}

    if (input.roomNumber) updateData.room_number = input.roomNumber.trim().toUpperCase()
    if (input.roomType) updateData.room_type = input.roomType
    if (input.capacity !== undefined) updateData.capacity = input.capacity
    if (input.remarks !== undefined) updateData.remarks = input.remarks

    const { data, error } = await supabaseAdmin
      .from('treatment_rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update room: ${error.message}`)
    return data
  }

  /**
   * Deactivate room
   */
  static async deactivateRoom(roomId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('treatment_rooms')
      .update({ is_active: false })
      .eq('id', roomId)
      .select()
      .single()

    if (error) throw new Error(`Failed to deactivate room: ${error.message}`)
    return data
  }

  /**
   * Get rooms by type
   */
  static async getRoomsByType(roomType: RoomType): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('treatment_rooms')
      .select('*')
      .eq('room_type', roomType)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('room_number', { ascending: true })

    return data || []
  }
}
