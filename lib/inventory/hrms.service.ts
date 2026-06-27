import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'EARLY_EXIT' | 'LEAVE'
export type LeaveStatus = 'APPLIED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface CreateEmployeeInput {
  employeeId: string
  name: string
  joiningDate: string
  email?: string
  phone?: string
  departmentId?: string
  designation?: string
  managerId?: string
}

export interface LogAttendanceInput {
  employeeId: string
  attendanceDate: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  overtimeHours?: number
}

export interface ApplyLeaveInput {
  employeeId: string
  leaveTypeId: string
  fromDate: string
  toDate: string
  reason?: string
}

export interface GeneratePayrollInput {
  payrollMonth: string
  employeeIds: string[]
}

export class HRMSService {
  /**
   * Create employee
   */
  static async createEmployee(input: CreateEmployeeInput, userId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.employeeId?.trim()) errors.push({ field: 'employeeId', message: 'Employee ID required' })
    if (!input.name?.trim()) errors.push({ field: 'name', message: 'Name required' })
    if (!input.joiningDate) errors.push({ field: 'joiningDate', message: 'Joining date required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data: emp, error: empError } = await supabaseAdmin
      .from('employees')
      .insert({
        employee_id: input.employeeId,
        name: input.name,
        joining_date: input.joiningDate,
        email: input.email || null,
        phone: input.phone || null,
      })
      .select()
      .single()

    if (empError) throw new Error(`Failed to create employee: ${empError.message}`)

    // Add department mapping
    if (input.departmentId) {
      await supabaseAdmin.from('employee_departments').insert({
        employee_id: emp.id,
        department_id: input.departmentId,
        designation: input.designation || null,
        manager_id: input.managerId || null,
        from_date: input.joiningDate,
        is_current: true,
      })
    }

    return emp
  }

  /**
   * Get employee
   */
  static async getEmployee(employeeId: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('is_deleted', false)
      .single()

    return data
  }

  /**
   * Get all active employees
   */
  static async getActiveEmployees(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('status', 'ACTIVE')
      .eq('is_deleted', false)
      .order('name', { ascending: true })

    return data || []
  }

  /**
   * Log attendance
   */
  static async logAttendance(input: LogAttendanceInput): Promise<any> {
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('employee_id', input.employeeId)
      .eq('attendance_date', input.attendanceDate)
      .single()

    if (existing) {
      const { data } = await supabaseAdmin
        .from('attendance')
        .update({
          status: input.status,
          check_in_time: input.checkInTime || null,
          check_out_time: input.checkOutTime || null,
          overtime_hours: input.overtimeHours || null,
        })
        .eq('id', existing.id)
        .select()
        .single()

      return data
    }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        employee_id: input.employeeId,
        attendance_date: input.attendanceDate,
        status: input.status,
        check_in_time: input.checkInTime || null,
        check_out_time: input.checkOutTime || null,
        overtime_hours: input.overtimeHours || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to log attendance: ${error.message}`)
    return data
  }

  /**
   * Get attendance
   */
  static async getAttendance(employeeId: string, fromDate: string, toDate: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('attendance_date', fromDate)
      .lte('attendance_date', toDate)
      .order('attendance_date', { ascending: true })

    return data || []
  }

  /**
   * Apply leave
   */
  static async applyLeave(input: ApplyLeaveInput): Promise<any> {
    const fromDate = new Date(input.fromDate)
    const toDate = new Date(input.toDate)
    const daysCount = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24) + 1

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert({
        employee_id: input.employeeId,
        leave_type_id: input.leaveTypeId,
        from_date: input.fromDate,
        to_date: input.toDate,
        days_count: daysCount,
        reason: input.reason || null,
        status: 'APPLIED',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to apply leave: ${error.message}`)
    return data
  }

  /**
   * Get pending leave requests
   */
  static async getPendingLeaves(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('leave_requests')
      .select('*, employees(name), leave_types(leave_type_name)')
      .eq('status', 'APPLIED')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    return data || []
  }

