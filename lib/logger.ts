export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string
  level: string
  component: string
  message: string
  metadata?: Record<string, any>
  requestId?: string
  userId?: string
  correlationId?: string
}

export class Logger {
  private component: string
  private minLevel: LogLevel

  constructor(component: string, minLevel = LogLevel.INFO) {
    this.component = component
    this.minLevel = minLevel
  }

  private format(level: LogLevel, levelName: string, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: levelName,
      component: this.component,
      message,
      metadata: this.sanitizeMetadata(metadata),
    }
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined

    const sanitized = { ...metadata }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'apiKey', 'privateKey']
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private output(entry: LogEntry): void {
    const isDev = process.env.NODE_ENV === 'development'
    const output = isDev ? JSON.stringify(entry, null, 2) : JSON.stringify(entry)

    // In production, use appropriate console method
    if (entry.level === 'ERROR' || entry.level === 'CRITICAL') {
      console.error(output)
    } else if (entry.level === 'WARNING') {
      console.warn(output)
    } else {
      console.log(output)
    }

    // TODO: In production, send to centralized logging (e.g., Datadog, Sentry, CloudWatch)
  }

  debug(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    const entry = this.format(LogLevel.DEBUG, 'DEBUG', message, metadata)
    entry.requestId = requestId
    this.output(entry)
  }

  info(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    const entry = this.format(LogLevel.INFO, 'INFO', message, metadata)
    entry.requestId = requestId
    this.output(entry)
  }

  warning(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog(LogLevel.WARNING)) return
    const entry = this.format(LogLevel.WARNING, 'WARNING', message, metadata)
    entry.requestId = requestId
    this.output(entry)
  }

  error(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return
    const entry = this.format(LogLevel.ERROR, 'ERROR', message, metadata)
    entry.requestId = requestId
    this.output(entry)
  }

  critical(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return
    const entry = this.format(LogLevel.CRITICAL, 'CRITICAL', message, metadata)
    entry.requestId = requestId
    this.output(entry)

    // In production, send critical alerts
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send alert (e.g., PagerDuty, SMS, etc.)
    }
  }

  // Security-specific logging
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>, userId?: string, requestId?: string): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : severity === 'high' ? LogLevel.ERROR : LogLevel.WARNING

    if (!this.shouldLog(level)) return

    const entry = this.format(level, severity.toUpperCase(), `SECURITY: ${event}`, metadata)
    entry.userId = userId
    entry.requestId = requestId
    this.output(entry)
  }

  // API request/response logging
  apiRequest(method: string, path: string, metadata?: Record<string, any>, requestId?: string): void {
    this.info(`API Request: ${method} ${path}`, metadata, requestId)
  }

  apiResponse(method: string, path: string, status: number, duration: number, requestId?: string): void {
    this.info(`API Response: ${method} ${path} ${status} (${duration}ms)`, { status, duration }, requestId)
  }

  // Database logging
  dbQuery(query: string, duration: number, rowsAffected?: number, requestId?: string): void {
    this.debug(`DB Query: ${duration}ms` + (rowsAffected !== undefined ? ` (${rowsAffected} rows)` : ''), { query, duration, rowsAffected }, requestId)
  }

  dbError(error: Error, query?: string, requestId?: string): void {
    this.error(`DB Error: ${error.message}`, { error: error.message, query }, requestId)
  }
}

// Create singleton instances for common components
export const apiLogger = new Logger('API')
export const authLogger = new Logger('Auth')
export const dbLogger = new Logger('Database')
export const securityLogger = new Logger('Security')
export const inventoryLogger = new Logger('Inventory')
export const financeLogger = new Logger('Finance')
export const crmLogger = new Logger('CRM')