  /**
   * Approve leave
   */
  static async approveLeave(leaveRequestId: string, approverId: string): Promise<any> {
    const { data: leave } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .single()

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status: 'APPROVED',
        approved_by: approverId,
        approval_date: new Date(),
      })
      .eq('id', leaveRequestId)
      .select()
      .single()

    if (error) throw new Error(`Failed to approve leave: ${error.message}`)

    // Update leave balance
    const year = new Date(leave.from_date).getFullYear()
    await supabaseAdmin
      .from('leave_balances')
      .update({
        used: (leave.days_count || 0),
        closing_balance: supabaseAdmin.rpc('decrement_leave_balance', {
          employee_id: leave.employee_id,
          leave_type_id: leave.leave_type_id,
          year,
          days: leave.days_count,
        }),
      })
      .eq('employee_id', leave.employee_id)
      .eq('leave_type_id', leave.leave_type_id)
      .eq('year', year)

    return data
  }

  /**
   * Get HR dashboard
   */
  static async getHRDashboard(): Promise<any> {
    const today = new Date().toISOString().split('T')[0]

    // Total employees
    const { data: allEmployees } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('status', 'ACTIVE')

    // Present today
    const { data: presentToday } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('attendance_date', today)
      .eq('status', 'PRESENT')

    // Absent today
    const { data: absentToday } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('attendance_date', today)
      .eq('status', 'ABSENT')

    // On leave today
    const { data: onLeave } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .eq('status', 'APPROVED')
      .lte('from_date', today)
      .gte('to_date', today)

    // Pending payroll
    const { data: pendingPayroll } = await supabaseAdmin
      .from('payroll')
      .select('id')
      .eq('status', 'DRAFT')

    return {
      totalEmployees: allEmployees?.length || 0,
      presentToday: presentToday?.length || 0,
      absentToday: absentToday?.length || 0,
      onLeaveToday: onLeave?.length || 0,
      pendingPayroll: pendingPayroll?.length || 0,
    }
  }

  /**
   * Generate payroll
   */
  static async generatePayroll(payrollMonth: string, employeeIds: string[]): Promise<any[]> {
    const payrolls = []

    for (const empId of employeeIds) {
      // Get salary structure
      const { data: salary } = await supabaseAdmin
        .from('salary_structures')
        .select('*')
        .eq('employee_id', empId)
        .eq('is_current', true)
        .single()

      if (!salary) continue

      const grossSalary =
        (salary.base_salary || 0) +
        (salary.hra || 0) +
        (salary.dearness_allowance || 0) +
        (salary.medical_allowance || 0) +
        (salary.other_allowances || 0)

      const pf = (grossSalary * (salary.pf_percentage || 0)) / 100
      const esi = (grossSalary * (salary.esi_percentage || 0)) / 100
      const netSalary = grossSalary - pf - esi

      const { data: payroll } = await supabaseAdmin
        .from('payroll')
        .insert({
          payroll_month: payrollMonth,
          employee_id: empId,
          gross_salary: grossSalary,
          net_salary: netSalary,
          status: 'DRAFT',
        })
        .select()
        .single()

      // Add payroll items
      const items = [
        { item_type: 'SALARY', item_name: 'Base Salary', amount: salary.base_salary, is_deduction: false },
        { item_type: 'ALLOWANCE', item_name: 'HRA', amount: salary.hra, is_deduction: false },
        { item_type: 'ALLOWANCE', item_name: 'DA', amount: salary.dearness_allowance, is_deduction: false },
        { item_type: 'ALLOWANCE', item_name: 'Medical', amount: salary.medical_allowance, is_deduction: false },
        { item_type: 'DEDUCTION', item_name: 'PF', amount: pf, is_deduction: true },
        { item_type: 'DEDUCTION', item_name: 'ESI', amount: esi, is_deduction: true },
      ]

      for (const item of items) {
        if (item.amount > 0) {
          await supabaseAdmin.from('payroll_items').insert({
            payroll_id: payroll.id,
            item_type: item.item_type,
            item_name: item.item_name,
            amount: item.amount,
            is_deduction: item.is_deduction,
          })
        }
      }

      payrolls.push(payroll)
    }

    return payrolls
  }

  /**
   * Get leave balance
   */
  static async getLeaveBalance(employeeId: string, year: number): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('leave_balances')
      .select('*, leave_types(leave_type_name)')
      .eq('employee_id', employeeId)
      .eq('year', year)

    return data || []
  }
}
